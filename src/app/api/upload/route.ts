import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await pdf(buffer);

        return NextResponse.json({
            text: data.text,
            videos: [], // Placeholder for video extraction if needed later
        });
    } catch (error: any) {
        console.error("PDF Upload Error:", error);
        return NextResponse.json(
            { error: "Failed to process PDF: " + (error.message || "Unknown error") },
            { status: 500 }
        );
    }
}
