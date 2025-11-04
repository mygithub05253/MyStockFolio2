const { ethers } = require('ethers');
const { getFolioTokenContract, getProvider } = require('../config/web3Config');

/**
 * 토큰 잔액 조회
 */
async function getBalance(address) {
    try {
        const contract = getFolioTokenContract();
        const balance = await contract.balanceOf(address);
        
        // 18 decimals로 변환
        const balanceFormatted = ethers.formatEther(balance);
        
        return {
            balance: parseFloat(balanceFormatted),
            balanceFormatted: `${balanceFormatted} FOLIO`,
            balanceRaw: balance.toString()
        };
    } catch (error) {
        throw new Error(`Failed to get token balance: ${error.message}`);
    }
}

/**
 * 토큰 민팅 (리워드 발행)
 */
async function mintReward(toAddress, amount, activity) {
    try {
        const contract = getFolioTokenContract();
        const { getProvider, getSigner } = require('../config/web3Config');
        const provider = getProvider();
        const signer = getSigner();
        
        // 현재 nonce 조회
        const nonce = await provider.getTransactionCount(signer.address, 'pending');
        console.log(`📝 Current nonce: ${nonce}`);
        
        // amount를 18 decimals로 변환 (예: 10 FOLIO -> 10000000000000000000)
        const amountWei = ethers.parseEther(amount.toString());
        
        // nonce를 명시적으로 설정하여 트랜잭션 전송
        const tx = await contract.mintReward(toAddress, amountWei, activity, {
            nonce: nonce
        });
        console.log(`📤 Mint transaction sent: ${tx.hash}`);
        
        // 트랜잭션 확인 대기
        const receipt = await tx.wait();
        console.log(`✅ Mint confirmed: ${receipt.transactionHash}`);
        
        return {
            success: true,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            amount: amount,
            to: toAddress,
            activity: activity
        };
    } catch (error) {
        console.error('Mint error:', error);
        throw new Error(`Failed to mint reward: ${error.message}`);
    }
}

/**
 * 일괄 토큰 민팅 (효율성 향상)
 */
async function batchMintReward(recipients, amounts, activities) {
    try {
        const contract = getFolioTokenContract();
        
        // amounts를 wei로 변환
        const amountsWei = amounts.map(amount => ethers.parseEther(amount.toString()));
        
        const tx = await contract.batchMintReward(recipients, amountsWei, activities);
        console.log(`📤 Batch mint transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Batch mint confirmed: ${receipt.transactionHash}`);
        
        return {
            success: true,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            count: recipients.length
        };
    } catch (error) {
        console.error('Batch mint error:', error);
        throw new Error(`Failed to batch mint rewards: ${error.message}`);
    }
}

/**
 * 토큰 총 공급량 조회
 */
async function getTotalSupply() {
    try {
        const contract = getFolioTokenContract();
        const totalSupply = await contract.totalSupply();
        return ethers.formatEther(totalSupply);
    } catch (error) {
        throw new Error(`Failed to get total supply: ${error.message}`);
    }
}

/**
 * 토큰 정보 조회
 */
async function getTokenInfo() {
    try {
        const contract = getFolioTokenContract();
        const [name, symbol, totalSupply, decimals] = await Promise.all([
            contract.name(),
            contract.symbol(),
            contract.totalSupply(),
            contract.decimals()
        ]);
        
        return {
            name,
            symbol,
            totalSupply: ethers.formatEther(totalSupply),
            decimals: decimals.toString(),
            address: await contract.getAddress()
        };
    } catch (error) {
        throw new Error(`Failed to get token info: ${error.message}`);
    }
}

module.exports = {
    getBalance,
    mintReward,
    batchMintReward,
    getTotalSupply,
    getTokenInfo
};

