import { dbHelpers } from '../lib/db';

export interface ActivityProgress {
  activityId: string;
  questionsAttempted: number;
  questionsCorrect: number;
  totalQuestions: number;
  percentComplete: number;
  lastAttemptAt?: Date;
  stars: number; // 0-3 stars based on performance
  mastered: boolean; // 80%+ accuracy
}

/**
 * Activity Progress Service
 * Tracks student progress across activities
 */
export class ActivityProgressService {
  /**
   * Get progress for a specific activity
   */
  async getActivityProgress(
    userId: string,
    activityId: string,
    totalQuestions: number
  ): Promise<ActivityProgress> {
    try {
      // Get all attempts for this activity
      const attempts = await dbHelpers.getActivityAttempts(userId, activityId);

      if (!attempts || attempts.length === 0) {
        return {
          activityId,
          questionsAttempted: 0,
          questionsCorrect: 0,
          totalQuestions,
          percentComplete: 0,
          stars: 0,
          mastered: false,
        };
      }

      // Count unique questions attempted
      const uniqueQuestions = new Set(attempts.map((a) => a.questionId));
      const questionsAttempted = uniqueQuestions.size;

      // Count correct answers (only count once per question - best attempt)
      const questionResults = new Map<string, boolean>();
      attempts.forEach((attempt) => {
        const existing = questionResults.get(attempt.questionId);
        // Keep the best result (if any attempt was correct, mark as correct)
        if (existing === undefined || (!existing && attempt.isCorrect)) {
          questionResults.set(attempt.questionId, attempt.isCorrect);
        }
      });

      const questionsCorrect = Array.from(questionResults.values()).filter(
        (correct) => correct
      ).length;

      // Calculate percent complete
      const percentComplete = totalQuestions > 0
        ? Math.round((questionsAttempted / totalQuestions) * 100)
        : 0;

      // Calculate accuracy
      const accuracy = questionsAttempted > 0
        ? (questionsCorrect / questionsAttempted) * 100
        : 0;

      // Calculate stars (0-3)
      let stars = 0;
      if (accuracy >= 60) stars = 1;
      if (accuracy >= 75) stars = 2;
      if (accuracy >= 90) stars = 3;

      // Check if mastered (80%+ accuracy on 80%+ of questions)
      const mastered = accuracy >= 80 && percentComplete >= 80;

      // Get last attempt date
      const lastAttempt = attempts.reduce((latest, attempt) => {
        return !latest || attempt.timestamp > latest.timestamp ? attempt : latest;
      }, attempts[0]);

      return {
        activityId,
        questionsAttempted,
        questionsCorrect,
        totalQuestions,
        percentComplete,
        lastAttemptAt: lastAttempt.timestamp,
        stars,
        mastered,
      };
    } catch (error) {
      console.error('[ActivityProgressService] Error getting activity progress:', error);
      return {
        activityId,
        questionsAttempted: 0,
        questionsCorrect: 0,
        totalQuestions,
        percentComplete: 0,
        stars: 0,
        mastered: false,
      };
    }
  }

  /**
   * Get progress for multiple activities
   */
  async getMultipleActivityProgress(
    userId: string,
    activities: Array<{ id: string; totalQuestions: number }>
  ): Promise<Map<string, ActivityProgress>> {
    const progressMap = new Map<string, ActivityProgress>();

    await Promise.all(
      activities.map(async (activity) => {
        const progress = await this.getActivityProgress(
          userId,
          activity.id,
          activity.totalQuestions
        );
        progressMap.set(activity.id, progress);
      })
    );

    return progressMap;
  }

  /**
   * Get recommended next activity based on progress
   */
  async getRecommendedActivity(
    userId: string,
    activities: Array<{ id: string; totalQuestions: number }>
  ): Promise<string | null> {
    if (activities.length === 0) return null;

    const progressMap = await this.getMultipleActivityProgress(userId, activities);

    // Find last attempted activity
    let lastActivityId: string | null = null;
    let lastAttemptTime: Date | null = null;

    progressMap.forEach((progress, activityId) => {
      if (progress.lastAttemptAt) {
        if (!lastAttemptTime || progress.lastAttemptAt > lastAttemptTime) {
          lastActivityId = activityId;
          lastAttemptTime = progress.lastAttemptAt;
        }
      }
    });

    // If there's a last activity and it's not mastered, continue it
    if (lastActivityId) {
      const lastProgress = progressMap.get(lastActivityId);
      if (lastProgress && !lastProgress.mastered) {
        return lastActivityId;
      }
    }

    // Otherwise, recommend first unmastered activity
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      if (!activity) continue;

      const progress = progressMap.get(activity.id);
      if (!progress || !progress.mastered) {
        return activity.id;
      }
    }

    return null;
  }
}

export const activityProgressService = new ActivityProgressService();
