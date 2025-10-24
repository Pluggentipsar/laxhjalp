import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Gauge,
  Hammer,
  Heart,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { WhackATermCanvas } from '../../components/games/WhackATermCanvas';
import { useAppStore } from '../../store/appStore';
import { prepareWhackATermContent, type WhackATermConfig } from '../../services/gameService';
import type { LanguageCode } from '../../types';

type LoadState = 'idle' | 'loading' | 'error' | 'ready';
type GamePhase = 'prepare' | 'playing' | 'paused' | 'finished';
type SOLOLevel = 'unistructural' | 'multistructural' | 'relational' | 'extended-abstract';

interface WhackATermTerm {
  term: string;
  definition: string;
  examples?: string[];
  source: 'flashcard' | 'glossary' | 'concept' | 'generated';
  language: LanguageCode;
  distractors: string[];
}

interface Mole {
  id: string;
  term: string;
  isCorrect: boolean;
  holeIndex: number;
  appearTime: number;
  visible: boolean;
}

interface RoundResult {
  term: string;
  definition: string;
  example?: string;
  success: boolean;
  timeMs: number;
  soloLevel: SOLOLevel;
}

interface FeedbackState {
  status: 'correct' | 'incorrect';
  term: string;
  message: string;
  definition: string;
  example?: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
}

// Constants
const BASE_DISPLAY_TIME = 3000; // How long moles stay visible (easy)
const MIN_DISPLAY_TIME = 1200; // Fastest moles can appear/disappear (hard)
const FEEDBACK_TIMEOUT = 1000; // Short feedback after each answer
const CORRECT_BONUS = 10;
const SPEED_BONUS = 5; // Bonus for answering under 2s
const STREAK_MULTIPLIER = 2; // +2 per streak
const SOLO_LEVEL_BONUS = 20;
const PERFECT_STREAK_BONUS = 50;
const PERFECT_STREAK_COUNT = 10;

// SOLO progression thresholds
const SOLO_THRESHOLDS = {
  unistructural: { correctStreak: 0, distractorCount: 2 },
  multistructural: { correctStreak: 3, distractorCount: 3 },
  relational: { correctStreak: 6, distractorCount: 4 },
  'extended-abstract': { correctStreak: 9, distractorCount: 5 },
};

const NUM_HOLES = 6; // Number of holes in the game board
const DEFAULT_ROUNDS = 15;

export function WhackATermPage() {
  const { materialId } = useParams<{ materialId?: string }>();
  const navigate = useNavigate();

  // Store
  const materials = useAppStore((state) => state.materials);
  const loadMaterials = useAppStore((state) => state.loadMaterials);
  const registerMistake = useAppStore((state) => state.registerMistake);
  const logGameSession = useAppStore((state) => state.logGameSession);

  // Load state
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [prepResult, setPrepResult] = useState<{
    terms: WhackATermTerm[];
    source: 'existing' | 'generated';
    materialIds: string[];
    language: LanguageCode;
    timestamp: number;
  } | null>(null);
  const prepResultRef = useRef(prepResult);

  // Game state
  const [gamePhase, setGamePhase] = useState<GamePhase>('prepare');
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [totalRounds] = useState(DEFAULT_ROUNDS);
  const [currentTerm, setCurrentTerm] = useState<WhackATermTerm | null>(null);
  const currentTermRef = useRef(currentTerm);
  const [moles, setMoles] = useState<Mole[]>([]);
  const [displayTime, setDisplayTime] = useState(BASE_DISPLAY_TIME);

  // SOLO and difficulty
  const [soloLevel, setSoloLevel] = useState<SOLOLevel>('unistructural');
  const [distractorCount, setDistractorCount] = useState(2);

  // Score & stats
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [streak, setStreak] = useState(0);
  const streakRef = useRef(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const livesRef = useRef(3);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [recentBadges, setRecentBadges] = useState<Badge[]>([]);
  const [fullscreen, setFullscreen] = useState(false);

  // Timing
  const roundStartRef = useRef(0);
  const roundActiveRef = useRef(false);
  const scheduledActionRef = useRef<number | null>(null);
  const moleTimerRef = useRef<number | null>(null);

  // Sync refs
  useEffect(() => {
    prepResultRef.current = prepResult;
  }, [prepResult]);

  useEffect(() => {
    currentTermRef.current = currentTerm;
  }, [currentTerm]);

  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Schedule action helper
  const scheduleAction = useCallback((callback: () => void, delay: number) => {
    if (scheduledActionRef.current !== null) {
      window.clearTimeout(scheduledActionRef.current);
    }
    scheduledActionRef.current = window.setTimeout(() => {
      scheduledActionRef.current = null;
      callback();
    }, delay);
  }, []);

  const cancelScheduledAction = useCallback(() => {
    if (scheduledActionRef.current !== null) {
      window.clearTimeout(scheduledActionRef.current);
      scheduledActionRef.current = null;
    }
    if (moleTimerRef.current !== null) {
      window.clearTimeout(moleTimerRef.current);
      moleTimerRef.current = null;
    }
  }, []);

  // Load content
  const loadContent = useCallback(async () => {
    setLoadState('loading');
    setPrepResult(null);

    try {
      await loadMaterials();

      const latestMaterials = useAppStore.getState().materials;
      const latestPreferences = useAppStore.getState().gamePreferences;
      const config: WhackATermConfig = {
        materialId: materialId || null,
        scope: latestPreferences.sourceMode,
        selectedMaterialIds: latestPreferences.selectedMaterialIds,
        includeAllMaterials: latestPreferences.includeAllMaterials,
        language: latestPreferences.language,
        generatedTopicHint: latestPreferences.generatedTopicHint,
      };

      const result = await prepareWhackATermContent(latestMaterials, config);

      if (!result || result.terms.length === 0) {
        setLoadState('error');
        return;
      }

      setPrepResult(result);
      setLoadState('ready');
    } catch (error) {
      console.error('Failed to load content:', error);
      setLoadState('error');
    }
  }, [loadMaterials, materialId]);

  // Setup round
  const setupRound = useCallback(
    (index: number) => {
      if (!prepResult) return;
      const term = prepResult.terms[index];
      if (!term) return;

      setCurrentTerm(term);
      setMoles([]);
      roundActiveRef.current = true;
      roundStartRef.current = performance.now();

      // Spawn moles after a short delay
      scheduleAction(() => {
        // Get distractor pool
        const distractorPool = Array.from(
          new Set<string>([
            ...term.distractors,
            ...prepResult.terms
              .filter((t) => t.term !== term.term)
              .map((t) => t.term),
          ])
        ).filter((candidate) => candidate !== term.term);

        // Select distractors based on SOLO level
        const selectedDistractors = distractorPool
          .sort(() => Math.random() - 0.5)
          .slice(0, distractorCount);

        // Create moles (1 correct + distractors)
        const allTerms = [term.term, ...selectedDistractors];
        const shuffled = allTerms.sort(() => Math.random() - 0.5);

        // Assign to random holes
        const usedHoles = new Set<number>();
        const newMoles: Mole[] = shuffled.map((t: string, i: number) => {
          let holeIndex;
          do {
            holeIndex = Math.floor(Math.random() * NUM_HOLES);
          } while (usedHoles.has(holeIndex));
          usedHoles.add(holeIndex);

          return {
            id: `${t}-${i}-${Date.now()}`,
            term: t,
            isCorrect: t === term.term,
            holeIndex,
            appearTime: Date.now(),
            visible: true,
          };
        });

        setMoles(newMoles);

        // Auto-hide moles after displayTime
        if (moleTimerRef.current) {
          window.clearTimeout(moleTimerRef.current);
        }
        moleTimerRef.current = window.setTimeout(() => {
          if (roundActiveRef.current) {
            // Timeout - treat as miss
            const currentTerm = currentTermRef.current;
            if (!currentTerm) return;
            roundActiveRef.current = false;

            const elapsed = performance.now() - roundStartRef.current;
            handleIncorrect('(ingen vald)', elapsed);
          }
        }, displayTime);
      }, 500);
    },
    [prepResult, scheduleAction, distractorCount, displayTime]
  );

  // Handle mole click
  const handleMoleClick = useCallback(
    (mole: Mole) => {
      if (!roundActiveRef.current || !currentTermRef.current) return;

      const elapsed = performance.now() - roundStartRef.current;

      if (mole.isCorrect) {
        handleCorrect(elapsed);
      } else {
        handleIncorrect(mole.term, elapsed);
      }
    },
    []
  );

  // Handle correct answer
  const handleCorrect = useCallback(
    (timeMs: number) => {
      const term = currentTermRef.current;
      if (!term || !roundActiveRef.current) return;
      roundActiveRef.current = false;

      // Cancel mole timer
      if (moleTimerRef.current) {
        window.clearTimeout(moleTimerRef.current);
        moleTimerRef.current = null;
      }

      // Calculate score
      let points = CORRECT_BONUS;
      if (timeMs < 2000) points += SPEED_BONUS;
      points += streakRef.current * STREAK_MULTIPLIER;

      setScore((prev) => {
        const next = prev + points;
        scoreRef.current = next;
        return next;
      });

      // Increase streak
      const newStreak = streakRef.current + 1;
      setStreak(newStreak);
      setMaxStreak((max) => Math.max(max, newStreak));

      // Check for perfect streak badge
      if (newStreak === PERFECT_STREAK_COUNT) {
        setScore((prev) => prev + PERFECT_STREAK_BONUS);
        awardBadge('perfect-streak', 'Fattat!', '10 rätt på rad', 'Trophy');
      }

      // SOLO progression check
      const currentSOLO = soloLevel;
      let newSOLO = currentSOLO;

      if (currentSOLO === 'unistructural' && newStreak >= 3) {
        newSOLO = 'multistructural';
      } else if (currentSOLO === 'multistructural' && newStreak >= 6) {
        newSOLO = 'relational';
      } else if (currentSOLO === 'relational' && newStreak >= 9) {
        newSOLO = 'extended-abstract';
      }

      if (newSOLO !== currentSOLO) {
        setSoloLevel(newSOLO);
        setScore((prev) => prev + SOLO_LEVEL_BONUS);
        setDistractorCount(SOLO_THRESHOLDS[newSOLO].distractorCount);
        // Reduce display time as difficulty increases
        setDisplayTime((prev) => Math.max(MIN_DISPLAY_TIME, prev - 400));
      }

      // Record result
      setRoundResults((prev) => [
        ...prev,
        {
          term: term.term,
          definition: term.definition,
          example: term.examples?.[0],
          success: true,
          timeMs,
          soloLevel: newSOLO,
        },
      ]);

      setFeedback({
        status: 'correct',
        term: term.term,
        message: `+${points} poäng!`,
        definition: term.definition,
        example: term.examples?.[0],
      });

      setMoles([]);
      scheduleAction(() => {
        setFeedback(null);
        advanceRound();
      }, FEEDBACK_TIMEOUT);
    },
    [soloLevel, scheduleAction]
  );

  // Handle incorrect answer
  const handleIncorrect = useCallback(
    (selectedTerm: string, timeMs: number) => {
      const term = currentTermRef.current;
      if (!term || !roundActiveRef.current) return;
      roundActiveRef.current = false;

      // Cancel mole timer
      if (moleTimerRef.current) {
        window.clearTimeout(moleTimerRef.current);
        moleTimerRef.current = null;
      }

      // Record mistake
      const mistakeTargets =
        prepResultRef.current?.materialIds.length
          ? prepResultRef.current.materialIds
          : materialId
          ? [materialId]
          : [];
      mistakeTargets.forEach((targetId: string) => {
        registerMistake(targetId, {
          term: term.term,
          definition: term.definition,
          language: prepResultRef.current?.language,
        });
      });

      // Reset streak
      setStreak(0);

      // Check for SOLO downgrade (2 mistakes in short time)
      const recentMistakes = roundResults
        .slice(-3)
        .filter((r) => !r.success).length;
      if (recentMistakes >= 1 && soloLevel !== 'unistructural') {
        const levels: SOLOLevel[] = [
          'unistructural',
          'multistructural',
          'relational',
          'extended-abstract',
        ];
        const currentIndex = levels.indexOf(soloLevel);
        if (currentIndex > 0) {
          const newLevel = levels[currentIndex - 1];
          setSoloLevel(newLevel);
          setDistractorCount(SOLO_THRESHOLDS[newLevel].distractorCount);
          setDisplayTime((prev) => Math.min(BASE_DISPLAY_TIME, prev + 400));
        }
      }

      // Lose life
      const nextLives = Math.max(livesRef.current - 1, 0);
      livesRef.current = nextLives;
      setLives(nextLives);

      // Record result
      setRoundResults((prev) => [
        ...prev,
        {
          term: term.term,
          definition: term.definition,
          example: term.examples?.[0],
          success: false,
          timeMs,
          soloLevel,
        },
      ]);

      setFeedback({
        status: 'incorrect',
        term: term.term,
        message: `Fel! Du valde: ${selectedTerm}`,
        definition: term.definition,
        example: term.examples?.[0],
      });

      setMoles([]);

      if (nextLives <= 0) {
        scheduleAction(() => {
          setFeedback(null);
          finishGame('lives');
        }, FEEDBACK_TIMEOUT);
        return;
      }

      scheduleAction(() => {
        setFeedback(null);
        advanceRound();
      }, FEEDBACK_TIMEOUT);
    },
    [soloLevel, roundResults, registerMistake, materialId, scheduleAction]
  );

  // Advance round
  const advanceRound = useCallback(() => {
    const nextIndex = currentRoundIndex + 1;
    if (nextIndex >= totalRounds || !prepResult) {
      finishGame('completed');
      return;
    }
    setCurrentRoundIndex(nextIndex);
    setupRound(nextIndex);
  }, [currentRoundIndex, totalRounds, prepResult, setupRound]);

  // Finish game
  const finishGame = useCallback(
    (reason: 'completed' | 'lives' | 'aborted') => {
      cancelScheduledAction();
      setGamePhase('finished');
      setMoles([]);

      const totalCorrect = roundResults.filter((r) => r.success).length;
      const avgTime =
        roundResults.length > 0
          ? roundResults.reduce((sum, r) => sum + r.timeMs, 0) / roundResults.length
          : 0;

      // Award badges based on performance
      if (totalCorrect === totalRounds && reason === 'completed') {
        awardBadge('perfect-game', 'Begreppsmästare', 'Alla rätt!', 'Trophy');
      }
      if (avgTime < 1500 && totalCorrect >= totalRounds * 0.8) {
        awardBadge('speed-demon', 'Snabb som vinden', 'Genomsnitt < 1.5s', 'Zap');
      }
      if (maxStreak >= totalRounds / 2) {
        awardBadge('streak-master', 'Streak-mästare', `${maxStreak} rätt i rad`, 'Target');
      }

      // Log session
      if (prepResult) {
        const xp = Math.floor(scoreRef.current / 10);
        logGameSession({
          id: crypto.randomUUID(),
          gameType: 'whack',
          materialIds: prepResult.materialIds,
          score: scoreRef.current,
          duration: Date.now() - (prepResult.timestamp || Date.now()),
          completedAt: new Date(),
          xpEarned: xp,
          sourceMode: prepResult.source === 'generated' ? 'generated' : materialId ? 'single-material' : 'multi-material',
        });
      }
    },
    [
      cancelScheduledAction,
      roundResults,
      totalRounds,
      maxStreak,
      prepResult,
      logGameSession,
      materialId,
    ]
  );

  // Award badge
  const awardBadge = useCallback(
    (id: string, name: string, description: string, icon: string) => {
      const badge: Badge = { id, name, description, icon, earned: true };
      setRecentBadges((prev) => [...prev, badge]);
      // Auto-dismiss after 3s
      setTimeout(() => {
        setRecentBadges((prev) => prev.filter((b) => b.id !== id));
      }, 3000);
    },
    []
  );

  // Start game
  const startGame = useCallback(() => {
    if (!prepResult || prepResult.terms.length === 0) {
      return;
    }

    // Reset state
    setGamePhase('playing');
    setCurrentRoundIndex(0);
    setScore(0);
    scoreRef.current = 0;
    setStreak(0);
    streakRef.current = 0;
    setMaxStreak(0);
    setLives(3);
    livesRef.current = 3;
    setRoundResults([]);
    setFeedback(null);
    setRecentBadges([]);
    setSoloLevel('unistructural');
    setDistractorCount(2);
    setDisplayTime(BASE_DISPLAY_TIME);

    setupRound(0);
  }, [prepResult, setupRound]);

  // Load content on mount
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelScheduledAction();
    };
  }, [cancelScheduledAction]);

  // Derived state
  const activeMaterialNames = useMemo(() => {
    if (!prepResult) return '';
    return prepResult.materialIds
      .map((id: string) => materials.find((m) => m.id === id)?.title)
      .filter(Boolean)
      .join(', ');
  }, [prepResult, materials]);

  const soloLevelDisplay = useMemo(() => {
    switch (soloLevel) {
      case 'unistructural':
        return { label: 'Ny på begreppet', icon: '🌱', color: 'text-green-500' };
      case 'multistructural':
        return { label: 'På god väg', icon: '🌿', color: 'text-emerald-500' };
      case 'relational':
        return { label: 'Begreppsmästare', icon: '🌳', color: 'text-teal-600' };
      case 'extended-abstract':
        return { label: 'Expert', icon: '🏆', color: 'text-amber-500' };
    }
  }, [soloLevel]);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/games')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till Spelhub
          </Button>
        </div>

        {/* Game Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Hammer className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Whack-a-Term
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Tryck på rätt begrepp när det dyker upp!
          </p>
        </div>

        {gamePhase === 'prepare' && (
          <div className="space-y-6">
            {/* Content Status */}
            {loadState === 'loading' && (
              <Card className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Förbereder innehåll...
                </p>
              </Card>
            )}

            {loadState === 'error' && (
              <Card className="p-8 text-center border-red-300 dark:border-red-700">
                <p className="text-red-600 dark:text-red-400 mb-4">
                  Kunde inte ladda innehåll. Kontrollera att du har material eller
                  genererat begrepp.
                </p>
                <Button onClick={loadContent}>Försök igen</Button>
              </Card>
            )}

            {loadState === 'ready' && prepResult && (
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-500 text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      Redo att spela!
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {prepResult.terms.length} begrepp från {activeMaterialNames || 'AI'}
                    </p>
                  </div>
                </div>

                <Button onClick={startGame} size="lg" className="w-full">
                  Starta spel
                </Button>
              </Card>
            )}
          </div>
        )}

        {(gamePhase === 'playing' || gamePhase === 'paused') && currentTerm && (
          <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Poäng
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {score}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-primary-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Streak
                  </span>
                </div>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {streak}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Liv
                  </span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-6 h-6 ${
                        i < lives
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Gauge className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Runda
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {currentRoundIndex + 1} / {totalRounds}
                </p>
              </Card>
            </div>

            {/* SOLO Level indicator */}
            <Card className="p-4 bg-gradient-to-r from-primary-50 to-white dark:from-primary-950 dark:to-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{soloLevelDisplay.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Din nivå
                    </p>
                    <p className={`text-lg font-bold ${soloLevelDisplay.color}`}>
                      {soloLevelDisplay.label}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {distractorCount + 1} begrepp
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {(displayTime / 1000).toFixed(1)}s tid
                  </p>
                </div>
              </div>
            </Card>

            {/* Definition Card */}
            <Card className="border-2 border-primary-300 dark:border-primary-700 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950 dark:to-gray-900 p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <p className="text-sm font-bold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                  Hitta begreppet som matchar:
                </p>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                {currentTerm.definition}
              </p>
            </Card>

            {/* Game Board */}
            <div className="flex justify-center">
              <WhackATermCanvas
                moles={moles}
                numHoles={NUM_HOLES}
                onMoleClick={handleMoleClick}
                fullscreen={fullscreen}
                onFullscreenToggle={() => setFullscreen(!fullscreen)}
              />
            </div>

            {/* Feedback */}
            {feedback && (
              <Card
                className={`p-4 border-2 ${
                  feedback.status === 'correct'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-red-500 bg-red-50 dark:bg-red-950'
                }`}
              >
                <p
                  className={`font-bold ${
                    feedback.status === 'correct'
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {feedback.message}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {feedback.term}: {feedback.definition}
                </p>
              </Card>
            )}

            {/* Badge notifications */}
            {recentBadges.length > 0 && (
              <div className="fixed top-20 right-4 space-y-2 z-50">
                {recentBadges.map((badge) => (
                  <Card
                    key={badge.id}
                    className="p-4 bg-amber-100 dark:bg-amber-900 border-2 border-amber-500 shadow-lg animate-bounce"
                  >
                    <div className="flex items-center gap-3">
                      <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      <div>
                        <p className="font-bold text-amber-900 dark:text-amber-100">
                          {badge.name}
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {gamePhase === 'finished' && (
          <div className="space-y-6">
            <Card className="p-8 text-center space-y-6">
              <Trophy className="w-16 h-16 text-amber-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Spelet avslutat!
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Poäng</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {score}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rätt</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {roundResults.filter((r) => r.success).length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Max streak
                  </p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {maxStreak}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Slutnivå
                  </p>
                  <p className="text-2xl">{soloLevelDisplay.icon}</p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={startGame} size="lg">
                  Spela igen
                </Button>
                <Button
                  onClick={() => navigate('/games')}
                  variant="outline"
                  size="lg"
                >
                  Tillbaka till Spelhub
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
