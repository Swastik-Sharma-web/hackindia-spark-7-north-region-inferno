import { ethers } from 'hardhat';

async function main() {
  const passportFactory = await ethers.getContractFactory('ReputationPassport');
  const passport = await passportFactory.deploy();
  await passport.waitForDeployment();

  const escrowFactory = await ethers.getContractFactory('TrustWorkEscrow');
  const escrow = await escrowFactory.deploy();
  await escrow.waitForDeployment();

  console.log('ReputationPassport:', await passport.getAddress());
  console.log('TrustWorkEscrow:', await escrow.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
