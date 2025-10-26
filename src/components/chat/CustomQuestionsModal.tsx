import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardPaste, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface CustomQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (questions: string[]) => void;
}

export function CustomQuestionsModal({ isOpen, onClose, onSubmit }: CustomQuestionsModalProps) {
  const [questionsText, setQuestionsText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleParse = () => {
    // Dela upp texten i frågor baserat på radbrytningar eller numrering
    const lines = questionsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const questions: string[] = [];

    lines.forEach(line => {
      // Ta bort vanliga prefix som "1.", "1)", "Q1:", "Fråga 1:", etc.
      const cleanedLine = line.replace(/^(\d+[\.\):]?\s*|Q\d+:\s*|Fråga\s+\d+:\s*)/i, '').trim();

      // Lägg bara till om det finns text kvar och det verkar vara en fråga
      if (cleanedLine.length > 5) {
        questions.push(cleanedLine);
      }
    });

    setParsedQuestions(questions);
    setShowPreview(true);
  };

  const handleSubmit = () => {
    if (parsedQuestions.length > 0) {
      onSubmit(parsedQuestions);
      setQuestionsText('');
      setParsedQuestions([]);
      setShowPreview(false);
      onClose();
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setQuestionsText(text);
    } catch (err) {
      console.error('Kunde inte klistra in från urklipp:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-3xl max-h-[90vh] overflow-hidden"
        >
          <Card className="relative">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Egna förhörsfrågor</h2>
                  <p className="text-white/90 text-sm mt-1">
                    Klistra in frågor som AI:n ska förhöra dig på
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              {!showPreview ? (
                <>
                  {/* Info box */}
                  <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <p className="font-semibold mb-1">Tips för bästa resultat:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                        <li>Skriv en fråga per rad</li>
                        <li>Du kan numrera frågorna (1., 2., etc.) eller lämna dem utan nummer</li>
                        <li>AI:n kommer ställa frågorna i den ordning du klistrar in dem</li>
                        <li>Frågorna behöver relatera till ditt studiematerial för bäst resultat</li>
                      </ul>
                    </div>
                  </div>

                  {/* Text area */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-gray-900 dark:text-white">
                        Klistra in dina frågor här
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePaste}
                        className="text-sm"
                      >
                        <ClipboardPaste className="h-4 w-4 mr-2" />
                        Klistra in från urklipp
                      </Button>
                    </div>

                    <textarea
                      value={questionsText}
                      onChange={(e) => setQuestionsText(e.target.value)}
                      placeholder="Exempel:&#10;1. Vad är fotosyntesen?&#10;2. Vilka delar består en växt av?&#10;3. Hur producerar växter syre?"
                      className="w-full h-64 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                    />
                  </div>

                  {/* Example */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      EXEMPEL PÅ FORMATERING:
                    </p>
                    <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono">
{`1. Vad är fotosyntesen?
2. Vilka delar består en växt av?
3. Hur producerar växter syre?

eller

Vad är fotosyntesen?
Vilka delar består en växt av?
Hur producerar växter syre?`}
                    </pre>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      className="flex-1"
                    >
                      Avbryt
                    </Button>
                    <Button
                      onClick={handleParse}
                      disabled={!questionsText.trim()}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Förhandsgranska ({questionsText.split('\n').filter(l => l.trim()).length} rader)
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="font-semibold">
                        {parsedQuestions.length} frågor tolkade
                      </p>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {parsedQuestions.map((question, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <p className="flex-1 text-sm text-gray-900 dark:text-white">
                            {question}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="ghost"
                      onClick={() => setShowPreview(false)}
                      className="flex-1"
                    >
                      Redigera
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Använd dessa frågor
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
