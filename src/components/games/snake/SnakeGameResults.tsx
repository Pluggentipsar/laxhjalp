import { useMemo } from 'react';
import { Sparkles, Layers, Gamepad2 } from 'lucide-react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { formatSessionDuration, type RoundResult, type SummaryReason } from '../../../hooks/useSnakeGame';
import type { GameContentPreparation, GameScopeMode } from '../../../types';

interface SnakeGameResultsProps {
  score: number;
  maxStreak: number;
  sessionDuration: number;
  lastXpEarned: number;
  roundResults: RoundResult[];
  summaryReason: SummaryReason;
  prepResult: GameContentPreparation;
  activeSourceMode: GameScopeMode;
  activeMaterialNames: string[];
  onPlayAgain: () => void;
  onExit: () => void;
}

export function SnakeGameResults({
  score,
  maxStreak,
  sessionDuration,
  lastXpEarned,
  roundResults,
  summaryReason,
  prepResult,
  activeSourceMode,
  activeMaterialNames,
  onPlayAgain,
  onExit,
}: SnakeGameResultsProps) {
  const accuracy = useMemo(() => {
    if (!roundResults.length) return 0;
    const correct = roundResults.filter((item) => item.success).length;
    return Math.round((correct / roundResults.length) * 100);
  }, [roundResults]);

  const mistakeResults = useMemo(
    () => roundResults.filter((item) => !item.success),
    [roundResults]
  );

  const materialPreview = useMemo(() => {
    if (!activeMaterialNames.length) return null;
    const preview = activeMaterialNames.slice(0, 2).join(', ');
    const remaining = activeMaterialNames.length - 2;
    return remaining > 0 ? `${preview} +${remaining}` : preview;
  }, [activeMaterialNames]);

  const materialSummary = useMemo(() => {
    if (!activeMaterialNames.length) return null;
    if (activeMaterialNames.length <= 4) return activeMaterialNames.join(', ');
    const preview = activeMaterialNames.slice(0, 4).join(', ');
    return `${preview} +${activeMaterialNames.length - 4}`;
  }, [activeMaterialNames]);

  const sourceDescription = useMemo(() => {
    if (activeSourceMode === 'generated') {
      if (activeMaterialNames.length > 0) {
        const preview = activeMaterialNames.slice(0, 2).join(', ');
        const remaining = activeMaterialNames.length - 2;
        return `AI + ${activeMaterialNames.length} material (${preview}${remaining > 0 ? ` +${remaining}` : ''})`;
      }
      return 'AI-genererat paket';
    }
    if (activeSourceMode === 'multi-material') {
      if (activeMaterialNames.length > 0) {
        const preview = activeMaterialNames.slice(0, 3).join(', ');
        const remaining = activeMaterialNames.length - 3;
        return `${activeMaterialNames.length} material (${preview}${remaining > 0 ? ` +${remaining}` : ''})`;
      }
      return 'Flera material';
    }
    if (activeMaterialNames.length === 1) return activeMaterialNames[0];
    return activeMaterialNames.length > 0 ? 'Ett material' : 'Välj material';
  }, [activeMaterialNames, activeSourceMode]);

  const sourceBadgeLabel = useMemo(() => {
    if (activeSourceMode === 'generated') {
      return prepResult.source === 'mixed' ? 'AI + material' : 'AI-genererat';
    }
    if (activeSourceMode === 'multi-material') return 'Flera material';
    return 'Ett material';
  }, [activeSourceMode, prepResult.source]);

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

  const activeLanguage = (prepResult.language ?? 'sv').toUpperCase();

  return (
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
        <Button onClick={onPlayAgain}>
          <Sparkles className="mr-2 h-4 w-4" />
          Spela igen
        </Button>
        <Button variant="outline" onClick={onExit}>
          Till studievyn
        </Button>
      </div>
    </Card>
  );
}
