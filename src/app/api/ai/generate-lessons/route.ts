import { NextRequest, NextResponse } from "next/server";
import { streamObject } from "ai";
import { google } from "@ai-sdk/google";
import { articleSchema } from "./schema";

export async function POST(req: NextRequest, res: NextResponse) {
    //const { messages }: { messages: UIMessage[] } = await req.json();
    const { category, level }: { category: string, level: string } = await req.json();
    try {
        const result = streamObject({
            model: google("gemini-2.5-flash"),
            schema: articleSchema,
            messages: [
                {
                    role: "system", content: ` You are an expert financial educator creating engaging, practical lessons for XPENSIFY users.
                                              Generate a personalized financial literacy lesson based on the category and level`
                },
                {
                    role: "user", content: `Category: ${category}
                                    Level: ${level}
                                Create a lesson that is practical, engaging, and includes real-world examples.`
                }
            ]
        });
        return result.toTextStreamResponse();
    } catch (error: any) {
        return NextResponse.json(
            { error: "Something went wrong", message: error.message },
            { status: 500 }
        );
    }
}