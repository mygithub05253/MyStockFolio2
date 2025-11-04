package com.mystockfolio.backend.controller;

import com.mystockfolio.backend.config.JwtAuthenticationFilter;
import com.mystockfolio.backend.dto.WatchlistDto;
import com.mystockfolio.backend.service.WatchlistService;
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
@RequestMapping("/api/watchlist")
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistService watchlistService;

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
    public ResponseEntity<List<WatchlistDto.WatchlistResponse>> getWatchlist() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        List<WatchlistDto.WatchlistResponse> watchlist = watchlistService.getWatchlistByUserId(userId);
        log.info("관심종목 조회 완료 - {}개", watchlist.size());
        return ResponseEntity.ok(watchlist);
    }

    @PostMapping
    public ResponseEntity<WatchlistDto.WatchlistResponse> addToWatchlist(
            @RequestBody WatchlistDto.WatchlistCreateRequest request) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            WatchlistDto.WatchlistResponse created = watchlistService.addToWatchlist(userId, request);
            log.info("관심종목 추가 완료 - watchlistId: {}", created.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Already in watchlist")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{watchlistId}")
    public ResponseEntity<Void> removeFromWatchlist(@PathVariable Long watchlistId) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            watchlistService.removeFromWatchlist(userId, watchlistId);
            log.info("관심종목 삭제 완료");
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}

