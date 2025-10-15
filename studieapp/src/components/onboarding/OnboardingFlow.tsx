import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import type { Subject, Grade } from '../../types';
import {
  BookOpen,
  Calculator,
  Globe,
  Languages,
  Landmark,
  Activity,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

const subjectIcons: Record<Subject, any> = {
  svenska: Languages,
  engelska: Globe,
  matte: Calculator,
  no: Activity,
  so: Landmark,
  idrott: Activity,
  annat: BookOpen,
};

const subjectColors: Record<Subject, string> = {
  svenska: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  engelska:
    'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  matte: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  no: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  so: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  idrott:
    'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  annat: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const grades: Grade[] = [2, 3, 4, 5, 6, 7, 8, 9];
const subjects: Subject[] = ['svenska', 'engelska', 'matte', 'no', 'so'];

export function OnboardingFlow() {
  const navigate = useNavigate();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const [step, setStep] = useState(0);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [dailyGoal, setDailyGoal] = useState(10);

  const toggleSubject = (subject: Subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleComplete = async () => {
    if (!selectedGrade || selectedSubjects.length === 0) return;

    await completeOnboarding(selectedGrade, selectedSubjects, dailyGoal, 5);
    navigate('/');
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return true; // Välkommen
      case 1:
        return selectedGrade !== null;
      case 2:
        return selectedSubjects.length > 0;
      case 3:
        return dailyGoal > 0;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-8"
            >
              <div className="text-6xl mb-6">📚</div>
              <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Välkommen!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                Låt oss göra pluggandet roligt och enkelt. Vi hjälper dig att
                nå dina mål!
              </p>
              <Button size="lg" onClick={() => setStep(1)} className="w-full">
                Kom igång <ChevronRight className="ml-2" size={20} />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="grade"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-6"
            >
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                Vilken årskurs går du i?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Detta hjälper oss att anpassa innehållet
              </p>

              <div className="grid grid-cols-4 gap-3 mb-8">
                {grades.map((grade) => (
                  <motion.button
                    key={grade}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedGrade(grade)}
                    className={`aspect-square rounded-xl flex items-center justify-center text-2xl font-bold transition-all ${
                      selectedGrade === grade
                        ? 'bg-primary-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {grade}
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="flex-1"
                >
                  <ChevronLeft size={20} className="mr-2" /> Tillbaka
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceed()}
                  className="flex-1"
                >
                  Nästa <ChevronRight size={20} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="subjects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-6"
            >
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                Vilka ämnen vill du plugga?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Välj ett eller flera (du kan ändra senare)
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {subjects.map((subject) => {
                  const Icon = subjectIcons[subject];
                  const isSelected = selectedSubjects.includes(subject);

                  return (
                    <motion.button
                      key={subject}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleSubject(subject)}
                      className={`p-4 rounded-xl transition-all ${
                        isSelected
                          ? 'ring-2 ring-primary-500 shadow-md'
                          : 'ring-1 ring-gray-200 dark:ring-gray-700'
                      } ${subjectColors[subject]}`}
                    >
                      <Icon size={32} className="mb-2" />
                      <div className="font-semibold capitalize">{subject}</div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  <ChevronLeft size={20} className="mr-2" /> Tillbaka
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceed()}
                  className="flex-1"
                >
                  Nästa <ChevronRight size={20} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-6"
            >
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                Sätt ditt dagliga mål
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Hur många minuter vill du plugga varje dag?
              </p>

              <div className="mb-8">
                <div className="text-center mb-4">
                  <span className="text-5xl font-bold text-primary-500">
                    {dailyGoal}
                  </span>
                  <span className="text-2xl text-gray-600 dark:text-gray-400 ml-2">
                    min
                  </span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-500"
                />

                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>5 min</span>
                  <span>60 min</span>
                </div>
              </div>

              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 mb-6">
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  💡 Tips: Börja med ett litet mål och öka sedan. Även 10
                  minuter om dagen gör stor skillnad!
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  <ChevronLeft size={20} className="mr-2" /> Tillbaka
                </Button>
                <Button onClick={handleComplete} className="flex-1">
                  Klar! 🎉
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicator */}
        <div className="flex gap-2 justify-center mt-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step
                  ? 'w-8 bg-primary-500'
                  : i < step
                  ? 'w-2 bg-primary-300'
                  : 'w-2 bg-gray-300 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
