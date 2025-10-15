# Azure OpenAI Setup Guide

Backend är nu konfigurerad för att fungera med **Azure OpenAI** istället för standard OpenAI API.

## Vad du behöver från Azure

### 1. Azure OpenAI Resource
Du verkar redan ha detta baserat på din endpoint: `https://tankomchattbot.openai.azure.com/`

### 2. Deployments

Du behöver **två** deployments i Azure OpenAI Studio:

#### a) Chat Completion Deployment
- **Model:** GPT-4o, GPT-4o-mini, eller GPT-4
- **Deployment Name:** `gpt-5-mini` (eller vad du vill)
- Används för: Flashcards, Quiz, Concepts, Chat

#### b) Embeddings Deployment
- **Model:** text-embedding-3-small eller text-embedding-ada-002
- **Deployment Name:** `text-embedding-3-small` (eller vad du vill)
- Används för: RAG (chat med dokumentkontext)

### 3. API-nyckel

Finns under **Keys and Endpoint** i din Azure OpenAI resource.

## Konfiguration

### Lägg till i `.env`

Öppna [.env](.env) och fyll i:

```bash
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://tankomchattbot.openai.azure.com/
AZURE_OPENAI_KEY=din-azure-api-nyckel-här
AZURE_API_VERSION=2024-12-01-preview
AZURE_DEPLOYMENT_NAME=gpt-5-mini
AZURE_EMBEDDING_DEPLOYMENT=text-embedding-3-small
```

**OBS:** Ändra deployment-namnen om du har andra i Azure.

## Kontrollera dina Deployments

### I Azure Portal:

1. Gå till din Azure OpenAI resource
2. Öppna **Azure OpenAI Studio**
3. Gå till **Deployments**
4. Verifiera att du har:
   - ✅ En chat model deployment (GPT-4/4o/4o-mini)
   - ✅ En embeddings model deployment

### Exempel på korrekt setup:

| Deployment Name | Model | Use Case |
|-----------------|-------|----------|
| gpt-5-mini | gpt-4o-mini | Chat, Flashcards, Quiz |
| text-embedding-3-small | text-embedding-3-small | RAG Embeddings |

**Om du inte har embeddings-deployment:**

1. Gå till Deployments → Create new deployment
2. Välj `text-embedding-3-small` eller `text-embedding-ada-002`
3. Namnge den (t.ex. `text-embedding-3-small`)
4. Deploy

## Kör backend

```bash
cd server
npm run dev
```

**Förväntat output:**
```
✓ Använder Azure OpenAI
🚀 Backend server körs på port 3001
📝 Frontend URL: http://localhost:5173
```

Om du ser "✓ Använder Azure OpenAI" betyder det att konfigurationen är korrekt!

## Testa Azure-kopplingen

```bash
cd server
node test-api.js
```

Om allt fungerar ska du se:
- ✅ Health check
- ✅ Flashcard-generering
- ✅ Quiz-generering
- ✅ Begrepp-generering
- ✅ Chat (RAG)

## Felsökning

### "Använder OpenAI" istället för "Använder Azure OpenAI"

**Problem:** Backend hittar inte Azure-konfigurationen.

**Lösning:**
1. Kolla att `.env` finns i `studieapp/` (INTE i `server/`)
2. Verifiera att `AZURE_OPENAI_ENDPOINT` är satt
3. Starta om backend-servern

### "404 - Resource not found"

**Problem:** Deployment-namnet är fel.

**Lösning:**
1. Gå till Azure OpenAI Studio → Deployments
2. Kopiera exakt deployment-namn
3. Uppdatera `AZURE_DEPLOYMENT_NAME` i `.env`

### "401 - Unauthorized"

**Problem:** API-nyckeln är fel eller saknas.

**Lösning:**
1. Gå till Azure Portal → Din OpenAI resource → Keys and Endpoint
2. Kopiera KEY 1 eller KEY 2
3. Klistra in i `AZURE_OPENAI_KEY` i `.env`

### "Embeddings fel"

**Problem:** Ingen embeddings-deployment finns.

**Lösning:**
1. Skapa en embeddings-deployment i Azure (se ovan)
2. Uppdatera `AZURE_EMBEDDING_DEPLOYMENT` i `.env`

### API-version fel

Om du får felmeddelanden om API-version:

1. Kolla senaste version på: https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation
2. Uppdatera `AZURE_API_VERSION` i `.env`

## Fördelar med Azure OpenAI

✅ **Bättre säkerhet** - Data stannar i Europa (om du valt det)
✅ **Enterprise support** - SLA och support från Microsoft
✅ **Kostnadskontroll** - Lätt att sätta budgets och limits
✅ **Compliance** - GDPR-compliant
✅ **Stabilitet** - Färre rate limits problem

## Kostnad

Azure OpenAI prissättning varierar men generellt:

- **GPT-4o-mini:** ~$0.15 per 1M input tokens, ~$0.60 per 1M output
- **text-embedding-3-small:** ~$0.02 per 1M tokens

**Uppskattad kostnad för studieappen:**
- Aktiv elev (50 materials/månad): ~$2-5
- Utveckling/testning: ~$0.10-0.50

## Nästa steg

När Azure är konfigurerat:

1. ✅ Lägg till API-nyckel i `.env`
2. ✅ Verifiera deployment-namn
3. ✅ Starta backend (`npm run dev`)
4. ✅ Testa med test-scriptet
5. ✅ Starta frontend och testa i UI

Se [NEXT_STEPS.md](NEXT_STEPS.md) för hur du bygger frontend-komponenter!
