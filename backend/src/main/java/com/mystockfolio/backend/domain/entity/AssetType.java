package com.mystockfolio.backend.domain.entity; // 패키지 경로 변경

/**
 * 블록체인 기반 자산 관리 시스템의 자산 유형
 */
public enum AssetType {
    // 전통 자산
    STOCK,          // 주식 (예: AAPL, TSLA)
    
    // 암호화폐 관련
    COIN,           // 일반 코인/토큰 (예: BTC, ETH, ADA)
    STABLECOIN,     // 스테이블코인 (예: USDT, USDC, DAI)
    DEFI,           // 디파이 토큰 (예: UNI, AAVE, COMP)
    NFT,            // NFT (예: BAYC, CryptoPunks)
    
    // 기타
    OTHER           // 기타 블록체인 자산
}