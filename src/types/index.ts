// Core types för Studieappen

export type Subject =
  | 'bild'
  | 'biologi'
  | 'engelska'
  | 'fysik'
  | 'geografi'
  | 'hem-och-konsumentkunskap'
  | 'historia'
  | 'idrott'
  | 'kemi'
  | 'matematik'
  | 'moderna-sprak'
  | 'musik'
  | 'religionskunskap'
  | 'samhallskunskap'
  | 'slojd'
  | 'svenska'
  | 'annat';

export type Grade = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Difficulty = 'easy' | 'medium' | 'hard';

export type MaterialType = 'photo' | 'pdf' | 'text' | 'voice' | 'link';

export type StudyMode = 'flashcards' | 'quiz' | 'chat' | 'mindmap' | 'read';

export type GameType = 'snake' | 'memory' | 'whack' | 'time-attack' | 'concept-builder' | 'boss' | 'crossword';

export type GameScopeMode = 'single-material' | 'multi-material' | 'generated';

export type GameAudience = 'solo' | 'co-op' | 'versus';

export interface GameDefinition {
  id: GameType;
  name: string;
  tagline: string;
  description: string;
  status: 'available' | 'beta' | 'coming-soon';
  focus: string[];
  supports: {
    scope: GameScopeMode[];
    multiplayer: boolean;
  };
  averageDuration: string;
  difficulty: Difficulty;
  icon: string;
  tags: string[];
}

export type LanguageCode = 'sv' | 'en' | 'es';

export interface GameTermBase {
  id: string;
  materialId: string;
  term: string;
  definition: string;
  examples?: string[];
  source: 'flashcard' | 'concept' | 'glossary' | 'generated';
  language: LanguageCode;
}

export interface SnakeGameTerm extends GameTermBase {
  distractors: string[];
}

export interface GameContentPreparation {
  terms: SnakeGameTerm[];
  language: LanguageCode;
  source: 'existing' | 'generated' | 'mixed';
  needsReview: boolean;
  materialIds?: string[];
}

export interface MistakeEntry {
  id: string;
  materialId: string;
  term: string;
  definition: string;
  language: LanguageCode;
  missCount: number;
  lastMissedAt: string;
}

export interface GamePreferences {
  sourceMode: GameScopeMode;
  selectedMaterialIds: string[];
  includeAllMaterials: boolean;
  language: LanguageCode;
  difficulty: Difficulty;
  lastPlayedGame?: GameType;
  generatedTopicHint?: string;
}

export interface GenerationLogEntry {
  id: string;
  type: 'flashcards' | 'quiz' | 'concepts';
  count: number;
  difficulty?: Difficulty;
  createdAt: Date;
  notes?: string;
}

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  example?: string;
  addedAt: Date;
}

export interface Note {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  linkedText?: string; // Optional: Text that this note refers to
}

// Material & Organisation
export interface Material {
  id: string;
  title: string;
  subject: Subject;
  folderId?: string;
  tags: string[];
  type: MaterialType;
  content: string; // Huvudinnehåll (text/OCR-resultat)
  imageUrl?: string; // Original foto/skärmdump
  pdfUrl?: string;
  excerpts: Excerpt[]; // Utvalda nyckelfragment
  flashcards: Flashcard[];
  questions: Question[];
  concepts: Concept[];
  glossary?: GlossaryEntry[];
  notes?: Note[];
  simplifiedContent?: string;
  advancedContent?: string;
  additionalSections?: MaterialSection[]; // "Läs mer"-sektioner
  createdAt: Date;
  updatedAt: Date;
  lastStudied?: Date;
  difficulty?: Difficulty;
  generationHistory?: GenerationLogEntry[];
}

export interface MaterialSection {
  id: string;
  title: string;
  content: string;
  type: 'next-step' | 'deepening' | 'simplification';
  difficulty: 'easier' | 'same' | 'harder';
  addedAt: Date;
  collapsed?: boolean; // För att kunna vika ihop sektioner
}

export interface Folder {
  id: string;
  name: string;
  subject: Subject;
  color: string;
  icon?: string;
  createdAt: Date;
}

export interface Excerpt {
  id: string;
  materialId: string;
  text: string;
  startIndex: number;
  endIndex: number;
  isKeyPoint: boolean;
}

// Träningsenheter
export interface Flashcard {
  id: string;
  materialId: string;
  front: string;
  back: string;
  type: 'term-definition' | 'word-translation' | 'question-answer';
  difficulty: Difficulty;
  nextReview?: Date;
  interval: number; // Dagar till nästa rep (spaced repetition)
  easeFactor: number; // 2.5 default
  repetitions: number;
  lastReviewed?: Date;
  correctCount: number;
  incorrectCount: number;
}

export interface Question {
  id: string;
  materialId: string;
  question: string;
  correctAnswer: string;
  alternativeAnswers: string[]; // För flervals
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'match-pairs';
  explanation?: string;
  difficulty: Difficulty;
}

export interface Concept {
  id: string;
  materialId: string;
  term: string;
  definition: string;
  examples: string[];
  relatedConcepts: string[]; // IDs till andra koncept
  imageUrl?: string;
}

// Mindmaps
export interface MindmapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  children: string[]; // IDs till child-noder
  color?: string;
  icon?: string;
}

export interface Mindmap {
  id: string;
  materialId: string;
  title: string;
  rootNodeId: string;
  nodes: MindmapNode[];
  createdAt: Date;
  updatedAt: Date;
}

// Studiesessioner
export interface StudySession {
  id: string;
  materialId: string;
  mode: StudyMode;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds: number;
  cardsReviewed?: number;
  questionsAnswered?: number;
  correctAnswers?: number;
  xpEarned: number;
}

export interface GameSession {
  id: string;
  gameType: GameType;
  score: number;
  duration: number;
  completedAt: Date;
  xpEarned: number;
  materialId?: string;
  materialIds?: string[];
  sourceMode: GameScopeMode;
  settings?: Record<string, unknown>;
}

// Progression & Motivation
export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  photoURL?: string;
  grade: Grade;
  subjects: Subject[];
  interests: string[]; // För personaliserade exempel: ["Fotboll", "K-pop", "Fortnite"]
  createdAt: Date;

  // Mål
  dailyGoalMinutes: number;
  weeklyGoalDays: number;

  // Progression
  totalXp: number;
  level: number;
  streak: number;
  longestStreak: number;
  lastStudyDate?: Date;
  streakFreezeAvailable: boolean;

  // Badges
  badges: Badge[];

  // Inställningar
  settings: UserSettings;
}

export interface UserSettings {
  // Tillgänglighet
  textSize: 'small' | 'medium' | 'large' | 'x-large';
  dyslexiaFriendly: boolean;
  highContrast: boolean;
  ttsEnabled: boolean;
  ttsVoice?: string;
  ttsSpeed: number; // 0.5 - 2.0

  // Visuellt
  theme: 'light' | 'dark' | 'auto';
  reduceAnimations: boolean;
  emojiSupport: boolean;
  background?: BackgroundSettings;

  // Notiser
  remindersEnabled: boolean;
  reminderTime?: string; // HH:MM
  reminderDays: number[]; // 0-6 (söndag-lördag)

  // Backup
  cloudBackupEnabled: boolean;
  lastBackup?: Date;
}

export interface BackgroundSettings {
  type: 'gradient' | 'image' | 'custom';
  value: string; // Gradient name, image URL, or custom image base64
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'streak' | 'xp' | 'mastery' | 'special';
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  minutesStudied: number;
  xpEarned: number;
  sessionsCompleted: number;
  goalMet: boolean;
}

// Onboarding
export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  selectedGrade?: Grade;
  selectedSubjects: Subject[];
  dailyGoal?: number;
  weeklyGoal?: number;
}

// App State
export interface AppState {
  user: UserProfile | null;
  onboarding: OnboardingState;
  materials: Material[];
  folders: Folder[];
  sessions: StudySession[];
  gameSessions: GameSession[];
  dailyProgress: DailyProgress[];
  isLoading: boolean;
  error: string | null;
}

// API-relaterade (förberedd struktur)
export interface AIGenerationRequest {
  materialId: string;
  content: string;
  type: 'flashcards' | 'questions' | 'concepts' | 'mindmap' | 'simplify';
  difficulty?: Difficulty;
  count?: number;
}

export interface AIGenerationResponse {
  flashcards?: Flashcard[];
  questions?: Question[];
  concepts?: Concept[];
  mindmap?: Mindmap;
  simplifiedText?: string;
}

export type ChatMode =
  | 'socratic'        // Förhör mig (sokratisk metod)
  | 'adventure'       // Textäventyr
  | 'free'            // Fråga vad du vill
  | 'active-learning' // Lär mig aktivt
  | 'quiz'            // Quiz-mästaren
  | 'discussion';     // Diskussionspartner

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  materialId: string;
  mode: ChatMode;
  title?: string;             // Auto-genererad eller user-given titel
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt?: Date;
  metadata?: {
    progress?: number;        // För progressspårning i vissa modes
    conceptsCovered?: string[]; // Begrepp som täckts
    adventureState?: any;     // State för textäventyr
    score?: number;           // För quiz-mode
    questionsAsked?: number;  // Antal frågor i session
  };
}

// Text embeddings för RAG
export interface TextEmbedding {
  id: string;
  materialId: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  createdAt: Date;
}

// OCR & Import
export interface OCRResult {
  text: string;
  confidence: number;
  language?: string;
  boundingBoxes?: {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}

export interface ImportResult {
  material: Material;
  suggestedFlashcards: Flashcard[];
  suggestedQuestions: Question[];
  suggestedConcepts: Concept[];
}

// Personalized Explanations
export interface PersonalizedExplanation {
  id: string;
  userId: string;
  materialId: string;
  selectedText?: string;
  concepts: string[];
  interests: string[];
  customContext?: string;
  explanation: string;
  createdAt: Date;
}

export interface PersonalizedExplanationRequest {
  materialId: string;
  content: string;
  selectedText?: string;
  concepts?: string[];
  interests: string[];
  customContext?: string;
}

export interface ExplainSelectionResponse {
  term: string;
  definition: string;
  explanation: string;
  example?: string;
}

// Subject Hubs - Ämnesspecifika sektioner
export type SubjectHub =
  | 'svenska'
  | 'engelska'
  | 'matematik'
  | 'so'
  | 'no'
  | 'bild';

export type AgeGroup = '1-3' | '4-6' | '7-9';

export interface SubjectActivity {
  id: string;
  subjectHub: SubjectHub;
  category: string;
  name: string;
  tagline: string;
  description: string;
  ageGroups: AgeGroup[];
  icon: string;
  status: 'available' | 'coming-soon';
  componentPath?: string;
  requiredMaterials?: boolean;
  estimatedDuration?: string;
  difficulty?: Difficulty;
  tags?: string[];
}

export interface SubjectCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  activities: SubjectActivity[];
  ageSpecific: boolean;
}

export interface SubjectHubDefinition {
  id: SubjectHub;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  categories: SubjectCategory[];
}

export interface SubjectSession {
  id: string;
  subjectHub: SubjectHub;
  activityId: string;
  ageGroup: AgeGroup;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds: number;
  score?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  xpEarned: number;
  materialId?: string;
}

// Pedagogical Taxonomies
export type SOLOLevel =
  | 'prestructural'     // Förstår inte, gissar
  | 'unistructural'     // En aspekt i taget
  | 'multistructural'   // Flera aspekter, ej sammankopplade
  | 'relational'        // Ser samband mellan aspekter
  | 'extended-abstract'; // Generaliserar till nya situationer

export type BloomLevel =
  | 'remember'     // Komma ihåg fakta
  | 'understand'   // Förstå koncept
  | 'apply'        // Tillämpa i nya situationer
  | 'analyze'      // Bryta ner problem
  | 'evaluate'     // Bedöma strategier
  | 'create';      // Skapa egna problem

// Activity Questions with Pedagogical Support
export interface ActivityQuestion {
  id: string;
  activityId: string;
  question: string;
  questionType: 'multiple-choice' | 'fill-blank' | 'open-ended' | 'visual-select' | 'number-input';
  correctAnswer: string | number | string[];
  options?: string[] | number[]; // För multiple-choice
  visualOptions?: { id: string; image?: string; label: string; value: number | string }[];
  explanation?: string;
  hint1?: string;
  hint2?: string;
  hint3?: string;
  difficulty: Difficulty;
  conceptArea: string;
  ageGroup: AgeGroup;

  // Taxonomi
  soloLevel: SOLOLevel;
  bloomLevel: BloomLevel;

  // Scaffolding
  visualSupport?: boolean; // Visa bilder/diagram
  showNumberLine?: boolean; // Visa talinje
  showConcreteObjects?: boolean; // Visa konkreta objekt (äpplen, etc)
  showWorkingExample?: boolean; // Visa lösningsexempel

  // Progression
  prerequisiteQuestions?: string[];
  unlockQuestions?: string[];

  // Kontext
  realWorldContext?: string;
  personalizationHint?: string; // T.ex. "use_student_interests"

  // Metakognition
  reflectionPrompt?: string;
  strategyPrompt?: string;
}

// Student's Attempt at a Question
export interface ActivityAttempt {
  id: string;
  userId: string;
  sessionId: string;
  activityId: string;
  subjectHub: SubjectHub;
  ageGroup: AgeGroup;
  questionId: string;
  questionConceptArea: string;

  // Answer data
  userAnswer: string | number | string[];
  correctAnswer: string | number | string[];
  isCorrect: boolean;

  // Timing
  timestamp: Date;
  timeSpent: number; // millisekunder

  // Support used
  hintsUsed: number;
  scaffoldingUsed: string[]; // ['visualSupport', 'numberLine']

  // Taxonomic levels
  soloLevel: SOLOLevel;
  bloomLevel: BloomLevel;

  // AI feedback (för open-ended)
  aiFeedback?: string;
  aiConfidence?: number; // 0-1
}

// Mistakes to Review (Spaced Repetition)
export interface ActivityMistake {
  id: string;
  userId: string;
  activityId: string;
  subjectHub: SubjectHub;
  questionId: string;
  conceptArea: string;

  // Question data
  question: string;
  userAnswer: string | number;
  correctAnswer: string | number;

  // Spaced repetition
  mistakeCount: number;
  lastMistakeAt: Date;
  needsReview: boolean;
  nextReviewAt?: Date;
  interval: number; // Dagar till nästa repetition
  easeFactor: number; // 2.5 default (SM-2 algorithm)

  // Taxonomic context
  soloLevelAtMistake: SOLOLevel;
  bloomLevelAtMistake: BloomLevel;

  // Feedback
  aiFeedback?: string;
  personalizedExplanation?: string;
}

// Student's Cognitive Profile
export interface StudentCognitiveProfile {
  userId: string;
  subjectHub: SubjectHub;
  lastUpdated: Date;

  // Concept mastery levels
  conceptLevels: {
    [conceptArea: string]: {
      soloLevel: SOLOLevel;
      bloomLevel: BloomLevel;
      confidence: number; // 0-1
      lastAssessment: Date;
      totalAttempts: number;
      successRate: number; // 0-1
    };
  };

  // Learning preferences
  preferredScaffolding: {
    visualLearner: number; // 0-1
    needsConcreteMaterials: number;
    needsWorkingExamples: number;
    prefersFastPace: number;
    strugglesWithAbstraction: number;
  };

  // Metacognitive skills
  metacognitionLevel: {
    selfReflection: number;
    strategyAwareness: number;
    errorDetection: number;
  };

  // Zone of Proximal Development
  currentZPD: {
    independentLevel: SOLOLevel;
    assistedLevel: SOLOLevel;
    targetLevel: SOLOLevel;
  };

  // Interests for personalization
  interests?: string[];
}

// Enhanced Session with Pedagogical Tracking
export interface PedagogicalSession extends SubjectSession {
  attempts: ActivityAttempt[];
  mistakesMade: string[]; // IDs to ActivityMistake

  // Pedagogical journey
  pedagogicalJourney: {
    startSOLOLevel: SOLOLevel;
    endSOLOLevel: SOLOLevel;
    soloLevelProgression: SOLOLevel[];
    bloomLevelsEngaged: BloomLevel[];
    scaffoldingUsed: string[];
    hintsUsedTotal: number;

    // Metacognitive reflections
    metacognitiveReflections?: {
      question: string;
      reflection: string;
      timestamp: Date;
    }[];

    // Breakthrough moments
    breakthroughMoments?: {
      conceptArea: string;
      description: string;
      fromLevel: SOLOLevel;
      toLevel: SOLOLevel;
      timestamp: Date;
    }[];
  };

  // Concept areas covered
  conceptsStruggled: string[];
  conceptsMastered: string[];
  conceptsNeedReview: string[];

  // Adaptive difficulty tracking
  difficultyPath: {
    questionId: string;
    difficulty: Difficulty;
    soloLevel: SOLOLevel;
    bloomLevel: BloomLevel;
    result: 'correct' | 'incorrect';
    adjustment: 'increase' | 'decrease' | 'maintain';
  }[];
}
