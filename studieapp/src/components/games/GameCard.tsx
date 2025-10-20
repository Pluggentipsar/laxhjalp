import { memo } from 'react';
import {
  Gamepad2,
  Hammer,
  Shield,
  Grid3x3,
  Timer,
  Layers,
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

    return (
      <Card
        className={`p-5 space-y-4 border transition-shadow ${
          statusStyle.border
        } ${definition.status === 'available' ? 'hover:shadow-lg' : ''}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-300 flex items-center justify-center">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {definition.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{definition.tagline}</p>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full border ${statusStyle.text} ${statusStyle.border}`}>
            {statusStyle.label}
          </span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">{definition.description}</p>

        <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1">
            ⏱ {definition.averageDuration}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1 capitalize">
            🎯 {definition.difficulty}
          </span>
          {definition.focus.slice(0, 2).map((focus) => (
            <span
              key={focus}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1"
            >
              #{focus}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {definition.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-300 px-2 py-1 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => onPlay?.(definition)}
            disabled={disabled || definition.status !== 'available'}
            className="flex-1"
          >
            Spela
          </Button>
          {disabled && disabledReason && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{disabledReason}</span>
          )}
          {definition.status === 'coming-soon' && !disabledReason && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Arbete pågår – anmäl intresse i feedbacken!
            </span>
          )}
        </div>
      </Card>
    );
  }
);

GameCard.displayName = 'GameCard';
