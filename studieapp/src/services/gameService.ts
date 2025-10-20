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
    .map((card) => ({
      id: card.id || crypto.randomUUID(),
      materialId,
      term: sanitize(card.front),
      definition: sanitize(card.back),
      examples: [],
      source: 'flashcard' as const,
      language,
    }));

  const glossaryTerms = glossary
    .filter((entry) => isNonEmpty(entry.term) && isNonEmpty(entry.definition))
    .map((entry) => ({
      id: entry.id || crypto.randomUUID(),
      materialId,
      term: sanitize(entry.term),
      definition: sanitize(entry.definition),
      examples: entry.example ? [sanitize(entry.example)] : [],
      source: 'glossary' as const,
      language,
    }));

  return deduplicateTerms([...conceptTerms, ...flashcardTerms, ...glossaryTerms]);
}

function createGameTermFromConcept(
  concept: Concept,
  materialId: string,
  language: LanguageCode,
  source: GameTermBase['source']
): GameTermBase {
  return {
    id: concept.id || crypto.randomUUID(),
    materialId,
    term: sanitize(concept.term),
    definition: sanitize(concept.definition),
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
