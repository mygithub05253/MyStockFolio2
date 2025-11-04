const { ethers } = require('ethers');
const { getNFTContract } = require('../config/web3Config');
const ipfsService = require('./ipfsService');

/**
 * NFT 민팅 (성과 인증서 발행)
 */
async function mintAchievement(toAddress, achievementType, metadata) {
    try {
        let tokenURI;
        let ipfsHash = null;
        
        // 1. IPFS에 메타데이터 업로드 (옵셔널)
        try {
            console.log('📤 Uploading metadata to IPFS...');
            ipfsHash = await ipfsService.uploadMetadata(metadata);
            tokenURI = `ipfs://${ipfsHash}`;
            console.log(`✅ Metadata uploaded: ${tokenURI}`);
        } catch (ipfsError) {
            console.warn('⚠️ IPFS 업로드 실패, 로컬 메타데이터 사용:', ipfsError.message);
            // IPFS가 실패하면 로컬 메타데이터를 JSON으로 인코딩하여 사용
            // 또는 간단한 데이터 URI 사용
            const metadataJson = JSON.stringify(metadata);
            tokenURI = `data:application/json;base64,${Buffer.from(metadataJson).toString('base64')}`;
            console.log('📝 Using local metadata URI');
        }
        
        // 2. NFT 민팅
        const contract = getNFTContract();
        const { getProvider, getSigner } = require('../config/web3Config');
        const provider = getProvider();
        const signer = getSigner();
        
        // 현재 nonce 조회
        const nonce = await provider.getTransactionCount(signer.address, 'pending');
        console.log(`📝 Current nonce: ${nonce}`);
        
        // nonce를 명시적으로 설정하여 트랜잭션 전송
        const tx = await contract.mintAchievement(toAddress, achievementType, tokenURI, {
            nonce: nonce
        });
        const txHash = tx.hash;
        console.log(`📤 NFT mint transaction sent: ${txHash}`);
        
        // 3. 트랜잭션 확인 대기
        const receipt = await tx.wait();
        // ethers.js v6에서는 receipt.hash 또는 tx.hash 사용
        const confirmedTxHash = receipt.hash || txHash;
        console.log(`✅ NFT mint confirmed: ${confirmedTxHash}`);
        
        // 4. 발행된 Token ID 추출 (이벤트에서)
        const mintEvent = receipt.logs.find(log => {
            try {
                const parsed = contract.interface.parseLog(log);
                return parsed && parsed.name === 'AchievementMinted';
            } catch {
                return false;
            }
        });
        
        let tokenId = null;
        if (mintEvent) {
            try {
                const parsed = contract.interface.parseLog(mintEvent);
                tokenId = parsed.args.tokenId.toString();
                console.log(`🎨 Token ID extracted: ${tokenId}`);
            } catch (parseError) {
                console.warn('⚠️ Failed to parse mint event:', parseError);
                // 이벤트 파싱 실패 시 대체 방법 시도
                // 마지막으로 발행된 NFT의 ID를 조회
                try {
                    const totalSupply = await contract.totalSupply();
                    if (totalSupply > 0) {
                        tokenId = (BigInt(totalSupply) - 1n).toString();
                        console.log(`🎨 Token ID from totalSupply: ${tokenId}`);
                    }
                } catch (supplyError) {
                    console.error('Failed to get totalSupply:', supplyError);
                }
            }
        } else {
            console.warn('⚠️ Mint event not found in logs');
            // 이벤트를 찾지 못한 경우 대체 방법
            try {
                const totalSupply = await contract.totalSupply();
                if (totalSupply > 0) {
                    tokenId = (BigInt(totalSupply) - 1n).toString();
                    console.log(`🎨 Token ID from totalSupply (fallback): ${tokenId}`);
                }
            } catch (supplyError) {
                console.error('Failed to get totalSupply:', supplyError);
            }
        }
        
        return {
            success: true,
            transactionHash: confirmedTxHash,
            blockNumber: receipt.blockNumber,
            tokenId: tokenId,
            tokenURI: tokenURI,
            ipfsHash: ipfsHash,
            achievementType: achievementType,
            to: toAddress
        };
    } catch (error) {
        console.error('NFT mint error:', error);
        throw new Error(`Failed to mint NFT: ${error.message}`);
    }
}

/**
 * 사용자 NFT 목록 조회
 */
async function getOwnedNFTs(ownerAddress) {
    try {
        const contract = getNFTContract();
        const tokenIds = await contract.tokensOfOwner(ownerAddress);
        
        // NFT 컨트랙트 주소 가져오기
        const contractAddress = contract.target || contract.address;
        
        // 각 NFT의 상세 정보 조회
        const nftPromises = tokenIds.map(async (tokenId) => {
            const [tokenURI, achievementType, timestamp] = await Promise.all([
                contract.tokenURI(tokenId),
                contract.getAchievementType(tokenId),
                contract.getAchievementTimestamp(tokenId)
            ]);
            
            // tokenURI에서 메타데이터 파싱 (base64 또는 IPFS)
            let parsedMetadata = null;
            let ipfsHash = null;
            
            if (tokenURI && tokenURI.startsWith('data:application/json;base64,')) {
                try {
                    const base64Data = tokenURI.split(',')[1];
                    const decodedJson = Buffer.from(base64Data, 'base64').toString('utf-8');
                    parsedMetadata = JSON.parse(decodedJson);
                    console.log(`📝 Parsed metadata from data URI for token ${tokenId}:`, parsedMetadata);
                } catch (parseError) {
                    console.warn(`⚠️ Failed to parse base64 metadata for token ${tokenId}:`, parseError);
                }
            } else if (tokenURI && tokenURI.startsWith('ipfs://')) {
                ipfsHash = tokenURI.replace('ipfs://', '');
            }
            
            return {
                tokenId: tokenId.toString(),
                tokenURI,
                achievementType,
                timestamp: timestamp.toString(),
                ipfsHash: ipfsHash || (tokenURI.startsWith('ipfs://') ? tokenURI.replace('ipfs://', '') : null),
                contractAddress: contractAddress,
                metadata: parsedMetadata // 파싱된 메타데이터 포함
            };
        });
        
        const nfts = await Promise.all(nftPromises);
        return nfts;
    } catch (error) {
        throw new Error(`Failed to get owned NFTs: ${error.message}`);
    }
}

/**
 * NFT 상세 정보 조회
 */
async function getNFTDetails(tokenId) {
    try {
        const contract = getNFTContract();
        const [owner, tokenURI, achievementType, timestamp] = await Promise.all([
            contract.ownerOf(tokenId),
            contract.tokenURI(tokenId),
            contract.getAchievementType(tokenId),
            contract.getAchievementTimestamp(tokenId)
        ]);
        
        return {
            tokenId: tokenId.toString(),
            owner,
            tokenURI,
            achievementType,
            timestamp: timestamp.toString(),
            ipfsHash: tokenURI.replace('ipfs://', '')
        };
    } catch (error) {
        throw new Error(`Failed to get NFT details: ${error.message}`);
    }
}

/**
 * NFT 총 발행량 조회
 */
async function getTotalSupply() {
    try {
        const contract = getNFTContract();
        const totalSupply = await contract.totalSupply();
        return totalSupply.toString();
    } catch (error) {
        throw new Error(`Failed to get NFT total supply: ${error.message}`);
    }
}

module.exports = {
    mintAchievement,
    getOwnedNFTs,
    getNFTDetails,
    getTotalSupply
};

