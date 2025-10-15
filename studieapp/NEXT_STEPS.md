# Nästa Steg - AI-funktionalitet klar! 🚀

Backend API är nu byggt och redo att användas! Här är vad som gjorts och vad du behöver göra härnäst.

## ✅ Vad som är klart

### Backend API (server/)
- ✅ Express server med alla endpoints
- ✅ OCR för bilder (Tesseract.js)
- ✅ PDF text-extraktion (PDF.js)
- ✅ AI flashcard-generering (OpenAI GPT-4o-mini)
- ✅ AI quiz-generering
- ✅ AI begrepp-identifiering
- ✅ RAG-baserad chattbot med embeddings
- ✅ Mindmap-generering
- ✅ Text-förenkling

### Frontend Integration
- ✅ Uppdaterad `aiService.ts` för att använda backend API
- ✅ Stöd för OCR, PDF, flashcards, quiz, concepts, chat
- ✅ Fallback till mock-data om backend inte svarar

### Dokumentation
- ✅ [AI_SETUP.md](./AI_SETUP.md) - Komplett setup-guide
- ✅ [server/README.md](./server/README.md) - API-dokumentation
- ✅ Test-script för att verifiera API

## 🎯 Din checklista - Gör detta nu:

### 1. Lägg till OpenAI API-nyckel (5 min)

```bash
# Öppna .env i studieapp/
OPENAI_API_KEY=sk-proj-your-key-here
```

**Hur skaffar jag nyckel?**
1. Gå till [platform.openai.com](https://platform.openai.com/)
2. Skapa konto (behöver betalkort, men kostar nästan inget)
3. API Keys → Create new secret key
4. Kopiera och klistra in ovan

**Kostnad:** ~$5 räcker för flera månaders testning/utveckling

### 2. Starta båda servrarna (2 min)

**Alternativ A: Ett kommando**
```bash
npm run dev:all
```

**Alternativ B: Två terminaler**
```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
npm run dev
```

**Förväntat resultat:**
```
Backend: 🚀 Backend server körs på port 3001
Frontend: ➜  Local: http://localhost:5173/
```

### 3. Testa API:et (5 min)

**Utan API-nyckel (test att backend funkar):**
```bash
cd server
node test-api.js
```
Du kommer se fel på AI-endpoints (normalt), men `/health` ska fungera.

**Med API-nyckel:**
Kör samma kommando - alla endpoints ska ge ✅

### 4. Testa i frontend (10 min)

1. Öppna `http://localhost:5173`
2. Gå till Material
3. Skapa nytt material med text om fotosyntesen (exempel):

```
Fotosyntesen är processen där växter omvandlar ljusenergi från solen till kemisk energi.
Växter tar upp koldioxid från luften och vatten från jorden.
Med hjälp av solljus skapas glukos och syre.
```

4. Testa generera:
   - ✅ Flashcards
   - ✅ Quiz
   - ✅ Begrepp

## 🔧 Vad behöver du bygga själv?

### Frontend-komponenter som saknas:

#### 1. Material Upload UI
**Fil:** Uppdatera `src/components/material/CreateMaterialModal.tsx`

Lägg till:
- Bild-upload knapp
- PDF-upload knapp
- Call till `extractTextFromImage()` eller `extractTextFromPDF()`
- Visa OCR-resultatet innan save

**Kod-exempel:**
```typescript
import { extractTextFromImage } from '../../services/aiService';

const handleImageUpload = async (file: File) => {
  const text = await extractTextFromImage(file);
  setContent(text.text);
};
```

#### 2. AI-generering knappar
**Fil:** `src/pages/MaterialPage.tsx` eller ny komponent

Lägg till knappar:
```typescript
import { generateFlashcards, generateQuestions, generateConcepts } from '../../services/aiService';

const handleGenerateFlashcards = async () => {
  const flashcards = await generateFlashcards(
    material.content,
    10, // antal
    'medium', // svårighetsgrad
    userProfile.grade // årskurs från profil
  );

  // Spara till material i Dexie
  await db.materials.update(material.id, {
    flashcards: [...material.flashcards, ...flashcards]
  });
};
```

#### 3. Chat-komponent
**Fil:** Ny `src/components/study/ChatView.tsx`

Skapa chat-UI som:
- Visar meddelanden (user/assistant)
- Input-fält
- Anropar `sendChatMessage()` med material content

**Kod-exempel:**
```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);

const handleSend = async (text: string) => {
  const response = await sendChatMessage(
    material.content,
    messages,
    text,
    userProfile.grade
  );

  setMessages([
    ...messages,
    { role: 'user', content: text },
    { role: 'assistant', content: response }
  ]);
};
```

#### 4. Embeddings-caching
**Fil:** Uppdatera `src/lib/db.ts`

Lägg till tabell för embeddings:
```typescript
embeddings!: Dexie.Table<EmbeddingChunk, string>;

// I constructor:
this.version(2).stores({
  // ... existing tables
  embeddings: 'id, materialId, index'
});
```

Generera embeddings när material skapas:
```typescript
import { generateEmbeddings } from '../services/aiService';

const chunks = await generateEmbeddings(material.content);
await db.embeddings.bulkAdd(chunks.map(c => ({
  ...c,
  materialId: material.id
})));
```

## 📊 Vad fungerar redan?

- ✅ Backend API (alla endpoints)
- ✅ Frontend service-layer (`aiService.ts`)
- ✅ OCR & PDF-extraktion
- ✅ AI-generering (flashcards, quiz, concepts)
- ✅ RAG chat med context
- ✅ Error handling & fallbacks

## 🐛 Om något inte fungerar

### Backend startar inte
```bash
cd server
rm -rf node_modules
npm install
npm run dev
```

### Frontend kan inte nå backend
1. Kolla att backend körs på port 3001
2. Kolla CORS-inställningar
3. Öppna browser console (F12) för fel

### API-fel
1. Kolla att `.env` har rätt API-nyckel
2. Se felmeddelanden i backend-terminalen
3. Testa med `curl` eller Postman

### OCR fungerar dåligt
- Använd tydliga bilder med hög kontrast
- Tesseract är bäst på tryckt text
- PDF-extraktion fungerar bättre för digitala PDF:er

## 🎨 Förbättringsförslag

1. **Caching:** Spara AI-resultat lokalt för att undvika dubbelgenerering
2. **Loading states:** Visa progress när AI genererar
3. **Rate limiting:** Frontend-throttling för att undvika för många requests
4. **Batch-generering:** Generera allt (flashcards + quiz + concepts) med ett klick
5. **Preview:** Visa AI-resultat innan de sparas
6. **Retry:** Knapp för att regenerera om resultatet är dåligt
7. **Difficulty selector:** Låt användaren välja svårighetsgrad
8. **Custom prompts:** Avancerat läge där man kan redigera prompts

## 📚 Resurser

- **OpenAI Docs:** https://platform.openai.com/docs
- **API Pricing:** https://openai.com/pricing
- **Rate Limits:** https://platform.openai.com/docs/guides/rate-limits
- **Best Practices:** https://platform.openai.com/docs/guides/prompt-engineering

## ✨ Lycka till!

Du har nu en komplett AI-backend! Nästa steg är att:
1. Sätta API-nyckeln
2. Starta servrarna
3. Bygga frontend-komponenter för att använda AI-funktionerna

Fråga mig om du behöver hjälp med något av stegen! 🚀
