# 🚀 Start Här - Azure OpenAI Edition

Backend är **klar och konfigurerad för Azure OpenAI**!

## Vad jag behöver från dig (5 minuter)

### 1. Azure OpenAI API-nyckel

**Var hittar jag den?**
1. Gå till [Azure Portal](https://portal.azure.com/)
2. Sök efter din OpenAI resource (`tankomchattbot`)
3. Klicka på **Keys and Endpoint** i vänstermenyn
4. Kopiera **KEY 1** eller **KEY 2**

**Lägg till i projektet:**
1. Öppna [.env](.env) i VS Code
2. Hitta raden: `AZURE_OPENAI_KEY=`
3. Klistra in din nyckel: `AZURE_OPENAI_KEY=din-nyckel-här`
4. Spara filen

### 2. Deployment-namn

**Vad är detta?**
I Azure OpenAI skapar du "deployments" av modeller. Varje deployment har ett namn.

**Kontrollera dina deployments:**
1. Gå till [Azure OpenAI Studio](https://oai.azure.com/)
2. Välj din resource (`tankomchattbot`)
3. Gå till **Deployments**
4. Kolla vad dina deployments heter

**Du behöver två deployments:**

#### a) Chat Model (för flashcards, quiz, etc)
- Model: GPT-4, GPT-4o, GPT-4o-mini, eller liknande
- Ditt deployment-namn: ?

**Om du redan har en:**
Uppdatera i [.env](.env):
```
AZURE_DEPLOYMENT_NAME=ditt-deployment-namn
```

**Om du INTE har en:**
1. I Azure OpenAI Studio → Deployments → Create new deployment
2. Välj en GPT-4 modell (GPT-4o-mini rekommenderas för lägsta kostnad)
3. Namnge den (t.ex. `gpt-5-mini` eller `gpt-4o-mini`)
4. Deploy
5. Uppdatera `.env` med namnet

#### b) Embeddings Model (för chat/RAG)
- Model: text-embedding-3-small eller text-embedding-ada-002
- Ditt deployment-namn: ?

**Om du redan har en:**
Uppdatera i [.env](.env):
```
AZURE_EMBEDDING_DEPLOYMENT=ditt-embedding-deployment-namn
```

**Om du INTE har en:**
1. I Azure OpenAI Studio → Deployments → Create new deployment
2. Välj `text-embedding-3-small`
3. Namnge den (t.ex. `text-embedding-3-small`)
4. Deploy
5. Uppdatera `.env` med namnet

### 3. Verifiera `.env`

Din [.env](.env) ska se ut ungefär så här:

```bash
# Backend Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://tankomchattbot.openai.azure.com/
AZURE_OPENAI_KEY=123abc...din-riktiga-nyckel...xyz789
AZURE_API_VERSION=2024-12-01-preview
AZURE_DEPLOYMENT_NAME=gpt-5-mini
AZURE_EMBEDDING_DEPLOYMENT=text-embedding-3-small
```

## Starta projektet

### Terminal 1 - Backend
```bash
cd server
npm run dev
```

**Förväntat:**
```
✓ Använder Azure OpenAI
🚀 Backend server körs på port 3001
```

Om du ser "✓ Använder Azure OpenAI" är allt rätt konfigurerat!

### Terminal 2 - Frontend
```bash
npm run dev
```

**Förväntat:**
```
➜  Local: http://localhost:5173/
```

## Testa att det fungerar

### Snabbtest (i terminal):
```bash
cd server
node test-api.js
```

Om du får ✅ på alla endpoints fungerar allt!

### Test i UI:
1. Öppna http://localhost:5173
2. Gå till Material
3. Skapa nytt material med lite text
4. Prova generera flashcards/quiz

## Hjälp! Det fungerar inte?

### "Använder OpenAI" istället för "Använder Azure OpenAI"
- Kolla att `AZURE_OPENAI_ENDPOINT` är ifylld i `.env`
- Starta om backend-servern

### "404 - Resource not found"
- Deployment-namnet är fel
- Gå till Azure OpenAI Studio och kolla exakt namn
- Uppdatera `.env`

### "401 - Unauthorized"
- API-nyckeln är fel
- Kopiera ny nyckel från Azure Portal
- Uppdatera `AZURE_OPENAI_KEY` i `.env`

### "Cannot find deployment"
- Du saknar embeddings-deployment
- Skapa en enligt steg 2b ovan

## Detaljerad dokumentation

- [AZURE_SETUP.md](AZURE_SETUP.md) - Fullständig Azure-guide
- [NEXT_STEPS.md](NEXT_STEPS.md) - Nästa steg för utveckling
- [AI_SETUP.md](AI_SETUP.md) - Allmän AI-setup

## Sammanfattning - Vad du behöver göra:

1. [ ] Hitta din Azure OpenAI API-nyckel
2. [ ] Lägg till nyckeln i `.env`
3. [ ] Kontrollera deployment-namn i Azure
4. [ ] Uppdatera deployment-namn i `.env`
5. [ ] Starta backend (`cd server && npm run dev`)
6. [ ] Verifiera att du ser "✓ Använder Azure OpenAI"
7. [ ] Starta frontend (`npm run dev`)
8. [ ] Testa i browser!

**Redo? Kör igång! 🚀**

Fråga om något är oklart!
