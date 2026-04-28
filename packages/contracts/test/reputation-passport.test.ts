import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';

describe('ReputationPassport', () => {
  async function deployFixture() {
    const [owner, freelancer, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('ReputationPassport');
    const passport = await factory.deploy();
    return { passport, owner, freelancer, other };
  }

  describe('Minting', () => {
    it('should mint a passport with score >= 70', async () => {
      const { passport, freelancer } = await loadFixture(deployFixture);
      const tx = await passport.mintPassport(freelancer.address, 85, 'React', 'bafyabc123');
      await tx.wait();

      expect(await passport.hasPassport(freelancer.address)).to.equal(true);
      const data = await passport.passportData(1);
      expect(data.score).to.equal(85);
      expect(data.skill).to.equal('React');
      expect(data.historyCid).to.equal('bafyabc123');
      expect(data.jobsCompleted).to.equal(0);
    });

    it('should reject minting with score < 70', async () => {
      const { passport, freelancer } = await loadFixture(deployFixture);
      await expect(
        passport.mintPassport(freelancer.address, 50, 'React', 'bafyabc123')
      ).to.be.revertedWith('SCORE_TOO_LOW');
    });

    it('should reject duplicate passport for same wallet', async () => {
      const { passport, freelancer } = await loadFixture(deployFixture);
      await passport.mintPassport(freelancer.address, 80, 'React', 'bafyabc123');
      await expect(
        passport.mintPassport(freelancer.address, 90, 'Solidity', 'bafydef456')
      ).to.be.revertedWith('PASSPORT_EXISTS');
    });

    it('should only allow owner to mint', async () => {
      const { passport, freelancer, other } = await loadFixture(deployFixture);
      await expect(
        passport.connect(freelancer).mintPassport(other.address, 80, 'React', 'bafyabc123')
      ).to.be.reverted;
    });
  });

  describe('Soulbound (Non-transferable)', () => {
    it('should block transfers between wallets', async () => {
      const { passport, freelancer, other } = await loadFixture(deployFixture);
      await passport.mintPassport(freelancer.address, 80, 'React', 'bafyabc123');

      await expect(
        passport.connect(freelancer).transferFrom(freelancer.address, other.address, 1)
      ).to.be.revertedWith('SOULBOUND');
    });
  });

  describe('Updates', () => {
    it('should update score and history after job completion', async () => {
      const { passport, freelancer } = await loadFixture(deployFixture);
      await passport.mintPassport(freelancer.address, 80, 'React', 'bafyabc123');
      await passport.updatePassport(1, 88, 'bafynewcid');

      const data = await passport.passportData(1);
      expect(data.score).to.equal(88);
      expect(data.historyCid).to.equal('bafynewcid');
      expect(data.jobsCompleted).to.equal(1);
    });
  });

  describe('ERC-5192', () => {
    it('should return locked=true for minted tokens', async () => {
      const { passport, freelancer } = await loadFixture(deployFixture);
      await passport.mintPassport(freelancer.address, 80, 'React', 'bafyabc123');
      expect(await passport.locked(1)).to.equal(true);
    });
  });

  describe('Lookup', () => {
    it('should get passport by wallet address', async () => {
      const { passport, freelancer } = await loadFixture(deployFixture);
      await passport.mintPassport(freelancer.address, 80, 'React', 'bafyabc123');
      expect(await passport.getPassportByWallet(freelancer.address)).to.equal(1);
    });

    it('should revert for wallet without passport', async () => {
      const { passport, other } = await loadFixture(deployFixture);
      await expect(passport.getPassportByWallet(other.address)).to.be.revertedWith('NO_PASSPORT');
    });
  });
});
