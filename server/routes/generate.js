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
  deepenMaterialWithSuggestion,
  explainSelection,
  generatePersonalizedExplanation,
  generatePersonalizedExamples,
  generateSummary,
  generateMaterial,
  generateNextSteps
} from '../services/textService.js';

const router = express.Router();

/**
 * POST /api/generate/flashcards
 * Generera flashcards fr�n text
 */
router.post('/flashcards', async (req, res, next) => {
  try {
    const { content, count = 10, difficulty = 'medium', grade } = req.body;

    if (!content || content.trim().length < 50) {
      return res.status(400).json({
        error: 'Inneh�llet �r f�r kort. Beh�ver minst 50 tecken.'
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
 * Generera quiz-fr�gor fr�n text
 */
router.post('/quiz', async (req, res, next) => {
  try {
    const { content, count = 5, difficulty = 'medium', types, grade } = req.body;

    if (!content || content.trim().length < 50) {
      return res.status(400).json({
        error: 'Inneh�llet �r f�r kort. Beh�ver minst 50 tecken.'
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
 * Generera nyckelbegrepp och definitioner fr�n text
 */
router.post('/concepts', async (req, res, next) => {
  try {
    const {
      content = '',
      count = 5,
      grade,
      language = 'sv',
      topicHint = '',
    } = req.body;

    const hasTopic = typeof topicHint === 'string' && topicHint.trim().length > 0;
    const hasContent = typeof content === 'string' && content.trim().length > 20;

    if (!hasTopic && !hasContent) {
      return res.status(400).json({
        error: 'Ange ett tema/ämne eller tillräckligt material för att skapa begrepp.'
      });
    }

    const concepts = await generateConcepts(content, {
      count,
      grade,
      language,
      topicHint,
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
 * Generera mindmap-struktur fr�n text
 */
router.post('/mindmap', async (req, res, next) => {
  try {
    const { content, title, grade } = req.body;

    if (!content || content.trim().length < 50) {
      return res.status(400).json({
        error: 'Inneh�llet �r f�r kort. Beh�ver minst 50 tecken.'
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
 * F�renkla text f�r yngre l�sare
 */
router.post('/simplify', async (req, res, next) => {
  try {
    const { content, grade = 5 } = req.body;

    if (!content || content.trim().length < 10) {
      return res.status(400).json({
        error: 'Inneh�llet �r f�r kort.'
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
 * F�rdjupa text f�r elever som vill veta mer
 */
router.post('/deepen', async (req, res, next) => {
  try {
    const { content, grade = 7 } = req.body;

    if (!content || content.trim().length < 10) {
      return res.status(400).json({
        error: 'Inneh�llet �r f�r kort.'
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
 * POST /api/generate/deepen-with-suggestion
 * F�rdjupa material baserat på ett specifikt förslag från "Nästa steg"
 */
router.post('/deepen-with-suggestion', async (req, res, next) => {
  try {
    const { originalContent, suggestion, grade = 7 } = req.body;

    if (!originalContent || originalContent.trim().length < 10) {
      return res.status(400).json({
        error: 'Originalinneh�llet �r f�r kort.'
      });
    }

    if (!suggestion || !suggestion.title || !suggestion.topic) {
      return res.status(400).json({
        error: 'Förslag saknar nödvändiga fält (title, topic).'
      });
    }

    const deepenedText = await deepenMaterialWithSuggestion(originalContent, suggestion, { grade });

    res.json({
      success: true,
      content: deepenedText
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/generate/explain
 * F�rklara markerad text
 */
router.post('/explain', async (req, res, next) => {
  try {
    const { materialContent = '', selection, grade = 5 } = req.body;

    if (!selection || selection.trim().length === 0) {
      return res.status(400).json({
        error: 'Ingen text markerad att f�rklara.'
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


/**
 * POST /api/generate/personalized-explain
 */
router.post('/personalized-explain', async (req, res, next) => {
  try {
    const { materialContent = '', selection, interests = [], customContext, grade = 7 } = req.body;

    if (!selection || selection.trim().length === 0) {
      return res.status(400).json({ error: 'Ingen text markerad.' });
    }

    if (interests.length === 0 && !customContext) {
      return res.status(400).json({ error: 'Inga intressen angivna.' });
    }

    const result = await generatePersonalizedExplanation(
      materialContent, selection, interests, customContext, { grade }
    );

    res.json({
      success: true,
      explanation: result.explanation,
      examples: result.examples || [],
      analogy: result.analogy,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/generate/personalized-examples
 */
router.post('/personalized-examples', async (req, res, next) => {
  try {
    const { materialContent, interests = [], customContext, grade = 7, count = 3 } = req.body;

    if (!materialContent || materialContent.trim().length < 50) {
      return res.status(400).json({ error: 'Innehållet är för kort.' });
    }

    if (interests.length === 0 && !customContext) {
      return res.status(400).json({ error: 'Inga intressen angivna.' });
    }

    const result = await generatePersonalizedExamples(
      materialContent, interests, customContext, { grade, count }
    );

    res.json({ success: true, examples: result.examples || [] });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/generate/summary
 */
router.post('/summary', async (req, res, next) => {
  try {
    const { content, grade = 7 } = req.body;

    if (!content || content.trim().length < 50) {
      return res.status(400).json({ error: 'Innehållet är för kort.' });
    }

    const result = await generateSummary(content, { grade });

    res.json({
      success: true,
      summary: result.summary,
      keyPoints: result.keyPoints || [],
      mainIdeas: result.mainIdeas || [],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/generate/material
 * Generera helt nytt studiematerial från ett ämne/topic
 */
router.post('/material', async (req, res, next) => {
  try {
    const { topic, grade = 5, adjustDifficulty = 'same' } = req.body;

    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Inget ämne angivet.' });
    }

    if (topic.trim().length < 3) {
      return res.status(400).json({ error: 'Ämnet är för kort.' });
    }

    const result = await generateMaterial(topic, { grade, adjustDifficulty });

    res.json({
      success: true,
      title: result.title,
      content: result.content,
      subject: result.subject,
      suggestedTags: result.suggestedTags || [],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/generate/next-steps
 * Generera förslag på nästa steg att lära sig
 */
router.post('/next-steps', async (req, res, next) => {
  try {
    const { content, grade = 7 } = req.body;

    if (!content || content.trim().length < 50) {
      return res.status(400).json({ error: 'Innehållet är för kort.' });
    }

    const result = await generateNextSteps(content, { grade });

    res.json({
      success: true,
      introduction: result.introduction,
      suggestions: result.suggestions || [],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
