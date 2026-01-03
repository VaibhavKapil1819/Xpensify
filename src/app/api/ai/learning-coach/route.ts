// app/api/ai/learning-coach/route.ts
import { NextRequest, NextResponse } from "next/server";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const SYSTEM_PROMPT = `You are the XPensify Financial Learning Coach - an intelligent, friendly, and adaptive tutoring agent. Your role is to help users learn personal finance through interactive, personalized courses.

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

**EXAMPLE INTERACTION:**

User: "I want to learn about budgeting. I'm a beginner and prefer simple explanations."

You: [Generate FULL course JSON immediately - no chatting!]

\`\`\`course-json
{
  "title": "Budgeting Basics for Beginners",
  "description": "Learn how to create and manage a personal budget",
  "difficulty": "beginner",
  ...
}
\`\`\`

**CONTENT QUALITY STANDARDS:**
- Use clear, accessible language (adjust complexity based on user level)
- Include step-by-step instructions where applicable
- Provide actionable advice users can implement immediately
- Use relatable scenarios (e.g., "Imagine you're planning a vacation...")
- Connect concepts to real financial outcomes
- Include common mistakes to avoid
- Make content engaging and motivating

**QUIZ REQUIREMENTS:**
- Questions should test understanding, not just memorization
- Include application-based questions (scenarios)
- Provide clear explanations for each answer
- Difficulty should match the module content
- Passing score: 70% (adjustable based on difficulty)

**DO:**
- Be conversational and friendly when appropriate
- Generate SIMPLE, CONCISE courses (2-3 modules max)
- Keep lesson content brief (2-3 paragraphs max per lesson)
- Adapt content to user's learning style (simple, detailed, examples-based, etc.)
- Include 1-2 relevant examples (keep them brief)
- Make courses focused and digestible
- Keep JSON size small to prevent truncation
- Celebrate when users complete lessons

**DO NOT:**
- Generate courses with more than 3 modules
- Write long paragraphs (keep content concise)
- Include too many examples (1-2 is enough)
- Add unnecessary resources
- Create overly complex quiz questions
- Generate incomplete or rushed courses
- Use overly technical jargon without explanation
- Make the JSON too large (aim for under 4000 tokens total)

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

// Allow streaming responses up to 60 seconds for course generation
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Support both old format (message) and new format (messages from useChat)
    const body = await req.json();
    const { message, messages: uiMessages, include_history = true } = body;

    // If using new format with messages array, use that; otherwise fall back to old format
    let messages: any[] = [];

    if (uiMessages && Array.isArray(uiMessages)) {
      // New format: messages from useChat hook
      messages = convertToModelMessages(uiMessages as UIMessage[]);
    } else if (message) {
      // Old format: single message (for backward compatibility)
      // We'll build messages array below
    } else {
      return NextResponse.json(
        { error: "Message or messages is required" },
        { status: 400 }
      );
    }

    // Fetch user context with error handling
    let preferences = null;
    let conversations: any[] = [];
    let progress: any[] = [];
    let streak = null;
    let recommendations: any[] = [];

    try {
      [preferences, conversations, progress, streak, recommendations] =
        await Promise.all([
          prisma.userLearningPreferences
            .findUnique({
              where: { user_id: currentUser.userId },
            })
            .catch(() => null),
          include_history
            ? prisma.learningConversation
                .findMany({
                  where: { user_id: currentUser.userId },
                  orderBy: { created_at: "desc" },
                  take: 20, // Last 20 messages for context
                })
                .then((convs) => convs.reverse())
                .catch(() => []) // Chronological order
            : Promise.resolve([]),
          prisma.learningProgress
            .findMany({
              where: { user_id: currentUser.userId },
              orderBy: { created_at: "desc" },
              take: 10,
            })
            .catch(() => []),
          prisma.userStreak
            .findUnique({
              where: { user_id: currentUser.userId },
            })
            .catch(() => null),
          prisma.topicRecommendation
            .findMany({
              where: {
                user_id: currentUser.userId,
                completed: false,
              },
              orderBy: { priority: "desc" },
              take: 5,
            })
            .catch(() => []),
        ]);
    } catch (dbError) {
      console.error(
        "Database connection error, continuing without user context:",
        dbError
      );
      // Continue with default values
    }

    // Build context string
    let contextInfo = "";

    if (preferences) {
      contextInfo += `\n**User Profile:**
- Knowledge Level: ${preferences.knowledge_level}
- Learning Style: ${preferences.learning_style}
- Weak Areas: ${
        (preferences.weak_areas as string[]).join(", ") || "None identified yet"
      }
- Preferred Topics: ${
        (preferences.preferred_topics as string[]).join(", ") || "Not set"
      }`;
    }

    if (streak) {
      contextInfo += `\n**Progress:**
- Current Streak: ${streak.current_streak} days 🔥
- Total Lessons Completed: ${streak.total_lessons_completed}
- Longest Streak: ${streak.longest_streak} days`;
    }

    if (progress.length > 0) {
      const recentTopics = progress
        .slice(0, 3)
        .map((p) => p.lesson_title)
        .join(", ");
      contextInfo += `\n**Recent Topics Learned:** ${recentTopics}`;
    }

    if (recommendations.length > 0) {
      const topRecommendations = recommendations
        .slice(0, 3)
        .map((r) => r.topic_name)
        .join(", ");
      contextInfo += `\n**Recommended Topics:** ${topRecommendations}`;
    }

    // Build messages array for AI
    // If we have UI messages, use converted messages; otherwise build from scratch
    if (uiMessages && Array.isArray(uiMessages)) {
      // New format: use converted messages (system will be passed separately)
      messages = convertToModelMessages(uiMessages as UIMessage[]);

      // Save last user message to database
      const lastUserMessage = uiMessages
        .filter((m: UIMessage) => m.role === "user")
        .pop();
      if (lastUserMessage) {
        const messageText =
          typeof lastUserMessage.content === "string"
            ? lastUserMessage.content
            : lastUserMessage.content?.find((part: any) => part.type === "text")
                ?.text || "";
        if (messageText) {
          prisma.learningConversation
            .create({
              data: {
                user_id: currentUser.userId,
                role: "user",
                content: messageText,
              },
            })
            .catch((err) => console.error("Error saving user message:", err));
        }
      }
    } else {
      // Old format: build messages array from scratch
      messages = [
        {
          role: "system",
          content: SYSTEM_PROMPT + (contextInfo ? `\n\n${contextInfo}` : ""),
        },
      ];

      // Add conversation history
      if (conversations.length > 0) {
        conversations.forEach((conv) => {
          messages.push({
            role: conv.role,
            content: conv.content,
          });
        });
      }

      // Add current user message
      messages.push({
        role: "user",
        content: message,
      });

      // Save user message to database (don't await to not block streaming)
      prisma.learningConversation
        .create({
          data: {
            user_id: currentUser.userId,
            role: "user",
            content: message,
          },
        })
        .catch((err) => console.error("Error saving user message:", err));
    }

    // Stream AI response
    const systemPrompt =
      SYSTEM_PROMPT + (contextInfo ? `\n\n${contextInfo}` : "");
    const result = streamText({
      model: google("gemini-2.5-flash"),
      messages,
      temperature: 0.7,
      system: systemPrompt,
      // Increased maxDuration to 60s to allow complete course JSON generation
      onFinish: async ({ text }) => {
        // Save assistant response to database
        try {
          await prisma.learningConversation.create({
            data: {
              user_id: currentUser.userId,
              role: "assistant",
              content: text,
            },
          });
        } catch (err) {
          console.error("Error saving assistant message:", err);
        }
      },
    });

    // Use UIMessageStreamResponse for better streaming experience
    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("Error in learning coach:", error);

    // Check for quota/rate limit errors
    const errorMessage = error?.message || error?.toString() || "Unknown error";
    const isQuotaError =
      errorMessage.includes("quota") ||
      errorMessage.includes("Quota exceeded") ||
      errorMessage.includes("RESOURCE_EXHAUSTED") ||
      error?.statusCode === 429 ||
      error?.cause?.statusCode === 429;

    if (isQuotaError) {
      return NextResponse.json(
        {
          error: "API Quota Exceeded",
          message:
            "You've reached the daily limit for AI requests. Please try again later or upgrade your API plan.",
          details:
            "The free tier allows 20 requests per day. Please wait or check your API billing settings.",
          retryAfter: 3600, // 1 hour in seconds
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong", message: errorMessage },
      { status: 500 }
    );
  }
}
