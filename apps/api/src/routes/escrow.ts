import { Router } from 'express';
import { z } from 'zod';
import { callGeminiWithRetry } from '../lib/gemini.js';
import { resolveOnChainDispute } from '../lib/contracts.js'; // Added contract service

export const escrowRouter = Router();

const DisputeSchema = z.object({
  jobId: z.number().optional(), // Added jobId to resolve on-chain
  reason: z.string().min(5),
  apiKey: z.string().optional()
});

function parseJson(text: string) {
  const cleaned = text.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim();
  return JSON.parse(cleaned);
}

async function callGoogleStudioEscrow(prompt: string, customApiKey?: string) {
  const systemPrompt = [
    'You are an impartial AI Escrow Arbiter for a web3 freelancing platform.',
    'A freelancer has completed a job, but the client is withholding payment. The freelancer has submitted the client\'s stated reason for non-payment to you for dispute resolution.',
    "Your job is to read the client's reason for withholding payment and decide if the client's reason is VALID or INVALID.",
    'The client\'s reason is VALID if it clearly states that the freelancer failed to meet core requirements, delivered broken code, or missed critical deadlines.',
    'The client\'s reason is INVALID if it is frivolous, out of scope (feature creep), abusive, lacks detail, or sounds like an excuse to avoid paying for completed work.',
    'Return ONLY a valid JSON object with exactly these keys: "clientReasonValid" (boolean), "explanation" (string explaining your verdict in 1-2 sentences).'
  ].join('\n');

  const text = await callGeminiWithRetry(`${systemPrompt}\n\nDispute Reason:\n"${prompt}"`, customApiKey);
  return parseJson(text);
}

escrowRouter.post('/dispute', async (req, res) => {
  try {
    const parsed = DisputeSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request format', details: parsed.error.format() });
    }

    const result = await callGoogleStudioEscrow(parsed.data.reason, parsed.data.apiKey);
    
    // Logic for On-Chain Dispute Resolution
    let resolveTxHash = null;
    if (parsed.data.jobId) {
      try {
        // If client's reason is NOT valid, freelancer wins
        const freelancerWins = !result.clientReasonValid;
        resolveTxHash = await resolveOnChainDispute(parsed.data.jobId, freelancerWins);
      } catch (chainError) {
        console.error('[escrow] On-chain dispute resolution failed:', chainError);
      }
    }

    return res.json({ 
      ok: true, 
      result,
      resolveTxHash // Return the TX hash if resolved on-chain
    });
  } catch (error) {
    console.error('[escrow] Error in /dispute:', error);
    return res.status(500).json({ 
      error: 'Failed to process dispute via Gemini', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});
