import { NextResponse } from "next/server";
import { suggestMissingContent } from "@/ai/flows/suggest-missing-content";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseContent } = body || {};
    if (!courseContent || typeof courseContent !== "string") {
      return NextResponse.json(
        { error: "Missing required field: courseContent" },
        { status: 400 }
      );
    }
    const result = await suggestMissingContent({ courseContent });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to suggest missing content" },
      { status: 500 }
    );
  }
}
