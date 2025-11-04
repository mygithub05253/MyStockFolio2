package com.mystockfolio.backend.service;

import com.mystockfolio.backend.domain.entity.User;
import com.mystockfolio.backend.domain.entity.Watchlist;
import com.mystockfolio.backend.dto.WatchlistDto;
import com.mystockfolio.backend.exception.ForbiddenException;
import com.mystockfolio.backend.repository.UserRepository;
import com.mystockfolio.backend.repository.WatchlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WatchlistService {

    private final WatchlistRepository watchlistRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<WatchlistDto.WatchlistResponse> getWatchlistByUserId(Long userId) {
        log.info("관심종목 조회 - userId: {}", userId);
        List<Watchlist> watchlist = watchlistRepository.findByUserId(userId);
        return watchlist.stream()
                .map(item -> WatchlistDto.WatchlistResponse.builder()
                        .id(item.getId())
                        .ticker(item.getTicker())
                        .name(item.getName())
                        .category(item.getCategory())
                        .createdAt(item.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public WatchlistDto.WatchlistResponse addToWatchlist(Long userId, WatchlistDto.WatchlistCreateRequest request) {
        log.info("관심종목 추가 - userId: {}, ticker: {}", userId, request.getTicker());
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        watchlistRepository.findByUserIdAndTicker(userId, request.getTicker())
                .ifPresent(item -> {
                    throw new RuntimeException("Already in watchlist");
                });
        
        Watchlist watchlist = Watchlist.builder()
                .user(user)
                .ticker(request.getTicker())
                .name(request.getName())
                .category(request.getCategory())
                .build();
        
        Watchlist saved = watchlistRepository.save(watchlist);
        
        return WatchlistDto.WatchlistResponse.builder()
                .id(saved.getId())
                .ticker(saved.getTicker())
                .name(saved.getName())
                .category(saved.getCategory())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Transactional
    public void removeFromWatchlist(Long userId, Long watchlistId) {
        log.info("관심종목 삭제 - userId: {}, watchlistId: {}", userId, watchlistId);
        
        Watchlist watchlist = watchlistRepository.findById(watchlistId)
                .orElseThrow(() -> new RuntimeException("Watchlist item not found"));
        
        if (!watchlist.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("Not authorized to delete this watchlist item");
        }
        
        watchlistRepository.delete(watchlist);
        log.info("관심종목 삭제 완료");
    }
}

