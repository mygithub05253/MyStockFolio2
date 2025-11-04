package com.mystockfolio.backend.service;

import com.mystockfolio.backend.domain.entity.User;
import com.mystockfolio.backend.dto.UserDto;
import com.mystockfolio.backend.exception.ForbiddenException;
import com.mystockfolio.backend.exception.ResourceNotFoundException;
import com.mystockfolio.backend.repository.PortfolioRepository;
import com.mystockfolio.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final PasswordEncoder passwordEncoder;

    // 사용자 프로필 조회
    @Transactional(readOnly = true)
    public UserDto.ProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        return UserDto.ProfileResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .walletAddress(user.getWalletAddress())
                .provider(user.getProvider())
                .build();
    }

    // 사용자 프로필 업데이트
    @Transactional
    public UserDto.ProfileResponse updateProfile(Long userId, UserDto.ProfileUpdateRequest requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        log.info("프로필 업데이트 요청 - userId: {}, nickname: {}, walletAddress: {}", 
            userId, requestDto.getNickname(), requestDto.getWalletAddress());

        // 닉네임 업데이트
        if (requestDto.getNickname() != null && !requestDto.getNickname().trim().isEmpty()) {
            user.updateNickname(requestDto.getNickname().trim());
            log.info("닉네임 업데이트 완료: {}", requestDto.getNickname());
        }

        // 지갑 주소 업데이트
        if (requestDto.getWalletAddress() != null) {
            String walletAddress = requestDto.getWalletAddress().trim();
            // 빈 문자열이면 null로 설정 (지갑 주소 제거)
            if (walletAddress.isEmpty()) {
                user.updateWalletAddress(null);
                log.info("지갑 주소 제거 완료");
            } else {
                // 지갑 주소 형식 검증 (0x로 시작하고 42자)
                if (walletAddress.startsWith("0x") && walletAddress.length() == 42) {
                    user.updateWalletAddress(walletAddress);
                    log.info("지갑 주소 업데이트 완료: {}", walletAddress);
                } else {
                    throw new IllegalArgumentException("지갑 주소 형식이 올바르지 않습니다. (0x로 시작하는 42자리 주소)");
                }
            }
        }

        User savedUser = userRepository.save(user);

        return UserDto.ProfileResponse.builder()
                .userId(savedUser.getUserId())
                .email(savedUser.getEmail())
                .nickname(savedUser.getNickname())
                .walletAddress(savedUser.getWalletAddress())
                .provider(savedUser.getProvider())
                .build();
    }

    // 사용자 계정 삭제 (비밀번호 확인 포함)
    @Transactional
    public void deleteAccount(Long userId, UserDto.DeleteConfirmRequest requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        log.info("계정 삭제 요청 - userId: {}, provider: {}", userId, user.getProvider());

        // 일반 회원가입 사용자(mystockfolio)는 비밀번호 확인 필요
        boolean isMystockfolioUser = "mystockfolio".equals(user.getProvider()) && user.getPassword() != null;
        
        if (isMystockfolioUser) {
            if (requestDto.getPassword() == null || requestDto.getPassword().isEmpty()) {
                throw new IllegalArgumentException("계정 삭제를 위해 비밀번호 확인이 필요합니다.");
            }
            
            if (!passwordEncoder.matches(requestDto.getPassword(), user.getPassword())) {
                throw new ForbiddenException("비밀번호가 일치하지 않습니다.");
            }
            log.info("일반 회원가입 사용자 비밀번호 확인 완료");
        } else {
            // 소셜 로그인 사용자 (Google, MetaMask, Kakao, Naver 등)는 비밀번호 확인 불필요
            log.info("소셜 로그인 사용자 ({})는 비밀번호 확인 없이 계정 삭제 진행", user.getProvider());
        }

        // 사용자 관련 데이터 삭제
        // 포트폴리오와 자산도 함께 삭제 (Cascade 또는 수동 삭제)
        long portfolioCount = portfolioRepository.countByUserId(userId);
        if (portfolioCount > 0) {
            log.info("사용자 포트폴리오 {}개 삭제 시작", portfolioCount);
            portfolioRepository.deleteAll(portfolioRepository.findByUserId(userId));
            log.info("사용자 포트폴리오 삭제 완료");
        }

        // 사용자 삭제
        userRepository.delete(user);
        log.info("계정 삭제 완료 - userId: {}", userId);
    }

    // 사용자 계정 삭제 (비밀번호 확인 없이, 관리자용 또는 MetaMask/OAuth2 사용자용)
    @Transactional
    public void deleteAccountWithoutPassword(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        log.info("계정 삭제 요청 (비밀번호 확인 없음) - userId: {}", userId);

        // 사용자 관련 데이터 삭제
        long portfolioCount = portfolioRepository.countByUserId(userId);
        if (portfolioCount > 0) {
            log.info("사용자 포트폴리오 {}개 삭제 시작", portfolioCount);
            portfolioRepository.deleteAll(portfolioRepository.findByUserId(userId));
            log.info("사용자 포트폴리오 삭제 완료");
        }

        // 사용자 삭제
        userRepository.delete(user);
        log.info("계정 삭제 완료 - userId: {}", userId);
    }
}

