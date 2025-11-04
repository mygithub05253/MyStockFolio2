package com.mystockfolio.backend.domain.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "reward_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RewardHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "wallet_address", length = 42, nullable = false)
    private String walletAddress;

    @Column(name = "activity_type", length = 50, nullable = false)
    private String activityType;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "transaction_hash", length = 66)
    private String transactionHash;

    @Column(name = "balance_score")
    private Double balanceScore;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Builder
    public RewardHistory(User user, String walletAddress, String activityType, 
                        Double amount, String transactionHash, Double balanceScore) {
        this.user = user;
        this.walletAddress = walletAddress;
        this.activityType = activityType;
        this.amount = amount;
        this.transactionHash = transactionHash;
        this.balanceScore = balanceScore;
        this.createdAt = LocalDateTime.now();
    }
}

