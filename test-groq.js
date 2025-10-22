import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing Groq API...');
console.log('API Key:', process.env.GROQ_API_KEY ? 'Found' : 'NOT FOUND');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

try {
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: 'Say "test successful"' }],
    model: 'llama-3.3-70b-versatile',
    max_tokens: 20
  });
  
  console.log('✅ SUCCESS!');
  console.log('Response:', completion.choices[0]?.message?.content);
} catch (error) {
  console.log('❌ ERROR!');
  console.log('Error message:', error.message);
  console.log('Error details:', error);
}
