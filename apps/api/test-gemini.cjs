const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyBk6i4wkkelgV0UHEuCvixJ65xWHkscwGo');
genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' }
}).generateContent('return simple json {"ok": true}').then(r => console.log('success:', r.response.text())).catch(e => console.error('error:', e.status, e.message));
