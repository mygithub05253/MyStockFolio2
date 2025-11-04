const express = require('express');
const router = express.Router();
const nftService = require('../services/nftService');

/**
 * POST /api/blockchain/nft/mint
 * 성과 NFT 민팅
 */
router.post('/mint', async (req, res, next) => {
    try {
        const { toAddress, achievementType, metadata } = req.body;
        
        if (!toAddress || !achievementType || !metadata) {
            return res.status(400).json({ 
                error: 'toAddress, achievementType, and metadata are required' 
            });
        }
        
        // 주소 형식 검증
        if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
            return res.status(400).json({ error: 'Invalid Ethereum address format' });
        }
        
        const result = await nftService.mintAchievement(toAddress, achievementType, metadata);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/blockchain/nft/owned
 * 사용자 NFT 목록 조회
 */
router.get('/owned', async (req, res, next) => {
    try {
        const { address } = req.query;
        
        if (!address) {
            return res.status(400).json({ error: 'address parameter is required' });
        }
        
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return res.status(400).json({ error: 'Invalid Ethereum address format' });
        }
        
        const nfts = await nftService.getOwnedNFTs(address);
        res.json({ address, nfts, count: nfts.length });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/blockchain/nft/:tokenId
 * NFT 상세 정보 조회
 */
router.get('/:tokenId', async (req, res, next) => {
    try {
        const { tokenId } = req.params;
        
        if (!tokenId || isNaN(tokenId)) {
            return res.status(400).json({ error: 'Invalid tokenId' });
        }
        
        const nft = await nftService.getNFTDetails(tokenId);
        res.json(nft);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/blockchain/nft/supply
 * NFT 총 발행량 조회
 */
router.get('/supply', async (req, res, next) => {
    try {
        const totalSupply = await nftService.getTotalSupply();
        res.json({ totalSupply });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

