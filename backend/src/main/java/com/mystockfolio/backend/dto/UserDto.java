package com.mystockfolio.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class UserDto {

    // 사용자 프로필 업데이트 요청
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileUpdateRequest {
        @Size(min = 2, max = 50, message = "닉네임은 2자 이상 50자 이하여야 합니다.")
        private String nickname;

        private String walletAddress; // Ethereum 지갑 주소 (0x로 시작, 42자)
    }

    // 사용자 프로필 응답
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProfileResponse {
        private Long userId;
        private String email;
        private String nickname;
        private String walletAddress;
        private String provider;
    }

    // 사용자 정보 삭제 확인 요청
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeleteConfirmRequest {
        private String password; // 계정 삭제 시 비밀번호 확인 (일반 회원가입 사용자만)
    }
}

