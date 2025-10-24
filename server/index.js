import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ocrRouter from './routes/ocr.js';
import generateRouter from './routes/generate.js';
import chatRouter from './routes/chat.js';

// Hitta .env i parent directory (studieapp/) - endast i development
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// I production (Scalingo) använder vi environment variables direkt
if (process.env.NODE_ENV !== 'production') {
  const envPath = join(__dirname, '../.env');
  const result = dotenv.config({ path: envPath });

  // Debug: visa om .env laddades
  if (result.error) {
    console.warn('⚠️  Ingen .env-fil hittades:', envPath);
    console.warn('   Förväntar environment variables från systemet');
  } else {
    console.log('✓ .env laddad från:', envPath);
  }
} else {
  console.log('✓ Production mode - använder systemets environment variables');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // För bilder i base64
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/ocr', ocrRouter);
app.use('/api/generate', generateRouter);
app.use('/api/chat', chatRouter);

// Serve static files from dist folder (production only)
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '../dist');
  console.log('📦 Serving static files from:', distPath);

  app.use(express.static(distPath));

  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
} else {
  // Development mode - API only
  // 404 handler for API routes only
  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint hittades inte' });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Något gick fel',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server körs på port ${PORT}`);
  console.log(`📝 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);

  // Kolla vilken AI-konfiguration som används
  const hasAzure = process.env.AZURE_OPENAI_KEY && process.env.AZURE_OPENAI_ENDPOINT;
  const hasOpenAI = process.env.OPENAI_API_KEY;

  if (hasAzure) {
    console.log(`🔑 Azure OpenAI: Konfigurerad ✓`);
    console.log(`   Endpoint: ${process.env.AZURE_OPENAI_ENDPOINT}`);
    console.log(`   Deployment: ${process.env.AZURE_DEPLOYMENT_NAME || 'gpt-5-mini'}`);
  } else if (hasOpenAI) {
    console.log(`🔑 OpenAI API: Konfigurerad ✓`);
  } else {
    console.log(`⚠️  Ingen API-nyckel konfigurerad!`);
    console.log(`   Lägg till AZURE_OPENAI_KEY i .env`);
  }
});
