import express from 'express';
import {
  generateFlashcards,
  generateQuestions,
  generateConcepts,
  generateMindmap
} from '../services/aiService.js';
import {
  simplifyMaterial,
  deepenMaterial,
  explainSelection
} from '../services/textService.js';

const router = express.Router();

/**
 * POST /api/generate/flashcards
 * Generera flashcards från text
 */
router.post('/flashcards', async (req, res, next) => {
  try {
    const { content, count = 10, difficulty = 'medium', grade } = req.body;

    if (!content || content.trim().length < 50) {
      return res.status(400).json({
        error: 'Innehållet är för kort. Behöver minst 50 tecken.'
      });
    }

    const flashcards = await generateFlashcards(content, {
      count,
      difficulty,
      grade
    });

    res.json({
      success: true,
      flashcards,
      count: flashcards.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/generate/quiz
 * Generera quiz-frågor från text
 */
router.post('/quiz', async (req, res, next) => {
  try {
    const { content, count = 5, difficulty = 'medium', types, grade } = req.body;

    if (!content || content.trim().length < 50) {
      return res.status(400).json({
        error: 'Innehållet är för kort. Behöver minst 50 tecken.'
      });
    }

    const questions = await generateQuestions(content, {
      count,
      difficulty,
      types,
      grade
    });

    res.json({
      success: true,
      questions,
      count: questions.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/generate/concepts
 * Generera nyckelbegrepp och definitioner från text
 */
router.post('/concepts', async (req, res, next) => {
  try {
    const { content, count = 5, grade } = req.body;

    if (!content || content.trim().length < 50) {
      return res.status(400).json({
        error: 'Innehållet är för kort. Behöver minst 50 tecken.'
      });
    }

    const concepts = await generateConcepts(content, {
      count,
      grade
    });

    res.json({
      success: true,
      concepts,
      count: concepts.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/generate/mindmap
 * Generera mindmap-struktur från text
 */
router.post('/mindmap', async (req, res, next) => {
  try {
    const { content, title, grade } = req.body;

    if (!content || content.trim().length < 50) {
      return res.status(400).json({
        error: 'Innehållet är för kort. Behöver minst 50 tecken.'
      });
    }

    const mindmap = await generateMindmap(content, {
      title,
      grade
    });

    res.json({
      success: true,
      mindmap
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/generate/simplify
 * Förenkla text för yngre läsare
 */
router.post('/simplify', async (req, res, next) => {
  try {
    const { content, grade = 5 } = req.body;

    if (!content || content.trim().length < 10) {
      return res.status(400).json({
        error: 'Innehållet är för kort.'
      });
    }

    const simplifiedText = await simplifyMaterial(content, { grade });

    res.json({
      success: true,
      simplifiedText
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/generate/deepen
 * Fördjupa text för elever som vill veta mer
 */
router.post('/deepen', async (req, res, next) => {
  try {
    const { content, grade = 7 } = req.body;

    if (!content || content.trim().length < 10) {
      return res.status(400).json({
        error: 'Innehållet är för kort.'
      });
    }

    const deepenedText = await deepenMaterial(content, { grade });

    res.json({
      success: true,
      deepenedText
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/generate/explain
 * Förklara markerad text
 */
router.post('/explain', async (req, res, next) => {
  try {
    const { materialContent = '', selection, grade = 5 } = req.body;

    if (!selection || selection.trim().length === 0) {
      return res.status(400).json({
        error: 'Ingen text markerad att förklara.'
      });
    }

    const result = await explainSelection(materialContent, selection, {
      grade
    });

    res.json({
      success: true,
      explanation: result.explanation,
      definition: result.definition,
      example: result.example,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
