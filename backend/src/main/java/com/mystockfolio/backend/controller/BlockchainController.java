package com.mystockfolio.backend.controller;

import com.mystockfolio.backend.config.JwtAuthenticationFilter;
import com.mystockfolio.backend.domain.entity.AchievementHistory;
import com.mystockfolio.backend.domain.entity.RewardHistory;
import com.mystockfolio.backend.dto.BlockchainDto;
import com.mystockfolio.backend.repository.AchievementHistoryRepository;
import com.mystockfolio.backend.repository.RewardHistoryRepository;
import com.mystockfolio.backend.repository.UserRepository;
import com.mystockfolio.backend.service.RewardService;
import com.mystockfolio.backend.client.BlockchainClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping("/api/blockchain")
@RequiredArgsConstructor
public class BlockchainController {

    private final RewardService rewardService;
    private final RewardHistoryRepository rewardHistoryRepository;
    private final AchievementHistoryRepository achievementHistoryRepository;
    private final BlockchainClient blockchainClient;
    private final UserRepository userRepository;

    /**
     * Security Context에서 현재 로그인한 사용자 ID 추출
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getPrincipal() instanceof JwtAuthenticationFilter.CustomUserDetails) {
            JwtAuthenticationFilter.CustomUserDetails userDetails = 
                (JwtAuthenticationFilter.CustomUserDetails) authentication.getPrincipal();
            Long userId = userDetails.getUserId();
            log.debug("현재 사용자 ID 추출: {}", userId);
            return userId;
        }
        
        log.warn("인증된 사용자를 찾을 수 없습니다.");
        return null;
    }

    /**
     * GET /api/blockchain/token/balance
     * 토큰 잔액 조회
     */
    @GetMapping("/token/balance")
    public ResponseEntity<?> getTokenBalance(@RequestParam String address) {
        log.info("토큰 잔액 조회 요청 - address: {}", address);
        
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return rewardService.getTokenBalance(address)
                .blockOptional()
                .map(balance -> ResponseEntity.ok().body(balance))
                .orElse(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
    }

    /**
     * GET /api/blockchain/token/info
     * 토큰 정보 조회
     */
    @GetMapping("/token/info")
    public Mono<ResponseEntity<?>> getTokenInfo() {
        log.info("토큰 정보 조회 요청");
        
        Long userId = getCurrentUserId();
        if (userId == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        // blockchain-api 직접 호출 (RewardService 거치지 않고)
        // TODO: RewardService에 getTokenInfo 메서드 추가 필요
        return Mono.just(ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build());
    }

    /**
     * GET /api/blockchain/nft/owned
     * 소유 NFT 목록 조회
     */
    @GetMapping("/nft/owned")
    public ResponseEntity<?> getOwnedNFTs(@RequestParam String address) {
        log.info("소유 NFT 목록 조회 요청 - address: {}", address);
        
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return rewardService.getOwnedNFTs(address)
                .blockOptional()
                .map(nfts -> ResponseEntity.ok().body(nfts))
                .orElse(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
    }

    /**
     * GET /api/blockchain/nft/{tokenId}
     * NFT 상세 정보 조회
     */
    @GetMapping("/nft/{tokenId}")
    public ResponseEntity<?> getNFTDetails(@PathVariable String tokenId) {
        log.info("NFT 상세 정보 조회 요청 - tokenId: {}", tokenId);
        
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // 동기 방식으로 처리 (임시로 빈 응답)
        log.warn("NFT 상세 정보 조회는 추후 구현 예정");
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }

    /**
     * GET /api/blockchain/reward/history
     * 리워드 히스토리 조회
     */
    @GetMapping("/reward/history")
    public ResponseEntity<?> getRewardHistory() {
        log.info("리워드 히스토리 조회 요청");
        
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<RewardHistory> histories = rewardHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        List<BlockchainDto.RewardHistoryItem> items = histories.stream()
                .map(history -> {
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                    return BlockchainDto.RewardHistoryItem.builder()
                            .activity(history.getActivityType())
                            .amount(history.getAmount())
                            .timestamp(history.getCreatedAt().format(formatter))
                            .transactionHash(history.getTransactionHash())
                            .tokenType("ERC-20")
                            .build();
                })
                .collect(Collectors.toList());

        BlockchainDto.RewardHistoryResponse response = BlockchainDto.RewardHistoryResponse.builder()
                .rewards(items)
                .totalCount(items.size())
                .build();

        return ResponseEntity.ok().body(response);
    }

    /**
     * GET /api/blockchain/achievement/history
     * NFT 발행 히스토리 조회
     */
    @GetMapping("/achievement/history")
    public ResponseEntity<?> getAchievementHistory() {
        log.info("NFT 발행 히스토리 조회 요청");
        
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<AchievementHistory> histories = achievementHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        List<BlockchainDto.AchievementHistoryItem> items = histories.stream()
                .map(history -> {
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                    return BlockchainDto.AchievementHistoryItem.builder()
                            .achievementType(history.getAchievementType())
                            .tokenId(history.getTokenId())
                            .timestamp(history.getCreatedAt().format(formatter))
                            .transactionHash(history.getTransactionHash())
                            .tokenType("ERC-721")
                            .metadata(history.getMetadata())
                            .build();
                })
                .collect(Collectors.toList());

        BlockchainDto.AchievementHistoryResponse response = BlockchainDto.AchievementHistoryResponse.builder()
                .achievements(items)
                .totalCount(items.size())
                .build();

        return ResponseEntity.ok().body(response);
    }

    /**
     * GET /api/blockchain/transaction/{txHash}
     * 트랜잭션 상세 정보 조회
     */
    @GetMapping("/transaction/{txHash}")
    public ResponseEntity<?> getTransactionDetails(@PathVariable String txHash) {
        log.info("트랜잭션 상세 정보 조회 요청 - txHash: {}", txHash);
        
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return blockchainClient.getTransactionDetails(txHash)
                .blockOptional()
                .map(details -> ResponseEntity.ok().body(details))
                .orElse(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
    }

    /**
     * POST /api/blockchain/nft/test-mint
     * NFT 강제 발행 (테스트용 - 데모 영상 촬영용)
     */
    @PostMapping("/nft/test-mint")
    public ResponseEntity<?> testMintNFT(@RequestBody Map<String, Object> request) {
        log.info("NFT 강제 발행 테스트 요청");
        
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                log.warn("인증된 사용자를 찾을 수 없습니다.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "인증이 필요합니다."));
            }

            String achievementType = (String) request.getOrDefault("achievementType", "return_rate_10percent");
            Map<String, Object> metadata = (Map<String, Object>) request.getOrDefault("metadata", new HashMap<>());
            
            // 사용자의 지갑 주소 조회
            var user = userRepository.findById(userId);
            
            if (user.isEmpty()) {
                log.error("사용자를 찾을 수 없습니다. userId: {}", userId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "사용자를 찾을 수 없습니다."));
            }
            
            if (user.get().getWalletAddress() == null) {
                log.warn("지갑 주소가 등록되지 않았습니다. userId: {}", userId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "지갑 주소가 등록되지 않았습니다."));
            }

            String walletAddress = user.get().getWalletAddress();
            log.info("NFT 발행 시도 - userId: {}, walletAddress: {}, achievementType: {}", 
                    userId, walletAddress, achievementType);
            
            // 기본 메타데이터 설정
            if (metadata.isEmpty()) {
                metadata.put("returnRate", "10.0");
                metadata.put("period", "90");
                metadata.put("totalValue", "1000000");
            }

            var result = rewardService.mintAchievementNFT(userId, walletAddress, achievementType, metadata)
                    .blockOptional();
            
            if (result.isPresent()) {
                var response = result.get();
                log.info("NFT 발행 성공 - tokenId: {}, txHash: {}", 
                        response.getTokenId(), response.getTransactionHash());
                return ResponseEntity.ok().body(response);
            } else {
                log.error("NFT 발행 실패 - 응답이 비어있습니다. userId: {}", userId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "NFT 발행에 실패했습니다. 블록체인 API를 확인하세요."));
            }
        } catch (Exception e) {
            log.error("NFT 발행 중 예외 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "NFT 발행 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
}

