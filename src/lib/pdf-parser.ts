/**
 * Safe wrapper for pdf-parse to avoid test file loading issues
 */

export async function parsePdf(buffer: Buffer): Promise<{ text: string }> {
  try {
    // Dynamic import to avoid build-time issues
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return { text: data.text || '' };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF file');
  }
}
