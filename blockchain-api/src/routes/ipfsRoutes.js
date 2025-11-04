const express = require('express');
const router = express.Router();
const ipfsService = require('../services/ipfsService');

/**
 * POST /api/blockchain/ipfs/upload
 * 메타데이터 업로드 (테스트용)
 */
router.post('/upload', async (req, res, next) => {
    try {
        const { metadata } = req.body;
        
        if (!metadata) {
            return res.status(400).json({ error: 'metadata is required' });
        }
        
        const ipfsHash = await ipfsService.uploadMetadata(metadata);
        res.json({ 
            success: true,
            ipfsHash,
            tokenURI: `ipfs://${ipfsHash}`,
            gatewayURL: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/blockchain/ipfs/:hash
 * IPFS 메타데이터 조회
 */
router.get('/:hash', async (req, res, next) => {
    try {
        const { hash } = req.params;
        
        if (!hash) {
            return res.status(400).json({ error: 'IPFS hash is required' });
        }
        
        const metadata = await ipfsService.getMetadata(hash);
        res.json(metadata);
    } catch (error) {
        next(error);
    }
});

module.exports = router;

