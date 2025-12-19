/**
 * Game Content Adapter
 *
 * Provides functions to convert different content types to the unified
 * GameContentItem format that all games can consume.
 */

import type { Material, Flashcard, Concept, ActivityQuestion, GlossaryEntry } from '../types';
import type { WordPackage, WordPair } from '../types/motion-learn';
import type {
  GameContentItem,
  GameContentPackage,
  GameContentConfig,
  GameContentSource,
} from '../types/game-content';
import { generateAllQuestions } from '../data/activities/questionGenerator';
import { useAppStore } from '../store/appStore';

// ========== Individual Adapters ==========

/**
 * Convert a Concept to GameContentItem
 */
export function adaptConcept(concept: Concept, materialId?: string): GameContentItem {
  return {
    id: concept.id,
    prompt: concept.term,
    correctAnswer: concept.definition,
    distractors: [],
    source: 'material',
    metadata: {
      materialId: materialId || concept.materialId,
    },
  };
}

/**
 * Convert a Flashcard to GameContentItem
 */
export function adaptFlashcard(flashcard: Flashcard): GameContentItem {
  return {
    id: flashcard.id,
    prompt: flashcard.front,
    correctAnswer: flashcard.back,
    distractors: [],
    source: 'material',
    metadata: {
      materialId: flashcard.materialId,
      difficulty: flashcard.difficulty,
    },
  };
}

/**
 * Convert a GlossaryEntry to GameContentItem
 */
export function adaptGlossaryEntry(
  entry: GlossaryEntry,
  materialId: string
): GameContentItem {
  return {
    id: entry.id,
    prompt: entry.term,
    correctAnswer: entry.definition,
    distractors: [],
    source: 'material',
    metadata: {
      materialId,
    },
  };
}

/**
 * Convert an ActivityQuestion to GameContentItem
 */
export function adaptMathQuestion(question: ActivityQuestion): GameContentItem {
  return {
    id: question.id,
    prompt: question.question,
    correctAnswer: String(question.correctAnswer),
    distractors: question.options?.map(String).filter((o) => o !== String(question.correctAnswer)) || [],
    source: 'math',
    metadata: {
      conceptArea: question.conceptArea,
      difficulty: question.difficulty,
      ageGroup: question.ageGroup,
    },
  };
}

/**
 * Convert a WordPair to GameContentItem
 */
export function adaptWordPair(pair: WordPair): GameContentItem {
  return {
    id: pair.id,
    prompt: pair.term,
    correctAnswer: pair.definition,
    distractors: [],
    source: 'wordpackage',
  };
}

// ========== Collection Adapters ==========

/**
 * Convert a Material's content to GameContentItems
 */
export function adaptMaterial(material: Material): GameContentItem[] {
  const items: GameContentItem[] = [];

  // Add concepts
  material.concepts?.forEach((concept) => {
    items.push(adaptConcept(concept, material.id));
  });

  // Add term-definition flashcards
  material.flashcards
    ?.filter((f) => f.type === 'term-definition')
    .forEach((flashcard) => {
      items.push(adaptFlashcard(flashcard));
    });

  // Add glossary entries
  material.glossary?.forEach((entry) => {
    items.push(adaptGlossaryEntry(entry, material.id));
  });

  return items;
}

/**
 * Convert a WordPackage to GameContentItems
 */
export function adaptWordPackage(pkg: WordPackage): GameContentItem[] {
  return pkg.words.map(adaptWordPair);
}

/**
 * Convert ActivityQuestions to GameContentItems
 */
export function adaptMathQuestions(questions: ActivityQuestion[]): GameContentItem[] {
  return questions.map(adaptMathQuestion);
}

// ========== Distractor Generation ==========

/**
 * Generate distractors for items that don't have any
 */
export function generateDistractors(
  items: GameContentItem[],
  count: number = 3
): GameContentItem[] {
  // Collect all possible distractors
  const allAnswers = items.map((item) => item.correctAnswer);

  return items.map((item) => {
    if (item.distractors.length >= count) {
      return item;
    }

    // Get random distractors from other items
    const otherAnswers = allAnswers.filter((a) => a !== item.correctAnswer);
    const shuffled = otherAnswers.sort(() => Math.random() - 0.5);
    const newDistractors = shuffled.slice(0, count);

    return {
      ...item,
      distractors: [...item.distractors, ...newDistractors].slice(0, count),
    };
  });
}

// ========== Content Loaders ==========

/**
 * Load game content based on configuration
 */
export async function loadGameContent(
  config: GameContentConfig
): Promise<GameContentPackage> {
  let items: GameContentItem[] = [];
  let name = '';
  let source: GameContentSource = 'material';

  switch (config.sourceMode) {
    case 'single-material':
    case 'multi-material': {
      if (!config.materialIds?.length) {
        throw new Error('No material IDs provided');
      }

      const materials = useAppStore.getState().materials.filter((m) =>
        config.materialIds!.includes(m.id)
      );

      materials.forEach((material) => {
        items.push(...adaptMaterial(material));
      });

      name =
        materials.length === 1
          ? materials[0].title
          : `${materials.length} material`;
      source = 'material';
      break;
    }

    case 'math-topic': {
      const allQuestions = generateAllQuestions();
      let filteredQuestions = allQuestions;

      // Filter by concept area
      if (config.conceptArea) {
        filteredQuestions = filteredQuestions.filter(
          (q) => q.conceptArea === config.conceptArea
        );
      }

      // Filter by age group
      if (config.ageGroup) {
        filteredQuestions = filteredQuestions.filter(
          (q) => q.ageGroup === config.ageGroup
        );
      }

      // Filter by difficulty
      if (config.difficulty) {
        filteredQuestions = filteredQuestions.filter(
          (q) => q.difficulty === config.difficulty
        );
      }

      items = adaptMathQuestions(filteredQuestions);
      name = config.conceptArea || 'Matematik';
      source = 'math';
      break;
    }

    case 'generated': {
      // For now, return empty - AI generation would go here
      name = config.topicHint || 'Genererat innehåll';
      source = 'generated';
      break;
    }
  }

  // Apply limits
  if (config.maxItems && items.length > config.maxItems) {
    items = items.sort(() => Math.random() - 0.5).slice(0, config.maxItems);
  }

  // Check minimum items
  if (config.minItems && items.length < config.minItems) {
    console.warn(
      `Only ${items.length} items available, ${config.minItems} required`
    );
  }

  // Generate distractors if needed
  items = generateDistractors(items);

  return {
    id: `pkg-${Date.now()}`,
    name,
    items,
    source,
    language: config.language || 'sv',
    totalItems: items.length,
  };
}

/**
 * Load content from a specific material
 */
export function loadMaterialContent(materialId: string): GameContentItem[] {
  const material = useAppStore.getState().materials.find((m) => m.id === materialId);
  if (!material) {
    return [];
  }
  return adaptMaterial(material);
}

/**
 * Load content from multiple materials
 */
export function loadMultiMaterialContent(materialIds: string[]): GameContentItem[] {
  const materials = useAppStore.getState().materials.filter((m) =>
    materialIds.includes(m.id)
  );
  const items: GameContentItem[] = [];
  materials.forEach((m) => {
    items.push(...adaptMaterial(m));
  });
  return items;
}

/**
 * Load math content for a specific concept area
 */
export function loadMathContent(conceptArea: string): GameContentItem[] {
  const allQuestions = generateAllQuestions();
  const filtered = allQuestions.filter((q) => q.conceptArea === conceptArea);
  return adaptMathQuestions(filtered);
}

/**
 * Check if a material has enough content for games
 */
export function hasEnoughContent(material: Material, minItems: number = 5): boolean {
  const totalItems =
    (material.concepts?.length || 0) +
    (material.flashcards?.filter((f) => f.type === 'term-definition').length || 0) +
    (material.glossary?.length || 0);

  return totalItems >= minItems;
}

/**
 * Get content statistics for a material
 */
export function getContentStats(material: Material): {
  concepts: number;
  flashcards: number;
  glossary: number;
  total: number;
} {
  const concepts = material.concepts?.length || 0;
  const flashcards =
    material.flashcards?.filter((f) => f.type === 'term-definition').length || 0;
  const glossary = material.glossary?.length || 0;

  return {
    concepts,
    flashcards,
    glossary,
    total: concepts + flashcards + glossary,
  };
}
