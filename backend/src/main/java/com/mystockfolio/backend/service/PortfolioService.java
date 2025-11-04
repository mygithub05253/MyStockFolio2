package com.mystockfolio.backend.service;

import com.mystockfolio.backend.domain.entity.Portfolio;
import com.mystockfolio.backend.domain.entity.User;
import com.mystockfolio.backend.dto.PortfolioDto;
import com.mystockfolio.backend.exception.ResourceNotFoundException;
import com.mystockfolio.backend.exception.ForbiddenException;
import com.mystockfolio.backend.repository.PortfolioRepository;
import com.mystockfolio.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final UserRepository userRepository;
    private final RewardService rewardService;

    // 사용자의 모든 포트폴리오 목록 조회 (자산 포함)
    @Transactional(readOnly = true)
    public List<PortfolioDto.PortfolioResponse> getPortfoliosByUserId(Long userId) {
        // TODO: 보안 - userId가 실제 로그인한 사용자인지 확인 필요
        List<Portfolio> portfolios = portfolioRepository.findByUserIdWithAssets(userId); // JOIN FETCH로 assets 함께 로드
        return portfolios.stream()
                .map(PortfolioDto.PortfolioResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // 특정 포트폴리오 상세 조회 (자산 포함)
    @Transactional(readOnly = true)
    public PortfolioDto.PortfolioResponse getPortfolioById(Long userId, Long portfolioId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));
        if (!portfolio.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("해당 포트폴리오에 대한 접근 권한이 없습니다.");
        }
        return PortfolioDto.PortfolioResponse.fromEntity(portfolio);
    }

    // 새 포트폴리오 생성
    @Transactional
    public PortfolioDto.PortfolioSimpleResponse createPortfolio(Long userId, PortfolioDto.PortfolioCreateRequest requestDto) {
        User user = userRepository.findById(userId) // 사용자 정보 조회
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Portfolio portfolio = requestDto.toEntity(user);
        Portfolio savedPortfolio = portfolioRepository.save(portfolio);
        return PortfolioDto.PortfolioSimpleResponse.fromEntity(savedPortfolio);
    }

    // 포트폴리오 이름 수정
    @Transactional
    public PortfolioDto.PortfolioSimpleResponse updatePortfolioName(Long userId, Long portfolioId, PortfolioDto.PortfolioUpdateRequest requestDto) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));
        if (!portfolio.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("해당 포트폴리오를 수정할 권한이 없습니다.");
        }

        portfolio.updateName(requestDto.getName()); // Entity 내부 메서드 사용
        // 변경 감지로 자동 업데이트됨
        
        // 블록체인 리워드 민팅 (비동기, 실패해도 포트폴리오 수정은 성공)
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && user.getWalletAddress() != null && !user.getWalletAddress().isEmpty()) {
                List<Portfolio> allPortfolios = portfolioRepository.findByUserIdWithAssets(userId);
                List<Map<String, Object>> portfolioAssets = convertToMapFormat(allPortfolios);
                
                rewardService.mintActivityReward(
                    userId,
                    user.getWalletAddress(),
                    "portfolio_updated",
                    portfolioAssets
                ).subscribe(
                        response -> log.info("포트폴리오 수정 리워드 민팅 완료: {} FOLIO", response.getAmount()),
                        error -> log.warn("포트폴리오 수정 리워드 민팅 실패: {}", error.getMessage())
                );
            } else {
                log.debug("지갑 주소가 등록되지 않은 사용자: userId={}", userId);
            }
        } catch (Exception e) {
            log.error("리워드 민팅 중 오류 발생 (포트폴리오 수정은 성공): {}", e.getMessage());
        }
        
        return PortfolioDto.PortfolioSimpleResponse.fromEntity(portfolio);
    }

    /**
     * 포트폴리오 리스트를 RewardService용 Map 형식으로 변환
     */
    private List<Map<String, Object>> convertToMapFormat(List<Portfolio> portfolios) {
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Portfolio portfolio : portfolios) {
            for (var asset : portfolio.getAssets()) {
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

    // 포트폴리오 삭제
    @Transactional
    public void deletePortfolio(Long userId, Long portfolioId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));
        if (!portfolio.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("해당 포트폴리오를 삭제할 권한이 없습니다.");
        }

        portfolioRepository.delete(portfolio);
    }
}