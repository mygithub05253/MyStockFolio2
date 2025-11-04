package com.mystockfolio.backend.client;

import com.mystockfolio.backend.dto.MarketDataDto;
import org.springframework.core.ParameterizedTypeReference;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;
import java.time.Duration;

@Slf4j
@Component
public class MarketDataClient {

    private final WebClient webClient;

    public MarketDataClient(@Value("${market.data.url}") String marketDataUrl, WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl(marketDataUrl).build();
        log.info("MarketDataClient initialized with URL: {}", marketDataUrl);
    }

    // 1. 실시간 시세 조회 (FastAPI의 /api/market/price 엔드포인트 호출)
    public Mono<MarketDataDto.PriceResponse> getCurrentPrice(String ticker) {
        return webClient.get()
                .uri("/api/market/price?ticker={ticker}", ticker)
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    log.error("Error calling MarketDataService for price: {}", response.statusCode());
                    if (response.statusCode() == HttpStatus.NOT_FOUND) {
                        return Mono.error(new WebClientResponseException(
                                response.statusCode().value(),
                                "Market data not found for ticker: " + ticker,
                                response.headers().asHttpHeaders(), null, null
                        ));
                    }
                    return response.createException();
                })
                .bodyToMono(MarketDataDto.PriceResponse.class)
                .retryWhen(Retry.backoff(2, Duration.ofMillis(500))
                        .filter(throwable -> {
                            boolean shouldRetry = !(throwable instanceof WebClientResponseException) ||
                                    ((WebClientResponseException) throwable).getStatusCode().is5xxServerError();
                            if (shouldRetry) {
                                log.debug("Retrying price request for ticker: {}", ticker);
                            }
                            return shouldRetry;
                        })
                        .doBeforeRetry(retrySignal -> log.debug("Price request retry attempt {} for ticker: {}", 
                                retrySignal.totalRetries() + 1, ticker))
                        .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) -> retrySignal.failure()))
                .onErrorResume(e -> {
                    log.error("Failed to connect to MarketDataService: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    // 2. 차트 데이터 조회 (FastAPI의 /api/market/chart 엔드포인트 호출)
    public Mono<MarketDataDto.ChartResponse> getHistoricalChart(String ticker, String period) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/market/chart")
                        .queryParam("ticker", ticker)
                        .queryParam("period", period)
                        .build())
                .retrieve()
                // [★★★ 오류 수정: status -> status.isError()로 람다 사용 ★★★]
                .onStatus(status -> status.isError(), response -> {
                    log.error("Error calling MarketDataService for chart: {}", response.statusCode());
                    return response.createException();
                })
                .bodyToMono(MarketDataDto.ChartResponse.class)
                .onErrorResume(e -> {
                    log.error("Failed to connect to MarketDataService for chart: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    // 3. 상세 시세 조회 (HTS 스타일)
    public Mono<MarketDataDto.DetailedQuoteResponse> getDetailedQuote(String ticker) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/market/quote")
                        .queryParam("ticker", ticker)
                        .build())
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    log.error("Error calling MarketDataService for detailed quote: {}", response.statusCode());
                    return response.createException();
                })
                .bodyToMono(MarketDataDto.DetailedQuoteResponse.class)
                .onErrorResume(e -> {
                    log.error("Failed to get detailed quote: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    // 4. 인기 종목 목록 (유연한 구조로 수신)
    public Mono<java.util.List<java.util.Map<String, Object>>> getPopular() {
        return webClient.get()
                .uri("/api/market/popular")
                .retrieve()
                .onStatus(status -> status.isError(), response -> response.createException())
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<java.util.List<java.util.Map<String, Object>>>() {})
                .onErrorResume(e -> {
                    log.error("Failed to get popular list: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    // 5. 헬스체크 (재시도 로직 포함)
    public Mono<String> getHealth() {
        return webClient.get()
                .uri("/health")
                .retrieve()
                .onStatus(status -> status.isError(), response -> response.createException())
                .bodyToMono(String.class)
                .retryWhen(Retry.backoff(2, Duration.ofMillis(500))
                        .filter(throwable -> !(throwable instanceof WebClientResponseException))
                        .doBeforeRetry(retrySignal -> log.debug("Health check retry attempt: {}", retrySignal.totalRetries() + 1))
                        .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) -> retrySignal.failure()))
                .onErrorResume(e -> Mono.empty());
    }

    // 6. 자동완성/검색
    public Mono<java.util.List<java.util.Map<String, Object>>> suggest(String q) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder.path("/api/market/suggest").queryParam("q", q).build())
                .retrieve()
                .onStatus(status -> status.isError(), response -> response.createException())
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<java.util.List<java.util.Map<String, Object>>>() {})
                .onErrorResume(e -> Mono.empty());
    }

    // 7. Top movers
    public Mono<java.util.List<java.util.Map<String, Object>>> top(String category) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder.path("/api/market/top").queryParam("category", category).build())
                .retrieve()
                .onStatus(status -> status.isError(), response -> response.createException())
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<java.util.List<java.util.Map<String, Object>>>() {})
                .onErrorResume(e -> Mono.empty());
    }

    // 8. Market indices (재시도 로직 포함)
    public Mono<java.util.List<java.util.Map<String, Object>>> getIndices() {
        return webClient.get()
                .uri("/api/market/indices")
                .retrieve()
                .onStatus(status -> status.isError(), response -> response.createException())
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<java.util.List<java.util.Map<String, Object>>>() {})
                .retryWhen(Retry.backoff(2, Duration.ofMillis(500))
                        .filter(throwable -> !(throwable instanceof WebClientResponseException) ||
                                ((WebClientResponseException) throwable).getStatusCode().is5xxServerError())
                        .doBeforeRetry(retrySignal -> log.debug("Indices request retry attempt: {}", retrySignal.totalRetries() + 1))
                        .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) -> retrySignal.failure()))
                .onErrorResume(e -> Mono.empty());
    }

    // 9. 히트맵 분석 (포트폴리오 자산 리스트 전달)
    public Mono<com.mystockfolio.backend.dto.DashboardDto.HeatmapResponse> generateHeatmap(
            java.util.List<java.util.Map<String, Object>> portfolioAssets) {
        return webClient.post()
                .uri("/api/analytics/heatmap")
                .bodyValue(portfolioAssets)
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    log.error("Error calling MarketDataService for heatmap: {}", response.statusCode());
                    return response.createException();
                })
                .bodyToMono(com.mystockfolio.backend.dto.DashboardDto.HeatmapResponse.class)
                .onErrorResume(e -> {
                    log.error("Failed to generate heatmap: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    // 10. 위험 지표 계산 (포트폴리오 자산 리스트 전달) - 동기 방식 사용
    public Mono<com.mystockfolio.backend.dto.DashboardDto.RiskMetricsResponse> calculateRiskMetrics(
            java.util.List<java.util.Map<String, Object>> portfolioAssets) {
        return webClient.post()
                .uri("/api/analytics/risk/sync")  // 동기 방식 엔드포인트 사용
                .bodyValue(portfolioAssets)
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    log.error("Error calling MarketDataService for risk metrics: {}", response.statusCode());
                    return response.createException();
                })
                .bodyToMono(com.mystockfolio.backend.dto.DashboardDto.RiskMetricsResponse.class)
                .onErrorResume(e -> {
                    log.error("Failed to calculate risk metrics: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    // 11. 위험 지표 계산 시작 (비동기)
    public Mono<java.util.Map<String, Object>> startRiskMetricsCalculation(
            java.util.List<java.util.Map<String, Object>> portfolioAssets) {
        return webClient.post()
                .uri("/api/analytics/risk")
                .bodyValue(portfolioAssets)
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    log.error("Error starting risk metrics calculation: {}", response.statusCode());
                    return response.createException();
                })
                .bodyToMono(new ParameterizedTypeReference<java.util.Map<String, Object>>() {})
                .onErrorResume(e -> {
                    log.error("Failed to start risk metrics calculation: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    // 12. 위험 지표 계산 결과 조회
    public Mono<com.mystockfolio.backend.dto.DashboardDto.RiskMetricsResponse> getRiskMetricsResult(String jobId) {
        return webClient.get()
                .uri("/api/analytics/risk/{jobId}", jobId)
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    if (response.statusCode() == HttpStatus.ACCEPTED) {
                        // 202: 아직 처리 중
                        log.debug("Risk metrics calculation still processing for job: {}", jobId);
                        return Mono.error(new RuntimeException("PROCESSING"));
                    }
                    log.error("Error getting risk metrics result: {}", response.statusCode());
                    return response.createException();
                })
                .bodyToMono(com.mystockfolio.backend.dto.DashboardDto.RiskMetricsResponse.class)
                .onErrorResume(e -> {
                    if (e.getMessage() != null && e.getMessage().contains("PROCESSING")) {
                        return Mono.error(new RuntimeException("PROCESSING"));
                    }
                    log.error("Failed to get risk metrics result: {}", e.getMessage());
                    return Mono.empty();
                });
    }
}