package com.mystockfolio.backend.controller;

import com.mystockfolio.backend.config.JwtAuthenticationFilter;
import com.mystockfolio.backend.dto.DashboardDto;
import com.mystockfolio.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

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

    @GetMapping("/stats")
    public ResponseEntity<DashboardDto.PortfolioStatsResponse> getPortfolioStats() {
        log.info("대시보드 통계 API 호출됨");

        Long userId = getCurrentUserId();
        if (userId == null) {
            log.error("인증된 사용자 ID를 찾을 수 없습니다");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        log.info("사용자 ID: {}의 대시보드 통계 조회 시작", userId);
        DashboardDto.PortfolioStatsResponse response = dashboardService.getPortfolioStats(userId);
        log.info("대시보드 통계 응답 전송 완료 - 총 자산: {}, 수익률: {}%", 
            response.getTotalMarketValue(), response.getTotalReturnRate());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/heatmap")
    public ResponseEntity<DashboardDto.HeatmapResponse> getHeatmap() {
        log.info("히트맵 분석 API 호출됨");

        Long userId = getCurrentUserId();
        if (userId == null) {
            log.error("인증된 사용자 ID를 찾을 수 없습니다");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        log.info("사용자 ID: {}의 히트맵 분석 조회 시작", userId);
        DashboardDto.HeatmapResponse response = dashboardService.getHeatmap(userId);
        log.info("히트맵 분석 응답 전송 완료 - 섹터 개수: {}", 
            response.getSectors() != null ? response.getSectors().size() : 0);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/risk")
    public ResponseEntity<DashboardDto.RiskMetricsResponse> getRiskMetrics() {
        log.info("위험 지표 계산 API 호출됨 (동기 방식)");

        Long userId = getCurrentUserId();
        if (userId == null) {
            log.error("인증된 사용자 ID를 찾을 수 없습니다");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        log.info("사용자 ID: {}의 위험 지표 계산 시작", userId);
        DashboardDto.RiskMetricsResponse response = dashboardService.getRiskMetrics(userId);
        log.info("위험 지표 계산 응답 전송 완료 - 변동성: {}%, MDD: {}%, 위험 수준: {}", 
            response.getVolatility(), response.getMdd(), response.getRiskLevel());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/risk/start")
    public ResponseEntity<DashboardDto.RiskMetricsJobResponse> startRiskMetricsCalculation() {
        log.info("위험 지표 계산 작업 시작 API 호출됨 (비동기)");

        Long userId = getCurrentUserId();
        if (userId == null) {
            log.error("인증된 사용자 ID를 찾을 수 없습니다");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        log.info("사용자 ID: {}의 위험 지표 계산 작업 시작", userId);
        DashboardDto.RiskMetricsJobResponse response = dashboardService.startRiskMetricsCalculation(userId);
        log.info("위험 지표 계산 작업 시작 완료 - jobId: {}", response.getJobId());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping("/risk/result/{jobId}")
    public ResponseEntity<DashboardDto.RiskMetricsResponse> getRiskMetricsResult(@PathVariable String jobId) {
        log.info("위험 지표 계산 결과 조회 API 호출됨 - jobId: {}", jobId);

        Long userId = getCurrentUserId();
        if (userId == null) {
            log.error("인증된 사용자 ID를 찾을 수 없습니다");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        DashboardDto.RiskMetricsResponse result = dashboardService.getRiskMetricsResult(jobId);
        
        if (result == null) {
            // 아직 처리 중이거나 실패
            log.debug("위험 지표 계산 결과 없음 (아직 처리 중 또는 실패) - jobId: {}", jobId);
            return ResponseEntity.status(HttpStatus.ACCEPTED).build(); // 202 Accepted
        }
        
        log.info("위험 지표 계산 결과 조회 완료 - jobId: {}", jobId);
        return ResponseEntity.ok(result);
    }
}