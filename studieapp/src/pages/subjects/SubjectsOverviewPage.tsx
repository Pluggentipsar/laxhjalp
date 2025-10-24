import { motion } from 'framer-motion';
import { GraduationCap, Sparkles } from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { SubjectHubCard } from '../../components/subjects/SubjectHubCard';
import { SUBJECT_HUBS } from '../../data/subjectHubs';
import { useAppStore } from '../../store/appStore';

export function SubjectsOverviewPage() {
  const user = useAppStore((state) => state.user);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Ämnen
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Utforska och lär dig på ditt sätt
              </p>
            </div>
          </div>

          {/* User info */}
          {user && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>
                Du är i årskurs <span className="font-semibold text-gray-900 dark:text-white">{user.grade}</span>
                {' '}och har därför automatiskt aktiviteter anpassade för dig
              </span>
            </div>
          )}
        </motion.div>

        {/* Subject Hubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SUBJECT_HUBS.map((hub, index) => (
            <SubjectHubCard key={hub.id} hub={hub} index={index} />
          ))}
        </div>

        {/* Info box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800"
        >
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            Hur fungerar ämneshubbarna?
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>
                Varje ämne innehåller kategorier med olika typer av aktiviteter
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>
                Aktiviteterna är anpassade efter din årskurs, men du kan utforska alla nivåer
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pink-500 mt-0.5">•</span>
              <span>
                Du tjänar XP och utvecklar din kunskap genom att genomföra aktiviteter
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500 mt-0.5">•</span>
              <span>
                Vissa aktiviteter använder dina egna studiematerial, andra är fristående
              </span>
            </li>
          </ul>
        </motion.div>
      </div>
    </MainLayout>
  );
}
