const { ethers } = require('ethers');

let provider;
let signer;
let folioTokenContract;
let nftContract;

/**
 * Get RPC URL based on network name
 */
function getRpcUrl() {
    const network = (process.env.NETWORK || 'localhost').toLowerCase();
    
    switch (network) {
        case 'sepolia':
            return process.env.SEPOLIA_RPC_URL || process.env.RPC_URL;
        case 'bifrost':
            return process.env.BIFROST_RPC_URL || 'https://public-01.testnet.thebifrost.io/rpc';
        case 'localhost':
        case 'local':
        default:
            return process.env.RPC_URL || 'http://127.0.0.1:8545';
    }
}

/**
 * Web3 Provider 초기화
 */
function initializeProvider() {
    const rpcUrl = getRpcUrl();
    const network = (process.env.NETWORK || 'localhost').toLowerCase();

    if (!rpcUrl) {
        throw new Error(`RPC_URL for ${network} network is required. Please set ${network.toUpperCase()}_RPC_URL or RPC_URL in .env file.`);
    }

    provider = new ethers.JsonRpcProvider(rpcUrl);
    console.log(`✅ Provider initialized: ${network} (${rpcUrl})`);

    // Private Key로 Signer 생성
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey) {
        signer = new ethers.Wallet(privateKey, provider);
        console.log(`✅ Signer initialized: ${signer.address}`);
    } else {
        console.warn('⚠️  PRIVATE_KEY not set, read-only mode');
    }

    // 스마트 컨트랙트 인스턴스 생성
    const folioTokenAddress = process.env.FOLIO_TOKEN_ADDRESS;
    const nftAddress = process.env.NFT_CONTRACT_ADDRESS;

    if (folioTokenAddress && signer) {
        const folioTokenABI = require('../abis/FolioToken.json');
        folioTokenContract = new ethers.Contract(
            folioTokenAddress,
            folioTokenABI,
            signer
        );
        console.log(`✅ FolioToken contract connected: ${folioTokenAddress}`);   
    }

    if (nftAddress && signer) {
        const nftABI = require('../abis/PortfolioAchievementNFT.json');
        nftContract = new ethers.Contract(nftAddress, nftABI, signer);
        console.log(`✅ NFT contract connected: ${nftAddress}`);
    }
}

/**
 * 컨트랙트 인스턴스 가져오기
 */
function getFolioTokenContract() {
    if (!folioTokenContract) {
        throw new Error('FolioToken contract not initialized. Check FOLIO_TOKEN_ADDRESS and PRIVATE_KEY.');
    }
    return folioTokenContract;
}

function getNFTContract() {
    if (!nftContract) {
        throw new Error('NFT contract not initialized. Check NFT_CONTRACT_ADDRESS and PRIVATE_KEY.');
    }
    return nftContract;
}

function getProvider() {
    if (!provider) {
        initializeProvider();
    }
    return provider;
}

function getSigner() {
    if (!signer) {
        throw new Error('Signer not initialized. Check PRIVATE_KEY.');
    }
    return signer;
}

module.exports = {
    initializeProvider,
    getFolioTokenContract,
    getNFTContract,
    getProvider,
    getSigner
};

