import Dexie from 'dexie';
import type {
  Material,
  Folder,
  UserProfile,
  StudySession,
  GameSession,
  DailyProgress,
  Mindmap,
  ChatSession,
} from '../types';

export class StudieAppDatabase extends Dexie {
  materials!: Dexie.Table<Material, string>;
  folders!: Dexie.Table<Folder, string>;
  userProfile!: Dexie.Table<UserProfile, string>;
  studySessions!: Dexie.Table<StudySession, string>;
  gameSessions!: Dexie.Table<GameSession, string>;
  dailyProgress!: Dexie.Table<DailyProgress, string>;
  mindmaps!: Dexie.Table<Mindmap, string>;
  chatSessions!: Dexie.Table<ChatSession, string>;

  constructor() {
    super('StudieAppDB');

    this.version(1).stores({
      materials: 'id, subject, folderId, *tags, createdAt, lastStudied',
      folders: 'id, subject, createdAt',
      userProfile: 'id',
      studySessions: 'id, materialId, mode, startedAt',
      gameSessions: 'id, materialId, gameType, completedAt',
      dailyProgress: 'date',
      mindmaps: 'id, materialId, createdAt',
      chatSessions: 'id, materialId, createdAt',
    });
  }
}

export const db = new StudieAppDatabase();

// Helper functions för vanliga operationer
export const dbHelpers = {
  // Material
  async getAllMaterials() {
    // Sortera på createdAt (finns i index), inte updatedAt
    return await db.materials.orderBy('createdAt').reverse().toArray();
  },

  async getMaterialsBySubject(subject: string) {
    return await db.materials.where('subject').equals(subject).toArray();
  },

  async getMaterialsByFolder(folderId: string) {
    return await db.materials.where('folderId').equals(folderId).toArray();
  },

  async searchMaterials(query: string) {
    const allMaterials = await db.materials.toArray();
    return allMaterials.filter(
      (m) =>
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        m.content.toLowerCase().includes(query.toLowerCase()) ||
        m.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
    );
  },

  // User Profile
  async getUserProfile() {
    const profiles = await db.userProfile.toArray();
    return profiles[0] || null;
  },

  async updateUserProfile(profile: Partial<UserProfile>) {
    const existingProfile = await this.getUserProfile();
    if (existingProfile) {
      await db.userProfile.update(existingProfile.id, profile);
      return { ...existingProfile, ...profile };
    }
    return null;
  },

  // Streak & Daily Progress
  async getTodayProgress() {
    const today = new Date().toISOString().split('T')[0];
    return await db.dailyProgress.get(today);
  },

  async updateTodayProgress(
    minutesStudied: number,
    xpEarned: number,
    dailyGoal: number
  ) {
    const today = new Date().toISOString().split('T')[0];
    const existing = await db.dailyProgress.get(today);

    const newProgress: DailyProgress = {
      date: today,
      minutesStudied: (existing?.minutesStudied || 0) + minutesStudied,
      xpEarned: (existing?.xpEarned || 0) + xpEarned,
      sessionsCompleted: (existing?.sessionsCompleted || 0) + 1,
      goalMet:
        (existing?.minutesStudied || 0) + minutesStudied >= dailyGoal,
    };

    await db.dailyProgress.put(newProgress);
    return newProgress;
  },

  async getWeekProgress() {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    return await db.dailyProgress
      .where('date')
      .aboveOrEqual(weekAgoStr)
      .toArray();
  },

  // Study Sessions
  async getRecentSessions(limit = 10) {
    return await db.studySessions
      .orderBy('startedAt')
      .reverse()
      .limit(limit)
      .toArray();
  },

  async getSessionsByMaterial(materialId: string) {
    return await db.studySessions
      .where('materialId')
      .equals(materialId)
      .toArray();
  },

  // XP & Leveling
  async addXP(amount: number) {
    const profile = await this.getUserProfile();
    if (!profile) return;

    const newXP = profile.totalXp + amount;
    const newLevel = Math.floor(newXP / 1000) + 1; // 1000 XP per level

    await db.userProfile.update(profile.id, {
      totalXp: newXP,
      level: newLevel,
    });

    return { xp: newXP, level: newLevel, leveledUp: newLevel > profile.level };
  },

  // Streak
  async updateStreak() {
    const profile = await this.getUserProfile();
    if (!profile) return;

    const today = new Date().toISOString().split('T')[0];
    const lastStudy = profile.lastStudyDate
      ? new Date(profile.lastStudyDate).toISOString().split('T')[0]
      : null;

    if (lastStudy === today) {
      // Redan studerat idag
      return profile.streak;
    }

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    let newStreak = profile.streak;

    if (lastStudy === yesterday) {
      // Fortsatt streak
      newStreak += 1;
    } else if (lastStudy && lastStudy < yesterday) {
      // Streak bruten - kolla streak freeze
      if (profile.streakFreezeAvailable) {
        // Använd freeze
        await db.userProfile.update(profile.id, {
          streakFreezeAvailable: false,
        });
      } else {
        // Börja om
        newStreak = 1;
      }
    } else {
      // Första studietillfället eller ny streak
      newStreak = 1;
    }

    await db.userProfile.update(profile.id, {
      streak: newStreak,
      longestStreak: Math.max(newStreak, profile.longestStreak),
      lastStudyDate: new Date(),
      streakFreezeAvailable:
        newStreak % 7 === 0 ? true : profile.streakFreezeAvailable, // Ny freeze varje vecka
    });

    return newStreak;
  },

  // Spaced Repetition - nästa kort att repetera
  async getDueFlashcards(materialId?: string) {
    const materials = materialId
      ? [await db.materials.get(materialId)]
      : await db.materials.toArray();

    const dueCards = materials
      .filter((m): m is Material => m !== undefined)
      .flatMap((material) =>
        material.flashcards
          .filter(
            (card) =>
              !card.nextReview || new Date(card.nextReview) <= new Date()
          )
          .map((card) => ({ ...card, materialId: material.id }))
      );

    return dueCards;
  },

  // Update flashcard efter review
  async updateFlashcardReview(
    materialId: string,
    cardId: string,
    quality: number // 0-5 (5 = perfekt)
  ) {
    const material = await db.materials.get(materialId);
    if (!material) return;

    const cardIndex = material.flashcards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    const card = material.flashcards[cardIndex];

    // SM-2 algoritm (förenklad)
    let newInterval = card.interval;
    let newEaseFactor = card.easeFactor;
    let newRepetitions = card.repetitions;

    if (quality >= 3) {
      // Korrekt svar
      if (card.repetitions === 0) {
        newInterval = 1;
      } else if (card.repetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(card.interval * card.easeFactor);
      }
      newRepetitions += 1;
      newEaseFactor = Math.max(
        1.3,
        card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      );

      card.correctCount += 1;
    } else {
      // Fel svar
      newRepetitions = 0;
      newInterval = 1;
      card.incorrectCount += 1;
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    material.flashcards[cardIndex] = {
      ...card,
      interval: newInterval,
      easeFactor: newEaseFactor,
      repetitions: newRepetitions,
      lastReviewed: new Date(),
      nextReview,
    };

    await db.materials.update(materialId, {
      flashcards: material.flashcards,
      lastStudied: new Date(),
    });
  },
};
