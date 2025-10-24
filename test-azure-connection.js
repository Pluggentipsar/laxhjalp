/**
 * Test Azure OpenAI connection
 */
import { AzureOpenAI } from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server/.env' });
dotenv.config();

console.log('🔍 Testing Azure OpenAI connection...\n');

// Print configuration (hiding sensitive parts)
console.log('Configuration:');
console.log(`  Endpoint: ${process.env.AZURE_OPENAI_ENDPOINT}`);
console.log(`  API Version: ${process.env.AZURE_API_VERSION || '2024-12-01-preview'}`);
console.log(`  Deployment: ${process.env.AZURE_DEPLOYMENT_NAME || 'gpt-5-mini'}`);
console.log(`  API Key: ${process.env.AZURE_OPENAI_KEY ? '***' + process.env.AZURE_OPENAI_KEY.slice(-4) : 'MISSING'}\n`);

// Check if all required variables are present
const missing = [];
if (!process.env.AZURE_OPENAI_KEY) missing.push('AZURE_OPENAI_KEY');
if (!process.env.AZURE_OPENAI_ENDPOINT) missing.push('AZURE_OPENAI_ENDPOINT');

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

// Initialize client
const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, ''), // Remove trailing slash
  apiVersion: process.env.AZURE_API_VERSION || '2024-12-01-preview',
});

console.log('✓ Client initialized\n');

// Test with a simple request
console.log('📡 Sending test request...');

const deploymentName = process.env.AZURE_DEPLOYMENT_NAME || 'gpt-5-mini';

try {
  const completion = await client.chat.completions.create({
    model: deploymentName,
    messages: [
      {
        role: 'user',
        content: 'Say "Hello from Azure OpenAI!" and nothing else.'
      }
    ],
    max_tokens: 20
  });

  console.log('✅ Success!\n');
  console.log('Response:', completion.choices[0].message.content);
  console.log('\nFull response metadata:');
  console.log(`  Model: ${completion.model}`);
  console.log(`  Tokens used: ${completion.usage.total_tokens}`);

} catch (error) {
  console.error('❌ Request failed!\n');

  if (error.status === 404) {
    console.error('Error: 404 Not Found');
    console.error('\nPossible causes:');
    console.error(`  1. Deployment "${deploymentName}" doesn't exist in your Azure OpenAI resource`);
    console.error('  2. Wrong endpoint URL');
    console.error('\nTo fix:');
    console.error('  - Check your Azure Portal: https://portal.azure.com/');
    console.error('  - Navigate to your Azure OpenAI resource');
    console.error('  - Go to "Model deployments" or "Deployments"');
    console.error('  - Verify the exact deployment name');
    console.error(`  - Update AZURE_DEPLOYMENT_NAME in Scalingo (currently: "${deploymentName}")`);
  } else if (error.status === 401) {
    console.error('Error: 401 Unauthorized');
    console.error('  - Check that your API key is correct');
    console.error('  - Verify the key hasn\'t expired');
  } else if (error.status === 429) {
    console.error('Error: 429 Too Many Requests');
    console.error('  - You\'ve hit rate limits');
    console.error('  - Wait a moment and try again');
  } else {
    console.error('Error details:');
    console.error(`  Status: ${error.status}`);
    console.error(`  Message: ${error.message}`);
    if (error.error) {
      console.error(`  Error object:`, JSON.stringify(error.error, null, 2));
    }
  }

  process.exit(1);
}
