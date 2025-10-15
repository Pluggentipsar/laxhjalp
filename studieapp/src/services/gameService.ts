import { useAppStore } from '../store/appStore';
import {
  generateConcepts,
} from './aiService';
import type {
  Concept,
  Flashcard,
  GameContentPreparation,
  GameTermBase,
  GlossaryEntry,
  LanguageCode,
  SnakeGameTerm,
} from '../types';

interface PrepareGameContentOptions {
  language?: LanguageCode;
  minTerms?: number;
  maxDistractors?: number;
}

const DEFAULT_LANGUAGE: LanguageCode = 'sv';
const DEFAULT_MIN_TERMS = 6;
const DEFAULT_DISTRACTORS = 4;

export async function prepareSnakeGameContent(
  materialId: string,
  options: PrepareGameContentOptions = {}
): Promise<GameContentPreparation> {
  const {
    language = DEFAULT_LANGUAGE,
    minTerms = DEFAULT_MIN_TERMS,
    maxDistractors = DEFAULT_DISTRACTORS,
  } = options;

  const store = useAppStore.getState();

  let material = store.materials.find((item) => item.id === materialId);
  if (!material) {
    await store.loadMaterials();
    material = useAppStore.getState().materials.find((item) => item.id === materialId);
  }

  if (!material) {
    throw new Error('Materialet kunde inte hittas.');
  }

  const grade = store.user?.grade ?? 5;

  const baseTerms = collectGameTerms({
    materialId,
    concepts: material.concepts,
    flashcards: material.flashcards,
    glossary: material.glossary ?? [],
    language,
  });

  let source: GameContentPreparation['source'] = 'existing';
  let terms = baseTerms;

  if (terms.length < minTerms) {
    const generatedConcepts = await generateConcepts(material.content, Math.max(minTerms, 8), grade);
    const generatedTerms = generatedConcepts.map((concept) =>
      createGameTermFromConcept(concept, materialId, language, 'generated')
    );

    const merged = deduplicateTerms([...terms, ...generatedTerms]);
    terms = merged;
    source = terms.length === generatedTerms.length ? 'generated' : 'mixed';
  } else if (terms.some((term) => term.source === 'generated')) {
    source = 'mixed';
  }

  if (terms.length < 3) {
    throw new Error('För få begrepp för att starta spelet. Lägg till fler i materialet.');
  }

  const enrichedTerms: SnakeGameTerm[] = terms.map((term) => ({
    ...term,
    distractors: buildDistractors(term, terms, maxDistractors),
  }));

  const mistakesForMaterial = store.mistakeBank?.[materialId] ?? {};
  if (mistakesForMaterial) {
    enrichedTerms.sort((a, b) => {
      const scoreA = mistakesForMaterial[a.term.toLowerCase()]?.missCount ?? 0;
      const scoreB = mistakesForMaterial[b.term.toLowerCase()]?.missCount ?? 0;
      return scoreB - scoreA;
    });
  }

  return {
    terms: enrichedTerms,
    language,
    source,
    needsReview: source !== 'existing',
  };
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
