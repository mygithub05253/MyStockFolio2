const express = require('express');
const router = express.Router();
const tokenService = require('../services/tokenService');

/**
 * GET /api/blockchain/token/balance
 * 토큰 잔액 조회
 */
router.get('/balance', async (req, res, next) => {
    try {
        const { address } = req.query;
        
        if (!address) {
            return res.status(400).json({ error: 'address parameter is required' });
        }
        
        const balance = await tokenService.getBalance(address);
        res.json(balance);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/blockchain/token/mint
 * 토큰 리워드 민팅
 */
router.post('/mint', async (req, res, next) => {
    try {
        const { toAddress, amount, activity } = req.body;
        
        if (!toAddress || !amount || !activity) {
            return res.status(400).json({ 
                error: 'toAddress, amount, and activity are required' 
            });
        }
        
        // 주소 형식 검증 (0x로 시작, 42자)
        if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
            return res.status(400).json({ error: 'Invalid Ethereum address format' });
        }
        
        // amount 검증 (양수)
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({ error: 'amount must be a positive number' });
        }
        
        const result = await tokenService.mintReward(toAddress, amountNum, activity);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/blockchain/token/batch-mint
 * 일괄 토큰 민팅
 */
router.post('/batch-mint', async (req, res, next) => {
    try {
        const { recipients, amounts, activities } = req.body;
        
        if (!recipients || !amounts || !activities) {
            return res.status(400).json({ 
                error: 'recipients, amounts, and activities arrays are required' 
            });
        }
        
        if (recipients.length !== amounts.length || amounts.length !== activities.length) {
            return res.status(400).json({ 
                error: 'recipients, amounts, and activities must have the same length' 
            });
        }
        
        // 주소 검증
        for (const address of recipients) {
            if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
                return res.status(400).json({ 
                    error: `Invalid Ethereum address: ${address}` 
                });
            }
        }
        
        const result = await tokenService.batchMintReward(recipients, amounts, activities);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/blockchain/token/info
 * 토큰 정보 조회
 */
router.get('/info', async (req, res, next) => {
    try {
        const info = await tokenService.getTokenInfo();
        res.json(info);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/blockchain/token/supply
 * 총 공급량 조회
 */
router.get('/supply', async (req, res, next) => {
    try {
        const totalSupply = await tokenService.getTotalSupply();
        res.json({ totalSupply });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

