# Plan: Förbättringar av Ordregn-spelet

## 📊 Nulägesanalys

### Nuvarande Mekanik
- Visar ett ord (term) högst upp
- 3 fallande ord spawnas: 1 rätt (GRÖN) + 2 fel (RÖDA)
- 60 sekunders timer
- 3 liv
- +10 poäng för rätt, -5 för fel
- Random hastighet (0.5-1.0)

### ⚠️ Identifierade Problem
1. **För lätt** - Grön/röd färgkodning gör att man inte behöver lära sig orden
2. **Ingen progression** - Samma svårighetsgrad hela tiden
3. **Begränsad variation** - Endast ett sätt att spela
4. **Ingen anpassning** - Fokuserar inte på svåra ord
5. **Minimal återkoppling** - Inte tydligt vad man gjorde fel

---

## 🎯 Föreslagna Förbättringar

### A. Svårighetsgrader

#### 1. LÄTT (Nybörjare)
**Syfte:** Introducera spelet, bygga självförtroende
```typescript
{
  numWords: 3,              // 1 rätt + 2 fel
  speed: { min: 0.3, max: 0.6 },
  timeLimit: 90,            // Längre tid
  colorCoding: true,        // GRÖN = rätt, RÖD = fel
  collisionRadius: 20,      // Större träffyta
  lives: 5,                 // Fler liv
  hints: 3                  // Kan eliminera fel svar
}
```
**Pedagogik:** Eleven lär sig spelet och kopplar ord till färger först

#### 2. MEDEL (Standard) ⭐ Rekommenderad för lärande
**Syfte:** Verkligt lärande - måste känna igen orden
```typescript
{
  numWords: 4,              // 1 rätt + 3 fel
  speed: { min: 0.5, max: 0.9 },
  timeLimit: 60,
  colorCoding: false,       // ALLA ord samma färg (blå/vit)
  collisionRadius: 15,
  lives: 3,
  hints: 1
}
```
**Pedagogik:** Eleven MÅSTE kunna orden - ingen visuell hjälp

#### 3. SVÅR (Utmaning)
**Syfte:** Testa verklig behärskning
```typescript
{
  numWords: 5,              // 1 rätt + 4 fel
  speed: { min: 0.7, max: 1.3 },
  timeLimit: 45,
  colorCoding: false,
  collisionRadius: 12,      // Mindre träffyta
  lives: 2,
  hints: 0
}
```
**Pedagogik:** Måste känna orden perfekt under press

---

### B. Spellägen

#### 1. 📚 ÖVNINGSLÄGE (Practice Mode)
**Fokus:** Lärande utan stress
- ⏱️ **Ingen timer** - ta den tid du behöver
- ❤️ **Obegränsade liv** - inget straff
- 📊 **Detaljerad feedback** efter varje ord:
  - Rätt/fel
  - Rätt svar om fel
  - Antal försök på detta ord
- 📝 **Sammanfattning** i slutet:
  - Lista över fel svar med rätta översättningar
  - "Ord att öva på" lista
- 🔄 **Repetera fel ord** direkt efter session

**Användning:** Första gången med ett nytt ordpaket

#### 2. 🎮 KLASSISKT LÄGE (Classic Mode) - Nuvarande
**Fokus:** Balans mellan lärande och utmaning
- ⏱️ 60 sekunder
- ❤️ 3 liv
- 📈 Poäng: +10 rätt, -5 fel
- 🎯 Mix av alla ord i paketet

**Användning:** Standard spelläge

#### 3. ⚡ SPRINT-LÄGE (Sprint Mode)
**Fokus:** Snabbhet och reflexer
- ⏱️ **30 sekunder** - så många ord som möjligt
- ❤️ **Inga liv** - bara fortsätt
- 📈 Poäng: +15 per rätt
- ⚡ **Hastigheten ökar** gradvis
- 🔥 **Combo-bonus:** +5 extra för varje streak (3, 6, 9...)

**Användning:** När man behärskar orden och vill testa hastighet

#### 4. 🏆 UTMANINGSLÄGE (Challenge Mode)
**Fokus:** Perfektionism
- ❌ **Ett fel = Game Over**
- ⏱️ 45 sekunder
- 📈 Poäng: +20 per rätt
- 🔥 **Streak-multiplier:** x2 efter 5, x3 efter 10, x4 efter 15
- 🏅 **Leaderboard** - spara högsta streak

**Användning:** För elever som vill utmana sig själva

#### 5. 🛡️ SURVIVAL-LÄGE (Survival Mode)
**Fokus:** Uthållighet
- ⏱️ **Ingen timer** - fortsätt så länge du kan
- ❤️ 3 liv att börja med
- ⚡ **Hastigheten ökar** var 10:e ord
- ⭐ **Tjäna extra liv:** 10 rätt i rad = +1 liv (max 5)
- 📊 **Mål:** Hur många ord kan du klara?

**Användning:** Långsiktigt lärande, testa uthållighet

---

### C. Smartare Ordval (AI-baserad Repetition)

#### Mastery System
```typescript
interface WordMastery {
  wordId: string;
  attempts: number;        // Totalt antal gånger visat
  correct: number;         // Antal rätt
  lastAttempt: Date;
  streak: number;          // Antal rätt i rad
  mastery: number;         // 0-100% (correct/attempts * 100)
}
```

#### Viktad Slumpval
- **Nya ord** (aldrig visats): 30% chans
- **Svaga ord** (<60% mastery): 50% chans
- **Behärskade ord** (>80% mastery): 20% chans

#### Återkoppling
- Efter varje ord: Visa mastery-bar för det ordet
- I huvudmenyn: "Ord som behöver övas" lista
- Statistik per ordpaket: Vilka ord är svårast för eleven?

---

### D. Förbättrad Feedback & UI

#### Under Spelet
1. **Ta bort grön/röd färgkodning** (Medel/Svår):
   - Alla ord i neutral färg (blå/lila/vit)
   - Endast efter man tagit ordet: Grön flash = rätt, Röd flash = fel

2. **Visual Feedback**:
   ```
   Rätt svar:
   - ✅ Grön flash på hela skärmen
   - 🎊 Konfetti-effekt
   - ⬆️ Score flyger upp (+10)
   - 🔊 "Ding!" ljud

   Fel svar:
   - ❌ Röd flash
   - 📝 Popup: "Rätt svar: [ordet]"
   - ⬇️ Lives minskar med animation
   - 🔊 "Bonk" ljud
   ```

3. **Combo System**:
   ```
   3 rätt i rad: "Bra jobbat! 🔥"
   5 rätt i rad: "Streak! x2 poäng! 🔥🔥"
   10 rätt i rad: "FANTASTISKT! x3 poäng! 🔥🔥🔥"
   ```

4. **Hints-knapp** (Lätt-läge):
   - Eliminerar ett fel svar
   - Max 3 per spel
   - Kostar -5 poäng

#### Efter Spelet
```
┌─────────────────────────────────────┐
│        SPELRESULTAT                 │
├─────────────────────────────────────┤
│  Poäng:          150                │
│  Rätt svar:      18/25  (72%)      │
│  Längsta streak: 8                  │
│  Tid:            45s                │
├─────────────────────────────────────┤
│  FÖRBÄTTRINGSOMRÅDEN                │
│  ❌ cat → katt      (missade 2x)   │
│  ❌ dog → hund      (missade 1x)   │
│  ❌ house → hus     (missade 2x)   │
├─────────────────────────────────────┤
│  [ Öva dessa ord ]  [ Spela igen ] │
│  [ Dela resultat ]  [ Tillbaka ]   │
└─────────────────────────────────────┘
```

---

### E. Settings-skärm (Före spel)

```
┌─────────────────────────────────────┐
│    INSTÄLLNINGAR                    │
├─────────────────────────────────────┤
│  Svårighetsgrad:                    │
│  ○ Lätt  ◉ Medel  ○ Svår           │
│                                     │
│  Spelläge:                          │
│  ▼ Klassiskt                        │
│    - Övning                         │
│    - Sprint                         │
│    - Utmaning                       │
│    - Survival                       │
│                                     │
│  Ordval:                            │
│  ◉ Fokusera på svåra ord           │
│  ○ Slumpmässig ordning             │
│  ○ Ordning från paketet            │
│                                     │
│  ☑ Ljudeffekter                    │
│  ☐ Musik                           │
│  ☐ Skärmskak                       │
│                                     │
│  [ Starta spel ]                   │
└─────────────────────────────────────┘
```

---

## 🔧 Teknisk Implementation

### 1. Filstruktur
```
src/pages/motion-learn/games/
├── OrdregnGame.tsx               # Main game component
├── components/
│   ├── GameSettings.tsx          # Settings screen
│   ├── GameHUD.tsx              # UI overlays (score, lives, etc)
│   ├── FallingWord.tsx          # Individual word component
│   ├── GameResults.tsx          # End screen
│   └── ReviewModal.tsx          # Wrong answers review
├── hooks/
│   ├── useGameConfig.ts         # Config based on difficulty/mode
│   ├── useWordSelection.ts      # Smart word selection
│   └── useMasteryTracking.ts   # Track word mastery
├── types/
│   └── game-types.ts            # Interfaces
└── constants/
    └── game-configs.ts          # Difficulty & mode configs
```

### 2. Nya Interfaces
```typescript
// game-types.ts
type Difficulty = 'easy' | 'medium' | 'hard';
type GameMode = 'practice' | 'classic' | 'sprint' | 'challenge' | 'survival';

interface GameConfig {
  numWords: number;
  speed: { min: number; max: number };
  timeLimit: number | null;
  colorCoding: boolean;
  collisionRadius: number;
  lives: number;
  hints: number;
}

interface GameSettings {
  difficulty: Difficulty;
  gameMode: GameMode;
  wordOrder: 'smart' | 'random' | 'sequential';
  soundEnabled: boolean;
  musicEnabled: boolean;
  screenShake: boolean;
}

interface WordMastery {
  wordId: string;
  attempts: number;
  correct: number;
  incorrect: number;
  lastAttempt: string;
  streak: number;
  mastery: number; // 0-100
}

interface GameSession {
  // ... existing fields ...
  difficulty: Difficulty;
  gameMode: GameMode;
  wrongAnswers: Array<{
    term: string;
    definition: string;
    userAnswer: string;
  }>;
  longestStreak: number;
  masteryChanges: Record<string, number>; // wordId -> mastery change
}
```

### 3. Implementation Plan

#### Phase 1: Settings & Difficulty
1. Create `GameSettings.tsx` component
2. Add difficulty configs in `game-configs.ts`
3. Modify `OrdregnGame.tsx` to accept settings
4. **Remove color coding** when not in easy mode

#### Phase 2: Word Mastery System
1. Create `useMasteryTracking.ts` hook
2. Store mastery data in localStorage
3. Implement weighted word selection
4. Show mastery in UI

#### Phase 3: Game Modes
1. Implement each mode's specific logic
2. Adjust scoring/lives based on mode
3. Add mode-specific UI elements

#### Phase 4: Feedback System
1. Add visual feedback (flashes, particles)
2. Create `GameResults.tsx` with detailed stats
3. Create `ReviewModal.tsx` for wrong answers
4. Add sound effects (optional)

#### Phase 5: Polish
1. Combo system
2. Hints button (easy mode)
3. Leaderboards (challenge mode)
4. Share results feature

---

## 📱 Mobile Considerations

- Touch-based alternative for tablets (tap words instead of hand tracking)
- Simplified UI for smaller screens
- Portrait mode support

---

## 🎓 Pedagogiska Fördelar

1. **Adaptiv Inlärning:** Fokuserar automatiskt på svåra ord
2. **Progressionssystem:** Elever ser sin utveckling
3. **Variation:** Olika spellägen håller det intressant
4. **Låg tröskel, högt tak:** Lätt att komma igång, svårt att bemästra
5. **Omedelbar återkoppling:** Lär av misstag direkt
6. **Repetition utan tristess:** Gamification gör repetition rolig

---

## 🚀 Prioriterad Implementationsordning

### MUST HAVE (Fas 1) ✅
1. Settings-skärm med svårighetsval
2. Ta bort grön/röd färg på Medel/Svår
3. Övningsläge (ingen timer, obegränsade liv)
4. Förbättrad slutskärm med fel-lista

### SHOULD HAVE (Fas 2) ⭐
1. Mastery tracking system
2. Smart ordval baserat på mastery
3. Sprint-läge
4. Combo system med visuell feedback

### NICE TO HAVE (Fas 3) 💫
1. Challenge mode med leaderboard
2. Survival mode
3. Ljudeffekter och musik
4. Hints-system
5. Particle effects & screen shake
6. Touch-kontroller för tablets

---

## ❓ Frågor att Diskutera

1. **Vilken svårighetsgrad ska vara default?**
   - Förslag: Medel (verkligt lärande)
   - Eller: Låt användaren välja första gången och spara preference

2. **Ska vi ha musik?**
   - Kan vara distraherande för vissa
   - Förslag: Av som default, men kan aktiveras

3. **Hints-systemet:**
   - Ska det kosta poäng?
   - Endast för Lätt-läge?

4. **Leaderboards:**
   - Lokal (localStorage) eller global (Firestore)?
   - Per ordpaket eller generellt?

5. **Mobile/tablet:**
   - Ska vi göra en touch-version nu eller senare?
   - Krävs det för din målgrupp?

---

## 📝 Nästa Steg

1. **Diskussion:** Gå igenom planen tillsammans
2. **Prioritera:** Välj vilka features vi börjar med
3. **Beslut:** Ta beslut om frågorna ovan
4. **Implementation:** Börja med Fas 1

---

**Sammanfattning:**
Vi förbättrar Ordregn genom att lägga till svårighetsgrader (där Medel+ tar bort färgkodning), flera spellägen för olika lärsituationer, ett smart mastery-system som fokuserar på svåra ord, och mycket bättre feedback för eleven. Detta gör spelet både roligare OCH mer pedagogiskt effektivt! 🎮📚
