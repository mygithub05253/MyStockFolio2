# MyStockFolio

**클라우드 네이티브 MSA와 ERC-20 블록체인을 결합한 자산 관리 플랫폼**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.7-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.x-teal.svg)](https://fastapi.tiangolo.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-orange.svg)](https://www.mysql.com/)

## 프로젝트 개요

MyStockFolio는 마이크로서비스 아키텍처(MSA)와 블록체인 기술(ERC-20)을 융합한 차세대 자산 관리 플랫폼입니다.

### 핵심 가치

- **통합 자산 관리**: 주식, 코인, 채권, ETF 등 모든 디지털 자산을 한 곳에서
- **다양한 인증**: 일반 로그인, OAuth2 소셜 로그인, 지갑 주소 등록 (블록체인 연동)
- **실시간 시장 데이터**: Yahoo Finance 기반 실시간 시세 및 차트
- **모바일 우선 UI**: TailwindCSS 기반 반응형 디자인
- **클라우드 네이티브**: 컨테이너 기반 MSA로 확장성과 유연성 극대화

## 빠른 시작

### 사전 요구사항

- **Node.js** 18.x 이상
- **Java** 17 이상
- **Python** 3.9 이상
- **MySQL** 8.x
- **Git**

### 서버 실행 방법

각 서비스를 개별적으로 실행해야 합니다:

1. **FastAPI 서버** (market-data-svc) - 시세 데이터
   ```bash
   cd market-data-svc
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
   ```
   - ⚠️ 주의: `python main.py`로 직접 실행하지 마세요. 패키지 구조를 사용하므로 uvicorn으로 실행해야 합니다.
   - API 문서: http://127.0.0.1:8001/docs

2. **Analytics 서버** (analytics-svc) - 포트폴리오 분석
   ```bash
   cd analytics-svc
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8003
   ```
   - 위험 지표 계산, 히트맵 생성 담당
   - API 문서: http://127.0.0.1:8003/docs

3. **Spring Boot 백엔드**
   ```bash
   cd backend
   ./gradlew bootRun  # Linux/Mac
   gradlew.bat bootRun  # Windows
   ```
   - API: http://127.0.0.1:8080

4. **Blockchain API 서버** (blockchain-api) - 블록체인 통합
   ```bash
   cd blockchain-api
   npm install  # 첫 실행 시에만
   npm run dev
   ```
   - API: http://localhost:8004
   - ⚠️ 주의: `.env` 파일 설정 필요 (RPC URL, Private Key, 컨트랙트 주소)

5. **React 프론트엔드**
   ```bash
   cd frontend
   npm start
   ```
   - URL: http://localhost:3000

### 실행 순서 권장

1. MySQL 데이터베이스 실행
2. FastAPI 서버 실행 (포트 8001) - 시세 데이터
3. Analytics 서버 실행 (포트 8003) - 분석 서비스
4. Blockchain API 서버 실행 (포트 8004) - 블록체인 통합
5. Spring Boot 백엔드 실행 (포트 8080)
6. React 프론트엔드 실행 (포트 3000)

### 추가 설정

각 서비스별 상세 설정은 다음 파일들을 참고하세요:
- `backend/README.md` - Spring Boot 백엔드 설정
- `frontend/README.md` - React 프론트엔드 설정
- `market-data-svc/README.md` - FastAPI 마켓 데이터 서비스 설정
- `analytics-svc/README.md` - FastAPI 분석 서비스 설정
- `blockchain-api/README.md` - Node.js 블록체인 API 서비스 설정

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    MyStockFolio Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   C1: FE    │  │   C2: BE    │  │   C3: MKT   │         │
│  │   React     │◄─┤ Spring Boot │◄─┤   FastAPI   │         │
│  │   Redux     │  │  Gateway    │  │ Market Data │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                  │
│         │                │                │                  │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌─────┴──────┐          │
│  │ C4: ANALYTICS│  │ C5: BC-API  │  │ C6: NOTIFY │          │
│  │   FastAPI   │  │  Node.js    │  │   Future   │          │
│  │   Analytics │  │ Ethers.js  │  │  Service   │          │
│  └─────────────┘  │   Web3.js   │  └─────────────┘          │
│                    │  Smart Contract│                        │
│                    │   IPFS        │                        │
│                    └───────────────┘                        │
│                                                               │
└───────────────────────────┬───────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │  MySQL 8.x     │
                    │  (Shared DB)   │
                    └────────────────┘
                            │
                    ┌───────┴────────┐
                    │ Ethereum      │
                    │ (Sepolia/     │
                    │  Mainnet)     │
                    └────────────────┘
```

## 주요 기능

### 인증
- 일반 로그인 (이메일 + 비밀번호)
- OAuth2 소셜 로그인 (Google, Naver, Kakao)
- 지갑 주소 등록 (MyPage에서 등록, 블록체인 리워드/NFT 사용)
- JWT 토큰 기반 세션 관리

### 포트폴리오 관리
- 포트폴리오 CRUD
- 자산 추가/수정/삭제
- 실시간 시장 가치 계산
- 자산 배분 분석 (차트)

### 시장 데이터
- 주요 시장 지수 (NASDAQ, Dow, S&P 500, KOSPI)
- 실시간 시세 조회
- 30일 차트 데이터
- 종목 검색 및 자동완성
- Top Movers (상승/하락/거래량)
- 카테고리 필터 (주식/코인/채권/ETF)

### 관심종목
- 관심종목 추가/삭제
- 포트폴리오 통합

## 상세 문서

각 컨테이너별 상세 설정 및 API 문서는 해당 폴더의 README.md를 참조하세요:

- **[Frontend README](frontend/README.md)** - React 프론트엔드 상세 가이드
- **[Backend README](backend/README.md)** - Spring Boot 백엔드 상세 가이드 (블록체인 통합 플로우 포함)
- **[Market Data Service README](market-data-svc/README.md)** - FastAPI 마켓 데이터 서비스 상세 가이드
- **[Analytics Service README](analytics-svc/README.md)** - FastAPI 분석 서비스 상세 가이드
- **[Blockchain API README](blockchain-api/README.md)** - Node.js 블록체인 API 서비스 상세 가이드 (로컬 테스트 환경 설정 포함)
- **[Crawler Service README](crawler-svc/README.md)** - 크롤링 서비스 가이드
- **[Docker Setup Guide](DOCKER_SETUP.md)** - Docker 컨테이너 배포 가이드

## 프로젝트 구조

```
MyStockFolio/
├── frontend/              # C1: React 프론트엔드
│   ├── src/
│   │   ├── api/          # API 통신
│   │   ├── components/   # 재사용 컴포넌트
│   │   ├── modules/      # Redux 모듈
│   │   └── pages/        # 페이지 컴포넌트
│   └── README.md
├── backend/               # C2: Spring Boot 백엔드
│   ├── src/
│   │   └── main/
│   │       ├── java/     # Java 소스
│   │       └── resources/ # 설정 파일
│   └── README.md
├── market-data-svc/       # C3: FastAPI 마켓 데이터
│   ├── app/
│   │   ├── models.py     # 데이터 모델
│   │   ├── service.py    # 비즈니스 로직
│   │   └── main.py       # FastAPI 앱
│   └── README.md
├── analytics-svc/         # C4: FastAPI 분석 서비스
│   ├── app/
│   │   ├── main.py       # FastAPI 앱
│   │   └── service.py    # 분석 로직
│   └── README.md
├── blockchain-api/        # C5: Node.js 블록체인 API
│   ├── src/
│   │   ├── routes/       # Express 라우터
│   │   ├── services/     # 비즈니스 로직
│   │   └── index.js      # Express 앱
│   ├── contracts/        # Solidity 스마트 컨트랙트
│   └── README.md
└── README.md             # 루트 README (이 파일)
```

## 기술 스택

### Frontend
- React 18.x, Redux Toolkit, React Router v6
- TailwindCSS, Chart.js, Axios

### Backend
- Spring Boot 3.5.7, Spring Security, Spring Data JPA
- MySQL 8.x, JWT, OAuth2

### Market Data Service
- FastAPI, Python 3.x, yfinance, NumPy, Pandas

### Analytics Service
- FastAPI, Python 3.x, NumPy, Pandas (백그라운드 작업)

### Blockchain API
- Node.js, Express.js, Ethers.js v6
- Solidity 0.8.20, OpenZeppelin
- IPFS (Pinata/Infura)

## 개발 로드맵

### 완료
- [x] 기본 인증 시스템 (일반/OAuth2)
- [x] 지갑 주소 등록 기능 (MyPage)
- [x] 포트폴리오 CRUD
- [x] 자산 관리 (CRUD)
- [x] 대시보드 통계
- [x] 실시간 시장 데이터 (FastAPI)
- [x] 시장 탐색 페이지
- [x] 관심종목 기능
- [x] 블록체인 API (Node.js + Ethers.js)
- [x] ERC-20 토큰 리워드 시스템
- [x] ERC-721 NFT 인증서 발행
- [x] 블록체인 통합 UI (토큰 잔액, NFT 갤러리)

### 진행 중
- [ ] 리워드 활동 히스토리
- [ ] 알림 서비스

### 예정
- [ ] Docker/Kubernetes 배포
- [ ] CI/CD 파이프라인
- [ ] 모바일 앱 (React Native)

## 라이선스

MIT License

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 문의

- 프로젝트 링크: [https://github.com/yourusername/MyStockFolio](https://github.com/yourusername/MyStockFolio)
- 이슈 트래커: [GitHub Issues](https://github.com/yourusername/MyStockFolio/issues)
