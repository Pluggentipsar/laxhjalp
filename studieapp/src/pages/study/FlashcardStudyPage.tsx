import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAppStore } from '../../store/appStore';
import { dbHelpers } from '../../lib/db';
import type { Flashcard } from '../../types';

type Quality = 'again' | 'almost' | 'good';

const qualityMap: Record<Quality, { value: number; xp: number; label: string }> =
  {
    again: { value: 1, xp: 0, label: 'Behöver öva mer' },
    almost: { value: 3, xp: 5, label: 'Nästan' },
    good: { value: 5, xp: 10, label: 'Jag kunde det!' },
  };

export function FlashcardStudyPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const materials = useAppStore((state) => state.materials);
  const loadMaterials = useAppStore((state) => state.loadMaterials);
  const endSession = useAppStore((state) => state.endSession);
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [stats, setStats] = useState<Record<Quality, number>>({
    again: 0,
    almost: 0,
    good: 0,
  });

  useEffect(() => {
    if (materials.length === 0) {
      loadMaterials();
    }
  }, [materials.length, loadMaterials]);

  const material = materials.find((item) => item.id === materialId);

  const cards = useMemo<Flashcard[]>(() => material?.flashcards ?? [], [material]);
  const totalAnswered = stats.again + stats.almost + stats.good;
  const currentCard = cards[currentIndex];
  const progress =
    cards.length > 0 ? Math.min((totalAnswered / cards.length) * 100, 100) : 0;

  const handleReveal = () => setShowAnswer(true);

  const handleGrade = async (quality: Quality) => {
    if (!material || !currentCard || isBusy) return;

    setIsBusy(true);
    const { value, xp } = qualityMap[quality];
    const updatedStats = {
      ...stats,
      [quality]: stats[quality] + 1,
    } as Record<Quality, number>;
    const updatedXp = xpEarned + xp;

    try {
      await dbHelpers.updateFlashcardReview(material.id, currentCard.id, value);
      setStats(updatedStats);
      setXpEarned(updatedXp);
    } catch (error) {
      console.error('Kunde inte uppdatera flashcard', error);
    } finally {
      setShowAnswer(false);
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        finishSession(updatedStats, updatedXp);
      }
      setIsBusy(false);
    }
  };

  const finishSession = async (
    finalStats: Record<Quality, number> = stats,
    finalXp: number = xpEarned
  ) => {
    if (!material || sessionFinished) return;
    setSessionFinished(true);
    await endSession(finalXp, {
      cardsReviewed: cards.length,
      again: finalStats.again,
      almost: finalStats.almost,
      good: finalStats.good,
    });
    await loadMaterials();
  };

  const handleExit = async () => {
    if (!sessionFinished && cards.length > 0) {
      await finishSession();
    }
    navigate('/study');
  };

  if (!material) {
    return (
      <MainLayout title="Flashcards">
        <div className="py-10 flex flex-col items-center text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vi kunde inte hitta det här materialet.
          </p>
          <Button onClick={() => navigate('/study')}>Tillbaka</Button>
        </div>
      </MainLayout>
    );
  }

  if (cards.length === 0) {
    return (
      <MainLayout title="Flashcards">
        <div className="py-10 flex flex-col items-center text-center">
          <div className="text-4xl mb-3">🃏</div>
          <h3 className="text-lg font-semibold mb-2">
            Inga flashcards ännu
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 max-w-sm">
            Gå tillbaka till Studera-sidan och generera kort först.
          </p>
          <Button onClick={() => navigate('/study')}>Tillbaka</Button>
        </div>
      </MainLayout>
    );
  }

  if (sessionFinished) {
    return (
      <MainLayout title="Flashcards" showBottomNav={false}>
        <div className="py-10">
          <Card className="p-8 text-center space-y-4">
            <div className="text-4xl">🎉</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Grymt jobbat!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Du gick igenom alla kort och tjänade {xpEarned} XP.
            </p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {(
                Object.keys(qualityMap) as Array<Quality>
              ).map((quality) => (
                <div
                  key={quality}
                  className={`rounded-xl p-3 ${
                    quality === 'good'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : quality === 'almost'
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-rose-100 dark:bg-rose-900/30'
                  }`}
                >
                  <span className="block text-xs uppercase">
                    {qualityMap[quality].label}
                  </span>
                  <span className="text-lg font-semibold">
                    {stats[quality]}
                  </span>
                </div>
              ))}
            </div>
            <Button onClick={() => navigate('/study')}>Tillbaka till översikten</Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Flashcards" showBottomNav={false}>
      <div className="py-6 space-y-6">
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {material.title}
            </h2>
            <span className="text-sm text-gray-500">
              Kort {currentIndex + 1} av {cards.length}
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
              {stats.good} rätt · {stats.almost} nästan · {stats.again} repetera
            </p>
          </div>
        </section>

        <motion.div
          key={currentCard.id}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="min-h-[300px] flex flex-col justify-between p-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                {showAnswer ? 'Svar' : 'Fråga'}
              </span>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-3">
                {showAnswer ? currentCard.back : currentCard.front}
              </h3>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="capitalize">
                Nivå: {currentCard.difficulty || 'okänd'}
              </span>
              {!showAnswer && (
                <Button variant="ghost" onClick={handleReveal}>
                  Visa svar
                </Button>
              )}
            </div>
          </Card>
        </motion.div>

        {showAnswer && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {(Object.keys(qualityMap) as Array<Quality>).map((quality) => (
              <Button
                key={quality}
                variant={quality === 'good' ? 'primary' : 'outline'}
                className={
                  quality === 'again'
                    ? 'border-rose-300 text-rose-600 dark:border-rose-800 dark:text-rose-300'
                    : quality === 'almost'
                    ? 'border-amber-300 text-amber-600 dark:border-amber-800 dark:text-amber-300'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }
                onClick={() => handleGrade(quality)}
                disabled={isBusy}
              >
                {qualityMap[quality].label}
              </Button>
            ))}
          </motion.div>
        )}

        {!showAnswer && (
          <div className="text-center">
            <Button variant="ghost" onClick={handleReveal}>
              Visa svar
            </Button>
          </div>
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
