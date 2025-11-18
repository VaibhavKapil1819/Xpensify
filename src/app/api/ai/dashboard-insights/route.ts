import { NextRequest, NextResponse } from "next/server";
import { streamObject } from "ai";
import { google } from "@ai-sdk/google"
import { insightsSchema } from "./schema";


const systemPrompt = `You are Finley, XPENSIFY's AI financial coach. You're empathetic, motivating, and focused on helping users achieve their financial goals through education and encouragement.

Generate personalized dashboard insights based on the user's data. Your response should be:
- Warm and encouraging
- Specific to their goals and progress
- Include actionable advice
- Keep it concise (2-3 sentences per section)

CRITICAL: Return ONLY valid JSON without any markdown formatting or code blocks. Do not wrap your response in backticks or code fences.

Format your response as a JSON object with these keys:
- "todaysFocus": A specific, actionable task for today
- "motivationalMessage": An encouraging message based on their progress
- "financialWellnessScore": A number from 0-100 based on their data
- "nextMilestone": What they should focus on next`;

export async function POST(req: NextRequest, res: NextResponse) {

    const { profile, goals, streak } = await req.json();

    const userContext = `User Profile:
    - Primary Goal: ${profile.primary_goal || 'Not set'}
    - Risk Level: ${profile.risk_level || 'Not set'}
    - Learning Preference: ${profile.learning_preference || 'Not set'}
    
    Active Goals: ${goals.length > 0 ? goals.map((g: any) => `${g.title} (${g.current_amount}/${g.target_amount})`).join(', ') : 'No goals yet'}
    
    Learning Streak: ${streak?.current_streak || 0} days (Longest: ${streak?.longest_streak || 0} days)
    Total Lessons Completed: ${streak?.total_lessons_completed || 0}`;

    try {
        const result = streamObject({
            model: google("gemini-2.5-flash"),
            schema: insightsSchema,
            messages: [
                {
                    role: "system", content: systemPrompt
                },
                {
                    role: "user", content: userContext
                }
            ],
            temperature: 0.8
        });
        return result.toTextStreamResponse();
    } catch (error: any) {
        return NextResponse.json(
            { error: "Something went wrong", message: error.message },
            { status: 500 }
        );
    }
}