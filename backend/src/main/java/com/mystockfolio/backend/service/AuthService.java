package com.mystockfolio.backend.service;

import com.mystockfolio.backend.domain.entity.User;
import com.mystockfolio.backend.dto.AuthDto;
import com.mystockfolio.backend.exception.DuplicateResourceException;
import com.mystockfolio.backend.exception.InvalidCredentialsException;
import com.mystockfolio.backend.repository.UserRepository;
import com.mystockfolio.backend.util.JwtTokenProvider; // JwtTokenProvider import 추가
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider; // JwtTokenProvider 주입

    // 회원가입 (변경 없음)
    @Transactional
    public User signUp(AuthDto.SignUpRequest requestDto) {
        // 이메일 중복 확인
        if (userRepository.existsByEmail(requestDto.getEmail())) {
            throw new DuplicateResourceException("이미 사용 중인 이메일입니다: " + requestDto.getEmail());
        }

        // 비밀번호 확인 일치 여부
        if (!requestDto.getPassword().equals(requestDto.getPasswordConfirm())) {
            throw new IllegalArgumentException("비밀번호 확인이 일치하지 않습니다.");
        }

        // TODO: 닉네임 중복 확인 (선택 사항)

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(requestDto.getPassword());

        // User 객체 생성 (빌더 패턴 사용)
        User newUser = User.builder()
                .email(requestDto.getEmail())
                .password(encodedPassword)
                .nickname(requestDto.getNickname())
                .walletAddress(requestDto.getWalletAddress())
                .provider("mystockfolio") // 일반 회원가입
                .providerId(null)
                .isOauth2Signup(false)
                .build();

        return userRepository.save(newUser);
    }

    // 로그인 (JWT 발급 로직 수정)
    @Transactional(readOnly = true)
    public AuthDto.AuthResponse signIn(AuthDto.SignInRequest requestDto) {
        // 이메일로 사용자 조회
        User user = userRepository.findByEmail(requestDto.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("이메일 또는 비밀번호가 잘못되었습니다."));

        // OAuth2 사용자는 일반 로그인 불가 (단, mystockfolio provider는 제외)
        if (user.getPassword() == null && !"mystockfolio".equals(user.getProvider())) {
            throw new InvalidCredentialsException("소셜 로그인 계정입니다. " + user.getProvider() + " 로그인을 사용해주세요.");
        }

        // 비밀번호 일치 확인
        if (!passwordEncoder.matches(requestDto.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("이메일 또는 비밀번호가 잘못되었습니다.");
        }

        // JWT 토큰 생성
        String accessToken = jwtTokenProvider.generateToken(user.getUserId());

        // 로그인 성공 응답 생성
        return AuthDto.AuthResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .accessToken(accessToken) // 생성된 JWT 토큰 전달
                .provider(user.getProvider()) // 인증 제공자 정보 추가
                .walletAddress(user.getWalletAddress()) // 지갑 주소 추가
                .build();
    }

    // OAuth2 회원가입 완료
    @Transactional
    public AuthDto.AuthResponse completeOAuth2Signup(AuthDto.OAuth2CompleteRequest requestDto) {
        // OAuth2 사용자 조회 (provider와 providerId로)
        User user = userRepository.findByProviderAndProviderId(requestDto.getProvider(), requestDto.getProviderId())
                .orElseThrow(() -> new InvalidCredentialsException("OAuth2 사용자 정보를 찾을 수 없습니다."));

        // OAuth2 회원가입 상태 확인
        if (!user.getIsOauth2Signup()) {
            throw new InvalidCredentialsException("이미 회원가입이 완료된 사용자입니다.");
        }

        // 사용자 정보 업데이트
        user.updateNickname(requestDto.getNickname());
        if (requestDto.getWalletAddress() != null && !requestDto.getWalletAddress().trim().isEmpty()) {
            user.updateWalletAddress(requestDto.getWalletAddress());
        }
        user.completeOauth2Signup(); // OAuth2 회원가입 완료 플래그 해제

        User savedUser = userRepository.save(user);

        // JWT 토큰 생성
        String accessToken = jwtTokenProvider.generateToken(savedUser.getUserId());

        // 회원가입 완료 응답 생성
        return AuthDto.AuthResponse.builder()
                .userId(savedUser.getUserId())
                .email(savedUser.getEmail())
                .nickname(savedUser.getNickname())
                .accessToken(accessToken)
                .provider(savedUser.getProvider()) // 인증 제공자 정보 추가
                .walletAddress(savedUser.getWalletAddress()) // 지갑 주소 추가
                .build();
    }
}