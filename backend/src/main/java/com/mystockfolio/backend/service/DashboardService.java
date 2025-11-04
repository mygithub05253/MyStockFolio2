package com.mystockfolio.backend.service;

import com.mystockfolio.backend.domain.entity.Asset;
import com.mystockfolio.backend.domain.entity.AssetType;
import com.mystockfolio.backend.domain.entity.Portfolio;
import com.mystockfolio.backend.domain.entity.User;
import com.mystockfolio.backend.dto.DashboardDto;
import com.mystockfolio.backend.repository.PortfolioRepository;
import com.mystockfolio.backend.repository.UserRepository;
import com.mystockfolio.backend.client.MarketDataClient;
import com.mystockfolio.backend.client.CrawlerClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PortfolioRepository portfolioRepository;
    private final MarketPriceCacheService priceCacheService;
    private final MarketDataClient marketDataClient;
    private final CrawlerClient crawlerClient;
    private final com.mystockfolio.backend.client.AnalyticsClient analyticsClient;
    private final RewardService rewardService;
    private final UserRepository userRepository;

    // 한국 주식 판별: 6자리 숫자 티커
    private static final Pattern KR_STOCK_PATTERN = Pattern.compile("^\\d{6}$");
    
    private boolean isKoreanStock(String ticker) {
        return ticker != null && KR_STOCK_PATTERN.matcher(ticker).matches();
    }

    // 사용자의 포트폴리오 통계 계산 (동기 방식으로 간소화)
    @Transactional(readOnly = true)
    public DashboardDto.PortfolioStatsResponse getPortfolioStats(Long userId) {
        log.info("대시보드 통계 조회 시작 - userId: {}", userId);
        
        List<Portfolio> portfolios = portfolioRepository.findByUserIdWithAssets(userId);
        log.info("포트폴리오 개수: {}", portfolios.size());
        
        // 각 포트폴리오의 자산 개수 로깅
        for (Portfolio portfolio : portfolios) {
            log.info("  - 포트폴리오 '{}' (ID: {}): 자산 {}개", 
                portfolio.getName(), portfolio.getId(), portfolio.getAssets().size());
            for (Asset asset : portfolio.getAssets()) {
                log.info("    • {} ({}) - {}개 @ ₩{}", 
                    asset.getName(), asset.getTicker(), asset.getQuantity(), asset.getAvgBuyPrice());
            }
        }
        
        DashboardDto.PortfolioStatsResponse response = calculateStats(portfolios);
        log.info("계산된 통계 - 총 자산: {}, 수익률: {}%, 자산 배분 항목: {}개", 
            response.getTotalMarketValue(), response.getTotalReturnRate(), 
            response.getAssetAllocations() != null ? response.getAssetAllocations().size() : 0);
        
        // 블록체인 리워드 민팅 (일일 1회 제한, 비동기)
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && user.getWalletAddress() != null && !user.getWalletAddress().isEmpty()) {
                List<Map<String, Object>> portfolioAssets = convertPortfoliosToMapFormat(portfolios);
                
                rewardService.mintActivityReward(
                    userId,
                    user.getWalletAddress(),
                    "dashboard_analysis",
                    portfolioAssets
                ).subscribe(
                        response_reward -> log.info("대시보드 분석 리워드 민팅 완료: {} FOLIO", response_reward.getAmount()),
                        error -> log.warn("대시보드 분석 리워드 민팅 실패: {}", error.getMessage())
                );
            } else {
                log.debug("지갑 주소가 등록되지 않은 사용자: userId={}", userId);
            }
        } catch (Exception e) {
            log.error("리워드 민팅 중 오류 발생 (대시보드 조회는 성공): {}", e.getMessage());
        }
        
        return response;
    }

    /**
     * 포트폴리오 리스트를 RewardService용 Map 형식으로 변환
     */
    private List<Map<String, Object>> convertPortfoliosToMapFormat(List<Portfolio> portfolios) {
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Portfolio portfolio : portfolios) {
            for (Asset asset : portfolio.getAssets()) {
                Map<String, Object> assetData = new HashMap<>();
                assetData.put("ticker", asset.getTicker());
                assetData.put("assetType", asset.getAssetType().name());
                assetData.put("name", asset.getName());
                assetData.put("quantity", asset.getQuantity());
                assetData.put("currentPrice", asset.getAvgBuyPrice());
                
                result.add(assetData);
            }
        }
        
        return result;
    }

    private DashboardDto.PortfolioStatsResponse calculateStats(List<Portfolio> portfolios) {
        log.info("통계 계산 시작");
        double totalInitialInvestment = 0.0;
        double totalMarketValue = 0.0;
        
        // 모든 자산 수집
        List<Asset> allAssets = new ArrayList<>();
        for (Portfolio portfolio : portfolios) {
            allAssets.addAll(portfolio.getAssets());
        }
        
        log.info("총 자산 개수: {}", allAssets.size());
        
        // 병렬로 가격 조회 (최적화)
        Map<String, Double> priceMap = fetchPricesInParallel(allAssets);
        
        // 자산 유형별 시장 가치 집계 (Pie Chart용)
        Map<AssetType, Double> assetTypeMarketValues = new HashMap<>();
        
        for (Asset asset : allAssets) {
            // 초기 투자금 계산
            double investmentValue = asset.getQuantity() * asset.getAvgBuyPrice();
            totalInitialInvestment += investmentValue;
            
            // 현재 시장 가치 계산
            double currentPrice = priceMap.getOrDefault(asset.getTicker(), asset.getAvgBuyPrice());
            double marketValue = asset.getQuantity() * currentPrice;
            totalMarketValue += marketValue;
            
            log.debug("  자산: {} ({}) - 투자금: ₩{}, 현재가치: ₩{}", 
                asset.getName(), asset.getAssetType(), investmentValue, marketValue);
            
            // 자산 유형별 집계
            assetTypeMarketValues.merge(asset.getAssetType(), marketValue, Double::sum);
        }
        
        log.info("총 투자금: {}, 총 시장가치: {}", totalInitialInvestment, totalMarketValue);
        
        double totalGainLoss = totalMarketValue - totalInitialInvestment;
        double totalReturnRate = (totalInitialInvestment > 0) 
            ? (totalGainLoss / totalInitialInvestment) * 100.0 
            : 0.0;
        
        log.info("손익: {}, 수익률: {}%", totalGainLoss, totalReturnRate);
        
        // 자산 배분 리스트 생성 (Pie Chart용)
        List<DashboardDto.AssetAllocation> assetAllocations = new ArrayList<>();
        for (Map.Entry<AssetType, Double> entry : assetTypeMarketValues.entrySet()) {
            double percentage = (totalMarketValue > 0) 
                ? (entry.getValue() / totalMarketValue) * 100.0 
                : 0.0;
            
            DashboardDto.AssetAllocation allocation = DashboardDto.AssetAllocation.builder()
                    .assetType(entry.getKey().name())
                    .value(entry.getValue())
                    .percentage(percentage)
                    .build();
            assetAllocations.add(allocation);
            
            log.info("자산 배분 - {}: {} ({}%)", 
                entry.getKey().name(), entry.getValue(), percentage);
        }
        
        log.info("통계 계산 완료 - 자산 배분 항목: {}개", assetAllocations.size());
        
        List<DashboardDto.AssetReturn> assetReturns = new ArrayList<>();
        for (Asset asset : allAssets) {
            double investmentValue = asset.getQuantity() * asset.getAvgBuyPrice();
            double currentPrice = priceMap.getOrDefault(asset.getTicker(), asset.getAvgBuyPrice());
            double marketValue = asset.getQuantity() * currentPrice;
            double gainLoss = marketValue - investmentValue;
            double returnRate = (investmentValue > 0) ? (gainLoss / investmentValue) * 100.0 : 0.0;
            
            assetReturns.add(DashboardDto.AssetReturn.builder()
                    .assetId(asset.getId())
                    .ticker(asset.getTicker())
                    .name(asset.getName())
                    .initialInvestment(investmentValue)
                    .currentValue(marketValue)
                    .gainLoss(gainLoss)
                    .returnRate(returnRate)
                    .assetType(asset.getAssetType().name())
                    .build());
        }
        
        log.info("자산별 수익률 분석 완료 - {}개 자산", assetReturns.size());
        
        return DashboardDto.PortfolioStatsResponse.builder()
                .totalMarketValue(totalMarketValue)
                .totalInitialInvestment(totalInitialInvestment)
                .totalGainLoss(totalGainLoss)
                .totalReturnRate(totalReturnRate)
                .assetAllocations(assetAllocations)
                .assetReturns(assetReturns)
                .build();
    }
    
    // 병렬로 여러 자산의 가격을 한 번에 조회 (성능 최적화)
    private Map<String, Double> fetchPricesInParallel(List<Asset> assets) {
        if (assets.isEmpty()) {
            return new HashMap<>();
        }

        Map<String, Double> priceMap = new HashMap<>();
        Set<String> uniqueTickers = assets.stream()
                .map(Asset::getTicker)
                .collect(java.util.stream.Collectors.toSet());

        log.info("가격 조회 시작 - 티커 개수: {}", uniqueTickers.size());

        // 캐시된 가격 먼저 확인
        for (String ticker : uniqueTickers) {
            var cached = priceCacheService.getCachedPrice(ticker);
            if (cached.isPresent()) {
                priceMap.put(ticker, cached.get());
                log.debug("캐시에서 가격 조회 - {}: {}", ticker, cached.get());
            }
        }

        // 캐시에 없는 티커만 외부 서비스 조회
        List<String> uncachedTickers = uniqueTickers.stream()
                .filter(ticker -> !priceMap.containsKey(ticker))
                .collect(java.util.stream.Collectors.toList());

        if (uncachedTickers.isEmpty()) {
            log.info("모든 가격이 캐시에서 조회됨");
            return priceMap;
        }

        log.info("외부 서비스에서 가격 조회 - 티커 개수: {}", uncachedTickers.size());

        // Reactor를 사용한 병렬 처리
        List<reactor.core.publisher.Mono<PriceResult>> priceMonos = new ArrayList<>();

        for (String ticker : uncachedTickers) {
            reactor.core.publisher.Mono<PriceResult> priceMono;
            
            if (isKoreanStock(ticker)) {
                // 한국 주식: crawler-svc 호출
                priceMono = crawlerClient.getKRStockQuote(ticker)
                        .map(resp -> {
                            double price = resp.getCurrent_price();
                            if (price > 0) {
                                priceCacheService.cachePrice(ticker, price, java.time.Duration.ofSeconds(60));
                                log.debug("한국 주식 가격 조회 성공 - {}: {}", ticker, price);
                            }
                            return new PriceResult(ticker, price > 0 ? price : null);
                        })
                        .timeout(java.time.Duration.ofSeconds(5))
                        .retry(2)
                        .onErrorResume(e -> {
                            log.warn("한국 주식 가격 조회 실패 - {}: {}", ticker, e.getMessage());
                            return reactor.core.publisher.Mono.just(new PriceResult(ticker, null));
                        });
            } else {
                // 해외 주식/코인: market-data-svc 호출
                priceMono = marketDataClient.getCurrentPrice(ticker)
                        .map(resp -> {
                            double price = resp.getPrice();
                            if (price > 0) {
                                priceCacheService.cachePrice(ticker, price, java.time.Duration.ofSeconds(60));
                                log.debug("해외 주식/코인 가격 조회 성공 - {}: {}", ticker, price);
                            }
                            return new PriceResult(ticker, price > 0 ? price : null);
                        })
                        .timeout(java.time.Duration.ofSeconds(5))
                        .retry(2)
                        .onErrorResume(e -> {
                            log.warn("해외 주식/코인 가격 조회 실패 - {}: {}", ticker, e.getMessage());
                            return reactor.core.publisher.Mono.just(new PriceResult(ticker, null));
                        });
            }
            
            priceMonos.add(priceMono);
        }

        // 모든 Mono를 병렬로 실행하고 결과 수집
        try {
            List<PriceResult> results = reactor.core.publisher.Flux.merge(priceMonos)
                    .collectList()
                    .block(java.time.Duration.ofSeconds(10));

            if (results != null) {
                for (PriceResult result : results) {
                    if (result.price != null && result.price > 0) {
                        priceMap.put(result.ticker, result.price);
                    }
                }
            }

            log.info("가격 조회 완료 - 성공: {}/{}", priceMap.size(), uniqueTickers.size());
        } catch (Exception e) {
            log.error("가격 조회 중 오류 발생: {}", e.getMessage());
        }

        // 조회 실패한 티커는 매입가 사용
        for (Asset asset : assets) {
            String ticker = asset.getTicker();
            if (!priceMap.containsKey(ticker)) {
                double fallbackPrice = asset.getAvgBuyPrice();
                priceMap.put(ticker, fallbackPrice);
                log.debug("가격 조회 실패 - 매입가 사용 - {}: {}", ticker, fallbackPrice);
            }
        }

        return priceMap;
    }

    // 내부 클래스: 가격 조회 결과
    private static class PriceResult {
        final String ticker;
        final Double price;

        PriceResult(String ticker, Double price) {
            this.ticker = ticker;
            this.price = price;
        }
    }
    
    // 자산의 현재 시장 가격 조회: Redis 캐시 → 마켓데이터 서비스 → 합리적 기본값
    private double getCurrentPrice(Asset asset) {
        String ticker = asset.getTicker();
        // 1) 캐시 조회
        var cached = priceCacheService.getCachedPrice(ticker);
        if (cached.isPresent()) {
            log.debug("캐시에서 가격 조회 성공 - {}: {}", ticker, cached.get());
            return cached.get();
        }
        // 2) 외부 서비스 조회 (타임아웃 설정: 3초)
        try {
            Double fetched;
            
            if (isKoreanStock(ticker)) {
                // 한국 주식: crawler-svc 호출
                fetched = crawlerClient.getKRStockQuote(ticker)
                        .map(resp -> resp.getCurrent_price())
                        .onErrorResume(e -> {
                            log.warn("CrawlerService 가격 조회 실패 - {}: {} (기본값 사용)", ticker, e.getMessage());
                            return reactor.core.publisher.Mono.empty();
                        })
                        .timeout(java.time.Duration.ofSeconds(3))
                        .blockOptional(java.time.Duration.ofSeconds(3))
                        .orElse(null);
            } else {
                // 해외 주식/코인: market-data-svc 호출
                fetched = marketDataClient.getCurrentPrice(ticker)
                        .map(resp -> resp.getPrice())
                        .onErrorResume(e -> {
                            log.warn("MarketDataService 가격 조회 실패 - {}: {} (기본값 사용)", ticker, e.getMessage());
                            return reactor.core.publisher.Mono.empty();
                        })
                        .timeout(java.time.Duration.ofSeconds(3))
                        .blockOptional(java.time.Duration.ofSeconds(3))
                        .orElse(null);
            }
            
            if (fetched != null && fetched > 0) {
                // 60초 TTL 캐싱
                priceCacheService.cachePrice(ticker, fetched, java.time.Duration.ofSeconds(60));
                log.debug("외부 서비스에서 가격 조회 성공 - {}: {}", ticker, fetched);
                return fetched;
            }
        } catch (Exception e) {
            // Reactor의 TimeoutException 또는 일반 타임아웃 처리
            String errorMsg = e.getMessage();
            if (errorMsg != null && (errorMsg.contains("timeout") || errorMsg.contains("Timeout"))) {
                log.warn("MarketDataService 타임아웃 - {}: 3초 내 응답 없음 (기본값 사용: 매입가)", ticker);
            } else {
                log.warn("MarketDataService 연결 실패 - {}: {} (기본값 사용: 매입가)", ticker, e.getMessage());
            }
        }
        // 3) 합리적 기본값(서비스 실패 시): 매입가를 현재가로 사용 (수익률 0%로 계산됨)
        log.debug("기본값 사용 - {}: 매입가 {}", ticker, asset.getAvgBuyPrice());
        return switch (asset.getAssetType()) {
            case STABLECOIN -> asset.getAvgBuyPrice();
            default -> asset.getAvgBuyPrice();
        };
    }
    
    // 히트맵 분석 데이터 생성
    @Transactional(readOnly = true)
    public DashboardDto.HeatmapResponse getHeatmap(Long userId) {
        log.info("히트맵 분석 조회 시작 - userId: {}", userId);
        
        List<Portfolio> portfolios = portfolioRepository.findByUserIdWithAssets(userId);
        
        // 포트폴리오 자산을 FastAPI 형식으로 변환
        List<java.util.Map<String, Object>> portfolioAssets = new ArrayList<>();
        for (Portfolio portfolio : portfolios) {
            for (Asset asset : portfolio.getAssets()) {
                double currentPrice = getCurrentPrice(asset);
                double previousPrice = asset.getAvgBuyPrice(); // 간단히 매입가를 전일가로 사용
                double changePercent = previousPrice != 0 ? ((currentPrice - previousPrice) / previousPrice) * 100.0 : 0.0;
                
                java.util.Map<String, Object> assetData = new java.util.HashMap<>();
                assetData.put("ticker", asset.getTicker());
                assetData.put("assetType", asset.getAssetType().name());
                assetData.put("name", asset.getName());
                assetData.put("quantity", asset.getQuantity());
                assetData.put("currentPrice", currentPrice);
                assetData.put("changePercent", changePercent);
                
                portfolioAssets.add(assetData);
            }
        }
        
        log.info("포트폴리오 자산 {}개를 AnalyticsService로 전송", portfolioAssets.size());
        
        // AnalyticsService 호출 (별도 서비스로 분리)
        DashboardDto.HeatmapResponse heatmap = analyticsClient.generateHeatmap(portfolioAssets)
                .blockOptional()
                .orElse(null);
        
        if (heatmap == null) {
            log.warn("AnalyticsService 히트맵 생성 실패, 빈 응답 반환");
            return DashboardDto.HeatmapResponse.builder()
                    .sectors(new ArrayList<>())
                    .totalValue(0.0)
                    .lastUpdated(java.time.LocalDateTime.now().toString())
                    .build();
        }
        
        log.info("히트맵 생성 완료 - {}개 섹터", heatmap.getSectors() != null ? heatmap.getSectors().size() : 0);
        return heatmap;
    }
    
    // 위험 지표 계산
    @Transactional(readOnly = true)
    public DashboardDto.RiskMetricsResponse getRiskMetrics(Long userId) {
        log.info("위험 지표 계산 조회 시작 - userId: {}", userId);
        
        List<Portfolio> portfolios = portfolioRepository.findByUserIdWithAssets(userId);
        
        // 모든 자산 수집
        List<Asset> allAssets = new ArrayList<>();
        for (Portfolio portfolio : portfolios) {
            allAssets.addAll(portfolio.getAssets());
        }
        
        // 병렬로 가격 조회
        Map<String, Double> priceMap = fetchPricesInParallel(allAssets);
        
        // 포트폴리오 자산을 FastAPI 형식으로 변환
        List<java.util.Map<String, Object>> portfolioAssets = new ArrayList<>();
        for (Asset asset : allAssets) {
            double currentPrice = priceMap.getOrDefault(asset.getTicker(), asset.getAvgBuyPrice());
            double previousPrice = asset.getAvgBuyPrice();
            double changePercent = previousPrice != 0 ? ((currentPrice - previousPrice) / previousPrice) * 100.0 : 0.0;
            
            java.util.Map<String, Object> assetData = new java.util.HashMap<>();
            assetData.put("ticker", asset.getTicker());
            assetData.put("assetType", asset.getAssetType().name());
            assetData.put("name", asset.getName());
            assetData.put("quantity", asset.getQuantity());
            assetData.put("currentPrice", currentPrice);
            assetData.put("changePercent", changePercent);
            
            portfolioAssets.add(assetData);
        }
        
        log.info("포트폴리오 자산 {}개를 AnalyticsService로 전송 (위험 지표 계산)", portfolioAssets.size());
        
        // AnalyticsService 호출 (동기 방식)
        DashboardDto.RiskMetricsResponse riskMetrics = analyticsClient.calculateRiskMetricsSync(portfolioAssets)
                .blockOptional()
                .orElse(null);
        
        if (riskMetrics == null) {
            log.warn("AnalyticsService 위험 지표 계산 실패, 기본값 반환");
            return DashboardDto.RiskMetricsResponse.builder()
                    .volatility(0.0)
                    .mdd(0.0)
                    .beta(1.0)
                    .sharpeRatio(0.0)
                    .recommendation("데이터 부족으로 위험 지표를 계산할 수 없습니다.")
                    .riskLevel("low")
                    .lastUpdated(java.time.LocalDateTime.now().toString())
                    .build();
        }
        
        log.info("위험 지표 계산 완료 - 변동성: {}%, MDD: {}%, 베타: {}", 
            riskMetrics.getVolatility(), riskMetrics.getMdd(), riskMetrics.getBeta());
        return riskMetrics;
    }

    // 위험 지표 계산 시작 (비동기)
    @Transactional(readOnly = true)
    public DashboardDto.RiskMetricsJobResponse startRiskMetricsCalculation(Long userId) {
        log.info("위험 지표 계산 작업 시작 - userId: {}", userId);
        
        List<Portfolio> portfolios = portfolioRepository.findByUserIdWithAssets(userId);
        
        // 포트폴리오 자산을 FastAPI 형식으로 변환
        List<java.util.Map<String, Object>> portfolioAssets = new ArrayList<>();
        for (Portfolio portfolio : portfolios) {
            for (Asset asset : portfolio.getAssets()) {
                double currentPrice = getCurrentPrice(asset);
                double previousPrice = asset.getAvgBuyPrice();
                double changePercent = previousPrice != 0 ? ((currentPrice - previousPrice) / previousPrice) * 100.0 : 0.0;
                
                java.util.Map<String, Object> assetData = new java.util.HashMap<>();
                assetData.put("ticker", asset.getTicker());
                assetData.put("assetType", asset.getAssetType().name());
                assetData.put("name", asset.getName());
                assetData.put("quantity", asset.getQuantity());
                assetData.put("currentPrice", currentPrice);
                assetData.put("changePercent", changePercent);
                
                portfolioAssets.add(assetData);
            }
        }
        
        log.info("포트폴리오 자산 {}개를 AnalyticsService로 전송 (위험 지표 계산 시작)", portfolioAssets.size());
        
        // AnalyticsService 비동기 작업 시작
        java.util.Map<String, Object> jobResponse = analyticsClient.startRiskMetricsCalculation(portfolioAssets)
                .blockOptional()
                .orElse(null);
        
        if (jobResponse == null || !jobResponse.containsKey("job_id")) {
            log.warn("AnalyticsService 위험 지표 계산 작업 시작 실패");
            throw new RuntimeException("Failed to start risk metrics calculation");
        }
        
        String jobId = (String) jobResponse.get("job_id");
        String status = (String) jobResponse.getOrDefault("status", "processing");
        String message = (String) jobResponse.getOrDefault("message", "");
        
        log.info("위험 지표 계산 작업 시작 완료 - jobId: {}", jobId);
        
        return DashboardDto.RiskMetricsJobResponse.builder()
                .jobId(jobId)
                .status(status)
                .message(message)
                .build();
    }

    // 위험 지표 계산 결과 조회
    public DashboardDto.RiskMetricsResponse getRiskMetricsResult(String jobId) {
        log.info("위험 지표 계산 결과 조회 - jobId: {}", jobId);
        
        try {
            DashboardDto.RiskMetricsResponse result = analyticsClient.getRiskMetricsResult(jobId)
                    .blockOptional()
                    .orElse(null);
            
            if (result == null) {
                log.warn("위험 지표 계산 결과 조회 실패 - jobId: {}", jobId);
                return null;
            }
            
            log.info("위험 지표 계산 결과 조회 완료 - jobId: {}", jobId);
            return result;
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("PROCESSING")) {
                log.debug("위험 지표 계산 아직 진행 중 - jobId: {}", jobId);
                return null; // null 반환 시 프론트엔드에서 재시도
            }
            log.error("위험 지표 계산 결과 조회 중 오류 - jobId: {}", jobId, e);
            return null;
        }
    }
}