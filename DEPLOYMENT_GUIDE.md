# TrustWork X - Complete Deployment & Setup Guide

## Project Overview

**TrustWork X** is an AI-powered Web3 freelance platform combining on-chain reputation passports (soulbound NFTs), skill verification via Google AI Studio (Gemini), and secure smart contract escrow for payments. 

**Tech Stack:**
- Frontend: Next.js 14 + TailwindCSS + RainbowKit + wagmi
- Backend: Express + TypeScript + Prisma + Claude API
- Smart Contracts: Solidity 0.8.28 (ReputationPassport + TrustWorkEscrow)
- Storage: Pinata/IPFS for metadata
- Blockchain: Polygon Mumbai testnet (ChainID 80001)

---

## Pre-Deployment Checklist

### 1. Environment Setup

```bash
# Clone and install
git clone <your-repo>
cd HackIndia
npm install

# Install workspace packages
npm install -w apps/web
npm install -w apps/api
npm install -w packages/contracts
```

### 2. Environment Variables

Create `.env.local` in project root:

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your-walletconnect-project-id>
NEXT_PUBLIC_CHAIN_ID=80001

# Backend
PORT=4000
GOOGLE_AI_STUDIO_API_KEY=<your-gemini-api-key>
DATABASE_URL=postgresql://user:password@localhost:5432/trustwork
PINATA_API_KEY=<your-pinata-key>
PINATA_SECRET_KEY=<your-pinata-secret>

# Smart Contracts
PRIVATE_KEY=<deployer-wallet-private-key>
REPUTATION_CONTRACT_ADDR=0x0000... (empty until deployed)
ESCROW_CONTRACT_ADDR=0x0000... (empty until deployed)
POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com

# Auth
JWT_SECRET=your-256-bit-secret-key-change-in-production-min-32-chars-long
```

---

## Local Development

### Start the Full Stack

**Terminal 1: Backend API**
```bash
npm run dev:api
# Starts on PORT 4000
# Routes available: /auth, /skills, /storage, /health
```

**Terminal 2: Frontend**
```bash
npm run dev:web
# Starts on http://localhost:3000
# Hot reload enabled
```

**Test the flow:**
1. Open `http://localhost:3000`
2. Click "Connect Wallet" (RainbowKit UI)
3. Select a wallet to connect
4. Navigate to `/challenge` to test AI skill generation
5. API calls → Claude → Skill challenges appear live

---

## Smart Contract Deployment (Polygon Mumbai)

### Get Mumbai Test MATIC

1. Go to [Polygon Faucet](https://faucet.polygon.technology/)
2. Select "Mumbai" network
3. Paste your wallet address
4. Receive test MATIC

### Deploy Contracts

```bash
# Compile first
npm run compile --workspace packages/contracts

# Deploy to Mumbai
npm run deploy --workspace packages/contracts
```

**Output:**
```
Deploying to Polygon Mumbai...
ReputationPassport deployed at: 0x...
TrustWorkEscrow deployed at: 0x...
```

**Update `.env.local`:**
```env
REPUTATION_CONTRACT_ADDR=0x<paste-from-output>
ESCROW_CONTRACT_ADDR=0x<paste-from-output>
```

### Verify on Polygonscan (Optional)

```bash
npm run deploy:verify --workspace packages/contracts
```

---

## API Documentation

### Authentication Endpoints

**POST /auth/nonce**
- Request: `{ "address": "0x..." }`
- Response: `{ "nonce": "unique-nonce-string" }`
- Purpose: Get nonce for SIWE signature

**POST /auth/verify**
- Request: `{ "message": "SIWE message", "signature": "0x..." }`
- Response: `{ "ok": true, "address": "0x...", "token": "jwt-token" }`
- Purpose: Verify SIWE signature, issue JWT

### Skills Endpoints

**POST /skills/challenge**
- Request: `{ "skill": "React" }`
- Response: `{ "result": { "title": "...", "description": "..." } }`
- Purpose: Generate unique Claude-powered skill challenge

**POST /skills/grade**
- Request: `{ "skill": "React", "challenge": {...}, "submission": "..." }`
- Response: `{ "score": 85, "pass": true, "feedback": "..." }`
- Purpose: Grade submission against 4-dimension rubric (40/30/20/10)

### Storage Endpoints

**POST /storage/pinata**
- Request: `{ "name": "...", "description": "...", "attributes": [...] }`
- Response: `{ "ok": true, "cid": "Qm...", "payload": {...} }`
- Purpose: Upload NFT metadata to IPFS via Pinata

### Health Check

**GET /health**
- Response: `{ "ok": true, "service": "trustwork-api" }`

---

## Frontend Pages

| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Landing page | ✓ Complete |
| `/challenge` | Skill verification | ✓ Interactive (API integrated) |
| `/jobs` | Job board | ✓ Static (ready for API) |
| `/escrow` | Payment management | ✓ Static (ready for API) |
| `/profile` | Reputation passport | ✓ Static (ready for API) |

---

## Production Deployment

### Frontend → Vercel

1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` → Your backend URL
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - `NEXT_PUBLIC_CHAIN_ID=80001`
4. Deploy main branch

### Backend → Railway

1. Connect GitHub repo to Railway
2. Set environment variables:
   - `PORT=4000`
   - `GOOGLE_AI_STUDIO_API_KEY`
   - `DATABASE_URL` → Production Supabase
   - `PINATA_API_KEY`, `PINATA_SECRET_KEY`
   - `JWT_SECRET`
   - `REPUTATION_CONTRACT_ADDR`, `ESCROW_CONTRACT_ADDR`
3. Deploy

### Database Setup (Supabase)

1. Create Supabase project
2. Run migrations:
   ```bash
   DATABASE_URL=<your-supabase-url> npx prisma migrate deploy
   ```

---

## Build Validation

```bash
# Build API
npm run build:api
# ✓ TypeScript compiled to dist/

# Build Web
npm run build:web
# ✓ Next.js optimized build to .next/

# Test Contracts
npm test --workspace packages/contracts
# ✓ 3/3 tests passing
```

---

## Demo Flow (End-to-End)

1. **Wallet Connection**
   - Click "Connect Wallet" → Select MetaMask/wallet
   - Sign SIWE message
   - JWT token issued

2. **Skill Challenge**
   - Navigate to `/challenge`
   - Select skill (e.g., "React")
   - API calls Claude for unique challenge
   - Submit solution
   - Grade computed via Claude
   - On pass: prompt to mint passport

3. **Reputation Passport**
   - Click "Mint Passport"
   - Sign transaction on Mumbai
   - ReputationPassport NFT minted (soulbound)
   - Metadata uploaded to IPFS
   - Profile page shows passport + stats

4. **Job Board**
   - Browse open jobs requiring your skill
   - Apply with verified skill passport

5. **Escrow Payment**
   - Client posts job with payment locked
   - Freelancer completes work
   - Client releases payment via smart contract
   - 3% platform fee auto-collected

---

## Troubleshooting

**Issue: "Module not found: Can't resolve '@/lib/api-hooks'"**
- Solution: Ensure tsconfig.json has `baseUrl: "."` and `paths: { "@/*": ["./*"] }`

**Issue: SIWE signature verification fails**
- Solution: Ensure nonce is consumed (only valid once for 10 minutes)

**Issue: Claude API returns mock data**
- Solution: Set `GOOGLE_AI_STUDIO_API_KEY` in .env.local

**Issue: Pinata upload fails**
- Solution: Verify `PINATA_API_KEY` and `PINATA_SECRET_KEY` are set

**Issue: Contract deployment fails**
- Solution: Ensure `PRIVATE_KEY` has Mumbai test MATIC

---

## Repository Structure

```
HackIndia/
├── apps/
│   ├── web/              # Next.js frontend
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities (api-hooks.ts)
│   │   └── globals.css   # Tailwind styles
│   └── api/              # Express backend
│       ├── src/
│       │   ├── server.ts # Entry point
│       │   ├── routes/   # API endpoints
│       │   └── lib/      # Database, auth
│       └── dist/         # Compiled JS (build output)
├── packages/
│   └── contracts/        # Solidity smart contracts
│       ├── contracts/    # ReputationPassport, TrustWorkEscrow
│       ├── scripts/      # Deploy script
│       └── test/         # Test suites
├── .env.local           # Local env vars
└── package.json         # Workspace root
```

---

## Key Files & Responsibilities

| File | Purpose |
|------|---------|
| `apps/web/lib/api-hooks.ts` | React hooks for API calls |
| `apps/api/src/routes/*.ts` | Backend endpoints |
| `packages/contracts/contracts/*.sol` | Smart contracts |
| `.env.local` | Environment config (DO NOT COMMIT) |

---

## Next Steps

1. ✅ Set up local .env.local
2. ✅ Run `npm install` across all workspaces
3. ✅ Start API and web locally
4. ✅ Test skill challenge flow
5. ✅ Deploy contracts to Mumbai
6. ✅ Deploy frontend to Vercel
7. ✅ Deploy backend to Railway
8. ✅ Update contract addresses in production env
9. ✅ Run full end-to-end demo
10. ✅ Capture demo screenshots/video

---

## Support & Resources

- **Polygon Mumbai Faucet**: https://faucet.polygon.technology/
- **Polygonscan Mumbai**: https://mumbai.polygonscan.com/
- **Pinata Docs**: https://docs.pinata.cloud/
- **Google AI Studio Docs**: https://ai.google.dev/
- **Next.js Docs**: https://nextjs.org/docs
- **Hardhat Docs**: https://hardhat.org/docs

---

**Status**: 🚀 Ready for deployment
**Last Updated**: 2026-04-28
**Version**: 1.0.0
