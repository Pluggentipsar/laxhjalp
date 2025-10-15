import { useAppStore } from '../store/appStore';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  User,
  Trophy,
  Flame,
  Target,
  Settings,
  Volume2,
  Moon,
  Sun,
  Bell,
  Download,
} from 'lucide-react';

export function ProfilePage() {
  const user = useAppStore((state) => state.user);
  const updateUser = useAppStore((state) => state.updateUser);

  if (!user) return null;

  const badges = [
    { id: '1', name: 'Första Dagen', icon: '🎯', unlocked: true },
    { id: '2', name: 'Veckostreak', icon: '🔥', unlocked: user.streak >= 7 },
    { id: '3', name: 'Level 5', icon: '⭐', unlocked: user.level >= 5 },
    { id: '4', name: 'Mästare', icon: '👑', unlocked: false },
  ];

  return (
    <MainLayout title="Profil">
      <div className="py-6 space-y-6">
        {/* User info */}
        <Card className="text-center py-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl text-white font-bold">
            {user.name[0].toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {user.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Årskurs {user.grade}
          </p>

          <div className="flex justify-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-500">
                {user.level}
              </div>
              <div className="text-sm text-gray-500">Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {user.streak}
              </div>
              <div className="text-sm text-gray-500">Dagstreak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {user.totalXp}
              </div>
              <div className="text-sm text-gray-500">Total XP</div>
            </div>
          </div>
        </Card>

        {/* Badges */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Trophy size={20} />
            Badges
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {badges.map((badge) => (
              <Card
                key={badge.id}
                className={`text-center p-4 ${
                  !badge.unlocked ? 'opacity-40' : ''
                }`}
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {badge.name}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Mål */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Target size={20} />
            Dina Mål
          </h3>
          <Card className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Dagligt mål (minuter)
              </label>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={user.dailyGoalMinutes}
                onChange={(e) =>
                  updateUser({ dailyGoalMinutes: Number(e.target.value) })
                }
                className="w-full mt-2"
              />
              <div className="text-right text-sm font-medium text-gray-900 dark:text-white">
                {user.dailyGoalMinutes} minuter
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Dagar per vecka
              </label>
              <input
                type="range"
                min="1"
                max="7"
                value={user.weeklyGoalDays}
                onChange={(e) =>
                  updateUser({ weeklyGoalDays: Number(e.target.value) })
                }
                className="w-full mt-2"
              />
              <div className="text-right text-sm font-medium text-gray-900 dark:text-white">
                {user.weeklyGoalDays} dagar
              </div>
            </div>
          </Card>
        </div>

        {/* Inställningar */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Settings size={20} />
            Inställningar
          </h3>
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 size={20} className="text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Text-till-tal
                  </div>
                  <div className="text-sm text-gray-500">
                    Läs upp text automatiskt
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  updateUser({
                    settings: {
                      ...user.settings,
                      ttsEnabled: !user.settings.ttsEnabled,
                    },
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  user.settings.ttsEnabled ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    user.settings.ttsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sun size={20} className="text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Mörkt tema
                  </div>
                  <div className="text-sm text-gray-500">
                    Skonsamt för ögonen
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  updateUser({
                    settings: {
                      ...user.settings,
                      theme: user.settings.theme === 'dark' ? 'light' : 'dark',
                    },
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  user.settings.theme === 'dark'
                    ? 'bg-primary-500'
                    : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    user.settings.theme === 'dark'
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Påminnelser
                  </div>
                  <div className="text-sm text-gray-500">
                    Dagliga studiepåminnelser
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  updateUser({
                    settings: {
                      ...user.settings,
                      remindersEnabled: !user.settings.remindersEnabled,
                    },
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  user.settings.remindersEnabled
                    ? 'bg-primary-500'
                    : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    user.settings.remindersEnabled
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
