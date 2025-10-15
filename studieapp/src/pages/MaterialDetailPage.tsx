import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAppStore } from '../store/appStore';
import {
  generateFlashcards,
  generateQuestions,
  generateConcepts,
  simplifyText,
  deepenText,
  explainSelection,
  type ExplainSelectionResponse,
} from '../services/aiService';
import type { Difficulty, GenerationLogEntry, GlossaryEntry, Material } from '../types';

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
type ContentView = 'original' | 'simplified' | 'advanced';

type SelectionMenuState = {
  text: string;
  top: number;
  left: number;
};

function MarkdownContent({ value }: { value: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose dark:prose-invert max-w-none text-sm leading-relaxed prose-p:mb-3 last:prose-p:mb-0"
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-6 mb-3">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-6 mb-3">{children}</ol>,
        code: ({ children }) => (
          <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="p-3 rounded-xl bg-gray-100 dark:bg-gray-900 text-xs overflow-x-auto">
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
  const contentRef = useRef<HTMLDivElement | null>(null);
  const flashcardsRef = useRef<HTMLDivElement | null>(null);
  const quizRef = useRef<HTMLDivElement | null>(null);
  const conceptsRef = useRef<HTMLDivElement | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    flashcards: false,
    quiz: false,
    concepts: false,
  });

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
    const handleScroll = () => setSelectionMenu(null);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  useEffect(() => {
    setSelectionMenu(null);
    setExplainResult(null);
    window.getSelection()?.removeAllRanges();
  }, [contentView]);

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
      const concepts = await generateConcepts(material.content, 10, grade);

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
      setContentView('advanced');
    } catch (error) {
      console.error('Deepen error', error);
      setError('Kunde inte fördjupa texten just nu.');
    } finally {
      setIsDeepening(false);
    }
  };

  const handleTextMouseUp = () => {
    const selection = window.getSelection();
    if (!selection) {
      setSelectionMenu(null);
      return;
    }
    const text = selection.toString().trim();
    if (!text || text.length > 600) {
      setSelectionMenu(null);
      return;
    }
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (!range) return;
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      setSelectionMenu(null);
      return;
    }
    setSelectionMenu({
      text,
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX + rect.width / 2,
    });
  };

  const handleExplainSelection = async () => {
    if (!material || !selectionMenu) return;
    setIsExplaining(true);
    try {
      const result = await explainSelection(material.content, selectionMenu.text, grade);
      setExplainResult(result);
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
      await updateMaterial(material.id, {
        glossary: [...glossaryEntries, newEntry],
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

  const simplifiedAvailable = Boolean(material?.simplifiedContent);
  const advancedAvailable = Boolean(material?.advancedContent);
  const versionLabels: Record<ContentView, string> = {
    original: 'Original',
    simplified: 'Förenklad',
    advanced: 'Fördjupad',
  };

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
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/study')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka
            </Button>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200 px-3 py-1 text-sm">
              <GraduationCap className="h-4 w-4" />
              {subjectLabels[material.subject]}
            </span>
            {material.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {material.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-gray-200 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Uppdaterad{' '}
              {updatedAtDate.toLocaleDateString('sv-SE', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span>•</span>
            <span>{wordCount} ord</span>
            {readingMinutes > 0 && (
              <>
                <span>•</span>
                <span>≈ {readingMinutes} min lästid</span>
              </>
            )}
            <span>•</span>
            <span>Visar: {versionLabels[contentView]}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <Card className="relative space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Läs materialet
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Växla mellan original, förenklad och fördjupad version. Markera ord eller meningar för att få en förklaring eller lägga till i ordlistan.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={handleSimplify}
                  isLoading={isSimplifying}
                  disabled={isSimplifying}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Skapa förenklad
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeepen}
                  isLoading={isDeepening}
                  disabled={isDeepening}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Skapa fördjupad
                </Button>
              </div>
            </div>

            <Tabs.Root
              value={contentView}
              onValueChange={(value) => setContentView(value as ContentView)}
            >
              <Tabs.List className="inline-flex items-center rounded-2xl bg-gray-100 dark:bg-gray-800 p-1">
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
              </Tabs.List>

              <div className="mt-4">
                <Tabs.Content value="original">
                  <div
                    ref={contentRef}
                    onMouseUp={handleTextMouseUp}
                    className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-inner min-h-[320px]"
                  >
                    <MarkdownContent value={material.content} />
                  </div>
                </Tabs.Content>

                <Tabs.Content value="simplified">
                  <div
                    ref={contentRef}
                    onMouseUp={handleTextMouseUp}
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
                    onMouseUp={handleTextMouseUp}
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
              </div>
            </Tabs.Root>
          </Card>

          <div className="space-y-4">
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  AI-stöd
                </h3>
                <Sparkles className="h-5 w-5 text-primary-500" />
              </div>

              <div className="space-y-3">
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
                    {material.flashcards.length === 0 && (
                      <input
                        type="range"
                        min={4}
                        max={20}
                        step={2}
                        value={cardCount}
                        onChange={(event) => setCardCount(Number(event.target.value))}
                        className="mt-1 w-full"
                      />
                    )}
                    {material.flashcards.length === 0 ? (
                      <Button
                        className="mt-2 w-full"
                        size="sm"
                        onClick={handleGenerateFlashcards}
                        isLoading={isGenerating.flashcards}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Skapa kort
                      </Button>
                    ) : (
                      <Button
                        className="mt-2 w-full"
                        size="sm"
                        variant="secondary"
                        onClick={() => scrollToSection(flashcardsRef, 'flashcards')}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Visa kort ({material.flashcards.length})
                      </Button>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Quizfrågor ({quizCount})
                    </label>
                    {material.questions.length === 0 && (
                      <input
                        type="range"
                        min={3}
                        max={10}
                        step={1}
                        value={quizCount}
                        onChange={(event) => setQuizCount(Number(event.target.value))}
                        className="mt-1 w-full"
                      />
                    )}
                    {material.questions.length === 0 ? (
                      <Button
                        className="mt-2 w-full"
                        size="sm"
                        variant="secondary"
                        onClick={handleGenerateQuiz}
                        isLoading={isGenerating.quiz}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Skapa quiz
                      </Button>
                    ) : (
                      <Button
                        className="mt-2 w-full"
                        size="sm"
                        variant="secondary"
                        onClick={() => scrollToSection(quizRef, 'quiz')}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Visa quiz ({material.questions.length})
                      </Button>
                    )}
                  </div>
                </div>

                {material.concepts.length === 0 ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateConcepts}
                    isLoading={isGenerating.concepts}
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    Identifiera nyckelbegrepp
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    onClick={() => scrollToSection(conceptsRef, 'concepts')}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Visa begrepp ({material.concepts.length})
                  </Button>
                )}

                <Link
                  to={`/study/material/${material.id}/chat`}
                  className="block"
                >
                  <Button className="w-full" variant="ghost" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Chatta om materialet
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Generationshistorik
                </h3>
                <History className="h-5 w-5 text-primary-500" />
              </div>
              {historyEntries.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {historyEntries.map((entry) => {
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
                            year: 'numeric',
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
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Inga AI-genereringar ännu. Skapa flashcards, quiz eller begrepp för att se historik här.
                </p>
              )}
            </Card>

            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Ordlista
                </h3>
                <GraduationCap className="h-5 w-5 text-primary-500" />
              </div>
              {glossaryEntries.length > 0 ? (
                <dl className="space-y-3">
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
                  Markera ett ord i texten och välj "Lägg till i ordlistan" för att samla viktiga begrepp.
                </p>
              )}
            </Card>
          </div>
        </div>

        {explainResult && (
          <Card className="space-y-2 border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/10">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
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
          <div ref={flashcardsRef} className="scroll-mt-6">
            <Collapsible.Root
              open={openSections.flashcards}
              onOpenChange={(open) => setOpenSections(prev => ({ ...prev, flashcards: open }))}
            >
              <Card className="space-y-4">
                <Collapsible.Trigger className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary-100 dark:bg-primary-900/40 p-2">
                      <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Flashcards
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {material.flashcards.length} kort genererade
                      </p>
                    </div>
                  </div>
                  {openSections.flashcards ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
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
          </div>
        )}

        {/* Genererat innehåll - Quiz */}
        {material.questions.length > 0 && (
          <div ref={quizRef} className="scroll-mt-6">
            <Collapsible.Root
              open={openSections.quiz}
              onOpenChange={(open) => setOpenSections(prev => ({ ...prev, quiz: open }))}
            >
              <Card className="space-y-4">
                <Collapsible.Trigger className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-purple-100 dark:bg-purple-900/40 p-2">
                      <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Quizfrågor
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {material.questions.length} frågor genererade
                      </p>
                    </div>
                  </div>
                  {openSections.quiz ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
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
          </div>
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
          style={{ top: selectionMenu.top - 12, left: selectionMenu.left }}
        >
          <Card className="flex items-center gap-2 px-3 py-2 shadow-xl" padding="none">
            <Button size="sm" variant="ghost" onClick={handleExplainSelection} isLoading={isExplaining}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Förklara
            </Button>
            <Button size="sm" variant="ghost" onClick={handleAddToGlossary} isLoading={isExplaining}>
              <GraduationCap className="mr-2 h-4 w-4" />
              Lägg till i ordlista
            </Button>
          </Card>
        </div>
      )}
    </MainLayout>
  );


}
