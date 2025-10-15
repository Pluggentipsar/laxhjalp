/**
 * AI Service - Förberedd för OpenAI/Anthropic integration
 *
 * Lägg till dina API-nycklar i .env:
 * VITE_OPENAI_API_KEY=your_key
 * VITE_ANTHROPIC_API_KEY=your_key
 */

import type {
  AIGenerationRequest,
  AIGenerationResponse,
  Flashcard,
  Question,
  Concept,
  ChatMessage,
} from '../types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

/**
 * Generera flashcards från text med AI
 */
export async function generateFlashcards(
  content: string,
  count: number = 10
): Promise<Flashcard[]> {
  if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY) {
    console.warn('Ingen API-nyckel konfigurerad. Använder mock-data.');
    return mockGenerateFlashcards(content, count);
  }

  // TODO: Implementera riktig API-anrop när nycklar finns
  try {
    // OpenAI implementation
    if (OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'Du är en hjälpsam studieassistent. Skapa flashcards från given text. Returnera JSON array med objekt som har "front" och "back" properties.',
            },
            {
              role: 'user',
              content: `Skapa ${count} flashcards från följande text:\n\n${content}`,
            },
          ],
        }),
      });

      const data = await response.json();
      // Parse och formatera till Flashcard[]
      // ...implementation
    }

    // Anthropic implementation
    if (ANTHROPIC_API_KEY) {
      // ...implementation
    }
  } catch (error) {
    console.error('Fel vid AI-generering:', error);
  }

  // Fallback till mock
  return mockGenerateFlashcards(content, count);
}

/**
 * Generera quiz-frågor från text med AI
 */
export async function generateQuestions(
  content: string,
  count: number = 5
): Promise<Question[]> {
  if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY) {
    console.warn('Ingen API-nyckel konfigurerad. Använder mock-data.');
    return mockGenerateQuestions(content, count);
  }

  // TODO: Implementera riktig API-anrop
  return mockGenerateQuestions(content, count);
}

/**
 * Generera begrepp och definitioner från text
 */
export async function generateConcepts(
  content: string,
  count: number = 5
): Promise<Concept[]> {
  if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY) {
    return mockGenerateConcepts(content, count);
  }

  // TODO: Implementera riktig API-anrop
  return mockGenerateConcepts(content, count);
}

/**
 * Chat-förhör - skicka meddelande och få svar
 */
export async function sendChatMessage(
  materialContent: string,
  messages: ChatMessage[],
  userMessage: string
): Promise<string> {
  if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY) {
    return mockChatResponse(userMessage);
  }

  // TODO: Implementera riktig API-anrop med context
  return mockChatResponse(userMessage);
}

/**
 * Förenkla text för lättare läsning
 */
export async function simplifyText(
  text: string,
  targetGrade: number
): Promise<string> {
  if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY) {
    return text; // Returnera originaltext om ingen AI finns
  }

  // TODO: Implementera förenkling baserat på årskurs
  return text;
}

/**
 * OCR - Extrahera text från bild
 */
export async function extractTextFromImage(
  imageData: string | Blob
): Promise<{ text: string; confidence: number }> {
  // Använd Tesseract.js för OCR
  const Tesseract = await import('tesseract.js');

  try {
    const result = await Tesseract.recognize(imageData, 'swe', {
      logger: (m) => console.log(m),
    });

    return {
      text: result.data.text,
      confidence: result.data.confidence,
    };
  } catch (error) {
    console.error('OCR-fel:', error);
    throw new Error('Kunde inte läsa text från bilden');
  }
}

// Mock-funktioner för utveckling
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

function mockGenerateQuestions(content: string, count: number): Question[] {
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

function mockGenerateConcepts(content: string, count: number): Concept[] {
  return Array.from({ length: count }, (_, i) => ({
    id: crypto.randomUUID(),
    materialId: '',
    term: `Begrepp ${i + 1}`,
    definition: `Definition av begrepp ${i + 1}`,
    examples: [`Exempel ${i + 1}`],
    relatedConcepts: [],
  }));
}

function mockChatResponse(userMessage: string): string {
  const responses = [
    'Bra fråga! Låt mig förklara...',
    'Det är riktigt! Kan du berätta mer?',
    'Hmm, tänk efter lite till. Vad vet du om...?',
    'Utmärkt! Du har förstått det bra.',
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}
