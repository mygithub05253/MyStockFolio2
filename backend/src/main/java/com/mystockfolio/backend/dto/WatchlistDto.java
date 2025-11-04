package com.mystockfolio.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class WatchlistDto {

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WatchlistCreateRequest {
        private String ticker;
        private String name;
        private String category;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WatchlistResponse {
        private Long id;
        private String ticker;
        private String name;
        private String category;
        private LocalDateTime createdAt;
    }
}

