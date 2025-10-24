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
  Gamepad2,
  Heart,
  Layers,
  Pause,
  Play,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAppStore } from '../../store/appStore';
import { prepareSnakeGameContent, type SnakeContentConfig } from '../../services/gameService';
import type {
  GameContentPreparation,
  GameScopeMode,
  GamePreferences,
  Material,
  LanguageCode,
  SnakeGameTerm,
} from '../../types';

type LoadState = 'idle' | 'loading' | 'error' | 'ready';
type GamePhase = 'prepare' | 'playing' | 'paused' | 'finished';
type Direction = 'up' | 'down' | 'left' | 'right';

interface Position {
  x: number;
  y: number;
}

interface TokenOnBoard {
  id: string;
  term: string;
  isCorrect: boolean;
  position: Position;
}

interface RoundResult {
  term: string;
  definition: string;
  example?: string;
  success: boolean;
  timeMs: number;
}

interface FeedbackState {
  status: 'correct' | 'incorrect' | 'collision';
  term: string;
  message: string;
  definition: string;
  example?: string;
}

const GRID_SIZE = 12;
const BASE_SPEED = 420;
const SPEED_STEP = 40;
const MIN_SPEED = 160;
const MAX_LIVES = 3;
const DEFAULT_ROUNDS = 10;
const FEEDBACK_TIMEOUT = 2200;

const LANGUAGE_OPTIONS: Array<{ id: LanguageCode; label: string; helper: string }> = [
  { id: 'sv', label: 'Svenska', helper: 'Standard – svenska begrepp' },
  { id: 'en', label: 'Engelska', helper: 'Träna engelska ord' },
  { id: 'es', label: 'Spanska', helper: 'Glosor och vardagsord' },
];

const directionVectors: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const oppositeDirections: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const createInitialSnake = (): Position[] => {
  const center = Math.floor(GRID_SIZE / 2);
  return [
    { x: center + 1, y: center },
    { x: center, y: center },
    { x: center - 1, y: center },
  ];
};

const isOpposite = (a: Direction, b: Direction) =>
  oppositeDirections[a] === b;

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const positionsEqual = (a: Position, b: Position) =>
  a.x === b.x && a.y === b.y;

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const formatSessionDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) {
    return '0 s';
  }

  const minutesTotal = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutesTotal < 1) {
    return `${seconds}s`;
  }

  const hours = Math.floor(minutesTotal / 60);
  const minutes = minutesTotal % 60;

  if (hours > 0) {
    if (minutes === 0) {
      return `${hours} h`;
    }
    return `${hours} h ${minutes} min`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${remainingSeconds}s`;
};

const getFreePosition = (
  occupied: Position[]
): Position => {
  let attempts = 0;
  while (attempts < 2000) {
    const candidate = {
      x: randomInt(0, GRID_SIZE - 1),
      y: randomInt(0, GRID_SIZE - 1),
    };
    if (!occupied.some((pos) => positionsEqual(pos, candidate))) {
      return candidate;
    }
    attempts += 1;
  }
  return { x: 0, y: 0 };
};

const createTokensForTerm = (
  term: SnakeGameTerm,
  allTerms: SnakeGameTerm[],
  snakePositions: Position[]
): TokenOnBoard[] => {
  const occupied = [...snakePositions];
  const tokens: TokenOnBoard[] = [];

  const distractorPool = Array.from(
    new Set<string>([
      ...term.distractors,
      ...allTerms
        .filter((item) => item.term !== term.term)
        .map((item) => item.term),
    ])
  ).filter((candidate) => candidate !== term.term);

  const desiredTotal = Math.min(
    5,
    Math.max(3, term.distractors.length + 1)
  );

  const distractorTerms = shuffle(distractorPool).slice(
    0,
    Math.max(2, desiredTotal - 1)
  );

  const correctPosition = getFreePosition(occupied);
  occupied.push(correctPosition);

  tokens.push({
    id: `correct-${term.term}-${crypto.randomUUID()}`,
    term: term.term,
    isCorrect: true,
    position: correctPosition,
  });

  distractorTerms.forEach((item, index) => {
    const position = getFreePosition(occupied);
    occupied.push(position);
    tokens.push({
      id: `d-${index}-${item}-${crypto.randomUUID()}`,
      term: item,
      isCorrect: false,
      position,
    });
  });

  return tokens;
};

function resolveSnakeConfig({
  routeMaterialId,
  materials,
  preferences,
}: {
  routeMaterialId?: string;
  materials: Material[];
  preferences: GamePreferences;
}): SnakeContentConfig | null {
  const languagePreference = preferences.language ?? 'sv';
  const topicHint = preferences.generatedTopicHint?.trim();

  if (routeMaterialId) {
    return {
      sourceMode: 'single-material',
      materialIds: [routeMaterialId],
      includeAllMaterials: false,
      language: languagePreference,
      minTerms: DEFAULT_ROUNDS,
    };
  }

  if (!materials.length && preferences.sourceMode !== 'generated') {
    return null;
  }

  let selectedIds = [...preferences.selectedMaterialIds];

  if (preferences.includeAllMaterials) {
    selectedIds = materials.map((item) => item.id);
  }

  selectedIds = Array.from(new Set(selectedIds));

  if (preferences.sourceMode === 'single-material') {
    if (!selectedIds.length && materials.length > 0) {
      selectedIds = [materials[0].id];
    }
    if (!selectedIds.length) {
      return null;
    }
    selectedIds = [selectedIds[0]];
  } else if (preferences.sourceMode === 'multi-material') {
    if (!selectedIds.length) {
      selectedIds = materials.map((item) => item.id);
    }
    if (!selectedIds.length) {
      return null;
    }
  }

  return {
    sourceMode: preferences.sourceMode,
    materialIds: selectedIds,
    includeAllMaterials: preferences.includeAllMaterials,
    language: languagePreference,
    minTerms: DEFAULT_ROUNDS,
    topicHint: topicHint && preferences.sourceMode === 'generated' ? topicHint : undefined,
  };
}

export function SnakeGamePage() {
  const { materialId } = useParams<{ materialId?: string }>();
  const navigate = useNavigate();
  const materials = useAppStore((state) => state.materials);
  const loadMaterials = useAppStore((state) => state.loadMaterials);
  const registerMistake = useAppStore((state) => state.registerMistake);
  const gamePreferences = useAppStore((state) => state.gamePreferences);
  const setGamePreferences = useAppStore((state) => state.setGamePreferences);
  const logGameSession = useAppStore((state) => state.logGameSession);

  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [gamePhase, setGamePhase] = useState<GamePhase>('prepare');
  const [error, setError] = useState<string | null>(null);
  const [prepResult, setPrepResult] = useState<GameContentPreparation | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [speed, setSpeed] = useState(BASE_SPEED);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [summaryReason, setSummaryReason] = useState<'completed' | 'lives' | 'aborted' | null>(null);
  const [lastXpEarned, setLastXpEarned] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isManualPause, setIsManualPause] = useState(false);
  const [activeMaterialIds, setActiveMaterialIds] = useState<string[]>([]);
  const [activeSourceMode, setActiveSourceMode] = useState<GameScopeMode>('single-material');
  const [editableTerms, setEditableTerms] = useState<SnakeGameTerm[]>([]);

  const [snake, setSnake] = useState<Position[]>(createInitialSnake());
  const [tokens, setTokens] = useState<TokenOnBoard[]>([]);
  const [direction, setDirection] = useState<Direction>('right');
  const [currentTerm, setCurrentTerm] = useState<SnakeGameTerm | null>(null);

  const snakeRef = useRef(snake);
  const tokensRef = useRef(tokens);
  const directionRef = useRef<Direction>('right');
  const nextDirectionRef = useRef<Direction>('right');
  const currentTermRef = useRef<SnakeGameTerm | null>(null);
  const livesRef = useRef(lives);
  const speedRef = useRef(speed);
  const streakRef = useRef(streak);
  const prepResultRef = useRef<GameContentPreparation | null>(null);
  const totalRoundsRef = useRef(0);
  const roundActiveRef = useRef(false);
  const roundStartRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);
  const sessionMaterialIdsRef = useRef<string[]>([]);
  const sessionSourceModeRef = useRef<GameScopeMode>('single-material');
  const sessionStartRef = useRef<number>(0);
  const scoreRef = useRef(0);

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    currentTermRef.current = currentTerm;
  }, [currentTerm]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    totalRoundsRef.current = prepResult
      ? Math.min(DEFAULT_ROUNDS, prepResult.terms.length)
      : 0;
  }, [prepResult]);
  useEffect(() => {
    prepResultRef.current = prepResult;
  }, [prepResult]);

  useEffect(() => {
    if (prepResult && showReview) {
      setEditableTerms(prepResult.terms.map((term) => ({ ...term })));
    }
  }, [prepResult, showReview]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  const totalRounds = useMemo(
    () => (prepResult ? Math.min(DEFAULT_ROUNDS, prepResult.terms.length) : 0),
    [prepResult]
  );

  const materialTitle = useMemo(() => {
    if (materialId) {
      const material = materials.find((item) => item.id === materialId);
      return material?.title ?? '';
    }

    if (activeSourceMode === 'generated') {
      return 'AI-genererat paket';
    }

    if (activeSourceMode === 'multi-material') {
      if (activeMaterialIds.length > 1) {
        return `${activeMaterialIds.length} material`;
      }
      const single = materials.find((item) => item.id === activeMaterialIds[0]);
      return single?.title ?? 'Flera material';
    }

    if (activeMaterialIds.length > 0) {
      const single = materials.find((item) => item.id === activeMaterialIds[0]);
      return single?.title ?? '';
    }

    return '';
  }, [activeMaterialIds, activeSourceMode, materialId, materials]);

  const activeMaterialNames = useMemo(() => {
    const names = activeMaterialIds
      .map((id) => materials.find((item) => item.id === id))
      .filter((item): item is Material => Boolean(item))
      .map((item) => item.title);

    return Array.from(new Set(names));
  }, [activeMaterialIds, materials]);

  const sourceDescription = useMemo(() => {
    if (activeSourceMode === 'generated') {
      if (activeMaterialNames.length > 0) {
        const preview = activeMaterialNames.slice(0, 2).join(', ');
        const remaining = activeMaterialNames.length - 2;
        return `AI + ${activeMaterialNames.length} material (${preview}${
          remaining > 0 ? ` +${remaining}` : ''
        })`;
      }
      return 'AI-genererat paket';
    }

    if (activeSourceMode === 'multi-material') {
      if (activeMaterialNames.length > 0) {
        const preview = activeMaterialNames.slice(0, 3).join(', ');
        const remaining = activeMaterialNames.length - 3;
        return `${activeMaterialNames.length} material (${preview}${
          remaining > 0 ? ` +${remaining}` : ''
        })`;
      }
      return 'Flera material';
    }

    if (activeMaterialNames.length === 1) {
      return activeMaterialNames[0];
    }

    return activeMaterialIds.length > 0 ? 'Ett material' : 'Välj material';
  }, [activeMaterialIds.length, activeMaterialNames, activeSourceMode]);

  const materialPreview = useMemo(() => {
    if (!activeMaterialNames.length) {
      return null;
    }

    const preview = activeMaterialNames.slice(0, 2).join(', ');
    const remaining = activeMaterialNames.length - 2;
    return remaining > 0 ? `${preview} +${remaining}` : preview;
  }, [activeMaterialNames]);

  const materialSummary = useMemo(() => {
    if (!activeMaterialNames.length) {
      return null;
    }

    if (activeMaterialNames.length <= 4) {
      return activeMaterialNames.join(', ');
    }

    const preview = activeMaterialNames.slice(0, 4).join(', ');
    return `${preview} +${activeMaterialNames.length - 4}`;
  }, [activeMaterialNames]);

  const sourceBadgeLabel = useMemo(() => {
    if (activeSourceMode === 'generated') {
      return prepResult?.source === 'mixed' ? 'AI + material' : 'AI-genererat';
    }
    if (activeSourceMode === 'multi-material') {
      return 'Flera material';
    }
    return 'Ett material';
  }, [activeSourceMode, prepResult?.source]);

  const xpPreview = useMemo(
    () => Math.max(10, Math.round(Math.max(score, 0) / 5)),
    [score]
  );

  const nextStep = useMemo(() => {
    if (activeSourceMode === 'generated') {
      return {
        title: 'Tips: Jobba vidare med AI-paketet',
        description:
          'Kopiera begreppen till quiz eller chatten för att fördjupa dig, och kör gärna en ny Snake-runda med högre tempo.',
      };
    }

    if (activeSourceMode === 'multi-material') {
      return {
        title: 'Tips: Blandträning',
        description:
          'När Memory släpps – testa samma materialmix där för att bygga relationer mellan begreppen.',
      };
    }

    const focusMaterial = activeMaterialNames[0] ?? 'detta material';
    return {
      title: 'Tips: Byt tempo',
      description: `Spela Whack-a-Term (beta) med ${focusMaterial} för snabb igenkänning.`,
    };
  }, [activeMaterialNames, activeSourceMode]);

  const generatedTopicLabel = gamePreferences.generatedTopicHint?.trim() ?? '';
  const isGeneratedTopicSet =
    activeSourceMode === 'generated' && generatedTopicLabel.length > 0;

  const cancelScheduledAction = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleAction = useCallback(
    (action: () => void, delay: number) => {
      cancelScheduledAction();
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        action();
      }, delay);
    },
    [cancelScheduledAction]
  );

  const setupRound = useCallback(
    (index: number) => {
      if (!prepResult) return;
      const term = prepResult.terms[index];
      if (!term) return;

      const nextSnake = createInitialSnake();
      setSnake(nextSnake);
      setDirection('right');
      directionRef.current = 'right';
      nextDirectionRef.current = 'right';
      setTokens(createTokensForTerm(term, prepResult.terms, nextSnake));
      setCurrentTerm(term);
      roundActiveRef.current = true;
      roundStartRef.current = performance.now();
    },
    [prepResult]
  );

  const finishGame = useCallback(
    (reason: 'completed' | 'lives' | 'aborted') => {
      cancelScheduledAction();
      roundActiveRef.current = false;
      const finalScore = scoreRef.current;
      const durationSeconds =
        sessionStartRef.current > 0
          ? Math.max(1, Math.round((performance.now() - sessionStartRef.current) / 1000))
          : 0;
      const xpEarned = Math.max(10, Math.round(finalScore / 5));
      setLastXpEarned(xpEarned);
      setSessionDuration(durationSeconds);

      logGameSession({
        id: crypto.randomUUID(),
        gameType: 'snake',
        score: finalScore,
        duration: durationSeconds,
        completedAt: new Date(),
        xpEarned,
        materialId:
          sessionMaterialIdsRef.current.length === 1
            ? sessionMaterialIdsRef.current[0]
            : undefined,
        materialIds: sessionMaterialIdsRef.current,
        sourceMode: sessionSourceModeRef.current,
        settings: {
          rounds: totalRoundsRef.current,
          language: prepResultRef.current?.language,
        },
      }).catch((logError) => {
        console.warn('Kunde inte logga Snake-session', logError);
      });

      setGamePhase('finished');
      setSummaryReason(reason);
      setFeedback(null);
      setTokens([]);
    },
    [cancelScheduledAction, logGameSession]
  );

  const advanceRound = useCallback(() => {
    if (!prepResult) return;
    const nextIndex = currentRoundIndex + 1;
    if (nextIndex >= totalRounds) {
      finishGame('completed');
      return;
    }
    setCurrentRoundIndex(nextIndex);
    setupRound(nextIndex);
    setGamePhase('playing');
  }, [currentRoundIndex, finishGame, prepResult, setupRound, totalRounds]);

  const handleCorrect = useCallback(() => {
    const term = currentTermRef.current;
    if (!term || !roundActiveRef.current) return;
    roundActiveRef.current = false;

    const elapsed = Math.max(0, performance.now() - roundStartRef.current);
    setRoundResults((prev) => [
      ...prev,
      {
        term: term.term,
        definition: term.definition,
        example: term.examples?.[0],
        success: true,
        timeMs: elapsed,
      },
    ]);

    setScore((prev) => {
      const next = prev + 120 + streakRef.current * 25;
      scoreRef.current = next;
      return next;
    });
    setStreak((prev) => {
      const updated = prev + 1;
      setMaxStreak((max) => Math.max(max, updated));
      if (updated >= 2 && speedRef.current > MIN_SPEED) {
        setSpeed((prevSpeed) => Math.max(MIN_SPEED, prevSpeed - SPEED_STEP));
      }
      return updated;
    });

    setFeedback({
      status: 'correct',
      term: term.term,
      message: 'Snyggt! Du valde rätt begrepp.',
      definition: term.definition,
      example: term.examples?.[0],
    });

    setTokens([]);
    setGamePhase('paused');
    scheduleAction(() => {
      setFeedback(null);
      advanceRound();
    }, FEEDBACK_TIMEOUT);
  }, [advanceRound, scheduleAction]);

  const handleMistake = useCallback(
    (opts: { reason: 'incorrect' | 'collision'; distractor?: string }) => {
      const term = currentTermRef.current;
      if (!term || !roundActiveRef.current) return;
      roundActiveRef.current = false;

      const elapsed = Math.max(0, performance.now() - roundStartRef.current);
      setRoundResults((prev) => [
        ...prev,
        {
          term: term.term,
          definition: term.definition,
          example: term.examples?.[0],
          success: false,
          timeMs: elapsed,
        },
      ]);

      const mistakeTargets =
        sessionMaterialIdsRef.current.length > 0
          ? sessionMaterialIdsRef.current
          : materialId
          ? [materialId]
          : [];
      mistakeTargets.forEach((targetId) => {
        registerMistake(targetId, {
          term: term.term,
          definition: term.definition,
          language: prepResultRef.current?.language,
        });
      });

      setStreak(0);
      setSpeed((prevSpeed) => Math.min(prevSpeed + SPEED_STEP, BASE_SPEED + 160));

      const nextLives = Math.max(livesRef.current - 1, 0);
      livesRef.current = nextLives;
      setLives(nextLives);

      setFeedback({
        status: opts.reason === 'incorrect' ? 'incorrect' : 'collision',
        term: term.term,
        message:
          opts.reason === 'incorrect'
            ? `Fel begrepp (${opts.distractor ?? 'okänt val'}).`
            : 'Oj! Ormen krockade innan du hann fram.',
        definition: term.definition,
        example: term.examples?.[0],
      });

      setTokens([]);
      setGamePhase('paused');

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
    [advanceRound, finishGame, registerMistake, scheduleAction]
  );

  const tick = useCallback(() => {
    if (gamePhase !== 'playing') return;
    const currentSnake = snakeRef.current;
    if (!currentSnake.length) return;

    const pendingDir = nextDirectionRef.current;
    if (pendingDir !== directionRef.current) {
      setDirection(pendingDir);
      directionRef.current = pendingDir;
    }

    const vector = directionVectors[directionRef.current];
    const head = currentSnake[0];
    const newHead = { x: head.x + vector.x, y: head.y + vector.y };

    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE
    ) {
      handleMistake({ reason: 'collision' });
      setSnake(createInitialSnake());
      return;
    }

    const nextSnake = [newHead, ...currentSnake.slice(0, currentSnake.length - 1)];
    if (nextSnake.slice(1).some((segment) => positionsEqual(segment, newHead))) {
      handleMistake({ reason: 'collision' });
      setSnake(createInitialSnake());
      return;
    }

    const token = tokensRef.current.find((item) =>
      positionsEqual(item.position, newHead)
    );

    if (token) {
      if (token.isCorrect) {
        setSnake([newHead, ...currentSnake]);
        handleCorrect();
        return;
      }
      handleMistake({ reason: 'incorrect', distractor: token.term });
      setSnake(createInitialSnake());
      return;
    }

    setSnake(nextSnake);
  }, [gamePhase, handleCorrect, handleMistake]);

  useEffect(() => {
    if (gamePhase !== 'playing') return;
    const intervalId = window.setInterval(() => tick(), speed);
    return () => window.clearInterval(intervalId);
  }, [gamePhase, speed, tick]);

  const changeDirection = useCallback(
    (next: Direction) => {
      if (gamePhase !== 'playing') return;
      const current = directionRef.current;
      if (next === current || isOpposite(current, next)) return;
      nextDirectionRef.current = next;
    },
    [gamePhase]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          changeDirection('up');
          event.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          changeDirection('down');
          event.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          changeDirection('left');
          event.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          changeDirection('right');
          event.preventDefault();
          break;
        case ' ':
          event.preventDefault();
          setIsManualPause((prev) => {
            if (gamePhase === 'playing') {
              setGamePhase('paused');
              return true;
            }
            if (gamePhase === 'paused' && prev) {
              setGamePhase('playing');
              return false;
            }
            return prev;
          });
          break;
        default:
          break;
      }

    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, gamePhase]);

  const loadContent = useCallback(async () => {
    const trimmedTopic = generatedTopicLabel;
    if (
      gamePreferences.sourceMode === 'generated' &&
      trimmedTopic.length < 3 &&
      (!prepResult || prepResult.source !== 'existing')
    ) {
      // Vänta på att användaren skriver in ett tydligt tema innan vi ringer backend.
      setLoadState('idle');
      setError(null);
      setPrepResult(null);
      setShowReview(false);
      return;
    }

    setLoadState('loading');
    setError(null);
    setGamePhase('prepare');
    cancelScheduledAction();

    try {
      if (!materials.length) {
        await loadMaterials();
      }

      const latestMaterials = useAppStore.getState().materials;
      const latestPreferences = useAppStore.getState().gamePreferences;
      const config = resolveSnakeConfig({
        routeMaterialId: materialId,
        materials: latestMaterials,
        preferences: latestPreferences,
      });

      if (!config) {
        setLoadState('error');
        setError('Välj minst ett material eller generera begrepp innan du startar.');
        return;
      }

      if (config.sourceMode === 'generated' && (!config.topicHint || config.topicHint.length < 3)) {
        setLoadState('idle');
        setError('Skriv vad du vill öva på innan du skapar ett nytt paket.');
        setPrepResult(null);
        setShowReview(false);
        return;
      }

      const preparation = await prepareSnakeGameContent(config);

      setPrepResult(preparation);
      setActiveMaterialIds(preparation.materialIds ?? config.materialIds ?? []);
      sessionMaterialIdsRef.current = preparation.materialIds ?? config.materialIds ?? [];
      sessionSourceModeRef.current = config.sourceMode;
      setActiveSourceMode(config.sourceMode);
      setShowReview(preparation.needsReview);
      setReviewConfirmed(!preparation.needsReview);
      setLoadState('ready');
      setCurrentRoundIndex(0);
      setRoundResults([]);
      setScore(0);
      scoreRef.current = 0;
      setMaxStreak(0);
      setStreak(0);
      setLives(MAX_LIVES);
      setSpeed(BASE_SPEED);
      setFeedback(null);
      setSummaryReason(null);
      sessionStartRef.current = 0;
    } catch (loadError) {
      console.error('Kunde inte förbereda Snake-spelet', loadError);
      setPrepResult(null);
      setLoadState('error');
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Kunde inte förbereda materialet för spelet.'
      );
    }
  }, [cancelScheduledAction, gamePreferences, generatedTopicLabel, loadMaterials, materialId, materials.length, prepResult]);

  useEffect(() => {
    if (!materialId) return;

    const isSingle = gamePreferences.sourceMode === 'single-material';
    const firstSelected = gamePreferences.selectedMaterialIds[0];
    if (!isSingle || firstSelected !== materialId || gamePreferences.includeAllMaterials) {
      setGamePreferences({
        sourceMode: 'single-material',
        selectedMaterialIds: [materialId],
        includeAllMaterials: false,
      });
    }
  }, [materialId, gamePreferences.includeAllMaterials, gamePreferences.selectedMaterialIds, gamePreferences.sourceMode, setGamePreferences]);

  useEffect(() => {
    if (materialId) return;
    if (!materials.length) return;

    if (gamePreferences.sourceMode === 'single-material' && gamePreferences.selectedMaterialIds.length === 0) {
      setGamePreferences({
        selectedMaterialIds: [materials[0].id],
      });
    }

    if (gamePreferences.sourceMode === 'multi-material' && gamePreferences.selectedMaterialIds.length === 0) {
      setGamePreferences({
        selectedMaterialIds: materials.map((item) => item.id),
      });
    }
  }, [materialId, materials, gamePreferences.sourceMode, gamePreferences.selectedMaterialIds.length, setGamePreferences]);
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const startGame = useCallback(() => {
    if (!prepResult) return;
    setScore(0);
    scoreRef.current = 0;
    setMaxStreak(0);
    setStreak(0);
    setLives(MAX_LIVES);
    setSpeed(BASE_SPEED);
    setCurrentRoundIndex(0);
    setRoundResults([]);
    setSummaryReason(null);
    setLastXpEarned(0);
    setSessionDuration(0);
    setFeedback(null);
    setIsManualPause(false);
    sessionMaterialIdsRef.current = prepResult.materialIds ?? activeMaterialIds;
    sessionSourceModeRef.current = activeSourceMode;
    sessionStartRef.current = performance.now();
    setupRound(0);
    setGamePhase('playing');
  }, [activeMaterialIds, activeSourceMode, prepResult, setupRound]);

  const handleRetryLoad = () => {
    loadContent();
  };

  const handleTogglePause = () => {
    if (gamePhase === 'playing') {
      setGamePhase('paused');
      setIsManualPause(true);
    } else if (gamePhase === 'paused' && isManualPause) {
      setIsManualPause(false);
      setGamePhase('playing');
    }
  };

  const gridCells = useMemo(() => {
    const cells = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => ({
      snake: false,
      head: false,
      token: null as TokenOnBoard | null,
    }));

    snake.forEach((segment, index) => {
      if (
        segment.x < 0 ||
        segment.x >= GRID_SIZE ||
        segment.y < 0 ||
        segment.y >= GRID_SIZE
      ) {
        return;
      }
      const cellIndex = segment.y * GRID_SIZE + segment.x;
      cells[cellIndex] = {
        snake: true,
        head: index === 0,
        token: null,
      };
    });

    tokens.forEach((token) => {
      if (
        token.position.x < 0 ||
        token.position.x >= GRID_SIZE ||
        token.position.y < 0 ||
        token.position.y >= GRID_SIZE
      ) {
        return;
      }
      const cellIndex = token.position.y * GRID_SIZE + token.position.x;
      cells[cellIndex] = {
        snake: cells[cellIndex].snake,
        head: cells[cellIndex].head,
        token,
      };
    });

    return cells;
  }, [snake, tokens]);

  const accuracy = useMemo(() => {
    if (!roundResults.length) return 0;
    const correct = roundResults.filter((item) => item.success).length;
    return Math.round((correct / roundResults.length) * 100);
  }, [roundResults]);

  const mistakeResults = useMemo(
    () => roundResults.filter((item) => !item.success),
    [roundResults]
  );

  const stepsPerSecond = useMemo(() => (1000 / speed).toFixed(1), [speed]);
  const activeLanguage = (prepResult?.language ?? gamePreferences.language).toUpperCase();
  const cleanedEditableTerms = useMemo(
    () =>
      editableTerms.map((term) => ({
        ...term,
        term: term.term.trim(),
        definition: term.definition.trim(),
        examples: term.examples?.map((item) => item.trim()).filter(Boolean),
      })),
    [editableTerms]
  );
  const validEditableTerms = cleanedEditableTerms.filter(
    (term) => term.term.length > 0 && term.definition.length > 0
  );
  const canConfirmEdits = validEditableTerms.length >= 3;

  const handleUpdateEditableTerm = useCallback(
    (index: number, field: 'term' | 'definition' | 'examples', value: string) => {
      setEditableTerms((current) => {
        const draft = [...current];
        const item = { ...draft[index] };
        if (field === 'examples') {
          item.examples = value
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, 2);
        } else {
          item[field] = value;
        }
        draft[index] = item;
        return draft;
      });
    },
    []
  );

  const handleRemoveEditableTerm = useCallback((index: number) => {
    setEditableTerms((current) => current.filter((_, termIndex) => termIndex !== index));
  }, []);

  const handleAddEditableTerm = useCallback(() => {
    setEditableTerms((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        materialId: 'generated',
        term: '',
        definition: '',
        examples: [],
        source: 'generated',
        language: prepResult?.language ?? gamePreferences.language,
        distractors: [],
      },
    ]);
  }, [gamePreferences.language, prepResult?.language]);

  const handleReviewLanguageSwitch = useCallback(
    (language: LanguageCode) => {
      setGamePreferences({ language });
      setReviewConfirmed(false);
      setShowReview(false);
      loadContent();
    },
    [loadContent, setGamePreferences]
  );

  return (
    <MainLayout
      title={materialTitle ? `Snake – ${materialTitle}` : 'Snake – Ät rätt begrepp'}
      showBottomNav={false}
      headerAction={
        <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tillbaka
        </Button>
      }
    >
      <div className="py-6 space-y-6">
        <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-br from-primary-500/10 to-primary-500/5 border border-primary-200 dark:border-primary-800">
          <div className="flex items-start gap-3">
            <Gamepad2 className="h-10 w-10 text-primary-500 dark:text-primary-300" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Snake – Ät rätt begrepp
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Styr ormen till rätt begrepp utifrån en förklaring. Efter varje bett får du en kort
                förklaring och exempel.
              </p>
              {isGeneratedTopicSet && (
                <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800 dark:bg-primary-900/40 dark:text-primary-100">
                  <Sparkles className="h-3 w-3" />
                  Fokus: {generatedTopicLabel}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 justify-end">
            <Button variant="outline" onClick={() => navigate('/study')}>
              Avsluta
            </Button>
            <Button
              onClick={startGame}
              disabled={
                loadState !== 'ready' ||
                !prepResult ||
                (prepResult.needsReview && !reviewConfirmed)
              }
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {gamePhase === 'finished' ? 'Spela igen' : 'Starta spel'}
            </Button>
          </div>
        </Card>

        {showReview && prepResult?.needsReview && (
          <Card className="p-6 space-y-3 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
            <h3 className="text-base font-semibold text-amber-800 dark:text-amber-200">
              Snabbgranskning – auto-genererade begrepp
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-100">
              AI:n har föreslagit begrepp och distraktorer. Ändra eller ta bort det som inte passar –
              minst tre behövs för att börja spela.
            </p>
            {activeSourceMode === 'generated' && (
              <div className="rounded-xl border border-amber-200 bg-white px-3 py-2 dark:border-amber-700 dark:bg-gray-900/40">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1">
                  Vill du byta språk och generera om?
                </p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((option) => {
                    const isActive = gamePreferences.language === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleReviewLanguageSwitch(option.id)}
                        disabled={isActive}
                        className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                          isActive
                            ? 'border-amber-500 bg-amber-100 text-amber-800 cursor-default dark:border-amber-400 dark:bg-amber-900/50 dark:text-amber-100'
                            : 'border-amber-300 text-amber-700 hover:border-amber-400 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-900/30'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-amber-700/80 dark:text-amber-200/80">
                  Vi laddar om listan när du väljer ett nytt språk. Ditt tema behålls.
                </p>
              </div>
            )}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 text-left">
              {editableTerms.map((term, index) => (
                <div
                  key={term.id}
                  className="rounded-xl border border-amber-200 bg-white px-3 py-3 text-sm shadow-sm dark:border-amber-700 dark:bg-gray-900/60"
                >
                  <div className="flex items-start gap-2">
                    <label className="flex-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Begrepp
                      <input
                        value={term.term}
                        onChange={(event) =>
                          handleUpdateEditableTerm(index, 'term', event.target.value)
                        }
                        placeholder="Skriv begreppet här"
                        className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-1 text-sm text-gray-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-amber-700 dark:bg-gray-900 dark:text-gray-100"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveEditableTerm(index)}
                      className="rounded-full border border-amber-300 px-2 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-900/40"
                    >
                      Ta bort
                    </button>
                  </div>
                  <label className="mt-2 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Förklaring
                    <textarea
                      value={term.definition}
                      onChange={(event) =>
                        handleUpdateEditableTerm(index, 'definition', event.target.value)
                      }
                      placeholder="Skriv en kort och tydlig förklaring"
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-1 text-sm text-gray-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-amber-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                  </label>
                  <label className="mt-2 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Exempel (valfritt, ett per rad)
                    <textarea
                      value={(term.examples ?? []).join('\n')}
                      onChange={(event) =>
                        handleUpdateEditableTerm(index, 'examples', event.target.value)
                      }
                      placeholder="t.ex. La vaca = kon"
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-1 text-sm text-gray-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300 dark:border-amber-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                  </label>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleAddEditableTerm}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-600 dark:bg-gray-900 dark:text-amber-100 dark:hover:bg-amber-900/40"
              >
                Lägg till begrepp
              </button>
              <span className="text-xs text-amber-700 dark:text-amber-200">
                {validEditableTerms.length} begrepp redo · minst 3 behövs
              </span>
            </div>
            <Button
              size="sm"
              disabled={!canConfirmEdits}
              onClick={() => {
                if (!canConfirmEdits) return;
                setPrepResult((current) =>
                  current
                    ? {
                        ...current,
                        terms: validEditableTerms.map((term) => ({
                          ...term,
                          term: term.term.trim(),
                          definition: term.definition.trim(),
                        })),
                      }
                    : current
                );
                setShowReview(false);
                setReviewConfirmed(true);
              }}
            >
              Ser bra ut – starta spelet
            </Button>
          </Card>
        )}

        {loadState === 'loading' && (
          <Card className="p-10 text-center space-y-3">
            <div className="text-4xl">🐍</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Förbereder begrepp och distraktorer...
            </p>
          </Card>
        )}

        {loadState === 'error' && (
          <Card className="p-6 space-y-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
              Kunde inte starta Snake-spelet
            </h3>
            <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
            <div className="flex gap-2">
              <Button onClick={handleRetryLoad}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Försök igen
              </Button>
              <Button variant="ghost" onClick={() => navigate('/study')}>
                Till studievyn
              </Button>
            </div>
          </Card>
        )}

        {loadState === 'ready' && prepResult && (
          <Card className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">
                  Rond
                  <strong className="ml-1">
                    {Math.min(currentRoundIndex + 1, totalRounds)} / {totalRounds}
                  </strong>
                </span>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">
                  Poäng
                  <strong className="ml-1">{score}</strong>
                </span>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800">
                  Streak
                  <strong className="ml-1">{streak}</strong>
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(bäst {maxStreak})</span>
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                  +{xpPreview} XP
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-1 font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-200">
                  {activeSourceMode === 'generated' ? (
                    <Sparkles className="h-3 w-3" />
                  ) : activeSourceMode === 'multi-material' ? (
                    <Layers className="h-3 w-3" />
                  ) : (
                    <Gamepad2 className="h-3 w-3" />
                  )}
                  {sourceBadgeLabel}
                </span>
                {materialPreview && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    {activeMaterialNames.length > 1 || activeSourceMode !== 'single-material' ? (
                      <Layers className="h-3 w-3" />
                    ) : (
                      <Gamepad2 className="h-3 w-3" />
                    )}
                    {materialPreview}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  Språk {activeLanguage}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  <Gauge className="h-3 w-3" />
                  {stepsPerSecond} steg/s
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: MAX_LIVES }).map((_, index) => (
                    <Heart
                      key={index}
                      className={`h-4 w-4 ${
                        index < lives ? 'text-rose-500' : 'text-gray-300 dark:text-gray-600'
                      }`}
                      fill={index < lives ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleTogglePause}
                disabled={gamePhase === 'finished'}
              >
                {gamePhase === 'playing' ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pausa
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Fortsätt
                  </>
                )}
              </Button>
            </div>

            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
              <p className="text-xs uppercase tracking-wide text-primary-500 mb-1">
                Förklaring
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100 min-h-[48px]">
                {currentTerm?.definition ?? 'Tryck på “Starta spel” för att börja.'}
              </p>
            </Card>

            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              }}
            >
              {gridCells.map((cell, index) => (
                <div
                  key={index}
                  className={`relative aspect-square rounded-md border border-gray-100 dark:border-gray-800 transition-colors ${
                    cell.snake
                      ? cell.head
                        ? 'bg-primary-500 dark:bg-primary-400'
                        : 'bg-primary-200 dark:bg-primary-600/70'
                      : 'bg-gray-50 dark:bg-gray-900'
                  }`}
                >
                  {cell.token && (
                    <div
                      className={`absolute inset-0 m-1 flex items-center justify-center rounded-md border text-[0.65rem] font-semibold text-center leading-tight px-1 ${
                        cell.token.isCorrect
                          ? 'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                          : 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <span className="line-clamp-2">{cell.token.term}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {feedback && (
              <Card
                className={`px-4 py-3 border text-sm ${
                  feedback.status === 'correct'
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                }`}
              >
                <p className="font-semibold text-gray-900 dark:text-white">{feedback.message}</p>
                <p className="text-gray-700 dark:text-gray-300">{feedback.definition}</p>
                {feedback.example && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
                    Exempel: {feedback.example}
                  </p>
                )}
              </Card>
            )}

            <div className="flex flex-wrap justify-center gap-2">
              {(['up', 'left', 'down', 'right'] as Direction[]).map((dir) => (
                <Button
                  key={dir}
                  size="sm"
                  variant="ghost"
                  onClick={() => changeDirection(dir)}
                  disabled={gamePhase !== 'playing'}
                >
                  {dir === 'up' ? '↑' : dir === 'down' ? '↓' : dir === 'left' ? '←' : '→'}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {gamePhase === 'finished' && prepResult && (
          <Card className="p-6 space-y-5 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-200">
                  {summaryReason === 'completed' ? 'Snyggt jobbat!' : 'Spelet avslutades'}
                </h3>
                <p className="text-sm text-primary-600 dark:text-primary-200">
                  {summaryReason === 'completed'
                    ? 'Alla rundor klarade – fortsätt på samma spår!'
                    : summaryReason === 'lives'
                    ? 'Ormen tog slut på liv. Sänk tempot och försök igen.'
                    : 'Du avbröt rundan. Starta om när du är redo.'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-primary-500 dark:text-primary-300">
                  Poäng
                </p>
                <p className="text-3xl font-semibold text-primary-700 dark:text-primary-100">{score}</p>
                <p className="text-xs font-semibold text-primary-600 dark:text-primary-200">
                  +{lastXpEarned} XP
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white/80 px-4 py-3 shadow-sm dark:bg-gray-900/60">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Träffsäkerhet
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{accuracy}%</p>
              </div>
              <div className="rounded-xl bg-white/80 px-4 py-3 shadow-sm dark:bg-gray-900/60">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Bästa streak
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{maxStreak}</p>
              </div>
              <div className="rounded-xl bg-white/80 px-4 py-3 shadow-sm dark:bg-gray-900/60">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Speltid
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatSessionDuration(sessionDuration)}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white/80 px-4 py-3 shadow-sm dark:bg-gray-900/60">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-1 font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-200">
                  {activeSourceMode === 'generated' ? (
                    <Sparkles className="h-3 w-3" />
                  ) : activeSourceMode === 'multi-material' ? (
                    <Layers className="h-3 w-3" />
                  ) : (
                    <Gamepad2 className="h-3 w-3" />
                  )}
                  {sourceBadgeLabel}
                </span>
                {materialPreview && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    {activeMaterialNames.length > 1 || activeSourceMode !== 'single-material' ? (
                      <Layers className="h-3 w-3" />
                    ) : (
                      <Gamepad2 className="h-3 w-3" />
                    )}
                    {materialPreview}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  Språk {activeLanguage}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  Innehåll{' '}
                  {prepResult.source === 'generated'
                    ? 'AI'
                    : prepResult.source === 'mixed'
                    ? 'Mix'
                    : 'Eget'}
                </span>
              </div>
              <dl className="mt-3 grid gap-2 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">Källa</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{sourceDescription}</dd>
                </div>
                {materialSummary && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-400">Material</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{materialSummary}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">Språk</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{activeLanguage}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">Innehållskälla</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {prepResult.source === 'generated'
                      ? 'AI-genererat paket'
                      : prepResult.source === 'mixed'
                      ? 'Mix av AI och eget material'
                      : 'Eget material'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-100">
              <h4 className="font-semibold">{nextStep.title}</h4>
              <p>{nextStep.description}</p>
            </div>

            {mistakeResults.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Begrepp att repetera
                </h4>
                {mistakeResults.map((result, index) => (
                  <div
                    key={`${result.term}-${index}`}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100"
                  >
                    <span className="font-semibold">{result.term}</span>: {result.definition}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-emerald-700 dark:text-emerald-200">
                Inga missar den här gången – grymt!
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={startGame}>
                <Sparkles className="mr-2 h-4 w-4" />
                Spela igen
              </Button>
              <Button variant="outline" onClick={() => navigate('/study')}>
                Till studievyn
              </Button>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
