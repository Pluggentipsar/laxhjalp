import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Construction, Sparkles } from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';

export function ActivityPlaceholderPage() {
  const navigate = useNavigate();
  const { subjectHub, activityId } = useParams<{
    subjectHub: string;
    activityId: string;
  }>();

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(`/subjects/${subjectHub}`)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Tillbaka</span>
        </motion.button>

        {/* Coming Soon Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
              <Construction className="w-16 h-16 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Under utveckling
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Denna aktivitet är under konstruktion och kommer snart att vara tillgänglig.
          </p>

          {/* Info Box */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 mb-8">
            <div className="flex items-center gap-2 justify-center mb-3">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">
                Vad händer nu?
              </h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Vi arbetar hårt på att skapa engagerande och pedagogiska aktiviteter för alla ämnen.
              Återkom snart för att se vad som är nytt!
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate(`/subjects/${subjectHub}`)}
              variant="primary"
            >
              Tillbaka till {subjectHub === 'matematik' ? 'Matematik' : 'ämne'}
            </Button>
            <Button onClick={() => navigate('/subjects')} variant="secondary">
              Utforska andra ämnen
            </Button>
          </div>

          {/* Debug info (remove in production) */}
          <div className="mt-8 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-left">
            <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
              Debug: {subjectHub} / {activityId}
            </p>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
