import { NextRequest, NextResponse } from "next/server";
import { parsePdf } from "@/lib/pdf-parser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`📄 [Upload] Received file: ${file.name} (${file.size} bytes)`);

    const fileName = file.name.toLowerCase();
    let rawText = "";

    // Handle JSON files
    if (fileName.endsWith(".json")) {
      try {
        const text = await file.text();
        const jsonData = JSON.parse(text);

        // Convert JSON to readable text for AI processing
        rawText = JSON.stringify(jsonData, null, 2);
        console.log(`✅ [JSON] Parsed ${rawText.length} chars from JSON file`);
      } catch (jsonError: any) {
        console.error("❌ [JSON] Failed to parse JSON:", jsonError);
        return NextResponse.json(
          { error: "Invalid JSON file. Please check the file format." },
          { status: 422 }
        );
      }
    }
    // Handle PDF files
    else if (fileName.endsWith(".pdf")) {
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

      // Extract Text from PDF
      let data;
      try {
        data = await parsePdf(buffer);
      } catch (pdfError: any) {
        console.error("❌ [PDF] PDF parsing failed:", pdfError);
        return NextResponse.json(
          {
            error:
              "Failed to parse PDF. The file may be corrupted or encrypted.",
          },
          { status: 422 }
        );
      }

      rawText = data.text || "";
      console.log(`✅ [PDF] Extracted ${rawText.length} chars from PDF`);
    }
    // Handle TXT files
    else if (fileName.endsWith(".txt")) {
      try {
        rawText = await file.text();
        console.log(`✅ [TXT] Read ${rawText.length} chars from text file`);
      } catch (txtError: any) {
        console.error("❌ [TXT] Failed to read text file:", txtError);
        return NextResponse.json(
          { error: "Failed to read text file." },
          { status: 500 }
        );
      }
    }
    // Unsupported file type
    else {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload PDF, JSON, or TXT files.",
        },
        { status: 400 }
      );
    }

    // Validate extraction
    if (rawText.trim().length < 50) {
      console.error("❌ [Upload] Extraction failed: Text too short or empty.");
      return NextResponse.json(
        {
          error:
            "Could not extract enough text from this file. It might be empty or corrupted.",
        },
        { status: 422 }
      );
    }

    console.log(`✅ [Upload] Successfully processed file. Passing to AI...`);

    // Return clean data
    return NextResponse.json({
      text: rawText,
      videos: [],
    });
  } catch (error: any) {
    console.error("❌ [Upload] Critical Error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        error: "Failed to process file: " + (error.message || "Unknown error"),
      },
      { status: 500 }
    );
  }
}
