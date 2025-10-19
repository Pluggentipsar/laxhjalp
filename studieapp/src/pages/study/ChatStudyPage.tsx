import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Brain,
  Map,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ChatModeSelector } from '../../components/chat/ChatModeSelector';
import { CollapsibleMaterialReference } from '../../components/chat/CollapsibleMaterialReference';
import { VoiceInput } from '../../components/chat/VoiceInput';
import { ExportChatButton } from '../../components/chat/ExportChatButton';
import { useAppStore } from '../../store/appStore';
import { sendChatMessage } from '../../services/aiService';
import type { ChatMessage, ChatMode } from '../../types';

const XP_PER_TURN = 15;

const WELCOME_MESSAGES: Record<ChatMode, string> = {
  free: 'Hej! Jag är här för att hjälpa dig förstå materialet. Ställ vilka frågor du vill!',
  socratic: 'Hej! Jag kommer att ställa frågor som får dig att tänka själv. Är du redo att börja utforska? 🧠',
  adventure: 'Välkommen till ditt äventyr! Jag kommer berätta en spännande historia baserad på materialet. Tryck på ett av valen för att fortsätta berättelsen! 🗺️',
  'active-learning': 'Hej! Vi kommer att lära tillsammans genom förklaringar och praktiska uppgifter. Redo att börja? 🎯',
  quiz: 'Hej! Jag är Quiz-mästaren och kommer att testa din kunskap med olika frågor. Jag lovar att förklara varje svar! 🏆',
  discussion: 'Hej! Låt oss diskutera materialet tillsammans. Jag kommer utmana dina tankar och presentera olika perspektiv. 💭',
};

export function ChatStudyPage() {
  const { materialId, mode: urlMode } = useParams<{ materialId: string; mode?: string }>();
  const materials = useAppStore((state) => state.materials);
  const user = useAppStore((state) => state.user);
  const loadMaterials = useAppStore((state) => state.loadMaterials);
  const setError = useAppStore((state) => state.setError);
  const loadChatSession = useAppStore((state) => state.loadChatSession);
  const appendChatMessage = useAppStore((state) => state.appendChatMessage);
  const updateChatMode = useAppStore((state) => state.updateChatMode);
  const chatSessions = useAppStore((state) => state.chatSessions);
  const startSession = useAppStore((state) => state.startSession);
  const endSession = useAppStore((state) => state.endSession);
  const currentSession = useAppStore((state) => state.currentSession);
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [sessionXp, setSessionXp] = useState(0);
  const [userTurns, setUserTurns] = useState(0);
  const [sources, setSources] = useState<Array<{ text: string; relevance?: string }>>([]);
  const [currentMode, setCurrentMode] = useState<ChatMode>((urlMode as ChatMode) || 'free');
  const [highlightedSource, setHighlightedSource] = useState<string>('');
  const [hasInitialized, setHasInitialized] = useState(false);

  const [messagesState, setMessagesState] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const updateMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setMessagesState((prev) => {
        const next =
          typeof updater === 'function' ? (updater as (p: ChatMessage[]) => ChatMessage[])(prev) : updater;
        messagesRef.current = next;
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (materials.length === 0) {
      loadMaterials();
    }
  }, [materials.length, loadMaterials]);

  useEffect(() => {
    if (!materialId) return;
    if (
      !currentSession ||
      currentSession.materialId !== materialId ||
      currentSession.mode !== 'chat'
    ) {
      startSession(materialId, 'chat');
    }
  }, [materialId, currentSession, startSession]);

  useEffect(() => {
    let isMounted = true;
    if (!materialId) {
      setIsHistoryLoading(false);
      return;
    }

    setIsHistoryLoading(true);
    loadChatSession(materialId)
      .then(async (session) => {
        if (session && isMounted) {
          updateMessages(session.messages ?? []);

          // If URL has a mode, update the session mode
          if (urlMode && session.mode !== urlMode) {
            await updateChatMode(materialId, urlMode as ChatMode);
          }

          setHasInitialized(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsHistoryLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [materialId, loadChatSession, updateMessages, urlMode, updateChatMode]);

  useEffect(() => {
    if (!materialId) return;
    const session = chatSessions[materialId];
    if (session) {
      if (session.messages !== messagesRef.current) {
        updateMessages(session.messages);
      }
      // Sync mode from session
      if (session.mode && session.mode !== currentMode) {
        setCurrentMode(session.mode);
      }
    }
  }, [chatSessions, materialId, updateMessages, currentMode]);

  // Send welcome message if session is empty
  useEffect(() => {
    if (!hasInitialized || !materialId || !material) return;

    const session = chatSessions[materialId];
    if (session && session.messages.length === 0 && currentMode) {
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: WELCOME_MESSAGES[currentMode],
        timestamp: new Date(),
      };

      appendChatMessage(materialId, welcomeMessage).catch((error) => {
        console.error('Failed to send welcome message:', error);
      });
    }
  }, [hasInitialized, materialId, material, chatSessions, currentMode, appendChatMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messagesState]);

  useEffect(() => {
    return () => {
      if (userTurns > 0 && materialId) {
        endSession(sessionXp, {
          messages: messagesRef.current.length,
          userTurns,
        }).catch(() => undefined);
      }
    };
  }, [endSession, materialId, sessionXp, userTurns]);

  const material = useMemo(
    () => materials.find((item) => item.id === materialId),
    [materials, materialId]
  );

  const handleModeChange = async (newMode: ChatMode) => {
    if (!materialId) return;
    setCurrentMode(newMode);
    await updateChatMode(materialId, newMode);
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
  };

  const handleSend = async () => {
    if (!materialId || !material || isSending) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setInput('');
    setSources([]);
    setIsSending(true);
    setUserTurns((prev) => prev + 1);

    updateMessages((prev) => [...prev, userMessage]);

    const conversationForAI = [...messagesRef.current];

    try {
      await appendChatMessage(materialId, userMessage);
    } catch (error) {
      console.error('Kunde inte spara användarmeddelande', error);
    }

    try {
      const response = await sendChatMessage(
        material.content,
        conversationForAI,
        userMessage.content,
        user?.grade ?? 5,
        currentMode
      );

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };

      updateMessages((prev) => [...prev, assistantMessage]);

      try {
        await appendChatMessage(materialId, assistantMessage);
      } catch (error) {
        console.error('Kunde inte spara AI-svar', error);
      }

      setSources(response.sources ?? []);
      // Sätt första källan som highlighted i material reference
      if (response.sources && response.sources.length > 0) {
        setHighlightedSource(response.sources[0].text);
      }
      if (!response.isFallback) {
        setSessionXp((prev) => prev + XP_PER_TURN);
      }
    } catch (error) {
      console.error('Chat error', error);
      const fallbackMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          'Jag kunde tyvärr inte svara just nu. Prova igen om en liten stund så försöker vi igen.',
        timestamp: new Date(),
      };

      updateMessages((prev) => [...prev, fallbackMessage]);
      setError('AI:n kunde inte svara just nu. Försök igen om en stund.');

      try {
        await appendChatMessage(materialId, fallbackMessage);
      } catch (persistError) {
        console.error('Kunde inte spara fallback-svar', persistError);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  if (!material) {
    return (
      <MainLayout title="Chattförhör">
        <div className="py-10 flex flex-col items-center text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vi kunde inte hitta det här materialet.
          </p>
          <Button onClick={() => navigate('/study')}>Tillbaka</Button>
        </div>
      </MainLayout>
    );
  }

  // Get mode info for display
  const getModeInfo = () => {
    const modes = [
      { mode: 'free', icon: MessageSquare, label: 'Fråga vad du vill' },
      { mode: 'socratic', icon: Brain, label: 'Förhör mig' },
      { mode: 'adventure', icon: Map, label: 'Textäventyr' },
      { mode: 'active-learning', icon: Target, label: 'Lär mig aktivt' },
      { mode: 'quiz', icon: Trophy, label: 'Quiz-mästaren' },
      { mode: 'discussion', icon: Users, label: 'Diskussionspartner' },
    ];
    return modes.find((m) => m.mode === currentMode) || modes[0];
  };

  const currentModeInfo = getModeInfo();
  const ModeIcon = currentModeInfo.icon;

  return (
    <MainLayout title="Chattförhör" showBottomNav={false}>
      <div className="py-6 space-y-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {material.title}
            </h2>
            {/* Small mode badge with selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs">
                <ModeIcon className="h-3.5 w-3.5 text-primary-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {currentModeInfo.label}
                </span>
              </div>
              <ChatModeSelector
                currentMode={currentMode}
                onModeChange={handleModeChange}
                disabled={isSending}
              />
            </div>
          </div>
        </section>

        <Card className="p-5 h-[60vh] flex flex-col gap-4">
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2">
            {isHistoryLoading && (
              <div className="text-sm text-gray-500">
                Hämtar tidigare konversation...
              </div>
            )}

            {!isHistoryLoading && messagesState.length === 0 && (
              <div className="text-sm text-gray-500">
                <p>
                  Tips: be AI:n förklara ett begrepp, skapa en minnesregel eller
                  låtsas vara din lärare och ställ följdfrågor.
                </p>
              </div>
            )}

            {messagesState.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs sm:max-w-md px-4 py-3 rounded-2xl text-sm shadow-sm ${
                    message.role === 'user'
                      ? 'bg-primary-500 text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none'
                  }`}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs text-gray-500">
                  AI skriver...
                </div>
              </div>
            )}
          </div>

          <div className="flex items-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-end gap-2 flex-1">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending || isHistoryLoading}
                placeholder="Ställ en fråga eller be om ett förhör..."
                className="flex-1 h-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
              />
              <VoiceInput
                onTranscript={handleVoiceTranscript}
                disabled={isSending || isHistoryLoading}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isSending || isHistoryLoading}
              isLoading={isSending}
            >
              Skicka
            </Button>
          </div>
        </Card>

        {/* Material reference - kollapsbar */}
        <CollapsibleMaterialReference
          title={material.title}
          content={material.content}
          highlightedText={highlightedSource}
        />

        {sources.length > 0 && (
          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Hämtat från materialet
            </h3>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              {sources.map((source, index) => (
                <li
                  key={`${source.text}-${index}`}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700"
                >
                  {source.text}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="flex justify-between items-center flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate('/study')}>
            Tillbaka till studieöversikten
          </Button>
          <div className="flex items-center gap-3">
            <ExportChatButton
              messages={messagesState}
              materialTitle={material.title}
              disabled={messagesState.length === 0}
            />
            {userTurns > 0 && (
              <span className="text-xs text-gray-500">
                {userTurns} frågor · {sessionXp} XP insamlat
              </span>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
