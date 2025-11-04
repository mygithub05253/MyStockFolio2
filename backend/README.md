# Backend - Spring Boot REST API 서버

Spring Boot 3.5.7 기반의 RESTful API 서버 및 API Gateway

## 기술 스택

### Core Framework
- **Spring Boot 3.5.7**: 자바 기반 웹 애플리케이션 프레임워크
- **Spring Framework**: 의존성 주입 및 제어 역전 컨테이너

### 보안
- **Spring Security 6.x**: 인증 및 인가
- **JWT (JSON Web Token)**: 토큰 기반 인증
  - `io.jsonwebtoken:jjwt-api:0.12.3`
  - `io.jsonwebtoken:jjwt-impl:0.12.3`
  - `io.jsonwebtoken:jjwt-jackson:0.12.3`
- **Spring OAuth2 Client**: 소셜 로그인 통합
  - Google OAuth2
  - Naver OAuth2
  - Kakao OAuth2

### 데이터베이스
- **Spring Data JPA**: ORM 및 데이터 접근 추상화
- **Hibernate**: JPA 구현체
- **MySQL Connector/J**: MySQL 8.x 드라이버
- **MySQL 8.x**: 관계형 데이터베이스

### 비동기 통신
- **Spring WebFlux**: 반응형 프로그래밍
- **Project Reactor**: Mono/Flux 기반 비동기 처리
- **WebClient**: HTTP 클라이언트 (FastAPI 통신)
  - 타임아웃 설정: 연결 3초, 응답 5초 (일반)
  - 분석 서비스: 연결 5초, 응답 30초

### 블록체인 통합
- **WebClient**: Reactor 기반 비동기 HTTP 클라이언트
  - blockchain-api (Node.js) 서비스 통신
  - ERC-20 토큰 리워드 민팅
  - ERC-721 NFT 발행
  - 트랜잭션 상세 정보 조회

### 캐싱
- **Spring Data Redis**: Redis 통합
  - 가격 캐싱 (MarketPriceCacheService)
  - 세션 공유 (향후 확장)

### 빌드 도구
- **Gradle**: 빌드 및 의존성 관리
- **Lombok**: 보일러플레이트 코드 자동 생성

### 유효성 검사
- **Spring Validation**: `@Valid`, `@NotBlank`, `@Email` 등

## 설치 및 실행

### 사전 요구사항
- **Java** 17 이상
- **Gradle** 7.x 이상 (또는 Gradle Wrapper 사용)
- **MySQL** 8.x 실행 중

### 데이터베이스 설정

1. MySQL 데이터베이스 생성:
```sql
CREATE DATABASE mystockfolio_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. `application.properties` 설정 (또는 `application.properties.example` 복사):
```bash
cd backend
cp application.properties.example application.properties
```

3. `application.properties` 수정:
```properties
# 데이터베이스 연결
spring.datasource.url=jdbc:mysql://localhost:3306/mystockfolio_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul
spring.datasource.username=root
spring.datasource.password=your_password

# JWT 설정
jwt.secret=your_very_long_and_secure_secret_key
jwt.expiration-ms=3600000  # 1시간

# FastAPI 서비스 URL
market.data.url=http://127.0.0.1:8001
analytics.data.url=http://127.0.0.1:8003

# OAuth2 설정 (선택사항)
spring.security.oauth2.client.registration.google.client-id=your_google_client_id
spring.security.oauth2.client.registration.google.client-secret=your_google_client_secret
spring.security.oauth2.client.registration.naver.client-id=your_naver_client_id
spring.security.oauth2.client.registration.naver.client-secret=your_naver_client_secret
spring.security.oauth2.client.registration.kakao.client-id=your_kakao_client_id
spring.security.oauth2.client.registration.kakao.client-secret=your_kakao_client_secret
```

### 실행

```bash
cd backend
./gradlew bootRun
# 또는 Windows
gradlew.bat bootRun
```

서버: http://localhost:8080

## 프로젝트 구조

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/mystockfolio/backend/
│   │   │   ├── BackendApplication.java     # 메인 클래스
│   │   │   ├── config/                     # 설정 클래스
│   │   │   │   ├── SecurityConfig.java    # Spring Security 설정
│   │   │   │   ├── JwtAuthenticationFilter.java  # JWT 필터
│   │   │   │   ├── WebClientConfig.java   # WebClient 빌더 설정
│   │   │   │   ├── AnalyticsWebClientConfig.java  # 분석 서비스 WebClient
│   │   │   │   ├── RedisConfig.java       # Redis 설정
│   │   │   │   └── oauth2/                # OAuth2 설정
│   │   │   │       ├── OAuth2SuccessHandler.java
│   │   │   │       └── ...
│   │   │   ├── controller/                 # REST 컨트롤러
│   │   │   │   ├── AuthController.java    # 인증 API
│   │   │   │   ├── UserController.java    # 사용자 프로필 API
│   │   │   │   ├── PortfolioController.java  # 포트폴리오 API
│   │   │   │   ├── AssetController.java   # 자산 API
│   │   │   │   ├── DashboardController.java  # 대시보드 API
│   │   │   │   ├── MarketController.java  # 시장 데이터 프록시
│   │   │   │   ├── WatchlistController.java  # 관심종목 API
│   │   │   │   └── HealthController.java  # 헬스체크
│   │   │   ├── service/                    # 비즈니스 로직
│   │   │   │   ├── AuthService.java       # 일반 로그인/회원가입
│   │   │   │   ├── MetaMaskService.java   # MetaMask 인증
│   │   │   │   ├── UserService.java       # 사용자 프로필 관리
│   │   │   │   ├── PortfolioService.java  # 포트폴리오 관리
│   │   │   │   ├── AssetService.java      # 자산 관리
│   │   │   │   ├── DashboardService.java  # 대시보드 통계
│   │   │   │   ├── WatchlistService.java  # 관심종목 관리
│   │   │   │   └── MarketPriceCacheService.java  # 가격 캐싱
│   │   │   ├── client/                     # 외부 서비스 클라이언트
│   │   │   │   ├── MarketDataClient.java  # FastAPI 마켓 데이터 클라이언트
│   │   │   │   └── AnalyticsClient.java   # FastAPI 분석 서비스 클라이언트
│   │   │   ├── domain/entity/             # JPA 엔티티
│   │   │   │   ├── User.java              # 사용자
│   │   │   │   ├── Portfolio.java         # 포트폴리오
│   │   │   │   ├── Asset.java            # 자산
│   │   │   │   ├── AssetType.java        # 자산 타입 Enum
│   │   │   │   └── Watchlist.java        # 관심종목
│   │   │   ├── repository/                # JPA 리포지토리
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── PortfolioRepository.java
│   │   │   │   ├── AssetRepository.java
│   │   │   │   └── WatchlistRepository.java
│   │   │   ├── dto/                       # Data Transfer Objects
│   │   │   │   ├── AuthDto.java          # 인증 DTO
│   │   │   │   ├── UserDto.java          # 사용자 DTO
│   │   │   │   ├── PortfolioDto.java     # 포트폴리오 DTO
│   │   │   │   ├── AssetDto.java         # 자산 DTO
│   │   │   │   ├── DashboardDto.java     # 대시보드 DTO
│   │   │   │   ├── MarketDataDto.java    # 시장 데이터 DTO
│   │   │   │   ├── MetaMaskDto.java      # MetaMask DTO
│   │   │   │   └── WatchlistDto.java     # 관심종목 DTO
│   │   │   ├── util/                      # 유틸리티
│   │   │   │   └── JwtTokenProvider.java  # JWT 토큰 생성/검증
│   │   │   └── exception/                # 예외 처리
│   │   │       ├── GlobalExceptionHandler.java  # 전역 예외 핸들러
│   │   │       ├── InvalidCredentialsException.java
│   │   │       ├── DuplicateResourceException.java
│   │   │       ├── ResourceNotFoundException.java
│   │   │       ├── ForbiddenException.java
│   │   │       └── UnauthorizedException.java
│   │   └── resources/
│   │       └── application.properties     # 설정 파일
│   └── test/                              # 테스트 코드
└── build.gradle                           # Gradle 빌드 설정
```

## 주요 API 엔드포인트

### 인증 (Auth) - `/api/auth`

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| POST | `/api/auth/register` | 회원가입 (이메일 + 비밀번호) | ❌ |
| POST | `/api/auth/login` | 로그인 (이메일 + 비밀번호) | ❌ |
| GET | `/api/auth/metamask/nonce` | MetaMask 논스 발급 | ❌ |
| POST | `/api/auth/metamask/nonce` | MetaMask 논스 발급 (지갑 주소 포함) | ❌ |
| POST | `/api/auth/metamask` | MetaMask 인증 (AuthRequest) | ❌ |
| POST | `/api/auth/metamask/verify` | MetaMask 서명 검증 및 인증 | ❌ |
| POST | `/api/auth/oauth2/complete` | OAuth2 회원가입 완료 | ❌ |
| GET | `/oauth2/authorization/{provider}` | OAuth2 소셜 로그인 리다이렉트 | ❌ |

**Provider**: `google`, `naver`, `kakao`

### 사용자 프로필 (User) - `/api/user`

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| GET | `/api/user/profile` | 프로필 조회 | ✅ |
| PUT | `/api/user/profile` | 프로필 업데이트 (닉네임, 지갑 주소) | ✅ |
| DELETE | `/api/user/profile` | 계정 삭제 | ✅ |

**주의**: 소셜 로그인 사용자는 비밀번호 확인 없이 삭제 가능

### 포트폴리오 (Portfolio) - `/api/portfolios`

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| GET | `/api/portfolios` | 사용자 포트폴리오 목록 | ✅ |
| GET | `/api/portfolios/{id}` | 포트폴리오 상세 (자산 포함) | ✅ |
| POST | `/api/portfolios` | 포트폴리오 생성 | ✅ |
| PUT | `/api/portfolios/{id}` | 포트폴리오 이름 수정 | ✅ |
| DELETE | `/api/portfolios/{id}` | 포트폴리오 삭제 | ✅ |

### 자산 (Asset) - `/api/portfolios/{portfolioId}/assets`

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| GET | `/api/portfolios/{portfolioId}/assets` | 자산 목록 | ✅ |
| POST | `/api/portfolios/{portfolioId}/assets` | 자산 추가 | ✅ |
| PUT | `/api/portfolios/{portfolioId}/assets/{assetId}` | 자산 수정 | ✅ |
| DELETE | `/api/portfolios/{portfolioId}/assets/{assetId}` | 자산 삭제 | ✅ |

### 대시보드 (Dashboard) - `/api/dashboard`

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| GET | `/api/dashboard/stats` | 포트폴리오 통계 | ✅ |
| GET | `/api/dashboard/heatmap` | 히트맵 분석 | ✅ |
| GET | `/api/dashboard/risk` | 위험 지표 (동기) | ✅ |
| POST | `/api/dashboard/risk/start` | 위험 지표 계산 시작 (비동기) | ✅ |
| GET | `/api/dashboard/risk/result/{jobId}` | 위험 지표 결과 조회 | ✅ |

### 시장 데이터 (Market) - `/api/market`

FastAPI 서비스를 프록시하는 엔드포인트:

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| GET | `/api/market/quote?ticker=AAPL` | 상세 시세 | ❌ |
| GET | `/api/market/chart?ticker=AAPL&period=1mo` | 차트 데이터 | ❌ |
| GET | `/api/market/popular` | 인기 종목 | ❌ |
| GET | `/api/market/top?category=gainers` | Top Movers | ❌ |
| GET | `/api/market/indices` | 시장 지수 | ❌ |
| GET | `/api/market/suggest?q=AAPL` | 종목 검색 | ❌ |
| GET | `/api/market/health` | 헬스체크 | ❌ |

### 관심종목 (Watchlist) - `/api/watchlist`

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| GET | `/api/watchlist` | 관심종목 목록 | ✅ |
| POST | `/api/watchlist` | 관심종목 추가 | ✅ |
| DELETE | `/api/watchlist/{id}` | 관심종목 삭제 | ✅ |

### 블록체인 (Blockchain) - `/api/blockchain`

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| GET | `/api/blockchain/token/balance` | 토큰 잔액 조회 | ✅ |
| GET | `/api/blockchain/nft/owned?address=0x...` | 소유 NFT 목록 조회 | ✅ |
| GET | `/api/blockchain/transaction/{txHash}` | 트랜잭션 상세 정보 조회 | ✅ |
| POST | `/api/blockchain/nft/test-mint` | NFT 강제 발행 (데모용) | ✅ |
| GET | `/api/blockchain/rewards/history` | 리워드 히스토리 조회 | ✅ |
| GET | `/api/blockchain/achievements/history` | NFT 성과 이력 조회 | ✅ |

### 헬스체크 - `/api/health`

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| GET | `/api/health/redis` | Redis 연결 상태 | ❌ |

## 데이터베이스 스키마

### users 테이블
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),  -- OAuth2 사용자는 NULL
    nickname VARCHAR(50),
    wallet_address VARCHAR(42),  -- Ethereum 지갑 주소
    provider VARCHAR(50) NOT NULL DEFAULT 'mystockfolio',
    provider_id VARCHAR(255),  -- OAuth2 제공자 고유 ID
    is_oauth2_signup BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME
);
```

**Provider 값**:
- `mystockfolio`: 일반 회원가입
- `google`: Google OAuth2
- `naver`: Naver OAuth2
- `kakao`: Kakao OAuth2
- `metamask`: MetaMask 지갑

### portfolios 테이블
```sql
CREATE TABLE portfolios (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### assets 테이블
```sql
CREATE TABLE assets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    portfolio_id BIGINT NOT NULL,
    asset_type VARCHAR(20) NOT NULL,  -- STOCK, COIN, BOND, ETF
    ticker VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    quantity DECIMAL(18, 8) NOT NULL,
    avg_buy_price DECIMAL(18, 8) NOT NULL,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);
```

**AssetType Enum**: `STOCK`, `COIN`, `BOND`, `ETF`, `BLOCKCHAIN`

### watchlist 테이블
```sql
CREATE TABLE watchlist (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20),  -- STOCK, COIN, BOND, ETF
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 외부 서비스 통합

### FastAPI 서비스
- **Market Data Service** (`market-data-svc`)
  - URL: `http://127.0.0.1:8001` (설정 가능)
  - WebClient 타임아웃: 연결 3초, 응답 5초
  - 기능: 실시간 시세, 차트, 인기 종목, Top Movers, 종목 검색
  
- **Analytics Service** (`analytics-svc`)
  - URL: `http://127.0.0.1:8003` (설정 가능)
  - WebClient 타임아웃: 연결 5초, 응답 30초
  - 기능: 히트맵 생성, 위험 지표 계산

### Yahoo Finance API
- **yfinance 라이브러리** (FastAPI 서비스에서 사용)
- 실시간 시세, 차트 데이터, 시장 지수
- 지원 티커: 미국 주식, 한국 주식 (`.KS`, `.KQ`), 코인, 채권, ETF

### OAuth2 제공자
- **Google OAuth2**: `https://accounts.google.com`
- **Naver OAuth2**: `https://nid.naver.com`
- **Kakao OAuth2**: `https://kauth.kakao.com`

### MetaMask (Web3)
- **Ethereum JSON-RPC**: 브라우저 `window.ethereum` API
- **서명 검증**: Web3j 라이브러리 사용
- **네트워크**: 향후 Sepolia 테스트넷 또는 메인넷 연동 예정 (P3)

## 보안 설정

### JWT 토큰
- **시크릿 키**: `application.properties`의 `jwt.secret`
- **만료 시간**: 기본 1시간 (`jwt.expiration-ms`)
- **알고리즘**: HS256
- **저장 위치**: 프론트엔드 `sessionStorage`

### Spring Security
- **인증 방식**: JWT 기반 Stateless 인증
- **CORS**: `http://localhost:3000`, `http://127.0.0.1:3000` 허용
- **인증 필요 경로**: `/api/**` (인증 제외: `/api/auth/**`, `/api/market/**`, `/api/health/**`)
- **사용자 데이터 접근 제어**: 모든 API에서 소유권 검증

### 비밀번호 암호화
- **BCrypt**: Spring Security `PasswordEncoder`
- **일반 회원가입**: 비밀번호 해시 저장
- **OAuth2/MetaMask**: 비밀번호 없음

## 성능 최적화

### 병렬 가격 조회
- `DashboardService.fetchPricesInParallel()`: 여러 자산 가격을 병렬로 조회
- Project Reactor `Flux.merge()` 사용
- 타임아웃: 4초 (개별 요청 3초)

### 가격 캐싱
- `MarketPriceCacheService`: Redis 기반 가격 캐싱
- 캐시 TTL: 60초
- 중복 API 호출 방지

### 비동기 처리
- WebClient 사용으로 논블로킹 I/O
- FastAPI 서비스 호출 시 타임아웃 설정
- 위험 지표 계산: 백그라운드 작업 (FastAPI `BackgroundTasks`)

## 빌드 및 배포

### 빌드

```bash
./gradlew build
```

빌드 파일: `backend/build/libs/backend-0.0.1-SNAPSHOT.jar`

### 실행 (JAR 파일)

```bash
java -jar build/libs/backend-0.0.1-SNAPSHOT.jar
```

### 테스트

```bash
./gradlew test
```

## 설정 파일 예시

### application.properties.example

```properties
# 애플리케이션 이름
spring.application.name=backend

# 데이터베이스 연결
spring.datasource.url=jdbc:mysql://localhost:3306/mystockfolio_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul
spring.datasource.username=root
spring.datasource.password=${DB_PASSWORD:your-password-here}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA 설정
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# 서버 포트
server.port=8080

# JWT 설정
jwt.secret=${JWT_SECRET:yourVerySecretKeyWhichShouldBeLongAndSecure}
jwt.expiration-ms=3600000

# FastAPI 서비스 URL
market.data.url=http://127.0.0.1:8001
analytics.data.url=http://127.0.0.1:8003

# Redis 설정 (선택사항)
redis.host=${REDIS_HOST:127.0.0.1}
redis.port=${REDIS_PORT:6379}

# OAuth2 설정
spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}
spring.security.oauth2.client.registration.google.scope=profile,email
spring.security.oauth2.client.registration.google.redirect-uri=http://localhost:8080/login/oauth2/code/google

spring.security.oauth2.client.registration.naver.client-id=${NAVER_CLIENT_ID}
spring.security.oauth2.client.registration.naver.client-secret=${NAVER_CLIENT_SECRET}
spring.security.oauth2.client.registration.naver.scope=name,email
spring.security.oauth2.client.registration.naver.redirect-uri=http://localhost:8080/login/oauth2/code/naver

spring.security.oauth2.client.registration.kakao.client-id=${KAKAO_CLIENT_ID}
spring.security.oauth2.client.registration.kakao.client-secret=${KAKAO_CLIENT_SECRET}
spring.security.oauth2.client.registration.kakao.scope=profile_nickname,account_email
spring.security.oauth2.client.registration.kakao.redirect-uri=http://localhost:8080/login/oauth2/code/kakao
```

## 트러블슈팅

### MySQL 연결 오류
- MySQL 서버 실행 상태 확인
- `application.properties`의 DB 정보 확인
- `allowPublicKeyRetrieval=true` 설정 확인

### FastAPI 연결 오류
- FastAPI 서버 실행 확인 (포트 8001, 8003)
- `market.data.url`, `analytics.data.url` 설정 확인
- 네트워크 방화벽 확인

### JWT 토큰 오류
- `jwt.secret` 설정 확인 (최소 32자 권장)
- 토큰 만료 시간 확인

### OAuth2 오류
- 클라이언트 ID/Secret 확인
- 리다이렉트 URI 일치 확인
- OAuth2 콜백 URL 확인 (`/login/oauth2/code/{provider}`)

## 구현된 주요 기능

### 블록체인 통합 (완료)
- **ERC-20 FolioToken 리워드 시스템**: 활동 기반 토큰 민팅
  - 자산 추가 시 리워드 (`asset_added`)
  - 포트폴리오 수정 시 리워드 (`portfolio_updated`)
  - 대시보드 분석 시 리워드 (`dashboard_analysis`, 일일 1회 제한)
  - 포트폴리오 균형 점수 기반 동적 보상 (10~20 FOLIO)
  - 리워드 이력 DB 저장 (중복 보상 방지)
- **ERC-721 NFT 인증서 발행**: 포트폴리오 성과 달성 시 NFT 발행
  - 90일 포트폴리오 유지 달성
  - 수익률 달성 (10%, 20%, 50%, 100%)
  - IPFS 메타데이터 저장 (Pinata/Infura)
  - NFT 발행 이력 DB 저장 (중복 발행 방지)
  - 성과 달성 자동 감지 (`AchievementDetectionService`)
- **블록체인 API 통합**: `BlockchainClient`를 통한 Node.js 블록체인 API 호출
  - 토큰 잔액 조회
  - NFT 목록 조회
  - 트랜잭션 상세 정보 조회

### 포트폴리오 분석 기능
- **히트맵 분석**: 자산군/섹터별 포트폴리오 성과 시각화
- **위험 지표 계산**: 변동성, MDD, 베타, 샤프 비율
  - 비동기 폴링 방식 (FastAPI BackgroundTasks)
  - 최대 30초 대기

### 데이터 통합
- **FastAPI 마켓 데이터 서비스**: 실시간 시세, 차트, 인기 종목
- **FastAPI 분석 서비스**: 히트맵 생성, 위험 지표 계산
- **WebClient 비동기 통신**: Reactor Mono/Flux 기반

## 블록체인 통합 플로우

### 사용자 유형별 처리

#### 1. 일반 로그인 사용자 (이메일/비밀번호)

**초기 상태**:
- `walletAddress: null` (또는 "")

**블록체인 사용 희망 시**:
1. MyPage로 이동
2. "지갑 주소 수정" 버튼 클릭
3. 지갑 주소 입력 후 저장
4. 이후 리워드 자동 민팅

#### 2. OAuth2 소셜 로그인 사용자 (Google, Naver, Kakao)

**초기 상태**:
- `walletAddress: null`

**블록체인 사용 희망 시**:
- 일반 로그인 사용자와 동일한 프로세스
- MyPage에서 지갑 주소 등록

### 리워드 민팅 프로세스

#### 자산 추가 시 리워드

**백엔드 로직** (`AssetService.createAsset`):
```java
// 1. 자산 저장 성공 후
if (user.getWalletAddress() != null && !user.getWalletAddress().isEmpty()) {
    // 2. 리워드 민팅 시도 (비동기)
    rewardService.mintActivityReward(userId, walletAddress, "asset_added", portfolios)
        .subscribe(
            success -> log.info("리워드 민팅 완료"),
            error -> log.warn("리워드 민팅 실패 (자산 추가는 성공)")
        );
} else {
    // 3. 지갑 주소 없음 → 조용히 무시
    log.debug("지갑 주소 미등록 사용자");
}
```

**특징**:
- ✅ 비동기 처리: 리워드 민팅 실패해도 자산 추가는 성공
- ✅ 지갑 주소 없으면 조용히 무시 (에러 없음)
- ✅ 지갑 주소 있으면 자동으로 FOLIO 토큰 민팅

#### 리워드 활동 유형

- `asset_added`: 자산 추가 시
- `portfolio_updated`: 포트폴리오 수정 시
- `dashboard_analysis`: 대시보드 분석 시 (일일 1회 제한)

### NFT 성과 발행 프로세스

#### 성과 달성 조건

- **90일 포트폴리오 유지**: 포트폴리오 생성 후 90일 경과
- **수익률 달성**: 
  - `return_rate_10percent`: 10% 수익률 달성
  - `return_rate_20percent`: 20% 수익률 달성
  - `return_rate_50percent`: 50% 수익률 달성
  - `return_rate_100percent`: 100% 수익률 달성

#### 자동 감지 로직

`AchievementDetectionService`가 다음 시점에 자동으로 감지:
- 자산 추가/수정 후
- 대시보드 분석 시
- 포트폴리오 수정 시

### 주의사항

#### 1. 지갑 주소 형식

**유효한 형식**:
- `0x`로 시작
- 42자리 (0x 포함)
- 예: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

#### 2. 에러 핸들링

**안전한 처리**:
- 지갑 주소 없으면: 조용히 무시 (기능은 정상 동작)
- 민팅 실패하면: 로그만 남기고 계속 진행
- 블록체인 API 미연결: UI 숨김, 기능은 정상 동작

#### 3. 데이터베이스 스키마

**User 테이블**:
- `wallet_address VARCHAR(42)`: NULL 허용
- 하나의 계정은 하나의 지갑만 연결
- 하나의 지갑은 여러 계정에 연결 가능 (UNIQUE 제약 없음)

### 핵심 원칙

1. **옵션 기능**: 블록체인 리워드는 추가 기능, 필수 아님
2. **안전한 처리**: 리워드 실패해도 핵심 기능은 정상 동작
3. **유연한 등록**: 언제든지 MyPage에서 지갑 주소 등록/수정 가능
4. **명확한 안내**: 지갑 미등록 사용자에게 안내 카드 표시
