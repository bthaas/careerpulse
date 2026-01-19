import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

console.log('📋 Listing available Gemini models...\n');

try {
  const models = await genAI.listModels();
  
  console.log(`Found ${models.length} models:\n`);
  
  for (const model of models) {
    console.log(`✓ ${model.name}`);
    console.log(`  Display Name: ${model.displayName}`);
    console.log(`  Description: ${model.description}`);
    console.log(`  Supported: ${model.supportedGenerationMethods.join(', ')}`);
    console.log('');
  }
} catch (error) {
  console.error('Error:', error.message);
}
