import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Clock3,
  History,
  Search,
  Sparkles,
  Target,
  Users,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  Trophy,
  TrendingUp,
  Zap,
  X,
  Layers,
  Hammer,
  Shield,
  Grid3x3,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { GameCard } from '../components/games/GameCard';
import { GameSourceSelector } from '../components/games/GameSourceSelector';
import {
  GAME_DEFINITIONS,
  GAME_FOCUS_FILTERS,
  GAME_SCOPE_FILTERS,
  GAME_MULTIPLAYER_FILTERS,
  GAME_DIFFICULTY_FILTERS,
  type GameFilterOption,
} from '../data/games';
import { useAppStore } from '../store/appStore';
import type {
  Difficulty,
  GameDefinition,
  GameScopeMode,
  GameSession,
  GameType,
  Material,
} from '../types';

const QUICK_START_GAME: GameType = 'snake';
const REQUESTED_RECENT_SESSIONS = 12;
const DISPLAYED_RECENT_SESSIONS = 5;

type MultiplayerFilter = 'solo' | 'multiplayer';

const ICON_MAP: Record<string, LucideIcon> = {
  Gamepad2,
  Hammer,
  Shield,
  Grid3x3,
  Timer,
  Layers,
};

function formatDuration(seconds: number): string {
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
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'nyss';
  }
  if (diffMinutes < 60) {
    return `för ${diffMinutes} min sedan`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `för ${diffHours} h sedan`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) {
    return 'igår';
  }
  if (diffDays < 7) {
    return `för ${diffDays} dagar sedan`;
  }

  const diffWeeks = Math.round(diffDays / 7);
  if (diffWeeks < 5) {
    return `för ${diffWeeks} v sedan`;
  }

  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths < 12) {
    return `för ${diffMonths} mån sedan`;
  }

  const diffYears = Math.round(diffMonths / 12);
  return `för ${diffYears} år sedan`;
}

function summarizeMaterials(materialIds: string[], materialMap: Map<string, Material>): string {
  if (!materialIds.length) {
    return '';
  }

  const titles = materialIds
    .map((id) => materialMap.get(id)?.title)
    .filter(Boolean) as string[];

  if (titles.length === 0) {
    return `${materialIds.length} material`;
  }

  const preview = titles.slice(0, 2).join(', ');
  const remaining = titles.length - 2;

  if (remaining > 0) {
    return `${preview} +${remaining}`;
  }

  return preview;
}

function getSessionSourceDescription(
  session: GameSession,
  materialMap: Map<string, Material>
): string {
  if (session.sourceMode === 'generated') {
    return 'AI-genererat paket';
  }

  const ids =
    session.materialIds && session.materialIds.length > 0
      ? session.materialIds
      : session.materialId
      ? [session.materialId]
      : [];

  if (ids.length === 0) {
    return session.sourceMode === 'multi-material' ? 'Flera material' : 'Ett material';
  }

  if (ids.length === 1) {
    const title = materialMap.get(ids[0])?.title;
    return title ? `Material: ${title}` : 'Ett material';
  }

  return `Material: ${summarizeMaterials(ids, materialMap)}`;
}

function getDisabledReason(definition: GameDefinition): string | undefined {
  if (definition.status === 'beta') {
    return 'Betaläge – lämna feedback om du vill testa först.';
  }
  if (definition.status === 'coming-soon') {
    return 'Kommer snart – spelmotorn byggs just nu.';
  }
  return undefined;
}

export function GamesHubPage() {
  const navigate = useNavigate();
  const materials = useAppStore((state) => state.materials);
  const loadMaterials = useAppStore((state) => state.loadMaterials);
  const gamePreferences = useAppStore((state) => state.gamePreferences);
  const setGamePreferences = useAppStore((state) => state.setGamePreferences);
  const recentGameSessions = useAppStore((state) => state.recentGameSessions);
  const loadRecentGameSessions = useAppStore((state) => state.loadRecentGameSessions);

  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [focusFilters, setFocusFilters] = useState<string[]>([]);
  const [scopeFilter, setScopeFilter] = useState<GameScopeMode | null>(null);
  const [multiplayerFilter, setMultiplayerFilter] = useState<MultiplayerFilter | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    if (!materials.length) {
      void loadMaterials();
    }
  }, [materials.length, loadMaterials]);

  useEffect(() => {
    void loadRecentGameSessions(REQUESTED_RECENT_SESSIONS);
  }, [loadRecentGameSessions]);

  const materialMap = useMemo(
    () => new Map<string, Material>(materials.map((material) => [material.id, material])),
    [materials]
  );

  const selectedMaterials = useMemo(() => {
    if (gamePreferences.includeAllMaterials) {
      return materials;
    }

    if (!gamePreferences.selectedMaterialIds.length) {
      return [];
    }

    return materials.filter((material) => gamePreferences.selectedMaterialIds.includes(material.id));
  }, [gamePreferences.includeAllMaterials, gamePreferences.selectedMaterialIds, materials]);

  const selectedMaterialNames = useMemo(
    () => selectedMaterials.map((material) => material.title),
    [selectedMaterials]
  );

  const sourceSummary = useMemo(() => {
    const { sourceMode, includeAllMaterials } = gamePreferences;

    if (sourceMode === 'single-material') {
      if (selectedMaterialNames.length > 0) {
        return `Källa: ${selectedMaterialNames[0]}`;
      }
      return 'Källa: Välj ett material';
    }

    if (sourceMode === 'multi-material') {
      if (includeAllMaterials && materials.length > 0) {
        return `Källa: Alla material (${materials.length})`;
      }
      if (selectedMaterialNames.length > 0) {
        const preview = selectedMaterialNames.slice(0, 3).join(', ');
        const remaining = selectedMaterialNames.length - 3;
        return `Källa: ${selectedMaterialNames.length} material (${preview}${
          remaining > 0 ? ` +${remaining}` : ''
        })`;
      }
      return 'Källa: Välj flera material';
    }

    if (selectedMaterialNames.length > 0) {
      const preview = selectedMaterialNames.slice(0, 2).join(', ');
      const remaining = selectedMaterialNames.length - 2;
      return `Källa: AI + ${selectedMaterialNames.length} material (${preview}${
        remaining > 0 ? ` +${remaining}` : ''
      })`;
    }

    return 'Källa: AI-genererat paket';
  }, [
    gamePreferences,
    materials.length,
    selectedMaterialNames,
  ]);

  const latestSession = recentGameSessions[0];
  const displayedRecentSessions = useMemo(
    () => recentGameSessions.slice(0, DISPLAYED_RECENT_SESSIONS),
    [recentGameSessions]
  );

  const hubStats = useMemo(() => {
    if (!recentGameSessions.length) {
      return null;
    }

    const totalXp = recentGameSessions.reduce((sum, session) => sum + (session.xpEarned ?? 0), 0);
    const totalDuration = recentGameSessions.reduce(
      (sum, session) => sum + (session.duration ?? 0),
      0
    );
    const snakeSessions = recentGameSessions.filter((session) => session.gameType === 'snake');
    const averageSnakeScore = snakeSessions.length
      ? Math.round(
          snakeSessions.reduce((sum, session) => sum + (session.score ?? 0), 0) / snakeSessions.length
        )
      : 0;
    const bestSnakeScore = snakeSessions.reduce(
      (max, session) => Math.max(max, session.score ?? 0),
      0
    );

    return {
      totalSessions: recentGameSessions.length,
      totalXp,
      totalDuration,
      averageSnakeScore,
      bestSnakeScore,
    };
  }, [recentGameSessions]);

  const filteredGames = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return GAME_DEFINITIONS.filter((game) => {
      if (showOnlyAvailable && game.status !== 'available') {
        return false;
      }

      if (scopeFilter && !game.supports.scope.includes(scopeFilter)) {
        return false;
      }

      if (multiplayerFilter === 'solo' && game.supports.multiplayer) {
        return false;
      }

      if (multiplayerFilter === 'multiplayer' && !game.supports.multiplayer) {
        return false;
      }

      if (difficultyFilter && game.difficulty !== difficultyFilter) {
        return false;
      }

      if (focusFilters.length > 0 && !focusFilters.some((focus) => game.focus.includes(focus))) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        game.name.toLowerCase().includes(query) ||
        game.description.toLowerCase().includes(query) ||
        game.focus.some((focus) => focus.toLowerCase().includes(query)) ||
        game.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [
    difficultyFilter,
    focusFilters,
    multiplayerFilter,
    scopeFilter,
    searchTerm,
    showOnlyAvailable,
  ]);

  const ensureSingleMaterialSelection = (): string | null => {
    const fallbackMaterialId = gamePreferences.selectedMaterialIds[0] ?? materials[0]?.id;

    if (!fallbackMaterialId) {
      return null;
    }

    if (!gamePreferences.selectedMaterialIds.length) {
      setGamePreferences({ selectedMaterialIds: [fallbackMaterialId] });
    }

    return fallbackMaterialId;
  };

  const handlePlaySnake = (mode: GameScopeMode) => {
    if (mode === 'single-material') {
      const materialId = ensureSingleMaterialSelection();
      if (!materialId) {
        alert('Välj ett material innan du startar Snake.');
        return;
      }
      navigate(`/study/material/${materialId}/game/snake`);
      return;
    }

    if (mode === 'multi-material') {
      if (!materials.length) {
        alert('Lägg till material innan du kombinerar flera källor.');
        return;
      }

      if (!gamePreferences.selectedMaterialIds.length && !gamePreferences.includeAllMaterials) {
        setGamePreferences({
          selectedMaterialIds: materials.map((material) => material.id),
          includeAllMaterials: true,
        });
      }
    }

    navigate('/games/snake');
  };

  const handlePlayGame = (definition: GameDefinition) => {
    if (definition.id !== 'snake') {
      const statusMessage =
        definition.status === 'beta'
          ? 'Det här spelet är i beta. Vi öppnar för testare via feedback-kanalen snart.'
          : 'Spelet släpps snart direkt i hubben – håll utkik!';
      alert(statusMessage);
      return;
    }

    handlePlaySnake(gamePreferences.sourceMode);
  };

  const handleQuickStart = (gameId: GameType) => {
    if (gameId !== QUICK_START_GAME) {
      alert('Snabbstart stöds just nu för Snake. Övriga spel släpps successivt.');
      return;
    }

    handlePlaySnake(gamePreferences.sourceMode);
  };

  const handleResumeSession = (session: GameSession) => {
    if (session.gameType !== 'snake') {
      alert('Det här spelläget är inte redo än, men dina sessioner sparas tills vidare.');
      return;
    }

    if (session.sourceMode === 'single-material') {
      const materialId =
        session.materialId ??
        session.materialIds?.[0] ??
        gamePreferences.selectedMaterialIds[0] ??
        materials[0]?.id;

      if (!materialId) {
        alert('Materialet saknas – välj ett material för att fortsätta.');
        return;
      }

      setGamePreferences({
        sourceMode: 'single-material',
        selectedMaterialIds: [materialId],
        includeAllMaterials: false,
      });

      navigate(`/study/material/${materialId}/game/snake`);
      return;
    }

    setGamePreferences({
      sourceMode: session.sourceMode,
      selectedMaterialIds: session.materialIds ?? [],
      includeAllMaterials: session.sourceMode === 'multi-material' ? session.materialIds?.length === materials.length : false,
    });

    navigate('/games/snake');
  };

  const toggleFocusFilter = (id: string) => {
    setFocusFilters((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  const renderFilterChips = (
    options: GameFilterOption[],
    activeChecker: (id: string) => boolean,
    onToggle: (id: string) => void
  ) => (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = activeChecker(option.id);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onToggle(option.id)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              isActive
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-300 dark:bg-primary-900/40 dark:text-primary-200'
                : 'border-gray-200 text-gray-600 hover:border-primary-300 dark:border-gray-700 dark:text-gray-300'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <MainLayout title="Spel">
      <div className="py-6 space-y-8">
        {/* Hero Section - Redesigned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden border-primary-200 bg-gradient-to-br from-primary-500/10 via-primary-50/50 to-white dark:from-primary-950 dark:via-primary-900/20 dark:to-gray-950">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-400/5 rounded-full blur-3xl" />

            <div className="relative p-8 md:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="flex-1 space-y-6 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30">
                      <Gamepad2 className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary-600 shadow-sm dark:bg-gray-900/70 dark:text-primary-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        Ny spelhubb
                      </span>
                      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                        Spelhubben
                      </h1>
                    </div>
                  </div>

                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                    Välj material eller generera begrepp med AI, sedan spelar du direkt. Snake är live – fler spel släpps snart!
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      onClick={() => handleQuickStart(QUICK_START_GAME)}
                      className="shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all"
                    >
                      <Zap className="mr-2 h-5 w-5" />
                      Snabbstarta Snake
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => navigate('/study')}
                      className="bg-white/80 backdrop-blur text-gray-700 hover:bg-white dark:bg-gray-900/80 dark:text-gray-200 dark:hover:bg-gray-900 shadow-md"
                    >
                      <BookOpen className="mr-2 h-5 w-5" />
                      Skapa material
                    </Button>
                  </div>

                  {/* Current Source Preview */}
                  <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl bg-white/60 backdrop-blur border border-primary-100 dark:bg-gray-900/40 dark:border-primary-800/50">
                    <Target className="h-4 w-4 text-primary-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Valt innehåll:
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{sourceSummary}</span>
                    {gamePreferences.sourceMode === 'generated' && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                        AI-granskning krävs
                      </span>
                    )}
                  </div>
                </div>

                {/* Latest Session Card - Redesigned */}
                {latestSession && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Card className="w-full lg:w-80 border-primary-200 bg-white/90 backdrop-blur p-5 shadow-xl dark:border-primary-800/50 dark:bg-gray-900/80">
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary-500/10">
                            <History className="h-4 w-4 text-primary-500" />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            Senaste session
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(new Date(latestSession.completedAt))}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {GAME_DEFINITIONS.find((game) => game.id === latestSession.gameType)?.name ??
                          latestSession.gameType}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {getSessionSourceDescription(latestSession, materialMap)}
                      </p>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {latestSession.score}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">poäng</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                            {latestSession.xpEarned}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">XP</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatDuration(latestSession.duration ?? 0)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">tid</p>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => handleResumeSession(latestSession)}
                      >
                        <History className="mr-2 h-4 w-4" />
                        Spela igen
                      </Button>
                    </Card>
                  </motion.div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Progress Stats - Redesigned */}
        {hubStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary-500" />
                Dina framsteg
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Statistik från dina senaste {recentGameSessions.length} sessioner
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card className="p-5 border-primary-200 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950/50 dark:to-gray-900 dark:border-primary-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-primary-500/10">
                      <Gamepad2 className="h-5 w-5 text-primary-500" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      Sessioner
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {hubStats.totalSessions}
                  </p>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card className="p-5 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/50 dark:to-gray-900 dark:border-emerald-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10">
                      <Sparkles className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      XP Insamlat
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                    {hubStats.totalXp}
                  </p>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card className="p-5 border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/50 dark:to-gray-900 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-blue-500/10">
                      <Clock3 className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      Spelad tid
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {formatDuration(hubStats.totalDuration)}
                  </p>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card className="p-5 border-amber-200 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/50 dark:to-gray-900 dark:border-amber-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-amber-500/10">
                      <Trophy className="h-5 w-5 text-amber-500" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      Bästa Snake
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                    {hubStats.bestSnakeScore}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Snitt {hubStats.averageSnakeScore}p
                  </p>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Innehållskälla</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Välj vilka material eller AI-paket som ska mata spelen.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/study/materials')}>
              Hantera material
            </Button>
          </div>
          <GameSourceSelector
            materials={materials}
            preferences={gamePreferences}
            onUpdate={setGamePreferences}
          />
        </section>

        {/* Filters Section - Redesigned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="p-5 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus-within:ring-2 focus-within:ring-primary-300 focus-within:border-primary-400 dark:border-gray-700 dark:bg-gray-900 transition-all">
                  <Search className="h-5 w-5 text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Sök spel, fokus eller taggar..."
                    className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:border-primary-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={showOnlyAvailable}
                    onChange={(event) => setShowOnlyAvailable(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  Endast klara spel
                </label>

                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-primary-300 transition-colors"
                >
                  <Target className="h-4 w-4" />
                  Avancerade filter
                  {showAdvancedFilters ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Active Filters Summary */}
            {(focusFilters.length > 0 || scopeFilter || multiplayerFilter || difficultyFilter) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Aktiva filter:
                </span>
                {focusFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => toggleFocusFilter(filter)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200 text-xs font-medium hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors"
                  >
                    {GAME_FOCUS_FILTERS.find((f) => f.id === filter)?.label}
                    <X className="h-3 w-3" />
                  </button>
                ))}
                {scopeFilter && (
                  <button
                    onClick={() => setScopeFilter(null)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200 text-xs font-medium hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors"
                  >
                    {GAME_SCOPE_FILTERS.find((f) => f.id === scopeFilter)?.label}
                    <X className="h-3 w-3" />
                  </button>
                )}
                {multiplayerFilter && (
                  <button
                    onClick={() => setMultiplayerFilter(null)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200 text-xs font-medium hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors"
                  >
                    {GAME_MULTIPLAYER_FILTERS.find((f) => f.id === multiplayerFilter)?.label}
                    <X className="h-3 w-3" />
                  </button>
                )}
                {difficultyFilter && (
                  <button
                    onClick={() => setDifficultyFilter(null)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200 text-xs font-medium hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors"
                  >
                    {GAME_DIFFICULTY_FILTERS.find((f) => f.id === difficultyFilter)?.label}
                    <X className="h-3 w-3" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setFocusFilters([]);
                    setScopeFilter(null);
                    setMultiplayerFilter(null);
                    setDifficultyFilter(null);
                  }}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline"
                >
                  Rensa alla
                </button>
              </div>
            )}

            {/* Advanced Filters - Collapsible */}
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Target className="h-4 w-4 text-primary-500" />
                      Fokus
                    </p>
                    {renderFilterChips(
                      GAME_FOCUS_FILTERS,
                      (id) => focusFilters.includes(id),
                      toggleFocusFilter
                    )}
                  </div>
                  <div>
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Sparkles className="h-4 w-4 text-primary-500" />
                      Innehåll
                    </p>
                    {renderFilterChips(
                      GAME_SCOPE_FILTERS,
                      (id) => scopeFilter === id,
                      (id) =>
                        setScopeFilter((current) => (current === id ? null : (id as GameScopeMode)))
                    )}
                  </div>
                  <div>
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Users className="h-4 w-4 text-primary-500" />
                      Spelläge
                    </p>
                    {renderFilterChips(
                      GAME_MULTIPLAYER_FILTERS,
                      (id) => multiplayerFilter === id,
                      (id) =>
                        setMultiplayerFilter((current) =>
                          current === (id as MultiplayerFilter) ? null : (id as MultiplayerFilter)
                        )
                    )}
                  </div>
                  <div>
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Clock3 className="h-4 w-4 text-primary-500" />
                      Svårighet
                    </p>
                    {renderFilterChips(
                      GAME_DIFFICULTY_FILTERS,
                      (id) => difficultyFilter === id,
                      (id) =>
                        setDifficultyFilter((current) => (current === id ? null : (id as Difficulty)))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Games Catalog - Redesigned */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="h-6 w-6 text-primary-500" />
                Tillgängliga spel
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {filteredGames.length === GAME_DEFINITIONS.length
                  ? 'Alla spel i katalogen'
                  : `${filteredGames.length} spel matchar dina filter`}
              </p>
            </div>
            {filteredGames.length > 0 && filteredGames.length < GAME_DEFINITIONS.length && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200 text-sm font-medium">
                <Target className="h-4 w-4" />
                {filteredGames.length} / {GAME_DEFINITIONS.length}
              </span>
            )}
          </div>

          {filteredGames.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Inga spel hittades
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Prova att justera dina filter eller sökord för att hitta fler spel.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFocusFilters([]);
                    setScopeFilter(null);
                    setMultiplayerFilter(null);
                    setDifficultyFilter(null);
                    setShowOnlyAvailable(false);
                  }}
                >
                  Rensa alla filter
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <GameCard
                    definition={game}
                    disabled={game.status !== 'available'}
                    disabledReason={getDisabledReason(game)}
                    onPlay={() => handlePlayGame(game)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Session History - Redesigned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <History className="h-6 w-6 text-primary-500" />
                  Senaste sessioner
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {displayedRecentSessions.length > 0
                    ? `Visar ${displayedRecentSessions.length} av ${recentGameSessions.length} sessioner`
                    : 'Ingen spelhistorik ännu'}
                </p>
              </div>
            </div>

            {displayedRecentSessions.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Gamepad2 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Börja spela för att se statistik
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Starta Snake från snabbstarten för att bygga upp din spelhistorik.
                </p>
                <Button onClick={() => handleQuickStart(QUICK_START_GAME)}>
                  <Zap className="mr-2 h-4 w-4" />
                  Starta första sessionen
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedRecentSessions.map((session, index) => {
                  const definition = GAME_DEFINITIONS.find((game) => game.id === session.gameType);
                  const canResume = definition?.id === 'snake' && definition.status === 'available';
                  const Icon = definition?.icon && ICON_MAP[definition.icon] ? ICON_MAP[definition.icon] : Gamepad2;

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      className="group"
                    >
                      <Card className="p-4 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                              <Icon className="h-5 w-5 text-primary-500" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                  {definition?.name ?? session.gameType}
                                </h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatRelativeTime(new Date(session.completedAt))}
                                </span>
                              </div>

                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                {getSessionSourceDescription(session, materialMap)}
                              </p>

                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300">
                                  <Trophy className="h-3 w-3" />
                                  {session.score}p
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                  <Sparkles className="h-3 w-3" />
                                  {session.xpEarned} XP
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-xs font-medium text-blue-700 dark:text-blue-300">
                                  <Clock3 className="h-3 w-3" />
                                  {formatDuration(session.duration ?? 0)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant={canResume ? 'default' : 'ghost'}
                            disabled={!canResume}
                            onClick={() => handleResumeSession(session)}
                            className="sm:w-auto w-full"
                          >
                            {canResume ? (
                              <>
                                <History className="mr-2 h-4 w-4" />
                                Spela igen
                              </>
                            ) : (
                              'Kommer snart'
                            )}
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
