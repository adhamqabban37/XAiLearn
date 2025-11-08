
import pdf from 'pdf-parse';
import fs from 'fs';

/**
 * Parses a PDF from a Buffer.
 * @param buffer The PDF content as a Buffer.
 * @returns The parsed PDF data.
 * @throws An error if the buffer is empty or not a valid PDF.
 */
export async function parsePdfBuffer(buffer: Buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error('Empty buffer provided to PDF parser.');
  }
  // Quick magic byte check for '%PDF'
  if (!buffer.slice(0, 5).toString('utf8').includes('%PDF')) {
    throw new Error('File is not a valid PDF (missing %PDF magic number).');
  }
  try {
    return await pdf(buffer);
  } catch (err: any) {
      console.error("Error in pdf-parse:", err);
      throw new Error("Failed to parse PDF content. The file might be corrupted.");
  }
}

/**
 * Parses a PDF from a given file path.
 * @param path The absolute or relative path to the PDF file.
 * @returns The parsed PDF data.
 * @throws An error if the file does not exist or cannot be read.
 */
export async function parsePdfPath(path: string) {
    if (!fs.existsSync(path)) {
        throw new Error(`File not found at path: ${path}`);
    }
    try {
        const buffer = fs.readFileSync(path);
        return await parsePdfBuffer(buffer);
    } catch (err: any) {
        console.error(`Error reading or parsing file at ${path}:`, err);
        throw new Error(`Failed to read or parse file at ${path}.`);
    }
}
