package com.mystockfolio.backend.repository;

import com.mystockfolio.backend.domain.entity.RewardHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RewardHistoryRepository extends JpaRepository<RewardHistory, Long> {
    
    /**
     * 특정 사용자의 리워드 히스토리 조회
     */
    List<RewardHistory> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * 오늘 특정 활동 타입으로 리워드를 받았는지 확인
     * 여러 결과가 있을 수 있으므로 List로 반환
     */
    @Query("SELECT rh FROM RewardHistory rh WHERE rh.user.userId = :userId " +
           "AND rh.activityType = :activityType " +
           "AND DATE(rh.createdAt) = :date")
    List<RewardHistory> findByUserIdAndActivityTypeAndDate(
        @Param("userId") Long userId,
        @Param("activityType") String activityType,
        @Param("date") LocalDate date
    );

    /**
     * 특정 사용자의 최근 N개 리워드 히스토리 조회
     */
    @Query("SELECT rh FROM RewardHistory rh WHERE rh.user.userId = :userId " +
           "ORDER BY rh.createdAt DESC")
    List<RewardHistory> findTopNByUserIdOrderByCreatedAtDesc(
        @Param("userId") Long userId
    );
}

