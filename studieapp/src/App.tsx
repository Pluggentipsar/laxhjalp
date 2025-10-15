import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/appStore';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { StudyDashboardPage } from './pages/StudyDashboardPage';
import { MaterialDetailPage } from './pages/MaterialDetailPage';
import { FlashcardStudyPage } from './pages/study/FlashcardStudyPage';
import { QuizStudyPage } from './pages/study/QuizStudyPage';
import { ChatStudyPage } from './pages/study/ChatStudyPage';
import { ConceptExplorerPage } from './pages/study/ConceptExplorerPage';
import { SnakeGamePage } from './pages/study/SnakeGamePage';

function App() {
  const user = useAppStore((state) => state.user);
  const onboarding = useAppStore((state) => state.onboarding);
  const loadMaterials = useAppStore((state) => state.loadMaterials);

  useEffect(() => {
    // Load user profile and materials on mount
    const initApp = async () => {
      const { dbHelpers } = await import('./lib/db');
      const profile = await dbHelpers.getUserProfile();

      if (profile) {
        useAppStore.setState({ user: profile });
        loadMaterials();
      }
    };

    initApp();
  }, []);

  // Show onboarding if not completed
  if (!user || !onboarding.completed) {
    return (
      <BrowserRouter>
        <OnboardingFlow />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
