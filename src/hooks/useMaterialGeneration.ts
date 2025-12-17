import { useState, useCallback, useRef } from 'react';
import {
  generateFlashcards,
  generateQuestions,
  generateConcepts,
} from '../services/aiService';
import type { Difficulty, GenerationLogEntry, Material } from '../types';

export type GenerationMode = 'flashcards' | 'quiz' | 'concepts';

type UpdateMaterialFn = (id: string, updates: Partial<Material>) => Promise<void>;
type SetErrorFn = (error: string) => void;

export function useMaterialGeneration(
  material: Material | undefined,
  grade: number,
  updateMaterial: UpdateMaterialFn,
  setError: SetErrorFn
) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [cardCount, setCardCount] = useState(12);
  const [quizCount, setQuizCount] = useState(6);
  const [isGenerating, setIsGenerating] = useState<Record<GenerationMode, boolean>>({
    flashcards: false,
    quiz: false,
    concepts: false,
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    flashcards: false,
    quiz: false,
    concepts: false,
  });

  // Refs for scrolling
  const flashcardsRef = useRef<HTMLDivElement | null>(null);
  const quizRef = useRef<HTMLDivElement | null>(null);
  const conceptsRef = useRef<HTMLDivElement | null>(null);

  const appendHistory = useCallback((entry: GenerationLogEntry) => {
    if (!material) return;
    const history = [...(material.generationHistory ?? []), entry];
    updateMaterial(material.id, { generationHistory: history });
  }, [material, updateMaterial]);

  const scrollToSection = useCallback((ref: React.RefObject<HTMLDivElement | null>, sectionKey: string) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setOpenSections(prev => ({ ...prev, [sectionKey]: true }));
    }
  }, []);

  const withGeneration = useCallback(async (
    mode: GenerationMode,
    generator: () => Promise<void>
  ) => {
    setIsGenerating(prev => ({ ...prev, [mode]: true }));
    try {
      await generator();
    } catch (error) {
      console.error('AI generation error', error);
      setError('Kunde inte generera just nu. Försök igen om en stund.');
    } finally {
      setIsGenerating(prev => ({ ...prev, [mode]: false }));
    }
  }, [setError]);

  const handleGenerateFlashcards = useCallback(async () => {
    if (!material) return;
    await withGeneration('flashcards', async () => {
      const cards = await generateFlashcards(
        material.content,
        cardCount,
        difficulty,
        grade
      );

      await updateMaterial(material.id, {
        flashcards: cards.map(card => ({
          ...card,
          materialId: material.id,
        })),
        updatedAt: new Date(),
      });

      appendHistory({
        id: crypto.randomUUID(),
        type: 'flashcards',
        count: cards.length,
        difficulty,
        createdAt: new Date(),
      });

      setTimeout(() => scrollToSection(flashcardsRef, 'flashcards'), 300);
    });
  }, [material, cardCount, difficulty, grade, withGeneration, updateMaterial, appendHistory, scrollToSection]);

  const handleGenerateQuiz = useCallback(async () => {
    if (!material) return;
    await withGeneration('quiz', async () => {
      const questions = await generateQuestions(
        material.content,
        quizCount,
        difficulty,
        grade
      );

      await updateMaterial(material.id, {
        questions: questions.map(question => ({
          ...question,
          materialId: material.id,
        })),
        updatedAt: new Date(),
      });

      appendHistory({
        id: crypto.randomUUID(),
        type: 'quiz',
        count: questions.length,
        difficulty,
        createdAt: new Date(),
      });

      setTimeout(() => scrollToSection(quizRef, 'quiz'), 300);
    });
  }, [material, quizCount, difficulty, grade, withGeneration, updateMaterial, appendHistory, scrollToSection]);

  const handleGenerateConcepts = useCallback(async () => {
    if (!material) return;
    await withGeneration('concepts', async () => {
      const concepts = await generateConcepts(material.content, {
        count: 10,
        grade,
      });

      await updateMaterial(material.id, {
        concepts: concepts.map(concept => ({
          ...concept,
          materialId: material.id,
        })),
        updatedAt: new Date(),
      });

      appendHistory({
        id: crypto.randomUUID(),
        type: 'concepts',
        count: concepts.length,
        createdAt: new Date(),
      });

      setTimeout(() => scrollToSection(conceptsRef, 'concepts'), 300);
    });
  }, [material, grade, withGeneration, updateMaterial, appendHistory, scrollToSection]);

  const toggleSection = useCallback((key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return {
    // State
    difficulty,
    setDifficulty,
    cardCount,
    setCardCount,
    quizCount,
    setQuizCount,
    isGenerating,
    openSections,

    // Refs
    flashcardsRef,
    quizRef,
    conceptsRef,

    // Actions
    handleGenerateFlashcards,
    handleGenerateQuiz,
    handleGenerateConcepts,
    toggleSection,
    scrollToSection,
  };
}
