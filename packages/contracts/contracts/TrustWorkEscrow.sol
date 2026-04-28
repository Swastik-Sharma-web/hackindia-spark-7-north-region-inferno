// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TrustWorkEscrow
 * @notice Handles full payment lifecycle: fund locking, delivery, release,
 *         dispute resolution (AI-mediated), and 7-day auto-release.
 *         3% platform fee auto-collected on every payment.
 */
contract TrustWorkEscrow {
    enum JobStatus {
        Funded,
        Delivered,
        Released,
        Disputed,
        Resolved,
        Refunded
    }

    struct Job {
        address client;
        address freelancer;
        uint256 amount;
        uint256 fee;
        uint256 createdAt;
        uint256 deliveredAt;
        JobStatus status;
        string deliverableCid;
        string disputeReason;
    }

    uint256 public constant FEE_BPS = 300; // 3%
    uint256 public constant AUTO_RELEASE_DELAY = 7 days;
    uint256 private _nextJobId = 1;
    address public immutable platformOwner;

    mapping(uint256 => Job) public jobs;

    event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, uint256 amount);
    event JobDelivered(uint256 indexed jobId, string deliverableCid);
    event PaymentReleased(uint256 indexed jobId, uint256 freelancerAmount, uint256 feeAmount);
    event DisputeRaised(uint256 indexed jobId, string reason);
    event DisputeResolved(uint256 indexed jobId, bool freelancerWins, uint256 amount);

    modifier onlyPlatform() {
        require(msg.sender == platformOwner, 'NOT_PLATFORM');
        _;
    }

    constructor() {
        platformOwner = msg.sender;
    }

    /**
     * @notice Client creates a job and locks MATIC in escrow.
     * @param freelancer Address of the hired freelancer.
     */
    function createJob(address freelancer) external payable returns (uint256 jobId) {
        require(msg.value > 0, 'NO_FUNDS');
        require(freelancer != address(0), 'INVALID_FREELANCER');
        require(freelancer != msg.sender, 'CANNOT_HIRE_SELF');

        jobId = _nextJobId;
        _nextJobId += 1;

        uint256 fee = (msg.value * FEE_BPS) / 10000;
        jobs[jobId] = Job({
            client: msg.sender,
            freelancer: freelancer,
            amount: msg.value,
            fee: fee,
            createdAt: block.timestamp,
            deliveredAt: 0,
            status: JobStatus.Funded,
            deliverableCid: '',
            disputeReason: ''
        });

        emit JobCreated(jobId, msg.sender, freelancer, msg.value);
    }

    /**
     * @notice Freelancer marks work as delivered with an IPFS deliverable hash.
     */
    function markDelivered(uint256 jobId, string calldata deliverableCid) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.freelancer, 'NOT_FREELANCER');
        require(job.status == JobStatus.Funded, 'INVALID_STATUS');

        job.status = JobStatus.Delivered;
        job.deliveredAt = block.timestamp;
        job.deliverableCid = deliverableCid;

        emit JobDelivered(jobId, deliverableCid);
    }

    /**
     * @notice Client approves the work and releases payment to freelancer.
     *         3% fee sent to platform owner.
     */
    function releasePayment(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.client, 'NOT_CLIENT');
        require(job.status == JobStatus.Delivered || job.status == JobStatus.Funded, 'INVALID_STATUS');

        job.status = JobStatus.Released;
        _payout(job);

        emit PaymentReleased(jobId, job.amount - job.fee, job.fee);
    }

    /**
     * @notice Either party can raise a dispute. Enters Disputed state.
     */
    function raiseDispute(uint256 jobId, string calldata reason) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.client || msg.sender == job.freelancer, 'NOT_PARTY');
        require(
            job.status == JobStatus.Funded || job.status == JobStatus.Delivered,
            'INVALID_STATUS'
        );

        job.status = JobStatus.Disputed;
        job.disputeReason = reason;

        emit DisputeRaised(jobId, reason);
    }

    /**
     * @notice Platform (AI arbiter backend) resolves a dispute.
     * @param freelancerWins If true, freelancer gets paid. If false, client is refunded.
     */
    function resolveDispute(uint256 jobId, bool freelancerWins) external onlyPlatform {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Disputed, 'NOT_DISPUTED');

        if (freelancerWins) {
            job.status = JobStatus.Resolved;
            _payout(job);
        } else {
            job.status = JobStatus.Refunded;
            payable(job.client).transfer(job.amount);
        }

        emit DisputeResolved(jobId, freelancerWins, job.amount);
    }

    /**
     * @notice Freelancer can claim funds if client is unresponsive for 7 days
     *         after delivery.
     */
    function autoRelease(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.freelancer, 'NOT_FREELANCER');
        require(job.status == JobStatus.Delivered, 'NOT_DELIVERED');
        require(block.timestamp >= job.deliveredAt + AUTO_RELEASE_DELAY, 'TOO_EARLY');

        job.status = JobStatus.Released;
        _payout(job);

        emit PaymentReleased(jobId, job.amount - job.fee, job.fee);
    }

    /**
     * @notice View a job's full details.
     */
    function getJob(uint256 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }

    /**
     * @dev Internal: send payment to freelancer and fee to platform.
     */
    function _payout(Job storage job) internal {
        uint256 freelancerAmount = job.amount - job.fee;
        payable(job.freelancer).transfer(freelancerAmount);
        payable(platformOwner).transfer(job.fee);
    }
}
