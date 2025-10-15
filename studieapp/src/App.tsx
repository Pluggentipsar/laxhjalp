import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/appStore';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { HomePage } from './pages/HomePage';
import { MaterialPage } from './pages/MaterialPage';
import { ProfilePage } from './pages/ProfilePage';

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
        <Route path="/material" element={<MaterialPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Placeholder routes - kommer byggas senare */}
        <Route path="/study" element={<Navigate to="/" replace />} />
        <Route path="/study/flashcards" element={<Navigate to="/" replace />} />
        <Route path="/study/quiz" element={<Navigate to="/" replace />} />
        <Route path="/study/chat" element={<Navigate to="/" replace />} />
        <Route path="/games" element={<Navigate to="/" replace />} />
        <Route path="/import/*" element={<Navigate to="/material" replace />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
