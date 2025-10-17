import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange, getUserProfile, logOut } from '../services/authService';
import type { UserProfile } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserProfile = async () => {
    if (currentUser) {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    console.log('[AuthContext] Setting up auth state listener');
    const unsubscribe = onAuthStateChange(async (user) => {
      console.log('[AuthContext] Auth state changed:', user ? `User: ${user.email}` : 'No user');
      setCurrentUser(user);

      if (user) {
        // Fetch user profile from Firestore with retry logic
        console.log('[AuthContext] Fetching user profile for:', user.uid);
        let profile = await getUserProfile(user.uid);

        // If profile doesn't exist, retry a few times (for new signups)
        if (!profile) {
          console.log('[AuthContext] Profile not found, retrying...');
          for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
            profile = await getUserProfile(user.uid);
            if (profile) {
              console.log('[AuthContext] Profile found on retry', i + 1);
              break;
            }
          }
        }

        console.log('[AuthContext] User profile loaded:', profile);
        setUserProfile(profile);
      } else {
        console.log('[AuthContext] No user, clearing profile');
        setUserProfile(null);
      }

      console.log('[AuthContext] Setting loading to false');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOutUser = async () => {
    await logOut();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signOut: signOutUser,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
