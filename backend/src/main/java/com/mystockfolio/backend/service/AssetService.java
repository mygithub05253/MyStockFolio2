// backend/src/main/java/com/mystockfolio/backend/service/AssetService.java (전체 코드)

package com.mystockfolio.backend.service;

import com.mystockfolio.backend.domain.entity.Asset;
import com.mystockfolio.backend.domain.entity.Portfolio;
import com.mystockfolio.backend.domain.entity.User;
import com.mystockfolio.backend.dto.AssetDto;
import com.mystockfolio.backend.repository.AssetRepository;
import com.mystockfolio.backend.repository.PortfolioRepository;
import com.mystockfolio.backend.repository.UserRepository;
import com.mystockfolio.backend.exception.ResourceNotFoundException;
import com.mystockfolio.backend.exception.ForbiddenException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;
    private final PortfolioRepository portfolioRepository;
    private final UserRepository userRepository;
    private final RewardService rewardService;
    private final AchievementDetectionService achievementDetectionService;
    
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AssetService.class);

    // 특정 포트폴리오의 모든 자산 조회
    @Transactional(readOnly = true)
    public List<AssetDto.AssetResponse> getAssetsByPortfolioId(Long portfolioId, Long userId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));
        if (!portfolio.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("해당 포트폴리오에 대한 접근 권한이 없습니다.");
        }
        List<Asset> assets = assetRepository.findByPortfolioId(portfolioId);
        return assets.stream()
                .map(AssetDto.AssetResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // 새 자산 추가
    @Transactional
    public AssetDto.AssetResponse createAsset(Long portfolioId, Long userId, AssetDto.AssetCreateRequest requestDto) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));
        if (!portfolio.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("해당 포트폴리오에 자산을 추가할 권한이 없습니다.");
        }

        // DTO 필드 유효성 검증: 수량과 매입 가격은 필수이며 0보다 커야 함
        if (requestDto.getQuantity() == null || requestDto.getAvgBuyPrice() == null ||
                requestDto.getQuantity() <= 0 || requestDto.getAvgBuyPrice() <= 0) {
            throw new IllegalArgumentException("수량과 매입 가격은 0보다 커야 합니다.");
        }

        Asset asset = requestDto.toEntity(portfolio);

        // 2. 자산 이름 설정: 제공된 이름이 없으면 티커로 대체 (제한 제거)
        String providedName = requestDto.getName();
        String finalName = (providedName != null && !providedName.isBlank()) ? providedName : asset.getTicker();
        asset.setName(finalName);

        // 3. 자산 저장
        Asset savedAsset = assetRepository.save(asset);
        portfolio.addAsset(savedAsset);

        // 4. 블록체인 리워드 민팅 (비동기, 실패해도 자산 추가는 성공)
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && user.getWalletAddress() != null && !user.getWalletAddress().isEmpty()) {
                List<Portfolio> allPortfolios = portfolioRepository.findByUserIdWithAssets(userId);
                List<Map<String, Object>> portfolioAssets = convertToMapFormat(allPortfolios);
                
                rewardService.mintActivityReward(
                    userId,
                    user.getWalletAddress(),
                    "asset_added",
                    portfolioAssets
                ).subscribe(
                    response -> log.info("자산 추가 리워드 민팅 완료: {} FOLIO", response.getAmount()),
                    error -> log.warn("자산 추가 리워드 민팅 실패: {}", error.getMessage())
                );
                
                // 성과 감지 (비동기)
                achievementDetectionService.checkAndMintAchievements(userId, user.getWalletAddress());
            } else {
                log.debug("지갑 주소가 등록되지 않은 사용자: userId={}", userId);
            }
        } catch (Exception e) {
            log.error("리워드 민팅 중 오류 발생 (자산 추가는 성공): {}", e.getMessage());
        }

        return AssetDto.AssetResponse.fromEntity(savedAsset);
    }

    // 자산 정보 수정
    @Transactional
    public AssetDto.AssetResponse updateAsset(Long assetId, Long userId, AssetDto.AssetUpdateRequest requestDto) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + assetId));
        if (!asset.getPortfolio().getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("해당 자산을 수정할 권한이 없습니다.");
        }

        asset.updateAssetDetails(requestDto.getName(), requestDto.getQuantity(), requestDto.getAvgBuyPrice());

        if (requestDto.getTicker() != null && !requestDto.getTicker().isBlank()) {
            asset.setTicker(requestDto.getTicker().toUpperCase());
            // 이름이 비어있으면 티커로 대체
            if (requestDto.getName() == null || requestDto.getName().isBlank()) {
                asset.setName(asset.getTicker());
            }
        }

        return AssetDto.AssetResponse.fromEntity(asset);
    }

    // 자산 삭제
    @Transactional
    public void deleteAsset(Long assetId, Long userId) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + assetId));
        if (!asset.getPortfolio().getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("해당 자산을 삭제할 권한이 없습니다.");
        }

        assetRepository.delete(asset);
    }

    // 이름 조회 제한은 제거되었습니다. 향후 시세/메타데이터 연동 시 MarketDataClient 사용 예정.
    
    /**
     * 포트폴리오 리스트를 RewardService용 Map 형식으로 변환
     */
    private List<Map<String, Object>> convertToMapFormat(List<Portfolio> portfolios) {
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Portfolio portfolio : portfolios) {
            for (Asset asset : portfolio.getAssets()) {
                Map<String, Object> assetData = new HashMap<>();
                assetData.put("ticker", asset.getTicker());
                assetData.put("assetType", asset.getAssetType().name());
                assetData.put("name", asset.getName());
                assetData.put("quantity", asset.getQuantity());
                assetData.put("currentPrice", asset.getAvgBuyPrice()); // 간단히 매입가 사용
                
                result.add(assetData);
            }
        }
        
        return result;
    }
}