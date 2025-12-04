import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../../../components/common/Button';
import { Card } from '../../../../components/common/Card';
import { Check, X, RotateCcw, ArrowRight } from 'lucide-react';
import { playGameSound } from '../utils/sound';

interface Word {
    id: string;
    term: string;
    definition: string;
}

interface QuizOverlayProps {
    words?: Word[];
    wrongAnswers?: Array<{
        term: string;
        correctAnswer: string;
        userAnswer: string;
    }>;
    onClose: () => void;
    onComplete: () => void;
}

interface Question {
    word: Word;
    options: string[];
    correctIndex: number;
}

export function QuizOverlay({ words, wrongAnswers, onComplete }: QuizOverlayProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    useEffect(() => {
        generateQuestions();
    }, [words, wrongAnswers]);

    const generateQuestions = () => {
        let sourceWords: Word[] = [];

        if (wrongAnswers && wrongAnswers.length > 0) {
            // Create Word objects from wrong answers
            sourceWords = wrongAnswers.map((wa, index) => ({
                id: `wa-${index}`,
                term: wa.term,
                definition: wa.correctAnswer
            }));
        } else if (words) {
            sourceWords = [...words];
        } else {
            return;
        }

        // Shuffle words to create questions
        const shuffledWords = sourceWords.sort(() => Math.random() - 0.5);

        const newQuestions: Question[] = shuffledWords.map(word => {
            // Create options: Correct answer + 3 random distractors
            // For wrong answers, we might not have a full list of distractors, so we need a fallback or passed-in list
            // Assuming for now we just use other words in the list as distractors

            const distractors = sourceWords
                .filter(w => w.id !== word.id)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(w => w.definition);

            // If not enough distractors (e.g. only 1 wrong answer), add some generic ones or duplicates (simplified for now)
            while (distractors.length < 3) {
                distractors.push("...");
            }

            const options = [...distractors, word.definition].sort(() => Math.random() - 0.5);
            const correctIndex = options.indexOf(word.definition);

            return {
                word,
                options,
                correctIndex
            };
        });

        setQuestions(newQuestions);
        setCurrentIndex(0);
        setScore(0);
        setShowResult(false);
        setSelectedOption(null);
        setIsAnswered(false);
    };

    const handleOptionClick = (index: number) => {
        if (isAnswered) return;

        setSelectedOption(index);
        setIsAnswered(true);

        const isCorrect = index === questions[currentIndex].correctIndex;
        if (isCorrect) {
            setScore(s => s + 1);
            playGameSound('correct');
        } else {
            playGameSound('wrong');
        }

        // Auto-advance after delay
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsAnswered(false);
            } else {
                setShowResult(true);
                playGameSound('levelUp');
            }
        }, 1500);
    };

    if (questions.length === 0) return null;

    const currentQuestion = questions[currentIndex];

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-2xl"
            >
                <Card className="p-8 bg-white dark:bg-gray-900 border-2 border-purple-500 shadow-2xl">
                    {!showResult ? (
                        <>
                            {/* Header */}
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Quiz: {currentIndex + 1} / {questions.length}
                                </h2>
                                <div className="text-xl font-bold text-purple-500">
                                    Poäng: {score}
                                </div>
                            </div>

                            {/* Question */}
                            <div className="mb-8 text-center">
                                <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Vad betyder?</p>
                                <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-8">
                                    {currentQuestion.word.term}
                                </h3>

                                {/* Options */}
                                <div className="grid grid-cols-1 gap-3">
                                    {currentQuestion.options.map((option, index) => {
                                        let buttonStyle = "border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20";

                                        if (isAnswered) {
                                            if (index === currentQuestion.correctIndex) {
                                                buttonStyle = "border-green-500 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
                                            } else if (index === selectedOption) {
                                                buttonStyle = "border-red-500 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
                                            } else {
                                                buttonStyle = "opacity-50 border-gray-200";
                                            }
                                        }

                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleOptionClick(index)}
                                                disabled={isAnswered}
                                                className={`p-4 rounded-xl border-2 text-left transition-all text-lg font-medium flex items-center justify-between ${buttonStyle}`}
                                            >
                                                <span>{option}</span>
                                                {isAnswered && index === currentQuestion.correctIndex && (
                                                    <Check className="h-6 w-6 text-green-500" />
                                                )}
                                                {isAnswered && index === selectedOption && index !== currentQuestion.correctIndex && (
                                                    <X className="h-6 w-6 text-red-500" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Result Screen */
                        <div className="text-center py-8">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Bra jobbat! 🎉
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">
                                Du fick {score} av {questions.length} rätt.
                            </p>

                            <div className="text-6xl font-black text-purple-500 mb-8">
                                {Math.round((score / questions.length) * 100)}%
                            </div>

                            <div className="flex gap-4 justify-center">
                                <Button
                                    onClick={generateQuestions}
                                    variant="outline"
                                    size="lg"
                                >
                                    <RotateCcw className="mr-2 h-5 w-5" />
                                    Spela Igen
                                </Button>
                                <Button
                                    onClick={onComplete}
                                    className="bg-purple-600 hover:bg-purple-700"
                                    size="lg"
                                >
                                    <ArrowRight className="mr-2 h-5 w-5" />
                                    Avsluta
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </motion.div>
        </div>
    );
}
