import { motion } from 'framer-motion';
import {
  MessageSquare,
  Brain,
  Map,
  Target,
  Trophy,
  Users,
  ChevronDown,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { ChatMode } from '../../types';

interface ChatModeSelectorProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

const chatModes: {
  mode: ChatMode;
  label: string;
  description: string;
  icon: typeof MessageSquare;
  color: string;
}[] = [
  {
    mode: 'free',
    label: 'Fråga vad du vill',
    description: 'Ställ fria frågor om materialet',
    icon: MessageSquare,
    color: 'text-blue-500',
  },
  {
    mode: 'socratic',
    label: 'Förhör mig',
    description: 'Sokratisk metod - lär dig genom att tänka själv',
    icon: Brain,
    color: 'text-purple-500',
  },
  {
    mode: 'adventure',
    label: 'Textäventyr',
    description: 'Upplev materialet genom en interaktiv berättelse',
    icon: Map,
    color: 'text-green-500',
  },
  {
    mode: 'active-learning',
    label: 'Lär mig aktivt',
    description: 'Kombinerar förklaring med praktiska uppgifter',
    icon: Target,
    color: 'text-orange-500',
  },
  {
    mode: 'quiz',
    label: 'Quiz-mästaren',
    description: 'Testa din kunskap med olika frågetyper',
    icon: Trophy,
    color: 'text-yellow-500',
  },
  {
    mode: 'discussion',
    label: 'Diskussionspartner',
    description: 'Utforska olika perspektiv och argument',
    icon: Users,
    color: 'text-pink-500',
  },
];

export function ChatModeSelector({
  currentMode,
  onModeChange,
  disabled = false,
}: ChatModeSelectorProps) {
  const currentModeInfo = chatModes.find((m) => m.mode === currentMode);
  const Icon = currentModeInfo?.icon || MessageSquare;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon className={`h-5 w-5 ${currentModeInfo?.color}`} />
          <span className="font-medium text-gray-900 dark:text-white">
            {currentModeInfo?.label}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </motion.button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[320px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2 animate-in fade-in-80"
          sideOffset={5}
        >
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
            Välj chattläge
          </div>
          {chatModes.map((modeInfo) => {
            const ModeIcon = modeInfo.icon;
            const isActive = modeInfo.mode === currentMode;

            return (
              <DropdownMenu.Item
                key={modeInfo.mode}
                onClick={() => onModeChange(modeInfo.mode)}
                className={`flex items-start gap-3 px-3 py-3 rounded-lg cursor-pointer outline-none transition-colors ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ModeIcon
                  className={`h-5 w-5 mt-0.5 flex-shrink-0 ${modeInfo.color}`}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-medium text-sm ${
                      isActive
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {modeInfo.label}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {modeInfo.description}
                  </div>
                </div>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
