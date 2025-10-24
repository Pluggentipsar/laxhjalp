## Spelplan för studieappen

### Generell innehållsprocess (gäller alla spel)
- **Källa:** valt material → befintliga flashcards/begrepp.
- **Om inget finns:** kör snabb generator (från foto/PDF/text) som plockar ut begrepp + korta definitioner, föreslår semantiskt rimliga distraktorer och låter eleven godkänna/redigera innan spelet startar.
- **Kvalitetssäkring:** deduplicering, förenklade formuleringar vid behov (lättläst) samt språkval (sv/eng/es).
- **Fel-bank:** felaktiga svar sparas och prioriteras i framtida spel/övningar.

### 1. Snake – ”Ät rätt begrepp” (Uni/Multi)
- **Mål:** styr ormen till korrekt begrepp utifrån en förklaring högst upp.
- **Innehåll:** 1 förklaring → 3–5 ord på planen (1 rätt + 2–4 semantiska distraktorer).
- **Poäng/svårighet:** ökad fart efter 2 rätt i rad; sänks vid miss. Lugn-läge utan timer.
- **Feedback:** kort förklaring efter ”bett” + ”Visa exempel i vardagen”.
- **Källa:** begrepps-set från material; auto-genereras om saknas.

#### Snake – implementeringsplan
1. **Förberedelser & datalager**
   - Skapa `prepareGameContent(materialId, options)` i nytt `gameService`.
   - Läs in flashcards/begrepp från store; om saknas, trigga generator (AI-endpoint) och presentera förhandsgranskning.
   - Deduplicera, förenkla formuleringar vid behov, stöd språkval, returnera `{ term, definition, distractors[], difficulty }`.
   - Spara missar via `addToMistakeBank(materialId, term)` för framtida viktning.
2. **Routing & sida**
   - Lägg till route `study/material/:id/game/snake`.
   - Skapa `SnakeGamePage` med layout, Intro-modal och sammanfattning.
   - Hämta speldata via `prepareGameContent`, hantera loading/error och språkval.
3. **Spelstatus & logik**
   - Implementera state (Zustand slice eller reducer) för: ormposition, riktning, fart, nuvarande fråga, poäng, streak, liv.
   - Implementera viktad termslump (prioritera felbank).
   - Bygg tick-loop med `requestAnimationFrame`, anpassa fart beroende på streak/miss/Lugn-läge.
4. **Rendering & kontroll**
   - Skapa `SnakeGameCanvas` (canvas eller grid) med render av orm och mål.
   - Lägg till input: tangentbord, on-screen knappar, touch-swipe.
   - Kollisionslogik för korrekt/fel; visa direkt feedback-popup med exempel.
5. **HUD & UI-komponenter**
   - `SnakeGameHUD` visar definition, rond x/total, fart, poäng, streak, lägesval.
   - `SnakeGameSummary` visar resultat, felbankposter, nästa steg (”Spela igen”, ”Whack-a-Term”).
6. **Testning & telemetri**
   - Enhetstest `prepareGameContent`.
   - Integrations-/speltest: simulera tickar och kollisionsutfall.
   - Eventloggar: `snake_round_result`, `snake_speed_change`, `snake_example_clicked`.

### 2. Whack-a-Term – ”Slå rätt begrepp” (Uni)
- **Mål:** tryck på rätt ord när det ”poppar upp” utifrån kort definition i topp.
- **Variation:** ibland ord→definition, ibland definition→ord (bidirectional recall).
- **Tempo:** tidsfönster som hinner läsas; justeras adaptivt.
- **Fel-bank:** två missar på samma begrepp flaggar ”svårt”.
- **Källa:** flashcards/begrepp; auto-generator vid behov.

### 3. Memory / Parjakt – ”Matcha par” (Uni→Rel)
- **Mål:** vänd kort och para begrepp ↔ förklaring (eller ord ↔ bild, orsak ↔ verkan).
- **Progression:** börja med få par; öka gradvis och blanda par-typer.
- **Efterrunda:** ”Säg/skriv en egen mening med begreppet.”
- **Källa:** begrepp, definitioner, ev. ikon/bild; genereras om saknas.

### 4. Sambandsspelet – ”Bygg kedjan” (Relationell)
- **Mål:** dra pilar mellan begrepp för orsak–verkan eller del–helhet.
- **Hints:** steg 1 markerar möjliga noder; steg 2 ber om motivering (”Varför hör de ihop?”).
- **Feedback:** minimal grön/röd + kort AI-förklaring.
- **Källa:** begrepp + möjliga samband härledda från material; föreslås/genereras.

### 5. Time Attack – ”10 på 60 sek” (Uni/Multi)
- **Mål:** snabba en-radersfrågor med 3 alternativ.
- **Lägen:** Hastighet (timer) eller Fokus (utan timer).
- **Blandning:** interleavar nya + äldre kort (spacing).
- **Källa:** flashcards/begrepp; genereras vid behov.

### 6. Boss-quiz – ”Slå kunskapsbossen” (Rel → Utv. abstrakt)
- **Mål:** besegra ”bossen” genom att svara rätt på en trappa: fakta → samband → tillämpning.
- **Poäng:** belöna resonemang (inte bara hastighet).
- **Stöd:** modell-svar i början; fasa ut (fading).
- **Källa:** frågor från materialets kort + AI-skapade relationella/tillämpningsfrågor.

### 7. Begreppsbygget – ”Bygg en förklaring” (Rel/Utv. abstrakt)
- **Mål:** drag-&-släpp ord/fraser till korrekt mening/förklaring, därefter skriva egen variant.
- **Feedback:** markerar felplacerade bitar + kort ledtråd.
- **Källa:** begrepp + mallmeningar genererade från materialet.
