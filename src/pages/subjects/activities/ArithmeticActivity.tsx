import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Trophy,
  Target,
  Sparkles,
  Gamepad2,
  BookOpen,
} from 'lucide-react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { useAppStore } from '../../../store/appStore';
import { pedagogicalEngine } from '../../../services/pedagogicalEngine';
import { dbHelpers } from '../../../lib/db';
import { getQuestionsByFilters } from '../../../data/activities/additionSubtraction';
import { generateMathQuestions } from '../../../services/aiService';
import { MathGameWrapper } from '../../../components/subjects/MathGameWrapper';
import type {
  ActivityQuestion,
  ActivityAttempt,
  StudentCognitiveProfile,
} from '../../../types';

const TOTAL_QUESTIONS = 10;

// Map activity IDs to concept areas
const ACTIVITY_CONCEPT_MAP: { [key: string]: string } = {
  'addition-1-5': 'addition-1-5',
  'addition-1-10': 'addition-1-10',
  'addition-11-20': 'addition-11-20',
  'addition-dubbletter': 'addition-dubbletter',
  'addition-tiotalsovergaing': 'addition-tiotalsövergång',
  'subtraktion-1-5': 'subtraktion-1-5',
  'subtraktion-1-10': 'subtraktion-1-10',
  'subtraktion-11-20': 'subtraktion-11-20',
  'blandade-operationer': 'blandade-operationer',
  'multiplikation-4-6': 'multiplikation-4-6',
  'division-4-6': 'division-4-6',
  'ai-utmaning': 'ai-generated',
  'antal-1-10': 'antal-1-10',
  'monster-1-3': 'monster-1-3',
  'addition-0-20': 'addition-0-20',
  'former-1-3': 'former-1-3',
  'brak-1-3': 'brak-1-3',
  'klockan-1-3': 'klockan-1-3',
  // Geometry activities (1-3)
  'langd-matning-1-3': 'langd-matning-1-3',
  'vikt-volym-1-3': 'vikt-volym-1-3',
  'symmetri-1-3': 'symmetri-1-3',
  'position-riktning-1-3': 'position-riktning-1-3',
  // Algebra activities (1-3)
  'obekant-tal-1-3': 'obekant-tal-1-3',
  'monster-avancerat-1-3': 'monster-avancerat-1-3',
  // Problem-solving (1-3)
  'textuppgifter-1-3': 'textuppgifter-1-3',
  // Statistics (1-3)
  'sortering-1-3': 'sortering-1-3',
  'tabeller-1-3': 'tabeller-1-3',
};

export function ArithmeticActivity() {
  const navigate = useNavigate();
  const { activityId } = useParams<{ activityId: string }>();
  const user = useAppStore((state) => state.user);

  // Determine concept area from activity ID
  const conceptArea = activityId ? ACTIVITY_CONCEPT_MAP[activityId] : 'addition-1-10';
  const isAIChallenge = activityId === 'ai-utmaning';

  // Mode state
  const [mode, setMode] = useState<'practice' | 'game'>('practice');

  // Session state
  const [sessionId] = useState(`session-${Date.now()}`);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<ActivityQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState<ActivityAttempt[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    message: string;
  } | null>(null);

  // Cognitive profile
  const [profile, setProfile] = useState<StudentCognitiveProfile | null>(null);

  // Session tracking
  const [sessionStartTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  // AI Questions
  const [aiQuestions, setAiQuestions] = useState<ActivityQuestion[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Load cognitive profile
  useEffect(() => {
    if (!user) return;

    dbHelpers.getCognitiveProfile(user.id, 'matematik').then((p) => {
      setProfile(p || null);
    });
  }, [user]);

  // Initialize AI questions if needed
  useEffect(() => {
    if (isAIChallenge && aiQuestions.length === 0) {
      setIsLoadingAI(true);
      generateMathQuestions('blandad matematik', 10, 'medium', 5).then((questions) => {
        setAiQuestions(questions);
        setIsLoadingAI(false);
      });
    }
  }, [isAIChallenge]);

  // Select first question
  useEffect(() => {
    if (currentQuestion || (isAIChallenge && aiQuestions.length === 0)) return;
    selectNextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiQuestions]);

  const selectNextQuestion = () => {
    let availableQuestions: ActivityQuestion[] = [];

    if (isAIChallenge) {
      availableQuestions = aiQuestions.filter(
        (q) => !attempts.find((a) => a.questionId === q.id)
      );
    } else {
      // Filter questions by concept area
      const conceptQuestions = getQuestionsByFilters({ conceptArea });
      availableQuestions = conceptQuestions.filter(
        (q) => !attempts.find((a) => a.questionId === q.id)
      );
    }

    if (availableQuestions.length === 0 || currentQuestionIndex >= TOTAL_QUESTIONS) {
      completeSession();
      return;
    }

    // Use pedagogical engine to select next question
    const nextQuestion = pedagogicalEngine.selectNextQuestion(
      availableQuestions,
      profile,
      attempts,
      conceptArea
    );

    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setUserAnswer('');
      setHintsUsed(0);
      setShowHint(false);
      setFeedback(null);
      setQuestionStartTime(Date.now());
    } else {
      completeSession();
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion || !user) return;

    const isCorrect =
      String(userAnswer).toLowerCase().trim() ===
      String(currentQuestion.correctAnswer).toLowerCase().trim();

    const timeSpent = Date.now() - questionStartTime;

    // Save attempt
    const attempt: ActivityAttempt = {
      id: `attempt-${Date.now()}`,
      userId: user.id,
      sessionId,
      activityId: activityId || 'addition-1-10',
      subjectHub: 'matematik',
      ageGroup: '1-3',
      questionId: currentQuestion.id,
      questionConceptArea: currentQuestion.conceptArea,
      userAnswer,
      correctAnswer: String(currentQuestion.correctAnswer),
      isCorrect,
      timeSpent,
      hintsUsed,
      scaffoldingUsed: [],
      timestamp: new Date(),
      soloLevel: currentQuestion.soloLevel,
      bloomLevel: currentQuestion.bloomLevel,
    };

    setAttempts([...attempts, attempt]);
    await dbHelpers.saveActivityAttempt(attempt);

    // Save mistake if incorrect
    if (!isCorrect) {
      await dbHelpers.saveMistake({
        id: `mistake-${Date.now()}`,
        userId: user.id,
        activityId: activityId || 'addition-1-10',
        subjectHub: 'matematik',
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        userAnswer,
        correctAnswer: String(currentQuestion.correctAnswer),
        conceptArea: currentQuestion.conceptArea,
        soloLevelAtMistake: currentQuestion.soloLevel,
        bloomLevelAtMistake: currentQuestion.bloomLevel,
        mistakeCount: 1,
        lastMistakeAt: new Date(),
        interval: 1,
        easeFactor: 2.5,
        needsReview: true,
      });
    }

    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    }

    // Show feedback
    setFeedback({
      show: true,
      isCorrect,
      message: isCorrect
        ? currentQuestion.explanation || 'Rätt svar! Bra jobbat! 🎉'
        : currentQuestion.explanation || `Rätt svar var: ${currentQuestion.correctAnswer}`,
    });
  };

  const handleNext = () => {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    selectNextQuestion();
  };

  const completeSession = async () => {
    if (!user) return;

    setSessionComplete(true);

    const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

    // Save session
    await dbHelpers.saveSubjectSession({
      id: sessionId,
      subjectHub: 'matematik',
      activityId: activityId || 'addition-1-10',
      ageGroup: '1-3',
      startedAt: new Date(sessionStartTime),
      endedAt: new Date(),
      durationSeconds,
      totalQuestions: attempts.length,
      correctAnswers: correctCount,
      xpEarned: correctCount * 10,
    });

    // Award XP
    useAppStore.getState().addXP(correctCount * 10);

    // Update cognitive profile
    if (profile) {
      await pedagogicalEngine.updateCognitiveProfile(profile, user.id, 'matematik', attempts, '1-3');
    }
  };

  const getHintText = () => {
    if (!currentQuestion) return '';
    if (hintsUsed === 0) return currentQuestion.hint1 || '';
    if (hintsUsed === 1) return currentQuestion.hint2 || '';
    return currentQuestion.hint3 || '';
  };

  const showHintHandler = () => {
    setShowHint(true);
    setHintsUsed(hintsUsed + 1);
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">Du måste vara inloggad för att träna.</p>
            <Button onClick={() => navigate('/login')} className="mt-4">
              Logga in
            </Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Game Mode Rendering
  if (mode === 'game') {
    // Get questions for the game
    const gameQuestions = isAIChallenge
      ? aiQuestions
      : getQuestionsByFilters({ conceptArea });

    return (
      <MathGameWrapper
        questions={gameQuestions}
        title={isAIChallenge ? 'AI Utmaning' : 'Matte-Spel'}
        onComplete={(score) => {
          // Handle game completion logic here (save XP etc)
          useAppStore.getState().addXP(score);
          // We could also save attempts here if we wanted detailed tracking for games
        }}
        onExit={() => setMode('practice')}
      />
    );
  }

  if (sessionComplete) {
    const accuracy = attempts.length > 0 ? (correctCount / attempts.length) * 100 : 0;

    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mb-6">
              <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Bra jobbat!</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Du klarade {correctCount} av {attempts.length} frågor
              </p>
            </div>

            <Card className="p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{Math.round(accuracy)}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Träffsäkerhet</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">+{correctCount * 10}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">XP</div>
                </div>
              </div>

              <div className="space-y-2">
                <Button onClick={() => window.location.reload()} className="w-full">
                  <Target className="w-4 h-4 mr-2" />
                  Träna igen
                </Button>
                <Button onClick={() => navigate('/subjects/matematik')} variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tillbaka till Matematik
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  if (!currentQuestion || (isAIChallenge && isLoadingAI)) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            {isAIChallenge && <p>AI skapar dina frågor...</p>}
          </div>
        </div>
      </MainLayout>
    );
  }

  const progressPercentage = ((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/subjects/matematik')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tillbaka
            </Button>

            {/* Mode Toggle */}
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex items-center">
              <button
                onClick={() => setMode('practice')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${mode === 'practice'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <BookOpen className="w-4 h-4 inline mr-1" />
                Öva
              </button>
              <button
                onClick={() => setMode('game')}
                className="px-3 py-1 rounded-md text-sm font-medium transition-all text-gray-500 hover:text-gray-700"
              >
                <Gamepad2 className="w-4 h-4 inline mr-1" />
                Spela
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Fråga {currentQuestionIndex + 1} / {TOTAL_QUESTIONS}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6 mb-6">
              {/* Question */}
              <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{currentQuestion.question}</h2>
                  {currentQuestion.aiGenerated && (
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI
                    </span>
                  )}
                </div>

                {currentQuestion.realWorldContext && (
                  <div className="text-4xl mb-4">{currentQuestion.realWorldContext}</div>
                )}
              </div>

              {/* Answer Input */}
              {!feedback && (
                <div className="space-y-4">
                  {currentQuestion.questionType === 'multiple-choice' && currentQuestion.options ? (
                    <div className="grid grid-cols-2 gap-3">
                      {currentQuestion.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => setUserAnswer(String(option))}
                          className={`p-4 rounded-lg border-2 transition-all ${userAnswer === String(option)
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                            }`}
                        >
                          <span className="text-xl font-semibold">{option}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Skriv ditt svar här..."
                      className="w-full p-4 text-xl text-center border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none dark:bg-gray-800"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && userAnswer) {
                          handleSubmit();
                        }
                      }}
                    />
                  )}

                  {/* Hint */}
                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                    >
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">{getHintText()}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {hintsUsed < 3 && (
                      <Button variant="outline" onClick={showHintHandler} className="flex-1">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Ledtråd {hintsUsed > 0 && `(${hintsUsed}/3)`}
                      </Button>
                    )}
                    <Button onClick={handleSubmit} disabled={!userAnswer} className="flex-1">
                      Svara
                    </Button>
                  </div>
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div
                    className={`p-4 rounded-lg ${feedback.isCorrect
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {feedback.isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                      )}
                      <div>
                        <h3 className="font-semibold mb-1">
                          {feedback.isCorrect ? 'Rätt svar!' : 'Inte helt rätt'}
                        </h3>
                        <p className="text-sm">{feedback.message}</p>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleNext} className="w-full">
                    {currentQuestionIndex + 1 < TOTAL_QUESTIONS ? 'Nästa fråga' : 'Avsluta'}
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Stats */}
        <div className="flex justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>{correctCount} rätt</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span>{attempts.length - correctCount} fel</span>
          </div>
        </div>
      </div>
    </MainLayout >
  );
}
