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

export type GameType = 'snake' | 'memory' | 'whack' | 'timeatack' | 'boss';

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
  createdAt: Date;
  updatedAt: Date;
  lastStudied?: Date;
  difficulty?: Difficulty;
  generationHistory?: GenerationLogEntry[];
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
  materialId: string;
  gameType: GameType;
  score: number;
  duration: number;
  completedAt: Date;
  xpEarned: number;
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

  // Notiser
  remindersEnabled: boolean;
  reminderTime?: string; // HH:MM
  reminderDays: number[]; // 0-6 (söndag-lördag)

  // Backup
  cloudBackupEnabled: boolean;
  lastBackup?: Date;
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
