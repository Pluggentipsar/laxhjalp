import { memo } from 'react';
import {
  Gamepad2,
  Hammer,
  Shield,
  Grid3x3,
  Timer,
  Layers,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { GameDefinition } from '../../types';

const ICON_MAP: Record<string, LucideIcon> = {
  Gamepad2,
  Hammer,
  Shield,
  Grid3x3,
  Timer,
  Layers,
};

const STATUS_STYLE: Record<
  GameDefinition['status'],
  { border: string; text: string; label: string }
> = {
  available: {
    border: 'border-emerald-200 dark:border-emerald-700',
    text: 'text-emerald-700 dark:text-emerald-300',
    label: 'Klar att spela',
  },
  beta: {
    border: 'border-amber-200 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-300',
    label: 'Beta',
  },
  'coming-soon': {
    border: 'border-blue-200 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-300',
    label: 'Kommer snart',
  },
};

interface GameCardProps {
  definition: GameDefinition;
  disabled?: boolean;
  disabledReason?: string;
  onPlay?: (definition: GameDefinition) => void;
}

export const GameCard = memo(
  ({ definition, disabled = false, disabledReason, onPlay }: GameCardProps) => {
    const Icon = ICON_MAP[definition.icon] ?? Gamepad2;
    const statusStyle = STATUS_STYLE[definition.status];
    const isAvailable = definition.status === 'available';

    return (
      <Card
        className={`relative overflow-hidden p-6 space-y-4 border-2 transition-all duration-300 ${
          statusStyle.border
        } ${
          isAvailable
            ? 'hover:shadow-xl hover:scale-[1.02] hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer'
            : 'opacity-90'
        }`}
        onClick={isAvailable ? () => onPlay?.(definition) : undefined}
      >
        {/* Status indicator glow */}
        {isAvailable && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl" />
        )}

        {/* Header with icon and status */}
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 flex-1">
            <div
              className={`relative p-3.5 rounded-2xl flex items-center justify-center transition-all ${
                isAvailable
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <Icon
                className={`h-7 w-7 ${
                  isAvailable ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                {definition.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{definition.tagline}</p>
            </div>
          </div>
          <span
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border-2 ${statusStyle.text} ${statusStyle.border}`}
          >
            {statusStyle.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {definition.description}
        </p>

        {/* Metadata badges */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
            <Timer className="h-3.5 w-3.5" />
            {definition.averageDuration}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 capitalize">
            <Target className="h-3.5 w-3.5" />
            {definition.difficulty}
          </span>
          {definition.focus.slice(0, 2).map((focus) => (
            <span
              key={focus}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300"
            >
              #{focus}
            </span>
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {definition.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-lg bg-primary-500/10 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 px-2.5 py-1 text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Action button */}
        <div className="pt-2">
          {isAvailable ? (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onPlay?.(definition);
              }}
              className="w-full shadow-md hover:shadow-lg transition-shadow"
            >
              <Gamepad2 className="mr-2 h-4 w-4" />
              Spela nu
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                disabled
                className="w-full"
              >
                {definition.status === 'beta' ? 'Betaläge' : 'Kommer snart'}
              </Button>
              {(disabled && disabledReason) || definition.status === 'coming-soon' ? (
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
                  {disabledReason || 'Arbete pågår – anmäl intresse via feedback!'}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </Card>
    );
  }
);

GameCard.displayName = 'GameCard';
