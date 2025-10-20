import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ChatMode } from '../../types';

interface ModeCardProps {
  mode: ChatMode;
  title: string;
  description: string;
  perfectFor: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  onSelect: (mode: ChatMode) => void;
  hasContinueSession?: boolean;
  conversationCount?: number;
}

export function ModeCard({
  mode,
  title,
  description,
  perfectFor,
  icon: Icon,
  color,
  gradient,
  onSelect,
  hasContinueSession = false,
  conversationCount = 0,
}: ModeCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => onSelect(mode)}
      className="relative cursor-pointer group"
    >
      <div
        className={`relative h-full rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden`}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <Icon className="w-full h-full" />
        </div>

        {/* Continue badge */}
        {hasContinueSession && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-xs font-semibold"
          >
            <Sparkles className="h-3 w-3 text-yellow-500" />
            <span className="text-gray-700 dark:text-gray-300">Fortsätt</span>
          </motion.div>
        )}

        {/* Icon */}
        <div className={`inline-flex p-3 rounded-xl bg-white/20 backdrop-blur-sm mb-4`}>
          <Icon className={`h-8 w-8 ${color}`} strokeWidth={2.5} />
        </div>

        {/* Content */}
        <div className="space-y-3 relative z-10">
          <h3 className="text-2xl font-bold text-white">{title}</h3>

          <p className="text-white/90 text-base leading-relaxed">{description}</p>

          <div className="pt-2 flex items-center gap-2 text-sm flex-wrap">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium">
              {perfectFor}
            </span>
            {conversationCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-white/30 backdrop-blur-sm text-white font-medium">
                {conversationCount} {conversationCount === 1 ? 'konversation' : 'konversationer'}
              </span>
            )}
          </div>
        </div>

        {/* Arrow indicator */}
        <motion.div
          className="absolute bottom-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white group-hover:bg-white/30 transition-colors"
          whileHover={{ x: 4 }}
        >
          <ArrowRight className="h-5 w-5" />
        </motion.div>
      </div>
    </motion.div>
  );
}
