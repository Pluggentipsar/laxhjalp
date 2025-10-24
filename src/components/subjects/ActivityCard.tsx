import { motion } from 'framer-motion';
import {
  Clock,
  ChevronRight,
  Plus,
  Minus,
  X as XIcon,
  Divide,
  Circle,
  Square,
  Box,
  Triangle,
  TrendingUp,
  Equal,
  Workflow,
  MessageSquare,
  FileText,
  GitBranch,
  PieChart,
  Dices,
  Lightbulb,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '../common/Card';
import type { SubjectActivity } from '../../types';

const ICON_MAP: Record<string, LucideIcon> = {
  Plus,
  Minus,
  X: XIcon,
  Divide,
  Circle,
  Square,
  Box,
  Triangle,
  TrendingUp,
  Equal,
  Workflow,
  MessageSquare,
  FileText,
  GitBranch,
  PieChart,
  Dices,
  Lightbulb,
  RotateCcw,
  BarChart: PieChart,
  Variable: Equal,
  Shapes: Square,
};

interface ActivityCardProps {
  activity: SubjectActivity;
  gradient: string;
  onClick?: () => void;
  index?: number;
}

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  hard: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

const DIFFICULTY_LABELS = {
  easy: 'Lätt',
  medium: 'Medel',
  hard: 'Svår',
};

export function ActivityCard({ activity, gradient, onClick, index = 0 }: ActivityCardProps) {
  const Icon = ICON_MAP[activity.icon] || Lightbulb;
  const isComingSoon = activity.status === 'coming-soon';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card
        onClick={() => !isComingSoon && onClick?.()}
        className={`group relative overflow-hidden ${
          isComingSoon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {/* Gradient accent */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}
        />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3 flex-1">
              <div
                className={`p-2.5 rounded-lg bg-gradient-to-br ${gradient} shadow-md flex-shrink-0`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 dark:text-white mb-1 leading-tight">
                  {activity.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
                  {activity.tagline}
                </p>
              </div>
            </div>
            {!isComingSoon && (
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-2" />
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {activity.description}
          </p>

          {/* Footer with metadata */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status badge */}
              {isComingSoon ? (
                <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                  Kommer snart
                </span>
              ) : (
                <>
                  {/* Duration */}
                  {activity.estimatedDuration && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{activity.estimatedDuration}</span>
                    </div>
                  )}

                  {/* Difficulty */}
                  {activity.difficulty && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        DIFFICULTY_COLORS[activity.difficulty]
                      }`}
                    >
                      {DIFFICULTY_LABELS[activity.difficulty]}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Tags */}
            {activity.tags && activity.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {activity.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hover effect */}
        {!isComingSoon && (
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-700 rounded-xl transition-colors pointer-events-none" />
        )}
      </Card>
    </motion.div>
  );
}
