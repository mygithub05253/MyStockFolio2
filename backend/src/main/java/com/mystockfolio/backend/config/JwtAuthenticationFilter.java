package com.mystockfolio.backend.config;

import com.mystockfolio.backend.service.CustomUserDetailsService;
import com.mystockfolio.backend.util.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
// [JWTCustomUser] 임시 사용자 ID를 UserDetails에 포함시키기 위한 커스텀 클래스 (필수)
import org.springframework.security.core.GrantedAuthority;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    // [중요: Spring Security UserDetails에 ID를 포함시킬 Custom 클래스 정의]
    public static class CustomUserDetails extends org.springframework.security.core.userdetails.User {
        private final Long userId;

        public CustomUserDetails(String username, String password, Long userId, java.util.Collection<? extends GrantedAuthority> authorities) {
            super(username, password, authorities);
            this.userId = userId;
        }

        public Long getUserId() {
            return userId;
        }
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                // JWT subject가 이메일 또는 사용자 ID(문자열)일 수 있음
                String subject = tokenProvider.getEmailFromToken(jwt);

                UserDetails userDetails;
                if (subject != null && subject.contains("@")) {
                    userDetails = customUserDetailsService.loadUserByUsername(subject);
                } else {
                    try {
                        Long userId = Long.parseLong(subject);
                        userDetails = customUserDetailsService.loadUserById(userId);
                    } catch (NumberFormatException nfe) {
                        log.warn("JWT subject 형식이 올바르지 않습니다: {}", subject);
                        userDetails = null;
                    }
                }

                if (userDetails != null) {
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("Authenticated user: {}, setting security context", userDetails.getUsername());
                }
            } else if (StringUtils.hasText(jwt)) {
                log.debug("Invalid or expired JWT token");
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    // Request Header에서 토큰 정보 추출 (이전과 동일)
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // "Bearer " 이후의 문자열 반환
        }
        return null;
    }
}