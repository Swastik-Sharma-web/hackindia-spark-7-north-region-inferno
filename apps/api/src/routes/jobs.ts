import { Router } from 'express';
import { z } from 'zod';
import { callGeminiWithRetry } from '../lib/gemini.js';
import { prisma } from '../lib/prisma.js';

export const jobsRouter = Router();

const GenerateJobSchema = z.object({
  prompt: z.string().min(5),
  apiKey: z.string().optional(),
  wallet: z.string().optional() // Link to user wallet if provided
});

function parseJson(text: string) {
  const cleaned = text.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim();
  return JSON.parse(cleaned);
}

async function callGoogleStudioJobGen(prompt: string, customApiKey?: string) {
  const systemPrompt = [
    'You are an expert technical recruiter and project manager for a web3 freelancing platform.',
    'A client has provided a rough idea of a job they need done. Your task is to expand this into a highly professional, structured job listing.',
    'You must extract or intelligently estimate the following fields based on the client\'s prompt:',
    '- title: A short, professional title (string).',
    '- skill: The primary technology/skill required (e.g., "React", "Solidity", "Rust", "UI/UX") (string).',
    '- budget: A realistic budget in MATIC based on the complexity, formatted as a string (e.g., "5.0 MATIC"). If the client specified a budget, use it.',
    '- score: The minimum AI Reputation Score required for freelancers to apply, formatted as a string (e.g., "80+", "90+"). Complex jobs need higher scores.',
    '- description: A 1-2 sentence professional description of the project.',
    '- details: An array of 4-5 specific technical or functional requirements (array of strings).',
    '- timeline: A realistic estimated timeline (e.g., "2 weeks", "1 month") (string).',
    'Return ONLY a valid JSON object containing exactly these keys: "title", "skill", "budget", "score", "description", "details", "timeline".'
  ].join('\n');

  const text = await callGeminiWithRetry(`${systemPrompt}\n\nClient Prompt:\n"${prompt}"`, customApiKey);
  return parseJson(text);
}

jobsRouter.post('/generate', async (req, res) => {
  try {
    const parsed = GenerateJobSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request format', details: parsed.error.format() });
    }

    const result = await callGoogleStudioJobGen(parsed.data.prompt, parsed.data.apiKey);
    
    let dbJob = null;
    if (parsed.data.wallet) {
      try {
        const user = await prisma.user.upsert({
          where: { wallet: parsed.data.wallet },
          update: {},
          create: { wallet: parsed.data.wallet }
        });
        
        dbJob = await prisma.job.create({
          data: {
            title: result.title,
            skill: result.skill,
            budget: result.budget,
            score: result.score,
            description: result.description,
            details: result.details,
            timeline: result.timeline,
            clientId: user.id,
            status: 'OPEN',
            escrowStatus: 'LOCKED'
          }
        });
        console.log(`[jobs] Saved job to DB: ${dbJob.id}`);
      } catch (dbError) {
        console.error('[jobs] Failed to save job to DB:', dbError);
      }
    }

    return res.json({ ok: true, result, dbId: dbJob?.id });
  } catch (error) {
    console.error('[jobs] Error in /generate:', error);
    return res.status(500).json({ 
      error: 'Failed to generate job via Gemini', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET all jobs from DB
jobsRouter.get('/', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      include: { client: true }
    });
    return res.json({ ok: true, jobs });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});
