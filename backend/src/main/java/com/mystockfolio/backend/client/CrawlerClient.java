package com.mystockfolio.backend.client;

import com.mystockfolio.backend.dto.MarketDataDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;
import java.time.Duration;
import java.util.List;

@Slf4j
@Component
public class CrawlerClient {

    private final WebClient webClient;

    public CrawlerClient(@Value("${crawler.service.url}") String crawlerUrl, WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl(crawlerUrl).build();
        log.info("CrawlerClient initialized with URL: {}", crawlerUrl);
    }

    // 한국 주식 시세 정보 조회
    public Mono<MarketDataDto.KRStockQuoteResponse> getKRStockQuote(String ticker) {
        return webClient.get()
                .uri("/api/crawler/kr-stock/quote/{ticker}", ticker)
                .retrieve()
                .onStatus(status -> status.isError(), response -> {
                    log.error("Error calling CrawlerService for KR stock quote: {}", response.statusCode());
                    if (response.statusCode() == HttpStatus.NOT_FOUND) {
                        return Mono.error(new WebClientResponseException(
                                response.statusCode().value(),
                                "KR stock data not found for ticker: " + ticker,
                                response.headers().asHttpHeaders(), null, null
                        ));
                    }
                    return response.createException();
                })
                .bodyToMono(MarketDataDto.KRStockQuoteResponse.class)
                .retryWhen(Retry.backoff(2, Duration.ofMillis(500))
                        .filter(throwable -> {
                            boolean shouldRetry = !(throwable instanceof WebClientResponseException) ||
                                    ((WebClientResponseException) throwable).getStatusCode().is5xxServerError();
                            if (shouldRetry) {
                                log.debug("Retrying KR stock quote request for ticker: {}", ticker);
                            }
                            return shouldRetry;
                        })
                        .doBeforeRetry(retrySignal -> log.debug("KR stock quote request retry attempt {} for ticker: {}",
                                retrySignal.totalRetries() + 1, ticker))
                        .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) -> retrySignal.failure()))
                .onErrorResume(e -> {
                    log.error("Failed to connect to CrawlerService for KR stock quote: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    // 한국 주식 기본 정보 조회
    public Mono<MarketDataDto.KRStockInfoResponse> getKRStockInfo(String ticker) {
        return webClient.get()
                .uri("/api/crawler/kr-stock/info/{ticker}", ticker)
                .retrieve()
                .onStatus(status -> status.isError(), response -> response.createException())
                .bodyToMono(MarketDataDto.KRStockInfoResponse.class)
                .onErrorResume(e -> {
                    log.error("Failed to get KR stock info: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    // 채권 목록 조회
    public Mono<List<MarketDataDto.BondInfoResponse>> getBondList() {
        return webClient.get()
                .uri("/api/crawler/bond/list")
                .retrieve()
                .onStatus(status -> status.isError(), response -> response.createException())
                .bodyToMono(new ParameterizedTypeReference<List<MarketDataDto.BondInfoResponse>>() {})
                .onErrorResume(e -> {
                    log.error("Failed to get bond list: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    // 지수 목록 조회
    public Mono<List<MarketDataDto.IndexInfoResponse>> getIndexList() {
        return webClient.get()
                .uri("/api/crawler/index/list")
                .retrieve()
                .onStatus(status -> status.isError(), response -> response.createException())
                .bodyToMono(new ParameterizedTypeReference<List<MarketDataDto.IndexInfoResponse>>() {})
                .onErrorResume(e -> {
                    log.error("Failed to get index list: {}", e.getMessage());
                    return Mono.empty();
                });
    }

    // 헬스체크
    public Mono<String> getHealth() {
        return webClient.get()
                .uri("/health")
                .retrieve()
                .onStatus(status -> status.isError(), response -> response.createException())
                .bodyToMono(String.class)
                .retryWhen(Retry.backoff(2, Duration.ofMillis(500))
                        .filter(throwable -> !(throwable instanceof WebClientResponseException))
                        .doBeforeRetry(retrySignal -> log.debug("CrawlerService health check retry attempt: {}", retrySignal.totalRetries() + 1))
                        .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) -> retrySignal.failure()))
                .onErrorResume(e -> Mono.empty());
    }
}

