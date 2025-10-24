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
} from 'lucide-react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { useAppStore } from '../../../store/appStore';
import { pedagogicalEngine } from '../../../services/pedagogicalEngine';
import { dbHelpers } from '../../../lib/db';
import { ADDITION_SUBTRACTION_QUESTIONS } from '../../../data/activities/additionSubtraction';
import type {
  ActivityQuestion,
  ActivityAttempt,
  StudentCognitiveProfile,
  PedagogicalSession,
} from '../../../types';

const TOTAL_QUESTIONS = 10;
const CONCEPT_AREA = 'addition-1-10'; // Start with simplest

export function AdditionSubtractionActivity() {
  const navigate = useNavigate();
  const { subjectHub } = useParams<{ subjectHub: string }>();
  const user = useAppStore((state) => state.user);

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

  // Load cognitive profile
  useEffect(() => {
    if (!user) return;

    dbHelpers.getCognitiveProfile(user.id, 'matematik').then((p) => {
      setProfile(p || null);
    });
  }, [user]);

  // Select first question
  useEffect(() => {
    if (currentQuestion) return;
    selectNextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectNextQuestion = () => {
    const availableQuestions = ADDITION_SUBTRACTION_QUESTIONS.filter(
      (q) => !attempts.find((a) => a.questionId === q.id)
    );

    if (availableQuestions.length === 0 || currentQuestionIndex >= TOTAL_QUESTIONS) {
      completeSession();
      return;
    }

    // Use pedagogical engine to select next question
    const nextQuestion = pedagogicalEngine.selectNextQuestion(
      availableQuestions,
      profile,
      attempts,
      CONCEPT_AREA
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

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !user) return;
    if (userAnswer.trim() === '') return;

    const timeSpent = Date.now() - questionStartTime;
    const isCorrect = checkAnswer(userAnswer, currentQuestion.correctAnswer);

    // Create attempt
    const attempt: ActivityAttempt = {
      id: `attempt-${Date.now()}`,
      userId: user.id,
      sessionId,
      activityId: 'addition-subtraktion-1-3',
      subjectHub: 'matematik',
      ageGroup: '1-3',
      questionId: currentQuestion.id,
      questionConceptArea: currentQuestion.conceptArea,
      userAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      timestamp: new Date(),
      timeSpent,
      hintsUsed,
      scaffoldingUsed: getScaffoldingUsed(),
      soloLevel: currentQuestion.soloLevel,
      bloomLevel: currentQuestion.bloomLevel,
    };

    // Save to database
    await dbHelpers.saveActivityAttempt(attempt);

    // Update attempts
    const newAttempts = [...attempts, attempt];
    setAttempts(newAttempts);

    // Show feedback
    setFeedback({
      show: true,
      isCorrect,
      message: isCorrect
        ? '🎉 Rätt! Bra jobbat!'
        : `Inte riktigt. Rätt svar är ${currentQuestion.correctAnswer}`,
    });

    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    } else {
      // Save mistake for spaced repetition
      await dbHelpers.saveMistake({
        id: `mistake-${Date.now()}`,
        userId: user.id,
        activityId: 'addition-subtraktion-1-3',
        subjectHub: 'matematik',
        questionId: currentQuestion.id,
        conceptArea: currentQuestion.conceptArea,
        question: currentQuestion.question,
        userAnswer: String(userAnswer),
        correctAnswer: String(currentQuestion.correctAnswer),
        mistakeCount: 1,
        lastMistakeAt: new Date(),
        needsReview: true,
        interval: 1,
        easeFactor: 2.5,
        soloLevelAtMistake: currentQuestion.soloLevel,
        bloomLevelAtMistake: currentQuestion.bloomLevel,
      });
    }

    // Wait for feedback, then move to next question
    setTimeout(() => {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      selectNextQuestion();
    }, 2000);
  };

  const checkAnswer = (userAns: string, correctAns: string | number | string[]): boolean => {
    const userNum = parseFloat(userAns);
    const correctNum = typeof correctAns === 'number' ? correctAns : parseFloat(String(correctAns));

    return !isNaN(userNum) && !isNaN(correctNum) && userNum === correctNum;
  };

  const getScaffoldingUsed = (): string[] => {
    const used: string[] = [];
    if (currentQuestion?.visualSupport) used.push('visualSupport');
    if (currentQuestion?.showNumberLine) used.push('numberLine');
    if (currentQuestion?.showConcreteObjects) used.push('concreteObjects');
    if (hintsUsed > 0) used.push('hints');
    return used;
  };

  const handleShowHint = () => {
    setShowHint(true);
    setHintsUsed(hintsUsed + 1);
  };

  const getCurrentHint = (): string | undefined => {
    if (!currentQuestion) return undefined;
    if (hintsUsed === 0) return currentQuestion.hint1;
    if (hintsUsed === 1) return currentQuestion.hint2;
    if (hintsUsed === 2) return currentQuestion.hint3;
    return undefined;
  };

  const completeSession = async () => {
    if (!user) return;

    const sessionEndTime = Date.now();
    const durationSeconds = Math.floor((sessionEndTime - sessionStartTime) / 1000);

    // Update cognitive profile
    const updatedProfile = pedagogicalEngine.updateCognitiveProfile(
      profile,
      user.id,
      'matematik',
      attempts,
      '1-3'
    );

    await dbHelpers.saveCognitiveProfile(updatedProfile);

    // Check for breakthrough
    const breakthrough = pedagogicalEngine.checkBreakthrough(attempts);

    // Create pedagogical session
    const session: PedagogicalSession = {
      id: sessionId,
      subjectHub: 'matematik',
      activityId: 'addition-subtraktion-1-3',
      ageGroup: '1-3',
      startedAt: new Date(sessionStartTime),
      endedAt: new Date(sessionEndTime),
      durationSeconds,
      score: Math.round((correctCount / TOTAL_QUESTIONS) * 100),
      correctAnswers: correctCount,
      totalQuestions: TOTAL_QUESTIONS,
      xpEarned: correctCount * 10,
      attempts,
      mistakesMade: [],
      pedagogicalJourney: {
        startSOLOLevel: attempts[0]?.soloLevel || 'unistructural',
        endSOLOLevel: attempts[attempts.length - 1]?.soloLevel || 'unistructural',
        soloLevelProgression: attempts.map((a) => a.soloLevel),
        bloomLevelsEngaged: [...new Set(attempts.map((a) => a.bloomLevel))],
        scaffoldingUsed: [...new Set(attempts.flatMap((a) => a.scaffoldingUsed))],
        hintsUsedTotal: attempts.reduce((sum, a) => sum + a.hintsUsed, 0),
        breakthroughMoments: breakthrough.hasBreakthrough
          ? [
              {
                conceptArea: CONCEPT_AREA,
                description: 'Ny förståelsenivå uppnådd!',
                fromLevel: breakthrough.fromLevel!,
                toLevel: breakthrough.toLevel!,
                timestamp: new Date(),
              },
            ]
          : [],
      },
      conceptsStruggled: [],
      conceptsMastered: [],
      conceptsNeedReview: [],
      difficultyPath: [],
    };

    await dbHelpers.saveSubjectSession(session);

    // Award XP
    await dbHelpers.addXP(session.xpEarned);
    await dbHelpers.updateStreak();

    setSessionComplete(true);
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p>Du måste vara inloggad för att göra aktiviteter.</p>
        </div>
      </MainLayout>
    );
  }

  if (sessionComplete) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mb-6 flex justify-center">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 shadow-lg">
                <Trophy className="w-16 h-16 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Bra jobbat!
            </h1>

            <Card className="mb-6">
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {correctCount}/{TOTAL_QUESTIONS}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Rätt svar</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {correctCount * 10}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">XP</div>
                  </div>
                </div>

                <div className="text-left text-sm text-gray-700 dark:text-gray-300">
                  <p className="mb-2">
                    <Sparkles className="w-4 h-4 inline mr-2 text-yellow-500" />
                    Du har ökat din förståelse för addition och subtraktion!
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => window.location.reload()} variant="primary">
                Öva igen
              </Button>
              <Button onClick={() => navigate(`/subjects/${subjectHub}`)} variant="secondary">
                Tillbaka till Matematik
              </Button>
            </div>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  if (!currentQuestion) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p>Laddar frågor...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/subjects/${subjectHub}`)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Avsluta</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Target className="w-4 h-4" />
              <span>
                {currentQuestionIndex + 1}/{TOTAL_QUESTIONS}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>{correctCount}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-teal-600"
            initial={{ width: 0 }}
            animate={{
              width: `${((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <div className="p-8">
                {/* Question */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {currentQuestion.question}
                </h2>

                {/* Visual support */}
                {currentQuestion.realWorldContext && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-4xl text-center">{currentQuestion.realWorldContext}</div>
                  </div>
                )}

                {/* Answer input */}
                {currentQuestion.questionType === 'number-input' && (
                  <div className="mb-6">
                    <input
                      type="number"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-green-500 dark:focus:border-green-400 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Skriv ditt svar..."
                      autoFocus
                      disabled={feedback?.show}
                    />
                  </div>
                )}

                {/* Multiple choice */}
                {currentQuestion.questionType === 'multiple-choice' && currentQuestion.options && (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {currentQuestion.options.map((option) => (
                      <Button
                        key={option}
                        onClick={() => {
                          setUserAnswer(String(option));
                          setTimeout(() => handleSubmitAnswer(), 100);
                        }}
                        variant={userAnswer === String(option) ? 'primary' : 'secondary'}
                        disabled={feedback?.show}
                        className="text-lg py-4"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Feedback */}
                <AnimatePresence>
                  {feedback?.show && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`p-4 rounded-lg mb-6 ${
                        feedback.isCorrect
                          ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                          : 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {feedback.isCorrect ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        )}
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {feedback.message}
                          </p>
                          {!feedback.isCorrect && currentQuestion.explanation && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                              {currentQuestion.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hint */}
                {showHint && getCurrentHint() && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-400"
                  >
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {getCurrentHint()}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                {!feedback?.show && (
                  <div className="flex gap-3">
                    <Button onClick={handleSubmitAnswer} variant="primary" className="flex-1">
                      Svara
                    </Button>
                    {hintsUsed < 3 && getCurrentHint() && (
                      <Button onClick={handleShowHint} variant="secondary">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Tips ({hintsUsed}/3)
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
