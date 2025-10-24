import type {
  ActivityQuestion,
  ActivityAttempt,
  StudentCognitiveProfile,
  SOLOLevel,
  BloomLevel,
  AgeGroup,
  SubjectHub,
} from '../types';

export class PedagogicalActivityEngine {
  // SOLO progression order
  private soloOrder: SOLOLevel[] = [
    'prestructural',
    'unistructural',
    'multistructural',
    'relational',
    'extended-abstract',
  ];

  // Bloom progression order
  private bloomOrder: BloomLevel[] = [
    'remember',
    'understand',
    'apply',
    'analyze',
    'evaluate',
    'create',
  ];

  /**
   * Select next question based on student's cognitive profile and recent attempts
   */
  selectNextQuestion(
    availableQuestions: ActivityQuestion[],
    profile: StudentCognitiveProfile | null,
    recentAttempts: ActivityAttempt[],
    conceptArea: string
  ): ActivityQuestion | null {
    if (availableQuestions.length === 0) return null;

    // 1. Determine current SOLO level
    const currentSOLO = this.determineCurrentSOLOLevel(
      profile,
      recentAttempts,
      conceptArea
    );

    // 2. Determine target SOLO level (within ZPD)
    const targetSOLO = this.determineTargetSOLOLevel(
      currentSOLO,
      recentAttempts,
      profile
    );

    // 3. Select Bloom level (varied for engagement)
    const targetBloom = this.selectBloomLevel(recentAttempts);

    // 4. Filter questions by target levels
    let candidates = availableQuestions.filter(
      (q) =>
        q.soloLevel === targetSOLO &&
        q.bloomLevel === targetBloom &&
        q.conceptArea === conceptArea
    );

    // Fallback: if no exact match, be more flexible
    if (candidates.length === 0) {
      candidates = availableQuestions.filter(
        (q) => q.soloLevel === targetSOLO && q.conceptArea === conceptArea
      );
    }

    // Fallback: if still no match, use any question at target SOLO
    if (candidates.length === 0) {
      candidates = availableQuestions.filter((q) => q.soloLevel === targetSOLO);
    }

    // Final fallback: just pick any
    if (candidates.length === 0) {
      candidates = availableQuestions;
    }

    // Pick random from candidates to avoid predictability
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /**
   * Determine student's current SOLO level based on recent performance
   */
  private determineCurrentSOLOLevel(
    profile: StudentCognitiveProfile | null,
    recentAttempts: ActivityAttempt[],
    conceptArea: string
  ): SOLOLevel {
    // Use profile if available
    if (profile?.conceptLevels[conceptArea]) {
      return profile.conceptLevels[conceptArea].soloLevel;
    }

    // Assess from recent attempts
    if (recentAttempts.length >= 3) {
      const last3 = recentAttempts.slice(-3);
      const correctRate = last3.filter((a) => a.isCorrect).length / 3;

      // If doing well, return highest level attempted
      if (correctRate >= 0.67) {
        const levels = last3.map((a) => a.soloLevel);
        return this.getHighestSOLOLevel(levels);
      }
    }

    // Default: start at unistructural
    return 'unistructural';
  }

  /**
   * Determine target SOLO level (within ZPD)
   */
  private determineTargetSOLOLevel(
    currentLevel: SOLOLevel,
    recentAttempts: ActivityAttempt[],
    _profile: StudentCognitiveProfile | null
  ): SOLOLevel {
    const performance = this.assessPerformance(recentAttempts);

    if (performance === 'excelling') {
      // Move up one level
      return this.getNextSOLOLevel(currentLevel);
    } else if (performance === 'struggling') {
      // Move down one level or stay
      return this.getPreviousSOLOLevel(currentLevel);
    }

    // Maintain current level
    return currentLevel;
  }

  /**
   * Select Bloom level - varied for engagement
   */
  private selectBloomLevel(recentAttempts: ActivityAttempt[]): BloomLevel {
    // Weight distribution:
    // 40% Remember (automatize)
    // 30% Understand (build comprehension)
    // 20% Apply (real-world)
    // 10% Analyze/Evaluate (challenge)

    const rand = Math.random();

    if (rand < 0.4) return 'remember';
    if (rand < 0.7) return 'understand';
    if (rand < 0.9) return 'apply';

    // For analyze/evaluate, only if student is doing well
    const performance = this.assessPerformance(recentAttempts);
    if (performance === 'excelling') {
      return Math.random() < 0.5 ? 'analyze' : 'evaluate';
    }

    return 'apply';
  }

  /**
   * Assess recent performance
   */
  private assessPerformance(
    attempts: ActivityAttempt[]
  ): 'excelling' | 'on-track' | 'struggling' {
    if (attempts.length === 0) return 'on-track';

    const last3 = attempts.slice(-3);
    const correctRate = last3.filter((a) => a.isCorrect).length / last3.length;
    const avgHints = last3.reduce((sum, a) => sum + a.hintsUsed, 0) / last3.length;
    const avgTime = last3.reduce((sum, a) => sum + a.timeSpent, 0) / last3.length;

    // Excelling: 100% correct, fast, no hints
    if (correctRate === 1 && avgHints === 0 && avgTime < 10000) {
      return 'excelling';
    }

    // Struggling: <50% correct or many hints
    if (correctRate < 0.5 || avgHints > 2) {
      return 'struggling';
    }

    return 'on-track';
  }

  /**
   * Determine scaffolding needs
   */
  determineScaffolding(
    profile: StudentCognitiveProfile | null,
    recentAttempts: ActivityAttempt[]
  ): {
    visualSupport: boolean;
    showNumberLine: boolean;
    showConcreteObjects: boolean;
    showWorkingExample: boolean;
  } {
    const performance = this.assessPerformance(recentAttempts);
    const struggling = performance === 'struggling';

    return {
      visualSupport: struggling || (profile?.preferredScaffolding.visualLearner ?? 0) > 0.6,
      showNumberLine: struggling,
      showConcreteObjects: struggling && (profile?.preferredScaffolding.needsConcreteMaterials ?? 0) > 0.5,
      showWorkingExample: struggling,
    };
  }

  /**
   * Check if student had a breakthrough (level up in SOLO)
   */
  checkBreakthrough(
    recentAttempts: ActivityAttempt[]
  ): { hasBreakthrough: boolean; fromLevel?: SOLOLevel; toLevel?: SOLOLevel } {
    if (recentAttempts.length < 5) {
      return { hasBreakthrough: false };
    }

    const last5 = recentAttempts.slice(-5);
    const levels = last5.map((a) => a.soloLevel);

    // Check if consistently at a higher level now
    const oldLevel = levels[0];
    const newLevel = levels[levels.length - 1];

    if (this.getSOLOIndex(newLevel) > this.getSOLOIndex(oldLevel)) {
      // Check if last 3 are all at new level and correct
      const last3 = last5.slice(-3);
      const allCorrect = last3.every((a) => a.isCorrect);
      const allNewLevel = last3.every((a) => a.soloLevel === newLevel);

      if (allCorrect && allNewLevel) {
        return {
          hasBreakthrough: true,
          fromLevel: oldLevel,
          toLevel: newLevel,
        };
      }
    }

    return { hasBreakthrough: false };
  }

  /**
   * Update cognitive profile based on session
   */
  updateCognitiveProfile(
    profile: StudentCognitiveProfile | null,
    userId: string,
    subjectHub: SubjectHub,
    attempts: ActivityAttempt[],
    _ageGroup: AgeGroup
  ): StudentCognitiveProfile {
    const now = new Date();

    // Initialize profile if null
    if (!profile) {
      profile = {
        userId,
        subjectHub,
        lastUpdated: now,
        conceptLevels: {},
        preferredScaffolding: {
          visualLearner: 0.5,
          needsConcreteMaterials: 0.5,
          needsWorkingExamples: 0.5,
          prefersFastPace: 0.5,
          strugglesWithAbstraction: 0.5,
        },
        metacognitionLevel: {
          selfReflection: 0.5,
          strategyAwareness: 0.5,
          errorDetection: 0.5,
        },
        currentZPD: {
          independentLevel: 'unistructural',
          assistedLevel: 'multistructural',
          targetLevel: 'multistructural',
        },
      };
    }

    // Update concept levels from attempts
    const conceptAreas = [...new Set(attempts.map((a) => a.questionConceptArea))];

    for (const conceptArea of conceptAreas) {
      const conceptAttempts = attempts.filter((a) => a.questionConceptArea === conceptArea);
      const correctRate = conceptAttempts.filter((a) => a.isCorrect).length / conceptAttempts.length;

      const currentLevel = this.determineCurrentSOLOLevel(profile, conceptAttempts, conceptArea);

      profile.conceptLevels[conceptArea] = {
        soloLevel: currentLevel,
        bloomLevel: this.getHighestBloomLevel(conceptAttempts.map((a) => a.bloomLevel)),
        confidence: correctRate,
        lastAssessment: now,
        totalAttempts: (profile.conceptLevels[conceptArea]?.totalAttempts ?? 0) + conceptAttempts.length,
        successRate: correctRate,
      };
    }

    // Update scaffolding preferences
    const usedVisual = attempts.some((a) => a.scaffoldingUsed.includes('visualSupport'));
    const usedConcrete = attempts.some((a) => a.scaffoldingUsed.includes('showConcreteObjects'));

    if (usedVisual) {
      profile.preferredScaffolding.visualLearner = Math.min(
        1,
        profile.preferredScaffolding.visualLearner + 0.1
      );
    }

    if (usedConcrete) {
      profile.preferredScaffolding.needsConcreteMaterials = Math.min(
        1,
        profile.preferredScaffolding.needsConcreteMaterials + 0.1
      );
    }

    // Update ZPD
    const allLevels = Object.values(profile.conceptLevels).map((c) => c.soloLevel);
    if (allLevels.length > 0) {
      const lowestLevel = this.getLowestSOLOLevel(allLevels);
      const highestLevel = this.getHighestSOLOLevel(allLevels);

      profile.currentZPD = {
        independentLevel: lowestLevel,
        assistedLevel: highestLevel,
        targetLevel: this.getNextSOLOLevel(highestLevel),
      };
    }

    profile.lastUpdated = now;
    return profile;
  }

  // Helper methods
  private getSOLOIndex(level: SOLOLevel): number {
    return this.soloOrder.indexOf(level);
  }

  private getBloomIndex(level: BloomLevel): number {
    return this.bloomOrder.indexOf(level);
  }

  private getNextSOLOLevel(current: SOLOLevel): SOLOLevel {
    const index = this.getSOLOIndex(current);
    return this.soloOrder[Math.min(index + 1, this.soloOrder.length - 1)];
  }

  private getPreviousSOLOLevel(current: SOLOLevel): SOLOLevel {
    const index = this.getSOLOIndex(current);
    return this.soloOrder[Math.max(index - 1, 0)];
  }

  private getHighestSOLOLevel(levels: SOLOLevel[]): SOLOLevel {
    return levels.reduce((highest, current) =>
      this.getSOLOIndex(current) > this.getSOLOIndex(highest) ? current : highest
    );
  }

  private getLowestSOLOLevel(levels: SOLOLevel[]): SOLOLevel {
    return levels.reduce((lowest, current) =>
      this.getSOLOIndex(current) < this.getSOLOIndex(lowest) ? current : lowest
    );
  }

  private getHighestBloomLevel(levels: BloomLevel[]): BloomLevel {
    return levels.reduce((highest, current) =>
      this.getBloomIndex(current) > this.getBloomIndex(highest) ? current : highest
    );
  }
}

// Singleton instance
export const pedagogicalEngine = new PedagogicalActivityEngine();
