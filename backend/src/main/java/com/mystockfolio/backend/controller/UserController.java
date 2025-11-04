package com.mystockfolio.backend.controller;

import com.mystockfolio.backend.config.JwtAuthenticationFilter;
import com.mystockfolio.backend.dto.UserDto;
import com.mystockfolio.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Security Context에서 현재 로그인한 사용자 ID 추출
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getPrincipal() instanceof JwtAuthenticationFilter.CustomUserDetails) {
            JwtAuthenticationFilter.CustomUserDetails userDetails = 
                (JwtAuthenticationFilter.CustomUserDetails) authentication.getPrincipal();
            Long userId = userDetails.getUserId();
            log.debug("현재 사용자 ID 추출: {}", userId);
            return userId;
        }
        
        log.warn("인증된 사용자를 찾을 수 없습니다.");
        return null;
    }

    // 사용자 프로필 조회
    @GetMapping("/profile")
    public ResponseEntity<UserDto.ProfileResponse> getProfile() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        log.info("프로필 조회 - userId: {}", userId);
        UserDto.ProfileResponse response = userService.getProfile(userId);
        return ResponseEntity.ok(response);
    }

    // 사용자 프로필 업데이트
    @PutMapping("/profile")
    public ResponseEntity<UserDto.ProfileResponse> updateProfile(
            @Valid @RequestBody UserDto.ProfileUpdateRequest requestDto) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        log.info("프로필 업데이트 - userId: {}", userId);
        UserDto.ProfileResponse response = userService.updateProfile(userId, requestDto);
        log.info("프로필 업데이트 완료");
        return ResponseEntity.ok(response);
    }

    // 사용자 계정 삭제
    @DeleteMapping("/profile")
    public ResponseEntity<Void> deleteAccount(@RequestBody(required = false) UserDto.DeleteConfirmRequest requestDto) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        log.info("계정 삭제 요청 - userId: {}", userId);
        
        try {
            // requestDto가 없거나 비밀번호가 없으면 빈 객체로 전달
            // UserService.deleteAccount에서 소셜 로그인 사용자 여부를 판단하여 처리
            UserDto.DeleteConfirmRequest confirmRequest = requestDto != null 
                ? requestDto 
                : new UserDto.DeleteConfirmRequest("");
            
            userService.deleteAccount(userId, confirmRequest);
            
            log.info("계정 삭제 완료");
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.error("계정 삭제 실패 (잘못된 요청): {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .header("X-Error-Message", e.getMessage())
                    .build();
        } catch (Exception e) {
            log.error("계정 삭제 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .header("X-Error-Message", e.getMessage())
                    .build();
        }
    }
}

