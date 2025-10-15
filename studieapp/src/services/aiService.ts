/**
 * AI Service - Kopplar till backend API för AI-funktioner
 *
 * Backend hanterar OpenAI/Anthropic API-anrop
 */

import type {
  Flashcard,
  Question,
  Concept,
  ChatMessage,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ChatResponse {
  message: string;
  sources: Array<{ text: string; relevance?: string }>;
  isFallback?: boolean;
}

/**
 * Generera flashcards från text med AI
 */
export async function generateFlashcards(
  content: string,
  count: number = 10,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  grade: number = 5
): Promise<Flashcard[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate/flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        count,
        difficulty,
        grade
      }),
    });

    if (!response.ok) {
      throw new Error(`API-fel: ${response.statusText}`);
    }

    const data = await response.json();
    return data.flashcards;
  } catch (error) {
    console.error('Fel vid AI-generering av flashcards:', error);
    // Fallback till mock om backend inte svarar
    return mockGenerateFlashcards(content, count);
  }
}

/**
 * Generera quiz-frågor från text med AI
 */
export async function generateQuestions(
  content: string,
  count: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  grade: number = 5
): Promise<Question[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        count,
        difficulty,
        grade
      }),
    });

    if (!response.ok) {
      throw new Error(`API-fel: ${response.statusText}`);
    }

    const data = await response.json();
    return data.questions;
  } catch (error) {
    console.error('Fel vid AI-generering av quiz-frågor:', error);
    return mockGenerateQuestions(content, count);
  }
}

/**
 * Generera begrepp och definitioner från text
 */
export async function generateConcepts(
  content: string,
  count: number = 5,
  grade: number = 5
): Promise<Concept[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate/concepts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        count,
        grade
      }),
    });

    if (!response.ok) {
      throw new Error(`API-fel: ${response.statusText}`);
    }

    const data = await response.json();
    return data.concepts;
  } catch (error) {
    console.error('Fel vid AI-generering av begrepp:', error);
    return mockGenerateConcepts(content, count);
  }
}

/**
 * Chat-förhör - skicka meddelande och få svar (RAG-baserat)
 */
export async function sendChatMessage(
  materialContent: string,
  messages: ChatMessage[],
  userMessage: string,
  grade: number = 5
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        materialContent,
        messages,
        userMessage,
        grade
      }),
    });

    if (!response.ok) {
      throw new Error(`API-fel: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      message: data.message,
      sources: data.sources ?? [],
      isFallback: false,
    };
  } catch (error) {
    console.error('Fel vid chat:', error);
    return {
      message: mockChatResponse(userMessage),
      sources: [],
      isFallback: true,
    };
  }
}

/**
 * Förenkla text för lättare läsning
 */
export async function simplifyText(
  text: string,
  targetGrade: number
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate/simplify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: text,
        grade: targetGrade
      }),
    });

    if (!response.ok) {
      throw new Error(`API-fel: ${response.statusText}`);
    }

    const data = await response.json();
    return data.simplifiedText;
  } catch (error) {
    console.error('Fel vid förenkling:', error);
    return text; // Returnera originaltext vid fel
  }
}

export async function deepenText(
  text: string,
  targetGrade: number
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate/deepen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: text,
        grade: targetGrade,
      }),
    });

    if (!response.ok) {
      throw new Error(`Fördjupnings API-fel: ${response.statusText}`);
    }

    const data = await response.json();
    return data.deepenedText;
  } catch (error) {
    console.error('Fördjupning fel:', error);
    throw new Error('Kunde inte fördjupa texten');
  }
}

export interface ExplainSelectionResponse {
  explanation: string;
  definition: string;
  example?: string;
}

export async function explainSelection(
  materialContent: string,
  selection: string,
  grade: number
): Promise<ExplainSelectionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        materialContent,
        selection,
        grade,
      }),
    });

    if (!response.ok) {
      throw new Error(`Explain API-fel: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      explanation: data.explanation,
      definition: data.definition,
      example: data.example,
    };
  } catch (error) {
    console.error('Förklaring fel:', error);
    throw new Error('Kunde inte förklara markeringen');
  }
}

/**
 * OCR - Extrahera text från bild
 */
export async function extractTextFromImage(
  imageData: string | Blob
): Promise<{ text: string; confidence: number }> {
  try {
    // Konvertera till base64 om Blob
    let base64Image = imageData;
    if (imageData instanceof Blob) {
      base64Image = await blobToBase64(imageData);
    }

    const response = await fetch(`${API_BASE_URL}/ocr/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        language: 'swe'
      }),
    });

    if (!response.ok) {
      throw new Error(`OCR API-fel: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.text,
      confidence: data.confidence,
    };
  } catch (error) {
    console.error('OCR-fel:', error);
    throw new Error('Kunde inte läsa text från bilden');
  }
}

/**
 * Extrahera text från PDF
 */
export async function extractTextFromPDF(
  pdfData: string | Blob
): Promise<{ text: string; pages: any[] }> {
  try {
    let base64PDF = pdfData;
    if (pdfData instanceof Blob) {
      base64PDF = await blobToBase64(pdfData);
    }

    const response = await fetch(`${API_BASE_URL}/ocr/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfData: base64PDF
      }),
    });

    if (!response.ok) {
      throw new Error(`PDF API-fel: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.text,
      pages: data.pages,
    };
  } catch (error) {
    console.error('PDF-extraktion fel:', error);
    throw new Error('Kunde inte läsa PDF');
  }
}

/**
 * Generera embeddings för material (för lokal RAG)
 */
export async function generateEmbeddings(
  content: string,
  chunkSize: number = 500
): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        chunkSize
      }),
    });

    if (!response.ok) {
      throw new Error(`Embeddings API-fel: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embeddings;
  } catch (error) {
    console.error('Embeddings-fel:', error);
    throw new Error('Kunde inte generera embeddings');
  }
}

// Helper function
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Mock-funktioner för utveckling (fallback när backend inte svarar)
function mockGenerateFlashcards(content: string, count: number): Flashcard[] {
  const words = content.split(' ').filter((w) => w.length > 3);
  return Array.from({ length: Math.min(count, words.length) }, (_, i) => ({
    id: crypto.randomUUID(),
    materialId: '',
    front: `Fråga ${i + 1}`,
    back: `Svar ${i + 1}`,
    type: 'term-definition' as const,
    difficulty: 'medium' as const,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    correctCount: 0,
    incorrectCount: 0,
  }));
}

function mockGenerateQuestions(_content: string, count: number): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    id: crypto.randomUUID(),
    materialId: '',
    question: `Fråga ${i + 1} om innehållet?`,
    correctAnswer: 'Rätt svar',
    alternativeAnswers: ['Fel svar 1', 'Fel svar 2', 'Fel svar 3'],
    type: 'multiple-choice' as const,
    difficulty: 'medium' as const,
  }));
}

function mockGenerateConcepts(_content: string, count: number): Concept[] {
  return Array.from({ length: count }, (_, i) => ({
    id: crypto.randomUUID(),
    materialId: '',
    term: `Begrepp ${i + 1}`,
    definition: `Definition av begrepp ${i + 1}`,
    examples: [`Exempel ${i + 1}`],
    relatedConcepts: [],
  }));
}

function mockChatResponse(_userMessage: string): string {
  const responses = [
    'Bra fråga! Låt mig förklara...',
    'Det är riktigt! Kan du berätta mer?',
    'Hmm, tänk efter lite till. Vad vet du om...?',
    'Utmärkt! Du har förstått det bra.',
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}
