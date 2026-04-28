import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_PRIORITY = [
  'gemini-2.5-flash',
  'gemini-2.0-flash'
];

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Try generating content with automatic retries and model fallback.
 * On 503/429, retries the same model up to MAX_RETRIES times,
 * then falls back to the next model in the priority list.
 */
export async function callGeminiWithRetry(
  prompt: string,
  customApiKey?: string
): Promise<string> {
  // Normalize: treat empty or placeholder strings as "not provided"
  const isPlaceholder = customApiKey?.includes('...') || customApiKey?.includes('YOUR_');
  const effectiveKey = (customApiKey?.trim() && !isPlaceholder) ? customApiKey.trim() : process.env.GOOGLE_AI_STUDIO_API_KEY;

  if (!effectiveKey) {
    throw new Error('API Key missing. Add GOOGLE_AI_STUDIO_API_KEY to .env.local or provide one in the UI.');
  }

  // Diagnostic Log (Safely checking format)
  console.log(`[gemini] Key Check: startsWith=${effectiveKey.substring(0, 7)}... length=${effectiveKey.length} type=${customApiKey?.trim() ? 'custom' : 'system'}`);

  const genAI = new GoogleGenerativeAI(effectiveKey);

  // Diagnostic: List available models if it's the first time
  if (!(global as any)._geminiModelsListed) {
    (global as any)._geminiModelsListed = true;
    fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${effectiveKey}`)
      .then(res => res.json())
      .then(data => {
        const names = data.models?.map((m: any) => m.name.replace('models/', '')) || [];
        console.log('[gemini] Available models for this key:', names.slice(0, 10).join(', ') + (names.length > 10 ? '...' : ''));
      })
      .catch(err => console.error('[gemini] Failed to list models:', err.message));
  }
  let lastError: Error | null = null;

  for (const modelName of MODEL_PRIORITY) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[gemini] Trying ${modelName} (attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);

        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json'
          }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text.trim()) {
          throw new Error('Gemini returned an empty response');
        }

        console.log(`[gemini] Success with ${modelName}`);
        return text;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const msg = lastError.message;
        const isRetryable = msg.includes('503') || msg.includes('429') || msg.includes('high demand') || msg.includes('quota');

        console.warn(`[gemini] ${modelName} attempt ${attempt + 1} failed: ${msg.substring(0, 120)}`);

        if (isRetryable && attempt < MAX_RETRIES) {
          console.log(`[gemini] Retrying in ${RETRY_DELAY_MS}ms...`);
          await sleep(RETRY_DELAY_MS);
          continue;
        }

        // If not retryable or exhausted retries, break to next model
        break;
      }
    }
    console.log(`[gemini] Exhausted retries for ${modelName}, trying next model...`);
  }

  // Produce a clean, user-friendly error
  const rawMsg = lastError?.message ?? '';
  if (rawMsg.includes('limit: 0') || (rawMsg.includes('429') && rawMsg.includes('quota'))) {
    throw new Error('Free tier API quota exhausted for today. Please paste your own Gemini API key in the input field above, or wait for the daily quota to reset.');
  }
  throw lastError ?? new Error('All Gemini models are currently unavailable. Please try again in a few minutes.');
}
