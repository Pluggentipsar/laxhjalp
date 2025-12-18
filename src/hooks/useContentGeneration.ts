import { useState, useCallback } from 'react';
import {
  simplifyText,
  deepenText,
  generateSummary,
  generatePersonalizedExamples,
  generateNextSteps,
  deepenMaterialWithSuggestion,
  type SummaryResponse,
  type PersonalizedExamplesResponse,
  type NextStepsResponse,
} from '../services/aiService';
import type { Material } from '../types';

export type ContentView = 'original' | 'simplified' | 'advanced' | 'personalized-examples' | 'summary';

export type ContentGenerationState = {
  contentView: ContentView;
  isSimplifying: boolean;
  isDeepening: boolean;
  isGeneratingSummary: boolean;
  isGeneratingExamples: boolean;
  isGeneratingNextSteps: boolean;
  summary: SummaryResponse | null;
  personalizedExamples: PersonalizedExamplesResponse | null;
  nextSteps: NextStepsResponse | null;
};

type UpdateMaterialFn = (id: string, updates: Partial<Material>) => Promise<void>;
type SetErrorFn = (error: string) => void;

export function useContentGeneration(
  material: Material | undefined,
  grade: number,
  updateMaterial: UpdateMaterialFn,
  setError: SetErrorFn
) {
  const [contentView, setContentView] = useState<ContentView>('original');
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isDeepening, setIsDeepening] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingExamples, setIsGeneratingExamples] = useState(false);
  const [isGeneratingNextSteps, setIsGeneratingNextSteps] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [personalizedExamples, setPersonalizedExamples] = useState<PersonalizedExamplesResponse | null>(null);
  const [nextSteps, setNextSteps] = useState<NextStepsResponse | null>(null);

  const handleSimplify = useCallback(async () => {
    if (!material) return;
    setIsSimplifying(true);
    try {
      const simplified = await simplifyText(material.content, grade);
      await updateMaterial(material.id, {
        simplifiedContent: simplified,
        updatedAt: new Date(),
      });
      setContentView('simplified');
    } catch (error) {
      console.error('Simplify error', error);
      setError('Kunde inte förenkla texten just nu.');
    } finally {
      setIsSimplifying(false);
    }
  }, [material, grade, updateMaterial, setError]);

  const handleDeepen = useCallback(async () => {
    if (!material) return;
    setIsDeepening(true);
    try {
      const deepened = await deepenText(material.content, grade);
      await updateMaterial(material.id, {
        advancedContent: deepened,
        updatedAt: new Date(),
      });
      setContentView('advanced');
    } catch (error) {
      console.error('Deepen error', error);
      setError('Kunde inte fördjupa texten just nu.');
    } finally {
      setIsDeepening(false);
    }
  }, [material, grade, updateMaterial, setError]);

  const handleGenerateSummary = useCallback(async () => {
    if (!material) return;
    setIsGeneratingSummary(true);
    try {
      const result = await generateSummary(material.content, grade);
      setSummary(result);
      setContentView('summary');
    } catch (error) {
      console.error('Summary error', error);
      setError('Kunde inte generera sammanfattning.');
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [material, grade, setError]);

  const handleGeneratePersonalizedExamples = useCallback(async (
    selectedInterests: string[],
    customContext?: string
  ) => {
    if (!material) return;
    setIsGeneratingExamples(true);
    try {
      const result = await generatePersonalizedExamples(
        material.content,
        selectedInterests,
        customContext,
        grade,
        3
      );
      setPersonalizedExamples(result);
      setTimeout(() => {
        setContentView('personalized-examples');
      }, 100);
    } catch (error) {
      console.error('Personalized examples error', error);
      setError('Kunde inte generera personaliserade exempel.');
    } finally {
      setIsGeneratingExamples(false);
    }
  }, [material, grade, setError]);

  const handleGenerateNextSteps = useCallback(async (displayedContent: string) => {
    if (!material) return;
    setIsGeneratingNextSteps(true);
    try {
      const result = await generateNextSteps(displayedContent, grade);
      setNextSteps(result);
    } catch (error) {
      console.error('Next steps error', error);
      setError('Kunde inte generera nästa steg.');
    } finally {
      setIsGeneratingNextSteps(false);
    }
  }, [material, grade, setError]);

  const handleGenerateMaterialFromNextStep = useCallback(async (
    displayedContent: string,
    suggestion: { title: string; description: string; topic: string; difficulty: 'easier' | 'same' | 'harder' }
  ) => {
    if (!material) return;
    setIsGeneratingNextSteps(true);
    try {
      const result = await deepenMaterialWithSuggestion(displayedContent, suggestion, grade);

      const newSection = {
        id: crypto.randomUUID(),
        title: suggestion.title,
        content: result.content,
        type: 'next-step' as const,
        difficulty: suggestion.difficulty,
        addedAt: new Date(),
        collapsed: false,
      };

      const currentSections = material.additionalSections || [];
      await updateMaterial(material.id, {
        additionalSections: [...currentSections, newSection],
      });

      setTimeout(() => {
        const sectionElement = document.getElementById(`section-${newSection.id}`);
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (error) {
      console.error('Error generating section from next step:', error);
      setError('Kunde inte generera ny sektion. Försök igen.');
    } finally {
      setIsGeneratingNextSteps(false);
    }
  }, [material, grade, updateMaterial, setError]);

  const resetContentView = useCallback(() => {
    setContentView('original');
    setSummary(null);
    setPersonalizedExamples(null);
    setNextSteps(null);
  }, []);

  return {
    // State
    contentView,
    setContentView,
    isSimplifying,
    isDeepening,
    isGeneratingSummary,
    isGeneratingExamples,
    isGeneratingNextSteps,
    summary,
    personalizedExamples,
    nextSteps,

    // Actions
    handleSimplify,
    handleDeepen,
    handleGenerateSummary,
    handleGeneratePersonalizedExamples,
    handleGenerateNextSteps,
    handleGenerateMaterialFromNextStep,
    resetContentView,
  };
}
