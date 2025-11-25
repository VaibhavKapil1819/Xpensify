
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
          role: "system", content: `You are an expert financial educator creating engaging, practical lessons for XPENSIFY users.
                                              Generate a personalized financial literacy lesson based on the category and level.
                                             
                                              IMPORTANT: Format the 'content' field using proper Markdown syntax:
                                              - Use **bold** for emphasis
                                              - Use *italic* for subtle emphasis
                                              - Use ## for section headers
                                              - Use - or * for bullet points
                                              - Use numbered lists (1., 2., 3.)
                                              - Use \`code\` for financial terms or formulas
                                              - Use > for important notes or tips
                                              - Create well-structured, readable content with proper spacing`
        },
        {
          role: "user", content: `Category: ${category}
                                    Level: ${level}
                                   
                                    Create a lesson that is:
                                    - Practical and actionable
                                    - Engaging with real-world examples
                                    - Well-formatted with markdown (headers, bold, lists, etc.)
                                    - Easy to read and understand`
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
