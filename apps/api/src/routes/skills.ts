import { Router } from 'express';
import { z } from 'zod';
import { callGeminiWithRetry } from '../lib/gemini.js';
import { mintUserPassport } from '../lib/contracts.js';
import { prisma } from '../lib/prisma.js';

export const skillsRouter = Router();

const challengeRequestSchema = z.object({
  skill: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  apiKey: z.string().optional()
});

const gradeRequestSchema = z.object({
  skill: z.string().min(1),
  challenge: z.any(),
  submission: z.string().min(1),
  address: z.string().min(1), // Added address to know who to mint for
  apiKey: z.string().optional()
});

function parseModelJson(text: string) {
  // First try to parse the entire text as JSON directly
  try {
    return JSON.parse(text);
  } catch {}

  // If that fails, try to extract JSON from markdown blocks
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const cleaned = match ? match[1].trim() : text.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // If we still can't parse it, try to find the first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch {}
    }
    return { text: cleaned };
  }
}



async function callGoogleStudio(prompt: string, customApiKey?: string) {
  const hasKey = customApiKey?.trim() || process.env.GOOGLE_AI_STUDIO_API_KEY;

  if (!hasKey) {
    return {
      fallback: true,
      title: 'Fallback challenge',
      description: prompt,
      requirements: [],
      rubric: []
    };
  }

  try {
    const text = await callGeminiWithRetry(prompt, customApiKey);
    return parseModelJson(text);
  } catch (error) {
    console.error('[skills] Gemini request failed:', error);
    return {
      fallback: true,
      title: 'Fallback challenge',
      description: `Gemini request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requirements: ['Check GOOGLE_AI_STUDIO_API_KEY', 'Verify Gemini access in AI Studio'],
      rubric: [],
      starterCode: '// Gemini fallback generated because the API call failed',
      expectedOutcome: 'A real Gemini response should appear once the API key and model access are valid.'
    };
  }
}

skillsRouter.post('/challenge', async (request, response) => {
  const parsed = challengeRequestSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: 'Invalid skill payload' });
  }

  const challengeSeed = parsed.data.sessionId ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const skillPrompts: { [key: string]: string } = {
    React: 'Create a React component that displays a searchable list of 1,200 freelancers with real-time filtering, highlighted matches, keyboard navigation, and empty-state handling.',
    'Node.js': 'Create a Node.js Express API endpoint that validates POST payloads, rate-limits requests, writes to a mock in-memory store, and returns a resource object with a deterministic ID.',
    Solidity: 'Write a Solidity smart contract that mints a limited supply token, prevents unauthorized burn, emits events for every state change, and includes owner-only emergency controls.',
    Python: 'Write a Python class that ingests a CSV, cleans invalid rows, calculates summary statistics, and exports a structured report object.'
  };

  const prompt = [
    'You are generating a fresh TrustWork X skill verification test.',
    `Session seed: ${challengeSeed}`,
    `Skill: ${parsed.data.skill}`,
    skillPrompts[parsed.data.skill] ?? 'Create a practical, specific coding challenge with a real-world scenario.',
    'Rules: generate a brand-new variation every time; do not reuse wording across sessions; include one precise implementation task, one edge-case requirement, and one measurable quality requirement.',
    'Return ONLY valid JSON with exactly these keys: title, description, requirements, rubric, starterCode, expectedOutcome.',
    'The requirements field must be an array of plain strings.',
    'rubric items must be objects with criterion, weight, and description. starterCode should be a short helpful snippet. expectedOutcome should explain what a passing solution does.'
  ].join('\n');

  try {
    const result = await callGoogleStudio(prompt, parsed.data.apiKey);

    if (result?.fallback) {
      return response.status(500).json({ 
        error: 'Failed to generate challenge via Gemini', 
        detail: result.description || 'Unknown API Error. Ensure your Gemini API Key is valid and has sufficient quota.' 
      });
    }

    return response.json({ ok: true, skill: parsed.data.skill, result: result });
  } catch (error) {
    return response.status(500).json({
      error: 'Failed to generate challenge',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

skillsRouter.post('/grade', async (request, response) => {
  const parsed = gradeRequestSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: 'Invalid grading payload' });
  }

  const prompt = [
    'Grade this TrustWork X skill submission on a 100-point rubric.',
    `Skill: ${parsed.data.skill}`,
    `Challenge: ${JSON.stringify(parsed.data.challenge)}`,
    `Submission: ${parsed.data.submission}`,
    'Return ONLY valid JSON (no markdown) with: {"score": 0-100, "pass": true/false, "feedback": "detailed feedback", "breakdown": [{"criterion": "name", "score": 0-100, "comment": "specific feedback"}], "recommendation": "approve/review/reject"}. The score must be a single integer and should reflect code correctness, completeness, and explanation quality.'
  ].join('\n');
  try {
    const result = await callGoogleStudio(prompt, parsed.data.apiKey);
    
    if (result?.fallback) {
      return response.status(500).json({ 
        error: 'Gemini evaluation failed', 
        detail: result.description || 'Unknown API Error. Ensure your Gemini API Key is valid and has sufficient quota.' 
      });
    }

    // Logic for Minting On-Chain Reputation Passport
    let mintTxHash = null;
    if (result.score >= 70 && result.pass) {
      try {
        // 1. Prepare Metadata for IPFS
        const metadata = {
          name: `TrustWork Reputation: ${parsed.data.skill}`,
          description: `Soulbound reputation credential for ${parsed.data.skill} on TrustWork X.`,
          image: "https://trustwork-x.vercel.app/passport-preview.png",
          attributes: [
            { trait_type: "Skill", value: parsed.data.skill },
            { trait_type: "Score", value: result.score },
            { trait_type: "Status", value: "Verified" },
            { trait_type: "Date", value: new Date().toISOString() }
          ]
        };

        // 2. Pin to IPFS via Pinata
        let historyCid = `bafy_fallback_${Date.now()}`;
        const apiKey = process.env.PINATA_API_KEY;
        const secretKey = process.env.PINATA_SECRET_KEY;

        if (apiKey && secretKey) {
          const pinResult = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              pinata_api_key: apiKey,
              pinata_secret_api_key: secretKey
            },
            body: JSON.stringify({
              pinataContent: metadata,
              pinataMetadata: { name: `Passport-${parsed.data.address}-${parsed.data.skill}` }
            })
          });
          
          if (pinResult.ok) {
            const pinData = await pinResult.json();
            historyCid = pinData.IpfsHash;
            console.log(`[skills] Metadata pinned to IPFS: ${historyCid}`);
          }
        }

        // 3. Mint on-chain with the IPFS CID
        mintTxHash = await mintUserPassport(
          parsed.data.address, 
          result.score, 
          parsed.data.skill, 
          historyCid
        );
      } catch (mintError) {
        console.error('[skills] On-chain minting failed:', mintError);
      }
    }

    // Database Sync: Store Challenge & Submission
    try {
      const user = await prisma.user.findUnique({ where: { wallet: parsed.data.address } });
      if (user) {
        await prisma.challenge.create({
          data: {
            userId: user.id,
            skill: parsed.data.skill,
            title: parsed.data.challenge.title || 'Skill Test',
            description: parsed.data.challenge.description || '',
            requirements: parsed.data.challenge.requirements || [],
            rubric: parsed.data.challenge.rubric?.map((r: any) => r.criterion) || [],
            score: result.score,
            feedback: result.feedback,
            submission: parsed.data.submission,
            status: result.pass ? 'COMPLETED' : 'FAILED',
            completedAt: new Date()
          }
        });

        // Update user reputation/stats
        await prisma.user.update({
          where: { id: user.id },
          data: {
            reputation: { increment: result.pass ? 5 : 0 }, // Small boost for passing
            jobsCompleted: { increment: result.pass ? 1 : 0 }
          }
        });
      }
    } catch (dbError) {
      console.error('[skills] Database sync failed:', dbError);
    }

    return response.json({ 
      ok: true, 
      skill: parsed.data.skill, 
      result: result,
      mintTxHash: mintTxHash 
    });
  } catch (error) {
    return response.status(500).json({
      error: 'Failed to grade submission',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
