// app/api/ai/lesson-assistance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { getCurrentUser } from "@/lib/auth";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Extract from body (useChat sends data in body, not in messages)
    const lessonContent = body.lessonContent;
    const lessonTitle = body.lessonTitle;
    const moduleTitle = body.moduleTitle;
    const requestType = body.requestType;
    const userNote = body.userNote;

    if (!lessonContent || !requestType) {
      return NextResponse.json(
        { error: "Lesson content and request type are required" },
        { status: 400 }
      );
    }

    // Build the prompt based on request type
    let systemPrompt = `You are an expert financial education tutor helping a student understand a lesson. Be concise, clear, and helpful.`;

    let userPrompt = "";
    
    if (requestType === "hint") {
      userPrompt = `The student is learning about: "${lessonTitle}" in the module "${moduleTitle}".

Lesson Content:
${lessonContent}

${userNote ? `Student's Note: "${userNote}"` : ""}

Provide a helpful hint that guides the student toward understanding the key concept without giving away the answer directly. Keep it brief (2-3 sentences) and encouraging.`;
    } else if (requestType === "elaborate") {
      userPrompt = `The student wants more explanation about: "${lessonTitle}" in the module "${moduleTitle}".

Lesson Content:
${lessonContent}

${userNote ? `Student's Note: "${userNote}"` : ""}

Provide a more detailed explanation that expands on the lesson content. Use examples, analogies, or step-by-step breakdowns to help clarify any confusion. Keep it focused and practical (3-4 sentences).`;
    } else {
      return NextResponse.json(
        { error: "Invalid request type. Must be 'hint' or 'elaborate'" },
        { status: 400 }
      );
    }

    // Stream AI response
    const result = streamText({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      maxTokens: 300, // Keep responses concise
    });

    // Use toTextStreamResponse for simpler text-only streaming
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Error in lesson assistance:", error);

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
            "You've reached the daily limit for AI requests. Please try again later.",
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
