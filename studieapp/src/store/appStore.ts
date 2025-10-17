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
  ChatSession,
  ChatMessage,
  LanguageCode,
  MistakeEntry,
} from '../types';
import { db, dbHelpers } from '../lib/db';
import {
  syncMaterialToFirestore,
  deleteMaterialFromFirestore,
  syncFolderToFirestore,
  deleteFolderFromFirestore,
  syncStudySessionToFirestore,
  initFullSyncFromFirestore,
} from '../services/firestoreSync';

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

  // Chat
  chatSessions: Record<string, ChatSession>;
  loadChatSession: (materialId: string) => Promise<ChatSession | null>;
  appendChatMessage: (
    materialId: string,
    message: ChatMessage
  ) => Promise<ChatSession | null>;
  setChatSession: (materialId: string, session: ChatSession) => Promise<void>;

  // Games & Felbank
  mistakeBank: Record<string, Record<string, MistakeEntry>>;
  registerMistake: (
    materialId: string,
    entry: { term: string; definition?: string; language?: LanguageCode }
  ) => void;
  clearMistakesForMaterial: (materialId: string) => void;

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
      chatSessions: {},
      mistakeBank: {},
      isLoading: false,
      error: null,

      // User actions
      setUser: (user) => set({ user }),

      updateUser: async (updates) => {
        const currentUser = get().user;
        if (!currentUser) return;

        // Uppdatera IndexedDB
        await dbHelpers.updateUserProfile(updates);

        // Uppdatera Firestore
        try {
          const { updateUserProfile } = await import('../services/authService');
          await updateUserProfile(currentUser.id, updates);
          console.log('[AppStore] User profile updated in Firestore');
        } catch (error) {
          console.warn('[AppStore] Failed to update user profile in Firestore:', error);
        }

        set({ user: { ...currentUser, ...updates } });
      },

      // Onboarding
      setOnboardingStep: (step) =>
        set((state) => ({
          onboarding: { ...state.onboarding, currentStep: step },
        })),

      completeOnboarding: async (grade, subjects, dailyGoal, weeklyGoal) => {
        const currentUser = get().user;
        if (!currentUser) {
          console.error('[AppStore] Cannot complete onboarding: No user logged in');
          return;
        }

        // Uppdatera användarprofilen med onboarding-data
        const updatedUser: UserProfile = {
          ...currentUser,
          grade,
          subjects,
          dailyGoalMinutes: dailyGoal,
          weeklyGoalDays: weeklyGoal,
        };

        // Spara till IndexedDB
        await db.userProfile.put(updatedUser);

        // Uppdatera i Firestore
        try {
          const { updateUserProfile } = await import('../services/authService');
          await updateUserProfile(currentUser.id, {
            grade,
            subjects,
            dailyGoalMinutes: dailyGoal,
            weeklyGoalDays: weeklyGoal,
          });
          console.log('[AppStore] Onboarding data saved to Firestore');
        } catch (error) {
          console.warn('[AppStore] Failed to save onboarding to Firestore:', error);
        }

        set({
          user: updatedUser,
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
          // Försök först ladda från IndexedDB (snabbt)
          const localMaterials = await dbHelpers.getAllMaterials();
          const localFolders = await db.folders.toArray();
          set({ materials: localMaterials, folders: localFolders });

          // Om användare är inloggad, synka från Firestore i bakgrunden
          const user = get().user;
          if (user?.id) {
            console.log('[AppStore] Syncing from Firestore for user:', user.id);
            try {
              await initFullSyncFromFirestore(user.id);
              // Ladda om från IndexedDB efter sync
              const syncedMaterials = await dbHelpers.getAllMaterials();
              const syncedFolders = await db.folders.toArray();
              set({ materials: syncedMaterials, folders: syncedFolders });
            } catch (syncError) {
              console.warn('[AppStore] Firestore sync failed, using local data:', syncError);
            }
          }

          set({ isLoading: false });
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

        // Synka till Firestore om användaren är inloggad
        const user = get().user;
        if (user?.id) {
          try {
            await syncMaterialToFirestore(user.id, material);
          } catch (error) {
            console.warn('[AppStore] Failed to sync material to Firestore:', error);
          }
        }
      },

      updateMaterial: async (id, updates) => {
        const updatedData = { ...updates, updatedAt: new Date() };
        await db.materials.update(id, updatedData);

        const updatedMaterial = get().materials.find((m) => m.id === id);
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === id ? { ...m, ...updatedData } : m
          ),
        }));

        // Synka till Firestore om användaren är inloggad
        const user = get().user;
        if (user?.id && updatedMaterial) {
          try {
            await syncMaterialToFirestore(user.id, { ...updatedMaterial, ...updatedData });
          } catch (error) {
            console.warn('[AppStore] Failed to sync material update to Firestore:', error);
          }
        }
      },

      deleteMaterial: async (id) => {
        await db.materials.delete(id);
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
        }));

        // Ta bort från Firestore om användaren är inloggad
        const user = get().user;
        if (user?.id) {
          try {
            await deleteMaterialFromFirestore(user.id, id);
          } catch (error) {
            console.warn('[AppStore] Failed to delete material from Firestore:', error);
          }
        }
      },

      // Folders
      addFolder: async (folder) => {
        await db.folders.add(folder);
        set((state) => ({ folders: [...state.folders, folder] }));

        // Synka till Firestore
        const user = get().user;
        if (user?.id) {
          try {
            await syncFolderToFirestore(user.id, folder);
          } catch (error) {
            console.warn('[AppStore] Failed to sync folder to Firestore:', error);
          }
        }
      },

      updateFolder: async (id, updates) => {
        await db.folders.update(id, updates);

        const updatedFolder = get().folders.find((f) => f.id === id);
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }));

        // Synka till Firestore om användaren är inloggad
        const user = get().user;
        if (user?.id && updatedFolder) {
          try {
            await syncFolderToFirestore(user.id, { ...updatedFolder, ...updates });
          } catch (error) {
            console.warn('[AppStore] Failed to sync folder update to Firestore:', error);
          }
        }
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

        // Ta bort från Firestore om användaren är inloggad
        const user = get().user;
        if (user?.id) {
          try {
            await deleteFolderFromFirestore(user.id, id);
            // Synka även uppdaterade materials
            for (const material of materialsInFolder) {
              await syncMaterialToFirestore(user.id, { ...material, folderId: undefined });
            }
          } catch (error) {
            console.warn('[AppStore] Failed to delete folder from Firestore:', error);
          }
        }
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

        // Synka till Firestore om användaren är inloggad
        if (user?.id) {
          try {
            await syncStudySessionToFirestore(user.id, completedSession);
            // Synka även uppdaterat material
            const material = get().materials.find((m) => m.id === session.materialId);
            if (material) {
              await syncMaterialToFirestore(user.id, { ...material, lastStudied: new Date() });
            }
          } catch (error) {
            console.warn('[AppStore] Failed to sync study session to Firestore:', error);
          }
        }

        set({ currentSession: null });
      },

      // Chat Sessions
      loadChatSession: async (materialId) => {
        let session = await db.chatSessions
          .where('materialId')
          .equals(materialId)
          .first();

        if (!session) {
          session = {
            id: crypto.randomUUID(),
            materialId,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await db.chatSessions.add(session);
        } else {
          session = {
            ...session,
            messages: session.messages.map((message) => ({
              ...message,
              timestamp: new Date(message.timestamp),
            })),
            createdAt: new Date(session.createdAt),
            updatedAt: session.updatedAt ? new Date(session.updatedAt) : new Date(),
          };
        }

        set((state) => ({
          chatSessions: {
            ...state.chatSessions,
            [materialId]: session!,
          },
        }));

        return session;
      },

      appendChatMessage: async (materialId, message) => {
        const state = get();
        const existing = state.chatSessions[materialId];

        if (!existing) {
          await state.loadChatSession(materialId);
        }

        const session = get().chatSessions[materialId];
        if (!session) return null;

        const updatedSession: ChatSession = {
          ...session,
          messages: [...session.messages, message],
          updatedAt: new Date(),
        };

        await db.chatSessions.update(session.id, {
          messages: updatedSession.messages,
          updatedAt: updatedSession.updatedAt,
        });

        set((prevState) => ({
          chatSessions: {
            ...prevState.chatSessions,
            [materialId]: updatedSession,
          },
        }));

        return updatedSession;
      },

      setChatSession: async (materialId, session) => {
        await db.chatSessions.put({
          ...session,
          updatedAt: new Date(),
        });

        set((state) => ({
          chatSessions: {
            ...state.chatSessions,
            [materialId]: { ...session, updatedAt: new Date() },
          },
        }));
      },

      registerMistake: (materialId, entry) => {
        const normalizedMaterialId = materialId.trim();
        const rawTerm = entry.term?.trim();

        if (!normalizedMaterialId || !rawTerm) {
          return;
        }

        const normalizedTermKey = rawTerm.toLowerCase();
        const timestamp = new Date().toISOString();
        const language: LanguageCode = entry.language ?? 'sv';

        set((state) => {
          const existingMaterialBank = state.mistakeBank[normalizedMaterialId] ?? {};
          const existingEntry = existingMaterialBank[normalizedTermKey];

          const updatedEntry: MistakeEntry = existingEntry
            ? {
                ...existingEntry,
                missCount: existingEntry.missCount + 1,
                lastMissedAt: timestamp,
                definition: entry.definition?.trim() || existingEntry.definition,
              }
            : {
                id: crypto.randomUUID(),
                materialId: normalizedMaterialId,
                term: rawTerm,
                definition: entry.definition?.trim() || '',
                language,
                missCount: 1,
                lastMissedAt: timestamp,
              };

          return {
            mistakeBank: {
              ...state.mistakeBank,
              [normalizedMaterialId]: {
                ...existingMaterialBank,
                [normalizedTermKey]: updatedEntry,
              },
            },
          };
        });
      },

      clearMistakesForMaterial: (materialId) => {
        const normalizedMaterialId = materialId.trim();
        if (!normalizedMaterialId) return;

        set((state) => {
          if (!state.mistakeBank[normalizedMaterialId]) {
            return {};
          }

          const updatedBank = { ...state.mistakeBank };
          delete updatedBank[normalizedMaterialId];

          return {
            mistakeBank: updatedBank,
          };
        });
      },

      // XP & Leveling
      addXP: async (amount) => {
        const result = await dbHelpers.addXP(amount);
        if (!result) return;

        const user = get().user;
        if (user) {
          const updatedUser = {
            ...user,
            totalXp: result.xp,
            level: result.level,
          };

          set({ user: updatedUser });

          // Synka till Firestore
          try {
            const { updateUserProfile } = await import('../services/authService');
            await updateUserProfile(user.id, {
              totalXp: result.xp,
              level: result.level,
            });
          } catch (error) {
            console.warn('[AppStore] Failed to sync XP to Firestore:', error);
          }

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

            // Synka till Firestore
            try {
              const { updateUserProfile } = await import('../services/authService');
              await updateUserProfile(user.id, {
                streak: updatedUser.streak,
                longestStreak: updatedUser.longestStreak,
                lastStudyDate: updatedUser.lastStudyDate,
              });
            } catch (error) {
              console.warn('[AppStore] Failed to sync streak to Firestore:', error);
            }
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
        mistakeBank: state.mistakeBank,
      }),
    }
  )
);
