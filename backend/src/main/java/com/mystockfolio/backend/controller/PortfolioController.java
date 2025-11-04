package com.mystockfolio.backend.controller;

import com.mystockfolio.backend.config.JwtAuthenticationFilter;
import com.mystockfolio.backend.dto.PortfolioDto;
import com.mystockfolio.backend.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/portfolios")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    /**
     * Security Context에서 현재 로그인한 사용자 ID 추출
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getPrincipal() instanceof JwtAuthenticationFilter.CustomUserDetails) {
            JwtAuthenticationFilter.CustomUserDetails userDetails = 
                (JwtAuthenticationFilter.CustomUserDetails) authentication.getPrincipal();
            Long userId = userDetails.getUserId();
            log.debug("현재 사용자 ID 추출: {}", userId);
            return userId;
        }
        
        log.warn("인증된 사용자를 찾을 수 없습니다.");
        return null;
    }

    @GetMapping
    public ResponseEntity<List<PortfolioDto.PortfolioResponse>> getUserPortfolios() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        log.info("포트폴리오 목록 조회 - userId: {}", userId);
        List<PortfolioDto.PortfolioResponse> portfolios = portfolioService.getPortfoliosByUserId(userId);
        log.info("포트폴리오 {}개 조회 완료", portfolios.size());
        return ResponseEntity.ok(portfolios);
    }

    @GetMapping("/{portfolioId}")
    public ResponseEntity<PortfolioDto.PortfolioResponse> getPortfolioDetails(@PathVariable Long portfolioId) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        log.info("포트폴리오 상세 조회 - userId: {}, portfolioId: {}", userId, portfolioId);
        PortfolioDto.PortfolioResponse portfolio = portfolioService.getPortfolioById(userId, portfolioId);
        return ResponseEntity.ok(portfolio);
    }

    @PostMapping
    public ResponseEntity<PortfolioDto.PortfolioSimpleResponse> createPortfolio(@RequestBody PortfolioDto.PortfolioCreateRequest requestDto) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        log.info("포트폴리오 생성 - userId: {}, name: {}", userId, requestDto.getName());
        PortfolioDto.PortfolioSimpleResponse createdPortfolio = portfolioService.createPortfolio(userId, requestDto);
        log.info("포트폴리오 생성 완료 - portfolioId: {}", createdPortfolio.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPortfolio);
    }

    @PutMapping("/{portfolioId}")
    public ResponseEntity<PortfolioDto.PortfolioSimpleResponse> updatePortfolioName(
            @PathVariable Long portfolioId,
            @RequestBody PortfolioDto.PortfolioUpdateRequest requestDto) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        log.info("포트폴리오 수정 - userId: {}, portfolioId: {}", userId, portfolioId);
        PortfolioDto.PortfolioSimpleResponse updatedPortfolio = portfolioService.updatePortfolioName(userId, portfolioId, requestDto);
        return ResponseEntity.ok(updatedPortfolio);
    }

    @DeleteMapping("/{portfolioId}")
    public ResponseEntity<Void> deletePortfolio(@PathVariable Long portfolioId) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        log.info("포트폴리오 삭제 - userId: {}, portfolioId: {}", userId, portfolioId);
        portfolioService.deletePortfolio(userId, portfolioId);
        log.info("포트폴리오 삭제 완료");
        return ResponseEntity.noContent().build();
    }
}