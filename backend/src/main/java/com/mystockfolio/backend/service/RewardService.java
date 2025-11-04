package com.mystockfolio.backend.service;

import com.mystockfolio.backend.client.BlockchainClient;
import com.mystockfolio.backend.domain.entity.AchievementHistory;
import com.mystockfolio.backend.domain.entity.RewardHistory;
import com.mystockfolio.backend.domain.entity.User;
import com.mystockfolio.backend.dto.BlockchainDto;
import com.mystockfolio.backend.repository.AchievementHistoryRepository;
import com.mystockfolio.backend.repository.RewardHistoryRepository;
import com.mystockfolio.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class RewardService {

    private final BlockchainClient blockchainClient;
    private final RewardHistoryRepository rewardHistoryRepository;
    private final AchievementHistoryRepository achievementHistoryRepository;
    private final UserRepository userRepository;

    /**
     * 포트폴리오 균형 점수 계산
     * - assetType 다양성: 다양한 자산 유형(STOCK, COIN, ETF 등) 보유 시 높은 점수
     * - 섹터 분산도: 같은 섹터에 집중된 경우 낮은 점수
     * @param portfolios 포트폴리오 자산 리스트
     * @return 균형 점수 (0.0 ~ 1.0)
     */
    public Double calculateDiversityScore(List<Map<String, Object>> portfolios) {
        if (portfolios == null || portfolios.isEmpty()) {
            return 0.0;
        }

        long uniqueAssetTypes = portfolios.stream()
                .map(p -> p.get("assetType"))
                .distinct()
                .count();

        // AssetType 다양성 점수 (0.0 ~ 0.5)
        double assetTypeScore = Math.min(0.5, (double) uniqueAssetTypes / 5.0);

        // 섹터 분산도 점수 (간단 구현: 섹터가 다양할수록 높은 점수)
        // 실제로는 각 섹터별 비율의 엔트로피 등을 계산하는 것이 더 정확함
        double sectorScore = 0.3; // 기본값 (향후 개선 예정)

        return Math.min(1.0, assetTypeScore + sectorScore);
    }

    /**
     * 활동 기반 토큰 리워드 민팅 (중복 체크 및 이력 저장 포함)
     * @param userId 사용자 ID
     * @param walletAddress 지갑 주소
     * @param activity 활동 타입 (asset_added, portfolio_updated, dashboard_analysis 등)
     * @param portfolios 포트폴리오 자산 리스트 (균형 점수 계산용)
     * @return 민팅 결과
     */
    public Mono<BlockchainDto.MintRewardResponse> mintActivityReward(
            Long userId,
            String walletAddress,
            String activity,
            List<Map<String, Object>> portfolios) {

        // 지갑 주소 유효성 검증
        if (walletAddress == null || !walletAddress.startsWith("0x") || walletAddress.length() != 42) {
            log.error("Invalid wallet address: {}", walletAddress);
            return Mono.empty();
        }

        // 중복 체크 (일일 1회 제한: dashboard_analysis에만 적용)
        if ("dashboard_analysis".equals(activity)) {
            List<RewardHistory> existingRewards = rewardHistoryRepository
                    .findByUserIdAndActivityTypeAndDate(userId, activity, LocalDate.now());
            
            if (!existingRewards.isEmpty()) {
                log.info("User {} already received reward for {} today (count: {})", 
                        userId, activity, existingRewards.size());
                return Mono.empty();
            }
        }

        // 포트폴리오 균형 점수 계산
        double balanceScore = calculateDiversityScore(portfolios);

        // 기본 보상 계산 (균형 점수에 비례)
        double baseReward = 10.0;
        double rewardAmount = baseReward * (1.0 + balanceScore); // 10 ~ 20 FOLIO

        log.info("Minting reward - userId: {}, activity: {}, balanceScore: {}, amount: {}", 
                userId, activity, balanceScore, rewardAmount);

        return blockchainClient.mintReward(walletAddress, rewardAmount, activity)
                .doOnSuccess(response -> {
                    log.info("Successfully minted {} FOLIO for activity: {}", rewardAmount, activity);
                    // 리워드 이력 저장 (비동기)
                    saveRewardHistory(userId, walletAddress, activity, rewardAmount, 
                                    response.getTransactionHash(), balanceScore);
                })
                .doOnError(error -> {
                    log.error("Failed to mint reward: {}", error.getMessage());
                });
    }

    /**
     * 리워드 이력 저장
     */
    @Transactional
    public void saveRewardHistory(Long userId, String walletAddress, String activityType,
                                  Double amount, String transactionHash, Double balanceScore) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                log.error("User not found: {}", userId);
                return;
            }

            RewardHistory rewardHistory = RewardHistory.builder()
                    .user(user)
                    .walletAddress(walletAddress)
                    .activityType(activityType)
                    .amount(amount)
                    .transactionHash(transactionHash)
                    .balanceScore(balanceScore)
                    .build();

            rewardHistoryRepository.save(rewardHistory);
            log.info("Reward history saved: userId={}, activity={}, amount={}", userId, activityType, amount);
        } catch (Exception e) {
            log.error("Failed to save reward history: {}", e.getMessage(), e);
        }
    }

    /**
     * 성과 NFT 민팅 (중복 체크 및 히스토리 저장 포함)
     * @param userId 사용자 ID
     * @param walletAddress 지갑 주소
     * @param achievementType 성과 타입
     * @param metadata 메타데이터 (period, returnRate 등)
     * @return NFT 민팅 결과
     */
    public Mono<BlockchainDto.MintAchievementResponse> mintAchievementNFT(
            Long userId,
            String walletAddress,
            String achievementType,
            Map<String, Object> metadata) {

        // 지갑 주소 유효성 검증
        if (walletAddress == null || !walletAddress.startsWith("0x") || walletAddress.length() != 42) {
            log.error("Invalid wallet address: {}", walletAddress);
            return Mono.empty();
        }

        log.info("NFT 발행 시도 - userId: {}, achievementType: {}, walletAddress: {}", 
                userId, achievementType, walletAddress);

        // 중복 체크 (같은 성과는 한 번만 발행)
        List<AchievementHistory> existingAchievements = achievementHistoryRepository
                .findByUserIdAndAchievementType(userId, achievementType);
        if (existingAchievements != null && !existingAchievements.isEmpty()) {
            log.info("사용자 {}는 이미 성과 {}를 보유하고 있습니다 (count: {}). NFT 발행을 건너뜁니다.", 
                    userId, achievementType, existingAchievements.size());
            return Mono.empty();
        }

        log.info("블록체인에 NFT 민팅 요청 - userId: {}, achievementType: {}", userId, achievementType);

        return blockchainClient.mintAchievement(walletAddress, achievementType, metadata)
                .doOnSuccess(response -> {
                    log.info("NFT 민팅 성공 - userId: {}, achievementType: {}, tokenId: {}, txHash: {}", 
                            userId, achievementType, response.getTokenId(), response.getTransactionHash());
                    // 성과 히스토리 저장 (비동기)
                    saveAchievementHistory(userId, walletAddress, achievementType,
                                         response.getTokenId(), response.getTransactionHash(), metadata);
                })
                .doOnError(error -> {
                    log.error("NFT 민팅 실패 - userId: {}, achievementType: {}, error: {}", 
                            userId, achievementType, error.getMessage(), error);
                });
    }

    /**
     * 성과 이력 저장
     */
    @Transactional
    public void saveAchievementHistory(Long userId, String walletAddress, String achievementType,
                                       String tokenId, String transactionHash, Map<String, Object> metadata) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                log.error("User not found: {}", userId);
                return;
            }

            AchievementHistory achievementHistory = AchievementHistory.builder()
                    .user(user)
                    .walletAddress(walletAddress)
                    .achievementType(achievementType)
                    .tokenId(tokenId)
                    .transactionHash(transactionHash)
                    .metadata(metadata)
                    .build();

            achievementHistoryRepository.save(achievementHistory);
            log.info("Achievement history saved: userId={}, achievementType={}, tokenId={}", 
                    userId, achievementType, tokenId);
        } catch (Exception e) {
            log.error("Failed to save achievement history: {}", e.getMessage(), e);
        }
    }

    /**
     * 토큰 잔액 조회
     * @param walletAddress 지갑 주소
     * @return 토큰 잔액
     */
    public Mono<BlockchainDto.TokenBalanceResponse> getTokenBalance(String walletAddress) {
        if (walletAddress == null || !walletAddress.startsWith("0x") || walletAddress.length() != 42) {
            log.error("Invalid wallet address: {}", walletAddress);
            return Mono.empty();
        }

        return blockchainClient.getTokenBalance(walletAddress);
    }

    /**
     * 소유 NFT 목록 조회
     * @param walletAddress 지갑 주소
     * @return NFT 목록
     */
    public Mono<BlockchainDto.OwnedNFTsResponse> getOwnedNFTs(String walletAddress) {
        if (walletAddress == null || !walletAddress.startsWith("0x") || walletAddress.length() != 42) {
            log.error("Invalid wallet address: {}", walletAddress);
            return Mono.empty();
        }

        return blockchainClient.getOwnedNFTs(walletAddress);
    }
}

