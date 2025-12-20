import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { AiSdkResponseSchema } from "./schema";

export async function POST(req: NextRequest) {
    try {
        const { goal, profile }: { goal: any, profile: any } = await req.json();

        const systemPrompt = `You are Finley, XPENSIFY's AI financial coach. Analyze the user's goal and break it down into achievable milestones.

        Your task:
        1. Break the goal into 3-5 realistic milestones
        2. Calculate a completion probability (0-100) based on the goal's timeframe, amount, and user's risk profile
        3. Provide actionable advice for each milestone
        4. Include an overall strategy and risk assessment
        
        Each milestone should have:
        - title: Clear, actionable title
        - description: Detailed description of what needs to be done
        - target_amount: The amount to reach at this milestone
        - due_date: Target date in YYYY-MM-DD format
        - advice: Specific advice for achieving this milestone`;

        const userContext = `Goal Details:
        - Title: ${goal.title}
        - Description: ${goal.description || 'Not provided'}
        - Target Amount: ${goal.currency || 'USD'} ${goal.target_amount}
        - Current Amount: ${goal.currency || 'USD'} ${goal.current_amount || 0}
        - Target Date: ${goal.target_date || 'Not set'}
        - Category: ${goal.category || 'General'}
        
        User Profile:
        - Risk Level: ${profile.risk_level || 'moderate'}
        - Primary Goal: ${profile.primary_goal || 'Not set'}
        - Learning Preference: ${profile.learning_preference || 'mixed'}
        
        Generate realistic milestones that match the user's risk tolerance and financial capability.`;

        const result = await generateObject({
            model: google("gemini-2.5-flash"),
            schema: AiSdkResponseSchema,
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userContext
                }
            ]
        });

        return NextResponse.json(result.object, { status: 200 });

    } catch (error: any) {
        console.error('Error generating milestones:', error);
        return NextResponse.json(
            { error: "Failed to generate milestones", message: error.message },
            { status: 500 }
        );
    }
}

 