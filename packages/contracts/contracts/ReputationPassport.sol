// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title ReputationPassport
 * @notice ERC-5192 Soulbound NFT — non-transferable reputation credential.
 *         One passport per wallet. Score can be updated after job completions.
 */
contract ReputationPassport is ERC721, Ownable {
    struct PassportData {
        uint256 score;
        string skill;
        string historyCid;
        uint256 mintedAt;
        uint256 updatedAt;
        uint256 jobsCompleted;
        address issuer;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 => PassportData) public passportData;
    mapping(address => bool) public hasPassport;
    mapping(address => uint256) public walletToToken;

    event PassportMinted(address indexed owner, uint256 indexed tokenId, uint256 score, string skill, string historyCid);
    event PassportUpdated(uint256 indexed tokenId, uint256 newScore, string newHistoryCid, uint256 jobsCompleted);
    event Locked(uint256 tokenId);  // ERC-5192

    constructor() ERC721('TrustWork Reputation Passport', 'TWRP') Ownable(msg.sender) {}

    /**
     * @notice Mint a new soulbound passport for a freelancer.
     * @dev Only the platform owner (backend) can mint. One per wallet.
     */
    function mintPassport(
        address to,
        uint256 score,
        string calldata skill,
        string calldata historyCid
    ) external onlyOwner returns (uint256 tokenId) {
        require(!hasPassport[to], 'PASSPORT_EXISTS');
        require(score >= 70, 'SCORE_TOO_LOW');

        tokenId = _nextTokenId;
        _nextTokenId += 1;

        hasPassport[to] = true;
        walletToToken[to] = tokenId;
        passportData[tokenId] = PassportData({
            score: score,
            skill: skill,
            historyCid: historyCid,
            mintedAt: block.timestamp,
            updatedAt: block.timestamp,
            jobsCompleted: 0,
            issuer: msg.sender
        });

        _safeMint(to, tokenId);

        emit PassportMinted(to, tokenId, score, skill, historyCid);
        emit Locked(tokenId); // ERC-5192: signal this token is soulbound
    }

    /**
     * @notice Update a passport's score and IPFS history after job completion.
     */
    function updatePassport(
        uint256 tokenId,
        uint256 newScore,
        string calldata newHistoryCid
    ) external onlyOwner {
        require(ownerOf(tokenId) != address(0), 'TOKEN_NOT_FOUND');

        PassportData storage data = passportData[tokenId];
        data.score = newScore;
        data.historyCid = newHistoryCid;
        data.updatedAt = block.timestamp;
        data.jobsCompleted += 1;

        emit PassportUpdated(tokenId, newScore, newHistoryCid, data.jobsCompleted);
    }

    /**
     * @notice Get a wallet's passport token ID.
     */
    function getPassportByWallet(address wallet) external view returns (uint256) {
        require(hasPassport[wallet], 'NO_PASSPORT');
        return walletToToken[wallet];
    }

    /**
     * @notice ERC-5192: Returns true (locked/soulbound) for all minted tokens.
     */
    function locked(uint256 tokenId) external view returns (bool) {
        require(ownerOf(tokenId) != address(0), 'TOKEN_NOT_FOUND');
        return true; // Always locked — soulbound
    }

    /**
     * @dev Override _update to block all transfers. Only minting (from=0) and burning (to=0) allowed.
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = super._update(to, tokenId, auth);
        require(from == address(0) || to == address(0), 'SOULBOUND');
        return from;
    }
}
