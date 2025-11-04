package com.mystockfolio.backend.controller;

import com.mystockfolio.backend.dto.AuthDto;
import com.mystockfolio.backend.service.AuthService;
import jakarta.validation.Valid; // @Valid 어노테이션 사용
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth") // 인증 관련 API 경로
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // 회원가입 API (POST /api/auth/register)
    @PostMapping("/register")
    public ResponseEntity<AuthDto.MessageResponse> registerUser(@Valid @RequestBody AuthDto.SignUpRequest signUpRequest) {
        // @Valid: DTO 필드 유효성 검사 (예: @NotBlank, @Email - DTO에 추가 필요)
        authService.signUp(signUpRequest);
        // 성공 시 간단 메시지 반환
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(AuthDto.MessageResponse.builder().message("회원가입 성공").build());
    }

    // 로그인 API (POST /api/auth/login)
    @PostMapping("/login")
    public ResponseEntity<AuthDto.AuthResponse> authenticateUser(@Valid @RequestBody AuthDto.SignInRequest signInRequest) {
        AuthDto.AuthResponse authResponse = authService.signIn(signInRequest);
        // 성공 시 사용자 정보 및 임시 토큰 반환
        return ResponseEntity.ok(authResponse);
    }

    // OAuth2 회원가입 완료 API (POST /api/auth/oauth2/complete)
    @PostMapping("/oauth2/complete")
    public ResponseEntity<AuthDto.AuthResponse> completeOAuth2Signup(@Valid @RequestBody AuthDto.OAuth2CompleteRequest request) {
        AuthDto.AuthResponse authResponse = authService.completeOAuth2Signup(request);
        return ResponseEntity.ok(authResponse);
    }

    // TODO: 토큰 재발급 API (POST /api/auth/refresh) 등 추가 예정
}