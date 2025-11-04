package com.mystockfolio.backend.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    private SecretKey key;

    @PostConstruct
    public void init() {
        // Base64 인코딩된 시크릿 키를 디코딩하지 않고 바로 바이트 배열로 사용
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    // 이메일을 기반으로 JWT 토큰 생성
    public String generateToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(email) // 토큰 제목 (이메일 저장)
                .issuedAt(now) // 발급 시간
                .expiration(expiryDate) // 만료 시간
                .signWith(key) // 서명 키
                .compact();
    }

    // 사용자 ID를 기반으로 JWT 토큰 생성 (하위 호환성)
    public String generateToken(Long userId) {
        // userId를 문자열로 변환하여 이메일 필드에 저장
        return generateToken(userId.toString());
    }

    // JWT 토큰에서 이메일 추출
    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    // 하위 호환성을 위한 메서드 (userId 기반)
    @Deprecated
    public Long getUserIdFromToken(String token) {
        // 이메일을 반환하므로 이 메서드는 더 이상 사용하지 않음
        throw new UnsupportedOperationException("Use getEmailFromToken instead");
    }

    // JWT 토큰 유효성 검증
    public boolean validateToken(String authToken) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(authToken);
            return true;
        } catch (SecurityException | MalformedJwtException ex) {
            log.error("Invalid JWT signature");
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty.");
        }
        return false;
    }
}