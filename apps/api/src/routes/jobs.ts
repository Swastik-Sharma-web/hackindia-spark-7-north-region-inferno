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
    const walletAddress = parsed.data.wallet || '0xDemoWallet1234567890'; // Fallback for demo
    
    try {
      const user = await prisma.user.upsert({
        where: { wallet: walletAddress },
        update: {},
        create: { wallet: walletAddress }
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
      include: { client: true, freelancer: true }
    });
    return res.json({ ok: true, jobs });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// PATCH: Apply to a job
jobsRouter.patch('/:id/apply', async (req, res) => {
  try {
    const { id } = req.params;
    const { wallet } = req.body;
    
    if (!wallet) return res.status(400).json({ error: 'Wallet is required' });
    
    // Find or create user
    const user = await prisma.user.upsert({
      where: { wallet },
      update: {},
      create: { wallet }
    });

    const job = await prisma.job.update({
      where: { id },
      data: {
        freelancerId: user.id,
        status: 'IN_PROGRESS'
      }
    });
    
    return res.json({ ok: true, job });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to apply to job' });
  }
});

// PATCH: Submit work
jobsRouter.patch('/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { submittedWork } = req.body;
    
    const job = await prisma.job.update({
      where: { id },
      data: {
        submittedWork,
        status: 'SUBMITTED'
      }
    });
    
    return res.json({ ok: true, job });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to submit work' });
  }
});

// PATCH: Approve work
jobsRouter.patch('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await prisma.job.update({
      where: { id },
      data: {
        status: 'RELEASED',
        escrowStatus: 'RELEASED'
      }
    });
    
    return res.json({ ok: true, job });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to approve work' });
  }
});

// PATCH: Dispute
jobsRouter.patch('/:id/dispute', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const job = await prisma.job.update({
      where: { id },
      data: {
        status: 'DISPUTED',
        disputeReason: reason
      }
    });
    
    return res.json({ ok: true, job });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to raise dispute' });
  }
});

// DELETE: Delete a job
jobsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.status !== 'OPEN') {
      return res.status(400).json({ error: 'Cannot delete a job that has already been accepted or is in progress' });
    }
    
    await prisma.job.delete({ where: { id } });
    
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete job' });
  }
});
