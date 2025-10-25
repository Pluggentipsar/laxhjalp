import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import * as Collapsible from '@radix-ui/react-collapsible';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  GraduationCap,
  MessageSquare,
  Brain,
  ArrowLeft,
  History,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Heart,
  Lightbulb,
  FileText,
  BookOpen,
  X,
  StickyNote,
  Loader2,
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { PersonalizedExplanationModal } from '../components/common/PersonalizedExplanationModal';
import { PersonalizedExamplesModal } from '../components/common/PersonalizedExamplesModal';
import { ReadingModeToolbar } from '../components/reading/ReadingModeToolbar';
import { ReadingRuler } from '../components/reading/ReadingRuler';
import { NotesSection } from '../components/material/NotesSection';
import { useAppStore } from '../store/appStore';
import {
  generateFlashcards,
  generateQuestions,
  generateConcepts,
  simplifyText,
  deepenText,
  explainSelection,
  generatePersonalizedExplanation,
  generatePersonalizedExamples,
  generateSummary,
  generateNextSteps,
  generateMaterial,
  type ExplainSelectionResponse,
  type PersonalizedExplanationResponse,
  type PersonalizedExamplesResponse,
  type SummaryResponse,
  type NextStepsResponse,
} from '../services/aiService';
import type { Difficulty, GenerationLogEntry, GlossaryEntry, Material, Note } from '../types';

const subjectLabels: Record<string, string> = {
  svenska: 'Svenska',
  engelska: 'Engelska',
  matte: 'Matematik',
  no: 'NO',
  so: 'SO',
  idrott: 'Idrott',
  annat: 'Annat',
};

type GenerationMode = 'flashcards' | 'quiz' | 'concepts';
type ContentView = 'original' | 'simplified' | 'advanced' | 'personalized-examples' | 'summary';

type SelectionMenuState = {
  text: string;
  top: number;
  left: number;
};

type ReadingModeSettings = {
  active: boolean;
  fontSize: number;
  lineHeight: number;
  fontFamily: 'default' | 'dyslexic';
  rulerEnabled: boolean;
  rulerColor: 'yellow' | 'blue' | 'pink';
  contrast: 'white' | 'black' | 'sepia';
  letterSpacing: number;
  wordSpacing: number;
};

function MarkdownContent({
  value,
  conceptTerms = [],
  highlightConcepts = false
}: {
  value: string;
  conceptTerms?: string[];
  highlightConcepts?: boolean;
}) {
  const highlightText = (text: string) => {
    if (!highlightConcepts || conceptTerms.length === 0) {
      return text;
    }

    let result = text;
    const matches: Array<{ term: string; index: number }> = [];

    conceptTerms.forEach(term => {
      const regex = new RegExp(`\\b(${term})\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({ term: match[0], index: match.index });
      }
    });

    matches.sort((a, b) => b.index - a.index);

    matches.forEach(({ term, index }) => {
      const before = result.substring(0, index);
      const after = result.substring(index + term.length);
      result = `${before}<mark class="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">${term}</mark>${after}`;
    });

    return result;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose dark:prose-invert max-w-[68ch] mx-auto text-base leading-[1.7] prose-p:mb-4 last:prose-p:mb-0"
      components={{
        p: ({ children }) => {
          const text = String(children);
          const highlighted = highlightText(text);
          return (
            <p
              className="mb-4 last:mb-0"
              dangerouslySetInnerHTML={highlighted !== text ? { __html: highlighted } : undefined}
            >
              {highlighted === text ? children : null}
            </p>
          );
        },
        ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
        code: ({ children }) => (
          <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="p-4 rounded-xl bg-gray-100 dark:bg-gray-900 text-sm overflow-x-auto">
            {children}
          </pre>
        ),
      }}
    >
      {value}
    </ReactMarkdown>
  );
}

export function MaterialDetailPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  const materials = useAppStore((state) => state.materials);
  const loadMaterials = useAppStore((state) => state.loadMaterials);
  const updateMaterial = useAppStore((state) => state.updateMaterial);
  const setError = useAppStore((state) => state.setError);
  const user = useAppStore((state) => state.user);

  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [cardCount, setCardCount] = useState(12);
  const [quizCount, setQuizCount] = useState(6);
  const [isGenerating, setIsGenerating] = useState<Record<GenerationMode, boolean>>({
    flashcards: false,
    quiz: false,
    concepts: false,
  });
  const [contentView, setContentView] = useState<ContentView>('original');
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isDeepening, setIsDeepening] = useState(false);
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenuState | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainResult, setExplainResult] = useState<ExplainSelectionResponse | null>(null);
  const [isPersonalizedModalOpen, setIsPersonalizedModalOpen] = useState(false);
  const [personalizedResult, setPersonalizedResult] = useState<PersonalizedExplanationResponse | null>(null);
  const [isPersonalizedExamplesModalOpen, setIsPersonalizedExamplesModalOpen] = useState(false);
  const [personalizedExamples, setPersonalizedExamples] = useState<PersonalizedExamplesResponse | null>(null);
  const [isGeneratingExamples, setIsGeneratingExamples] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [nextSteps, setNextSteps] = useState<NextStepsResponse | null>(null);
  const [isGeneratingNextSteps, setIsGeneratingNextSteps] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const flashcardsRef = useRef<HTMLDivElement | null>(null);
  const quizRef = useRef<HTMLDivElement | null>(null);
  const conceptsRef = useRef<HTMLDivElement | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    flashcards: false,
    quiz: false,
    concepts: false,
  });
  const [readingMode, setReadingMode] = useState<ReadingModeSettings>({
    active: false,
    fontSize: 18,
    lineHeight: 1.8,
    fontFamily: 'default',
    rulerEnabled: false,
    rulerColor: 'yellow',
    contrast: 'white',
    letterSpacing: 0.05,
    wordSpacing: 0.16,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [explanationHistory, setExplanationHistory] = useState<Array<{
    id: string;
    text: string;
    explanation: string;
    definition?: string;
    example?: string;
    timestamp: Date;
  }>>([]);
  const [rulerPosition, setRulerPosition] = useState(0);
  const [noteLinkedText, setNoteLinkedText] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!materials.length) {
      loadMaterials();
    }
  }, [materials.length, loadMaterials]);

  const material = useMemo<Material | undefined>(() => {
    return materials.find((item) => item.id === materialId);
  }, [materials, materialId]);

  const grade = user?.grade ?? 5;
  const glossaryEntries = material?.glossary ?? [];

  const displayedContent = useMemo(() => {
    if (!material) return '';
    if (contentView === 'simplified') {
      return material.simplifiedContent ?? '';
    }
    if (contentView === 'advanced') {
      return material.advancedContent ?? '';
    }
    return material.content;
  }, [material, contentView]);

  useEffect(() => {
    if (!material) {
      setSelectionMenu(null);
      setExplainResult(null);
      setContentView('original');
    }
  }, [material]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      // Only clear menu if scroll is significant (more than 50px)
      if (Math.abs(window.scrollY - lastScrollY) > 50) {
        setSelectionMenu(null);
        lastScrollY = window.scrollY;
      }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  // Global mouseup handler for text selection - works on ALL tabs
  useEffect(() => {
    let selectionTimeout: number | null = null;
    let mouseDownInContent = false;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      mouseDownInContent = !!target.closest('[data-content-area]');
      console.log('[Selection] MouseDown in content:', mouseDownInContent);
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      // Clear any pending timeout
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
        selectionTimeout = null;
      }

      const target = e.target as HTMLElement;

      // Don't interfere if clicking on buttons or interactive elements
      if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
        mouseDownInContent = false;
        return;
      }

      // Only handle if we started selection in content area
      if (!mouseDownInContent) {
        // Clear menu if clicking outside content area
        setSelectionMenu(null);
        mouseDownInContent = false;
        return;
      }

      // Give browser time to finalize selection (longer delay for more stability)
      selectionTimeout = setTimeout(() => {
        const selection = window.getSelection();

        // Check if selection still exists and is valid
        if (!selection || selection.rangeCount === 0) {
          setSelectionMenu(null);
          mouseDownInContent = false;
          return;
        }

        const text = selection.toString().trim();

        // Check for valid text length
        if (!text || text.length === 0 || text.length > 600) {
          setSelectionMenu(null);
          mouseDownInContent = false;
          return;
        }

        // Get the range and verify it's not collapsed
        const range = selection.getRangeAt(0);
        if (!range || range.collapsed) {
          setSelectionMenu(null);
          mouseDownInContent = false;
          return;
        }

        // Get bounding rect and verify it's valid
        const rect = range.getBoundingClientRect();
        if (!rect || (rect.width === 0 && rect.height === 0)) {
          setSelectionMenu(null);
          mouseDownInContent = false;
          return;
        }

        // Calculate position (above the selection)
        const menuTop = rect.top + window.scrollY - 60;
        const menuLeft = rect.left + window.scrollX + rect.width / 2;

        console.log('[Selection] Valid selection detected:', {
          text: text.substring(0, 30) + '...',
          length: text.length,
          position: { top: menuTop, left: menuLeft }
        });

        // All checks passed - show the menu
        setSelectionMenu({
          text,
          top: menuTop,
          left: menuLeft,
        });

        mouseDownInContent = false;
      }, 100); // Increased to 100ms for even more stability
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
    };
  }, []);

  // Clear selection menu and results when changing content view
  // (but keep the ability to select text in the new view)
  useEffect(() => {
    setSelectionMenu(null);
    setExplainResult(null);
    // Don't clear the actual browser selection - let user keep their highlight
  }, [contentView]);

  useEffect(() => {
    console.log('[MaterialDetailPage] personalizedExamples state changed:', personalizedExamples);
  }, [personalizedExamples]);

  useEffect(() => {
    console.log('[MaterialDetailPage] summary state changed:', summary);
  }, [summary]);

  useEffect(() => {
    console.log('[MaterialDetailPage] contentView changed to:', contentView);
  }, [contentView]);

  // Load reading mode preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('readingModePrefs');
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        setReadingMode(prev => ({ ...prev, ...prefs, active: false })); // Never auto-activate
      } catch (e) {
        console.error('Failed to parse reading mode prefs:', e);
      }
    }
  }, []);

  // Save reading mode preferences to localStorage
  useEffect(() => {
    const { active, ...prefs } = readingMode;
    localStorage.setItem('readingModePrefs', JSON.stringify(prefs));
  }, [readingMode]);

  // Handle reading ruler mouse move
  useEffect(() => {
    if (!readingMode.active || !readingMode.rulerEnabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      setRulerPosition(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [readingMode.active, readingMode.rulerEnabled]);

  // Handle ESC key to close reading mode
  useEffect(() => {
    if (!readingMode.active) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setReadingMode({ ...readingMode, active: false });
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [readingMode]);

  const withGeneration = async (
    mode: GenerationMode,
    generator: () => Promise<void>
  ) => {
    setIsGenerating((prev) => ({ ...prev, [mode]: true }));
    try {
      await generator();
    } catch (error) {
      console.error('AI generation error', error);
      setError('Kunde inte generera just nu. Försök igen om en stund.');
    } finally {
      setIsGenerating((prev) => ({ ...prev, [mode]: false }));
    }
  };

  const appendHistory = (entry: GenerationLogEntry) => {
    if (!material) return;
    const history = [...(material.generationHistory ?? []), entry];
    updateMaterial(material.id, { generationHistory: history });
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>, sectionKey: string) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setOpenSections(prev => ({ ...prev, [sectionKey]: true }));
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!material) return;
    await withGeneration('flashcards', async () => {
      const cards = await generateFlashcards(
        material.content,
        cardCount,
        difficulty,
        grade
      );

      await updateMaterial(material.id, {
        flashcards: cards.map((card) => ({
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

      // Öppna och scrolla till sektionen efter generering
      setTimeout(() => scrollToSection(flashcardsRef, 'flashcards'), 300);
    });
  };

  const handleGenerateQuiz = async () => {
    if (!material) return;
    await withGeneration('quiz', async () => {
      const questions = await generateQuestions(
        material.content,
        quizCount,
        difficulty,
        grade
      );

      await updateMaterial(material.id, {
        questions: questions.map((question) => ({
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

      // Öppna och scrolla till sektionen efter generering
      setTimeout(() => scrollToSection(quizRef, 'quiz'), 300);
    });
  };

  const handleGenerateConcepts = async () => {
    if (!material) return;
    await withGeneration('concepts', async () => {
      const concepts = await generateConcepts(material.content, {
        count: 10,
        grade,
      });

      await updateMaterial(material.id, {
        concepts: concepts.map((concept) => ({
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

      // Öppna och scrolla till sektionen efter generering
      setTimeout(() => scrollToSection(conceptsRef, 'concepts'), 300);
    });
  };

  const handleSimplify = async () => {
    if (!material) return;
    setIsSimplifying(true);
    setExplainResult(null);
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
  };

  const handleDeepen = async () => {
    if (!material) return;
    setIsDeepening(true);
    setExplainResult(null);
    try {
      const deepened = await deepenText(material.content, grade);
      await updateMaterial(material.id, {
        advancedContent: deepened,
        updatedAt: new Date(),
      });
      // Växla till fördjupad flik EFTER att innehållet är genererat
      setContentView('advanced');
    } catch (error) {
      console.error('Deepen error', error);
      setError('Kunde inte fördjupa texten just nu.');
    } finally {
      setIsDeepening(false);
    }
  };

  // handleTextMouseUp removed - now using global event listener instead

  const handleExplainSelection = async () => {
    if (!material || !selectionMenu) return;
    setIsExplaining(true);
    try {
      const result = await explainSelection(material.content, selectionMenu.text, grade);
      setExplainResult(result);

      // Add to explanation history
      setExplanationHistory(prev => [{
        id: crypto.randomUUID(),
        text: selectionMenu.text,
        explanation: result.explanation,
        definition: result.definition,
        example: result.example,
        timestamp: new Date(),
      }, ...prev]);

      setSelectionMenu(null);
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.error('Explain error', error);
      setError('Kunde inte förklara markeringen.');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleAddToGlossary = async () => {
    if (!material || !selectionMenu) return;
    setIsExplaining(true);
    try {
      const result = await explainSelection(material.content, selectionMenu.text, grade);
      const newEntry: GlossaryEntry = {
        id: crypto.randomUUID(),
        term: selectionMenu.text.trim(),
        definition: result.definition || result.explanation,
        example: result.example && result.example.trim() ? result.example : undefined,
        addedAt: new Date(),
      };

      // Use material.glossary directly to get the latest state
      const currentGlossary = material.glossary ?? [];
      await updateMaterial(material.id, {
        glossary: [...currentGlossary, newEntry],
        updatedAt: new Date(),
      });

      setExplainResult(result);
      setSelectionMenu(null);
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.error('Glossary error', error);
      setError('Kunde inte lägga till i ordlistan just nu.');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleOpenPersonalizedModal = () => {
    setIsPersonalizedModalOpen(true);
  };

  const handleGeneratePersonalizedExplanation = async (
    selectedInterests: string[],
    customContext?: string
  ) => {
    if (!material || !selectionMenu) return;

    try {
      const result = await generatePersonalizedExplanation(
        material.content,
        selectionMenu.text,
        selectedInterests,
        customContext,
        grade
      );
      setPersonalizedResult(result);
      setSelectionMenu(null);
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.error('Personalized explanation error', error);
      setError('Kunde inte generera personaliserad förklaring.');
      throw error;
    }
  };

  const handleGeneratePersonalizedExamples = async (
    selectedInterests: string[],
    customContext?: string
  ) => {
    if (!material) return;

    console.log('Generating personalized examples with interests:', selectedInterests, 'context:', customContext);
    setIsGeneratingExamples(true);
    try {
      const result = await generatePersonalizedExamples(
        material.content,
        selectedInterests,
        customContext,
        grade,
        3
      );
      console.log('Generated examples:', result);
      setPersonalizedExamples(result);
      console.log('State updated, personalizedExamples should now be:', result);
      // Switch to the tab AFTER data is set
      setTimeout(() => {
        console.log('Now switching to personalized-examples view');
        setContentView('personalized-examples');
      }, 100);
    } catch (error) {
      console.error('Personalized examples error', error);
      setError('Kunde inte generera personaliserade exempel.');
      // Don't throw - just continue
    } finally {
      setIsGeneratingExamples(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!material) return;

    console.log('Generating summary for material:', material.title);
    setIsGeneratingSummary(true);
    try {
      const result = await generateSummary(material.content, grade);
      console.log('Generated summary:', result);
      setSummary(result);
      setContentView('summary');
    } catch (error) {
      console.error('Summary error', error);
      setError('Kunde inte generera sammanfattning.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateNextSteps = async () => {
    if (!material) return;

    console.log('Generating next steps for material:', material.title);
    setIsGeneratingNextSteps(true);
    try {
      const result = await generateNextSteps(displayedContent, grade);
      console.log('Generated next steps:', result);
      setNextSteps(result);
    } catch (error) {
      console.error('Next steps error', error);
      setError('Kunde inte generera nästa steg.');
    } finally {
      setIsGeneratingNextSteps(false);
    }
  };

  const handleGenerateMaterialFromNextStep = async (topic: string, difficulty: 'easier' | 'same' | 'harder', title: string) => {
    if (!material) return;

    console.log('[MaterialDetailPage] Adding section from next step:', topic, difficulty);
    setIsGeneratingNextSteps(true);

    try {
      const result = await generateMaterial(topic, grade, difficulty);
      console.log('[MaterialDetailPage] Got result:', result);

      // Skapa ny sektion istället för nytt material
      const newSection = {
        id: crypto.randomUUID(),
        title: title,
        content: result.content,
        type: 'next-step' as const,
        difficulty: difficulty,
        addedAt: new Date(),
        collapsed: false,
      };

      // Lägg till sektionen till befintligt material
      const currentSections = material.additionalSections || [];
      await updateMaterial(material.id, {
        additionalSections: [...currentSections, newSection],
      });

      // Scrolla ner till den nya sektionen
      setTimeout(() => {
        const sectionElement = document.getElementById(`section-${newSection.id}`);
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      console.log('[MaterialDetailPage] Section added successfully');
    } catch (error) {
      console.error('[MaterialDetailPage] Error generating section from next step:', error);
      setError('Kunde inte generera ny sektion. Försök igen.');
    } finally {
      setIsGeneratingNextSteps(false);
    }
  };

  const handleAddNote = async (content: string, linkedText?: string) => {
    if (!material) return;
    const newNote: Note = {
      id: crypto.randomUUID(),
      content,
      linkedText,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const currentNotes = material.notes ?? [];
    await updateMaterial(material.id, {
      notes: [...currentNotes, newNote],
      updatedAt: new Date(),
    });
    // Clear the noteLinkedText after adding
    setNoteLinkedText(undefined);
  };

  const handleUpdateNote = async (noteId: string, content: string) => {
    if (!material) return;
    const currentNotes = material.notes ?? [];
    const updatedNotes = currentNotes.map(note =>
      note.id === noteId
        ? { ...note, content, updatedAt: new Date() }
        : note
    );
    await updateMaterial(material.id, {
      notes: updatedNotes,
      updatedAt: new Date(),
    });
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!material) return;
    const currentNotes = material.notes ?? [];
    const updatedNotes = currentNotes.filter(note => note.id !== noteId);
    await updateMaterial(material.id, {
      notes: updatedNotes,
      updatedAt: new Date(),
    });
  };

  const handleCreateNoteFromSelection = () => {
    if (!selectionMenu) return;
    // Store the selected text for the note
    setNoteLinkedText(selectionMenu.text);
    // Clear the selection menu
    setSelectionMenu(null);
    window.getSelection()?.removeAllRanges();
  };

  const simplifiedAvailable = Boolean(material?.simplifiedContent);
  const advancedAvailable = Boolean(material?.advancedContent);

  const contentForStats = useMemo(() => {
    if (displayedContent.trim()) {
      return displayedContent;
    }
    return material?.content ?? '';
  }, [displayedContent, material?.content]);

  const wordCount = useMemo(() => {
    if (!contentForStats.trim()) {
      return 0;
    }
    return contentForStats
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }, [contentForStats]);

  const readingMinutes = wordCount ? Math.max(1, Math.round(wordCount / 140)) : 0;

  if (!material) {
    return (
      <MainLayout title="Material" showBottomNav={false}>
        <div className="py-12">
          <Card className="max-w-md mx-auto text-center space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Materialet kunde inte hittas
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Det verkar som att materialet har tagits bort eller inte finns tillgängligt längre.
            </p>
            <Button onClick={() => navigate('/study')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka till studier
            </Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const updatedAtDate =
    material.updatedAt instanceof Date ? material.updatedAt : new Date(material.updatedAt);
  const historyEntries = [...(material.generationHistory ?? [])].reverse();

  return (
    <MainLayout title={material.title} showBottomNav={false}>
      <div className="py-6 space-y-6">
        {/* Gradient Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white rounded-3xl px-6 py-8 shadow-lg relative overflow-hidden mb-6"
        >
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl" />

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/study')}
              className="mb-4 text-white hover:bg-white/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka
            </Button>

            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {material.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium">
                <GraduationCap className="h-4 w-4" />
                {subjectLabels[material.subject]}
              </span>
              {material.tags.length > 0 && material.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
              <span className="flex items-center gap-1.5">
                📅 {updatedAtDate.toLocaleDateString('sv-SE', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                📝 {wordCount} ord
              </span>
              {readingMinutes > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    ⏱️ ≈ {readingMinutes} min
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        <div className="flex gap-6 relative">
          {/* Main Content Area */}
          <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:mr-0' : ''}`}>
          <Card className="relative space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Läs materialet
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Växla mellan original, förenklad och fördjupad version. Markera ord eller meningar för att få en förklaring eller lägga till i ordlistan.
              </p>
            </div>

            <Tabs.Root
              value={contentView}
              onValueChange={(value) => setContentView(value as ContentView)}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <Tabs.List className="inline-flex items-center rounded-2xl bg-gray-100 dark:bg-gray-800 p-1 flex-wrap gap-1">
                  <Tabs.Trigger
                    value="original"
                    className="px-4 py-2 text-sm font-medium rounded-2xl data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow data-[state=active]:text-primary-600 transition-colors"
                  >
                    Original
                  </Tabs.Trigger>
                <Tabs.Trigger
                  value="simplified"
                  className="px-4 py-2 text-sm font-medium rounded-2xl data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow data-[state=active]:text-primary-600 transition-colors"
                >
                  Förenklad
                  {!simplifiedAvailable && !isSimplifying && (
                    <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-primary-500" />
                  )}
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="advanced"
                  className="px-4 py-2 text-sm font-medium rounded-2xl data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow data-[state=active]:text-primary-600 transition-colors"
                >
                  Fördjupad
                  {!advancedAvailable && !isDeepening && (
                    <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-primary-500" />
                  )}
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="personalized-examples"
                  className="px-4 py-2 text-sm font-medium rounded-2xl data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow data-[state=active]:text-primary-600 transition-colors"
                >
                  Personaliserade Exempel
                  {!personalizedExamples && !isGeneratingExamples && (
                    <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-orange-500" />
                  )}
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="summary"
                  className="px-4 py-2 text-sm font-medium rounded-2xl data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow data-[state=active]:text-primary-600 transition-colors"
                >
                  Sammanfattning
                  {!summary && !isGeneratingSummary && (
                    <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </Tabs.Trigger>
              </Tabs.List>

              {/* Läsläge-knapp */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReadingMode({ ...readingMode, active: true })}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                title="Läsläge - Ta bort distraktioner"
              >
                <BookOpen className="h-4 w-4" />
              </Button>
            </div>

              <div className="mt-4">
                <Tabs.Content value="original">
                  <div
                    ref={contentRef}
                    data-content-area
                    className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-inner min-h-[320px]"
                  >
                    <MarkdownContent value={material.content} />
                  </div>
                </Tabs.Content>

                <Tabs.Content value="simplified">
                  <div
                    ref={contentRef}
                    data-content-area
                    className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-inner min-h-[320px]"
                  >
                    {simplifiedAvailable ? (
                      <MarkdownContent value={material.simplifiedContent!} />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 text-center text-gray-500 dark:text-gray-400">
                        <Sparkles className="h-10 w-10 text-primary-500" />
                        <div>
                          <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            Ingen förenklad text ännu
                          </h3>
                          <p className="text-sm">
                            Skapa en version med enklare ord och tydliga förklaringar utan att förkorta texten i onödan.
                          </p>
                        </div>
                        <Button size="sm" onClick={handleSimplify} isLoading={isSimplifying}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Förenkla texten
                        </Button>
                      </div>
                    )}
                  </div>
                </Tabs.Content>

                <Tabs.Content value="advanced">
                  <div
                    ref={contentRef}
                    data-content-area
                    className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-inner min-h-[320px]"
                  >
                    {advancedAvailable ? (
                      <MarkdownContent value={material.advancedContent!} />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 text-center text-gray-500 dark:text-gray-400">
                        <Brain className="h-10 w-10 text-primary-500" />
                        <div>
                          <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            Ingen fördjupad text ännu
                          </h3>
                          <p className="text-sm">
                            Lägg till mer bakgrund, exempel och sammanhang för att stötta elever som vill veta mer.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleDeepen}
                          isLoading={isDeepening}
                        >
                          <Brain className="mr-2 h-4 w-4" />
                          Fördjupa texten
                        </Button>
                      </div>
                    )}
                  </div>
                </Tabs.Content>

                <Tabs.Content value="personalized-examples">
                  <div data-content-area className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-inner min-h-[320px]">
                    {personalizedExamples ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Lightbulb className="h-5 w-5 text-orange-500" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Exempel anpassade för dig
                          </h3>
                        </div>
                        {personalizedExamples.examples.map((example, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 p-4 space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">
                                {idx + 1}
                              </span>
                              <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                                {example.title}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {example.description}
                            </p>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mt-2">
                              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                {example.context}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 text-center text-gray-500 dark:text-gray-400">
                        <Lightbulb className="h-10 w-10 text-orange-500" />
                        <div>
                          <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            Inga personaliserade exempel ännu
                          </h3>
                          <p className="text-sm">
                            Skapa exempel baserade på dina intressen för att lättare förstå materialet.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setIsPersonalizedExamplesModalOpen(true)}
                          isLoading={isGeneratingExamples}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        >
                          <Lightbulb className="mr-2 h-4 w-4" />
                          Skapa personaliserade exempel
                        </Button>
                      </div>
                    )}
                  </div>
                </Tabs.Content>

                <Tabs.Content value="summary">
                  <div data-content-area className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-inner min-h-[320px]">
                    {summary ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Sammanfattning
                          </h3>
                        </div>
                        <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 p-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {summary.summary}
                          </p>
                        </div>
                        {summary.keyPoints && summary.keyPoints.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <span className="w-1 h-4 bg-blue-500 rounded-full" />
                              Viktiga punkter:
                            </h4>
                            <ul className="space-y-2">
                              {summary.keyPoints.map((point, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                                >
                                  <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold mt-0.5">
                                    {idx + 1}
                                  </span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {summary.mainIdeas && summary.mainIdeas.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <span className="w-1 h-4 bg-indigo-500 rounded-full" />
                              Huvudidéer:
                            </h4>
                            <div className="space-y-2">
                              {summary.mainIdeas.map((idea, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3"
                                >
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{idea}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 text-center text-gray-500 dark:text-gray-400">
                        <FileText className="h-10 w-10 text-blue-500" />
                        <div>
                          <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            Ingen sammanfattning ännu
                          </h3>
                          <p className="text-sm">
                            Skapa en sammanfattning med viktiga punkter och huvudidéer.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleGenerateSummary}
                          isLoading={isGeneratingSummary}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Skapa sammanfattning
                        </Button>
                      </div>
                    )}
                  </div>
                </Tabs.Content>
              </div>
            </Tabs.Root>
          </Card>
          </div>

          {/* Collapsible Sidebar */}
          {/* Desktop Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{
              opacity: 1,
              x: 0,
              width: isSidebarOpen ? '400px' : '0px'
            }}
            transition={{ duration: 0.3 }}
            className={`hidden lg:block sticky top-6 h-fit ${isSidebarOpen ? '' : 'overflow-hidden'}`}
          >
            {isSidebarOpen && (
              <>
                {/* Toggle Button - Stäng */}
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="absolute -left-4 top-4 z-10 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                  aria-label="Stäng sidopanel"
                  title="Stäng sidopanel"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div className="space-y-4">
                {/* Explanations Section */}
                <Card className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      Förklaringar
                    </h3>
                    {explanationHistory.length > 0 && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                        {explanationHistory.length}
                      </span>
                    )}
                  </div>
                  {explanationHistory.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {explanationHistory.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 p-3 space-y-2"
                        >
                          <div className="font-semibold text-sm text-gray-900 dark:text-white">
                            &quot;{item.text}&quot;
                          </div>
                          <p className="text-xs text-gray-700 dark:text-gray-300">
                            {item.explanation}
                          </p>
                          {item.definition && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Definition:</span> {item.definition}
                            </p>
                          )}
                          {item.example && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                              Exempel: {item.example}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-600">
                            {new Date(item.timestamp).toLocaleTimeString('sv-SE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Markera text och välj &quot;Förklara&quot; för att få förklaringar här.
                    </p>
                  )}
                </Card>

                {/* Glossary Section */}
                <Card className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary-500" />
                      Ordlista
                    </h3>
                    {glossaryEntries.length > 0 && (
                      <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full">
                        {glossaryEntries.length}
                      </span>
                    )}
                  </div>
                  {glossaryEntries.length > 0 ? (
                    <dl className="space-y-3 max-h-96 overflow-y-auto">
                      {glossaryEntries.map((entry) => (
                        <div key={entry.id} className="rounded-xl bg-gray-100 dark:bg-gray-800 px-3 py-2">
                          <dt className="text-sm font-semibold text-gray-900 dark:text-white">
                            {entry.term}
                          </dt>
                          <dd className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {entry.definition}
                            {entry.example && (
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                                Exempel: {entry.example}
                              </p>
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Markera text och välj &quot;Lägg till i ordlistan&quot; för att spara ord här.
                    </p>
                  )}
                </Card>

                {/* Notes Section */}
                <Card className="space-y-3">
                  <NotesSection
                    notes={material.notes ?? []}
                    onAddNote={handleAddNote}
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                    selectedText={noteLinkedText}
                  />
                </Card>

                {/* Old AI Section - keeping for now */}
                <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <Card className="space-y-4 relative overflow-hidden">
                {/* Decorative gradient background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl" />

                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        AI-stöd
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Generera studiematerial automatiskt
                  </p>
                </div>

              <div className="space-y-3">
                {/* Status översikt */}
                <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                  {material.flashcards.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <CheckCircle2 size={12} />
                      {material.flashcards.length} kort
                    </span>
                  )}
                  {material.questions.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      <CheckCircle2 size={12} />
                      {material.questions.length} frågor
                    </span>
                  )}
                  {material.concepts.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      <CheckCircle2 size={12} />
                      {material.concepts.length} begrepp
                    </span>
                  )}
                </div>

                <div>
                  <label className="flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-300">
                    Svårighetsgrad
                    <span className="text-xs text-gray-400">
                      {difficulty === 'easy'
                        ? 'Lätt'
                        : difficulty === 'medium'
                        ? 'Lagom'
                        : 'Utmanande'}
                    </span>
                  </label>
                  <select
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                    className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  >
                    <option value="easy">Lätt</option>
                    <option value="medium">Lagom</option>
                    <option value="hard">Utmanande</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Flashcards ({cardCount})
                    </label>
                    <input
                      type="range"
                      min={4}
                      max={20}
                      step={2}
                      value={cardCount}
                      onChange={(event) => setCardCount(Number(event.target.value))}
                      className="mt-1 w-full"
                    />
                    {material.flashcards.length === 0 ? (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          className="mt-2 w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg"
                          size="sm"
                          onClick={handleGenerateFlashcards}
                          isLoading={isGenerating.flashcards}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Flashcards
                        </Button>
                      </motion.div>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                          <Button
                            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg"
                            size="sm"
                            onClick={() => scrollToSection(flashcardsRef, 'flashcards')}
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Öppna ({material.flashcards.length})
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            className="bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white shadow"
                            size="sm"
                            variant="outline"
                            onClick={handleGenerateFlashcards}
                            isLoading={isGenerating.flashcards}
                          >
                            +{cardCount}
                          </Button>
                        </motion.div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Quizfrågor ({quizCount})
                    </label>
                    <input
                      type="range"
                      min={3}
                      max={10}
                      step={1}
                      value={quizCount}
                      onChange={(event) => setQuizCount(Number(event.target.value))}
                      className="mt-1 w-full"
                    />
                    {material.questions.length === 0 ? (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          className="mt-2 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                          size="sm"
                          onClick={handleGenerateQuiz}
                          isLoading={isGenerating.quiz}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Skapa quizfrågor
                        </Button>
                      </motion.div>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                          <Button
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                            size="sm"
                            onClick={() => scrollToSection(quizRef, 'quiz')}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Starta ({material.questions.length})
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            className="bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white shadow"
                            size="sm"
                            variant="outline"
                            onClick={handleGenerateQuiz}
                            isLoading={isGenerating.quiz}
                          >
                            +{quizCount}
                          </Button>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </div>

                {material.concepts.length === 0 ? (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
                      size="sm"
                      onClick={handleGenerateConcepts}
                      isLoading={isGenerating.concepts}
                    >
                      <Brain className="mr-2 h-4 w-4" />
                      Hitta viktiga ord i texten
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
                      size="sm"
                      onClick={() => scrollToSection(conceptsRef, 'concepts')}
                    >
                      <Brain className="mr-2 h-4 w-4" />
                      Visa begrepp ({material.concepts.length})
                    </Button>
                  </motion.div>
                )}

                <Link
                  to={`/study/material/${material.id}/chat`}
                  className="block"
                >
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg" size="sm">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chatta om materialet
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </Card>

              {historyEntries.length > 0 && (
                <Card className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Senaste genereringar
                    </h3>
                    <History className="h-5 w-5 text-primary-500" />
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    {historyEntries.slice(0, 3).map((entry) => {
                      const createdAt =
                        entry.createdAt instanceof Date
                          ? entry.createdAt
                          : new Date(entry.createdAt);
                      return (
                        <li
                          key={entry.id}
                          className="flex justify-between rounded-xl bg-gray-100 dark:bg-gray-800 px-3 py-2"
                        >
                          <span className="font-medium">
                            {entry.type === 'flashcards'
                              ? 'Flashcards'
                              : entry.type === 'quiz'
                              ? 'Quiz'
                              : 'Begrepp'}{' '}
                            ({entry.count})
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {createdAt.toLocaleDateString('sv-SE', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              )}
            </motion.div>
                </div>
              </div>
              </>
            )}
          </motion.div>

          {/* Floating Toggle Button - Öppna (when sidebar is closed) - Desktop Only */}
          {!isSidebarOpen && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              onClick={() => setIsSidebarOpen(true)}
              className="hidden lg:flex fixed right-6 top-24 z-50 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all items-center justify-center group"
              aria-label="Öppna sidopanel"
              title="Visa förklaringar, ordlista och anteckningar"
            >
              <ChevronLeft className="h-5 w-5" />
              {/* Pulsing indicator */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
              </span>
            </motion.button>
          )}

          {/* Mobile Floating Action Button - Opens AI Drawer */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden fixed bottom-20 right-6 z-40 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full shadow-2xl hover:shadow-3xl active:scale-95 transition-all flex items-center justify-center group"
            aria-label="Öppna AI-verktyg"
          >
            <Sparkles className="h-7 w-7" />
            {/* Badge for available features */}
            {(material.flashcards.length === 0 || material.questions.length === 0 || material.concepts.length === 0) && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-pink-500 items-center justify-center text-xs font-bold">
                  !
                </span>
              </span>
            )}
          </motion.button>

          {/* Mobile Drawer - Bottom Sheet Style */}
          {isMobileDrawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              />

              {/* Drawer */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
              >
                {/* Drag Handle */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 pt-3 pb-2 px-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          AI-verktyg
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Generera studiematerial
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Status Overview */}
                  <div className="flex flex-wrap gap-2">
                    {material.flashcards.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">
                        <CheckCircle2 size={14} />
                        {material.flashcards.length} flashcards
                      </span>
                    )}
                    {material.questions.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium">
                        <CheckCircle2 size={14} />
                        {material.questions.length} quizfrågor
                      </span>
                    )}
                    {material.concepts.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium">
                        <CheckCircle2 size={14} />
                        {material.concepts.length} begrepp
                      </span>
                    )}
                  </div>

                  {/* Difficulty Selector */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Svårighetsgrad
                      <span className="text-xs px-2 py-1 rounded-full bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                        {difficulty === 'easy' ? '🟢 Lätt' : difficulty === 'medium' ? '🟡 Lagom' : '🔴 Utmanande'}
                      </span>
                    </label>
                    <select
                      value={difficulty}
                      onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium"
                    >
                      <option value="easy">🟢 Lätt</option>
                      <option value="medium">🟡 Lagom</option>
                      <option value="hard">🔴 Utmanande</option>
                    </select>
                  </div>

                  {/* Flashcards Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        ⚡ Flashcards
                      </label>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{cardCount} kort</span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={20}
                      step={2}
                      value={cardCount}
                      onChange={(event) => setCardCount(Number(event.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    {material.flashcards.length === 0 ? (
                      <Button
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg"
                        onClick={() => {
                          handleGenerateFlashcards();
                          setIsMobileDrawerOpen(false);
                        }}
                        isLoading={isGenerating.flashcards}
                      >
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generera Flashcards
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg"
                          onClick={() => {
                            scrollToSection(flashcardsRef, 'flashcards');
                            setIsMobileDrawerOpen(false);
                          }}
                        >
                          <Sparkles className="mr-2 h-5 w-5" />
                          Öppna ({material.flashcards.length})
                        </Button>
                        <Button
                          className="bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white shadow"
                          onClick={handleGenerateFlashcards}
                          isLoading={isGenerating.flashcards}
                        >
                          +{cardCount}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Quiz Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        💬 Quizfrågor
                      </label>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{quizCount} frågor</span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={10}
                      step={1}
                      value={quizCount}
                      onChange={(event) => setQuizCount(Number(event.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    {material.questions.length === 0 ? (
                      <Button
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                        onClick={() => {
                          handleGenerateQuiz();
                          setIsMobileDrawerOpen(false);
                        }}
                        isLoading={isGenerating.quiz}
                      >
                        <MessageSquare className="mr-2 h-5 w-5" />
                        Skapa Quizfrågor
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                          onClick={() => {
                            scrollToSection(quizRef, 'quiz');
                            setIsMobileDrawerOpen(false);
                          }}
                        >
                          <MessageSquare className="mr-2 h-5 w-5" />
                          Starta ({material.questions.length})
                        </Button>
                        <Button
                          className="bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white shadow"
                          onClick={handleGenerateQuiz}
                          isLoading={isGenerating.quiz}
                        >
                          +{quizCount}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Concepts Section */}
                  <div className="space-y-2">
                    {material.concepts.length === 0 ? (
                      <Button
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
                        onClick={() => {
                          handleGenerateConcepts();
                          setIsMobileDrawerOpen(false);
                        }}
                        isLoading={isGenerating.concepts}
                      >
                        <Brain className="mr-2 h-5 w-5" />
                        Hitta Viktiga Ord
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
                        onClick={() => {
                          scrollToSection(conceptsRef, 'concepts');
                          setIsMobileDrawerOpen(false);
                        }}
                      >
                        <Brain className="mr-2 h-5 w-5" />
                        Visa Begrepp ({material.concepts.length})
                      </Button>
                    )}
                  </div>

                  {/* Chat Button */}
                  <Link
                    to={`/study/material/${material.id}/chat`}
                    className="block"
                    onClick={() => setIsMobileDrawerOpen(false)}
                  >
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Chatta om Materialet
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </div>

        {explainResult && (
          <Card className="space-y-2 border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/10 relative" data-content-area>
            <button
              onClick={() => setExplainResult(null)}
              className="absolute top-2 right-2 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Stäng förklaring"
            >
              <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white pr-8">
              Förklaring av din markering
            </h3>
            {explainResult.explanation && (
              <p className="text-sm text-gray-700 dark:text-gray-300">{explainResult.explanation}</p>
            )}
            {explainResult.definition && (
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Definition: <span className="font-normal">{explainResult.definition}</span>
              </p>
            )}
            {explainResult.example && explainResult.example.trim() && (
              <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                Exempel: {explainResult.example}
              </p>
            )}
          </Card>
        )}

        {/* Genererat innehåll - Flashcards */}
        {material.flashcards.length > 0 && (
          <motion.div
            ref={flashcardsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="scroll-mt-6"
          >
            <Collapsible.Root
              open={openSections.flashcards}
              onOpenChange={(open) => setOpenSections(prev => ({ ...prev, flashcards: open }))}
            >
              <Card className="space-y-4 relative overflow-hidden">
                {/* Gradient decoration */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl" />

                <Collapsible.Trigger className="flex w-full items-center justify-between group relative">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Flashcards
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {material.flashcards.length} kort redo att övas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Genererat
                    </span>
                    {openSections.flashcards ? (
                      <ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    )}
                  </div>
                </Collapsible.Trigger>

                <Collapsible.Content>
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {material.flashcards.slice(0, 6).map((card) => (
                        <div
                          key={card.id}
                          className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-2"
                        >
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {card.front}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {card.back}
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              card.difficulty === 'easy'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : card.difficulty === 'medium'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {card.difficulty === 'easy' ? 'Lätt' : card.difficulty === 'medium' ? 'Lagom' : 'Utmanande'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {material.flashcards.length > 6 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        ...och {material.flashcards.length - 6} kort till
                      </p>
                    )}
                    <Link to={`/study/flashcards/${material.id}`}>
                      <Button className="w-full" size="sm">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Öppna alla flashcards ({material.flashcards.length})
                      </Button>
                    </Link>
                  </div>
                </Collapsible.Content>
              </Card>
            </Collapsible.Root>
          </motion.div>
        )}

        {/* Genererat innehåll - Quiz */}
        {material.questions.length > 0 && (
          <motion.div
            ref={quizRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="scroll-mt-6"
          >
            <Collapsible.Root
              open={openSections.quiz}
              onOpenChange={(open) => setOpenSections(prev => ({ ...prev, quiz: open }))}
            >
              <Card className="space-y-4 relative overflow-hidden">
                {/* Gradient decoration */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl" />

                <Collapsible.Trigger className="flex w-full items-center justify-between group relative">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Quizfrågor
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {material.questions.length} frågor att testa
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Genererat
                    </span>
                    {openSections.quiz ? (
                      <ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    )}
                  </div>
                </Collapsible.Trigger>

                <Collapsible.Content>
                  <div className="space-y-3 pt-2">
                    <div className="space-y-3">
                      {material.questions.slice(0, 3).map((question, index) => (
                        <div
                          key={question.id}
                          className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-2"
                        >
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-xs font-bold">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {question.question}
                              </div>
                              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                                ✓ {question.correctAnswer}
                              </div>
                              <div className="flex items-center gap-2 pt-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  question.difficulty === 'easy'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                    : question.difficulty === 'medium'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                }`}>
                                  {question.difficulty === 'easy' ? 'Lätt' : question.difficulty === 'medium' ? 'Lagom' : 'Utmanande'}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                  {question.type === 'multiple-choice' ? 'Flerval' :
                                   question.type === 'true-false' ? 'Sant/Falskt' :
                                   question.type === 'fill-blank' ? 'Fyll i' : 'Matcha par'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {material.questions.length > 3 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        ...och {material.questions.length - 3} frågor till
                      </p>
                    )}
                    <Link to={`/study/quiz/${material.id}`}>
                      <Button className="w-full" size="sm" variant="secondary">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Starta quiz ({material.questions.length} frågor)
                      </Button>
                    </Link>
                  </div>
                </Collapsible.Content>
              </Card>
            </Collapsible.Root>
          </motion.div>
        )}

        {/* Genererat innehåll - Nyckelbegrepp */}
        {material.concepts.length > 0 && (
          <div ref={conceptsRef} className="scroll-mt-6">
            <Collapsible.Root
              open={openSections.concepts}
              onOpenChange={(open) => setOpenSections(prev => ({ ...prev, concepts: open }))}
            >
              <Card className="space-y-4">
                <Collapsible.Trigger className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/40 p-2">
                      <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Nyckelbegrepp
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {material.concepts.length} begrepp identifierade
                      </p>
                    </div>
                  </div>
                  {openSections.concepts ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </Collapsible.Trigger>

                <Collapsible.Content>
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 gap-3">
                      {material.concepts.map((concept) => (
                        <div
                          key={concept.id}
                          className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-2"
                        >
                          <div className="text-base font-semibold text-gray-900 dark:text-white">
                            {concept.term}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {concept.definition}
                          </div>
                          {concept.examples && concept.examples.length > 0 && (
                            <div className="pt-2 space-y-1">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Exempel:
                              </div>
                              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                {concept.examples.map((example, idx) => (
                                  <li key={idx}>{example}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <Link to={`/study/concepts/${material.id}`}>
                      <Button className="w-full" size="sm" variant="outline">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Utforska alla begrepp
                      </Button>
                    </Link>
                  </div>
                </Collapsible.Content>
              </Card>
            </Collapsible.Root>
          </div>
        )}
      </div>

      {selectionMenu && (
        <div
          className="fixed z-50 transform -translate-x-1/2"
          style={{
            top: `${selectionMenu.top}px`,
            left: `${selectionMenu.left}px`
          }}
        >
          <Card className="flex items-center gap-2 px-3 py-2 shadow-xl border-2 border-primary-500" padding="none">
            <Button size="sm" variant="ghost" onClick={handleExplainSelection} isLoading={isExplaining}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Förklara
            </Button>
            <Button size="sm" variant="ghost" onClick={handleAddToGlossary} isLoading={isExplaining}>
              <GraduationCap className="mr-2 h-4 w-4" />
              Lägg till i ordlista
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCreateNoteFromSelection} className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
              <StickyNote className="mr-2 h-4 w-4 text-blue-500" />
              Anteckna om detta
            </Button>
            <Button size="sm" variant="ghost" onClick={handleOpenPersonalizedModal} className="bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20">
              <Heart className="mr-2 h-4 w-4 text-pink-500" />
              Personlig förklaring
            </Button>
          </Card>
        </div>
      )}

      {/* Personalized Explanation Modal */}
      <PersonalizedExplanationModal
        isOpen={isPersonalizedModalOpen}
        onClose={() => setIsPersonalizedModalOpen(false)}
        onGenerate={handleGeneratePersonalizedExplanation}
        userInterests={user?.interests || []}
        selectedText={selectionMenu?.text || ''}
      />

      {/* Personalized Examples Modal */}
      <PersonalizedExamplesModal
        isOpen={isPersonalizedExamplesModalOpen}
        onClose={() => setIsPersonalizedExamplesModalOpen(false)}
        onGenerate={handleGeneratePersonalizedExamples}
        userInterests={user?.interests || []}
      />

      {/* Personalized Explanation Result */}
      {personalizedResult && (
        <Card className="space-y-3 border-l-4 border-pink-500 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10" data-content-area>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Personlig Förklaring
            </h3>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{personalizedResult.explanation}</p>
          {personalizedResult.analogy && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Jämförelse:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">{personalizedResult.analogy}</p>
            </div>
          )}
          {personalizedResult.examples && personalizedResult.examples.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Exempel:</p>
              <ul className="list-disc list-inside space-y-1">
                {personalizedResult.examples.map((example, idx) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">{example}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Additional Sections - "Läs mer" content */}
      {material?.additionalSections && material.additionalSections.length > 0 && (
        <div className="space-y-4 mt-6">
          {material.additionalSections.map((section) => {
            const difficultyConfig = {
              easier: { icon: '📘', color: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20', border: 'border-l-4 border-blue-400', badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
              same: { icon: '📗', color: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20', border: 'border-l-4 border-green-400', badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
              harder: { icon: '📕', color: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20', border: 'border-l-4 border-orange-400', badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
            };
            const config = difficultyConfig[section.difficulty];

            return (
              <Card
                key={section.id}
                id={`section-${section.id}`}
                className={`bg-gradient-to-r ${config.color} ${config.border} transition-all`}
                data-content-area
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {section.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${config.badge}`}>
                          {section.difficulty === 'easier' && 'Enklare nivå'}
                          {section.difficulty === 'same' && 'Samma nivå'}
                          {section.difficulty === 'harder' && 'Fördjupning'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Tillagd {new Date(section.addedAt).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const updatedSections = material.additionalSections!.map((s) =>
                        s.id === section.id ? { ...s, collapsed: !s.collapsed } : s
                      );
                      updateMaterial(material.id, { additionalSections: updatedSections });
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    aria-label={section.collapsed ? 'Visa sektion' : 'Dölj sektion'}
                  >
                    {section.collapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                  </button>
                </div>

                {!section.collapsed && (
                  <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {section.content}
                    </ReactMarkdown>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Next Steps Section */}
      <Card className="mt-8 space-y-4 border-t-4 border-gradient-to-r from-green-500 to-teal-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Vill du lära dig mer?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upptäck relaterade ämnen och nästa steg
              </p>
            </div>
          </div>
          {!nextSteps && (
            <Button
              onClick={handleGenerateNextSteps}
              isLoading={isGeneratingNextSteps}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white w-full sm:w-auto"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Visa nästa steg
            </Button>
          )}
        </div>

        {nextSteps && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
              {nextSteps.introduction}
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              {nextSteps.suggestions.map((suggestion, idx) => {
                const difficultyConfig = {
                  easier: { icon: '📘', color: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20', border: 'border-blue-200 dark:border-blue-800' },
                  same: { icon: '📗', color: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20', border: 'border-green-200 dark:border-green-800' },
                  harder: { icon: '📕', color: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20', border: 'border-orange-200 dark:border-orange-800' },
                };
                const config = difficultyConfig[suggestion.difficulty];

                return (
                  <button
                    key={idx}
                    className={`rounded-lg bg-gradient-to-r ${config.color} border ${config.border} p-4 space-y-2 hover:shadow-lg transition-all cursor-pointer text-left w-full disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105`}
                    onClick={() => handleGenerateMaterialFromNextStep(suggestion.topic, suggestion.difficulty, suggestion.title)}
                    disabled={isGeneratingNextSteps}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">{config.icon}</span>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                          {suggestion.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {suggestion.description}
                        </p>
                        {isGeneratingNextSteps && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Lägger till sektion...
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Reading Mode Overlay */}
      {readingMode.active && (
        <div
          className="fixed inset-0 z-[100] overflow-auto"
          style={{
            backgroundColor:
              readingMode.contrast === 'white'
                ? '#ffffff'
                : readingMode.contrast === 'black'
                ? '#1a1a1a'
                : '#f5f5dc', // sepia
          }}
        >
          <ReadingModeToolbar
            settings={readingMode}
            onSettingsChange={setReadingMode}
            onClose={() => setReadingMode({ ...readingMode, active: false })}
          />

          <div className="pt-20 pb-16 px-4">
            <div
              className="max-w-4xl mx-auto"
              style={{
                fontSize: `${readingMode.fontSize}px`,
                lineHeight: readingMode.lineHeight,
                fontFamily:
                  readingMode.fontFamily === 'dyslexic'
                    ? 'OpenDyslexic, Arial, sans-serif'
                    : 'inherit',
                letterSpacing: `${readingMode.letterSpacing}em`,
                wordSpacing: `${readingMode.wordSpacing}em`,
                color: readingMode.contrast === 'black' ? '#ffffff' : '#000000',
              }}
            >
              <h1 className="text-2xl font-bold mb-6">{material.title}</h1>
              <MarkdownContent value={displayedContent} />
            </div>
          </div>

          <ReadingRuler
            enabled={readingMode.rulerEnabled}
            color={readingMode.rulerColor}
            position={rulerPosition}
          />
        </div>
      )}
    </MainLayout>
  );


}
