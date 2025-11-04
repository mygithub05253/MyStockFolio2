const { ethers } = require('ethers');

let provider;
let signer;
let folioTokenContract;
let nftContract;

/**
 * Web3 Provider 초기화
 */
function initializeProvider() {
    const rpcUrl = process.env.RPC_URL;
    
    if (!rpcUrl) {
        throw new Error('RPC_URL environment variable is required');
    }

    provider = new ethers.JsonRpcProvider(rpcUrl);
    console.log(`✅ Provider initialized: ${process.env.NETWORK || 'localhost'}`);

    // Private Key로 Signer 생성
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey) {
        signer = new ethers.Wallet(privateKey, provider);
        console.log(`✅ Signer initialized: ${signer.address}`);
    } else {
        console.warn('⚠️ PRIVATE_KEY not set, read-only mode');
    }

    // 컨트랙트 인스턴스 생성
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

