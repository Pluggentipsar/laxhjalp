#!/usr/bin/env node

/**
 * Build script för Scalingo deployment
 * Läser environment variables och skapar en temporär .env-fil
 * innan Vite-bygget körs
 */

import { writeFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('🔧 Förbereder build för Scalingo...');

// Skapa .env.production från environment variables
const envVars = [
  'VITE_API_URL',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID'
];

const envContent = envVars
  .map(key => {
    const value = process.env[key];
    if (value) {
      console.log(`✓ ${key} hittad`);
      return `${key}=${value}`;
    } else {
      console.warn(`⚠️  ${key} saknas - använder fallback`);
      return null;
    }
  })
  .filter(Boolean)
  .join('\n');

if (envContent) {
  writeFileSync('.env.production', envContent);
  console.log('✓ .env.production skapad');
} else {
  console.warn('⚠️  Inga VITE_* variabler hittades - bygger med defaults');
}

// Kör TypeScript-kompilering och Vite build
console.log('🏗️  Bygger applikationen...');
try {
  execSync('npx tsc -b && npx vite build', { stdio: 'inherit' });
  console.log('✅ Build klar!');
} catch (error) {
  console.error('❌ Build misslyckades:', error.message);
  process.exit(1);
}
