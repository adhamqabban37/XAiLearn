import { NextResponse } from "next/server";
import { auditCourse } from "@/ai/flows/audit-course";

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
    const result = await auditCourse({ courseContent });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to audit course" },
      { status: 500 }
    );
  }
}
