package com.mystockfolio.backend.domain.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "achievement_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AchievementHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "wallet_address", length = 42, nullable = false)
    private String walletAddress;

    @Column(name = "achievement_type", length = 50, nullable = false)
    private String achievementType;

    @Column(name = "token_id", length = 50)
    private String tokenId;

    @Column(name = "transaction_hash", length = 66)
    private String transactionHash;

    @Column(name = "metadata", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> metadata;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Builder
    public AchievementHistory(User user, String walletAddress, String achievementType,
                             String tokenId, String transactionHash, Map<String, Object> metadata) {
        this.user = user;
        this.walletAddress = walletAddress;
        this.achievementType = achievementType;
        this.tokenId = tokenId;
        this.transactionHash = transactionHash;
        this.metadata = metadata;
        this.createdAt = LocalDateTime.now();
    }
}

