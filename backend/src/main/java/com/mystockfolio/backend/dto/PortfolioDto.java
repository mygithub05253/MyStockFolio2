package com.mystockfolio.backend.dto;

import com.mystockfolio.backend.domain.entity.Portfolio;
import com.mystockfolio.backend.domain.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.stream.Collectors;


public class PortfolioDto {

    // --- 요청(Request) DTO ---

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PortfolioCreateRequest {
        private String name;

        public Portfolio toEntity(User user) {
            return Portfolio.builder()
                    .user(user)
                    .name(name)
                    .build();
        }
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PortfolioUpdateRequest {
        private String name;
    }

    // --- 응답(Response) DTO ---

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PortfolioResponse {
        private Long id;
        private String name;
        private List<AssetDto.AssetResponse> assets;

        public static PortfolioResponse fromEntity(Portfolio portfolio) {
            List<AssetDto.AssetResponse> assetDtos = portfolio.getAssets().stream()
                    .map(AssetDto.AssetResponse::fromEntity)
                    .collect(Collectors.toList());

            return PortfolioResponse.builder()
                    .id(portfolio.getId()) // <-- 수정: getPortfolioId() -> getId()
                    .name(portfolio.getName())
                    .assets(assetDtos)
                    .build();
        }
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PortfolioSimpleResponse {
        private Long id;
        private String name;

        public static PortfolioSimpleResponse fromEntity(Portfolio portfolio) {
            return PortfolioSimpleResponse.builder()
                    .id(portfolio.getId()) // <-- 수정: getPortfolioId() -> getId()
                    .name(portfolio.getName())
                    .build();
        }
    }
}