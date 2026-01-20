/**
 * Quick test to verify Gemini integration is working
 */

import 'dotenv/config';
import { extractWithLLM } from './services/llmParser.js';

console.log('🧪 Testing Gemini Integration...\n');

const testEmail = {
  from: 'jobs@amazon.com',
  subject: 'Application Received - Software Engineer at Amazon',
  body: `Dear Candidate,

Thank you for applying to the Software Engineer position at Amazon Web Services. 
We have received your application and our team will review it shortly.

Position: Software Engineer II
Location: Seattle, WA
Team: AWS Lambda

We will be in touch if your qualifications match our requirements.

Best regards,
Amazon Recruiting Team`
};

console.log('📧 Test Email:');
console.log(`From: ${testEmail.from}`);
console.log(`Subject: ${testEmail.subject}`);
console.log(`Body: ${testEmail.body.substring(0, 100)}...\n`);

try {
  console.log('🔄 Calling Gemini API...\n');
  
  const result = await extractWithLLM(
    testEmail.from,
    testEmail.subject,
    testEmail.body
  );
  
  if (!result) {
    console.error('❌ Gemini returned null - check API key or logs');
    process.exit(1);
  }
  
  console.log('✅ Gemini Response:');
  console.log(JSON.stringify(result, null, 2));
  console.log('\n📊 Validation:');
  console.log(`✓ Is Job Email: ${result.isJobEmail}`);
  console.log(`✓ Company: ${result.company}`);
  console.log(`✓ Job Title: ${result.jobTitle}`);
  console.log(`✓ Status: ${result.status}`);
  console.log(`✓ Location: ${result.location}`);
  
  if (result.isJobEmail && result.company === 'Amazon' && result.jobTitle.includes('Software Engineer')) {
    console.log('\n🎉 SUCCESS! Gemini is working correctly!');
    process.exit(0);
  } else {
    console.log('\n⚠️  WARNING: Results don\'t match expected values');
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Check that GOOGLE_AI_API_KEY is set in backend/.env');
  console.error('2. Verify the API key is valid at https://aistudio.google.com/apikey');
  console.error('3. Make sure you have internet connection');
  process.exit(1);
}
