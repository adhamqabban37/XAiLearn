import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log(`📄 [PDF] Received file: ${file.name} (${file.size} bytes)`);

        // Check file type
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return NextResponse.json(
                { error: "Please upload a PDF file" },
                { status: 400 }
            );
        }

        let buffer;
        try {
            buffer = Buffer.from(await file.arrayBuffer());
        } catch (bufferError: any) {
            console.error("❌ [PDF] Failed to read file buffer:", bufferError);
            return NextResponse.json(
                { error: "Failed to read file. Please try again." },
                { status: 500 }
            );
        }

        // 1. Extract Text
        let data;
        try {
            data = await pdf(buffer);
        } catch (pdfError: any) {
            console.error("❌ [PDF] PDF parsing failed:", pdfError);
            return NextResponse.json(
                { error: "Failed to parse PDF. The file may be corrupted or encrypted." },
                { status: 422 }
            );
        }

        const rawText = data.text || "";

        // 2. Validate Extraction
        if (rawText.trim().length < 50) {
            console.error("❌ [PDF] Extraction failed: Text too short or empty.");
            return NextResponse.json(
                { error: "Could not read text from this PDF. It might be an image-only scan or empty." },
                { status: 422 }
            );
        }

        console.log(`✅ [PDF] Extracted ${rawText.length} chars. Passing to AI...`);

        // 3. Return Clean Data
        return NextResponse.json({
            text: rawText,
            videos: [], // Video extraction is separate, 0 videos is NOT an error
        });

    } catch (error: any) {
        console.error("❌ [PDF] Critical Upload Error:", error);
        console.error("Error stack:", error.stack);
        return NextResponse.json(
            { error: "Failed to process PDF: " + (error.message || "Unknown error") },
            { status: 500 }
        );
    }
}
