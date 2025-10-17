import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface PersonalizedExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (selectedInterests: string[], customContext?: string) => Promise<void>;
  userInterests: string[];
  selectedText: string;
}

export function PersonalizedExplanationModal({
  isOpen,
  onClose,
  onGenerate,
  userInterests,
  selectedText,
}: PersonalizedExplanationModalProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customContext, setCustomContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate(selectedInterests, customContext || undefined);
      onClose();
    } catch (error) {
      console.error('Error generating personalized explanation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setSelectedInterests([]);
      setCustomContext('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">Personlig Förklaring</h2>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isGenerating}
                    className="hover:bg-white/20 rounded-full p-1 transition-colors disabled:opacity-50"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-white/90 text-sm">
                  Välj dina intressen för att få en förklaring du kan relatera till!
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-240px)]">
                {/* Selected text preview */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Du vill få förklaring på:
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    "{selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}"
                  </p>
                </div>

                {/* Interests selection */}
                {userInterests && userInterests.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="w-5 h-5 text-pink-500" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Välj intressen att använda
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {userInterests.map((interest) => (
                        <button
                          key={interest}
                          onClick={() => toggleInterest(interest)}
                          disabled={isGenerating}
                          className={`px-4 py-2 rounded-full font-medium transition-all ${
                            selectedInterests.includes(interest)
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Du har inga intressen sparade än. Lägg till intressen på din profilsida för att få personliga förklaringar!
                    </p>
                  </div>
                )}

                {/* Custom context */}
                <div>
                  <label className="block font-semibold text-gray-900 dark:text-white mb-2">
                    Egen kontext (valfritt)
                  </label>
                  <textarea
                    value={customContext}
                    onChange={(e) => setCustomContext(e.target.value)}
                    disabled={isGenerating}
                    placeholder="T.ex. 'Förklara med hjälp av fotboll' eller 'Använd exempel från Minecraft'"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white resize-none disabled:opacity-50"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Du kan ange en specifik kontext om du inte vill använda dina sparade intressen
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isGenerating}
                >
                  Avbryt
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || (selectedInterests.length === 0 && !customContext.trim())}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Genererar...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generera förklaring
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
