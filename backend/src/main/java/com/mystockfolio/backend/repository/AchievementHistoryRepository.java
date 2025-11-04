package com.mystockfolio.backend.repository;

import com.mystockfolio.backend.domain.entity.AchievementHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AchievementHistoryRepository extends JpaRepository<AchievementHistory, Long> {
    
    /**
     * 특정 사용자의 성과 이력 조회
     */
    List<AchievementHistory> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * 특정 사용자가 이미 특정 성과를 받았는지 확인
     * 여러 개가 있을 수 있으므로 List로 반환하고 첫 번째 항목만 사용
     */
    List<AchievementHistory> findByUserIdAndAchievementType(Long userId, String achievementType);

    /**
     * 특정 사용자의 특정 성과 존재 여부
     * List의 첫 번째 항목만 확인하도록 수정
     */
    default boolean existsByUserIdAndAchievementType(Long userId, String achievementType) {
        List<AchievementHistory> achievements = findByUserIdAndAchievementType(userId, achievementType);
        return achievements != null && !achievements.isEmpty();
    }
}

