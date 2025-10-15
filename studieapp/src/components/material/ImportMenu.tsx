import { motion, AnimatePresence } from 'framer-motion';
import { Camera, FileText, Link as LinkIcon, Mic, Upload, Sparkles } from 'lucide-react';
import { Card } from '../common/Card';

interface ImportMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (type: 'camera' | 'pdf' | 'text' | 'link' | 'voice') => void;
}

const importOptions = [
  {
    type: 'camera' as const,
    icon: Camera,
    label: 'Ta Foto',
    description: 'OCR från bild',
    gradient: 'from-pink-500 to-rose-500',
    emoji: '📸'
  },
  {
    type: 'pdf' as const,
    icon: FileText,
    label: 'Ladda PDF',
    description: 'Importera PDF-fil',
    gradient: 'from-red-500 to-orange-500',
    emoji: '📄'
  },
  {
    type: 'text' as const,
    icon: Upload,
    label: 'Skriv/Klistra In',
    description: 'Text direkt',
    gradient: 'from-blue-500 to-cyan-500',
    emoji: '✍️'
  },
  {
    type: 'link' as const,
    icon: LinkIcon,
    label: 'Från Länk',
    description: 'Webbsida/artikel',
    gradient: 'from-purple-500 to-indigo-500',
    emoji: '🔗'
  },
  {
    type: 'voice' as const,
    icon: Mic,
    label: 'Röstinspelning',
    description: 'Diktera text',
    gradient: 'from-green-500 to-emerald-500',
    emoji: '🎤'
  },
];

export function ImportMenu({ isOpen, onClose, onSelectOption }: ImportMenuProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Menu */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md"
        >
          <Card className="glass p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-3 animate-glow">
                <Sparkles size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Importera Material
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Välj hur du vill lägga till ditt studiematerial
              </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-3">
              {importOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <motion.button
                    key={option.type}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectOption(option.type);
                      onClose();
                    }}
                    className="relative overflow-hidden group"
                  >
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-transparent transition-all">
                      {/* Gradient overlay on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${option.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />

                      {/* Icon */}
                      <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center text-white flex-shrink-0 shadow-lg`}>
                        <Icon size={24} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 text-left">
                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {option.label}
                          <span className="text-xl">{option.emoji}</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {option.description}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors transform group-hover:translate-x-1 transition-transform">
                        →
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Cancel button */}
            <button
              onClick={onClose}
              className="w-full mt-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Avbryt
            </button>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
