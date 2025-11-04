# Blockchain API Service

MyStockFolio의 블록체인 통합 서비스로, ERC-20 토큰 리워드 시스템과 ERC-721 NFT 인증서 발행을 담당합니다.

## 주요 기능

- **ERC-20 FolioToken**: 활동 기반 리워드 토큰 민팅
- **ERC-721 NFT**: 포트폴리오 성과 인증서 발행
- **IPFS 통합**: NFT 메타데이터 분산 저장 (Pinata/Infura)
- **REST API**: Spring Boot 백엔드와 통신

## 기술 스택

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Blockchain**: Ethers.js v6, Hardhat
- **IPFS**: Pinata SDK 또는 Infura IPFS API
- **Smart Contracts**: Solidity 0.8.20, OpenZeppelin

## 사전 요구사항

1. **Node.js** 18.x 이상
2. **Ethereum 네트워크 접근**
   - **로컬 개발**: Ganache (권장) 또는 Hardhat 네트워크
   - **테스트넷**: Sepolia 테스트넷
3. **IPFS 서비스** (선택사항)
   - Pinata API Key (무료 계정 가능)
   - 또는 Infura IPFS 프로젝트

## 설치

```bash
cd blockchain-api
npm install
```

## 환경 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 설정하세요:

```bash
cp .env.example .env
```

`.env` 파일 설정:

### 로컬 개발 (Ganache 사용, 권장)

```env
# Ethereum Network
NETWORK=localhost
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=your_ganache_account_private_key

# Contract Addresses (배포 후 업데이트)
FOLIO_TOKEN_ADDRESS=
NFT_CONTRACT_ADDRESS=

# IPFS Configuration (선택사항)
IPFS_PROVIDER=pinata
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Server
PORT=8004
NODE_ENV=development
```

### Sepolia 테스트넷

```env
# Ethereum Network
NETWORK=sepolia
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_private_key_here

# Contract Addresses (배포 후 업데이트)
FOLIO_TOKEN_ADDRESS=
NFT_CONTRACT_ADDRESS=

# IPFS Configuration
IPFS_PROVIDER=pinata
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Server
PORT=8004
NODE_ENV=development
```

## 로컬 테스트 환경 설정 (Ganache)

### Ganache 설치 및 실행

#### Windows

1. **Ganache 다운로드**: https://trufflesuite.com/ganache/

2. **⚠️ 중요: Workspace 사용 필수!**
   
   **QuickStart는 재시작 시 모든 데이터가 삭제되므로 Workspace를 사용해야 합니다.**

   **Workspace 설정 방법:**
   - Ganache 실행 → "New Workspace" 클릭
   - Workspace Name: `MyStockFolio` (원하는 이름)
   - **Settings 탭**:
     - HOSTNAME: `127.0.0.1`
     - PORT NUMBER: `8545` ⚠️ **반드시 8545로 설정**
     - NETWORK ID: `5777` (기본값)
   - "SAVE WORKSPACE" 클릭

3. **계정 확인**:
   - Ganache에서 첫 번째 계정의 "Key" 아이콘 클릭
   - "PRIVATE KEY" 복사 (예: `0xabc123...`)
   
   ⚠️ **주의**: Workspace를 저장한 폴더 경로를 기억하세요. Ganache를 다시 열 때 "SWITCH" 버튼으로 같은 Workspace를 선택하면 데이터가 유지됩니다!

#### Linux/Mac

Ganache CLI를 사용하거나 Docker 컨테이너로 실행:

```bash
# Docker로 Ganache 실행
docker run -d -p 8545:8545 trufflesuite/ganache:latest --deterministic
```

### 주의사항

- Ganache가 실행 중이어야 블록체인 API가 동작합니다
- Ganache 종료 시 블록체인 기능 사용 불가

### 스마트 컨트랙트 배포

#### 1. 의존성 설치

```bash
cd blockchain-api
npm install
```

#### 2. 컨트랙트 컴파일

```bash
npm run compile
```

#### 3. 컨트랙트 배포

**로컬 Ganache 네트워크에 배포**:

```bash
npm run deploy:local
```

**Sepolia 테스트넷에 배포**:

```bash
npm run deploy:sepolia
```

**출력 예시**:
```
🚀 Starting deployment to localhost...

📦 Deploying FolioToken...
✅ FolioToken deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

📦 Deploying PortfolioAchievementNFT...
✅ PortfolioAchievementNFT deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

📝 Please update your .env file with the following addresses:
FOLIO_TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NFT_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

#### 4. 컨트랙트 주소 업데이트

1. 배포 출력에서 주소 복사
2. `.env` 파일에 붙여넣기:

```env
FOLIO_TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NFT_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

#### 5. ABI 추출

컴파일 후 자동으로 `src/abis/` 디렉토리에 ABI 파일이 생성됩니다. 수동 추출이 필요한 경우:

```bash
npm run extract-abi
```

## 서버 실행

### 개발 모드 (자동 재시작)

```bash
npm run dev
```

### 프로덕션 모드

```bash
npm start
```

서버는 기본적으로 `http://localhost:8004`에서 실행됩니다.

## API 엔드포인트

### 토큰 (ERC-20)

- `GET /api/blockchain/token/balance?address=0x...` - 토큰 잔액 조회
- `POST /api/blockchain/token/mint` - 토큰 리워드 민팅
  ```json
  {
    "toAddress": "0x...",
    "amount": 10,
    "activity": "asset_added"
  }
  ```
- `POST /api/blockchain/token/batch-mint` - 일괄 민팅
- `GET /api/blockchain/token/info` - 토큰 정보 조회
- `GET /api/blockchain/token/supply` - 총 공급량 조회

### NFT (ERC-721)

- `POST /api/blockchain/nft/mint` - 성과 NFT 민팅
  ```json
  {
    "toAddress": "0x...",
    "achievementType": "portfolio_maintained_90days",
    "metadata": {
      "name": "90일 포트폴리오 유지",
      "description": "...",
      "period": 90,
      "returnRate": 15.5,
      "earnedAt": "2024-01-01T00:00:00Z"
    }
  }
  ```
- `GET /api/blockchain/nft/owned?address=0x...` - 사용자 NFT 목록 조회
- `GET /api/blockchain/nft/:tokenId` - NFT 상세 정보 조회
- `GET /api/blockchain/nft/supply` - NFT 총 발행량 조회

### IPFS

- `POST /api/blockchain/ipfs/upload` - 메타데이터 업로드 (테스트용)
- `GET /api/blockchain/ipfs/:hash` - IPFS 메타데이터 조회

## 프로젝트 구조

```
blockchain-api/
├── contracts/              # Solidity 스마트 컨트랙트
│   ├── FolioToken.sol
│   └── PortfolioAchievementNFT.sol
├── scripts/                # 배포 및 유틸리티 스크립트
│   ├── deploy.js
│   └── extract-abi.js
├── src/
│   ├── abis/              # 컴파일된 ABI 파일 (자동 생성)
│   ├── config/             # 설정
│   │   └── web3Config.js
│   ├── routes/             # Express 라우터
│   │   ├── tokenRoutes.js
│   │   ├── nftRoutes.js
│   │   └── ipfsRoutes.js
│   ├── services/           # 비즈니스 로직
│   │   ├── tokenService.js
│   │   ├── nftService.js
│   │   └── ipfsService.js
│   └── index.js            # Express 앱 진입점
├── .env.example
├── hardhat.config.js
├── package.json
└── README.md
```

## 개발 가이드

### 로컬 테스트넷 사용 (Hardhat)

1. Hardhat 네트워크 시작:
```bash
npx hardhat node
```

2. `.env` 설정:
```env
NETWORK=localhost
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=<Hardhat 첫 번째 계정의 private key>
```

3. 컨트랙트 배포 및 테스트 진행

### Sepolia 테스트넷 사용

1. [Infura](https://infura.io) 또는 [Alchemy](https://www.alchemy.com)에서 프로젝트 생성
2. Sepolia 테스트넷에서 ETH 확보 (팩셋 사용)
3. `.env`에 RPC URL과 Private Key 설정
4. 컨트랙트 배포

## 보안 주의사항

⚠️ **절대 Private Key를 Git에 커밋하지 마세요!**

- `.env` 파일은 `.gitignore`에 포함되어 있습니다.
- 프로덕션 환경에서는 환경 변수 관리 시스템을 사용하세요.
- 컨트랙트 배포용 계정과 운영용 계정을 분리하는 것을 권장합니다.

## 전체 플로우 테스트

### 1. Spring Boot 백엔드 실행

다른 터미널에서:

```bash
cd backend
./gradlew bootRun
```

### 2. React 프론트엔드 실행

또 다른 터미널에서:

```bash
cd frontend
npm start
```

### 3. 전체 플로우 테스트

1. **사용자 로그인**: http://localhost:3000
2. **마이페이지 이동**: 지갑 주소 등록
   - Ganache에서 두 번째 계정 주소 복사
   - MyPage → 지갑 주소 수정 → 주소 붙여넣기 → 저장
3. **포트폴리오 페이지 이동**: 자산 추가
4. **대시보드 이동**: FOLIO 토큰 잔액 확인
5. **블록체인 API 로그 확인**:
   ```
   ✅ 자산 추가 리워드 민팅 완료: 15.5 FOLIO
   ```

## 문제 해결

### Ganache 연결 실패

**증상**: `Error: could not detect network`

**해결**:
1. Ganache가 실행 중인지 확인
2. Ganache 포트가 8545인지 확인
3. `.env`의 `RPC_URL`이 `http://127.0.0.1:8545`인지 확인

### 컨트랙트 배포 실패

**증상**: `Error: insufficient funds`

**해결**:
1. `.env`의 `PRIVATE_KEY`가 Ganache 첫 번째 계정의 것인지 확인
2. Ganache에서 해당 계정의 ETH 확인

### IPFS 업로드 실패

**증상**: NFT 민팅 실패 (IPFS 에러)

**해결**:
1. Pinata API 키 설정 확인
2. 또는 IPFS 관련 코드를 주석 처리하여 테스트
3. IPFS 실패 시 자동으로 data URI로 fallback됨

### ABI 파일 없음

**증상**: `Cannot find module '../abis/FolioToken.json'`

**해결**:
```bash
cd blockchain-api
npm run compile
npm run extract-abi
```

## 구현된 주요 기능

### ERC-20 토큰 시스템
- **FolioToken 민팅**: 활동 기반 리워드 토큰 발행
  - `mintReward()` 함수 호출
  - Nonce 자동 관리 (트랜잭션 순서 보장)
  - 트랜잭션 해시 추적
- **잔액 조회**: 사용자 지갑 주소의 토큰 잔액 조회
- **토큰 정보**: 총 공급량, 이름, 심볼 등 조회

### ERC-721 NFT 시스템
- **성과 NFT 발행**: 포트폴리오 성과 달성 시 NFT 민팅
  - `mintAchievement()` 함수 호출
  - IPFS 메타데이터 업로드 (Pinata)
  - IPFS 실패 시 data URI fallback
  - Token ID 자동 추출 (이벤트 파싱 또는 totalSupply)
- **NFT 목록 조회**: 사용자 소유 NFT 전체 조회
  - 메타데이터 자동 파싱 (base64 디코딩)
  - IPFS URI 처리
- **NFT 상세 정보**: 개별 NFT 상세 정보 조회

### IPFS 통합
- **메타데이터 업로드**: Pinata API를 통한 분산 저장
  - JSON 형식 메타데이터 지원
  - CID 반환 및 저장
- **Fallback 메커니즘**: IPFS 실패 시 data URI 사용
  - `data:application/json;base64,...` 형식
  - 블록체인에 직접 저장

### 트랜잭션 관리
- **트랜잭션 상세 정보**: Ethers.js Provider를 통한 상세 조회
  - 상태 (Success/Failed)
  - From/To 주소
  - Gas 사용량 및 가격
  - 블록 정보 (번호, 해시, 타임스탬프)
  - Nonce 정보

