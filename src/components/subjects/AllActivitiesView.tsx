import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Lock, CheckCircle2, Star, ArrowLeft } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useNavigate } from 'react-router-dom';
import type { SubjectActivity } from '../../types';

interface AllActivitiesViewProps {
  subjectHub: string;
  ageGroup: string;
  activities: SubjectActivity[];
  onBack: () => void;
}

interface ActivityLevel {
  id: string;
  name: string;
  description: string;
  activities: SubjectActivity[];
  unlocked: boolean;
  completed: boolean;
  icon: string;
}

export function AllActivitiesView({
  subjectHub,
  activities,
  onBack,
}: AllActivitiesViewProps) {
  const navigate = useNavigate();
  const [expandedLevel, setExpandedLevel] = useState<string | null>('grundniva');

  // TODO: Later implement real progress tracking from database
  // For now, use mock data based on activity IDs
  const levels: ActivityLevel[] = [
    {
      id: 'grundniva',
      name: 'Grundnivå',
      description: 'Börja här - perfekt för nybörjare',
      icon: '🌱',
      unlocked: true,
      completed: false,
      activities: activities.filter((a) =>
        ['addition-1-5', 'subtraktion-1-5'].includes(a.id)
      ),
    },
    {
      id: 'mellanniva',
      name: 'Mellannivå',
      description: 'Bygga vidare på grunderna',
      icon: '🌿',
      unlocked: true,
      completed: false,
      activities: activities.filter((a) =>
        ['addition-1-10', 'addition-dubbletter', 'subtraktion-1-10'].includes(a.id)
      ),
    },
    {
      id: 'hogresta',
      name: 'Högre Addition & Subtraktion',
      description: 'Träna med större tal',
      icon: '🌳',
      unlocked: true,
      completed: false,
      activities: activities.filter((a) =>
        ['addition-11-20', 'subtraktion-11-20'].includes(a.id)
      ),
    },
    {
      id: 'avancerat',
      name: 'Avancerat & Utmaningar',
      description: 'Strategier, flera steg och AI-problem',
      icon: '🚀',
      unlocked: true, // TODO: Lock based on completion
      completed: false,
      activities: activities.filter((a) =>
        ['addition-tiotalsovergaing', 'blandade-operationer', 'ai-utmaning'].includes(a.id)
      ),
    },
    {
      id: 'multiplikation-division',
      name: 'Multiplikation & Division',
      description: 'Gångertabellen och dela lika',
      icon: '✖️',
      unlocked: true,
      completed: false,
      activities: activities.filter((a) =>
        ['multiplikation-4-6', 'division-4-6'].includes(a.id)
      ),
    },
    {
      id: 'repetera',
      name: 'Repetera & Förstärk',
      description: 'Öva på misstag och förbättra',
      icon: '🔁',
      unlocked: true,
      completed: false,
      activities: activities.filter((a) => a.id.includes('repetera')),
    },
  ];

  const toggleLevel = (levelId: string) => {
    setExpandedLevel(expandedLevel === levelId ? null : levelId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till rekommenderat
          </Button>
          <h2 className="text-2xl font-bold">Alla aktiviteter</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {activities.length} aktiviteter att utforska
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg mb-1">Din progression</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fortsätt träna för att låsa upp fler aktiviteter!
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600">0/{activities.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Klarade aktiviteter</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: '0%' }} // TODO: Calculate from actual progress
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>
      </Card>

      {/* Levels */}
      <div className="space-y-3">
        {levels.map((level, index) => (
          <motion.div
            key={level.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`overflow-hidden ${!level.unlocked
                  ? 'opacity-60 bg-gray-50 dark:bg-gray-900'
                  : 'hover:shadow-md transition-shadow'
                }`}
            >
              {/* Level Header */}
              <button
                onClick={() => level.unlocked && toggleLevel(level.id)}
                disabled={!level.unlocked}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{level.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{level.name}</h3>
                      {level.completed && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      {!level.unlocked && <Lock className="w-4 h-4 text-gray-400" />}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {level.description} • {level.activities.length} aktiviteter
                    </p>
                  </div>
                </div>

                {level.unlocked &&
                  (expandedLevel === level.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ))}
              </button>

              {/* Activities List */}
              <AnimatePresence>
                {expandedLevel === level.id && level.unlocked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
                      {level.activities.map((activity) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card
                            className="p-4 cursor-pointer hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
                            onClick={() => navigate(`/subjects/${subjectHub}/${activity.id}`)}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{activity.name}</h4>
                                  {/* TODO: Show stars based on performance */}
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3].map((star) => (
                                      <Star
                                        key={star}
                                        className="w-3 h-3 text-gray-300 dark:text-gray-600"
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                  {activity.tagline}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                                  {activity.description}
                                </p>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-1">
                                  {activity.tags?.map((tag: string) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="text-right flex-shrink-0">
                                <div
                                  className={`px-2 py-1 rounded text-xs font-semibold mb-2 ${activity.difficulty === 'easy'
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
                                </div>
                                <div className="text-xs text-gray-500">
                                  ⏱️ {activity.estimatedDuration}
                                </div>
                              </div>
                            </div>

                            {/* Progress bar placeholder */}
                            <div className="mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                style={{ width: '0%' }} // TODO: Real progress
                              />
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-500">0% klarat</span>
                              <span className="text-xs text-gray-500">0/10 frågor</span>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
