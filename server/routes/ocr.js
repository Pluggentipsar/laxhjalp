import express from 'express';
import { extractTextFromImage, extractTextFromPDF } from '../services/ocrService.js';

const router = express.Router();

/**
 * POST /api/ocr/image
 * Extrahera text från bild (base64 eller URL)
 */
router.post('/image', async (req, res, next) => {
  try {
    const { image, language = 'swe' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Ingen bild skickades' });
    }

    const result = await extractTextFromImage(image, language);

    res.json({
      success: true,
      text: result.text,
      confidence: result.confidence,
      language: result.language
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ocr/pdf
 * Extrahera text från PDF (base64)
 */
router.post('/pdf', async (req, res, next) => {
  try {
    const { pdfData } = req.body;

    if (!pdfData) {
      return res.status(400).json({ error: 'Ingen PDF skickades' });
    }

    const result = await extractTextFromPDF(pdfData);

    res.json({
      success: true,
      text: result.text,
      pages: result.pages,
      metadata: result.metadata
    });
  } catch (error) {
    next(error);
  }
});

export default router;
