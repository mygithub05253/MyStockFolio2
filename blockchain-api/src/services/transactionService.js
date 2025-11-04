const { ethers } = require('ethers');
const { getProvider } = require('../config/web3Config');

/**
 * 트랜잭션 상세 정보 조회
 */
async function getTransactionDetails(txHash) {
    try {
        const provider = getProvider();
        
        // 트랜잭션 정보 조회
        const tx = await provider.getTransaction(txHash);
        if (!tx) {
            throw new Error('Transaction not found');
        }
        
        // 트랜잭션 영수증 조회
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt) {
            throw new Error('Transaction receipt not found');
        }
        
        // 블록 정보 조회
        const block = await provider.getBlock(receipt.blockNumber);
        
        // 현재 블록 번호 조회 (확인 수 계산용)
        const currentBlock = await provider.getBlockNumber();
        const confirmations = currentBlock - receipt.blockNumber + 1;
        
        return {
            transactionHash: txHash,
            status: receipt.status === 1 ? 'Success' : 'Failed',
            from: tx.from,
            to: tx.to || receipt.to,
            value: ethers.formatEther(tx.value || 0),
            blockNumber: receipt.blockNumber,
            blockHash: receipt.blockHash,
            confirmations: confirmations,
            gasUsed: receipt.gasUsed.toString(),
            gasPrice: tx.gasPrice ? tx.gasPrice.toString() : null,
            effectiveGasPrice: receipt.gasPrice ? receipt.gasPrice.toString() : null,
            timestamp: block.timestamp,
            timestampFormatted: new Date(block.timestamp * 1000).toISOString(),
            transactionIndex: receipt.transactionIndex,
            nonce: tx.nonce,
            input: tx.data,
            logs: receipt.logs.length
        };
    } catch (error) {
        throw new Error(`Failed to get transaction details: ${error.message}`);
    }
}

module.exports = {
    getTransactionDetails
};
