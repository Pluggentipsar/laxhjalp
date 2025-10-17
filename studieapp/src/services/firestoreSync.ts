/**
 * Firestore Sync Service
 *
 * Synkroniserar all data mellan IndexedDB (lokal cache) och Firestore (moln).
 * Strategi: Offline-first med automatisk sync till molnet.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db as firestore } from './firebase';
import { db as indexedDB } from '../lib/db';
import type { Material, Folder, StudySession, DailyProgress } from '../types';

// Konvertera Date till Firestore Timestamp och vice versa
const toFirestoreTimestamp = (date: Date | string | Timestamp): Timestamp => {
  if (date instanceof Timestamp) return date;
  if (date instanceof Date) return Timestamp.fromDate(date);
  return Timestamp.fromDate(new Date(date));
};

const fromFirestoreTimestamp = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

/**
 * Ta bort alla undefined-värden från ett objekt (rekursivt)
 * Firestore tillåter inte undefined, bara null
 */
const removeUndefinedFields = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields);
  }

  if (obj instanceof Timestamp || obj instanceof Date) {
    return obj;
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    }
    return cleaned;
  }

  return obj;
};

/**
 * Synka ett enskilt material till Firestore
 */
export async function syncMaterialToFirestore(userId: string, material: Material): Promise<void> {
  try {
    console.log(`[Firestore] 🔄 Starting sync for material: ${material.title}`);
    console.log(`[Firestore] 📍 Path: users/${userId}/materials/${material.id}`);

    const materialRef = doc(firestore, 'users', userId, 'materials', material.id);

    // Konvertera alla dates till Firestore Timestamps
    const firestoreData = {
      ...material,
      createdAt: toFirestoreTimestamp(material.createdAt),
      updatedAt: toFirestoreTimestamp(material.updatedAt),
      lastStudied: material.lastStudied ? toFirestoreTimestamp(material.lastStudied) : null,
      // Konvertera nested dates i flashcards om det finns
      flashcards: material.flashcards?.map(card => ({
        ...card,
        nextReview: card.nextReview ? toFirestoreTimestamp(card.nextReview) : null,
      })),
      // Konvertera nested dates i glossary om det finns
      glossary: material.glossary?.map(entry => ({
        ...entry,
        addedAt: toFirestoreTimestamp(entry.addedAt),
      })),
      // Konvertera generation history dates
      generationHistory: material.generationHistory?.map(entry => ({
        ...entry,
        createdAt: toFirestoreTimestamp(entry.createdAt),
      })),
    };

    // Ta bort alla undefined-värden (Firestore tillåter inte undefined)
    const cleanedData = removeUndefinedFields(firestoreData);

    console.log('[Firestore] 💾 Writing to Firestore...');
    await setDoc(materialRef, cleanedData, { merge: true });
    console.log(`[Firestore] ✅ Successfully synced material: ${material.title}`);
  } catch (error) {
    console.error(`[Firestore] ❌ Error syncing material "${material.title}":`, error);
    throw error;
  }
}

/**
 * Hämta ett material från Firestore
 */
export async function getMaterialFromFirestore(userId: string, materialId: string): Promise<Material | null> {
  try {
    const materialRef = doc(firestore, 'users', userId, 'materials', materialId);
    const snapshot = await getDoc(materialRef);

    if (!snapshot.exists()) return null;

    const data = snapshot.data();

    // Konvertera Firestore Timestamps tillbaka till Dates
    return {
      ...data,
      createdAt: fromFirestoreTimestamp(data.createdAt),
      updatedAt: fromFirestoreTimestamp(data.updatedAt),
      lastStudied: data.lastStudied ? fromFirestoreTimestamp(data.lastStudied) : undefined,
      flashcards: data.flashcards?.map((card: any) => ({
        ...card,
        nextReview: card.nextReview ? fromFirestoreTimestamp(card.nextReview) : undefined,
      })),
      glossary: data.glossary?.map((entry: any) => ({
        ...entry,
        addedAt: fromFirestoreTimestamp(entry.addedAt),
      })),
      generationHistory: data.generationHistory?.map((entry: any) => ({
        ...entry,
        createdAt: fromFirestoreTimestamp(entry.createdAt),
      })),
    } as Material;
  } catch (error) {
    console.error('[Firestore] Error getting material:', error);
    return null;
  }
}

/**
 * Hämta alla material från Firestore för en användare
 */
export async function getAllMaterialsFromFirestore(userId: string): Promise<Material[]> {
  try {
    const materialsRef = collection(firestore, 'users', userId, 'materials');
    const q = query(materialsRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: fromFirestoreTimestamp(data.createdAt),
        updatedAt: fromFirestoreTimestamp(data.updatedAt),
        lastStudied: data.lastStudied ? fromFirestoreTimestamp(data.lastStudied) : undefined,
        flashcards: data.flashcards?.map((card: any) => ({
          ...card,
          nextReview: card.nextReview ? fromFirestoreTimestamp(card.nextReview) : undefined,
        })),
        glossary: data.glossary?.map((entry: any) => ({
          ...entry,
          addedAt: fromFirestoreTimestamp(entry.addedAt),
        })),
        generationHistory: data.generationHistory?.map((entry: any) => ({
          ...entry,
          createdAt: fromFirestoreTimestamp(entry.createdAt),
        })),
      } as Material;
    });
  } catch (error) {
    console.error('[Firestore] Error getting all materials:', error);
    return [];
  }
}

/**
 * Ta bort ett material från Firestore
 */
export async function deleteMaterialFromFirestore(userId: string, materialId: string): Promise<void> {
  try {
    const materialRef = doc(firestore, 'users', userId, 'materials', materialId);
    await deleteDoc(materialRef);
    console.log(`[Firestore] Deleted material: ${materialId}`);
  } catch (error) {
    console.error('[Firestore] Error deleting material:', error);
    throw error;
  }
}

/**
 * Synka folder till Firestore
 */
export async function syncFolderToFirestore(userId: string, folder: Folder): Promise<void> {
  try {
    const folderRef = doc(firestore, 'users', userId, 'folders', folder.id);
    const firestoreData = {
      ...folder,
      createdAt: toFirestoreTimestamp(folder.createdAt),
    };
    const cleanedData = removeUndefinedFields(firestoreData);
    await setDoc(folderRef, cleanedData, { merge: true });
    console.log(`[Firestore] Synced folder: ${folder.name}`);
  } catch (error) {
    console.error('[Firestore] Error syncing folder:', error);
    throw error;
  }
}

/**
 * Ta bort en folder från Firestore
 */
export async function deleteFolderFromFirestore(userId: string, folderId: string): Promise<void> {
  try {
    const folderRef = doc(firestore, 'users', userId, 'folders', folderId);
    await deleteDoc(folderRef);
    console.log(`[Firestore] Deleted folder: ${folderId}`);
  } catch (error) {
    console.error('[Firestore] Error deleting folder:', error);
    throw error;
  }
}

/**
 * Hämta alla folders från Firestore för en användare
 */
export async function getAllFoldersFromFirestore(userId: string): Promise<Folder[]> {
  try {
    const foldersRef = collection(firestore, 'users', userId, 'folders');
    const q = query(foldersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: fromFirestoreTimestamp(data.createdAt),
      } as Folder;
    });
  } catch (error) {
    console.error('[Firestore] Error getting all folders:', error);
    return [];
  }
}

/**
 * Synka study session till Firestore
 */
export async function syncStudySessionToFirestore(userId: string, session: StudySession): Promise<void> {
  try {
    const sessionRef = doc(firestore, 'users', userId, 'studySessions', session.id);
    const firestoreData = {
      ...session,
      startedAt: toFirestoreTimestamp(session.startedAt),
      endedAt: session.endedAt ? toFirestoreTimestamp(session.endedAt) : null,
    };
    const cleanedData = removeUndefinedFields(firestoreData);
    await setDoc(sessionRef, cleanedData, { merge: true });
    console.log(`[Firestore] Synced study session: ${session.id}`);
  } catch (error) {
    console.error('[Firestore] Error syncing study session:', error);
    throw error;
  }
}

/**
 * Synka daily progress till Firestore
 */
export async function syncDailyProgressToFirestore(userId: string, progress: DailyProgress): Promise<void> {
  try {
    const progressRef = doc(firestore, 'users', userId, 'dailyProgress', progress.date);
    await setDoc(progressRef, progress, { merge: true });
    console.log(`[Firestore] Synced daily progress: ${progress.date}`);
  } catch (error) {
    console.error('[Firestore] Error syncing daily progress:', error);
    throw error;
  }
}

/**
 * Real-time listener för material-ändringar
 * Returnerar en unsubscribe-funktion
 */
export function subscribeMaterialsChanges(
  userId: string,
  onMaterialsChange: (materials: Material[]) => void
): Unsubscribe {
  const materialsRef = collection(firestore, 'users', userId, 'materials');
  const q = query(materialsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const materials = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: fromFirestoreTimestamp(data.createdAt),
        updatedAt: fromFirestoreTimestamp(data.updatedAt),
        lastStudied: data.lastStudied ? fromFirestoreTimestamp(data.lastStudied) : undefined,
        flashcards: data.flashcards?.map((card: any) => ({
          ...card,
          nextReview: card.nextReview ? fromFirestoreTimestamp(card.nextReview) : undefined,
        })),
        glossary: data.glossary?.map((entry: any) => ({
          ...entry,
          addedAt: fromFirestoreTimestamp(entry.addedAt),
        })),
        generationHistory: data.generationHistory?.map((entry: any) => ({
          ...entry,
          createdAt: fromFirestoreTimestamp(entry.createdAt),
        })),
      } as Material;
    });

    console.log(`[Firestore] Received ${materials.length} materials from real-time sync`);
    onMaterialsChange(materials);
  }, (error) => {
    console.error('[Firestore] Error in real-time sync:', error);
  });
}

/**
 * Initiera full sync från Firestore till IndexedDB
 * Använd detta när användaren loggar in på en ny enhet
 */
export async function initFullSyncFromFirestore(userId: string): Promise<void> {
  try {
    console.log('[Firestore] Starting full sync from cloud...');

    // Hämta alla materials och folders från Firestore
    const materials = await getAllMaterialsFromFirestore(userId);
    const folders = await getAllFoldersFromFirestore(userId);

    // Spara till IndexedDB
    const materialBatch = materials.map(material => indexedDB.materials.put(material));
    const folderBatch = folders.map(folder => indexedDB.folders.put(folder));
    await Promise.all([...materialBatch, ...folderBatch]);

    console.log(`[Firestore] Synced ${materials.length} materials and ${folders.length} folders to IndexedDB`);
  } catch (error) {
    console.error('[Firestore] Error in full sync:', error);
    throw error;
  }
}

/**
 * Synka all lokal data till Firestore
 * Använd detta för att säkerhetskopiera lokal data till molnet
 */
export async function syncAllToFirestore(userId: string): Promise<void> {
  try {
    console.log('[Firestore] Starting full sync to cloud...');

    // Hämta all lokal data
    const materials = await indexedDB.materials.toArray();
    const folders = await indexedDB.folders.toArray();

    // Synka materials
    for (const material of materials) {
      await syncMaterialToFirestore(userId, material);
    }

    // Synka folders
    for (const folder of folders) {
      await syncFolderToFirestore(userId, folder);
    }

    console.log(`[Firestore] Synced ${materials.length} materials and ${folders.length} folders to cloud`);
  } catch (error) {
    console.error('[Firestore] Error in full sync to cloud:', error);
    throw error;
  }
}
