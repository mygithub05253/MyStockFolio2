package com.mystockfolio.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class AuthDto {

    // --- 요청(Request) DTO ---

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignUpRequest {
        @NotBlank(message = "이메일은 필수 입력값입니다.")
        @Email(message = "이메일 형식이 올바르지 않습니다.")
        private String email;

        @NotBlank(message = "비밀번호는 필수 입력값입니다.")
        @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.") // 예시 제약 조건
        private String password;

        @NotBlank(message = "비밀번호 확인은 필수 입력값입니다.")
        private String passwordConfirm;

        @NotBlank(message = "닉네임은 필수 입력값입니다.")
        private String nickname;

        private String walletAddress; // 선택 사항일 수 있음
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignInRequest {
        // SignIn.js 에서 받는 필드
        private String email;
        private String password;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OAuth2CompleteRequest {
        @NotBlank(message = "이메일은 필수 입력값입니다.")
        @Email(message = "이메일 형식이 올바르지 않습니다.")
        private String email;

        @NotBlank(message = "닉네임은 필수 입력값입니다.")
        @Size(min = 2, max = 50, message = "닉네임은 2자 이상 50자 이하여야 합니다.")
        private String nickname;

        @NotBlank(message = "Provider는 필수 입력값입니다.")
        private String provider;

        @NotBlank(message = "Provider ID는 필수 입력값입니다.")
        private String providerId;

        private String walletAddress; // 선택 사항
    }

    // --- 응답(Response) DTO ---

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthResponse {
        // 로그인 성공 시 프론트엔드에 전달할 정보 (JWT 토큰 포함 예정)
        private Long userId;
        private String email;
        private String nickname;
        private String accessToken; // JWT 액세스 토큰 (다음 단계에서 구현)
        private String provider; // 인증 제공자 (mystockfolio, google, kakao, naver, metamask 등)
        private String walletAddress; // 지갑 주소 (MetaMask 사용자 등)
        // private String refreshToken; // 리프레시 토큰 (선택 사항)
    }

    // 간단 응답 메시지 (예: 회원가입 성공)
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageResponse {
        private String message;
    }
}