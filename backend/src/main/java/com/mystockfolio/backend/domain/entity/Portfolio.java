package com.mystockfolio.backend.domain.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Portfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // @Column(name = "portfolio_id") // <-- 제거: DB PK 컬럼명은 'id'
    private Long id; // <-- 필드 이름 'id'로 수정

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String name;

    @OneToMany(mappedBy = "portfolio", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Asset> assets = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public Portfolio(User user, String name) {
        this.user = user;
        this.name = name;
    }

    // 연관관계 편의 메서드
    public void addAsset(Asset asset) {
        this.assets.add(asset);
        if (asset.getPortfolio() != this) { // 무한 루프 방지
            asset.setPortfolio(this);
        }
    }
    // 이름 변경 메서드
    public void updateName(String name) {
        if (name != null && !name.isBlank()){
            this.name = name;
        }
    }
}