package com.mystockfolio.backend.config;

import io.netty.channel.ChannelOption;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import java.time.Duration;

@Configuration
public class AnalyticsWebClientConfig {

    // 분석 서비스용 WebClient (긴 타임아웃)
    @Bean("analyticsWebClientBuilder")
    public WebClient.Builder analyticsWebClientBuilder() {
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(30))  // 분석 작업은 30초
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000);  // 5초 연결 타임아웃
        
        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient));
    }
    
    // 시세 서비스용 WebClient (짧은 타임아웃)
    @Bean("marketDataWebClientBuilder")
    @Primary
    public WebClient.Builder marketDataWebClientBuilder() {
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(5))  // 시세 조회는 5초
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 3000);  // 3초 연결 타임아웃
        
        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient));
    }
}

