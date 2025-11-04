package com.mystockfolio.backend.repository;

import com.mystockfolio.backend.domain.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssetRepository extends JpaRepository<Asset, Long> {

    // 특정 포트폴리오에 속한 모든 자산 조회 (Portfolio ID 기준)
    // findBy[연관관계필드명][연관된엔티티의PK필드명] -> findByPortfolioId
    List<Asset> findByPortfolioId(Long portfolioId); // <-- 수정: findByPortfolioPortfolioId -> findByPortfolioId
}