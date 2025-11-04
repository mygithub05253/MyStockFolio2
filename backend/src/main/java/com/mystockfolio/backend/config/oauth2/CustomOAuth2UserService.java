package com.mystockfolio.backend.config.oauth2;

import com.mystockfolio.backend.domain.entity.User;
import com.mystockfolio.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * OAuth2 로그인 시 사용자 정보를 처리하는 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        try {
            OAuth2User oAuth2User = super.loadUser(userRequest);
            
            String registrationId = userRequest.getClientRegistration().getRegistrationId();
            log.info("========================================");
            log.info("OAuth2 로그인 시도 - Provider: {}", registrationId);
            log.info("OAuth2 User Attributes: {}", oAuth2User.getAttributes());

            // 제공자별 사용자 정보 추출
            OAuth2UserInfo oAuth2UserInfo = getOAuth2UserInfo(registrationId, oAuth2User.getAttributes());
            
            log.info("추출된 정보 - ProviderId: {}, Email: {}, Name: {}", 
                    oAuth2UserInfo.getProviderId(), 
                    oAuth2UserInfo.getEmail(), 
                    oAuth2UserInfo.getName());

            // 사용자 저장 또는 업데이트
            User user = saveOrUpdate(oAuth2UserInfo);
            
            log.info("OAuth2 로그인 성공 - User ID: {}, Email: {}, Nickname: {}", 
                    user.getUserId(), user.getEmail(), user.getNickname());
            log.info("========================================");

            // OAuth2User 반환 (Spring Security가 인증 처리에 사용)
            return new CustomOAuth2User(user, oAuth2User.getAttributes());
            
        } catch (Exception e) {
            log.error("OAuth2 로그인 처리 중 오류 발생", e);
            throw new OAuth2AuthenticationException("OAuth2 로그인 처리 실패: " + e.getMessage());
        }
    }

    /**
     * 제공자별 사용자 정보 추출
     */
    private OAuth2UserInfo getOAuth2UserInfo(String registrationId, Map<String, Object> attributes) {
        switch (registrationId.toLowerCase()) {
            case "google":
                return new GoogleOAuth2UserInfo(attributes);
            case "naver":
                // Naver는 response 안에 실제 사용자 정보가 있음
                @SuppressWarnings("unchecked")
                Map<String, Object> response = (Map<String, Object>) attributes.get("response");
                return new NaverOAuth2UserInfo(response);
            case "kakao":
                return new KakaoOAuth2UserInfo(attributes);
            default:
                throw new OAuth2AuthenticationException("지원하지 않는 OAuth2 제공자입니다: " + registrationId);
        }
    }

    /**
     * 사용자 저장 또는 업데이트
     */
    private User saveOrUpdate(OAuth2UserInfo oAuth2UserInfo) {
        log.info("사용자 저장/업데이트 시작 - Provider: {}, ProviderId: {}, Email: {}", 
                oAuth2UserInfo.getProvider(), 
                oAuth2UserInfo.getProviderId(), 
                oAuth2UserInfo.getEmail());

        // 이메일이 null일 경우 providerId 기반 임시 이메일 생성 (카카오 등)
        String email = oAuth2UserInfo.getEmail();
        if (email == null || email.isBlank()) {
            email = oAuth2UserInfo.getProvider() + "_" + oAuth2UserInfo.getProviderId() + "@mystockfolio.local";
            log.warn("OAuth2 제공자가 이메일을 제공하지 않음. 임시 이메일 생성: {}", email);
        }

        // 1단계: provider와 providerId로 기존 사용자 찾기
        User user = userRepository.findByProviderAndProviderId(
                oAuth2UserInfo.getProvider(),
                oAuth2UserInfo.getProviderId()
        ).orElse(null);

        if (user != null) {
            // OAuth2로 이미 가입한 사용자 - 닉네임만 업데이트
            user.updateNickname(oAuth2UserInfo.getName());
            log.info("기존 OAuth2 사용자 정보 업데이트: {}", user.getEmail());
        } else {
            // 2단계: email로 기존 사용자 찾기 (일반 회원가입 사용자가 OAuth2 로그인 시도)
            // 단, 임시 이메일이 아닌 경우에만 검색
            if (!email.endsWith("@mystockfolio.local")) {
                user = userRepository.findByEmail(email).orElse(null);
            }
            
            if (user != null) {
                // 기존 일반 회원가입 사용자 → OAuth2 정보 추가
                user.updateProvider(oAuth2UserInfo.getProvider(), oAuth2UserInfo.getProviderId());
                user.updateNickname(oAuth2UserInfo.getName());
                log.info("기존 일반 회원가입 사용자에게 OAuth2 정보 추가: {} → Provider: {}", 
                        user.getEmail(), oAuth2UserInfo.getProvider());
            } else {
                // 3단계: 완전히 새로운 사용자 - OAuth2 회원가입 (추가 정보 입력 필요)
                user = User.builder()
                        .email(email)
                        .nickname(oAuth2UserInfo.getName())
                        .provider(oAuth2UserInfo.getProvider())
                        .providerId(oAuth2UserInfo.getProviderId())
                        .password(null) // OAuth2 로그인은 비밀번호 불필요
                        .isOauth2Signup(true) // OAuth2 회원가입 플래그 설정
                        .build();
                log.info("신규 OAuth2 사용자 등록 (추가 정보 입력 필요): {} ({})", user.getEmail(), oAuth2UserInfo.getProvider());
            }
        }

        User savedUser = userRepository.save(user);
        log.info("사용자 저장 완료 - ID: {}, Email: {}, Provider: {}, ProviderId: {}", 
                savedUser.getUserId(), savedUser.getEmail(), savedUser.getProvider(), savedUser.getProviderId());
        return savedUser;
    }
}

