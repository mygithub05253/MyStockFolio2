// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PortfolioAchievementNFT
 * @dev ERC-721 NFT 인증서 컨트랙트
 * - 포트폴리오 성과 달성 시 NFT 발행
 * - IPFS 메타데이터 URI 저장
 * - Ownable 패턴으로 blockchain-api만 민팅 가능
 */
contract PortfolioAchievementNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    // 성과 타입 매핑
    mapping(uint256 => string) private _achievementTypes;
    mapping(uint256 => uint256) private _achievementTimestamps;

    // 이벤트
    event AchievementMinted(
        address indexed to,
        uint256 indexed tokenId,
        string achievementType,
        string tokenURI
    );

    constructor() ERC721("Portfolio Achievement", "PFCHV") Ownable(msg.sender) {}

    /**
     * @dev 성과 NFT 민팅
     * @param to NFT를 받을 주소
     * @param achievementType 성과 타입 (예: "portfolio_maintained_90days", "return_rate_20_percent")
     * @param tokenURI IPFS 메타데이터 URI
     * @return tokenId 발행된 NFT 토큰 ID
     */
    function mintAchievement(
        address to,
        string memory achievementType,
        string memory tokenURI
    ) external onlyOwner returns (uint256) {
        require(to != address(0), "NFT: cannot mint to zero address");
        require(bytes(tokenURI).length > 0, "NFT: tokenURI cannot be empty");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _mint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        _achievementTypes[newTokenId] = achievementType;
        _achievementTimestamps[newTokenId] = block.timestamp;

        emit AchievementMinted(to, newTokenId, achievementType, tokenURI);

        return newTokenId;
    }

    /**
     * @dev 토큰 ID로 성과 타입 조회
     * @param tokenId NFT 토큰 ID
     * @return achievementType 성과 타입
     */
    function getAchievementType(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "NFT: token does not exist");
        return _achievementTypes[tokenId];
    }

    /**
     * @dev 토큰 ID로 발행 시간 조회
     * @param tokenId NFT 토큰 ID
     * @return timestamp 발행 타임스탬프 (Unix timestamp)
     */
    function getAchievementTimestamp(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "NFT: token does not exist");
        return _achievementTimestamps[tokenId];
    }

    /**
     * @dev 사용자가 보유한 NFT 목록 조회
     * @param owner 조회할 주소
     * @return tokenIds NFT 토큰 ID 배열
     */
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= _tokenIds; i++) {
            if (_ownerOf(i) == owner) {
                tokenIds[currentIndex] = i;
                currentIndex++;
            }
        }

        return tokenIds;
    }

    /**
     * @dev 총 발행된 NFT 개수
     * @return totalSupply 총 발행량
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIds;
    }
}

