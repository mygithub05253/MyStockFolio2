package com.mystockfolio.backend.service;

import com.mystockfolio.backend.domain.entity.Asset;
import com.mystockfolio.backend.domain.entity.Portfolio;
import com.mystockfolio.backend.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * NFT 성과 달성 감지 서비스
 * - 포트폴리오 90일 유지 체크
 * - 수익률 달성 체크 (10%, 20%, 50% 등)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AchievementDetectionService {

    private final PortfolioRepository portfolioRepository;
    private final RewardService rewardService;
    private final DashboardService dashboardService;

    /**
     * 사용자의 성과 달성 여부 체크 및 NFT 발행
     * @param userId 사용자 ID
     */
    @Async
    public void checkAndMintAchievements(Long userId, String walletAddress) {
        if (walletAddress == null || !walletAddress.startsWith("0x") || walletAddress.length() != 42) {
            log.debug("지갑 주소가 없어 성과 체크를 건너뜁니다. userId={}", userId);
            return;
        }

        log.info("성과 달성 체크 시작 - userId: {}, walletAddress: {}", userId, walletAddress);
        
        try {
            List<Portfolio> portfolios = portfolioRepository.findByUserIdWithAssets(userId);
            
            if (portfolios.isEmpty()) {
                log.debug("포트폴리오가 없어 성과 체크를 건너뜁니다. userId={}", userId);
                return;
            }
            
            log.info("포트폴리오 개수: {}, userId: {}", portfolios.size(), userId);
            
            // 포트폴리오 유지 기간 체크
            checkPortfolioMaintenanceAchievement(userId, walletAddress, portfolios);
            
            // 수익률 성과 체크
            checkReturnRateAchievements(userId, walletAddress, portfolios);
            
            log.info("성과 달성 체크 완료 - userId: {}", userId);
        } catch (Exception e) {
            log.error("성과 달성 체크 중 오류 발생: userId={}, error={}", userId, e.getMessage(), e);
        }
    }

    /**
     * 포트폴리오 90일 유지 성과 체크
     */
    private void checkPortfolioMaintenanceAchievement(Long userId, String walletAddress, List<Portfolio> portfolios) {
        if (portfolios.isEmpty()) {
            return;
        }

        // 가장 오래된 포트폴리오의 생성일을 기준으로 체크
        LocalDateTime oldestPortfolioDate = portfolios.stream()
                .map(Portfolio::getCreatedAt)
                .min(LocalDateTime::compareTo)
                .orElse(null);

        if (oldestPortfolioDate == null) {
            return;
        }

        long daysSinceCreation = ChronoUnit.DAYS.between(oldestPortfolioDate, LocalDateTime.now());

        log.info("포트폴리오 유지 기간 체크 - userId: {}, daysSinceCreation: {}", userId, daysSinceCreation);
        
        // 90일 이상 유지되었는지 체크
        if (daysSinceCreation >= 90) {
            log.info("90일 유지 조건 충족 - userId: {}, minting NFT...", userId);
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("period", 90);
            metadata.put("daysSinceCreation", daysSinceCreation);
            metadata.put("portfolioCount", portfolios.size());

            rewardService.mintAchievementNFT(
                    userId,
                    walletAddress,
                    "portfolio_maintained_90days",
                    metadata
            ).subscribe(
                    response -> log.info("90일 유지 성과 NFT 발행 완료: userId={}, tokenId={}, txHash={}", 
                            userId, response.getTokenId(), response.getTransactionHash()),
                    error -> log.error("90일 유지 성과 NFT 발행 실패: userId={}, error={}", 
                            userId, error.getMessage(), error)
            );
        } else {
            log.debug("90일 유지 조건 미충족 - userId: {}, daysSinceCreation: {}", userId, daysSinceCreation);
        }
    }

    /**
     * 수익률 성과 체크 및 NFT 발행
     * 성과 기준: 10%, 20%, 50%, 100%
     */
    private void checkReturnRateAchievements(Long userId, String walletAddress, List<Portfolio> portfolios) {
        if (portfolios.isEmpty()) {
            return;
        }

        try {
            // 모든 자산 수집
            List<Asset> allAssets = new java.util.ArrayList<>();
            for (Portfolio portfolio : portfolios) {
                allAssets.addAll(portfolio.getAssets());
            }

            if (allAssets.isEmpty()) {
                return;
            }

            // DashboardService를 통해 실시간 수익률 가져오기 (한 번만 호출)
            double totalReturnRate;
            com.mystockfolio.backend.dto.DashboardDto.PortfolioStatsResponse stats;
            try {
                stats = dashboardService.getPortfolioStats(userId);
                if (stats != null && stats.getTotalReturnRate() != null) {
                    totalReturnRate = stats.getTotalReturnRate();
                } else {
                    log.warn("수익률 계산 실패: userId={}, stats={}", userId, stats);
                    return;
                }
            } catch (Exception e) {
                log.error("수익률 조회 중 오류 발생: {}", e.getMessage(), e);
                return;
            }

            log.info("수익률 성과 체크 - userId: {}, returnRate: {}%", userId, totalReturnRate);

            // 수익률 성과 기준으로 NFT 발행
            double[] thresholds = {10.0, 20.0, 50.0, 100.0};
            String[] achievementTypes = {
                "return_rate_10percent",
                "return_rate_20percent",
                "return_rate_50percent",
                "return_rate_100percent"
            };

            for (int idx = 0; idx < thresholds.length; idx++) {
                final int i = idx; // final 변수로 복사
                final double threshold = thresholds[i];
                final String achievementType = achievementTypes[i];
                
                if (totalReturnRate >= threshold) {
                    log.info("{}% 수익률 성과 조건 충족 - userId: {}, minting NFT...", threshold, userId);
                    
                    // stats에서 가져온 정보를 사용하여 메타데이터 구성
                    Map<String, Object> metadata = new HashMap<>();
                    metadata.put("returnRate", totalReturnRate);
                    metadata.put("threshold", threshold);
                    if (stats != null) {
                        metadata.put("totalMarketValue", stats.getTotalMarketValue());
                        if (stats.getTotalGainLoss() != null) {
                            metadata.put("gainLoss", stats.getTotalGainLoss());
                        }
                    }

                    rewardService.mintAchievementNFT(
                            userId,
                            walletAddress,
                            achievementType,
                            metadata
                    ).subscribe(
                            response -> log.info("{}% 수익률 성과 NFT 발행 완료: userId={}, tokenId={}, txHash={}",
                                    threshold, userId, response.getTokenId(), response.getTransactionHash()),
                            error -> log.error("{}% 수익률 성과 NFT 발행 실패: userId={}, error={}",
                                    threshold, userId, error.getMessage(), error)
                    );
                }
            }

        } catch (Exception e) {
            log.error("수익률 성과 체크 중 오류 발생: {}", e.getMessage(), e);
        }
    }
}

