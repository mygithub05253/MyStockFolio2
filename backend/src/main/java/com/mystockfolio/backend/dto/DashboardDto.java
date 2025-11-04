package com.mystockfolio.backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.util.List;

public class DashboardDto {

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssetAllocation {
        private String assetType;
        private Double percentage;
        private Double value;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssetReturn {
        private Long assetId;
        private String ticker;
        private String name;
        private Double initialInvestment;
        private Double currentValue;
        private Double gainLoss;
        private Double returnRate;
        private String assetType;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PortfolioStatsResponse {
        private Double totalMarketValue;
        private Double totalInitialInvestment;
        private Double totalGainLoss;
        private Double totalReturnRate;
        private List<AssetAllocation> assetAllocations;
        private List<AssetReturn> assetReturns;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SectorHeatmapItem {
        private String sector;
        private Double value;
        private Double changePercent;
        private Integer assetCount;
        private String riskLevel;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HeatmapResponse {
        private List<SectorHeatmapItem> sectors;
        private Double totalValue;
        private String lastUpdated;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RiskMetricsResponse {
        private Double volatility;
        private Double mdd;
        private Double beta;
        private Double sharpeRatio;
        private String recommendation;
        private String riskLevel;
        private String lastUpdated;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RiskMetricsJobResponse {
        private String jobId;
        private String status;
        private String message;
    }
}