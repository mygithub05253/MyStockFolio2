package com.mystockfolio.backend.repository;

import com.mystockfolio.backend.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional; // Optional 사용

public interface UserRepository extends JpaRepository<User, Long> {
    // 이메일로 사용자 조회 (로그인 시 사용)
    Optional<User> findByEmail(String email);

    // 이메일 존재 여부 확인 (회원가입 시 중복 체크)
    boolean existsByEmail(String email);

    // 지갑 주소로 사용자 조회 (지갑 주소 등록 및 블록체인 연동 시 사용)
    Optional<User> findByWalletAddress(String walletAddress);

    // Provider와 ProviderId로 사용자 조회 (OAuth2 인증 시 사용)
    Optional<User> findByProviderAndProviderId(String provider, String providerId);
}