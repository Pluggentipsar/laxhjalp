import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import {
  RotateCcw,
  Check,
  X,
  Volume2,
  ChevronLeft,
  Trophy,
} from 'lucide-react';
import type { Flashcard } from '../../types';

interface FlashcardViewProps {
  cards: Flashcard[];
  onComplete: (stats: { correct: number; incorrect: number }) => void;
  onBack?: () => void;
}

export function FlashcardView({ cards, onComplete, onBack }: FlashcardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [answered, setAnswered] = useState<boolean[]>(
    new Array(cards.length).fill(false)
  );

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'sv-SE';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (!answered[currentIndex]) {
      if (isCorrect) {
        setCorrect((prev) => prev + 1);
      } else {
        setIncorrect((prev) => prev + 1);
      }

      const newAnswered = [...answered];
      newAnswered[currentIndex] = true;
      setAnswered(newAnswered);
    }

    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      // Sista kortet - visa resultat
      setTimeout(() => {
        onComplete({ correct: correct + (isCorrect ? 1 : 0), incorrect: incorrect + (isCorrect ? 0 : 1) });
      }, 500);
    }
  };

  if (!currentCard) {
    return (
      <Card className="text-center py-12">
        <Trophy className="mx-auto text-primary-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Inga kort att repetera
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Kom tillbaka senare för att repetera dina kort
        </p>
        {onBack && (
          <Button onClick={onBack}>
            <ChevronLeft size={20} className="mr-2" />
            Tillbaka
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>
            Kort {currentIndex + 1} av {cards.length}
          </span>
          <span>
            {correct} rätt, {incorrect} fel
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="relative" style={{ perspective: '1000px' }}>
        <motion.div
          key={currentCard.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
            transition: 'transform 0.6s',
          }}
          onClick={handleFlip}
          className="cursor-pointer"
        >
          <Card className="min-h-[300px] flex flex-col items-center justify-center p-8 relative">
            {/* Front */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                position: isFlipped ? 'absolute' : 'relative',
                opacity: isFlipped ? 0 : 1,
              }}
              className="text-center w-full"
            >
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Fråga
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {currentCard.front}
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speak(currentCard.front);
                }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Volume2 size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-sm text-gray-400">Tryck för att vända</p>
              </div>
            </div>

            {/* Back */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                position: !isFlipped ? 'absolute' : 'relative',
                opacity: !isFlipped ? 0 : 1,
              }}
              className="text-center w-full"
            >
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Svar
              </div>
              <h2 className="text-2xl font-bold text-primary-500 mb-6">
                {currentCard.back}
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speak(currentCard.back);
                }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Volume2 size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-sm text-gray-400">
                  Visste du svaret?
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Answer buttons (only show when flipped) */}
      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleAnswer(false)}
            className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
          >
            <X size={20} className="mr-2" />
            Nej, repetera
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleAnswer(true)}
            className="bg-green-500 hover:bg-green-600"
          >
            <Check size={20} className="mr-2" />
            Ja, jag kunde!
          </Button>
        </motion.div>
      )}

      {/* Flip hint */}
      {!isFlipped && (
        <div className="text-center">
          <Button variant="ghost" onClick={handleFlip}>
            <RotateCcw size={20} className="mr-2" />
            Visa svar
          </Button>
        </div>
      )}
    </div>
  );
}
