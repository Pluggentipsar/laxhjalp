/**
 * UniversalGameLauncher
 *
 * A component that can launch any game with unified content.
 * Supports loading content from materials, math questions, or word packages.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import type {
  GameContentItem,
  GameContentConfig,
  UnifiedGameType,
  UnifiedGameResult,
} from '../../types/game-content';
import { loadGameContent, generateDistractors } from '../../services/gameContentAdapter';

// Import all game components
import { OrdregnGame } from '../../pages/motion-learn/games/OrdregnGame';
import { HeaderMatchGame } from '../../pages/motion-learn/games/HeaderMatchGame';
import { WhackAWordGame } from '../../pages/motion-learn/games/WhackAWordGame';
import { GoalKeeperGame } from '../../pages/motion-learn/games/GoalKeeperGame';
import { FallingBlocksGame } from './FallingBlocksGame';
import { SpaceShooterGame } from './SpaceShooterGame';
import { MathRacerGame } from './MathRacerGame';

interface UniversalGameLauncherProps {
  /** The game to launch */
  gameId: UnifiedGameType;
  /** Configuration for loading content */
  contentConfig: GameContentConfig;
  /** Callback when game completes */
  onComplete?: (result: UnifiedGameResult) => void;
  /** Callback when user wants to go back */
  onBack?: () => void;
  /** Optional title to show */
  title?: string;
}

export function UniversalGameLauncher({
  gameId,
  contentConfig,
  onComplete,
  onBack,
  title,
}: UniversalGameLauncherProps) {
  const navigate = useNavigate();
  const [content, setContent] = useState<GameContentItem[]>([]);
  const [contentName, setContentName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load content on mount
  useEffect(() => {
    async function loadContent() {
      try {
        setLoading(true);
        setError(null);

        const pkg = await loadGameContent(contentConfig);

        if (pkg.items.length === 0) {
          setError('Inget innehåll hittades. Välj ett annat material eller ämnesområde.');
          return;
        }

        // Ensure items have distractors for multiple-choice games
        const itemsWithDistractors = generateDistractors(pkg.items);
        setContent(itemsWithDistractors);
        setContentName(pkg.name);
      } catch (err) {
        console.error('Failed to load game content:', err);
        setError('Kunde inte ladda spelinnehåll. Försök igen.');
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [contentConfig]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleComplete = (result: UnifiedGameResult) => {
    if (onComplete) {
      onComplete(result);
    }
    // Could also save to spaced repetition here
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Laddar spel...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Något gick fel
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Button onClick={handleBack}>Tillbaka</Button>
        </Card>
      </div>
    );
  }

  // Not enough content
  if (content.length < 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            För lite innehåll
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Det behövs minst 3 frågor/begrepp för att spela detta spel.
            Hittade endast {content.length}.
          </p>
          <Button onClick={handleBack}>Tillbaka</Button>
        </Card>
      </div>
    );
  }

  // Render the appropriate game
  const gameProps = {
    content,
    contentPackageName: title || contentName,
    onComplete: handleComplete,
    onBack: handleBack,
  };

  switch (gameId) {
    // Motion Learn games
    case 'ordregn':
      return <OrdregnGame {...gameProps} />;
    case 'headermatch':
      return <HeaderMatchGame {...gameProps} />;
    case 'whack-a-word':
      return <WhackAWordGame {...gameProps} />;
    case 'goalkeeper':
      return <GoalKeeperGame {...gameProps} />;

    // Math/Arcade games - need different props structure
    case 'falling-blocks':
      return (
        <FallingBlocksGame
          content={content}
          onGameOver={() => {}}
          onScoreUpdate={() => {}}
          onComplete={handleComplete}
        />
      );
    case 'space-shooter':
      return (
        <SpaceShooterGame
          content={content}
          onGameOver={() => {}}
          onScoreUpdate={() => {}}
          onComplete={handleComplete}
        />
      );
    case 'math-racer':
      return (
        <MathRacerGame
          content={content}
          onGameOver={() => {}}
          onScoreUpdate={() => {}}
          onComplete={handleComplete}
        />
      );

    // Other games (not yet implemented for unified content)
    default:
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
          <Card className="p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Spelet är inte tillgängligt
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {gameId} stöder inte universellt innehåll ännu.
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka
            </Button>
          </Card>
        </div>
      );
  }
}
