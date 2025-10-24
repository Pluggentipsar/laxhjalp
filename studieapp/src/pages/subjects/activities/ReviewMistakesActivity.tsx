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
  RotateCcw,
  Brain,
} from 'lucide-react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { useAppStore } from '../../../store/appStore';
import { dbHelpers } from '../../../lib/db';
import { ADDITION_SUBTRACTION_QUESTIONS } from '../../../data/activities/additionSubtraction';
import type {
  ActivityQuestion,
  ActivityMistake,
} from '../../../types';

export function ReviewMistakesActivity() {
  const navigate = useNavigate();
  const { subjectHub } = useParams<{ subjectHub: string }>();
  const user = useAppStore((state) => state.user);

  // State
  const [mistakes, setMistakes] = useState<ActivityMistake[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<ActivityQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    message: string;
  } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load mistakes
  useEffect(() => {
    if (!user) return;

    const loadMistakes = async () => {
      try {
        const dueMistakes = await dbHelpers.getDueMistakes(user.id);
        console.log('Due mistakes:', dueMistakes);

        if (dueMistakes.length === 0) {
          setSessionComplete(true);
          setLoading(false);
          return;
        }

        setMistakes(dueMistakes);

        // Load first question
        if (dueMistakes[0]) {
          const question = ADDITION_SUBTRACTION_QUESTIONS.find(
            q => q.id === dueMistakes[0].questionId
          );
          if (question) {
            setCurrentQuestion(question);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to load mistakes:', error);
        setLoading(false);
      }
    };

    loadMistakes();
  }, [user]);

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !user || !mistakes[currentIndex]) return;
    if (userAnswer.trim() === '') return;

    const currentMistake = mistakes[currentIndex];
    const isCorrect = checkAnswer(userAnswer, currentQuestion.correctAnswer);

    // Update mistake in database
    await dbHelpers.updateMistakeReview(currentMistake.id, isCorrect);

    // Show feedback
    setFeedback({
      show: true,
      isCorrect,
      message: isCorrect
        ? '🎉 Rätt! Du har lärt dig detta!'
        : `Inte riktigt. Rätt svar är ${currentQuestion.correctAnswer}. ${currentMistake.aiFeedback || ''}`,
    });

    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    }

    // Wait for feedback, then move to next
    setTimeout(() => {
      if (currentIndex + 1 >= mistakes.length) {
        completeSession();
      } else {
        moveToNext();
      }
    }, isCorrect ? 2000 : 4000); // Longer wait if incorrect to read feedback
  };

  const moveToNext = () => {
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);

    const nextMistake = mistakes[nextIndex];
    if (nextMistake) {
      const question = ADDITION_SUBTRACTION_QUESTIONS.find(
        q => q.id === nextMistake.questionId
      );
      if (question) {
        setCurrentQuestion(question);
        setUserAnswer('');
        setHintsUsed(0);
        setShowHint(false);
        setFeedback(null);
      }
    }
  };

  const checkAnswer = (userAns: string, correctAns: string | number | string[]): boolean => {
    const userNum = parseFloat(userAns);
    const correctNum = typeof correctAns === 'number' ? correctAns : parseFloat(String(correctAns));
    return !isNaN(userNum) && !isNaN(correctNum) && userNum === correctNum;
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

  const completeSession = () => {
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

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p>Laddar dina misstag...</p>
        </div>
      </MainLayout>
    );
  }

  if (sessionComplete || mistakes.length === 0) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mb-6 flex justify-center">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                {mistakes.length === 0 ? (
                  <Trophy className="w-16 h-16 text-white" />
                ) : (
                  <Brain className="w-16 h-16 text-white" />
                )}
              </div>
            </div>

            {mistakes.length === 0 ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Inga misstag att repetera!
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Du har inga misstag som behöver repeteras just nu. Bra jobbat!
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Repetition klar!
                </h1>

                <Card className="mb-6">
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {correctCount}/{mistakes.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Rätt på första försöket
                        </div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                          {mistakes.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Misstag repeterade
                        </div>
                      </div>
                    </div>

                    <div className="text-left text-sm text-gray-700 dark:text-gray-300">
                      <p className="mb-2">
                        <Sparkles className="w-4 h-4 inline mr-2 text-yellow-500" />
                        Genom att repetera dina misstag stärker du din förståelse!
                      </p>
                    </div>
                  </div>
                </Card>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate('/subjects/matematik/addition-subtraktion-1-3')}
                variant="primary"
              >
                Öva mer
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
          <p>Kunde inte ladda fråga...</p>
        </div>
      </MainLayout>
    );
  }

  const currentMistake = mistakes[currentIndex];

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
              <RotateCcw className="w-4 h-4 text-purple-600" />
              <span className="font-semibold">Repetera misstag</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Target className="w-4 h-4" />
              <span>
                {currentIndex + 1}/{mistakes.length}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-600"
            initial={{ width: 0 }}
            animate={{
              width: `${((currentIndex + 1) / mistakes.length) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Mistake info */}
        {currentMistake.mistakeCount > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
          >
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <Brain className="w-4 h-4 inline mr-2" />
              Du har gjort fel på denna {currentMistake.mistakeCount} gånger. Ta dig tid!
            </p>
          </motion.div>
        )}

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
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                      <div className="flex items-start gap-3">
                        {feedback.isCorrect ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white mb-2">
                            {feedback.isCorrect ? 'Rätt!' : 'Inte riktigt...'}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {feedback.message}
                          </p>
                          {!feedback.isCorrect && currentQuestion.explanation && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
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
