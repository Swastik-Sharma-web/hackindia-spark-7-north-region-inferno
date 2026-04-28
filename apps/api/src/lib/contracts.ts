import { ethers } from 'ethers';
import ReputationPassportAbi from '../../../../packages/contracts/artifacts/contracts/ReputationPassport.sol/ReputationPassport.json' assert { type: 'json' };
import TrustWorkEscrowAbi from '../../../../packages/contracts/artifacts/contracts/TrustWorkEscrow.sol/TrustWorkEscrow.json' assert { type: 'json' };

const RPC_URL = process.env.POLYGON_MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const REPUTATION_ADDR = process.env.REPUTATION_CONTRACT_ADDR;
const ESCROW_ADDR = process.env.ESCROW_CONTRACT_ADDR;

export function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getSigner() {
  if (!PRIVATE_KEY) throw new Error('PRIVATE_KEY missing in .env');
  return new ethers.Wallet(PRIVATE_KEY, getProvider());
}

export function getReputationContract() {
  if (!REPUTATION_ADDR) throw new Error('REPUTATION_CONTRACT_ADDR missing in .env');
  return new ethers.Contract(REPUTATION_ADDR, ReputationPassportAbi.abi, getSigner());
}

export function getEscrowContract() {
  if (!ESCROW_ADDR) throw new Error('ESCROW_CONTRACT_ADDR missing in .env');
  return new ethers.Contract(ESCROW_ADDR, TrustWorkEscrowAbi.abi, getSigner());
}

/**
 * Mint a passport for a user after they pass a skill test.
 */
export async function mintUserPassport(wallet: address, score: number, skill: string, historyCid: string) {
  const contract = getReputationContract();
  console.log(`[blockchain] Minting passport for ${wallet} with score ${score}`);
  
  const tx = await contract.mintPassport(wallet, score, skill, historyCid);
  const receipt = await tx.wait();
  console.log(`[blockchain] Passport minted! Tx: ${receipt.hash}`);
  return receipt.hash;
}

/**
 * Update a passport score after a job completion.
 */
export async function updateUserPassport(tokenId: number, newScore: number, historyCid: string) {
  const contract = getReputationContract();
  const tx = await contract.updatePassport(tokenId, newScore, historyCid);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Resolve a dispute via AI verdict.
 */
export async function resolveOnChainDispute(jobId: number, freelancerWins: boolean) {
  const contract = getEscrowContract();
  console.log(`[blockchain] Resolving dispute for job ${jobId}. Freelancer wins: ${freelancerWins}`);
  
  const tx = await contract.resolveDispute(jobId, freelancerWins);
  const receipt = await tx.wait();
  console.log(`[blockchain] Dispute resolved on-chain! Tx: ${receipt.hash}`);
  return receipt.hash;
}
