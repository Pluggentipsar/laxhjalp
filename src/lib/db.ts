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
  TextEmbedding,
  ActivityAttempt,
  ActivityMistake,
  StudentCognitiveProfile,
  PedagogicalSession,
  SubjectSession,
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
  textEmbeddings!: Dexie.Table<TextEmbedding, string>;

  // Activity tables
  activityAttempts!: Dexie.Table<ActivityAttempt, string>;
  activityMistakes!: Dexie.Table<ActivityMistake, string>;
  cognitiveProfiles!: Dexie.Table<StudentCognitiveProfile, string>;
  subjectSessions!: Dexie.Table<SubjectSession, string>;
  pedagogicalSessions!: Dexie.Table<PedagogicalSession, string>;

  constructor() {
    super('StudieAppDB');

    // Version 1 - original schema
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

    // Version 2 - added textEmbeddings and mode to chatSessions
    this.version(2).stores({
      materials: 'id, subject, folderId, *tags, createdAt, lastStudied',
      folders: 'id, subject, createdAt',
      userProfile: 'id',
      studySessions: 'id, materialId, mode, startedAt',
      gameSessions: 'id, materialId, gameType, completedAt',
      dailyProgress: 'date',
      mindmaps: 'id, materialId, createdAt',
      chatSessions: 'id, materialId, mode, createdAt',
      textEmbeddings: 'id, materialId, chunkIndex, createdAt',
    }).upgrade(async (trans) => {
      // Upgrade existing chatSessions to have default mode
      await trans.table('chatSessions').toCollection().modify((session: any) => {
        if (!session.mode) {
          session.mode = 'free';
        }
      });
    });

    // Version 3 - add composite index for chatSessions [materialId+mode]
    this.version(3).stores({
      materials: 'id, subject, folderId, *tags, createdAt, lastStudied',
      folders: 'id, subject, createdAt',
      userProfile: 'id',
      studySessions: 'id, materialId, mode, startedAt',
      gameSessions: 'id, materialId, gameType, completedAt',
      dailyProgress: 'date',
      mindmaps: 'id, materialId, createdAt',
      chatSessions: 'id, [materialId+mode], materialId, mode, createdAt',
      textEmbeddings: 'id, materialId, chunkIndex, createdAt',
    });

    // Version 4 - update chatSessions index to support multiple conversations per mode
    this.version(4).stores({
      materials: 'id, subject, folderId, *tags, createdAt, lastStudied',
      folders: 'id, subject, createdAt',
      userProfile: 'id',
      studySessions: 'id, materialId, mode, startedAt',
      gameSessions: 'id, materialId, gameType, completedAt',
      dailyProgress: 'date',
      mindmaps: 'id, materialId, createdAt',
      chatSessions: 'id, [materialId+mode], materialId, mode, createdAt, updatedAt',
      textEmbeddings: 'id, materialId, chunkIndex, createdAt',
    });

    // Version 5 - add activity/pedagogical tables
    this.version(5).stores({
      materials: 'id, subject, folderId, *tags, createdAt, lastStudied',
      folders: 'id, subject, createdAt',
      userProfile: 'id',
      studySessions: 'id, materialId, mode, startedAt',
      gameSessions: 'id, materialId, gameType, completedAt',
      dailyProgress: 'date',
      mindmaps: 'id, materialId, createdAt',
      chatSessions: 'id, [materialId+mode], materialId, mode, createdAt, updatedAt',
      textEmbeddings: 'id, materialId, chunkIndex, createdAt',
      activityAttempts: 'id, userId, sessionId, activityId, questionId, timestamp, [userId+activityId], questionConceptArea',
      activityMistakes: 'id, userId, activityId, questionId, conceptArea, [userId+conceptArea], needsReview, nextReviewAt',
      cognitiveProfiles: '[userId+subjectHub], userId, subjectHub, lastUpdated',
      subjectSessions: 'id, userId, subjectHub, activityId, startedAt',
      pedagogicalSessions: 'id, userId, subjectHub, activityId, startedAt',
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

  // Game Sessions
  async getRecentGameSessions(limit = 10) {
    return await db.gameSessions
      .orderBy('completedAt')
      .reverse()
      .limit(limit)
      .toArray();
  },

  async logGameSession(session: GameSession) {
    const completedAt = session.completedAt ?? new Date();
    await db.gameSessions.put({
      ...session,
      completedAt,
    });
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

  // Activity Attempts
  async saveActivityAttempt(attempt: ActivityAttempt) {
    await db.activityAttempts.put(attempt);
  },

  async getActivityAttempts(userId: string, activityId: string, limit = 50) {
    return await db.activityAttempts
      .where('[userId+activityId]')
      .equals([userId, activityId])
      .reverse()
      .limit(limit)
      .toArray();
  },

  async getRecentAttempts(_userId: string, sessionId: string) {
    return await db.activityAttempts
      .where('sessionId')
      .equals(sessionId)
      .toArray();
  },

  // Activity Mistakes (Spaced Repetition)
  async saveMistake(mistake: ActivityMistake) {
    const existing = await db.activityMistakes
      .where('[userId+conceptArea]')
      .equals([mistake.userId, mistake.conceptArea])
      .and(m => m.questionId === mistake.questionId)
      .first();

    if (existing) {
      // Update existing mistake
      await db.activityMistakes.update(existing.id, {
        mistakeCount: existing.mistakeCount + 1,
        lastMistakeAt: mistake.lastMistakeAt,
        needsReview: true,
        interval: 1, // Reset interval
        easeFactor: Math.max(1.3, existing.easeFactor - 0.2),
        userAnswer: mistake.userAnswer,
      });
    } else {
      // New mistake
      await db.activityMistakes.put(mistake);
    }
  },

  async getDueMistakes(userId: string, conceptArea?: string) {
    const today = new Date();

    if (conceptArea) {
      return await db.activityMistakes
        .where('[userId+conceptArea]')
        .equals([userId, conceptArea])
        .and(m => m.needsReview && (!m.nextReviewAt || m.nextReviewAt <= today))
        .toArray();
    }

    return await db.activityMistakes
      .where('userId')
      .equals(userId)
      .and(m => m.needsReview && (!m.nextReviewAt || m.nextReviewAt <= today))
      .toArray();
  },

  async updateMistakeReview(mistakeId: string, wasCorrect: boolean) {
    const mistake = await db.activityMistakes.get(mistakeId);
    if (!mistake) return;

    let newInterval = mistake.interval;
    let newEaseFactor = mistake.easeFactor;

    if (wasCorrect) {
      // Correct - increase interval
      newInterval = Math.ceil(mistake.interval * mistake.easeFactor);
      newEaseFactor = Math.min(2.5, mistake.easeFactor + 0.1);

      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + newInterval);

      await db.activityMistakes.update(mistakeId, {
        interval: newInterval,
        easeFactor: newEaseFactor,
        needsReview: false,
        nextReviewAt: nextReview,
      });
    } else {
      // Still incorrect - reset
      newInterval = 1;
      newEaseFactor = Math.max(1.3, mistake.easeFactor - 0.2);

      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + 1);

      await db.activityMistakes.update(mistakeId, {
        interval: newInterval,
        easeFactor: newEaseFactor,
        mistakeCount: mistake.mistakeCount + 1,
        lastMistakeAt: new Date(),
        needsReview: true,
        nextReviewAt: nextReview,
      });
    }
  },

  // Cognitive Profiles
  async getCognitiveProfile(userId: string, subjectHub: string) {
    return await db.cognitiveProfiles.get([userId, subjectHub]);
  },

  async saveCognitiveProfile(profile: StudentCognitiveProfile) {
    await db.cognitiveProfiles.put(profile);
  },

  // Subject Sessions
  async saveSubjectSession(session: SubjectSession | PedagogicalSession) {
    // Determine if it's a pedagogical session
    if ('pedagogicalJourney' in session) {
      await db.pedagogicalSessions.put(session as PedagogicalSession);
    } else {
      await db.subjectSessions.put(session);
    }
  },

  async getRecentSubjectSessions(userId: string, limit = 10) {
    // Get both types
    const subject = await db.subjectSessions
      .where('userId')
      .equals(userId)
      .reverse()
      .limit(limit)
      .toArray();

    const pedagogical = await db.pedagogicalSessions
      .where('userId')
      .equals(userId)
      .reverse()
      .limit(limit)
      .toArray();

    // Merge and sort
    return [...subject, ...pedagogical]
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  },
};
