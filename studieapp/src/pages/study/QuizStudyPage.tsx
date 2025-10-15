import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAppStore } from '../../store/appStore';
import type { Question } from '../../types';

type SessionQuestion = Question & { choices: string[] };

function shuffle(array: string[]) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function QuizStudyPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const materials = useAppStore((state) => state.materials);
  const loadMaterials = useAppStore((state) => state.loadMaterials);
  const endSession = useAppStore((state) => state.endSession);
  const navigate = useNavigate();

  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [sessionFinished, setSessionFinished] = useState(false);

  useEffect(() => {
    if (materials.length === 0) {
      loadMaterials();
    }
  }, [materials.length, loadMaterials]);

  const material = materials.find((item) => item.id === materialId);

  useEffect(() => {
    if (!material) return;
    const prepared = material.questions.map((question) => {
      const choiceSet = new Set<string>([
        question.correctAnswer,
        ...question.alternativeAnswers,
      ]);
      return {
        ...question,
        choices: shuffle(Array.from(choiceSet)),
      };
    });
    setSessionQuestions(prepared);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setIncorrect(0);
    setXpEarned(0);
    setSessionFinished(false);
  }, [material?.id]);

  const currentQuestion = useMemo(
    () => sessionQuestions[currentIndex],
    [sessionQuestions, currentIndex]
  );

  const progress =
    sessionQuestions.length > 0
      ? Math.min(
          ((currentIndex + (isAnswered ? 1 : 0)) / sessionQuestions.length) * 100,
          100
        )
      : 0;

  const handleAnswer = (answer: string) => {
    if (!currentQuestion || isAnswered) return;
    setSelectedAnswer(answer);
    setIsAnswered(true);
    if (answer === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
      setXpEarned((prev) => prev + 15);
    } else {
      setIncorrect((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (!isAnswered) return;

    if (currentIndex < sessionQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      finishSession();
    }
  };

  const finishSession = async () => {
    if (sessionFinished) return;
    setSessionFinished(true);
    await endSession(xpEarned, {
      questions: sessionQuestions.length,
      correct: score,
      incorrect,
      accuracy:
        sessionQuestions.length > 0
          ? Math.round((score / sessionQuestions.length) * 100)
          : 0,
    });
    await loadMaterials();
  };

  const handleExit = async () => {
    if (!sessionFinished && sessionQuestions.length > 0) {
      await finishSession();
    }
    navigate('/study');
  };

  if (!material) {
    return (
      <MainLayout title="Quiz">
        <div className="py-10 flex flex-col items-center text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vi kunde inte hitta det här materialet.
          </p>
          <Button onClick={() => navigate('/study')}>Tillbaka</Button>
        </div>
      </MainLayout>
    );
  }

  if (material.questions.length === 0) {
    return (
      <MainLayout title="Quiz">
        <div className="py-10 flex flex-col items-center text-center">
          <div className="text-4xl mb-3">❓</div>
          <h3 className="text-lg font-semibold mb-2">Inga quiz ännu</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 max-w-sm">
            Gå tillbaka till Studera-sidan och generera frågor först.
          </p>
          <Button onClick={() => navigate('/study')}>Tillbaka</Button>
        </div>
      </MainLayout>
    );
  }

  if (sessionFinished) {
    return (
      <MainLayout title="Quiz" showBottomNav={false}>
        <div className="py-10">
          <Card className="p-8 text-center space-y-4">
            <div className="text-4xl">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Quiz avklarat!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Du svarade rätt på {score} av {sessionQuestions.length} frågor och
              tjänade {xpEarned} XP.
            </p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/30 p-3">
                <span className="block text-xs uppercase text-emerald-600 dark:text-emerald-300">
                  Rätt
                </span>
                <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-300">
                  {score}
                </span>
              </div>
              <div className="rounded-xl bg-rose-100 dark:bg-rose-900/30 p-3">
                <span className="block text-xs uppercase text-rose-600 dark:text-rose-300">
                  Fel
                </span>
                <span className="text-lg font-semibold text-rose-600 dark:text-rose-300">
                  {incorrect}
                </span>
              </div>
              <div className="rounded-xl bg-indigo-100 dark:bg-indigo-900/30 p-3">
                <span className="block text-xs uppercase text-indigo-600 dark:text-indigo-300">
                  Träffsäkerhet
                </span>
                <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-300">
                  {sessionQuestions.length > 0
                    ? Math.round((score / sessionQuestions.length) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
            <Button onClick={() => navigate('/study')}>Tillbaka till översikten</Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Quiz" showBottomNav={false}>
      <div className="py-6 space-y-6">
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {material.title}
            </h2>
            <span className="text-sm text-gray-500">
              Fråga {currentIndex + 1} av {sessionQuestions.length}
            </span>
          </div>
          <div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {score} rätt · {incorrect} fel
            </p>
          </div>
        </section>

        {currentQuestion && (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6 space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                  Quiz
                </span>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-2">
                  {currentQuestion.question}
                </h3>
              </div>

              <div className="space-y-3">
                {currentQuestion.choices.map((choice) => {
                  const isCorrect = choice === currentQuestion.correctAnswer;
                  const isSelected = choice === selectedAnswer;

                  let variantClass =
                    'border-gray-200 dark:border-gray-700 hover:border-primary-300';
                  if (isAnswered && isCorrect) {
                    variantClass = 'border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-700';
                  } else if (isAnswered && isSelected && !isCorrect) {
                    variantClass = 'border-rose-400 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:border-rose-700';
                  }

                  return (
                    <button
                      key={choice}
                      onClick={() => handleAnswer(choice)}
                      disabled={isAnswered}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${variantClass}`}
                    >
                      <span className="text-sm">{choice}</span>
                    </button>
                  );
                })}
              </div>

              {isAnswered && currentQuestion.explanation && (
                <div className="text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <strong className="text-gray-700 dark:text-gray-300">
                    Förklaring:
                  </strong>{' '}
                  {currentQuestion.explanation}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={!isAnswered}
                >
                  {currentIndex === sessionQuestions.length - 1
                    ? 'Visa resultat'
                    : 'Nästa fråga'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="flex justify-end">
          <Button variant="ghost" onClick={handleExit}>
            Avsluta
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
