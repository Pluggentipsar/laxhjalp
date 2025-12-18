# CLAUDE.md - Läxhjälp Studiehubb

## Projektöversikt

Läxhjälp är en svensk studiehubb/läxhjälpsapplikation för elever i årskurs 2-9. Appen hjälper elever att förstå och lära sig genom AI-stöd, interaktiva spel och pedagogiskt grundade metoder.

### Vision
- Aldrig ge direkta svar - alltid tvinga elever att tänka själva
- Grundat i pedagogik, didaktik, kognitionsvetenskap och learning science
- Personaliserat lärande baserat på intressen och nivå
- GDPR- och AI Act-kompatibelt

### Målgrupp
- Primärt: Elever lågstadiet-högstadiet (årskurs 2-9)
- Framtid: Gymnasieelever, lärare (lärarläge för materialdistribution)

---

## Tech Stack

### Frontend
- **React 19** + TypeScript 5.9
- **Vite 7** - Bundler och dev server
- **TailwindCSS 3.4** - Styling med anpassad färgpalett per ämne
- **Zustand 4.5** - State management med IndexedDB-persistens
- **React Router 7** - Routing
- **Framer Motion** - Animationer
- **Radix UI** - Tillgängliga UI-komponenter
- **Dexie.js 4** - IndexedDB-wrapper för lokal lagring
- **MediaPipe** - Hand/pose-tracking för motion learning

### Backend
- **Node.js/Express** - API-server (port 3001)
- **Azure OpenAI** (GPT-4o-mini) - AI-tjänster
- **Tesseract.js** - OCR
- **PDF.js** - PDF-hantering

### Databas & Lagring
- **Firebase Auth** - Autentisering (email/lösenord, Google OAuth)
- **Firestore** - Molnlagring för användarprofiler
- **IndexedDB (Dexie)** - Lokal offline-first lagring
- **localStorage** - Motion Learn-modulen (word packages, game sessions)

---

## Mappstruktur

```
src/
├── components/          # Återanvändbara React-komponenter
│   ├── chat/           # Chattlägen (sokratisk, äventyr, quiz, etc.)
│   ├── common/         # Delade UI-komponenter
│   ├── games/          # Spelkomponenter (Snake, Crossword, etc.)
│   ├── layout/         # Layout (BottomNav, MainLayout)
│   ├── material/       # Materialhantering
│   ├── motion-learn/   # Motion tracking-komponenter
│   ├── onboarding/     # Onboarding-flöde
│   ├── profile/        # Profilinställningar
│   ├── reading/        # Läsverktyg (TTS, läslinjal)
│   ├── study/          # Flashcards, quiz
│   └── subjects/       # Ämnesspecifika aktiviteter
├── pages/              # Sidkomponenter
│   ├── auth/           # Login/signup
│   ├── motion-learn/   # Motion learning-hub och spel
│   ├── study/          # Studielägen
│   └── subjects/       # Ämneshubbar
├── services/           # Affärslogik
│   ├── aiService.ts    # AI API-wrapper
│   ├── authService.ts  # Firebase Auth
│   ├── firebase.ts     # Firebase-konfiguration
│   ├── firestoreSync.ts # Molnsynkronisering
│   ├── gameService.ts  # Spellogik och poäng
│   ├── pedagogicalEngine.ts # Spaced repetition, adaptering
│   └── wordPackageService.ts # Ordpaket för motion learn
├── store/              # Zustand state (appStore.ts)
├── contexts/           # React contexts (AuthContext)
├── hooks/              # Custom hooks (useHandTracking, etc.)
├── types/              # TypeScript-typer
├── lib/                # Databas (db.ts - Dexie schema)
├── data/               # Statisk data och generatorer
└── utils/              # Hjälpfunktioner

server/
├── routes/             # API-routes
│   ├── generate.js     # AI-generering
│   ├── chat.js         # Chatthantering
│   └── ocr.js          # OCR-tjänst
└── services/           # Backend-tjänster
    ├── aiService.js    # OpenAI-integration
    ├── chatService.js  # Konversationshantering
    └── textService.js  # Textbearbetning
```

---

## Arkitekturmönster

### State Management
- **Zustand** för global state med automatisk IndexedDB-persistens
- **React Context** för autentisering (AuthContext)
- **Refs** för prestandakritiska spelloop

### Data Flow
```
Firebase Auth → Zustand Store → IndexedDB (lokal cache)
```

### Komponenter
- Funktionella komponenter med hooks
- Separation av presentation och logik via services
- Återanvändbara komponenter i `components/common/`

### Typsäkerhet
- Strikt TypeScript-konfiguration
- Omfattande typdefinitioner i `types/index.ts` (150+ typer)
- Undvik `any` - använd specifika typer

---

## Pedagogiska Principer

### Implementerade Metoder
- **SOLO Taxonomy** - Strukturerade lärandenivåer
- **Bloom's Taxonomy** - Kognitiva nivåer i frågeformulering
- **Spaced Repetition (SM-2)** - För flashcards och misstag
- **Scaffolding** - Adaptivt stöd baserat på prestation
- **Zone of Proximal Development** - Tracking av oberoende/assisterad nivå
- **Interleaving** - Blandad övning av koncept

### Kognitiv Profil
Systemet spårar per elev och ämne:
- SOLO/Bloom-nivå
- Framgångsgrad och självförtroende
- Lärstilspreferenser (visuell, konkret material, arbetat exempel)
- Metakognitiva färdigheter

### Misstakshantering
- Alla misstag sparas med kontext
- Spaced repetition för återkommande övning
- AI-genererade personaliserade förklaringar

---

## Kodkonventioner

### Namngivning
- **Komponenter**: PascalCase (`FlashcardView.tsx`)
- **Hooks**: camelCase med `use`-prefix (`useHandTracking.ts`)
- **Services**: camelCase (`aiService.ts`)
- **Typer**: PascalCase (`UserProfile`, `StudySession`)

### Filstruktur
- En komponent per fil
- Relaterade komponenter i samma mapp
- Index-filer för export vid behov

### Styling
- TailwindCSS utility classes
- Ämnesspecifika färger definierade i `tailwind.config.js`:
  - Svenska: pink (#FF6B9D)
  - Engelska: teal (#44A08D)
  - Matematik: purple (#764BA2)
  - Naturvetenskap: green (#56AB2F)
  - Samhällskunskap: orange (#ED8F03)
  - Idrott: red (#EE5A6F)

### Tillgänglighet
- Alla interaktiva element ska ha keyboard-stöd
- Använd Radix UI för tillgängliga komponenter
- Inbyggda klasser: `.dyslexia-friendly`, `.high-contrast`, `.easy-read`
- Minsta touch-target: 44x44px

---

## Utvecklingskommandon

```bash
# Starta frontend + backend
npm run dev:all

# Endast frontend (port 5173)
npm run dev

# Endast backend (port 3001)
npm start

# Bygg för produktion
npm run build

# Lint
npm run lint
```

---

## API-struktur

### Generering
- `POST /api/generate/flashcards` - Skapa flashcards
- `POST /api/generate/quiz` - Skapa quizfrågor
- `POST /api/generate/concepts` - Extrahera begrepp
- `POST /api/generate/simplify` - Förenkla text
- `POST /api/generate/deepen` - Fördjupa text
- `POST /api/generate/personalized-explain` - Personaliserad förklaring
- `POST /api/generate/math-questions` - Matteproblem

### Chat
- `POST /api/chat` - Konversationshantering (6 lägen)
- `POST /api/chat/embeddings` - Vektorer för RAG

### OCR
- `POST /api/ocr/image` - Bildtext-extraktion
- `POST /api/ocr/pdf` - PDF-extraktion

---

## Viktiga Filer

| Fil | Beskrivning |
|-----|-------------|
| `src/App.tsx` | Huvudrouter och app-orchestrering |
| `src/store/appStore.ts` | Central state management (24KB) |
| `src/types/index.ts` | Alla TypeScript-typer (17KB) |
| `src/lib/db.ts` | IndexedDB-schema (Dexie) |
| `src/services/aiService.ts` | Frontend AI-wrapper |
| `server/services/aiService.js` | Backend OpenAI-integration |
| `src/services/pedagogicalEngine.ts` | Pedagogisk logik |

---

## Framtida Utveckling

### Planerade Funktioner
- [ ] Text-till-tal och podcast-funktion
- [ ] Kalenderfunktion för läxplanering
- [ ] Fler ämneshubbar (Svenska, Engelska, SO, NO)
- [ ] Lärarläge för materialdistribution
- [ ] Fler spel (Memory, Boss-quiz, Time Attack)
- [ ] Gymnasie-specifik version

### Tekniska Migrationer
- [ ] **AI-infrastruktur**: Byta från Azure OpenAI till svensk inferens
- [ ] **Hosting**: EU-hosting för GDPR/AI Act-compliance
- [ ] **Databas**: EU-baserad databas

### Compliance-krav
- **GDPR**: Användardata ska kunna exporteras och raderas
- **AI Act**: Transparens om AI-användning, loggning av AI-beslut
- **Datalokalitet**: All data ska lagras inom EU

---

## Motion Learn Module

Fristående modul som inte kräver autentisering.

### Spel
- **Ordregn** - Fallande ord med handtracking
- **Whack-a-Word** - Slå ord med handgester
- **Goal Keeper** - Försvara mål med kroppsrörelser
- **Header Match** - Nicka rätt svar med huvudet

### Datalagring
Använder localStorage (ej Firebase):
- `wordPackageService.ts` för ordpaket
- `gameService.ts` för sessioner och highscores
- 6-teckenkoder för delning mellan användare

---

## Felsökning

### Vanliga Problem

**AI-tjänster fungerar inte**
- Kontrollera `.env` för `OPENAI_API_KEY` och Azure-credentials
- Fallback-mockdata aktiveras automatiskt

**IndexedDB-fel**
- Rensa webbläsarens indexedDB: DevTools > Application > IndexedDB
- Kontrollera schemaversionen i `src/lib/db.ts`

**Motion tracking fungerar inte**
- Kräver HTTPS eller localhost
- Ge kamerabehörighet
- MediaPipe-modeller laddas från CDN

---

## Kontributionsguide

1. Skapa feature-branch från `main`
2. Följ kodkonventionerna ovan
3. Testa lokalt med `npm run dev:all`
4. Kör `npm run lint` före commit
5. Skriv beskrivande commit-meddelanden på svenska eller engelska

---

## AI-promptar & Pedagogisk AI

### Promptstruktur

AI-tjänster finns i:
- `server/services/aiService.js` - Flashcards, quiz, concepts, aktivitetsfrågor
- `server/services/chatService.js` - Chattlägen
- `server/services/textService.js` - Textbearbetning, personalisering

### Nivåanpassning (Grade Levels)

| Nivå | Årskurs | Ålder | Fokus |
|------|---------|-------|-------|
| **Nivå 1** | ÅK 3 | 8-10 | Konkreta fakta, vem/vad/var/när |
| **Nivå 2** | ÅK 6 | 11-13 | Processer, orsaker, hur/varför |
| **Nivå 3** | ÅK 9 | 14-16 | Analys, komplexa koncept, perspektiv |

### Chattlägen (6 st)

1. **FREE** - Fri Q&A med RAG-stöd
2. **SOCRATIC** - Guidad upptäckt med frågor, aldrig direkta svar
3. **ADVENTURE** - Textäventyr med inbäddade koncept
4. **ACTIVE-LEARNING** - Teori + praktik sekvens
5. **QUIZ** - Flervalsfrågor med förklaringar
6. **DISCUSSION** - Kritiskt tänkande, perspektiv

### Prompt-principer

```javascript
// TABU-REGEL för definitioner
"Använd aldrig måltermen i beskrivningen"

// Active Recall
"Formulera frågor så eleven måste tänka aktivt"

// Atomicitet
"Varje flashcard fokuserar på ETT specifikt faktum"

// Uppmuntran
"Var alltid uppmuntrande och konstruktiv"
```

### Personalisering

**Makro-personalisering**: Omskrivning av hela texter med elevens intressen som tematiskt ramverk.

**Mikro-personalisering**: Förklaring av markerad text med analogier baserade på intressen.

**Principer**:
1. Pedagogik först - lärande är primärt
2. Faktamässig korrekthet - innehåll kompromissas aldrig
3. Naturlig integration - analogier vävs in sömlöst

### Temperature-inställningar

| Uppgift | Temperature | Anledning |
|---------|-------------|-----------|
| Betygsättning | 0.3 | Konservativ - precision |
| Textförenkling | 0.4 | Konservativ - faktakorrekthet |
| Flashcards/Quiz | 0.7 | Balanserad |
| Personaliserade exempel | 0.8 | Kreativ - analogier |

---

## Datamodeller

### IndexedDB Schema (Dexie v5)

```
materials        - Studiematerial med flashcards, quiz, concepts
folders          - Mappar för organisation
userProfile      - Användarprofil (singel)
studySessions    - Studiesessioner
gameSessions     - Spelsessioner
chatSessions     - Chattkonversationer per material+läge
dailyProgress    - Daglig framsteg (date som nyckel)
activityAttempts - Aktivitetsförsök med taxonomi
activityMistakes - Misstag för spaced repetition
cognitiveProfiles - Kognitiva profiler per ämne
textEmbeddings   - Vektorer för RAG
```

### Nyckeltyper

**Material**:
```typescript
{
  id, title, subject, folderId, tags,
  type: 'photo' | 'pdf' | 'text' | 'voice' | 'link',
  content: string,          // Huvudtext
  flashcards: Flashcard[],  // SM-2 spaced repetition
  questions: Question[],    // Quiz
  concepts: Concept[],      // Begrepp
  simplifiedContent?,       // Förenklad version
  advancedContent?          // Fördjupad version
}
```

**Flashcard (SM-2 Spaced Repetition)**:
```typescript
{
  id, front, back,
  interval: number,      // Dagar till nästa review
  easeFactor: number,    // 2.5 default
  repetitions: number,   // Lyckade reviews
  nextReview: Date
}
```

**ActivityMistake (Misstaksbank)**:
```typescript
{
  userId, questionId, conceptArea,
  question, userAnswer, correctAnswer,
  mistakeCount, needsReview,
  nextReviewAt, interval, easeFactor,  // SM-2
  personalizedExplanation?
}
```

**StudentCognitiveProfile**:
```typescript
{
  userId, subjectHub,
  conceptLevels: {
    [conceptArea]: {
      soloLevel, bloomLevel,
      confidence: 0-1,
      successRate: 0-1
    }
  },
  zpd: {
    independentLevel,  // Klarar själv
    assistedLevel,     // Klarar med hjälp
    targetLevel        // Mål
  }
}
```

### Firebase/Firestore

```
users/{userId}/
  materials/{materialId}
  folders/{folderId}
  studySessions/{sessionId}
  dailyProgress/{date}
```

**Sync-strategi**: Offline-first med IndexedDB, asynkron sync till Firestore.

---

## Testning

### Nuläge
Projektet saknar för närvarande en formell teststrategi. Detta är ett utvecklingsområde.

### Rekommenderad Framtida Struktur

```
src/
├── __tests__/           # Integrationstester
├── components/
│   └── ComponentName/
│       ├── ComponentName.tsx
│       └── ComponentName.test.tsx  # Enhetstester
```

### Föreslagna Verktyg
- **Vitest** - Snabb testrunner (kompatibel med Vite)
- **React Testing Library** - Komponenttester
- **MSW (Mock Service Worker)** - API-mocking
- **Playwright/Cypress** - E2E-tester

### Prioriterade Testområden
1. **Pedagogical Engine** - SM-2 algoritm, SOLO/Bloom-progression
2. **AI Service** - Prompt-formatering, JSON-parsing
3. **Game Logic** - Poängberäkning, collision detection
4. **Auth Flow** - Login/signup/onboarding

### Manuell Testning (nuvarande)
```bash
npm run dev:all  # Starta och testa lokalt
npm run lint     # Kodkvalitet
npm run build    # Byggfel
```
