import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  BookOpen,
  Globe,
  Map,
  Atom,
  Palette,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '../common/Card';
import type { SubjectHubDefinition } from '../../types';

const ICON_MAP: Record<string, LucideIcon> = {
  Calculator,
  BookOpen,
  Globe,
  Map,
  Atom,
  Palette,
};

interface SubjectHubCardProps {
  hub: SubjectHubDefinition;
  index: number;
}

export function SubjectHubCard({ hub, index }: SubjectHubCardProps) {
  const navigate = useNavigate();
  const Icon = ICON_MAP[hub.icon] || BookOpen;
  const categoryCount = hub.categories.length;
  const activityCount = hub.categories.reduce(
    (sum, cat) => sum + cat.activities.length,
    0
  );

  const isComingSoon = categoryCount === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        onClick={() => !isComingSoon && navigate(`/subjects/${hub.id}`)}
        className={`group relative overflow-hidden ${
          isComingSoon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {/* Gradient Background */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${hub.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}
        />

        <div className="relative p-6">
          {/* Icon & Title */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl bg-gradient-to-br ${hub.gradient} shadow-lg`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {hub.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {hub.description}
                </p>
              </div>
            </div>
            {!isComingSoon && (
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors group-hover:translate-x-1 transition-transform" />
            )}
          </div>

          {/* Stats */}
          {isComingSoon ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
                Kommer snart
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {categoryCount}
                </span>{' '}
                {categoryCount === 1 ? 'kategori' : 'kategorier'}
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {activityCount}
                </span>{' '}
                {activityCount === 1 ? 'aktivitet' : 'aktiviteter'}
              </div>
            </div>
          )}
        </div>

        {/* Hover Effect */}
        {!isComingSoon && (
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-700 rounded-xl transition-colors pointer-events-none" />
        )}
      </Card>
    </motion.div>
  );
}
