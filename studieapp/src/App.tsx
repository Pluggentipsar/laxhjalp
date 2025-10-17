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
import { ChatStudyPage } from './pages/study/ChatStudyPage';
import { ConceptExplorerPage } from './pages/study/ConceptExplorerPage';
import { SnakeGamePage } from './pages/study/SnakeGamePage';

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
        element={<ChatStudyPage />}
      />
      <Route
        path="/study/concepts/:materialId"
        element={<ConceptExplorerPage />}
      />
      <Route
        path="/study/material/:materialId/game/snake"
        element={<SnakeGamePage />}
      />
      <Route path="/games" element={<Navigate to="/" replace />} />
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
