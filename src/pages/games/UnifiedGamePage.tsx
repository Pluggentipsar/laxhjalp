/**
 * UnifiedGamePage
 *
 * A page that hosts any game from the unified game system.
 * Handles content selection and game launching.
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Gamepad2,
  BookOpen,
  Calculator,
  Play,
  Camera,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { UniversalGameLauncher } from '../../components/games/UniversalGameLauncher';
import { useAppStore } from '../../store/appStore';
import type {
  GameContentConfig,
  UnifiedGameResult,
  UnifiedGameDefinition,
} from '../../types/game-content';

// All available unified games
const UNIFIED_GAMES: UnifiedGameDefinition[] = [
  // Motion Learn Games
  {
    id: 'ordregn',
    name: 'Ordregn',
    description: 'Fånga rätt ord som faller med handtracking',
    category: 'motion',
    icon: 'Cloud',
    supportedSources: ['material', 'wordpackage', 'math'],
    requiresMotion: true,
    minItems: 3,
    status: 'available',
  },
  {
    id: 'headermatch',
    name: 'Header Match',
    description: 'Nicka ballonger med rätt svar',
    category: 'motion',
    icon: 'Target',
    supportedSources: ['material', 'wordpackage', 'math'],
    requiresMotion: true,
    minItems: 3,
    status: 'available',
  },
  {
    id: 'whack-a-word',
    name: 'Whack-a-Word',
    description: 'Slå rätt ord som dyker upp',
    category: 'motion',
    icon: 'Hand',
    supportedSources: ['material', 'wordpackage', 'math'],
    requiresMotion: true,
    minItems: 3,
    status: 'available',
  },
  {
    id: 'goalkeeper',
    name: 'Målvakt',
    description: 'Försvara mål genom att blockera rätt bollar',
    category: 'motion',
    icon: 'Shield',
    supportedSources: ['material', 'wordpackage', 'math'],
    requiresMotion: true,
    minItems: 3,
    status: 'available',
  },
  // Arcade Games
  {
    id: 'falling-blocks',
    name: 'Matteskur',
    description: 'Svara på mattetal genom att styra block',
    category: 'arkad',
    icon: 'Grid',
    supportedSources: ['math', 'material'],
    requiresMotion: false,
    minItems: 5,
    status: 'available',
  },
  {
    id: 'space-shooter',
    name: 'Rymdmatte',
    description: 'Skjut asteroider med rätt svar',
    category: 'arkad',
    icon: 'Rocket',
    supportedSources: ['math', 'material'],
    requiresMotion: false,
    minItems: 5,
    status: 'available',
  },
  {
    id: 'math-racer',
    name: 'Matteracer',
    description: 'Tävla genom att svara på frågor',
    category: 'arkad',
    icon: 'Car',
    supportedSources: ['math', 'material'],
    requiresMotion: false,
    minItems: 5,
    status: 'available',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  motion: 'Motion Learn',
  arkad: 'Arkadspel',
  begrepp: 'Begreppsspel',
};

const CATEGORY_COLORS: Record<string, string> = {
  motion: 'from-purple-500 to-pink-500',
  arkad: 'from-blue-500 to-cyan-500',
  begrepp: 'from-green-500 to-teal-500',
};

export function UnifiedGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const materials = useAppStore((state) => state.materials);
  const loadMaterials = useAppStore((state) => state.loadMaterials);

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSource, setSelectedSource] = useState<'material' | 'math'>('math');
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [selectedConceptArea, setSelectedConceptArea] = useState<string>('addition-subtraktion-1-3');

  // Load materials on mount
  useEffect(() => {
    if (materials.length === 0) {
      void loadMaterials();
    }
  }, [materials.length, loadMaterials]);

  // Check for auto-start from URL params
  useEffect(() => {
    const autoStart = searchParams.get('autoStart');
    const source = searchParams.get('source') as 'material' | 'math' | null;
    const materialId = searchParams.get('materialId');
    const conceptArea = searchParams.get('conceptArea');

    if (source) {
      setSelectedSource(source);
    }
    if (materialId) {
      setSelectedMaterialIds([materialId]);
    }
    if (conceptArea) {
      setSelectedConceptArea(conceptArea);
    }
    if (autoStart === 'true') {
      setIsPlaying(true);
    }
  }, [searchParams]);

  // Find the game definition
  const game = useMemo(
    () => UNIFIED_GAMES.find((g) => g.id === gameId),
    [gameId]
  );

  // Build content config based on selection
  const contentConfig: GameContentConfig = useMemo(() => {
    if (selectedSource === 'material' && selectedMaterialIds.length > 0) {
      return {
        sourceMode: selectedMaterialIds.length > 1 ? 'multi-material' : 'single-material',
        materialIds: selectedMaterialIds,
        minItems: game?.minItems || 3,
      };
    }

    return {
      sourceMode: 'math-topic',
      conceptArea: selectedConceptArea,
      minItems: game?.minItems || 3,
    };
  }, [selectedSource, selectedMaterialIds, selectedConceptArea, game]);

  const handleBack = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      navigate(-1);
    }
  };

  const handleComplete = (result: UnifiedGameResult) => {
    console.log('Game completed:', result);
    // Could save to spaced repetition, update stats, etc.
    setIsPlaying(false);
  };

  const handleStartGame = () => {
    setIsPlaying(true);
  };

  // Game not found
  if (!game) {
    return (
      <MainLayout title="Spel">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center max-w-md">
            <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Spelet hittades inte
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Spelet "{gameId}" finns inte i katalogen.
            </p>
            <Button onClick={() => navigate('/games')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka till spel
            </Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Playing mode - render the game
  if (isPlaying) {
    return (
      <UniversalGameLauncher
        gameId={game.id}
        contentConfig={contentConfig}
        onComplete={handleComplete}
        onBack={handleBack}
        title={game.name}
      />
    );
  }

  // Setup mode - select content source
  return (
    <MainLayout title={game.name}>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tillbaka
          </Button>
        </div>

        {/* Game Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`p-8 bg-gradient-to-br ${CATEGORY_COLORS[game.category]} text-white`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 rounded-2xl bg-white/20">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-sm font-medium opacity-80">
                  {CATEGORY_LABELS[game.category]}
                </span>
                <h1 className="text-3xl font-bold">{game.name}</h1>
              </div>
            </div>
            <p className="text-lg opacity-90">{game.description}</p>

            {game.requiresMotion && (
              <div className="mt-4 flex items-center gap-2 text-sm bg-white/20 rounded-lg px-3 py-2 inline-flex">
                <Camera className="w-4 h-4" />
                Kräver kamera för handtracking
              </div>
            )}
          </Card>
        </motion.div>

        {/* Content Source Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Välj innehåll
            </h2>

            {/* Source Type Toggle */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedSource('math')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedSource === 'math'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                <Calculator className={`w-8 h-8 mx-auto mb-2 ${
                  selectedSource === 'math' ? 'text-purple-600' : 'text-gray-400'
                }`} />
                <div className={`font-medium ${
                  selectedSource === 'math' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  Matematikfrågor
                </div>
                <div className="text-sm text-gray-500">Genererade frågor</div>
              </button>

              <button
                onClick={() => setSelectedSource('material')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedSource === 'material'
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-teal-300'
                }`}
              >
                <BookOpen className={`w-8 h-8 mx-auto mb-2 ${
                  selectedSource === 'material' ? 'text-teal-600' : 'text-gray-400'
                }`} />
                <div className={`font-medium ${
                  selectedSource === 'material' ? 'text-teal-700 dark:text-teal-300' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  Dina material
                </div>
                <div className="text-sm text-gray-500">
                  {materials.length} material tillgängliga
                </div>
              </button>
            </div>

            {/* Math Topic Selection */}
            {selectedSource === 'math' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Välj ämnesområde
                </label>
                <select
                  value={selectedConceptArea}
                  onChange={(e) => setSelectedConceptArea(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <optgroup label="Årskurs 1-3">
                    <option value="addition-subtraktion-1-3">Addition & Subtraktion</option>
                    <option value="taluppfattning-1-3">Taluppfattning</option>
                    <option value="geometri-1-3">Geometri</option>
                    <option value="monster-1-3">Mönster</option>
                  </optgroup>
                  <optgroup label="Årskurs 4-6">
                    <option value="addition-subtraktion-4-6">Addition & Subtraktion</option>
                    <option value="decimaltal-4-6">Decimaltal</option>
                    <option value="brak-4-6">Bråk</option>
                    <option value="enheter-4-6">Enheter</option>
                    <option value="area-omkrets-4-6">Area & Omkrets</option>
                    <option value="vinklar-4-6">Vinklar</option>
                  </optgroup>
                  <optgroup label="Årskurs 7-9">
                    <option value="algebra-7-9">Algebra</option>
                    <option value="procent-7-9">Procent</option>
                    <option value="statistik-7-9">Statistik</option>
                  </optgroup>
                </select>
              </div>
            )}

            {/* Material Selection */}
            {selectedSource === 'material' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Välj material
                </label>
                {materials.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Inga material hittades</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => navigate('/study')}
                    >
                      Skapa material
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-2 max-h-60 overflow-y-auto">
                    {materials.map((material) => (
                      <button
                        key={material.id}
                        onClick={() => {
                          if (selectedMaterialIds.includes(material.id)) {
                            setSelectedMaterialIds(
                              selectedMaterialIds.filter((id) => id !== material.id)
                            );
                          } else {
                            setSelectedMaterialIds([...selectedMaterialIds, material.id]);
                          }
                        }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedMaterialIds.includes(material.id)
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-teal-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {material.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(material.concepts?.length || 0) + (material.flashcards?.length || 0)} begrepp
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            size="lg"
            onClick={handleStartGame}
            disabled={selectedSource === 'material' && selectedMaterialIds.length === 0}
            className="w-full py-6 text-xl"
          >
            <Play className="mr-3 h-6 w-6" />
            Starta {game.name}
          </Button>
        </motion.div>
      </div>
    </MainLayout>
  );
}
