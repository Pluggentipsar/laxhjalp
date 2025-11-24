import { useAppStore } from '../store/appStore';
import { generateConcepts } from './aiService';
import type {
  Concept,
  Flashcard,
  GameContentPreparation,
  GameTermBase,
  GameScopeMode,
  GlossaryEntry,
  LanguageCode,
  Material,
  SnakeGameTerm,
} from '../types';

export interface SnakeContentConfig {
  sourceMode: GameScopeMode;
  materialIds?: string[];
  includeAllMaterials?: boolean;
  language?: LanguageCode;
  minTerms?: number;
  maxDistractors?: number;
  topicHint?: string;
}

const DEFAULT_LANGUAGE: LanguageCode = 'sv';
const DEFAULT_MIN_TERMS = 6;
const DEFAULT_DISTRACTORS = 4;
const MAX_GENERATION_CHARS = 8000;

export async function prepareSnakeGameContent(
  config: SnakeContentConfig
): Promise<GameContentPreparation> {
  const {
    sourceMode,
    materialIds = [],
    includeAllMaterials = false,
    language = DEFAULT_LANGUAGE,
    minTerms = DEFAULT_MIN_TERMS,
    maxDistractors = DEFAULT_DISTRACTORS,
    topicHint = '',
  } = config;

  const store = useAppStore.getState();

  if (!store.materials.length) {
    await store.loadMaterials();
  }

  let materialsToUse: Material[] = [];
  const allMaterials = useAppStore.getState().materials;

  if (sourceMode === 'single-material') {
    const targetId = materialIds[0];
    if (!targetId) {
      throw new Error('Välj ett material innan du startar Snake.');
    }
    const material = allMaterials.find((item) => item.id === targetId);
    if (!material) {
      throw new Error('Materialet kunde inte hittas.');
    }
    materialsToUse = [material];
  } else if (sourceMode === 'multi-material') {
    const ids =
      includeAllMaterials || materialIds.length === 0
        ? allMaterials.map((item) => item.id)
        : materialIds;

    materialsToUse = allMaterials.filter((item) => ids.includes(item.id));

    if (!materialsToUse.length) {
      throw new Error('Välj minst ett material för att spela med flera källor.');
    }
  } else {
    // generated
    const ids =
      includeAllMaterials || materialIds.length === 0
        ? allMaterials.map((item) => item.id)
        : materialIds;
    materialsToUse = allMaterials.filter((item) => ids.includes(item.id));
  }

  const grade = store.user?.grade ?? 5;

  const baseTerms =
    sourceMode === 'generated'
      ? []
      : materialsToUse.flatMap((material) =>
        collectGameTerms({
          materialId: material.id,
          concepts: material.concepts,
          flashcards: material.flashcards,
          glossary: material.glossary ?? [],
          language,
        })
      );

  let terms = deduplicateTerms(baseTerms);
  let source: GameContentPreparation['source'] = sourceMode === 'generated' ? 'generated' : 'existing';

  const contentForGeneration = buildGenerationContent(materialsToUse);
  const normalizedTopic = topicHint.trim();
  const languageLabel =
    language === 'sv' ? 'svenska' : language === 'en' ? 'engelska' : language === 'es' ? 'spanska' : language;
  const needsGeneration =
    sourceMode === 'generated' || terms.length < minTerms || terms.length === 0;

  if (needsGeneration) {
    const conceptCount = Math.max(minTerms, 8);

    const generationInput = [
      normalizedTopic ? `Tema/fokus: ${normalizedTopic}.` : null,
      `Språk: ${languageLabel}.`,
      contentForGeneration
        ? `Bakgrundsmaterial:\n${contentForGeneration}`
        : 'Skapa en fristående begreppslista baserat på temat och årskursen.',
    ]
      .filter(Boolean)
      .join('\n\n');

    const generatedConcepts = await generateConcepts(generationInput, {
      count: conceptCount,
      grade,
      language,
      topicHint: normalizedTopic || undefined,
    });
    const generatedTerms = generatedConcepts.map((concept) =>
      createGameTermFromConcept(
        concept,
        materialsToUse[0]?.id ?? 'generated',
        language,
        'generated'
      )
    );

    terms = deduplicateTerms(sourceMode === 'generated' ? generatedTerms : [...terms, ...generatedTerms]);
    source =
      sourceMode === 'generated'
        ? 'generated'
        : terms.some((term) => term.source === 'generated')
          ? 'mixed'
          : 'existing';
  }

  if (terms.length < 3) {
    throw new Error('För få begrepp för att starta spelet. Lägg till fler eller generera nytt.');
  }

  const enrichedTerms: SnakeGameTerm[] = terms.map((term) => ({
    ...term,
    distractors: buildDistractors(term, terms, maxDistractors),
  }));

  const mistakeWeights = buildMistakeWeightMap(materialsToUse.map((material) => material.id));
  if (Object.keys(mistakeWeights).length > 0) {
    enrichedTerms.sort((a, b) => (mistakeWeights[b.term.toLowerCase()] ?? 0) - (mistakeWeights[a.term.toLowerCase()] ?? 0));
  }

  const materialIdList =
    materialsToUse.length > 0
      ? materialsToUse.map((material) => material.id)
      : config.materialIds && config.materialIds.length > 0
        ? config.materialIds
        : ['generated'];

  return {
    terms: enrichedTerms,
    language,
    source,
    needsReview: source !== 'existing',
    materialIds: materialIdList,
  };
}

function buildMistakeWeightMap(materialIds: string[]): Record<string, number> {
  const store = useAppStore.getState();
  const weights: Record<string, number> = {};

  materialIds.forEach((materialId) => {
    const mistakes = store.mistakeBank?.[materialId];
    if (!mistakes) return;

    Object.values(mistakes).forEach((entry) => {
      const key = entry.term.toLowerCase();
      weights[key] = (weights[key] ?? 0) + entry.missCount;
    });
  });

  return weights;
}

function buildGenerationContent(materials: Material[]): string {
  if (!materials.length) return '';

  const combinedContent = materials
    .map((material) => `${material.title}\n${material.content}`)
    .join('\n\n')
    .slice(0, MAX_GENERATION_CHARS);

  return combinedContent;
}

function collectGameTerms({
  materialId,
  concepts,
  flashcards,
  glossary,
  language,
}: {
  materialId: string;
  concepts: Concept[];
  flashcards: Flashcard[];
  glossary: GlossaryEntry[];
  language: LanguageCode;
}): GameTermBase[] {
  const conceptTerms = concepts.map((concept) =>
    createGameTermFromConcept(concept, materialId, language, 'concept')
  );

  const flashcardTerms = flashcards
    .filter((card) => card.type === 'term-definition' && isNonEmpty(card.front) && isNonEmpty(card.back))
    .map((card) => {
      const term = sanitize(card.front);
      const definition = sanitize(card.back);
      return {
        id: card.id || crypto.randomUUID(),
        materialId,
        term,
        definition: removeTermFromDefinition(term, definition),
        examples: [],
        source: 'flashcard' as const,
        language,
      };
    });

  const glossaryTerms = glossary
    .filter((entry) => isNonEmpty(entry.term) && isNonEmpty(entry.definition))
    .map((entry) => {
      const term = sanitize(entry.term);
      const definition = sanitize(entry.definition);
      return {
        id: entry.id || crypto.randomUUID(),
        materialId,
        term,
        definition: removeTermFromDefinition(term, definition),
        examples: entry.example ? [sanitize(entry.example)] : [],
        source: 'glossary' as const,
        language,
      };
    });

  return deduplicateTerms([...conceptTerms, ...flashcardTerms, ...glossaryTerms]);
}

function createGameTermFromConcept(
  concept: Concept,
  materialId: string,
  language: LanguageCode,
  source: GameTermBase['source']
): GameTermBase {
  const term = sanitize(concept.term);
  const definition = sanitize(concept.definition);

  return {
    id: concept.id || crypto.randomUUID(),
    materialId,
    term,
    definition: removeTermFromDefinition(term, definition),
    examples: concept.examples?.map(sanitize).filter(Boolean),
    source,
    language,
  };
}

function deduplicateTerms(terms: GameTermBase[]): GameTermBase[] {
  const seen = new Map<string, GameTermBase>();

  for (const term of terms) {
    const key = term.term.toLowerCase();
    if (!key) continue;

    if (!seen.has(key)) {
      seen.set(key, term);
      continue;
    }

    const existing = seen.get(key)!;
    seen.set(key, {
      ...existing,
      definition: selectLonger(existing.definition, term.definition),
      examples: mergeExamples(existing.examples, term.examples),
      source: existing.source === 'generated' || term.source === 'generated' ? 'generated' : existing.source,
      materialId: existing.materialId ?? term.materialId,
    });
  }

  return Array.from(seen.values());
}

function buildDistractors(term: GameTermBase, terms: GameTermBase[], maxDistractors: number): string[] {
  const pool = terms
    .filter((item) => item.term !== term.term)
    .map((item) => item.term);

  if (pool.length === 0) {
    return [];
  }

  const shuffled = shuffle(pool);
  const desired = Math.min(Math.max(2, maxDistractors), pool.length);
  return shuffled.slice(0, desired);
}

function mergeExamples(
  current: string[] | undefined,
  incoming: string[] | undefined
): string[] | undefined {
  const combined = [...(current ?? []), ...(incoming ?? [])]
    .map(sanitize)
    .filter(Boolean);

  if (!combined.length) {
    return undefined;
  }

  const unique = Array.from(new Set(combined));
  return unique.slice(0, 3);
}

function selectLonger(a: string, b: string): string {
  return a.length >= b.length ? a : b;
}

function sanitize(value: string | undefined | null): string {
  return (value ?? '').trim();
}

function isNonEmpty(value: string | undefined | null): value is string {
  return Boolean(value && value.trim().length > 0);
}

function shuffle<T>(items: T[]): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * Remove the term from the definition to make the game more challenging.
 * Replaces occurrences of the term with placeholders like "denna", "det", "detta", etc.
 */
function removeTermFromDefinition(term: string, definition: string): string {
  if (!term || !definition) return definition;

  // Normalize for comparison (case-insensitive)
  const termLower = term.toLowerCase().trim();
  const termWords = termLower.split(/\s+/);

  // Create regex patterns for the term
  // Match whole word(s) with word boundaries
  const patterns: RegExp[] = [];

  // Pattern for full term
  const escapedTerm = termWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
  patterns.push(new RegExp(`\\b${escapedTerm}(en|et|ar|arna|ens|ets)?\\b`, 'gi'));

  // Pattern for each significant word in multi-word terms (longer than 3 chars)
  termWords.forEach(word => {
    if (word.length > 3) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      patterns.push(new RegExp(`\\b${escaped}(en|et|ar|arna|ens|ets)?\\b`, 'gi'));
    }
  });

  let result = definition;

  // Replace occurrences with appropriate placeholders
  patterns.forEach((pattern, index) => {
    result = result.replace(pattern, (_match, suffix) => {
      // Determine gender/form from suffix or use neutral
      const s = suffix || '';

      // Common Swedish placeholder words based on context
      if (index === 0) { // Full term match
        if (s.includes('en')) return '[...]en'; // -en ending → definite common gender
        if (s.includes('et')) return '[...]et'; // -et ending → definite neuter gender
        if (s.includes('ar') || s.includes('arna')) return '[...]'; // plural
        return '[...]'; // Default placeholder
      }

      // For partial matches (individual words), use contextual replacements
      return '[...]';
    });
  });

  // Clean up multiple consecutive placeholders
  result = result.replace(/(\[\.\.\.]\s*)+/g, '[...] ');

  // Clean up leading/trailing spaces
  result = result.trim();

  return result;
}

// ============================================================================
// Whack-a-Term Game Content Preparation
// ============================================================================

export interface WhackATermConfig {
  materialId: string | null;
  scope: GameScopeMode;
  selectedMaterialIds: string[];
  includeAllMaterials: boolean;
  language: LanguageCode;
  generatedTopicHint?: string;
}

export async function prepareWhackATermContent(
  materials: Material[],
  config: WhackATermConfig
): Promise<{
  terms: any[];
  source: 'existing' | 'generated' | 'mixed';
  materialIds: string[];
  language: LanguageCode;
  timestamp: number;
} | null> {
  const {
    materialId,
    scope,
    selectedMaterialIds,
    includeAllMaterials,
    language,
    generatedTopicHint = '',
  } = config;

  let materialsToUse: Material[] = [];

  // Determine which materials to use
  if (materialId) {
    const material = materials.find((m) => m.id === materialId);
    if (material) {
      materialsToUse = [material];
    }
  } else if (scope === 'single-material' && selectedMaterialIds.length > 0) {
    const material = materials.find((m) => m.id === selectedMaterialIds[0]);
    if (material) {
      materialsToUse = [material];
    }
  } else if (scope === 'multi-material') {
    if (includeAllMaterials || selectedMaterialIds.length === 0) {
      materialsToUse = materials;
    } else {
      materialsToUse = materials.filter((m) =>
        selectedMaterialIds.includes(m.id)
      );
    }
  } else if (scope === 'generated') {
    // For generated content, we'll use AI to create terms
    if (generatedTopicHint.trim().length < 3) {
      return null;
    }

    // Generate concepts using AI
    try {
      const grade = useAppStore.getState().user?.grade || 9;
      const concepts = await generateConcepts(generatedTopicHint.trim(), {
        count: 15,
        grade,
        language,
      });

      if (!concepts || concepts.length === 0) {
        return null;
      }

      const terms = concepts.map((concept) => ({
        term: sanitize(concept.term),
        definition: removeTermFromDefinition(
          sanitize(concept.term),
          sanitize(concept.definition)
        ),
        examples: concept.examples?.map(sanitize) || [],
        source: 'generated' as const,
        language,
        distractors: concepts
          .filter((c) => c.term !== concept.term)
          .map((c) => sanitize(c.term))
          .slice(0, 6),
      }));

      return {
        terms,
        source: 'generated',
        materialIds: [],
        language,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to generate concepts:', error);
      return null;
    }
  }

  if (materialsToUse.length === 0) {
    return null;
  }

  // Extract terms from materials
  const allTerms: any[] = [];

  for (const material of materialsToUse) {
    // From flashcards
    if (material.flashcards && material.flashcards.length > 0) {
      material.flashcards.forEach((card) => {
        const term = sanitize(card.front);
        const definition = sanitize(card.back);
        allTerms.push({
          term,
          definition: removeTermFromDefinition(term, definition),
          examples: [],
          source: 'flashcard',
          language,
          distractors: [],
        });
      });
    }

    // From glossary
    if (material.glossary && material.glossary.length > 0) {
      material.glossary.forEach((entry) => {
        const term = sanitize(entry.term);
        const definition = sanitize(entry.definition);
        allTerms.push({
          term,
          definition: removeTermFromDefinition(term, definition),
          examples: entry.example ? [sanitize(entry.example)] : [],
          source: 'glossary',
          language,
          distractors: [],
        });
      });
    }

    // From concepts
    if (material.concepts && material.concepts.length > 0) {
      material.concepts.forEach((concept) => {
        const term = sanitize(concept.term);
        const definition = sanitize(concept.definition);
        allTerms.push({
          term,
          definition: removeTermFromDefinition(term, definition),
          examples: concept.examples?.map(sanitize) || [],
          source: 'concept',
          language,
          distractors: [],
        });
      });
    }
  }

  // If we have too few terms, try to generate more using AI
  if (allTerms.length < 5) {
    try {
      const grade = useAppStore.getState().user?.grade || 9;
      const contentForGeneration = buildGenerationContent(materialsToUse);

      // Don't generate if content is too short
      if (contentForGeneration.length > 50) {
        const generatedConcepts = await generateConcepts(contentForGeneration, {
          count: 10,
          grade,
          language,
        });

        if (generatedConcepts && generatedConcepts.length > 0) {
          generatedConcepts.forEach((concept) => {
            const term = sanitize(concept.term);
            const definition = sanitize(concept.definition);
            allTerms.push({
              term,
              definition: removeTermFromDefinition(term, definition),
              examples: concept.examples?.map(sanitize) || [],
              source: 'generated',
              language,
              distractors: [],
            });
          });
        }
      }
    } catch (error) {
      console.warn('Failed to auto-generate concepts for Whack-a-Term:', error);
      // Continue with what we have, or fail if still 0
    }
  }

  if (allTerms.length === 0) {
    return null;
  }

  // Create distractor pool for each term
  const termsWithDistractors = allTerms.map((term) => ({
    ...term,
    distractors: allTerms
      .filter((t) => t.term !== term.term)
      .map((t) => t.term)
      .sort(() => Math.random() - 0.5)
      .slice(0, 10), // Keep top 10 potential distractors
  }));

  return {
    terms: termsWithDistractors,
    source: allTerms.some(t => t.source === 'generated') ? 'mixed' : 'existing', // Mark as mixed if we generated some
    materialIds: materialsToUse.map((m) => m.id),
    language,
    timestamp: Date.now(),
  };
}
