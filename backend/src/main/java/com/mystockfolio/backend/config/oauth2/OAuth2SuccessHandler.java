package com.mystockfolio.backend.config.oauth2;

import com.mystockfolio.backend.domain.entity.User;
import com.mystockfolio.backend.util.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * OAuth2 로그인 성공 시 JWT 토큰을 발급하고 프론트엔드로 리다이렉트하는 핸들러
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        
        try {
            log.info("======== OAuth2SuccessHandler 시작 ========");
            log.info("Authentication Type: {}", authentication.getClass().getName());
            log.info("Principal Type: {}", authentication.getPrincipal().getClass().getName());
            
            CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
            User user = oAuth2User.getUser();
            
            log.info("OAuth2 로그인 성공 - User ID: {}, Email: {}, Provider: {}, IsOauth2Signup: {}", 
                    user.getUserId(), user.getEmail(), user.getProvider(), user.getIsOauth2Signup());

            // OAuth2 회원가입이 필요한 경우 (추가 정보 입력)
            if (user.getIsOauth2Signup()) {
                log.info("OAuth2 회원가입 플로우 - 추가 정보 입력 페이지로 리다이렉트");
                
                // 한글 닉네임을 URL 인코딩
                String encodedNickname = URLEncoder.encode(user.getNickname(), StandardCharsets.UTF_8);
                
                // 회원가입 페이지로 리다이렉트
                String redirectUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/oauth2/signup")
                        .queryParam("email", user.getEmail())
                        .queryParam("nickname", encodedNickname)
                        .queryParam("provider", user.getProvider())
                        .queryParam("providerId", user.getProviderId())
                        .build()
                        .toUriString();
                
                log.info("OAuth2 회원가입 리다이렉트 URL: {}", redirectUrl);
                getRedirectStrategy().sendRedirect(request, response, redirectUrl);
                return;
            }

            // 기존 사용자 또는 회원가입 완료된 사용자 - JWT 토큰 발급 후 대시보드로 이동
            String token = jwtTokenProvider.generateToken(user.getUserId());
            log.info("JWT 토큰 생성 완료 - Length: {}", token.length());
            
            // 한글 닉네임을 URL 인코딩 (Tomcat URL 인코딩 오류 방지)
            String encodedNickname = URLEncoder.encode(user.getNickname(), StandardCharsets.UTF_8);
            
            // 프론트엔드로 리다이렉트 (토큰과 사용자 정보를 쿼리 파라미터로 전달)
            String redirectUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/oauth2/callback")
                    .queryParam("accessToken", token)
                    .queryParam("userId", user.getUserId())
                    .queryParam("email", user.getEmail())
                    .queryParam("nickname", encodedNickname)
                    .build()
                    .toUriString();

            log.info("OAuth2 리다이렉트 URL: {}", redirectUrl);
            log.info("======== OAuth2SuccessHandler 완료 ========");
            
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
            
        } catch (Exception e) {
            log.error("OAuth2SuccessHandler 처리 중 오류 발생", e);
            response.sendRedirect("http://localhost:3000/signin?error=oauth2_handler_failed");
        }
    }
}

