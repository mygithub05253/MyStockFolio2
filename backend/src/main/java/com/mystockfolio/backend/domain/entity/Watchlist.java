package com.mystockfolio.backend.domain.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "watchlist")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Watchlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "ticker", nullable = false, length = 20)
    private String ticker;

    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "category", length = 20)
    private String category;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Builder
    public Watchlist(User user, String ticker, String name, String category, LocalDateTime createdAt) {
        this.user = user;
        this.ticker = ticker;
        this.name = name;
        this.category = category;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }
}

