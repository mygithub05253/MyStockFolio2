package com.mystockfolio.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final StringRedisTemplate redisTemplate;

    @GetMapping("/redis")
    public ResponseEntity<String> redisHealth() {
        try {
            String pongKey = "health:pong";
            redisTemplate.opsForValue().set(pongKey, "ok");
            String val = redisTemplate.opsForValue().get(pongKey);
            return ResponseEntity.ok("redis:" + ("ok".equals(val) ? "up" : "down"));
        } catch (Exception e) {
            return ResponseEntity.ok("redis:down");
        }
    }
}


