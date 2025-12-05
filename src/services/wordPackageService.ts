import type { WordPackage, WordPair, GameSession, HighScore, WordSeparator } from '../types/motion-learn';

const STORAGE_KEYS = {
  PACKAGES: 'motion-learn-packages',
  SESSIONS: 'motion-learn-sessions',
  HIGHSCORES: 'motion-learn-highscores',
};

// ========== Word Packages ==========

export function getAllPackages(): WordPackage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PACKAGES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading packages:', error);
    return [];
  }
}

export function getPackageById(id: string): WordPackage | null {
  const packages = getAllPackages();
  return packages.find(pkg => pkg.id === id) || null;
}

export function createPackage(name: string, words: WordPair[]): WordPackage {
  const packages = getAllPackages();

  const newPackage: WordPackage = {
    id: generateId(),
    name,
    words,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  packages.push(newPackage);
  localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));

  return newPackage;
}

export function updatePackage(id: string, updates: Partial<Pick<WordPackage, 'name' | 'words'>>): WordPackage | null {
  const packages = getAllPackages();
  const index = packages.findIndex(pkg => pkg.id === id);

  if (index === -1) return null;

  packages[index] = {
    ...packages[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
  return packages[index];
}

export function deletePackage(id: string): boolean {
  const packages = getAllPackages();
  const filtered = packages.filter(pkg => pkg.id !== id);

  if (filtered.length === packages.length) return false;

  localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(filtered));
  return true;
}

// ========== Word Pair Utilities ==========

export function addWordToPackage(packageId: string, term: string, definition: string): WordPackage | null {
  const pkg = getPackageById(packageId);
  if (!pkg) return null;

  const newWord: WordPair = {
    id: generateId(),
    term,
    definition,
  };

  return updatePackage(packageId, {
    words: [...pkg.words, newWord],
  });
}

export function removeWordFromPackage(packageId: string, wordId: string): WordPackage | null {
  const pkg = getPackageById(packageId);
  if (!pkg) return null;

  return updatePackage(packageId, {
    words: pkg.words.filter(word => word.id !== wordId),
  });
}

export function updateWordInPackage(
  packageId: string,
  wordId: string,
  updates: Partial<Pick<WordPair, 'term' | 'definition'>>
): WordPackage | null {
  const pkg = getPackageById(packageId);
  if (!pkg) return null;

  const updatedWords = pkg.words.map(word =>
    word.id === wordId ? { ...word, ...updates } : word
  );

  return updatePackage(packageId, { words: updatedWords });
}

// ========== Bulk Import ==========

export function parseBulkImport(text: string, separator: WordSeparator): WordPair[] {
  const lines = text.trim().split('\n');
  const words: WordPair[] = [];

  const getSeparatorRegex = (sep: WordSeparator): RegExp => {
    switch (sep) {
      case 'comma': return /,/;
      case 'colon': return /:/;
      case 'dash': return /-/;
      case 'tab': return /\t/;
      case 'newline': return /\n/;
      default: return /,/;
    }
  };

  const regex = getSeparatorRegex(separator);

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const parts = trimmedLine.split(regex).map(part => part.trim());

    if (parts.length >= 2) {
      words.push({
        id: generateId(),
        term: parts[0],
        definition: parts[1],
      });
    }
  }

  return words;
}

export function importBulkWords(packageName: string, text: string, separator: WordSeparator): WordPackage {
  const words = parseBulkImport(text, separator);
  return createPackage(packageName, words);
}

// ========== Game Sessions ==========

export function saveGameSession(session: Omit<GameSession, 'id' | 'completedAt'>): GameSession {
  const sessions = getAllSessions();

  const newSession: GameSession = {
    ...session,
    id: generateId(),
    completedAt: new Date().toISOString(),
  };

  sessions.push(newSession);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

  // Update high score if applicable
  updateHighScore(newSession);

  return newSession;
}

export function getAllSessions(): GameSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading sessions:', error);
    return [];
  }
}

export function getSessionsByPackage(packageId: string): GameSession[] {
  return getAllSessions().filter(session => session.packageId === packageId);
}

export function getSessionsByGameType(gameType: GameSession['gameType']): GameSession[] {
  return getAllSessions().filter(session => session.gameType === gameType);
}

// ========== High Scores ==========

function updateHighScore(session: GameSession): void {
  const highscores = getAllHighScores();

  // Find existing high score for this game type and package
  const existingIndex = highscores.findIndex(
    hs => hs.gameType === session.gameType && hs.packageId === session.packageId
  );

  const newHighScore: HighScore = {
    id: generateId(),
    gameType: session.gameType,
    packageId: session.packageId,
    packageName: session.packageName,
    score: session.score,
    date: session.completedAt || new Date().toISOString(),
  };

  // Update if score is higher or create new
  if (existingIndex !== -1) {
    if (session.score > highscores[existingIndex].score) {
      highscores[existingIndex] = newHighScore;
    }
  } else {
    highscores.push(newHighScore);
  }

  localStorage.setItem(STORAGE_KEYS.HIGHSCORES, JSON.stringify(highscores));
}

export function getAllHighScores(): HighScore[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HIGHSCORES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading high scores:', error);
    return [];
  }
}

export function getHighScoreForPackage(gameType: GameSession['gameType'], packageId: string): HighScore | null {
  const highscores = getAllHighScores();
  return highscores.find(hs => hs.gameType === gameType && hs.packageId === packageId) || null;
}

export function getTopHighScores(gameType: GameSession['gameType'], limit: number = 10): HighScore[] {
  const highscores = getAllHighScores()
    .filter(hs => hs.gameType === gameType)
    .sort((a, b) => b.score - a.score);

  return highscores.slice(0, limit);
}

// ========== Utilities ==========

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ========== Data Management ==========

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.PACKAGES);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.HIGHSCORES);
}

export function exportData(): string {
  return JSON.stringify({
    packages: getAllPackages(),
    sessions: getAllSessions(),
    highscores: getAllHighScores(),
  }, null, 2);
}

export function importData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);

    if (data.packages) {
      localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(data.packages));
    }
    if (data.sessions) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions));
    }
    if (data.highscores) {
      localStorage.setItem(STORAGE_KEYS.HIGHSCORES, JSON.stringify(data.highscores));
    }

    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}
// ========== Cloud Sharing (Firebase) ==========

import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function savePackageToCloud(pkg: WordPackage): Promise<string | null> {
  try {
    // Generate a 6-character share code
    const shareCode = generateShareCode();

    // Check if code exists (simple check, could be improved with retry loop)
    const docRef = doc(db, 'word_packages', shareCode);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Collision! Try one more time
      const retryCode = generateShareCode();
      const retryRef = doc(db, 'word_packages', retryCode);
      await setDoc(retryRef, { ...pkg, shareCode: retryCode, sharedAt: new Date().toISOString() });
      return retryCode;
    }

    await setDoc(docRef, { ...pkg, shareCode, sharedAt: new Date().toISOString() });
    console.log("Package saved with code:", shareCode);
    return shareCode;
  } catch (error: any) {
    console.error('Error sharing package:', error);
    // Throwing error to be caught by UI
    throw new Error(error.message || "Unknown Firebase error");
  }
}

export async function getPackageFromCloud(shareCode: string): Promise<WordPackage | null> {
  try {
    const docRef = doc(db, 'word_packages', shareCode.toUpperCase());
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as WordPackage;
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching package:', error);
    return null;
  }
}

export async function importPackageFromCloud(shareCode: string): Promise<WordPackage | null> {
  const cloudPkg = await getPackageFromCloud(shareCode);
  if (!cloudPkg) return null;

  // Check if we already have it (by ID)
  const existing = getPackageById(cloudPkg.id);
  if (existing) {
    // Update existing? Or create copy? 
    // Let's create a copy if IDs match but content differs, or just overwrite.
    // For simplicity, let's overwrite/update the local one.
    updatePackage(cloudPkg.id, { name: cloudPkg.name, words: cloudPkg.words });
    return existing;
  } else {
    // Create new
    const packages = getAllPackages();
    packages.push(cloudPkg);
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
    return cloudPkg;
  }
}

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
