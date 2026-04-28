import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { skillsRouter } from './routes/skills.js';
import { storageRouter } from './routes/storage.js';
import { escrowRouter } from './routes/escrow.js';
import { jobsRouter } from './routes/jobs.js';

function loadEnvironmentFiles() {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const candidatePaths = [
    join(process.cwd(), '.env.local'),
    join(process.cwd(), '..', '.env.local'),
    join(process.cwd(), '.env'),
    join(process.cwd(), '..', '.env'),
    join(currentDir, '..', '..', '..', '.env.local'),
    join(currentDir, '..', '..', '..', '.env'),
    join(currentDir, '..', '..', '.env.local'),
    join(currentDir, '..', '..', '.env')
  ];

  for (const candidatePath of candidatePaths) {
    if (existsSync(candidatePath)) {
      const parsed = dotenv.parse(readFileSync(candidatePath));

      for (const [key, value] of Object.entries(parsed)) {
        process.env[key] = value;
      }

      return candidatePath;
    }
  }

  return null;
}

const loadedEnvironmentPath = loadEnvironmentFiles();
console.log('[server] Loaded env from:', loadedEnvironmentPath ?? 'none');
console.log('[server] Gemini key present after load:', Boolean(process.env.GOOGLE_AI_STUDIO_API_KEY));

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/health', healthRouter);
app.use('/skills', skillsRouter);
app.use('/storage', storageRouter);
app.use('/escrow', escrowRouter);
app.use('/jobs', jobsRouter);

app.listen(port, '0.0.0.0', () => {
  console.log(`TrustWork API listening on port ${port}`);
});
