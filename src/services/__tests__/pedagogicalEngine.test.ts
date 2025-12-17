import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PedagogicalActivityEngine } from '../pedagogicalEngine'
import type {
  ActivityQuestion,
  ActivityAttempt,
  StudentCognitiveProfile,
  SOLOLevel,
  BloomLevel,
} from '../../types'

// Mock factories
function createMockQuestion(overrides: Partial<ActivityQuestion> = {}): ActivityQuestion {
  return {
    id: crypto.randomUUID(),
    activityId: 'test-activity',
    question: 'What is 2 + 2?',
    questionType: 'number-input',
    correctAnswer: '4',
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
    difficulty: 'easy',
    conceptArea: 'addition',
    ageGroup: '8-10',
    hint1: 'Think about counting',
    explanation: '2 + 2 = 4',
    ...overrides,
  }
}

function createMockAttempt(overrides: Partial<ActivityAttempt> = {}): ActivityAttempt {
  return {
    id: crypto.randomUUID(),
    userId: 'test-user',
    sessionId: 'test-session',
    activityId: 'test-activity',
    questionId: 'test-question',
    userAnswer: '4',
    correctAnswer: '4',
    isCorrect: true,
    timestamp: new Date(),
    timeSpent: 5000,
    hintsUsed: 0,
    scaffoldingUsed: [],
    soloLevel: 'unistructural',
    bloomLevel: 'remember',
    questionConceptArea: 'addition',
    ...overrides,
  }
}

function createMockProfile(overrides: Partial<StudentCognitiveProfile> = {}): StudentCognitiveProfile {
  return {
    userId: 'test-user',
    subjectHub: 'matematik',
    lastUpdated: new Date(),
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
    ...overrides,
  }
}

describe('PedagogicalActivityEngine', () => {
  let engine: PedagogicalActivityEngine

  beforeEach(() => {
    engine = new PedagogicalActivityEngine()
    vi.spyOn(Math, 'random')
  })

  describe('selectNextQuestion', () => {
    it('returns null for empty questions list', () => {
      const result = engine.selectNextQuestion([], null, [], 'addition')
      expect(result).toBeNull()
    })

    it('returns a question from available questions', () => {
      const questions = [createMockQuestion()]
      vi.mocked(Math.random).mockReturnValue(0)

      const result = engine.selectNextQuestion(questions, null, [], 'addition')

      expect(result).toBeDefined()
      expect(result?.id).toBe(questions[0].id)
    })

    it('filters by concept area when matching questions exist', () => {
      const additionQuestion = createMockQuestion({ conceptArea: 'addition' })
      const subtractionQuestion = createMockQuestion({ conceptArea: 'subtraction' })
      vi.mocked(Math.random).mockReturnValue(0)

      const result = engine.selectNextQuestion(
        [additionQuestion, subtractionQuestion],
        null,
        [],
        'addition'
      )

      expect(result?.conceptArea).toBe('addition')
    })

    it('falls back to any question when no exact match', () => {
      const question = createMockQuestion({
        soloLevel: 'relational',
        conceptArea: 'multiplication',
      })
      vi.mocked(Math.random).mockReturnValue(0)

      const result = engine.selectNextQuestion([question], null, [], 'addition')

      expect(result).toBeDefined()
    })

    it('uses profile concept level when available', () => {
      const profile = createMockProfile({
        conceptLevels: {
          addition: {
            soloLevel: 'multistructural',
            bloomLevel: 'understand',
            confidence: 0.8,
            lastAssessment: new Date(),
            totalAttempts: 10,
            successRate: 0.8,
          },
        },
      })

      const questions = [
        createMockQuestion({ soloLevel: 'unistructural' }),
        createMockQuestion({ soloLevel: 'multistructural' }),
      ]
      vi.mocked(Math.random).mockReturnValue(0)

      const result = engine.selectNextQuestion(questions, profile, [], 'addition')

      expect(result?.soloLevel).toBe('multistructural')
    })
  })

  describe('assessPerformance (via determineScaffolding)', () => {
    it('returns on-track for empty attempts', () => {
      const scaffolding = engine.determineScaffolding(null, [])

      // On-track = not struggling, so no extra scaffolding
      expect(scaffolding.showNumberLine).toBe(false)
      expect(scaffolding.showWorkingExample).toBe(false)
    })

    it('detects struggling student (< 50% correct)', () => {
      const attempts = [
        createMockAttempt({ isCorrect: false }),
        createMockAttempt({ isCorrect: false }),
        createMockAttempt({ isCorrect: true }),
      ]

      const scaffolding = engine.determineScaffolding(null, attempts)

      expect(scaffolding.showNumberLine).toBe(true)
      expect(scaffolding.showWorkingExample).toBe(true)
      expect(scaffolding.visualSupport).toBe(true)
    })

    it('detects struggling student (many hints)', () => {
      const attempts = [
        createMockAttempt({ isCorrect: true, hintsUsed: 3 }),
        createMockAttempt({ isCorrect: true, hintsUsed: 3 }),
        createMockAttempt({ isCorrect: true, hintsUsed: 3 }),
      ]

      const scaffolding = engine.determineScaffolding(null, attempts)

      expect(scaffolding.showNumberLine).toBe(true)
    })

    it('excelling student gets no extra scaffolding', () => {
      const attempts = [
        createMockAttempt({ isCorrect: true, hintsUsed: 0, timeSpent: 3000 }),
        createMockAttempt({ isCorrect: true, hintsUsed: 0, timeSpent: 3000 }),
        createMockAttempt({ isCorrect: true, hintsUsed: 0, timeSpent: 3000 }),
      ]

      const scaffolding = engine.determineScaffolding(null, attempts)

      expect(scaffolding.showNumberLine).toBe(false)
      expect(scaffolding.showWorkingExample).toBe(false)
    })
  })

  describe('determineScaffolding', () => {
    it('uses profile visual learner preference', () => {
      const profile = createMockProfile({
        preferredScaffolding: {
          visualLearner: 0.8,
          needsConcreteMaterials: 0.3,
          needsWorkingExamples: 0.5,
          prefersFastPace: 0.5,
          strugglesWithAbstraction: 0.5,
        },
      })

      // Not struggling attempts
      const attempts = [
        createMockAttempt({ isCorrect: true }),
        createMockAttempt({ isCorrect: true }),
      ]

      const scaffolding = engine.determineScaffolding(profile, attempts)

      expect(scaffolding.visualSupport).toBe(true)
    })

    it('enables concrete objects for struggling student with preference', () => {
      const profile = createMockProfile({
        preferredScaffolding: {
          visualLearner: 0.5,
          needsConcreteMaterials: 0.8,
          needsWorkingExamples: 0.5,
          prefersFastPace: 0.5,
          strugglesWithAbstraction: 0.5,
        },
      })

      const attempts = [
        createMockAttempt({ isCorrect: false }),
        createMockAttempt({ isCorrect: false }),
        createMockAttempt({ isCorrect: false }),
      ]

      const scaffolding = engine.determineScaffolding(profile, attempts)

      expect(scaffolding.showConcreteObjects).toBe(true)
    })
  })

  describe('checkBreakthrough', () => {
    it('returns false for less than 5 attempts', () => {
      const attempts = [
        createMockAttempt(),
        createMockAttempt(),
        createMockAttempt(),
      ]

      const result = engine.checkBreakthrough(attempts)

      expect(result.hasBreakthrough).toBe(false)
    })

    it('detects breakthrough when progressing SOLO levels', () => {
      const attempts: ActivityAttempt[] = [
        createMockAttempt({ soloLevel: 'unistructural', isCorrect: true }),
        createMockAttempt({ soloLevel: 'unistructural', isCorrect: true }),
        createMockAttempt({ soloLevel: 'multistructural', isCorrect: true }),
        createMockAttempt({ soloLevel: 'multistructural', isCorrect: true }),
        createMockAttempt({ soloLevel: 'multistructural', isCorrect: true }),
      ]

      const result = engine.checkBreakthrough(attempts)

      expect(result.hasBreakthrough).toBe(true)
      expect(result.fromLevel).toBe('unistructural')
      expect(result.toLevel).toBe('multistructural')
    })

    it('no breakthrough if not consistent at new level', () => {
      const attempts: ActivityAttempt[] = [
        createMockAttempt({ soloLevel: 'unistructural', isCorrect: true }),
        createMockAttempt({ soloLevel: 'multistructural', isCorrect: true }),
        createMockAttempt({ soloLevel: 'multistructural', isCorrect: false }), // Incorrect
        createMockAttempt({ soloLevel: 'multistructural', isCorrect: true }),
        createMockAttempt({ soloLevel: 'multistructural', isCorrect: true }),
      ]

      const result = engine.checkBreakthrough(attempts)

      expect(result.hasBreakthrough).toBe(false)
    })

    it('no breakthrough if staying at same level', () => {
      const attempts: ActivityAttempt[] = [
        createMockAttempt({ soloLevel: 'unistructural', isCorrect: true }),
        createMockAttempt({ soloLevel: 'unistructural', isCorrect: true }),
        createMockAttempt({ soloLevel: 'unistructural', isCorrect: true }),
        createMockAttempt({ soloLevel: 'unistructural', isCorrect: true }),
        createMockAttempt({ soloLevel: 'unistructural', isCorrect: true }),
      ]

      const result = engine.checkBreakthrough(attempts)

      expect(result.hasBreakthrough).toBe(false)
    })
  })

  describe('updateCognitiveProfile', () => {
    it('creates new profile when null', () => {
      const attempts = [createMockAttempt()]

      const result = engine.updateCognitiveProfile(
        null,
        'test-user',
        'matematik',
        attempts,
        '8-10'
      )

      expect(result.userId).toBe('test-user')
      expect(result.subjectHub).toBe('matematik')
      expect(result.conceptLevels).toBeDefined()
      expect(result.preferredScaffolding.visualLearner).toBe(0.5)
    })

    it('updates concept levels from attempts', () => {
      const attempts = [
        createMockAttempt({
          questionConceptArea: 'addition',
          isCorrect: true,
          soloLevel: 'multistructural',
          bloomLevel: 'understand',
        }),
        createMockAttempt({
          questionConceptArea: 'addition',
          isCorrect: true,
          soloLevel: 'multistructural',
          bloomLevel: 'apply',
        }),
      ]

      const result = engine.updateCognitiveProfile(
        null,
        'test-user',
        'matematik',
        attempts,
        '8-10'
      )

      expect(result.conceptLevels['addition']).toBeDefined()
      expect(result.conceptLevels['addition'].successRate).toBe(1)
      expect(result.conceptLevels['addition'].totalAttempts).toBe(2)
    })

    it('increases visual learner preference when visual scaffolding used', () => {
      const profile = createMockProfile({
        preferredScaffolding: {
          visualLearner: 0.5,
          needsConcreteMaterials: 0.5,
          needsWorkingExamples: 0.5,
          prefersFastPace: 0.5,
          strugglesWithAbstraction: 0.5,
        },
      })

      const attempts = [
        createMockAttempt({
          scaffoldingUsed: ['visualSupport'],
        }),
      ]

      const result = engine.updateCognitiveProfile(
        profile,
        'test-user',
        'matematik',
        attempts,
        '8-10'
      )

      expect(result.preferredScaffolding.visualLearner).toBe(0.6)
    })

    it('updates ZPD based on concept levels', () => {
      const attempts = [
        createMockAttempt({
          questionConceptArea: 'addition',
          soloLevel: 'multistructural',
          isCorrect: true,
        }),
        createMockAttempt({
          questionConceptArea: 'subtraction',
          soloLevel: 'relational',
          isCorrect: true,
        }),
      ]

      const result = engine.updateCognitiveProfile(
        null,
        'test-user',
        'matematik',
        attempts,
        '8-10'
      )

      // ZPD should span from lowest to highest level
      expect(result.currentZPD.independentLevel).toBeDefined()
      expect(result.currentZPD.assistedLevel).toBeDefined()
      expect(result.currentZPD.targetLevel).toBeDefined()
    })

    it('preserves existing total attempts count', () => {
      const profile = createMockProfile({
        conceptLevels: {
          addition: {
            soloLevel: 'unistructural',
            bloomLevel: 'remember',
            confidence: 0.7,
            lastAssessment: new Date(),
            totalAttempts: 10,
            successRate: 0.7,
          },
        },
      })

      const attempts = [
        createMockAttempt({ questionConceptArea: 'addition', isCorrect: true }),
        createMockAttempt({ questionConceptArea: 'addition', isCorrect: true }),
      ]

      const result = engine.updateCognitiveProfile(
        profile,
        'test-user',
        'matematik',
        attempts,
        '8-10'
      )

      expect(result.conceptLevels['addition'].totalAttempts).toBe(12)
    })
  })

  describe('SOLO level progression', () => {
    it('correctly orders SOLO levels', () => {
      const levels: SOLOLevel[] = [
        'prestructural',
        'unistructural',
        'multistructural',
        'relational',
        'extended-abstract',
      ]

      // Test that higher levels get prioritized for excelling students
      const excellingAttempts = [
        createMockAttempt({ isCorrect: true, hintsUsed: 0, timeSpent: 3000 }),
        createMockAttempt({ isCorrect: true, hintsUsed: 0, timeSpent: 3000 }),
        createMockAttempt({ isCorrect: true, hintsUsed: 0, timeSpent: 3000 }),
      ]

      // Create questions at different levels
      const questions = levels.map((level) =>
        createMockQuestion({ soloLevel: level })
      )

      vi.mocked(Math.random).mockReturnValue(0)

      // With unistructural as current level and excelling, should target multistructural
      const profile = createMockProfile({
        conceptLevels: {
          addition: {
            soloLevel: 'unistructural',
            bloomLevel: 'remember',
            confidence: 1,
            lastAssessment: new Date(),
            totalAttempts: 5,
            successRate: 1,
          },
        },
      })

      const result = engine.selectNextQuestion(
        questions,
        profile,
        excellingAttempts,
        'addition'
      )

      expect(result?.soloLevel).toBe('multistructural')
    })
  })

  describe('Bloom level selection', () => {
    it('selects remember level 40% of the time', () => {
      const attempts: ActivityAttempt[] = []

      // Mock random to return 0.2 (within 0-0.4 range for remember)
      vi.mocked(Math.random).mockReturnValue(0.2)

      const questions = [
        createMockQuestion({ bloomLevel: 'remember' }),
        createMockQuestion({ bloomLevel: 'understand' }),
        createMockQuestion({ bloomLevel: 'apply' }),
      ]

      const result = engine.selectNextQuestion(questions, null, attempts, 'addition')

      expect(result?.bloomLevel).toBe('remember')
    })

    it('selects understand level 30% of the time', () => {
      const attempts: ActivityAttempt[] = []

      // Mock random to return 0.5 (within 0.4-0.7 range for understand)
      vi.mocked(Math.random).mockReturnValue(0.5)

      const questions = [
        createMockQuestion({ bloomLevel: 'remember' }),
        createMockQuestion({ bloomLevel: 'understand' }),
        createMockQuestion({ bloomLevel: 'apply' }),
      ]

      const result = engine.selectNextQuestion(questions, null, attempts, 'addition')

      expect(result?.bloomLevel).toBe('understand')
    })
  })
})
