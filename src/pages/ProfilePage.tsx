import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/common/Card';
import {
  Trophy,
  Target,
  Settings,
  Volume2,
  Sun,
  Bell,
  Heart,
  Plus,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../services/authService';
import { BackgroundSelector } from '../components/profile/BackgroundSelector';
import type { BackgroundSettings } from '../types';

export function ProfilePage() {
  const user = useAppStore((state) => state.user);
  const updateUser = useAppStore((state) => state.updateUser);
  const { currentUser, refreshUserProfile } = useAuth();
  const [newInterest, setNewInterest] = useState('');

  if (!user) return null;

  const badges = [
    { id: '1', name: 'Första Dagen', icon: '🎯', unlocked: true },
    { id: '2', name: 'Veckostreak', icon: '🔥', unlocked: user.streak >= 7 },
    { id: '3', name: 'Level 5', icon: '⭐', unlocked: user.level >= 5 },
    { id: '4', name: 'Mästare', icon: '👑', unlocked: false },
  ];

  const handleAddInterest = async (interestText?: string) => {
    const interest = interestText || newInterest.trim();
    if (!interest || !currentUser) return;

    // Check if already exists
    if (user.interests?.includes(interest)) {
      setNewInterest('');
      return;
    }

    const updatedInterests = [...(user.interests || []), interest];

    try {
      // Update in Firestore
      await updateUserProfile(currentUser.uid, { interests: updatedInterests });

      // Update local state
      updateUser({ interests: updatedInterests });
      await refreshUserProfile();

      setNewInterest('');
    } catch (error) {
      console.error('Error adding interest:', error);
    }
  };

  const handleRemoveInterest = async (interestToRemove: string) => {
    if (!currentUser) return;

    const updatedInterests = (user.interests || []).filter(
      (interest) => interest !== interestToRemove
    );

    try {
      // Update in Firestore
      await updateUserProfile(currentUser.uid, { interests: updatedInterests });

      // Update local state
      updateUser({ interests: updatedInterests });
      await refreshUserProfile();
    } catch (error) {
      console.error('Error removing interest:', error);
    }
  };

  const handleBackgroundChange = async (background: BackgroundSettings) => {
    if (!currentUser) return;

    try {
      // Update in Firestore
      await updateUserProfile(currentUser.uid, {
        settings: {
          ...user.settings,
          background,
        },
      });

      // Update local state
      updateUser({
        settings: {
          ...user.settings,
          background,
        },
      });
      await refreshUserProfile();
    } catch (error) {
      console.error('Error updating background:', error);
    }
  };

  // Suggested interests for quick add
  const suggestedInterests = [
    'Fotboll',
    'Minecraft',
    'Fortnite',
    'K-pop',
    'Harry Potter',
    'Star Wars',
    'Taylor Swift',
    'Basketball',
    'Dinosaurier',
    'Rymden',
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

        {/* Intressen */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Heart size={20} className="text-pink-500" />
            Mina Intressen
          </h3>
          <Card className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Lägg till dina intressen för att få personliga förklaringar när du studerar!
              Till exempel kan begrepp förklaras med hjälp av fotboll, Minecraft eller dina andra intressen.
            </p>

            {/* Current interests */}
            {user.interests && user.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm font-medium"
                  >
                    {interest}
                    <button
                      onClick={() => handleRemoveInterest(interest)}
                      className="hover:bg-pink-200 dark:hover:bg-pink-800 rounded-full p-0.5 transition-colors"
                      aria-label={`Ta bort ${interest}`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add new interest */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddInterest();
                  }
                }}
                placeholder="Lägg till ett intresse..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={() => handleAddInterest()}
                disabled={!newInterest.trim()}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <Plus size={20} />
                Lägg till
              </button>
            </div>

            {/* Suggested interests */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Förslag:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedInterests
                  .filter((suggested) => !user.interests?.includes(suggested))
                  .map((interest) => (
                    <button
                      key={interest}
                      onClick={() => handleAddInterest(interest)}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {interest}
                    </button>
                  ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Bakgrund */}
        <BackgroundSelector
          currentBackground={user.settings.background}
          onBackgroundChange={handleBackgroundChange}
        />

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
