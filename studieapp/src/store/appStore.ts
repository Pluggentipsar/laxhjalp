import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UserProfile,
  Material,
  Folder,
  StudySession,
  OnboardingState,
  Subject,
  Grade,
} from '../types';
import { db, dbHelpers } from '../lib/db';

interface AppStore {
  // User
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;

  // Onboarding
  onboarding: OnboardingState;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: (
    grade: Grade,
    subjects: Subject[],
    dailyGoal: number,
    weeklyGoal: number
  ) => Promise<void>;

  // Materials
  materials: Material[];
  folders: Folder[];
  loadMaterials: () => Promise<void>;
  addMaterial: (material: Material) => Promise<void>;
  updateMaterial: (id: string, updates: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;

  // Folders
  addFolder: (folder: Folder) => Promise<void>;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // Study
  currentSession: StudySession | null;
  startSession: (materialId: string, mode: StudySession['mode']) => void;
  endSession: (xpEarned: number, stats?: any) => Promise<void>;

  // XP & Streak
  addXP: (amount: number) => Promise<void>;
  updateStreak: () => Promise<void>;

  // UI State
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      onboarding: {
        completed: false,
        currentStep: 0,
        selectedSubjects: [],
      },
      materials: [],
      folders: [],
      currentSession: null,
      isLoading: false,
      error: null,

      // User actions
      setUser: (user) => set({ user }),

      updateUser: async (updates) => {
        const currentUser = get().user;
        if (!currentUser) return;

        await dbHelpers.updateUserProfile(updates);
        set({ user: { ...currentUser, ...updates } });
      },

      // Onboarding
      setOnboardingStep: (step) =>
        set((state) => ({
          onboarding: { ...state.onboarding, currentStep: step },
        })),

      completeOnboarding: async (grade, subjects, dailyGoal, weeklyGoal) => {
        const newUser: UserProfile = {
          id: crypto.randomUUID(),
          name: 'Elev',
          grade,
          subjects,
          createdAt: new Date(),
          dailyGoalMinutes: dailyGoal,
          weeklyGoalDays: weeklyGoal,
          totalXp: 0,
          level: 1,
          streak: 0,
          longestStreak: 0,
          streakFreezeAvailable: false,
          badges: [],
          settings: {
            textSize: 'medium',
            dyslexiaFriendly: false,
            highContrast: false,
            ttsEnabled: true,
            ttsSpeed: 1.0,
            theme: 'light',
            reduceAnimations: false,
            emojiSupport: true,
            remindersEnabled: false,
            reminderDays: [1, 2, 3, 4, 5], // Mån-Fre
            cloudBackupEnabled: false,
          },
        };

        await db.userProfile.add(newUser);

        set({
          user: newUser,
          onboarding: {
            completed: true,
            currentStep: 0,
            selectedGrade: grade,
            selectedSubjects: subjects,
            dailyGoal,
            weeklyGoal,
          },
        });
      },

      // Materials
      loadMaterials: async () => {
        set({ isLoading: true });
        try {
          const materials = await dbHelpers.getAllMaterials();
          const folders = await db.folders.toArray();
          set({ materials, folders, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Fel vid laddning',
            isLoading: false,
          });
        }
      },

      addMaterial: async (material) => {
        await db.materials.add(material);
        set((state) => ({ materials: [...state.materials, material] }));
      },

      updateMaterial: async (id, updates) => {
        await db.materials.update(id, { ...updates, updatedAt: new Date() });
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m
          ),
        }));
      },

      deleteMaterial: async (id) => {
        await db.materials.delete(id);
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
        }));
      },

      // Folders
      addFolder: async (folder) => {
        await db.folders.add(folder);
        set((state) => ({ folders: [...state.folders, folder] }));
      },

      updateFolder: async (id, updates) => {
        await db.folders.update(id, updates);
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }));
      },

      deleteFolder: async (id) => {
        await db.folders.delete(id);
        // Uppdatera material som hade denna mapp
        const materialsInFolder = get().materials.filter(
          (m) => m.folderId === id
        );
        for (const material of materialsInFolder) {
          await db.materials.update(material.id, { folderId: undefined });
        }
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          materials: state.materials.map((m) =>
            m.folderId === id ? { ...m, folderId: undefined } : m
          ),
        }));
      },

      // Study Sessions
      startSession: (materialId, mode) => {
        const session: StudySession = {
          id: crypto.randomUUID(),
          materialId,
          mode,
          startedAt: new Date(),
          durationSeconds: 0,
          xpEarned: 0,
        };
        set({ currentSession: session });
      },

      endSession: async (xpEarned, stats) => {
        const session = get().currentSession;
        if (!session) return;

        const endedAt = new Date();
        const durationSeconds = Math.floor(
          (endedAt.getTime() - session.startedAt.getTime()) / 1000
        );
        const durationMinutes = Math.ceil(durationSeconds / 60);

        const completedSession: StudySession = {
          ...session,
          endedAt,
          durationSeconds,
          xpEarned,
          ...stats,
        };

        await db.studySessions.add(completedSession);

        // Uppdatera daily progress
        const user = get().user;
        if (user) {
          await dbHelpers.updateTodayProgress(
            durationMinutes,
            xpEarned,
            user.dailyGoalMinutes
          );
          await get().updateStreak();
          await get().addXP(xpEarned);
        }

        // Uppdatera material lastStudied
        await db.materials.update(session.materialId, {
          lastStudied: new Date(),
        });

        set({ currentSession: null });
      },

      // XP & Leveling
      addXP: async (amount) => {
        const result = await dbHelpers.addXP(amount);
        if (!result) return;

        const user = get().user;
        if (user) {
          set({
            user: {
              ...user,
              totalXp: result.xp,
              level: result.level,
            },
          });

          // TODO: Visa level-up animation om leveledUp är true
        }
      },

      updateStreak: async () => {
        const newStreak = await dbHelpers.updateStreak();
        const user = get().user;
        if (user && newStreak !== undefined) {
          const updatedUser = await dbHelpers.getUserProfile();
          if (updatedUser) {
            set({ user: updatedUser });
          }
        }
      },

      // UI
      setError: (error) => set({ error }),
    }),
    {
      name: 'studieapp-storage',
      partialize: (state) => ({
        onboarding: state.onboarding,
      }),
    }
  )
);
