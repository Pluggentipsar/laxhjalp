import Tesseract from 'tesseract.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Extrahera text från bild med Tesseract OCR
 * @param {string|Buffer} image - Base64 string eller Buffer
 * @param {string} language - Språkkod (swe, eng, etc)
 */
export async function extractTextFromImage(image, language = 'swe') {
  try {
    console.log('Startar OCR-process...');

    const result = await Tesseract.recognize(image, language, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      language: language
    };
  } catch (error) {
    console.error('OCR-fel:', error);
    throw new Error(`Kunde inte läsa text från bilden: ${error.message}`);
  }
}

/**
 * Extrahera text från PDF
 * @param {string} pdfData - Base64-encoded PDF
 */
export async function extractTextFromPDF(pdfData) {
  try {
    // Konvertera base64 till buffer
    const buffer = Buffer.from(pdfData.split(',')[1] || pdfData, 'base64');

    // Använd pdf-parse istället för pdfjs-dist (fungerar bättre i Node.js)
    const data = await pdfParse(buffer);

    return {
      text: data.text,
      pages: [{
        pageNumber: 1,
        text: data.text
      }],
      metadata: {
        numPages: data.numpages,
        title: data.info?.Title || 'Untitled'
      }
    };
  } catch (error) {
    console.error('PDF-extraktion fel:', error);
    throw new Error(`Kunde inte läsa PDF: ${error.message}`);
  }
}

/**
 * Rensa och segmentera text i meningsfulla delar
 * @param {string} text - Rå text från OCR/PDF
 * @param {number} chunkSize - Max tecken per segment
 */
export function segmentText(text, chunkSize = 500) {
  // Ta bort extra whitespace
  const cleaned = text
    .replace(/\s+/g, ' ')
    .trim();

  // Dela upp i stycken (dubbelradbrytning eller punkter)
  const paragraphs = cleaned.split(/\n\n+|\.(?:\s+)(?=[A-ZÅÄÖ])/);

  const chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
