package com.mystockfolio.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MarketPriceCacheService {

    private final StringRedisTemplate redisTemplate;

    private String keyForTicker(String ticker) {
        return "price:" + ticker.toUpperCase();
    }

    public Optional<Double> getCachedPrice(String ticker) {
        try {
            String val = redisTemplate.opsForValue().get(keyForTicker(ticker));
            if (val == null) return Optional.empty();
            try {
                return Optional.of(Double.parseDouble(val));
            } catch (NumberFormatException e) {
                return Optional.empty();
            }
        } catch (Exception e) {
            // Redis 장애 시 캐시 미사용 (서비스 지속성 우선)
            return Optional.empty();
        }
    }

    public void cachePrice(String ticker, double price, Duration ttl) {
        try {
            redisTemplate.opsForValue().set(keyForTicker(ticker), Double.toString(price), ttl);
        } catch (Exception ignored) {
            // Redis 장애 시 무시
        }
    }
}


