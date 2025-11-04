package com.mystockfolio.backend.domain.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // @Column(name = "asset_id") // <-- 제거: DB PK 컬럼명은 'id'
    private Long id; // <-- 필드 이름 'id' 확인 (이미 맞게 되어 있음)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", nullable = false) // FK 컬럼명은 'portfolio_id'가 맞음
    @Setter // 연관관계 편의 메서드를 위해 유지
    private Portfolio portfolio;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false, length = 15)
    private AssetType assetType;

    @Column(name = "ticker", nullable = false, length = 20)
    private String ticker;

    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "quantity", nullable = false)
    private Double quantity;

    @Column(name = "avgBuyPrice", nullable = false)
    private Double avgBuyPrice;

    @Builder
    public Asset(Portfolio portfolio, AssetType assetType, String ticker, String name, Double quantity, Double avgBuyPrice) {
        this.portfolio = portfolio;
        this.assetType = assetType;
        this.ticker = ticker;
        this.name = name;
        this.quantity = quantity;
        this.avgBuyPrice = avgBuyPrice;
    }

    // 자산 정보 업데이트 메서드
    public void updateAssetDetails(String name, Double quantity, Double avgBuyPrice) {
        if (name != null) this.name = name;
        if (quantity != null && quantity >= 0) this.quantity = quantity;
        if (avgBuyPrice != null && avgBuyPrice >= 0) this.avgBuyPrice = avgBuyPrice;
    }

    // AssetService에서 이름을 설정하기 위한 setter 메서드
    public void setName(String name) {
        this.name = name;
    }

    // 티커 변경을 위한 setter (검증은 서비스 레이어에서 수행)
    public void setTicker(String ticker) {
        this.ticker = ticker;
    }
}