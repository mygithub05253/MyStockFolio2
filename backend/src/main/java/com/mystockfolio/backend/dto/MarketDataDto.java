package com.mystockfolio.backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.util.List;

public class MarketDataDto {

    // FastAPI PriceResponse와 매핑
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceResponse {
        private String ticker;
        private Double price;
        private String currency;
        private String lastUpdated;
    }

    // FastAPI ChartPoint와 매핑
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChartPoint {
        private String date;
        private Double price;
    }

    // FastAPI ChartResponse와 매핑
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChartResponse {
        private String ticker;
        private List<ChartPoint> history;
    }

    // FastAPI DetailedQuoteResponse와 매핑
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DetailedQuoteResponse {
        private String ticker;
        private String name;
        private Double current_price;
        private Double open_price;
        private Double high_price;
        private Double low_price;
        private Double previous_close;
        private Integer volume;
        private Double market_cap;
        private Double pe_ratio;
        private Double change;
        private Double change_percent;
        private String currency;
        private String last_updated;
    }

    // Crawler Service KRStockQuote와 매핑
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KRStockQuoteResponse {
        private String ticker;
        private String name;
        private Double current_price;
        private Double previous_close;
        private Double change;
        private Double change_percent;
        private Integer volume;
        private Double high_price;
        private Double low_price;
        private Double open_price;
        private String currency;
    }

    // Crawler Service KRStockInfo와 매핑
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KRStockInfoResponse {
        private String ticker;
        private String name;
        private String market;
        private String sector;
        private String industry;
        private Double market_cap;
        private Integer listed_shares;
        private String website;
    }

    // Crawler Service BondInfo와 매핑
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BondInfoResponse {
        private String bond_type;
        private String name;
        private Double yield_rate;
        private String maturity;
        private Double coupon_rate;
        private String last_updated;
    }

    // Crawler Service IndexInfo와 매핑
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IndexInfoResponse {
        private String index_code;
        private String name;
        private Double current_value;
        private Double change;
        private Double change_percent;
        private String last_updated;
    }
}