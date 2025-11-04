const express = require('express');
const router = express.Router();
const transactionService = require('../services/transactionService');

/**
 * GET /api/blockchain/transaction/:txHash
 * 트랜잭션 상세 정보 조회
 */
router.get('/:txHash', async (req, res, next) => {
    try {
        const { txHash } = req.params;
        
        if (!txHash || !txHash.startsWith('0x')) {
            return res.status(400).json({ error: 'Invalid transaction hash' });
        }
        
        const details = await transactionService.getTransactionDetails(txHash);
        res.json(details);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
