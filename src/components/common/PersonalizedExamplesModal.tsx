import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface PersonalizedExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (selectedInterests: string[], customContext?: string) => Promise<void>;
  userInterests: string[];
}

export function PersonalizedExamplesModal({
  isOpen,
  onClose,
  onGenerate,
  userInterests,
}: PersonalizedExamplesModalProps) {
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
      // Reset state
      setSelectedInterests([]);
      setCustomContext('');
      onClose();
    } catch (error) {
      console.error('Error generating personalized examples:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500 px-6 py-6 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">Personaliserade Exempel</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Välj intressen som ska användas för att skapa exempel som du kan relatera till.
            </p>

            {/* Warning if no interests */}
            {userInterests.length === 0 && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Du har inga sparade intressen. Lägg till några i din profil eller skriv in anpassad kontext nedan.
                </p>
              </div>
            )}

            {/* Interest selection */}
            {userInterests.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Välj intressen:
                </label>
                <div className="flex flex-wrap gap-2">
                  {userInterests.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedInterests.includes(interest)
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md scale-105'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {selectedInterests.includes(interest) && (
                        <Heart className="inline h-3 w-3 mr-1" />
                      )}
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom context */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Anpassad kontext (valfritt):
              </label>
              <textarea
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder="T.ex. 'Förklara med hjälp av mat och matlagning'"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isGenerating}
              >
                Avbryt
              </Button>
              <Button
                onClick={handleGenerate}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                disabled={isGenerating || (selectedInterests.length === 0 && !customContext.trim())}
                isLoading={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Genererar...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Skapa exempel
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
