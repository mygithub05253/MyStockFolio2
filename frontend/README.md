# Frontend - React 프론트엔드

React 18.x 기반의 모바일 우선 반응형 웹 애플리케이션

## 기술 스택

### Core Framework
- **React 18.x**: 컴포넌트 기반 UI 라이브러리
- **React Router v7.9.4**: 클라이언트 사이드 라우팅
- **Redux Toolkit**: 전역 상태 관리
  - `@reduxjs/toolkit`: Redux 모듈 (user, portfolio, dashboard, todo)
  - `react-redux`: React와 Redux 연결
  - `@redux-devtools/extension`: Redux DevTools 통합

### UI/UX 라이브러리
- **TailwindCSS 3.4.18**: 유틸리티 기반 CSS 프레임워크
  - 모바일 우선 반응형 디자인 (max-w-md)
  - 커스텀 색상 팔레트 (indigo, purple, gray, red, green)
- **Chart.js 4.5.1**: 데이터 시각화
  - `react-chartjs-2`: React 래퍼
  - 사용 차트: Pie Chart (자산 배분), Line Chart (가격 추이)
- **React Icons 5.5.0**: 아이콘 라이브러리 (Font Awesome 기반)
  - `react-icons/fi`: Feather Icons 사용
- **react-hook-form 7.65.0**: 폼 관리 (선택적 사용)

### HTTP 통신
- **Axios 1.12.2**: HTTP 클라이언트
  - `axiosInstance.js`: 인터셉터 설정 (JWT 토큰 자동 추가)
  - 백엔드 API 통신 (`http://localhost:8080`)
  - 타임아웃 설정: 30초

### 블록체인 통합
- **Ethers.js 6.15.0**: Ethereum 블록체인 상호작용
  - MetaMask 지갑 연동
  - Web3 트랜잭션 처리 (향후 P3에서 사용 예정)

### 빌드 도구
- **react-scripts 5.0.1**: Create React App 기반
- **PostCSS 8.5.6**: CSS 후처리
- **Autoprefixer 10.4.21**: 브라우저 호환성 CSS 자동 추가

### 테스팅
- **@testing-library/react 16.3.0**: React 컴포넌트 테스트
- **@testing-library/jest-dom 6.9.1**: DOM 매처
- **@testing-library/user-event 13.5.0**: 사용자 이벤트 시뮬레이션

## 설치 및 실행

### 사전 요구사항
- **Node.js** 18.x 이상
- **npm** 또는 **yarn**

### 설치

```bash
cd frontend
npm install
```

### 실행

```bash
npm start
```

서버: http://localhost:3000

### 빌드

```bash
npm run build
```

빌드 파일: `frontend/build/`

### 테스트

```bash
npm test
```

## 프로젝트 구조

```
frontend/
├── public/                 # 정적 파일
│   ├── images/            # 이미지 리소스
│   ├── index.html         # HTML 템플릿
│   └── manifest.json      # PWA 매니페스트
├── src/
│   ├── api/               # API 통신
│   │   └── axiosInstance.js  # Axios 인스턴스 (JWT 인터셉터)
│   ├── assets/            # 에셋 파일
│   │   └── images/        # 로고, 아이콘 등
│   ├── components/        # 재사용 컴포넌트
│   │   ├── button/        # BasicButton
│   │   ├── layout/        # Header, Footer, MainContent
│   │   ├── market/        # MarketIndices, TickerSearch
│   │   └── modal/         # AssetDetailModal
│   ├── hooks/             # 커스텀 훅
│   │   └── useInput.js    # 입력 필드 관리
│   ├── modules/           # Redux 모듈
│   │   ├── user.js        # 사용자 상태 (로그인/로그아웃)
│   │   ├── portfolio.js    # 포트폴리오 상태
│   │   ├── dashboard.js    # 대시보드 통계
│   │   └── todo.js        # TODO (미사용)
│   ├── pages/             # 페이지 컴포넌트
│   │   ├── auth/          # 인증 페이지
│   │   │   ├── MetaMaskSignUp.jsx    # MetaMask 회원가입
│   │   │   ├── OAuth2Callback.jsx    # OAuth2 콜백
│   │   │   └── OAuth2SignUp.jsx      # OAuth2 회원가입 완료
│   │   ├── dashboard/     # 대시보드
│   │   │   └── Dashboard.jsx
│   │   ├── market/        # 시장 탐색
│   │   │   └── Market.jsx
│   │   ├── myPage/        # 마이페이지
│   │   │   └── MyPage.jsx
│   │   ├── portfolio/     # 포트폴리오
│   │   │   ├── PortfolioContainer.jsx
│   │   │   ├── AssetItem.jsx
│   │   │   └── AssetInsert.jsx
│   │   ├── signIn/        # 로그인
│   │   │   └── SignIn.jsx
│   │   ├── signUp/        # 회원가입
│   │   │   └── SignUp.jsx
│   │   └── layout/        # 레이아웃 컴포넌트
│   │       ├── Layout.jsx
│   │       └── AdminLayout.jsx
│   ├── routes/            # 라우팅 설정
│   │   └── router.js      # React Router 설정
│   ├── store.js           # Redux 스토어 설정
│   ├── App.jsx            # 메인 앱 컴포넌트
│   └── index.js           # 진입점
├── package.json
├── tailwind.config.js     # TailwindCSS 설정
└── postcss.config.js      # PostCSS 설정
```

## 주요 기능

### 인증 시스템
- **일반 로그인**: 이메일 + 비밀번호
- **OAuth2 소셜 로그인**: Google, Naver, Kakao
  - Spring Security OAuth2 Client 연동
  - 콜백 처리 및 회원가입 완료 플로우
- **MetaMask 로그인**: 지갑 기반 인증
  - `window.ethereum` API 사용
  - 서명 검증 및 JWT 토큰 발급
- **JWT 토큰 관리**: `sessionStorage`에 저장
  - 자동 토큰 갱신 (App.jsx에서 초기화)
  - axios 인터셉터로 요청마다 자동 추가

### 포트폴리오 관리
- **포트폴리오 CRUD**: 생성, 조회, 수정, 삭제
- **자산 관리**: 
  - 추가 (AssetInsert)
  - 수정 (AssetDetailModal)
  - 삭제 (AssetItem)
  - 실시간 가격 조회
- **낙관적 업데이트**: UI 먼저 업데이트 후 서버 동기화

### 대시보드
- **포트폴리오 통계**:
  - 총 시장 가치
  - 총 수익률 (Total Return Rate)
  - 손익 (Gain/Loss)
  - 자산 배분 (Pie Chart)
  - 자산별 수익률 (Asset Returns)
- **시장 지수**: NASDAQ, Dow, S&P 500, KOSPI
- **Top Movers 미리보기**: 상승/하락 종목
- **히트맵 분석**: 섹터별 포트폴리오 성과 (컬러 히트맵)
- **위험 지표**: 변동성, MDD, 베타, 샤프 비율
  - 비동기 폴링 방식 (1초 간격)
  - 최대 30초 대기

### 시장 탐색
- **실시간 시세**: 5초 간격 자동 갱신
- **차트 데이터**: Chart.js Line Chart
  - 기간 선택: 1일, 5일, 1개월, 3개월, 6개월, 1년
- **종목 검색**: 자동완성 드롭다운
  - 티커 정확 매칭 (최우선)
  - 티커 부분 매칭
  - 종목명 매칭 (영문 + 한글)
  - 섹터/시장 정보 표시
- **카테고리 필터**: 전체/주식/코인/채권/ETF
- **Top Movers**: 상승, 하락, 거래량
- **인기 종목**: 주요 종목 리스트

### 마이페이지
- **프로필 관리**:
  - 닉네임 수정 (인라인 편집)
  - 지갑 주소 수정/등록/제거
  - 지갑 주소 복사 및 Etherscan 링크
- **계정 삭제**:
  - 일반 회원가입: 비밀번호 확인 필요
  - 소셜 로그인: 비밀번호 확인 불필요
  - 관련 포트폴리오 데이터 자동 삭제

### 헤더 메뉴
- **프로필 드롭다운**:
  - 사용자 정보 표시 (닉네임, 이메일)
  - 마이페이지 이동
  - 로그아웃

## 사용한 외부 API

### 백엔드 API (Spring Boot)
- **Base URL**: `http://localhost:8080`
- **인증**: JWT 토큰 (Authorization 헤더)

#### 인증 API
```
POST   /api/auth/register        # 회원가입
POST   /api/auth/login           # 로그인
GET    /api/auth/metamask/nonce  # MetaMask 논스 발급
POST   /api/auth/metamask/nonce  # MetaMask 논스 발급 (지갑 주소 포함)
POST   /api/auth/metamask/verify # MetaMask 서명 검증
POST   /api/auth/oauth2/complete  # OAuth2 회원가입 완료
GET    /oauth2/authorization/{provider}  # OAuth2 소셜 로그인 (Google, Naver, Kakao)
```

#### 포트폴리오 API
```
GET    /api/portfolios                    # 포트폴리오 목록
GET    /api/portfolios/{id}               # 포트폴리오 상세
POST   /api/portfolios                    # 포트폴리오 생성
PUT    /api/portfolios/{id}               # 포트폴리오 수정
DELETE /api/portfolios/{id}               # 포트폴리오 삭제
```

#### 자산 API
```
GET    /api/portfolios/{id}/assets          # 자산 목록
POST   /api/portfolios/{id}/assets          # 자산 추가
PUT    /api/portfolios/{id}/assets/{assetId} # 자산 수정
DELETE /api/portfolios/{id}/assets/{assetId} # 자산 삭제
```

#### 대시보드 API
```
GET    /api/dashboard/stats              # 포트폴리오 통계
GET    /api/dashboard/heatmap             # 히트맵 분석
GET    /api/dashboard/risk               # 위험 지표 (동기)
POST   /api/dashboard/risk/start         # 위험 지표 계산 시작 (비동기)
GET    /api/dashboard/risk/result/{jobId} # 위험 지표 결과 조회
```

#### 시장 데이터 API (백엔드 프록시)
```
GET    /api/market/quote       # 상세 시세
GET    /api/market/chart       # 차트 데이터
GET    /api/market/popular     # 인기 종목
GET    /api/market/top         # Top Movers
GET    /api/market/indices     # 시장 지수
GET    /api/market/suggest     # 종목 검색
GET    /api/market/health      # 헬스체크
```

#### 사용자 프로필 API
```
GET    /api/user/profile       # 프로필 조회
PUT    /api/user/profile       # 프로필 업데이트
DELETE /api/user/profile       # 계정 삭제
```

#### 관심종목 API
```
GET    /api/watchlist          # 관심종목 목록
POST   /api/watchlist          # 관심종목 추가
DELETE /api/watchlist/{id}     # 관심종목 삭제
```

### MetaMask API (브라우저 네이티브)
- **window.ethereum.request()**: Ethereum JSON-RPC 호출
  - `eth_requestAccounts`: 계정 연결
  - `personal_sign`: 메시지 서명

## 상태 관리 (Redux)

### User Module (`modules/user.js`)
```javascript
state = {
  isLoggedIn: boolean,
  userInfo: {
    userId: number,
    email: string,
    nickname: string,
    provider: string,      // 'mystockfolio', 'google', 'kakao', 'naver', 'metamask'
    walletAddress: string  // MetaMask 지갑 주소
  }
}
```

### Portfolio Module (`modules/portfolio.js`)
```javascript
state = {
  portfolios: Portfolio[],
  selectedPortfolioId: number | null,
  assetsByPortfolio: { [portfolioId]: Asset[] }
}
```

### Dashboard Module (`modules/dashboard.js`)
```javascript
state = {
  stats: PortfolioStatsResponse,
  isLoading: boolean,
  error: string | null
}
```

## 라우팅 구조

```
/                      # 메인 페이지 (Landing)
/signin                # 로그인
/signup                # 회원가입
/metamask/signup       # MetaMask 회원가입
/oauth2/callback      # OAuth2 콜백
/oauth2/signup         # OAuth2 회원가입 완료
/dashboard             # 대시보드 (인증 필요)
/portfolio             # 포트폴리오 (인증 필요)
/market                # 시장 탐색
/mypage                # 마이페이지 (인증 필요)
/rewards               # 리워드 (준비 중)
/*                     # 404 페이지
```

## 환경 변수 (선택사항)

`.env` 파일 생성 (프로젝트 루트에)

```env
REACT_APP_API_URL=http://localhost:8080
```

현재는 `package.json`의 `proxy` 설정으로 `http://localhost:8080` 자동 프록시

## 개발 가이드

### 컴포넌트 작성 가이드
- **함수형 컴포넌트**: Hooks 사용
- **상태 관리**: Redux (전역), useState (로컬)
- **스타일링**: TailwindCSS 유틸리티 클래스
- **모바일 우선**: `max-w-md` 컨테이너 사용

### API 호출 패턴
```javascript
// axiosInstance 사용
import axiosInstance from '../api/axiosInstance';

// GET 요청
const response = await axiosInstance.get('/api/portfolios');

// POST 요청
const response = await axiosInstance.post('/api/portfolios', { name: 'My Portfolio' });

// 에러 처리
try {
  const response = await axiosInstance.get('/api/portfolios');
} catch (err) {
  console.error('API 호출 실패:', err.response?.data?.error);
}
```

### Redux 액션 사용
```javascript
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess } from '../modules/user';

const dispatch = useDispatch();
const { userInfo } = useSelector(state => state.user);

dispatch(loginSuccess({ userId, email, nickname, provider }));
```

## 주의사항

1. **백엔드 서버 필요**: `http://localhost:8080` 실행 필수
2. **FastAPI 서버 필요**: 
   - `market-data-svc`: `http://127.0.0.1:8001`
   - `analytics-svc`: `http://127.0.0.1:8003`
3. **세션 스토리지**: `sessionStorage` 사용 (탭 닫으면 로그아웃)
4. **CORS**: 개발 환경에서 프록시 설정으로 해결
5. **MetaMask**: 브라우저 확장 프로그램 필요

## 트러블슈팅

### CORS 오류
- `package.json`의 `proxy` 설정 확인
- 백엔드 `SecurityConfig.java`의 CORS 설정 확인

### Redux 상태 초기화 문제
- 브라우저 새로고침 시 토큰 복원 확인 (`App.jsx`)

### API 호출 실패
- 백엔드 서버 실행 상태 확인
- 네트워크 탭에서 요청/응답 확인
- axios 인터셉터 로그 확인

## 구현된 주요 기능

### 블록체인 통합 (완료)
- **ERC-20 토큰 잔액 표시**: 대시보드에서 FolioToken 잔액 실시간 표시
  - `TokenBalanceCard` 컴포넌트
  - 자동 잔액 갱신 (폴링)
- **ERC-721 NFT 갤러리**: 포트폴리오 성과 NFT 표시
  - `NFTCarousel`, `NFTCard` 컴포넌트
  - IPFS 메타데이터 렌더링
  - data URI (base64) 메타데이터 지원
  - Etherscan 링크 제공
- **리워드 히스토리**: 활동 기반 리워드 이력 조회
  - `Rewards` 페이지
  - 트랜잭션 상세 정보 모달
  - Etherscan 링크 제공
- **NFT 테스트 발행**: 데모용 강제 NFT 발행 기능

### 실시간 데이터 업데이트
- **시장 데이터**: 5초 간격 자동 갱신
- **대시보드 통계**: 포트폴리오 가치 실시간 계산
- **차트 데이터**: Chart.js 기반 가격 추이 시각화
