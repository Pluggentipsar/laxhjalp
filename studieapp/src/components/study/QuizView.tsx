import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Check, X, Trophy, ChevronRight } from 'lucide-react';
import type { Question } from '../../types';

interface QuizViewProps {
  questions: Question[];
  onComplete: (stats: { correct: number; incorrect: number; score: number }) => void;
  onBack?: () => void;
}

export function QuizView({ questions, onComplete, onBack }: QuizViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (answer: string) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    setShowFeedback(true);
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setCorrect((prev) => prev + 1);
    } else {
      setIncorrect((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Sista frågan
      const score = Math.round((correct / questions.length) * 100);
      onComplete({ correct, incorrect, score });
    }
  };

  if (!currentQuestion) {
    return (
      <Card className="text-center py-12">
        <Trophy className="mx-auto text-primary-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Inga frågor tillgängliga
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Lägg till frågor till ditt material för att kunna göra quiz
        </p>
        {onBack && <Button onClick={onBack}>Tillbaka</Button>}
      </Card>
    );
  }

  const allAnswers = [
    currentQuestion.correctAnswer,
    ...(currentQuestion.alternativeAnswers || []),
  ].sort(() => Math.random() - 0.5);

  const isCorrectAnswer = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>
            Fråga {currentIndex + 1} av {questions.length}
          </span>
          <span>
            {correct} rätt, {incorrect} fel
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            animate={{ width: `${progress}%` }}
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {currentQuestion.question}
            </h2>

            {currentQuestion.type === 'multiple-choice' && (
              <div className="space-y-3">
                {allAnswers.map((answer, index) => {
                  const isSelected = selectedAnswer === answer;
                  const isCorrect = answer === currentQuestion.correctAnswer;
                  const showCorrect = showFeedback && isCorrect;
                  const showIncorrect = showFeedback && isSelected && !isCorrect;

                  return (
                    <motion.button
                      key={index}
                      whileHover={!showFeedback ? { scale: 1.02 } : {}}
                      whileTap={!showFeedback ? { scale: 0.98 } : {}}
                      onClick={() => handleAnswerSelect(answer)}
                      disabled={showFeedback}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        showCorrect
                          ? 'bg-green-100 border-2 border-green-500 dark:bg-green-900/30 dark:border-green-500'
                          : showIncorrect
                          ? 'bg-red-100 border-2 border-red-500 dark:bg-red-900/30 dark:border-red-500'
                          : isSelected
                          ? 'bg-primary-100 border-2 border-primary-500 dark:bg-primary-900/30 dark:border-primary-500'
                          : 'bg-gray-50 border-2 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-white font-medium">
                          {answer}
                        </span>
                        {showCorrect && (
                          <Check className="text-green-600" size={24} />
                        )}
                        {showIncorrect && (
                          <X className="text-red-600" size={24} />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'true-false' && (
              <div className="grid grid-cols-2 gap-3">
                {['Sant', 'Falskt'].map((answer) => {
                  const isSelected = selectedAnswer === answer;
                  const isCorrect = answer === currentQuestion.correctAnswer;
                  const showCorrect = showFeedback && isCorrect;
                  const showIncorrect = showFeedback && isSelected && !isCorrect;

                  return (
                    <motion.button
                      key={answer}
                      whileHover={!showFeedback ? { scale: 1.02 } : {}}
                      whileTap={!showFeedback ? { scale: 0.98 } : {}}
                      onClick={() => handleAnswerSelect(answer)}
                      disabled={showFeedback}
                      className={`p-6 rounded-xl text-center transition-all ${
                        showCorrect
                          ? 'bg-green-100 border-2 border-green-500 dark:bg-green-900/30'
                          : showIncorrect
                          ? 'bg-red-100 border-2 border-red-500 dark:bg-red-900/30'
                          : isSelected
                          ? 'bg-primary-100 border-2 border-primary-500 dark:bg-primary-900/30'
                          : 'bg-gray-50 border-2 border-gray-200 dark:bg-gray-800'
                      }`}
                    >
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {answer}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Feedback */}
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className={`p-4 ${
                  isCorrectAnswer
                    ? 'bg-green-50 border-green-500 dark:bg-green-900/20'
                    : 'bg-red-50 border-red-500 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCorrectAnswer ? (
                    <Check className="text-green-600 mt-1" size={24} />
                  ) : (
                    <X className="text-red-600 mt-1" size={24} />
                  )}
                  <div className="flex-1">
                    <h3
                      className={`font-bold mb-1 ${
                        isCorrectAnswer ? 'text-green-900' : 'text-red-900'
                      }`}
                    >
                      {isCorrectAnswer ? 'Rätt svar!' : 'Inte riktigt rätt'}
                    </h3>
                    {!isCorrectAnswer && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        Rätt svar var: <strong>{currentQuestion.correctAnswer}</strong>
                      </p>
                    )}
                    {currentQuestion.explanation && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentQuestion.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex gap-3">
        {!showFeedback ? (
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={!selectedAnswer}
          >
            Svara
          </Button>
        ) : (
          <Button className="w-full" size="lg" onClick={handleNext}>
            {currentIndex < questions.length - 1 ? (
              <>
                Nästa fråga
                <ChevronRight size={20} className="ml-2" />
              </>
            ) : (
              <>
                Se resultat
                <Trophy size={20} className="ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
