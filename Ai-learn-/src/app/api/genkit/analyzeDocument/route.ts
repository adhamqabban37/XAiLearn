import { NextResponse } from "next/server";
import { analyzeDocument } from "@/ai/flows/restructure-messy-pdf";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { textContent, duration } = body || {};
    if (!textContent || typeof textContent !== "string") {
      return NextResponse.json(
        { error: "Missing required field: textContent" },
        { status: 400 }
      );
    }
    const result = await analyzeDocument({ textContent, duration });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to analyze document" },
      { status: 500 }
    );
  }
}
