import { useState, useEffect } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, Loader2 } from 'lucide-react';
import { generateMaterial } from '../../services/aiService';
import { useAppStore } from '../../store/appStore';
import { useNavigate } from 'react-router-dom';
import type { Subject } from '../../types';

const TOPIC_SUGGESTIONS = [
  'Vikingarna',
  'fotosyntesen',
  'hur Minecraft kom till',
  'stora svarta hål',
  'solsystemet',
  'dinosaurier',
  'vulkaner',
  'Romarriket',
  'kroppens organ',
  'klimatförändringar',
  'elektricitet',
  'medeltiden',
  'rymdfärder',
  'havsdjur',
  'vädret',
  'pyramiderna',
  'biodiversitet',
  'fotbollens historia',
  'datorer och AI',
  'Sveriges historia',
];

const SUBJECT_OPTIONS: { value: Subject; label: string }[] = [
  { value: 'bild', label: 'Bild' },
  { value: 'biologi', label: 'Biologi' },
  { value: 'engelska', label: 'Engelska' },
  { value: 'fysik', label: 'Fysik' },
  { value: 'geografi', label: 'Geografi' },
  { value: 'hem-och-konsumentkunskap', label: 'Hem- och konsumentkunskap' },
  { value: 'historia', label: 'Historia' },
  { value: 'idrott', label: 'Idrott och hälsa' },
  { value: 'kemi', label: 'Kemi' },
  { value: 'matematik', label: 'Matematik' },
  { value: 'moderna-sprak', label: 'Moderna språk' },
  { value: 'musik', label: 'Musik' },
  { value: 'religionskunskap', label: 'Religionskunskap' },
  { value: 'samhallskunskap', label: 'Samhällskunskap' },
  { value: 'slojd', label: 'Slöjd' },
  { value: 'svenska', label: 'Svenska' },
];

export default function GenerateMaterialPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [customTopic, setCustomTopic] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const user = useAppStore((state) => state.user);
  const addMaterial = useAppStore((state) => state.addMaterial);
  const navigate = useNavigate();

  // Rotera ämnesförslag var 3:e sekund
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCurrentTopicIndex((prev) => (prev + 1) % TOPIC_SUGGESTIONS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const currentSuggestion = TOPIC_SUGGESTIONS[currentTopicIndex];
  const topicToGenerate = customTopic.trim() || currentSuggestion;

  const handleGenerate = async () => {
    if (!topicToGenerate) return;

    setIsGenerating(true);
    setError('');

    try {
      console.log('[GenerateMaterialPanel] Step 1: Getting grade');
      const grade = user?.grade ?? 5;

      console.log('[GenerateMaterialPanel] Step 2: Calling generateMaterial with topic:', topicToGenerate);
      const result = await generateMaterial(topicToGenerate, grade);
      console.log('[GenerateMaterialPanel] Step 3: Got result:', result);

      // Skapa nytt material med alla nödvändiga fält
      console.log('[GenerateMaterialPanel] Step 4: Creating material object');
      const materialToAdd = {
        id: crypto.randomUUID(),
        title: result.title,
        subject: selectedSubject || result.subject, // Använd valt ämne om det finns
        content: result.content,
        tags: result.suggestedTags,
        type: 'text' as const,
        excerpts: [],
        flashcards: [],
        questions: [],
        concepts: [],
        glossary: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        generationHistory: [],
      };

      console.log('[GenerateMaterialPanel] Step 5: Calling addMaterial');
      const newMaterial = await addMaterial(materialToAdd);
      console.log('[GenerateMaterialPanel] Step 6: Material added, ID:', newMaterial.id);

      // Navigera till det nya materialet
      console.log('[GenerateMaterialPanel] Step 7: Navigating to:', `/study/material/${newMaterial.id}`);
      navigate(`/study/material/${newMaterial.id}`);
      console.log('[GenerateMaterialPanel] Step 8: Navigation called');
    } catch (err) {
      console.error('[GenerateMaterialPanel] ERROR in handleGenerate:', err);
      setError('Kunde inte generera material. Försök igen.');
    } finally {
      console.log('[GenerateMaterialPanel] Step 9: Setting isGenerating to false');
      setIsGenerating(false);
    }
  };

  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
      <motion.div
        className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-xl shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header - Always Visible */}
        <Collapsible.Trigger className="w-full px-6 py-4 flex items-center justify-between text-white hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center"
              animate={{
                boxShadow: isOpen
                  ? ['0 0 0 0 rgba(255,255,255,0.4)', '0 0 0 8px rgba(255,255,255,0)']
                  : '0 0 0 0 rgba(255,255,255,0)',
              }}
              transition={{
                duration: 1.5,
                repeat: isOpen ? Infinity : 0,
                ease: 'easeOut',
              }}
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
            <div className="text-left">
              <h3 className="font-semibold text-lg">Generera nytt material</h3>
              <p className="text-sm text-white/80">
                Skapa ett studiematerial om valfritt ämne
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </Collapsible.Trigger>

        {/* Expandable Content */}
        <Collapsible.Content>
          <div className="px-6 pb-6 pt-2 space-y-4">
            {/* Prompt Input with Rotating Topic */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-2 text-white mb-3">
                <span className="text-sm font-medium">Jag vill lära mig om</span>
                <div className="flex-1 relative h-8 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.button
                      key={currentTopicIndex}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute inset-0 flex items-center group cursor-pointer"
                      onClick={() => {
                        setCustomTopic(currentSuggestion);
                      }}
                      disabled={isGenerating}
                    >
                      <span className="text-sm font-semibold text-yellow-200 group-hover:text-yellow-100 transition-colors underline decoration-dotted decoration-yellow-200/50 group-hover:decoration-yellow-100">
                        {currentSuggestion}
                      </span>
                      <Sparkles className="w-3 h-3 ml-1 text-yellow-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  </AnimatePresence>
                </div>
              </div>

              {/* Custom Topic Input */}
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isGenerating) {
                    handleGenerate();
                  }
                }}
                placeholder="Eller skriv ditt eget ämne här..."
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                disabled={isGenerating}
              />
            </div>

            {/* Subject Selector */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <label className="text-white text-sm font-medium mb-2 block">
                Vilket ämne? (valfritt - AI gissar annars)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SUBJECT_OPTIONS.map((subject) => (
                  <button
                    key={subject.value}
                    onClick={() =>
                      setSelectedSubject(
                        selectedSubject === subject.value ? null : subject.value
                      )
                    }
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedSubject === subject.value
                        ? 'bg-white text-purple-600 shadow-md'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    disabled={isGenerating}
                  >
                    {subject.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-300/50 rounded-lg p-3 text-white text-sm">
                {error}
              </div>
            )}

            {/* Generate Button */}
            <motion.button
              onClick={handleGenerate}
              disabled={isGenerating || !topicToGenerate}
              className="w-full py-3 px-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl relative overflow-hidden"
              whileHover={{ scale: isGenerating ? 1 : 1.02 }}
              whileTap={{ scale: isGenerating ? 1 : 0.98 }}
            >
              {/* Animated background during generation */}
              {isGenerating && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-purple-400/20"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              )}

              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                  <span className="relative z-10">Genererar material...</span>
                  <motion.div
                    className="absolute right-4"
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-purple-400 relative z-10" />
                  </motion.div>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generera material om &quot;{topicToGenerate}&quot;
                </>
              )}
            </motion.button>

            {/* Info Text */}
            <p className="text-white/70 text-xs text-center">
              Materialet anpassas automatiskt efter din årskurs ({user?.grade ?? 5})
            </p>
          </div>
        </Collapsible.Content>
      </motion.div>
    </Collapsible.Root>
  );
}
