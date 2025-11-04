package com.mystockfolio.backend.service;

import com.mystockfolio.backend.config.JwtAuthenticationFilter;
import com.mystockfolio.backend.domain.entity.User;
import com.mystockfolio.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    // 사용자 ID(Long 타입)를 기반으로 CustomUserDetails 객체를 로드하는 메서드
    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id : " + id));

        // CustomUserDetails 객체로 변환하여 반환 (userId 포함)
        return new JwtAuthenticationFilter.CustomUserDetails(
                user.getEmail(),
                user.getPassword() == null ? "" : user.getPassword(),
                user.getUserId(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    // UserDetailsService 인터페이스의 기본 메서드 (이메일 기반 로드)
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email : " + email));

        // CustomUserDetails 객체로 변환하여 반환 (userId 포함)
        return new JwtAuthenticationFilter.CustomUserDetails(
                user.getEmail(),
                user.getPassword() == null ? "" : user.getPassword(),
                user.getUserId(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }
}