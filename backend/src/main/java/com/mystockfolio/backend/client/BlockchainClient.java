package com.mystockfolio.backend.client;

import com.mystockfolio.backend.dto.BlockchainDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@Component
public class BlockchainClient {

    private final WebClient webClient;

    public BlockchainClient(@Value("${blockchain.api.url}") String blockchainUrl, WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl(blockchainUrl).build();
        log.info("BlockchainClient initialized with URL: {}", blockchainUrl);
    }

    /**
     * 토큰 잔액 조회
     */
    public Mono<BlockchainDto.TokenBalanceResponse> getTokenBalance(String walletAddress) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder.path("/api/blockchain/token/balance")
                        .queryParam("address", walletAddress)
                        .build())
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    log.error("Error calling Blockchain API for balance: {}", response.statusCode());
                    return response.createException();
                })
                .bodyToMono(BlockchainDto.TokenBalanceResponse.class)
                .onErrorResume(e -> {
                    log.error("Failed to get token balance: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    /**
     * 토큰 리워드 민팅
     */
    public Mono<BlockchainDto.MintRewardResponse> mintReward(
            String toAddress, 
            Double amount, 
            String activity) {
        
        Map<String, Object> requestBody = Map.of(
            "toAddress", toAddress,
            "amount", amount,
            "activity", activity
        );

        return webClient.post()
                .uri("/api/blockchain/token/mint")
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    log.error("Error calling Blockchain API for mint: {}", response.statusCode());
                    return response.createException();
                })
                .bodyToMono(BlockchainDto.MintRewardResponse.class)
                .onErrorResume(e -> {
                    log.error("Failed to mint reward: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    /**
     * NFT 성과 인증서 민팅
     */
    public Mono<BlockchainDto.MintAchievementResponse> mintAchievement(
            String toAddress,
            String achievementType,
            Map<String, Object> metadata) {
        
        Map<String, Object> requestBody = Map.of(
            "toAddress", toAddress,
            "achievementType", achievementType,
            "metadata", metadata
        );

        return webClient.post()
                .uri("/api/blockchain/nft/mint")
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    log.error("Error calling Blockchain API for NFT mint: {}", response.statusCode());
                    return response.createException();
                })
                .bodyToMono(BlockchainDto.MintAchievementResponse.class)
                .onErrorResume(e -> {
                    log.error("Failed to mint NFT: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    /**
     * 사용자 NFT 목록 조회
     */
    public Mono<BlockchainDto.OwnedNFTsResponse> getOwnedNFTs(String walletAddress) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder.path("/api/blockchain/nft/owned")
                        .queryParam("address", walletAddress)
                        .build())
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    log.error("Error calling Blockchain API for owned NFTs: {}", response.statusCode());
                    return response.createException();
                })
                .bodyToMono(BlockchainDto.OwnedNFTsResponse.class)
                .onErrorResume(e -> {
                    log.error("Failed to get owned NFTs: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    /**
     * NFT 상세 정보 조회
     */
    public Mono<BlockchainDto.NFTDetailsResponse> getNFTDetails(String tokenId) {
        return webClient.get()
                .uri("/api/blockchain/nft/{tokenId}", tokenId)
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    log.error("Error calling Blockchain API for NFT details: {}", response.statusCode());
                    return response.createException();
                })
                .bodyToMono(BlockchainDto.NFTDetailsResponse.class)
                .onErrorResume(e -> {
                    log.error("Failed to get NFT details: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    /**
     * 토큰 정보 조회
     */
    public Mono<BlockchainDto.TokenInfoResponse> getTokenInfo() {
        return webClient.get()
                .uri("/api/blockchain/token/info")
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    log.error("Error calling Blockchain API for token info: {}", response.statusCode());
                    return response.createException();
                })
                .bodyToMono(BlockchainDto.TokenInfoResponse.class)
                .onErrorResume(e -> {
                    log.error("Failed to get token info: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    /**
     * 트랜잭션 상세 정보 조회
     */
    public Mono<BlockchainDto.TransactionDetailsResponse> getTransactionDetails(String txHash) {
        return webClient.get()
                .uri("/api/blockchain/transaction/{txHash}", txHash)
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    log.error("Error calling Blockchain API for transaction details: {}", response.statusCode());
                    return response.createException();
                })
                .bodyToMono(BlockchainDto.TransactionDetailsResponse.class)
                .onErrorResume(e -> {
                    log.error("Failed to get transaction details: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    /**
     * 헬스체크
     */
    public Mono<String> getHealth() {
        return webClient.get()
                .uri("/health")
                .retrieve()
                .onStatus(status -> status.isError(), response -> response.createException())
                .bodyToMono(String.class)
                .onErrorResume(e -> Mono.empty());
    }
}

