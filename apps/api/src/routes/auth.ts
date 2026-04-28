import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { SiweMessage } from 'siwe';
import { z } from 'zod';
import { consumeNonce, issueNonce } from '../lib/nonce-store.js';
import { prisma } from '../lib/prisma.js';

const authRouter = Router();
const nonceRequestSchema = z.object({
  address: z.string().min(1)
});

const verifyRequestSchema = z.object({
  message: z.string().min(1),
  signature: z.string().min(1)
});

authRouter.post('/nonce', (request, response) => {
  const parsed = nonceRequestSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: 'Invalid address payload' });
  }

  const nonce = issueNonce(parsed.data.address);
  return response.json({ nonce });
});

authRouter.post('/verify', async (request, response) => {
  const parsed = verifyRequestSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: 'Invalid SIWE payload' });
  }

  const message = new SiweMessage(parsed.data.message);
  const domain = request.headers.host ?? 'localhost';

  try {
    const result = await message.verify({
      signature: parsed.data.signature,
      domain
    });

    if (!consumeNonce(message.address)) {
      return response.status(401).json({ error: 'Nonce expired or missing' });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return response.status(500).json({ error: 'JWT secret not configured' });
    }

    const token = jwt.sign(
      {
        sub: message.address,
        domain,
        nonce: message.nonce
      },
      secret,
      { expiresIn: '24h' }
    );

    // Database Sync: Register or update the user
    const dbUser = await prisma.user.upsert({
      where: { wallet: message.address },
      update: { updatedAt: new Date() },
      create: { 
        wallet: message.address,
        reputation: 84 // Default starting reputation
      }
    });

    return response.json({
      ok: true,
      address: message.address,
      userId: dbUser.id,
      token,
      valid: result.success
    });
  } catch (error) {
    return response.status(401).json({
      error: 'SIWE verification failed',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { authRouter };
