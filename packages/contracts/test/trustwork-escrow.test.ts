import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers';

describe('TrustWorkEscrow', () => {
  async function deployFixture() {
    const [platform, client, freelancer, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('TrustWorkEscrow');
    const escrow = await factory.deploy();
    return { escrow, platform, client, freelancer, other };
  }

  const ONE_MATIC = ethers.parseEther('1');

  describe('Job Creation', () => {
    it('should create a job and lock funds', async () => {
      const { escrow, client, freelancer } = await loadFixture(deployFixture);
      const tx = await escrow.connect(client).createJob(freelancer.address, { value: ONE_MATIC });
      await tx.wait();

      const job = await escrow.getJob(1);
      expect(job.client).to.equal(client.address);
      expect(job.freelancer).to.equal(freelancer.address);
      expect(job.amount).to.equal(ONE_MATIC);
      expect(job.status).to.equal(0); // Funded
    });

    it('should calculate 3% fee', async () => {
      const { escrow, client, freelancer } = await loadFixture(deployFixture);
      await escrow.connect(client).createJob(freelancer.address, { value: ONE_MATIC });

      const job = await escrow.getJob(1);
      const expectedFee = (ONE_MATIC * 300n) / 10000n; // 3%
      expect(job.fee).to.equal(expectedFee);
    });

    it('should reject zero-value jobs', async () => {
      const { escrow, client, freelancer } = await loadFixture(deployFixture);
      await expect(
        escrow.connect(client).createJob(freelancer.address, { value: 0 })
      ).to.be.revertedWith('NO_FUNDS');
    });

    it('should reject self-hire', async () => {
      const { escrow, client } = await loadFixture(deployFixture);
      await expect(
        escrow.connect(client).createJob(client.address, { value: ONE_MATIC })
      ).to.be.revertedWith('CANNOT_HIRE_SELF');
    });
  });

  describe('Delivery', () => {
    it('should allow freelancer to mark delivered', async () => {
      const { escrow, client, freelancer } = await loadFixture(deployFixture);
      await escrow.connect(client).createJob(freelancer.address, { value: ONE_MATIC });
      await escrow.connect(freelancer).markDelivered(1, 'bafydeliverable');

      const job = await escrow.getJob(1);
      expect(job.status).to.equal(1); // Delivered
      expect(job.deliverableCid).to.equal('bafydeliverable');
    });

    it('should reject delivery from non-freelancer', async () => {
      const { escrow, client, freelancer, other } = await loadFixture(deployFixture);
      await escrow.connect(client).createJob(freelancer.address, { value: ONE_MATIC });
      await expect(
        escrow.connect(other).markDelivered(1, 'bafydeliverable')
      ).to.be.revertedWith('NOT_FREELANCER');
    });
  });

  describe('Payment Release', () => {
    it('should release payment to freelancer minus 3% fee', async () => {
      const { escrow, client, freelancer } = await loadFixture(deployFixture);
      await escrow.connect(client).createJob(freelancer.address, { value: ONE_MATIC });
      await escrow.connect(freelancer).markDelivered(1, 'bafydeliverable');

      const freelancerBefore = await ethers.provider.getBalance(freelancer.address);
      await escrow.connect(client).releasePayment(1);
      const freelancerAfter = await ethers.provider.getBalance(freelancer.address);

      const expectedFee = (ONE_MATIC * 300n) / 10000n;
      const expectedPayment = ONE_MATIC - expectedFee;
      expect(freelancerAfter - freelancerBefore).to.equal(expectedPayment);

      const job = await escrow.getJob(1);
      expect(job.status).to.equal(2); // Released
    });

    it('should reject release from non-client', async () => {
      const { escrow, client, freelancer, other } = await loadFixture(deployFixture);
      await escrow.connect(client).createJob(freelancer.address, { value: ONE_MATIC });
      await expect(
        escrow.connect(other).releasePayment(1)
      ).to.be.revertedWith('NOT_CLIENT');
    });
  });

  describe('Dispute Resolution', () => {
    it('should allow client to raise a dispute', async () => {
      const { escrow, client, freelancer } = await loadFixture(deployFixture);
      await escrow.connect(client).createJob(freelancer.address, { value: ONE_MATIC });
      await escrow.connect(freelancer).markDelivered(1, 'bafydeliverable');
      await escrow.connect(client).raiseDispute(1, 'Work is incomplete');

      const job = await escrow.getJob(1);
      expect(job.status).to.equal(3); // Disputed
      expect(job.disputeReason).to.equal('Work is incomplete');
    });

    it('should allow freelancer to raise a dispute', async () => {
      const { escrow, client, freelancer } = await loadFixture(deployFixture);
      await escrow.connect(client).createJob(freelancer.address, { value: ONE_MATIC });
      await escrow.connect(freelancer).raiseDispute(1, 'Client refusing to approve');

      const job = await escrow.getJob(1);
      expect(job.status).to.equal(3); // Disputed
    });

    it('should resolve dispute in favor of freelancer', async () => {
      const { escrow, platform, client, freelancer } = await loadFixture(deployFixture);
      await escrow.connect(client).createJob(freelancer.address, { value: ONE_MATIC });
      await escrow.connect(freelancer).markDelivered(1, 'bafydeliverable');
      await escrow.connect(client).raiseDispute(1, 'Work is bad');

      const freelancerBefore = await ethers.provider.getBalance(freelancer.address);
      await escrow.connect(platform).resolveDispute(1, true);
      const freelancerAfter = await ethers.provider.getBalance(freelancer.address);

      const expectedFee = (ONE_MATIC * 300n) / 10000n;
      expect(freelancerAfter - freelancerBefore).to.equal(ONE_MATIC - expectedFee);

      const job = await escrow.getJob(1);
      expect(job.status).to.equal(4); // Resolved
    });

    it('should resolve dispute in favor of client (refund)', async () => {
      const { escrow, platform, client, freelancer } = await loadFixture(deployFixture);
      await escrow.connect(client).createJob(freelancer.address, { value: ONE_MATIC });
      await escrow.connect(client).raiseDispute(1, 'Freelancer ghosted');

      const clientBefore = await ethers.provider.getBalance(client.address);
      await escrow.connect(platform).resolveDispute(1, false);
      const clientAfter = await ethers.provider.getBalance(client.address);

      expect(clientAfter - clientBefore).to.equal(ONE_MATIC);

      const job = await escrow.getJob(1);
      expect(job.status).to.equal(5); // Refunded
    });

    it('should only allow platform to resolve disputes', async () => {
      const { escrow, client, freelancer } = await loadFixture(deployFixture);
      await escrow.connect(client).createJob(freelancer.address, { value: ONE_MATIC });
      await escrow.connect(client).raiseDispute(1, 'Bad work');

      await expect(
        escrow.connect(client).resolveDispute(1, false)
      ).to.be.revertedWith('NOT_PLATFORM');
    });
  });

  describe('Auto-Release (7 day)', () => {
    it('should allow freelancer to auto-claim after 7 days', async () => {
      const { escrow, client, freelancer } = await loadFixture(deployFixture);
      await escrow.connect(client).createJob(freelancer.address, { value: ONE_MATIC });
      await escrow.connect(freelancer).markDelivered(1, 'bafydeliverable');

      // Fast-forward 7 days
      await time.increase(7 * 24 * 60 * 60);

      const freelancerBefore = await ethers.provider.getBalance(freelancer.address);
      const tx = await escrow.connect(freelancer).autoRelease(1);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      const freelancerAfter = await ethers.provider.getBalance(freelancer.address);

      const expectedFee = (ONE_MATIC * 300n) / 10000n;
      expect(freelancerAfter - freelancerBefore + gasCost).to.equal(ONE_MATIC - expectedFee);
    });

    it('should reject auto-release before 7 days', async () => {
      const { escrow, client, freelancer } = await loadFixture(deployFixture);
      await escrow.connect(client).createJob(freelancer.address, { value: ONE_MATIC });
      await escrow.connect(freelancer).markDelivered(1, 'bafydeliverable');

      await expect(
        escrow.connect(freelancer).autoRelease(1)
      ).to.be.revertedWith('TOO_EARLY');
    });
  });
});
