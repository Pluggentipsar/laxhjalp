/**
 * Enkel testscript för att verifiera API endpoints
 * Kör: node test-api.js
 */

const API_BASE = 'http://localhost:3001/api';

async function testEndpoint(name, endpoint, body) {
  try {
    console.log(`\n🧪 Testar: ${name}`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Fel: ${response.status} - ${error}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Success!`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
    return true;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Startar API-tester...\n');
  console.log('⚠️  OBS: Backend måste köra på port 3001');
  console.log('⚠️  OBS: OPENAI_API_KEY måste vara konfigurerad i .env\n');

  // Test health check
  try {
    const health = await fetch('http://localhost:3001/health');
    const data = await health.json();
    console.log('💚 Health check:', data);
  } catch (error) {
    console.log('❌ Backend svarar inte! Starta med: npm run dev');
    process.exit(1);
  }

  const testContent = `
Fotosyntesen är processen där växter omvandlar ljusenergi från solen till kemisk energi i form av glukos.
Detta sker i växtens kloroplaster med hjälp av klorofyll, som ger växter deras gröna färg.
Växter tar upp koldioxid från luften och vatten från jorden.
Med hjälp av solljus kombineras dessa för att skapa glukos och syre.
Syret släpps ut i luften som en biprodukt, vilket är viktigt för alla levande varelser.
  `.trim();

  // Test flashcard generation
  await testEndpoint(
    'Flashcard-generering',
    `${API_BASE}/generate/flashcards`,
    {
      content: testContent,
      count: 3,
      difficulty: 'medium',
      grade: 5
    }
  );

  // Test quiz generation
  await testEndpoint(
    'Quiz-generering',
    `${API_BASE}/generate/quiz`,
    {
      content: testContent,
      count: 2,
      difficulty: 'medium',
      grade: 5
    }
  );

  // Test concepts generation
  await testEndpoint(
    'Begrepp-generering',
    `${API_BASE}/generate/concepts`,
    {
      content: testContent,
      count: 3,
      grade: 5
    }
  );

  // Test chat
  await testEndpoint(
    'Chat (RAG)',
    `${API_BASE}/chat`,
    {
      materialContent: testContent,
      messages: [],
      userMessage: 'Vad är fotosyntesen?',
      grade: 5
    }
  );

  console.log('\n✨ Alla tester klara!\n');
}

runTests().catch(console.error);
