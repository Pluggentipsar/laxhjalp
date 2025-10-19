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

export interface PersonalizedExplanationResponse {
  explanation: string;
  examples: string[];
  analogy?: string;
}

export interface PersonalizedExamplesResponse {
  examples: Array<{
    title: string;
    description: string;
    context: string;
  }>;
}

export interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  mainIdeas: string[];
}

export interface GenerateMaterialResponse {
  title: string;
  content: string;
  subject: 'bild' | 'biologi' | 'engelska' | 'fysik' | 'geografi' | 'hem-och-konsumentkunskap' | 'historia' | 'idrott' | 'kemi' | 'matematik' | 'moderna-sprak' | 'musik' | 'religionskunskap' | 'samhallskunskap' | 'slojd' | 'svenska' | 'annat';
  suggestedTags: string[];
}

/**
 * Generera personaliserad förklaring baserat på användarens intressen
 */
export async function generatePersonalizedExplanation(
  materialContent: string,
  selection: string,
  interests: string[],
  customContext?: string,
  grade: number = 7
): Promise<PersonalizedExplanationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate/personalized-explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        materialContent,
        selection,
        interests,
        customContext,
        grade,
      }),
    });

    if (!response.ok) {
      throw new Error(`Personalized Explain API-fel: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      explanation: data.explanation,
      examples: data.examples || [],
      analogy: data.analogy,
    };
  } catch (error) {
    console.error('Personaliserad förklaring fel:', error);
    // Fallback till mock-svar vid fel
    return mockPersonalizedExplanation(selection, interests);
  }
}

/**
 * Generera personaliserade exempel baserat på användarens intressen
 */
export async function generatePersonalizedExamples(
  materialContent: string,
  interests: string[],
  customContext?: string,
  grade: number = 7,
  count: number = 3
): Promise<PersonalizedExamplesResponse> {
  console.log('[aiService] generatePersonalizedExamples called with:', { interests, customContext, count });
  try {
    const response = await fetch(`${API_BASE_URL}/generate/personalized-examples`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        materialContent,
        interests,
        customContext,
        grade,
        count,
      }),
    });

    if (!response.ok) {
      throw new Error(`Personalized Examples API-fel: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[aiService] API response:', data);
    return {
      examples: data.examples || [],
    };
  } catch (error) {
    console.error('[aiService] Personaliserade exempel fel, using mock data:', error);
    // Fallback till mock-svar vid fel
    const mockData = mockPersonalizedExamples(materialContent, interests, count);
    console.log('[aiService] Mock data:', mockData);
    return mockData;
  }
}

/**
 * Generera sammanfattning av materialet
 */
export async function generateSummary(
  materialContent: string,
  grade: number = 7
): Promise<SummaryResponse> {
  console.log('[aiService] generateSummary called');
  try {
    const response = await fetch(`${API_BASE_URL}/generate/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: materialContent,
        grade,
      }),
    });

    if (!response.ok) {
      throw new Error(`Summary API-fel: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[aiService] API response:', data);
    return {
      summary: data.summary,
      keyPoints: data.keyPoints || [],
      mainIdeas: data.mainIdeas || [],
    };
  } catch (error) {
    console.error('[aiService] Sammanfattning fel, using mock data:', error);
    // Fallback till mock-svar vid fel
    const mockData = mockSummary(materialContent);
    console.log('[aiService] Mock data:', mockData);
    return mockData;
  }
}

/**
 * Generera helt nytt studiematerial från ett ämne
 */
export async function generateMaterial(
  topic: string,
  grade: number = 5
): Promise<GenerateMaterialResponse> {
  console.log('[aiService] generateMaterial called with topic:', topic);
  try {
    const response = await fetch(`${API_BASE_URL}/generate/material`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        grade,
      }),
    });

    if (!response.ok) {
      throw new Error(`Material API-fel: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[aiService] API response:', data);
    return {
      title: data.title,
      content: data.content,
      subject: data.subject,
      suggestedTags: data.suggestedTags || [],
    };
  } catch (error) {
    console.error('[aiService] Material generering fel, using mock data:', error);
    // Fallback till mock-svar vid fel
    const mockData = mockGenerateMaterial(topic);
    console.log('[aiService] Mock data:', mockData);
    return mockData;
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

function mockPersonalizedExplanation(
  selection: string,
  interests: string[]
): PersonalizedExplanationResponse {
  const interest = interests[0] || 'ditt intresse';

  return {
    explanation: `Låt mig förklara "${selection}" på ett sätt som du kanske kan relatera till bättre!`,
    examples: [
      `Tänk på det som när du ${interest.toLowerCase()} - det fungerar på liknande sätt.`,
      `I ${interest} kan du se samma princip när...`,
    ],
    analogy: `Det är ungefär som i ${interest} när...`,
  };
}

function mockPersonalizedExamples(
  _materialContent: string,
  interests: string[],
  count: number
): PersonalizedExamplesResponse {
  const interest = interests[0] || 'något du gillar';

  return {
    examples: Array.from({ length: count }, (_, i) => ({
      title: `Exempel ${i + 1} med ${interest}`,
      description: `Här är ett exempel som kopplar till ${interest.toLowerCase()}. Det visar hur konceptet fungerar i en kontext du känner igen.`,
      context: `I ${interest} kan du se detta när...`,
    })),
  };
}

function mockSummary(_materialContent: string): SummaryResponse {
  return {
    summary: 'Detta är en sammanfattning av materialet. Den ger en överblick av huvudinnehållet och de viktigaste koncepten.',
    keyPoints: [
      'Viktig punkt nummer 1',
      'Viktig punkt nummer 2',
      'Viktig punkt nummer 3',
    ],
    mainIdeas: [
      'Huvudidé 1: Detta är den första huvudidén',
      'Huvudidé 2: Detta är den andra huvudidén',
    ],
  };
}

function mockGenerateMaterial(topic: string): GenerateMaterialResponse {
  const subjects: Array<'bild' | 'biologi' | 'engelska' | 'fysik' | 'geografi' | 'hem-och-konsumentkunskap' | 'historia' | 'idrott' | 'kemi' | 'matematik' | 'moderna-sprak' | 'musik' | 'religionskunskap' | 'samhallskunskap' | 'slojd' | 'svenska' | 'annat'> = [
    'svenska', 'biologi', 'historia', 'geografi', 'annat'
  ];
  const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];

  return {
    title: `Lär dig om ${topic}`,
    content: `# ${topic}\n\nDetta är ett automatiskt genererat studiematerial om **${topic}**.\n\n## Introduktion\n\nHär kommer en introduktion till ämnet ${topic}. Detta material är skapat för att hjälpa dig förstå grunderna.\n\n## Viktiga punkter\n\n- Punkt 1 om ${topic}\n- Punkt 2 om ${topic}\n- Punkt 3 om ${topic}\n\n## Sammanfattning\n\nNu har du lärt dig mer om ${topic}!`,
    subject: randomSubject,
    suggestedTags: [topic.toLowerCase(), 'lärande', 'studie'],
  };
}
