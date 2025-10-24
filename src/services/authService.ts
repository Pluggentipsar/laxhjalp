import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import type { UserProfile, Grade } from '../types';

// Helper to convert Firebase User to our UserProfile
const createUserProfile = async (
  firebaseUser: FirebaseUser,
  additionalData?: Partial<UserProfile>
): Promise<UserProfile> => {
  const userProfile: UserProfile = {
    id: firebaseUser.uid,
    name: additionalData?.name || firebaseUser.displayName || 'Användare',
    email: firebaseUser.email || undefined,
    photoURL: firebaseUser.photoURL || undefined,
    grade: additionalData?.grade || 7,
    subjects: additionalData?.subjects || [],
    interests: additionalData?.interests || [],
    createdAt: new Date(),
    dailyGoalMinutes: 15,
    weeklyGoalDays: 5,
    totalXp: 0,
    level: 1,
    streak: 0,
    longestStreak: 0,
    streakFreezeAvailable: false,
    badges: [],
    settings: {
      textSize: 'medium',
      dyslexiaFriendly: false,
      highContrast: false,
      ttsEnabled: false,
      ttsSpeed: 1.0,
      theme: 'auto',
      reduceAnimations: false,
      emojiSupport: true,
      remindersEnabled: true,
      reminderDays: [1, 2, 3, 4, 5], // Måndag-Fredag
      cloudBackupEnabled: true,
    },
  };

  return userProfile;
};

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string,
  grade: Grade
): Promise<UserProfile> => {
  try {
    console.log('[authService] Starting email signup for:', email);
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    console.log('[authService] Firebase auth user created:', user.uid);

    // Update display name
    await updateProfile(user, { displayName: name });
    console.log('[authService] Display name updated to:', name);

    // Create user profile
    const userProfile = await createUserProfile(user, { name, grade });
    console.log('[authService] User profile object created:', userProfile);

    // Save to Firestore (remove undefined fields)
    const profileData: any = {
      id: userProfile.id,
      name: userProfile.name,
      grade: userProfile.grade,
      subjects: userProfile.subjects,
      interests: userProfile.interests,
      createdAt: userProfile.createdAt.toISOString(),
      dailyGoalMinutes: userProfile.dailyGoalMinutes,
      weeklyGoalDays: userProfile.weeklyGoalDays,
      totalXp: userProfile.totalXp,
      level: userProfile.level,
      streak: userProfile.streak,
      longestStreak: userProfile.longestStreak,
      streakFreezeAvailable: userProfile.streakFreezeAvailable,
      badges: userProfile.badges,
      settings: userProfile.settings,
    };

    // Only add optional fields if they exist
    if (userProfile.email) profileData.email = userProfile.email;
    if (userProfile.photoURL) profileData.photoURL = userProfile.photoURL;
    if (userProfile.avatar) profileData.avatar = userProfile.avatar;
    if (userProfile.lastStudyDate) profileData.lastStudyDate = userProfile.lastStudyDate.toISOString();

    console.log('[authService] Saving profile to Firestore:', profileData);
    await setDoc(doc(db, 'users', user.uid), profileData);
    console.log('[authService] Profile saved successfully to Firestore');

    return userProfile;
  } catch (error: any) {
    console.error('[authService] Error signing up:', error);
    throw new Error(error.message || 'Failed to create account');
  }
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserProfile> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Fetch user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const data = userDoc.data();
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      lastStudyDate: data.lastStudyDate ? new Date(data.lastStudyDate) : undefined,
    } as UserProfile;
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserProfile> => {
  try {
    console.log('[authService] Starting Google sign in with popup');
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log('[authService] Google popup completed, user:', user.email, user.uid);

    // Check if user exists in Firestore
    console.log('[authService] Checking if user exists in Firestore');
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (userDoc.exists()) {
      // Existing user - return profile
      console.log('[authService] Existing user found, returning profile');
      const data = userDoc.data();
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        lastStudyDate: data.lastStudyDate ? new Date(data.lastStudyDate) : undefined,
      } as UserProfile;
    } else {
      // New user - create profile
      console.log('[authService] New user, creating profile');
      const userProfile = await createUserProfile(user);
      console.log('[authService] User profile created:', userProfile);

      // Save to Firestore (remove undefined fields)
      const profileData: any = {
        id: userProfile.id,
        name: userProfile.name,
        grade: userProfile.grade,
        subjects: userProfile.subjects,
        interests: userProfile.interests,
        createdAt: userProfile.createdAt.toISOString(),
        dailyGoalMinutes: userProfile.dailyGoalMinutes,
        weeklyGoalDays: userProfile.weeklyGoalDays,
        totalXp: userProfile.totalXp,
        level: userProfile.level,
        streak: userProfile.streak,
        longestStreak: userProfile.longestStreak,
        streakFreezeAvailable: userProfile.streakFreezeAvailable,
        badges: userProfile.badges,
        settings: userProfile.settings,
      };

      // Only add optional fields if they exist
      if (userProfile.email) profileData.email = userProfile.email;
      if (userProfile.photoURL) profileData.photoURL = userProfile.photoURL;
      if (userProfile.avatar) profileData.avatar = userProfile.avatar;
      if (userProfile.lastStudyDate) profileData.lastStudyDate = userProfile.lastStudyDate.toISOString();

      console.log('[authService] Saving profile to Firestore:', profileData);
      await setDoc(doc(db, 'users', user.uid), profileData);
      console.log('[authService] Profile saved successfully');

      return userProfile;
    }
  } catch (error: any) {
    console.error('[authService] Error signing in with Google:', error);
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

// Sign out
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log('[authService] getUserProfile called for:', userId);
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      console.log('[authService] getUserProfile: Document does not exist for', userId);
      return null;
    }

    const data = userDoc.data();
    console.log('[authService] getUserProfile: Found profile data:', data);
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      lastStudyDate: data.lastStudyDate ? new Date(data.lastStudyDate) : undefined,
    } as UserProfile;
  } catch (error: any) {
    console.error('[authService] Error getting profile:', error);
    return null;
  }
};

// Auth state observer
export const onAuthStateChange = (
  callback: (user: FirebaseUser | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};
