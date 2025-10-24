import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calculator,
  BookOpen,
  Globe,
  Map,
  Atom,
  Palette,
  ArrowLeft,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { AgeGroupSelector } from '../../components/subjects/AgeGroupSelector';
import { RecommendedActivitiesView } from '../../components/subjects/RecommendedActivitiesView';
import { AllActivitiesView } from '../../components/subjects/AllActivitiesView';
import { SUBJECT_HUBS, getAgeGroupFromGrade } from '../../data/subjectHubs';
import { useAppStore } from '../../store/appStore';
import type { AgeGroup } from '../../types';

const ICON_MAP: Record<string, LucideIcon> = {
  Calculator,
  BookOpen,
  Globe,
  Map,
  Atom,
  Palette,
};

export function SubjectHubPage() {
  const { subjectHub } = useParams<{ subjectHub: string }>();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);

  // Find the hub
  const hub = SUBJECT_HUBS.find((h) => h.id === subjectHub);

  // Get user's age group
  const userAgeGroup = user ? (getAgeGroupFromGrade(user.grade) as AgeGroup) : '4-6';
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup>(userAgeGroup);

  // View mode: 'recommended' or 'all'
  const [viewMode, setViewMode] = useState<'recommended' | 'all'>('recommended');

  // Get all activities for selected age group (flattened from all categories)
  const filteredActivities = useMemo(() => {
    if (!hub) return [];

    const allActivities = hub.categories.flatMap((category) =>
      category.activities.filter((activity) =>
        activity.ageGroups.includes(selectedAgeGroup)
      )
    );

    return allActivities;
  }, [hub, selectedAgeGroup]);

  if (!hub) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-gray-600 dark:text-gray-400">Ämne hittades inte.</p>
        </div>
      </MainLayout>
    );
  }

  const Icon = ICON_MAP[hub.icon] || BookOpen;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/subjects')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Tillbaka till ämnen</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`p-4 rounded-xl bg-gradient-to-br ${hub.gradient} shadow-lg`}
            >
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {hub.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {hub.description}
              </p>
            </div>
          </div>

          {/* Age group selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>Välj årskurs för att se anpassade aktiviteter</span>
            </div>
            <AgeGroupSelector
              selectedAgeGroup={selectedAgeGroup}
              onSelect={setSelectedAgeGroup}
              userAgeGroup={userAgeGroup}
            />
          </div>
        </motion.div>

        {/* Activities View */}
        {filteredActivities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-600 dark:text-gray-400">
              Inga aktiviteter tillgängliga för denna årskurs än.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Försök välja en annan årskurs eller kom tillbaka senare!
            </p>
          </motion.div>
        ) : viewMode === 'recommended' ? (
          <RecommendedActivitiesView
            subjectHub={hub.id}
            ageGroup={selectedAgeGroup}
            activities={filteredActivities}
            onShowAll={() => setViewMode('all')}
          />
        ) : (
          <AllActivitiesView
            subjectHub={hub.id}
            ageGroup={selectedAgeGroup}
            activities={filteredActivities}
            onBack={() => setViewMode('recommended')}
          />
        )}
      </div>
    </MainLayout>
  );
}
