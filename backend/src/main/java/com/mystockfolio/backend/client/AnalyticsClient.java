package com.mystockfolio.backend.client;

import com.mystockfolio.backend.dto.DashboardDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class AnalyticsClient {

    private final WebClient webClient;

    public AnalyticsClient(
            @Value("${analytics.data.url}") String analyticsUrl, 
            @org.springframework.beans.factory.annotation.Qualifier("analyticsWebClientBuilder") WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl(analyticsUrl).build();
        log.info("AnalyticsClient initialized with URL: {} (timeout: 30s)", analyticsUrl);
    }

    // 히트맵 분석
    public Mono<DashboardDto.HeatmapResponse> generateHeatmap(
            java.util.List<java.util.Map<String, Object>> portfolioAssets) {
        return webClient.post()
                .uri("/api/analytics/heatmap")
                .bodyValue(portfolioAssets)
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    log.error("Error calling AnalyticsService for heatmap: {}", response.statusCode());
                    return response.createException();
                })
                .bodyToMono(DashboardDto.HeatmapResponse.class)
                .onErrorResume(e -> {
                    log.error("Failed to generate heatmap: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    // 위험 지표 계산 시작 (비동기)
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

    // 위험 지표 계산 결과 조회
    public Mono<DashboardDto.RiskMetricsResponse> getRiskMetricsResult(String jobId) {
        return webClient.get()
                .uri("/api/analytics/risk/{jobId}", jobId)
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    if (response.statusCode() == HttpStatus.ACCEPTED) {
                        log.debug("Risk metrics calculation still processing for job: {}", jobId);
                        return Mono.error(new RuntimeException("PROCESSING"));
                    }
                    log.error("Error getting risk metrics result: {}", response.statusCode());
                    return response.createException();
                })
                .bodyToMono(DashboardDto.RiskMetricsResponse.class)
                .onErrorResume(e -> {
                    if (e.getMessage() != null && e.getMessage().contains("PROCESSING")) {
                        return Mono.error(new RuntimeException("PROCESSING"));
                    }
                    log.error("Failed to get risk metrics result: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    // 위험 지표 계산 (동기 방식)
    public Mono<DashboardDto.RiskMetricsResponse> calculateRiskMetricsSync(
            java.util.List<java.util.Map<String, Object>> portfolioAssets) {
        return webClient.post()
                .uri("/api/analytics/risk/sync")
                .bodyValue(portfolioAssets)
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    log.error("Error calling AnalyticsService for risk metrics: {}", response.statusCode());
                    return response.createException();
                })
                .bodyToMono(DashboardDto.RiskMetricsResponse.class)
                .onErrorResume(e -> {
                    log.error("Failed to calculate risk metrics: {}", e.getMessage());
                    return Mono.empty();
                });
    }
}

