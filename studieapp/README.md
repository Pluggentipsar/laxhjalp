# Studieapp - Modern Studiehjälp för Barn och Unga

En vänlig och tillgänglig app för elever i årskurs 2-9 att studera sina ämnen på ett roligt och effektivt sätt.

## Funktioner (MVP)

### Kärna
- **Onboarding** - Välj årskurs, ämnen och sätt mål
- **Material** - Importera och organisera studiematerial
- **Studera** - Flashcards med spaced repetition, Quiz, Chattförhör
- **Spel** - Lär dig genom roliga minispel
- **Progression** - XP, nivåer, streaks och badges

### Tillgänglighet
- Text-till-tal (TTS)
- Dyslexi-vänligt läge
- Hög kontrast
- Touch-vänlig (44x44px touch targets)
- Tangentbordsnavigation

## Tech Stack

- **React 18** + TypeScript
- **Vite** - Snabb development
- **TailwindCSS** - Modern styling
- **Zustand** - State management
- **Dexie.js** - IndexedDB för lokal lagring
- **Framer Motion** - Animationer
- **React Router** - Navigation
- **Lucide React** - Ikoner

### Funktionalitet
- **Tesseract.js** - OCR (bild → text)
- **PDF.js** - PDF-hantering
- **Web Speech API** - Text-till-tal

## Kom igång

```bash
# Installera dependencies
npm install

# Starta development server
npm run dev

# Bygg för produktion
npm run build
```

## Projektstruktur

```
src/
├── components/
│   ├── common/          # Återanvändbara komponenter (Button, Card, etc)
│   ├── layout/          # Layout-komponenter (BottomNav, MainLayout)
│   ├── onboarding/      # Onboarding-flöde
│   ├── material/        # Material-hantering
│   ├── study/           # Studielägen (Flashcards, Quiz, etc)
│   ├── games/           # Minispel
│   └── profile/         # Profil och inställningar
├── pages/               # Huvudsidor
├── store/               # Zustand state management
├── lib/                 # Database och utilities
├── types/               # TypeScript types
└── utils/               # Helper-funktioner
```

## API Integration (Kommande)

Appen är förberedd för AI-integration via:
- OpenAI API / Anthropic Claude API
- För: Auto-generering av flashcards, frågor, begrepp, mindmaps, chattförhör

Konfigurera API-nycklar i `.env`:
```
VITE_OPENAI_API_KEY=your_key_here
# eller
VITE_ANTHROPIC_API_KEY=your_key_here
```

## Roadmap

### v1.0 (MVP) - Klar
- [x] Onboarding
- [x] Material-organisation
- [x] Flashcards med spaced repetition
- [x] Quiz-läge
- [x] XP/Streak/Badges-system
- [x] Profil och inställningar
- [ ] Import (foto/PDF/text) med OCR
- [ ] Chattförhör (UI klar, väntar på API)
- [ ] Läsläge med TTS

### v1.1
- [ ] Mindmaps
- [ ] Minispel (Snake, Memory, Whack-a-term)
- [ ] AI-generering av innehåll

### v1.2
- [ ] Föräldra-/lärarvy
- [ ] Export/utskrifter
- [ ] Molnbackup

## Licens

Privat projekt
