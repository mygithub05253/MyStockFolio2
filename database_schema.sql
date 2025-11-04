-- ========================================
-- MyStockFolio Complete Database Schema
-- 블록체인 기반 자산 관리 시스템 (클라우드 네이티브 MSA + ERC-20)
-- ========================================

-- 1. 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS mystockfolio_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE mystockfolio_db;

-- ========================================
-- 2. 테이블 생성
-- ========================================

-- 2.1. users 테이블 (User Entity)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '사용자 이메일 (고유)',
    password VARCHAR(255) NULL COMMENT '비밀번호 해시 (OAuth2 사용자는 NULL)',
    nickname VARCHAR(50) NOT NULL COMMENT '사용자 닉네임',
    wallet_address VARCHAR(42) NULL COMMENT '블록체인 지갑 주소 (0x...)',
    provider VARCHAR(20) NOT NULL DEFAULT 'mystockfolio' COMMENT '인증 제공자 (mystockfolio, google, naver, kakao)',
    provider_id VARCHAR(100) NULL COMMENT 'OAuth2 제공자의 고유 사용자 ID',
    is_oauth2_signup BOOLEAN DEFAULT FALSE COMMENT 'OAuth2 회원가입 여부 (추가 정보 입력 필요)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.2. portfolio 테이블 (Portfolio Entity)
CREATE TABLE IF NOT EXISTS portfolio (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT 'User 테이블 외래키',
    name VARCHAR(50) NOT NULL COMMENT '포트폴리오 이름',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.3. asset 테이블 (Asset Entity)
CREATE TABLE IF NOT EXISTS asset (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    portfolio_id BIGINT NOT NULL COMMENT 'Portfolio 테이블 외래키',
    asset_type VARCHAR(15) NOT NULL COMMENT 'STOCK, COIN, STABLECOIN, DEFI, NFT, OTHER',
    ticker VARCHAR(20) NOT NULL COMMENT '자산 티커 심볼',
    name VARCHAR(100) NULL COMMENT '자산 이름 (선택)',
    quantity DOUBLE NOT NULL COMMENT '보유 수량',
    avgBuyPrice DOUBLE NOT NULL COMMENT '평균 매입 가격 (camelCase)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
    FOREIGN KEY (portfolio_id) REFERENCES portfolio(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.4. reward_history 테이블 (리워드 이력)
CREATE TABLE IF NOT EXISTS reward_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT 'User 테이블 외래키',
    wallet_address VARCHAR(42) NOT NULL COMMENT '지갑 주소',
    activity_type VARCHAR(50) NOT NULL COMMENT '활동 타입 (asset_added, portfolio_updated, dashboard_analysis 등)',
    amount DOUBLE NOT NULL COMMENT '리워드 금액 (FOLIO 토큰)',
    transaction_hash VARCHAR(66) NULL COMMENT '블록체인 트랜잭션 해시',
    balance_score DOUBLE NULL COMMENT '포트폴리오 균형 점수',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.5. achievement_history 테이블 (NFT 성과 이력)
CREATE TABLE IF NOT EXISTS achievement_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT 'User 테이블 외래키',
    wallet_address VARCHAR(42) NOT NULL COMMENT '지갑 주소',
    achievement_type VARCHAR(50) NOT NULL COMMENT '성과 타입 (portfolio_maintained_90days, return_rate_10percent 등)',
    token_id BIGINT NULL COMMENT 'NFT 토큰 ID',
    transaction_hash VARCHAR(66) NULL COMMENT '블록체인 트랜잭션 해시',
    token_uri VARCHAR(500) NULL COMMENT 'NFT 메타데이터 URI (IPFS 또는 data URI)',
    ipfs_hash VARCHAR(100) NULL COMMENT 'IPFS 해시',
    metadata JSON NULL COMMENT '메타데이터 (period, returnRate 등)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 3. 인덱스 생성 (성능 최적화)
-- ========================================

-- users 테이블 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider_provider_id ON users(provider, provider_id);

-- portfolio 테이블 인덱스
CREATE INDEX idx_portfolio_user_id ON portfolio(user_id);

-- asset 테이블 인덱스
CREATE INDEX idx_asset_portfolio_id ON asset(portfolio_id);
CREATE INDEX idx_asset_ticker ON asset(ticker);
CREATE INDEX idx_asset_type ON asset(asset_type);

-- reward_history, achievement_history 인덱스
CREATE INDEX idx_reward_history_user_id ON reward_history(user_id);
CREATE INDEX idx_reward_history_created_at ON reward_history(created_at);
CREATE INDEX idx_achievement_history_user_id ON achievement_history(user_id);
CREATE INDEX idx_achievement_history_type ON achievement_history(achievement_type);

