package com.mystockfolio.backend.repository;

import com.mystockfolio.backend.domain.entity.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {
    
    // 사용자 ID로 해당 사용자의 모든 포트폴리오 목록 조회
    @Query("SELECT p FROM Portfolio p WHERE p.user.userId = :userId")
    List<Portfolio> findByUserId(@Param("userId") Long userId);
    
    // 사용자 ID로 해당 사용자의 모든 포트폴리오 목록 조회 (자산 포함 - JOIN FETCH)
    @Query("SELECT DISTINCT p FROM Portfolio p LEFT JOIN FETCH p.assets WHERE p.user.userId = :userId")
    List<Portfolio> findByUserIdWithAssets(@Param("userId") Long userId);
    
    // 사용자 ID로 포트폴리오 개수 조회
    @Query("SELECT COUNT(p) FROM Portfolio p WHERE p.user.userId = :userId")
    long countByUserId(@Param("userId") Long userId);
}