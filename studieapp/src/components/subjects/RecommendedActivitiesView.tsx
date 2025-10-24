import { motion } from 'framer-motion';
import { Target, TrendingUp, RotateCcw, Sparkles } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useNavigate } from 'react-router-dom';
import type { SubjectActivity } from '../../types';

interface RecommendedActivitiesViewProps {
  subjectHub: string;
  ageGroup: string;
  activities: SubjectActivity[];
  onShowAll: () => void;
}

export function RecommendedActivitiesView({
  subjectHub,
  activities,
  onShowAll,
}: RecommendedActivitiesViewProps) {
  const navigate = useNavigate();

  // TODO: Later implement smart AI-based recommendations
  // For now, use simple heuristics
  const continueActivity = activities.find((a) => a.id.includes('1-10')); // Simulate "last activity"
  const nextActivity = activities.find((a) => a.id.includes('dubbletter')); // Simulate "recommended next"
  const reviewActivity = activities.find((a) => a.id.includes('repetera'));

  const recommendedCards = [
    continueActivity && {
      activity: continueActivity,
      type: 'continue' as const,
      icon: Target,
      badge: 'FORTSÄTT TRÄNA',
      badgeColor: 'bg-purple-500',
      description: 'Fortsätt där du slutade',
      gradient: 'from-purple-500 to-pink-500',
    },
    nextActivity && {
      activity: nextActivity,
      type: 'next' as const,
      icon: TrendingUp,
      badge: 'NÄSTA STEG',
      badgeColor: 'bg-green-500',
      description: 'Perfekt nästa utmaning!',
      gradient: 'from-green-500 to-teal-500',
    },
    reviewActivity && {
      activity: reviewActivity,
      type: 'review' as const,
      icon: RotateCcw,
      badge: 'REPETERA',
      badgeColor: 'bg-orange-500',
      description: 'Öva på det du missat',
      gradient: 'from-orange-500 to-red-500',
    },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            Rekommenderat för dig
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Vi har valt ut aktiviteter baserat på din nivå
          </p>
        </div>
      </div>

      {/* Recommended Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendedCards.map((card, index) => {
          if (!card) return null;
          const { activity, type, icon: Icon, badge, badgeColor, description, gradient } = card;

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`p-6 cursor-pointer hover:shadow-lg transition-all border-2 ${
                  type === 'continue'
                    ? 'border-purple-200 dark:border-purple-800'
                    : type === 'next'
                    ? 'border-green-200 dark:border-green-800'
                    : 'border-orange-200 dark:border-orange-800'
                }`}
                onClick={() => navigate(`/subjects/${subjectHub}/${activity.id}`)}
              >
                {/* Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold text-white ${badgeColor}`}
                  >
                    {badge}
                  </span>
                  <Icon className="w-5 h-5 text-gray-400" />
                </div>

                {/* Gradient bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${gradient} rounded-full mb-4`} />

                {/* Content */}
                <h3 className="text-xl font-bold mb-2">{activity.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                  {activity.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span>⏱️ {activity.estimatedDuration}</span>
                  <span
                    className={`px-2 py-1 rounded ${
                      activity.difficulty === 'easy'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : activity.difficulty === 'medium'
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {activity.difficulty === 'easy'
                      ? 'Lätt'
                      : activity.difficulty === 'medium'
                      ? 'Medel'
                      : 'Svår'}
                  </span>
                </div>

                {/* Action */}
                <Button className="w-full" size="sm">
                  {type === 'continue' ? 'Fortsätt →' : type === 'next' ? 'Börja →' : 'Repetera →'}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Show All Button */}
      <div className="flex justify-center pt-4">
        <Button onClick={onShowAll} variant="outline" size="lg">
          🔍 Visa alla aktiviteter ({activities.length})
        </Button>
      </div>
    </div>
  );
}
