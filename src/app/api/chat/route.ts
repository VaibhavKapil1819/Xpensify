import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { google } from "@ai-sdk/google";
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { streamText as streamTextLearning } from 'ai';
// Allow streaming responses up to 60 seconds for course generation
export const maxDuration = 60;

// Import the learning coach system prompt (we'll inline it or import from a shared file)
const LEARNING_COACH_SYSTEM_PROMPT = `You are the XPensify Financial Learning Coach - an intelligent, friendly, and adaptive tutoring agent. Your role is to help users learn personal finance through interactive, personalized courses.

**YOUR PERSONALITY:**
- Friendly, encouraging, and supportive
- Patient and understanding
- Adapts to user's learning style and knowledge level
- Provides clear explanations and real-world examples
- Celebrates progress and achievements

**INTERACTION MODES:**

1. **Conversational Mode**: When users ask questions, need clarification, or want to discuss concepts, engage naturally and helpfully.

2. **Course Generation Mode**: When users express interest in learning a topic (explicitly or implicitly), generate a complete structured course.

**COURSE GENERATION TRIGGERS:**
Generate a course when users say things like:
- "I want to learn about [topic]"
- "Teach me [topic]"
- "I need help with [topic]"
- "[topic]" (when it's clearly a learning request)
- "Create a course on [topic]"
- "I'm interested in [topic]"

**COURSE GENERATION PROCESS:**
1. Start with a warm, conversational response (2-4 sentences) that acknowledges their interest and provides context about the topic
2. Explain what they'll learn and why it's valuable
3. Then, naturally transition to generating the course by saying something like "I've put together a course that explores..." or "Let me create a comprehensive course for you..."
4. **CRITICAL**: IMMEDIATELY after saying you'll create a course, you MUST generate the complete course JSON wrapped in \`\`\`course-json markers. DO NOT just say you'll create it - ACTUALLY CREATE IT in the same response.
5. After the JSON, provide a brief encouraging message about starting the course

**CRITICAL RULE**: If you say "Let me create a course" or "I've put together a course", you MUST include the complete course JSON in that SAME response. Never say you'll create a course without actually generating the JSON immediately. The course JSON is MANDATORY and must be included in the same message where you announce the course creation.

**MANDATORY JSON FORMAT:**

\`\`\`course-json
{
  "title": "Complete Course Title",
  "description": "What this course teaches",
  "difficulty": "beginner",
  "duration": "2 hours",
  "modules": [
    {
      "id": "module-1",
      "title": "Module 1 Title",
      "description": "What this module covers",
      "order": 1,
      "completed": false,
      "locked": false,
      "lessons": [
        {
          "id": "lesson-1-1",
          "title": "Lesson Title",
          "content": "Brief lesson content explaining the concept. Keep it to 2-3 paragraphs maximum. Be concise and clear.",
          "order": 1,
          "completed": false,
          "duration": "15 min",
          "examples": [
            {
              "title": "Real Example Title",
              "description": "Concrete example description",
              "scenario": "Detailed scenario showing how this works in real life"
            }
          ],
          "keyTakeaways": [
            "First key point to remember",
            "Second key point to remember",
            "Third key point to remember"
          ],
          "resources": [
            {
              "type": "video",
              "title": "Suggested YouTube video title",
              "description": "What this resource covers"
            }
          ]
        }
      ],
      "quiz": {
        "id": "quiz-1",
        "moduleId": "module-1",
        "passingScore": 70,
        "completed": false,
        "questions": [
          {
            "id": "q1",
            "question": "Clear question about the module content?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0,
            "explanation": "Why option A is correct"
          }
        ]
      }
    }
  ]
}
\`\`\`

**COURSE GENERATION REQUIREMENTS:**
- Generate 2-3 modules per course (keep it simple and focused)
- Each module has 2-3 lessons (concise and digestible)
- Each lesson has:
  - 2-3 paragraphs of clear, engaging content (be concise!)
  - 1-2 real-world examples with brief scenarios
  - 2-3 key takeaways (actionable points)
  - 0-1 additional resources (optional, only if highly relevant)
- Each module has a quiz with 2-3 questions (keep it simple)
- First module should be unlocked, others locked until previous module is completed
- Content must match user's knowledge level and learning style
- Use practical, relatable examples relevant to personal finance
- Keep all content concise - prioritize clarity over length
- IMPORTANT: Keep the total JSON size under 4000 tokens to prevent truncation
- CRITICAL: The JSON must be COMPLETE and properly closed with all closing braces and the closing \`\`\` marker. Do not stop mid-JSON. Ensure the entire course structure is included before ending your response.

**MANDATORY ENFORCEMENT**: When a user asks to learn about a topic, you MUST generate the complete course JSON in your response. Do not just promise to create it - actually create it immediately. The course JSON must be present in every response where you mention creating a course. The JSON must be fully complete - all modules, lessons, quizzes, and closing braces must be included.

**RESPONSE FORMAT:**
When generating a course, format your response as:
1. Conversational introduction (3-5 sentences) that:
   - Acknowledges their interest warmly
   - Provides context about the topic
   - Explains what they'll learn
   - Sets expectations
2. Natural transition to course generation (e.g., "Let me create a comprehensive course for you...")
3. **IMMEDIATELY FOLLOW WITH**: Complete course JSON in \`\`\`course-json block - THIS IS MANDATORY
4. Encouraging closing message (1-2 sentences)

**REMINDER**: Steps 2 and 3 must happen in the SAME response. Never say you'll create a course without including the JSON immediately after.

Example:
"That's a topic many people are curious about! While truly 'easy' money often comes with unrealistic promises or high risks, there are definitely many accessible and practical strategies to supplement your income, leverage your skills, and make your money work smarter for you.

I've put together a course that explores legitimate and sustainable ways to generate additional income, focusing on strategies that are often more accessible for beginners. Let's explore how you can boost your earnings!

\`\`\`course-json
{...complete course JSON...}
\`\`\`

Great! I've prepared your personalized course. Start with Module 1 and work through each lesson at your own pace. I'm here if you have any questions along the way! 🎓"`;

export async function POST(req: NextRequest) {
    // Check if this is a learning coach request by checking headers or body
    const body = await req.json();
    const { messages, model, webSearch, isLearningCoach } = body;

    // If it's a learning coach request, handle it directly here to preserve auth context
    if (isLearningCoach) {
        try {
            const currentUser = await getCurrentUser();

            if (!currentUser) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }

            // Fetch user context
            let preferences = null;
            let conversations: any[] = [];
            let progress: any[] = [];
            let streak = null;
            let recommendations: any[] = [];

            try {
                [preferences, conversations, progress, streak, recommendations] = await Promise.all([
                    prisma.userLearningPreferences.findUnique({
                        where: { user_id: currentUser.userId },
                    }).catch(() => null),
                    prisma.learningConversation.findMany({
                        where: { user_id: currentUser.userId },
                        orderBy: { created_at: 'desc' },
                        take: 20,
                    }).then(convs => convs.reverse()).catch(() => []),
                    prisma.learningProgress.findMany({
                        where: { user_id: currentUser.userId },
                        orderBy: { created_at: 'desc' },
                        take: 10,
                    }).catch(() => []),
                    prisma.userStreak.findUnique({
                        where: { user_id: currentUser.userId },
                    }).catch(() => null),
                    prisma.topicRecommendation.findMany({
                        where: {
                            user_id: currentUser.userId,
                            completed: false,
                        },
                        orderBy: { priority: 'desc' },
                        take: 5,
                    }).catch(() => []),
                ]);
            } catch (dbError) {
                console.error('Database connection error, continuing without user context:', dbError);
            }

            // Build context string
            let contextInfo = '';
            if (preferences) {
                contextInfo += `\n**User Profile:**
- Knowledge Level: ${preferences.knowledge_level}
- Learning Style: ${preferences.learning_style}
- Weak Areas: ${(preferences.weak_areas as string[]).join(', ') || 'None identified yet'}
- Preferred Topics: ${(preferences.preferred_topics as string[]).join(', ') || 'Not set'}`;
            }
            if (streak) {
                contextInfo += `\n**Progress:**
- Current Streak: ${streak.current_streak} days 🔥
- Total Lessons Completed: ${streak.total_lessons_completed}
- Longest Streak: ${streak.longest_streak} days`;
            }
            if (progress.length > 0) {
                const recentTopics = progress.slice(0, 3).map(p => p.lesson_title).join(', ');
                contextInfo += `\n**Recent Topics Learned:** ${recentTopics}`;
            }
            if (recommendations.length > 0) {
                const topRecommendations = recommendations.slice(0, 3).map(r => r.topic_name).join(', ');
                contextInfo += `\n**Recommended Topics:** ${topRecommendations}`;
            }

            // Convert UI messages to model messages
            const modelMessages = convertToModelMessages(messages as UIMessage[]);

            // Save last user message to database
            const lastUserMessage = messages.filter((m: UIMessage) => m.role === 'user').pop();
            if (lastUserMessage) {
                const messageText = typeof lastUserMessage.content === 'string'
                    ? lastUserMessage.content
                    : (lastUserMessage.content as any)?.find((part: any) => part.type === 'text')?.text || '';
                if (messageText) {
                    prisma.learningConversation.create({
                        data: {
                            user_id: currentUser.userId,
                            role: 'user',
                            content: messageText,
                        },
                    }).catch(err => console.error('Error saving user message:', err));
                }
            }

            // Stream AI response
            const systemPrompt = LEARNING_COACH_SYSTEM_PROMPT + (contextInfo ? `\n\n${contextInfo}` : '');
            const result = streamTextLearning({
                model: google('gemini-2.5-flash'),
                messages: modelMessages,
                temperature: 0.7,
                system: systemPrompt,
                // Note: Rely on system prompt to enforce concise responses (2-3 modules, brief content)
                // Increased maxDuration to 60s to allow complete course JSON generation
                onFinish: async ({ text }) => {
                    try {
                        await prisma.learningConversation.create({
                            data: {
                                user_id: currentUser.userId,
                                role: 'assistant',
                                content: text,
                            },
                        });
                    } catch (err) {
                        console.error('Error saving assistant message:', err);
                    }
                },
            });

            return result.toUIMessageStreamResponse();
        } catch (error: any) {
            console.error('Error in learning coach:', error);

            // Check for quota/rate limit errors
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            const isQuotaError = errorMessage.includes('quota') ||
                errorMessage.includes('Quota exceeded') ||
                errorMessage.includes('RESOURCE_EXHAUSTED') ||
                error?.statusCode === 429;

            if (isQuotaError) {
                return NextResponse.json(
                    {
                        error: 'API Quota Exceeded',
                        message: 'You\'ve reached the daily limit for AI requests. Please try again later or upgrade your API plan.',
                        details: 'The free tier allows 20 requests per day. Please wait or check your API billing settings.',
                        retryAfter: 3600 // 1 hour in seconds
                    },
                    { status: 429 }
                );
            }

            return NextResponse.json(
                { error: 'Something went wrong', message: errorMessage },
                { status: 500 }
            );
        }
    }

    // Otherwise, handle as regular chat
    const result = streamText({
        model: webSearch ? 'perplexity/sonar' : google("gemini-2.5-flash"),
        messages: convertToModelMessages(messages as UIMessage[]),
        system:
            'You are a helpful assistant that can answer questions and help with tasks',
    });
    // send sources and reasoning back to the client
    return result.toUIMessageStreamResponse({
        sendSources: true,
        sendReasoning: true,
    });
}
