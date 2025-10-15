import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  BookOpen,
  Zap,
  Target,
  Flame,
  GraduationCap,
  Gamepad2,
  MessageSquare,
  Plus,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { dbHelpers } from '../lib/db';
import type { DailyProgress } from '../types';

export function HomePage() {
  const user = useAppStore((state) => state.user);
  const materials = useAppStore((state) => state.materials);
  const loadMaterials = useAppStore((state) => state.loadMaterials);

  const [todayProgress, setTodayProgress] = useState<DailyProgress | null>(
    null
  );
  const [dueCards, setDueCards] = useState(0);

  useEffect(() => {
    loadMaterials();
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const progress = await dbHelpers.getTodayProgress();
    setTodayProgress(progress || null);

    const cards = await dbHelpers.getDueFlashcards();
    setDueCards(cards.length);
  };

  const progressPercent = user
    ? ((todayProgress?.minutesStudied || 0) / user.dailyGoalMinutes) * 100
    : 0;

  const recentMaterials = materials
    .sort(
      (a, b) =>
        (b.lastStudied?.getTime() || 0) - (a.lastStudied?.getTime() || 0)
    )
    .slice(0, 3);

  const studyModes = [
    {
      icon: GraduationCap,
      label: 'Flashcards',
      gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      path: '/study/flashcards',
      emoji: '🎴',
      info: dueCards > 0 ? `${dueCards} att öva` : 'Repetera kort',
    },
    {
      icon: MessageSquare,
      label: 'Chattförhör',
      gradient: 'bg-gradient-to-br from-purple-500 to-pink-500',
      path: '/study/chat',
      emoji: '💬',
      info: 'AI-förhör',
    },
    {
      icon: TrendingUp,
      label: 'Quiz',
      gradient: 'bg-gradient-to-br from-emerald-400 to-green-600',
      path: '/study/quiz',
      emoji: '📝',
      info: 'Testa dig',
    },
    {
      icon: Gamepad2,
      label: 'Spel',
      gradient: 'bg-gradient-to-br from-rose-400 to-red-600',
      path: '/games',
      emoji: '🎮',
      info: 'Lär dig lekande',
    },
  ];

  return (
    <MainLayout>
      <div className="pb-6">
        {/* Hero Section - Enkel och ren */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mb-6"
        >
          {/* Välkomst och Streak */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900 dark:text-white"
              >
                Hej {user?.name || 'där'}! 👋
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 dark:text-gray-400 text-base sm:text-lg"
              >
                Redo att lära dig något nytt?
              </motion.p>
            </div>

            {/* Streak badge */}
            {user && user.streak > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', bounce: 0.5 }}
                className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-3 shadow-xl flex items-center gap-2 ml-3"
              >
                <Flame className="text-white animate-pulse" size={24} />
                <div className="text-white">
                  <div className="text-2xl font-bold leading-none">{user.streak}</div>
                  <div className="text-xs font-medium opacity-90">dagar</div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Level & XP Card */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {/* Level Badge */}
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <div className="text-white text-center">
                          <div className="text-xs font-bold opacity-75">LVL</div>
                          <div className="text-2xl font-bold leading-none">{user.level}</div>
                        </div>
                      </div>
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl blur-md opacity-50 -z-10" />
                    </div>

                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {user.totalXp} XP
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {user.totalXp % 1000} / 1000 till Level {user.level + 1}
                      </div>
                    </div>
                  </div>

                  {/* Procent badge */}
                  <div className="text-right">
                    <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {Math.floor(((user.totalXp % 1000) / 1000) * 100)}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">COMPLETE</div>
                  </div>
                </div>

                {/* Progress bar med gradient */}
                <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((user.totalXp % 1000) / 1000) * 100}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.7 }}
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg relative"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>

        <div className="space-y-6 px-4">
          {/* Dagens mål - Snyggare */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white">
                      <Target size={24} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Dagens Mål
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {todayProgress?.minutesStudied || 0} / {user?.dailyGoalMinutes || 10} minuter
                      </p>
                    </div>
                  </div>
                  {progressPercent >= 100 && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-4xl"
                    >
                      🎉
                    </motion.div>
                  )}
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.8 }}
                    className="bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 h-4 rounded-full shadow-lg"
                  />
                </div>

                {progressPercent >= 100 ? (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                    <p className="text-green-600 dark:text-green-400 font-bold text-center">
                      🎉 Grattis! Du har nått ditt mål idag!
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    {Math.max(
                      0,
                      (user?.dailyGoalMinutes || 10) - (todayProgress?.minutesStudied || 0)
                    )}{' '}
                    minuter kvar - Du klarar det! 💪
                  </p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Snabbstart - Mycket snyggare */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-primary-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Snabbstart
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {studyModes.map((mode, index) => {
                const Icon = mode.icon;
                return (
                  <Link key={mode.path} to={mode.path}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.1, type: 'spring' }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className={`${mode.gradient} rounded-xl shadow-lg overflow-hidden`}
                    >
                      {/* Gradient background med garanterad vit text */}
                      <div className="p-5 text-white min-h-[140px] flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3">
                          <Icon size={32} className="text-white drop-shadow-lg" />
                          <span className="text-4xl drop-shadow-lg">{mode.emoji}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-xl mb-1 text-white drop-shadow-md">{mode.label}</h3>
                          <p className="text-sm text-white/95 drop-shadow-sm">{mode.info}</p>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Senaste material */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Fortsätt Plugga
              </h2>
              <Link to="/material">
                <Button variant="ghost" size="sm">
                  Visa allt →
                </Button>
              </Link>
            </div>

            {recentMaterials.length > 0 ? (
              <div className="space-y-3">
                {recentMaterials.map((material, index) => (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                  >
                    <Link to={`/material/${material.id}`}>
                      <Card hover className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                            {material.title[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-white truncate mb-1">
                              {material.title}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                              <span className="capitalize">📚 {material.subject}</span>
                              <span>•</span>
                              <span>🎴 {material.flashcards.length} kort</span>
                            </div>
                          </div>
                          <div className="text-2xl">→</div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                  Inget Material Än
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Lägg till ditt första studiematerial och börja lära dig!
                </p>
                <Link to="/material">
                  <Button className="bg-gradient-primary shadow-glow">
                    <Plus size={20} className="mr-2" />
                    Lägg Till Material
                  </Button>
                </Link>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
