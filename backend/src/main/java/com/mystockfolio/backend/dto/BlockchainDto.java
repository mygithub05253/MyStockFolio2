package com.mystockfolio.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

public class BlockchainDto {

    /**
     * 토큰 잔액 조회 응답
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TokenBalanceResponse {
        private BigDecimal balance;
        private String balanceFormatted;
        private String balanceRaw;
    }

    /**
     * 토큰 민팅 응답
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MintRewardResponse {
        private Boolean success;
        private String transactionHash;
        private Long blockNumber;
        private String gasUsed;
        private Double amount;
        private String to;
        private String activity;
    }

    /**
     * NFT 민팅 응답
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MintAchievementResponse {
        private Boolean success;
        private String transactionHash;
        private Long blockNumber;
        private String tokenId;
        private String tokenURI;
        private String ipfsHash;
        private String achievementType;
        private String to;
    }

    /**
     * 소유 NFT 목록 조회 응답
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OwnedNFTsResponse {
        private String address;
        private List<NFTSummary> nfts;
        private Integer count;
    }

    /**
     * NFT 요약 정보
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NFTSummary {
        private String tokenId;
        private String tokenURI;
        private String achievementType;
        private String timestamp;
        private String ipfsHash;
        private String contractAddress;
    }

    /**
     * NFT 상세 정보 조회 응답
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NFTDetailsResponse {
        private String tokenId;
        private String owner;
        private String tokenURI;
        private String achievementType;
        private String timestamp;
        private String ipfsHash;
    }

    /**
     * 토큰 정보 조회 응답
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TokenInfoResponse {
        private String name;
        private String symbol;
        private String totalSupply;
        private String decimals;
        private String address;
    }

    /**
     * 리워드 히스토리 응답
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RewardHistoryResponse {
        private List<RewardHistoryItem> rewards;
        private Integer totalCount;
    }

    /**
     * 리워드 히스토리 아이템
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RewardHistoryItem {
        private String activity;
        private Double amount;
        private String timestamp;
        private String transactionHash;
        private String tokenType;
    }

    /**
     * NFT 발행 히스토리 응답
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AchievementHistoryResponse {
        private List<AchievementHistoryItem> achievements;
        private Integer totalCount;
    }

    /**
     * NFT 발행 히스토리 아이템
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AchievementHistoryItem {
        private String achievementType;
        private String tokenId;
        private String timestamp;
        private String transactionHash;
        private String tokenType;
        private java.util.Map<String, Object> metadata;
    }

    /**
     * 트랜잭션 상세 정보 응답
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransactionDetailsResponse {
        private String transactionHash;
        private String status;
        private String from;
        private String to;
        private String value;
        private Long blockNumber;
        private String blockHash;
        private Long confirmations;
        private String gasUsed;
        private String gasPrice;
        private String effectiveGasPrice;
        private Long timestamp;
        private String timestampFormatted;
        private Integer transactionIndex;
        private Long nonce;
        private String input;
        private Integer logs;
    }
}

