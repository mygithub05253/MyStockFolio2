// backend/src/main/java/com/mystockfolio/backend/controller/AssetController.java (전체 코드)

package com.mystockfolio.backend.controller;

import com.mystockfolio.backend.config.JwtAuthenticationFilter;
import com.mystockfolio.backend.dto.AssetDto;
import com.mystockfolio.backend.service.AssetService;
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
public class AssetController {

    private final AssetService assetService;
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

    // 특정 포트폴리오의 자산 목록 조회
    @GetMapping("/{portfolioId}/assets")
    public ResponseEntity<List<AssetDto.AssetResponse>> getAssetsByPortfolioId(@PathVariable Long portfolioId) {
        log.info("자산 목록 조회 - portfolioId: {}", portfolioId);
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<AssetDto.AssetResponse> assets = assetService.getAssetsByPortfolioId(portfolioId, userId);
        log.info("자산 목록 조회 완료 - {}개", assets.size());
        return ResponseEntity.ok(assets);
    }

    @PostMapping("/{portfolioId}/assets")
    public ResponseEntity<AssetDto.AssetResponse> createAsset(
            @PathVariable Long portfolioId,
            @RequestBody AssetDto.AssetCreateRequest requestDto) {
        log.info("자산 추가 요청 - portfolioId: {}", portfolioId);
        log.info("   - ticker: {}, assetType: {}, quantity: {}, avgBuyPrice: {}, name: {}", 
            requestDto.getTicker(), requestDto.getAssetType(), requestDto.getQuantity(), 
            requestDto.getAvgBuyPrice(), requestDto.getName());
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        AssetDto.AssetResponse createdAsset = assetService.createAsset(portfolioId, userId, requestDto);
        log.info("자산 추가 완료 - assetId: {}, name: {}", createdAsset.getId(), createdAsset.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAsset);
    }

    @PutMapping("/{portfolioId}/assets/{assetId}")
    public ResponseEntity<AssetDto.AssetResponse> updateAsset(
            @PathVariable Long portfolioId,
            @PathVariable Long assetId,
            @RequestBody AssetDto.AssetUpdateRequest requestDto) {
        log.info("자산 수정 요청 - assetId: {}", assetId);
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        AssetDto.AssetResponse updatedAsset = assetService.updateAsset(assetId, userId, requestDto);
        log.info("자산 수정 완료");
        return ResponseEntity.ok(updatedAsset);
    }

    @DeleteMapping("/{portfolioId}/assets/{assetId}")
    public ResponseEntity<Void> deleteAsset(
            @PathVariable Long portfolioId,
            @PathVariable Long assetId) {
        log.info("자산 삭제 요청 - assetId: {}", assetId);
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        assetService.deleteAsset(assetId, userId);
        log.info("자산 삭제 완료");
        return ResponseEntity.noContent().build();
    }
}