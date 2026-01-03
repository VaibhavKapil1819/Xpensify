import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(req: NextRequest) {
  //const { messages }: { messages: UIMessage[] } = await req.json();
  const { prompt }: { prompt: string } = await req.json();
  try {
    const result = streamText({
      model: google("gemini-2.5-flash"),
      prompt,
    });
    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    return NextResponse.json(
      { error: "Something went wrong", message: error.message },
      { status: 500 }
    );
  }
}
