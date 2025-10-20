import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Brain,
  Map,
  Target,
  Trophy,
  Users,
  ArrowLeft,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { ModeCard } from '../../components/chat/ModeCard';
import { Button } from '../../components/common/Button';
import { useAppStore } from '../../store/appStore';
import type { ChatMode } from '../../types';

const chatModes = [
  {
    mode: 'free' as ChatMode,
    title: 'Fråga vad du vill',
    description: 'Ställ vilka frågor som helst - jag svarar på allt om materialet!',
    perfectFor: 'Snabba förklaringar',
    icon: MessageSquare,
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    mode: 'socratic' as ChatMode,
    title: 'Förhör mig',
    description: 'Jag ställer smarta frågor som får dig att tänka själv!',
    perfectFor: 'Fördjupad förståelse',
    icon: Brain,
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    mode: 'adventure' as ChatMode,
    title: 'Textäventyr',
    description: 'Upplev en spännande historia där DU är hjälten - och lär dig samtidigt!',
    perfectFor: 'Kreativ inlärning',
    icon: Map,
    color: 'text-green-500',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    mode: 'active-learning' as ChatMode,
    title: 'Lär mig aktivt',
    description: 'Jag förklarar OCH ger dig uppgifter att lösa direkt!',
    perfectFor: 'Hands-on träning',
    icon: Target,
    color: 'text-orange-500',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    mode: 'quiz' as ChatMode,
    title: 'Quiz-mästaren',
    description: 'Testa din kunskap med roliga frågor och få direktfeedback!',
    perfectFor: 'Inför prov',
    icon: Trophy,
    color: 'text-yellow-500',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    mode: 'discussion' as ChatMode,
    title: 'Diskussionspartner',
    description: 'Utmana dina tankar! Jag presenterar olika perspektiv och vinklar.',
    perfectFor: 'Kritiskt tänkande',
    icon: Users,
    color: 'text-pink-500',
    gradient: 'from-pink-500 to-rose-500',
  },
];

export function ChatModeHub() {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  const materials = useAppStore((state) => state.materials);
  const loadMaterials = useAppStore((state) => state.loadMaterials);
  const chatSessions = useAppStore((state) => state.chatSessions);

  useEffect(() => {
    if (materials.length === 0) {
      loadMaterials();
    }
  }, [materials.length, loadMaterials]);

  const material = useMemo(
    () => materials.find((item) => item.id === materialId),
    [materials, materialId]
  );

  const handleSelectMode = (mode: ChatMode) => {
    navigate(`/study/material/${materialId}/chat/${mode}`);
  };

  if (!material) {
    return (
      <MainLayout title="Välj chattläge">
        <div className="py-10 flex flex-col items-center text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vi kunde inte hitta det här materialet.
          </p>
          <Button onClick={() => navigate('/study')}>Tillbaka</Button>
        </div>
      </MainLayout>
    );
  }

  // Helper to check if a mode has a session with messages
  const hasSessionForMode = (mode: ChatMode): boolean => {
    if (!materialId) return false;
    const sessionKey = `${materialId}-${mode}`;
    const session = chatSessions[sessionKey];
    return session ? session.messages.length > 0 : false;
  };

  // Find any mode with an existing session to show banner
  const existingSessionMode = chatModes.find((m) => hasSessionForMode(m.mode));

  return (
    <MainLayout title="Välj ditt äventyr" showBottomNav={false}>
      <div className="py-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(`/study/material/${materialId}`)}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tillbaka till material
          </Button>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {material.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Välj hur du vill utforska materialet
            </p>
          </div>
        </motion.div>

        {/* Continue existing session banner */}
        {existingSessionMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">Fortsätt där du slutade</h3>
                <p className="text-white/90">
                  Du har en pågående session med{' '}
                  {existingSessionMode.title}
                </p>
              </div>
              <Button
                onClick={() =>
                  navigate(`/study/material/${materialId}/chat/${existingSessionMode.mode}`)
                }
                className="bg-white text-primary-600 hover:bg-gray-100"
              >
                Fortsätt
              </Button>
            </div>
          </motion.div>
        )}

        {/* Mode cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {chatModes.map((modeInfo, index) => (
            <motion.div
              key={modeInfo.mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ModeCard
                {...modeInfo}
                onSelect={handleSelectMode}
                hasContinueSession={hasSessionForMode(modeInfo.mode)}
              />
            </motion.div>
          ))}
        </div>

        {/* Footer tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4"
        >
          💡 Tips: Du kan byta chattläge när som helst under en session!
        </motion.div>
      </div>
    </MainLayout>
  );
}
