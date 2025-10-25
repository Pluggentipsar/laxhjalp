import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useAppStore } from './store/appStore';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { StudyDashboardPage } from './pages/StudyDashboardPage';
import { MaterialDetailPage } from './pages/MaterialDetailPage';
import { FlashcardStudyPage } from './pages/study/FlashcardStudyPage';
import { QuizStudyPage } from './pages/study/QuizStudyPage';
import { ChatModeHub } from './pages/study/ChatModeHub';
import { ChatStudyPage } from './pages/study/ChatStudyPage';
import { ConceptExplorerPage } from './pages/study/ConceptExplorerPage';
import { CrosswordPage } from './pages/study/CrosswordPage';
import { SnakeGamePage } from './pages/study/SnakeGamePage';
import { WhackATermPage } from './pages/study/WhackATermPage';
import { GamesHubPage } from './pages/GamesHubPage';
import { SubjectsOverviewPage } from './pages/subjects/SubjectsOverviewPage';
import { SubjectHubPage } from './pages/subjects/SubjectHubPage';
import { ActivityPlaceholderPage } from './pages/subjects/ActivityPlaceholderPage';
import { AdditionSubtractionActivity } from './pages/subjects/activities/AdditionSubtractionActivity';
import { ReviewMistakesActivity } from './pages/subjects/activities/ReviewMistakesActivity';
import { ArithmeticActivity } from './pages/subjects/activities/ArithmeticActivity';

function AppContent() {
  const { userProfile } = useAuth();
  const user = useAppStore((state) => state.user);
  const onboarding = useAppStore((state) => state.onboarding);
  const loadMaterials = useAppStore((state) => state.loadMaterials);

  useEffect(() => {
    // Sync Firebase user with local store
    if (userProfile) {
      console.log('[App] Syncing Firebase user to local store:', userProfile);

      // Spara till både appStore och IndexedDB
      useAppStore.setState({ user: userProfile });

      // Spara till IndexedDB så den finns tillgänglig offline
      import('./lib/db').then(({ db }) => {
        db.userProfile.put(userProfile).catch(err => {
          console.error('[App] Failed to save user profile to IndexedDB:', err);
        });
      });

      // Uppdatera onboarding-status baserat på user profile
      // Om användaren har subjects betyder det att onboarding är klar
      if (userProfile.subjects && userProfile.subjects.length > 0) {
        console.log('[App] User has completed onboarding (has subjects)');
        useAppStore.setState({
          onboarding: {
            completed: true,
            currentStep: 0,
            selectedGrade: userProfile.grade,
            selectedSubjects: userProfile.subjects,
            dailyGoal: userProfile.dailyGoalMinutes,
            weeklyGoal: userProfile.weeklyGoalDays,
          },
        });
      }

      // Vänta en frame innan vi laddar materials för att säkerställa att state är uppdaterad
      requestAnimationFrame(() => {
        console.log('[App] Now loading materials after state sync');
        loadMaterials();
      });
    }
  }, [userProfile, loadMaterials]);

  console.log('[App] Rendering with state:', {
    hasUserProfile: !!userProfile,
    hasLocalUser: !!user,
    onboardingCompleted: onboarding.completed
  });

  // No user logged in - show auth
  if (!userProfile) {
    console.log('[App] No userProfile - showing auth routes');
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // User logged in but needs onboarding
  if (!user || !onboarding.completed) {
    console.log('[App] User needs onboarding - showing OnboardingFlow');
    return <OnboardingFlow />;
  }

  console.log('[App] User authenticated and onboarded - showing main app');

  // User logged in and onboarded
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/study" element={<StudyDashboardPage />} />
      <Route path="/study/material/:materialId" element={<MaterialDetailPage />} />
      <Route
        path="/study/flashcards/:materialId"
        element={<FlashcardStudyPage />}
      />
      <Route
        path="/study/quiz/:materialId"
        element={<QuizStudyPage />}
      />
      <Route
        path="/study/material/:materialId/chat"
        element={<ChatModeHub />}
      />
      <Route
        path="/study/material/:materialId/chat/:mode"
        element={<ChatStudyPage />}
      />
      <Route
        path="/study/concepts/:materialId"
        element={<ConceptExplorerPage />}
      />
      <Route
        path="/study/material/:materialId/crossword"
        element={<CrosswordPage />}
      />
      <Route
        path="/study/material/:materialId/game/snake"
        element={<SnakeGamePage />}
      />
      <Route path="/games/snake" element={<SnakeGamePage />} />
      <Route path="/games/whack" element={<WhackATermPage />} />
      <Route
        path="/study/material/:materialId/game/whack"
        element={<WhackATermPage />}
      />
      <Route path="/games" element={<GamesHubPage />} />
      <Route path="/subjects" element={<SubjectsOverviewPage />} />
      <Route path="/subjects/:subjectHub" element={<SubjectHubPage />} />

      {/* Arithmetic activities - all use the same component with different concept areas */}
      <Route path="/subjects/matematik/addition-1-5" element={<ArithmeticActivity />} />
      <Route path="/subjects/matematik/addition-1-10" element={<ArithmeticActivity />} />
      <Route path="/subjects/matematik/addition-11-20" element={<ArithmeticActivity />} />
      <Route path="/subjects/matematik/addition-dubbletter" element={<ArithmeticActivity />} />
      <Route path="/subjects/matematik/addition-tiotalsovergaing" element={<ArithmeticActivity />} />
      <Route path="/subjects/matematik/subtraktion-1-5" element={<ArithmeticActivity />} />
      <Route path="/subjects/matematik/subtraktion-1-10" element={<ArithmeticActivity />} />
      <Route path="/subjects/matematik/subtraktion-11-20" element={<ArithmeticActivity />} />
      <Route path="/subjects/matematik/blandade-operationer" element={<ArithmeticActivity />} />

      {/* Legacy route - keeping for backwards compatibility */}
      <Route path="/subjects/matematik/addition-subtraktion-1-3" element={<AdditionSubtractionActivity />} />

      {/* Mistake review */}
      <Route path="/subjects/matematik/repetera-misstag-1-3" element={<ReviewMistakesActivity />} />

      {/* Catch-all for future activities */}
      <Route path="/subjects/:subjectHub/:activityId" element={<ActivityPlaceholderPage />} />
      <Route path="/material" element={<Navigate to="/study" replace />} />
      <Route path="/import/*" element={<Navigate to="/study" replace />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
