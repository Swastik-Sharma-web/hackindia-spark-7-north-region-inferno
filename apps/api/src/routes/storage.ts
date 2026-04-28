import { Router } from 'express';
import { z } from 'zod';

export const storageRouter = Router();

const metadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  attributes: z.array(z.any()).default([])
});

storageRouter.post('/pinata', async (request, response) => {
  const parsed = metadataSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: 'Invalid metadata payload' });
  }

  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return response.status(200).json({
      ok: true,
      fallback: true,
      cid: `local-${Date.now()}`,
      metadata: parsed.data
    });
  }

  const result = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey
    },
    body: JSON.stringify(parsed.data)
  });

  if (!result.ok) {
    return response.status(500).json({ error: 'Pinata upload failed' });
  }

  const payload = await result.json();
  return response.json({ ok: true, cid: payload.IpfsHash, payload });
});
