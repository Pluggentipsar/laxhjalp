import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock3,
  History,
  Search,
  Sparkles,
  Target,
  Users,
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
      <div className="py-6 space-y-6">
        <Card className="p-6 md:p-8 border-primary-200 bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-primary-950 dark:via-gray-950 dark:to-primary-900/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
            <div className="space-y-4 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary-600 shadow-sm dark:bg-gray-900/60 dark:text-primary-200">
                <Sparkles className="h-3.5 w-3.5" />
                Ny spelhubbsbeta
              </span>
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Spelhubben</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Snabbstarta Snake, förbered kommande spel och följ din spelstatistik. Välj material,
                  få AI-paket och hoppa tillbaka till ditt senaste pass på några sekunder.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => handleQuickStart(QUICK_START_GAME)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Snabbstarta Snake
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/study')}
                  className="bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Skapa nytt material
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-primary-800 dark:text-primary-200">
                <Sparkles className="h-4 w-4" />
                <span>{sourceSummary}</span>
                {gamePreferences.sourceMode === 'generated' && (
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                    AI-granskning före start
                  </span>
                )}
              </div>
            </div>

            {latestSession && (
              <Card className="w-full max-w-sm border-primary-200 bg-white/80 p-4 shadow-md backdrop-blur dark:border-primary-800 dark:bg-gray-900/70">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <History className="h-4 w-4 text-primary-500" />
                    Senaste session
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatRelativeTime(new Date(latestSession.completedAt))}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {GAME_DEFINITIONS.find((game) => game.id === latestSession.gameType)?.name ??
                    latestSession.gameType}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {getSessionSourceDescription(latestSession, materialMap)}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-gray-500 dark:text-gray-400">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {latestSession.score}
                    </p>
                    <p>poäng</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {latestSession.xpEarned}
                    </p>
                    <p>XP</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatDuration(latestSession.duration ?? 0)}
                    </p>
                    <p>tid</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => handleResumeSession(latestSession)}
                >
                  Spela igen
                </Button>
              </Card>
            )}
          </div>
        </Card>

        {hubStats && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Spelsessioner
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {hubStats.totalSessions}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                XP insamlat
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {hubStats.totalXp}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Spelad tid
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {formatDuration(hubStats.totalDuration)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Snake-toppar
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {hubStats.bestSnakeScore}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Snitt {hubStats.averageSnakeScore} poäng
              </p>
            </Card>
          </div>
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

        <Card className="p-4 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus-within:ring-2 focus-within:ring-primary-200 dark:border-gray-700 dark:text-gray-300">
              <Search className="h-4 w-4" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Sök efter spel, fokus eller taggar…"
                className="flex-1 bg-transparent focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showOnlyAvailable}
                onChange={(event) => setShowOnlyAvailable(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Visa endast klara spel
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <Target className="h-3.5 w-3.5" />
                Fokus
              </p>
              {renderFilterChips(
                GAME_FOCUS_FILTERS,
                (id) => focusFilters.includes(id),
                toggleFocusFilter
              )}
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <Sparkles className="h-3.5 w-3.5" />
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
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <Users className="h-3.5 w-3.5" />
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
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <Clock3 className="h-3.5 w-3.5" />
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
        </Card>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tillgängliga spel</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Filtrera fram ett spelläge som matchar din träning.
              </p>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {filteredGames.length} spel matchar dina filter
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                definition={game}
                disabled={game.status !== 'available'}
                disabledReason={getDisabledReason(game)}
                onPlay={() => handlePlayGame(game)}
              />
            ))}
          </div>
        </section>

        <Card className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <History className="h-4 w-4 text-primary-500" />
              Senaste sessioner
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Visar {displayedRecentSessions.length} av {recentGameSessions.length} sparade sessioner
            </span>
          </div>
          {displayedRecentSessions.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ingen speldata än. Starta Snake från snabbstarten för att fylla listan.
            </p>
          ) : (
            <div className="space-y-3">
              {displayedRecentSessions.map((session) => {
                const definition = GAME_DEFINITIONS.find((game) => game.id === session.gameType);
                const canResume = definition?.id === 'snake' && definition.status === 'available';

                return (
                  <div
                    key={session.id}
                    className="flex flex-col gap-3 rounded-xl border border-gray-200 px-3 py-3 md:flex-row md:items-center md:justify-between dark:border-gray-700"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {definition?.name ?? session.gameType}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(new Date(session.completedAt))}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-300">
                        <span>Poäng {session.score}</span>
                        <span>XP {session.xpEarned}</span>
                        <span>{formatDuration(session.duration ?? 0)}</span>
                        <span>{getSessionSourceDescription(session, materialMap)}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={canResume ? 'outline' : 'ghost'}
                      disabled={!canResume}
                      onClick={() => handleResumeSession(session)}
                    >
                      {canResume ? 'Spela igen' : 'Inte öppet ännu'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
