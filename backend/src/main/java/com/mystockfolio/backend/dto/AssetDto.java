package com.mystockfolio.backend.dto;

import com.mystockfolio.backend.domain.entity.Asset;
import com.mystockfolio.backend.domain.entity.AssetType;
import com.mystockfolio.backend.domain.entity.Portfolio;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class AssetDto {

    // --- 요청(Request) DTO ---

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssetCreateRequest {
        private String ticker;
        private Double quantity;
        private Double avgBuyPrice;
        private String name;
        private String assetType;

        public Asset toEntity(Portfolio portfolio) {
            // validation: ticker
            if (ticker == null || ticker.trim().isEmpty()) {
                throw new IllegalArgumentException("Ticker is required");
            }
            
            // validation: quantity
            if (quantity == null || quantity <= 0) {
                throw new IllegalArgumentException("Quantity must be greater than 0");
            }
            
            // validation: avgBuyPrice
            if (avgBuyPrice == null || avgBuyPrice <= 0) {
                throw new IllegalArgumentException("Average buy price must be greater than 0");
            }
            
            // validation: assetType
            if (assetType == null || assetType.trim().isEmpty()) {
                throw new IllegalArgumentException("Asset type is required");
            }
            
            AssetType type;
            try {
                type = AssetType.valueOf(assetType.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid asset type: " + assetType + ". Valid values are: STOCK, COIN, STABLECOIN, DEFI, NFT, OTHER");
            }

            return Asset.builder()
                    .portfolio(portfolio)
                    .assetType(type)
                    .ticker(ticker.toUpperCase())
                    .name(name)
                    .quantity(quantity)
                    .avgBuyPrice(avgBuyPrice)
                    .build();
        }
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssetUpdateRequest {
        private String ticker;
        private String name;
        private Double quantity;
        private Double avgBuyPrice;
    }


    // --- 응답(Response) DTO ---

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssetResponse {
        private Long id;
        private String name;
        private String ticker;
        private Double quantity;
        private Double avgBuyPrice;
        private String assetType;
        private Long portfolioId;

        public static AssetResponse fromEntity(Asset asset) {
            return AssetResponse.builder()
                    .id(asset.getId())
                    .name(asset.getName())
                    .ticker(asset.getTicker())
                    .quantity(asset.getQuantity())
                    .avgBuyPrice(asset.getAvgBuyPrice())
                    .assetType(asset.getAssetType().name())
                    .portfolioId(asset.getPortfolio().getId()) // <-- 수정: getPortfolioId() -> getId()
                    .build();
        }
    }
}