import express from 'express';
import { chatWithMaterial, generateEmbeddings } from '../services/chatService.js';

const router = express.Router();

/**
 * POST /api/chat
 * RAG-baserad chat med studiematerial
 */
router.post('/', async (req, res, next) => {
  try {
    const { materialContent, messages, userMessage, grade, mode } = req.body;

    if (!materialContent || !userMessage) {
      return res.status(400).json({
        error: 'Material och meddelande krävs'
      });
    }

    const response = await chatWithMaterial(materialContent, messages || [], userMessage, {
      grade,
      mode: mode || 'free'
    });

    res.json({
      success: true,
      message: response.message,
      sources: response.sources
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/chat/embeddings
 * Generera embeddings för material (för lokal RAG)
 */
router.post('/embeddings', async (req, res, next) => {
  try {
    const { content, chunkSize = 500 } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Innehåll saknas' });
    }

    const embeddings = await generateEmbeddings(content, chunkSize);

    res.json({
      success: true,
      embeddings,
      count: embeddings.length
    });
  } catch (error) {
    next(error);
  }
});

export default router;
