# AI-funktionalitet Setup Guide

## Snabbstart

### 1. Konfigurera OpenAI API-nyckel

**Skaffa en API-nyckel:**
1. Gå till [OpenAI Platform](https://platform.openai.com/)
2. Skapa ett konto eller logga in
3. Gå till API Keys → Create new secret key
4. Kopiera nyckeln (du ser den bara en gång!)

**Lägg till i projektet:**
Öppna `.env` i rot-katalogen och lägg till:
```bash
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

### 2. Installera backend dependencies

```bash
cd server
npm install
```

### 3. Starta båda servrarna

**Alternativ 1: Två terminaler (rekommenderas)**

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev
```

**Alternativ 2: Ett kommando (Windows)**
```bash
npm run dev:all
```

**Alternativ 3: Ett kommando (Mac/Linux)**
```bash
npm run dev:all:unix
```

### 4. Testa funktionerna

Öppna `http://localhost:5173` i webbläsaren.

Backend API körs på `http://localhost:3001`

## Vad kan AI göra?

### 1. OCR - Läs text från bilder och PDF
- Fotade sidor från läroböcker
- Skärmdumpar från presentationer
- PDF-filer

### 2. Generera flashcards
- AI skapar frågor och svar från din text
- Anpassat till årskurs
- Svårighetsgrad (lätt, mellan, svår)

### 3. Generera quiz-frågor
- Flervalsfrågör
- Sant/falskt
- Förklaringar till svaren

### 4. Identifiera nyckelbegrepp
- Hittar viktiga termer
- Ger tydliga definitioner
- Konkreta exempel

### 5. Chattbot (RAG)
- Ställ frågor om materialet
- AI svarar baserat på innehållet
- Hjälper eleven förstå svåra delar

### 6. Mindmaps
- Visualisera struktur
- Organisera information
- Se samband

## Kostnad

Med OpenAI GPT-4o-mini är det väldigt billigt:

**Exempel för en aktiv elev (per månad):**
- 50 materials: ~$1.50
- 200 flashcards: ~$0.50
- 100 quiz-frågor: ~$0.50
- 20 chat-konversationer: ~$1.00
- Embeddings: ~$0.20

**Total: ~$3-5/månad**

För utveckling/testning: ~$0.10-0.50

## Felsökning

### "API-nyckel saknas"
**Lösning:**
1. Kontrollera att `.env` finns i studieapp/ (INTE i server/)
2. Öppna `.env` och kolla att `OPENAI_API_KEY=sk-...` är korrekt
3. Starta om backend-servern

### Backend startar inte
**Lösning:**
```bash
cd server
rm -rf node_modules
npm install
npm run dev
```

### CORS-fel i browsern
**Lösning:**
- Se till att backend körs på port 3001
- Frontend på port 5173
- Kolla `FRONTEND_URL` i `.env`

### "Rate limit exceeded"
Detta betyder att du gjort för många requests till OpenAI.

**Lösning:**
- Vänta en minut
- Uppgradera till paid OpenAI account för högre limits

### OCR fungerar inte
OCR körs lokalt med Tesseract och kräver ingen API-nyckel.

**Lösning:**
- Kontrollera att bilden är tydlig
- Prova med bättre ljus/kontrast
- Svenska text fungerar bäst

## Nästa steg

När allt fungerar:

1. **Testa med riktigt material**
   - Ladda upp ett kapitel från läroboken
   - Generera flashcards
   - Prova chatten

2. **Anpassa för din årskurs**
   - Ändra default grade i koden
   - Justera svårighetsgrad

3. **Förbättra prompts**
   - Öppna `server/services/aiService.js`
   - Redigera prompt-texterna för bättre resultat

4. **Lägg till caching**
   - Spara AI-resultat i Dexie
   - Undvik dubbelgenerering

## API-dokumentation

Se [server/README.md](server/README.md) för fullständig API-dokumentation.

## Support

Om något inte fungerar:
1. Kolla felsökning ovan
2. Läs felmeddelanden i terminalen
3. Öppna browser console (F12) för frontend-fel

## Säkerhet

**VIKTIGT:**
- Commit ALDRIG `.env` till git (redan i .gitignore)
- Dela ALDRIG din API-nyckel
- Rotera nyckeln om den läckt
- Sätt spending limits i OpenAI dashboard
