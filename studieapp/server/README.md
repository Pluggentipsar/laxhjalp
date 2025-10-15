# Studieapp Backend API

Backend server för AI-funktioner i Studieappen.

## Funktioner

- **OCR**: Extrahera text från bilder och PDF-filer (Tesseract.js)
- **AI-generering**: Flashcards, quiz-frågor, begrepp, mindmaps (OpenAI GPT-4o-mini)
- **RAG Chat**: Intelligent chattbot som svarar baserat på studiematerial (embeddings + GPT)
- **Text-förenkling**: Anpassa text till olika årskurser

## Setup

### 1. Installera dependencies

```bash
cd server
npm install
```

### 2. Konfigurera miljövariabler

Skapa `.env` i rot-katalogen (studieapp/) och lägg till din OpenAI API-nyckel:

```bash
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
OPENAI_API_KEY=sk-your-key-here
```

### 3. Starta servern

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Servern körs på `http://localhost:3001`

## API Endpoints

### OCR

**POST** `/api/ocr/image`
```json
{
  "image": "base64-encoded-image",
  "language": "swe"
}
```

**POST** `/api/ocr/pdf`
```json
{
  "pdfData": "base64-encoded-pdf"
}
```

### AI-generering

**POST** `/api/generate/flashcards`
```json
{
  "content": "Text att generera flashcards från",
  "count": 10,
  "difficulty": "medium",
  "grade": 5
}
```

**POST** `/api/generate/quiz`
```json
{
  "content": "Text att generera quiz från",
  "count": 5,
  "difficulty": "medium",
  "grade": 5
}
```

**POST** `/api/generate/concepts`
```json
{
  "content": "Text att extrahera begrepp från",
  "count": 5,
  "grade": 5
}
```

**POST** `/api/generate/mindmap`
```json
{
  "content": "Text att skapa mindmap från",
  "title": "Mindmap-titel",
  "grade": 5
}
```

### Chat (RAG)

**POST** `/api/chat`
```json
{
  "materialContent": "Studiematerialet",
  "messages": [
    { "role": "user", "content": "Tidigare meddelande" },
    { "role": "assistant", "content": "Tidigare svar" }
  ],
  "userMessage": "Nytt meddelande",
  "grade": 5
}
```

**POST** `/api/chat/embeddings`
```json
{
  "content": "Text att generera embeddings för",
  "chunkSize": 500
}
```

## Kostnadsuppskattning (OpenAI)

- **Flashcards** (10 st): ~$0.01-0.03
- **Quiz** (5 frågor): ~$0.01-0.02
- **Concepts** (5 begrepp): ~$0.01
- **Embeddings** (per material): ~$0.001
- **Chat** (per konversation): ~$0.01-0.05

**Total kostnad för aktiv användning: ~$5-15/månad**

## Teknisk stack

- **Express.js** - Web server
- **OpenAI API** - LLM (gpt-4o-mini) och embeddings
- **Tesseract.js** - OCR (lokal, gratis)
- **PDF.js** - PDF-parsing

## Utveckling

### Starta både frontend och backend

Använd två terminaler:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

### Testa endpoints

Använd Postman, Insomnia eller curl:

```bash
# Health check
curl http://localhost:3001/health

# Testa flashcard-generering
curl -X POST http://localhost:3001/api/generate/flashcards \
  -H "Content-Type: application/json" \
  -d '{"content":"Fotosyntesen är processen där växter omvandlar ljusenergi till kemisk energi.","count":3,"grade":5}'
```

## Felsökning

### "Ingen API-nyckel konfigurerad"
- Kontrollera att `.env` finns i studieapp/ (inte server/)
- Verifiera att `OPENAI_API_KEY` är korrekt

### CORS-fel
- Kontrollera att `FRONTEND_URL` är rätt i `.env`
- Se till att backend körs på port 3001

### Rate limit errors
- OpenAI har rate limits på API-anrop
- Implementera caching eller vänta mellan requests

## Produktion

För deployment (t.ex. Railway, Render, Heroku):

1. Sätt miljövariabler i hosting-plattformen
2. Bygg och deploy både frontend och backend
3. Uppdatera `VITE_API_URL` i frontend till backend-URL
