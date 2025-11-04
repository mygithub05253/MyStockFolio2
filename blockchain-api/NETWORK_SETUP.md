# 🌐 네트워크 설정 가이드

이 문서는 MyStockFolio 블록체인 API를 다양한 네트워크(로컬, Sepolia, Bifrost)에서 사용하는 방법을 설명합니다.

## ✅ 수정 완료 사항

다음 파일들이 업데이트되어 여러 네트워크를 지원합니다:

1. **`hardhat.config.js`** - Sepolia 및 Bifrost 네트워크 설정 추가
2. **`src/config/web3Config.js`** - 네트워크별 RPC URL 자동 선택 기능 추가

## 📋 지원 네트워크

- **localhost** - 로컬 개발 환경 (Ganache/Hardhat)
- **sepolia** - Ethereum Sepolia 테스트넷
- **bifrost** - Bifrost 테스트넷

## 🚀 네트워크 전환 방법

### 1. 로컬 네트워크 (기본값)

`.env` 파일 설정:
```env
NETWORK=localhost
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0x...  # Ganache에서 생성된 Private Key
FOLIO_TOKEN_ADDRESS=0x...  # 로컬에 배포된 주소
NFT_CONTRACT_ADDRESS=0x...  # 로컬에 배포된 주소
```

**배포:**
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Sepolia 테스트넷

#### 2-1. RPC URL 발급
- [Alchemy](https://www.alchemy.com/) 또는 [Infura](https://www.infura.io/)에서 계정 생성
- Sepolia 네트워크용 RPC URL 발급

#### 2-2. Sepolia 테스트 이더(ETH) 확보
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/) 또는 [Chainlink Faucet](https://faucets.chain.link/sepolia)에서 받기

#### 2-3. `.env` 파일 설정
```env
NETWORK=sepolia
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
# 또는
# SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=0x...  # 배포에 사용할 지갑의 Private Key
FOLIO_TOKEN_ADDRESS=  # 배포 후 업데이트 필요
NFT_CONTRACT_ADDRESS=  # 배포 후 업데이트 필요
```

#### 2-4. 컨트랙트 배포
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

배포가 성공하면 출력된 컨트랙트 주소를 `.env` 파일에 업데이트합니다.

#### 2-5. 서버 재시작
```bash
npm run dev
# 또는
node src/index.js
```

### 3. Bifrost 테스트넷

#### 3-1. Bifrost 테스트 이더 확보
- Bifrost 공식 웹사이트에서 테스트넷 Faucet 확인

#### 3-2. `.env` 파일 설정
```env
NETWORK=bifrost
BIFROST_RPC_URL=https://public-01.testnet.thebifrost.io/rpc
PRIVATE_KEY=0x...  # 배포에 사용할 지갑의 Private Key
FOLIO_TOKEN_ADDRESS=  # 배포 후 업데이트 필요
NFT_CONTRACT_ADDRESS=  # 배포 후 업데이트 필요
```

#### 3-3. 컨트랙트 배포
```bash
npx hardhat run scripts/deploy.js --network bifrost
```

배포가 성공하면 출력된 컨트랙트 주소를 `.env` 파일에 업데이트합니다.

#### 3-4. 서버 재시작
```bash
npm run dev
```

## 🔍 네트워크 확인 방법

서버를 시작하면 콘솔에 다음과 같은 로그가 출력됩니다:

```
✅ Provider initialized: sepolia (https://eth-sepolia.g.alchemy.com/v2/...)
✅ Signer initialized: 0x...
✅ FolioToken contract connected: 0x...
✅ NFT contract connected: 0x...
🚀 Blockchain API Server running on http://localhost:8004
📡 Network: sepolia
```

## ⚠️ 주의사항

1. **Private Key 보안**
   - `.env` 파일은 절대 Git에 커밋하지 마세요
   - `.gitignore`에 `.env`가 포함되어 있는지 확인하세요

2. **컨트랙트 주소**
   - 각 네트워크마다 별도의 컨트랙트 주소가 필요합니다
   - 네트워크를 변경하면 반드시 해당 네트워크에 배포된 주소로 업데이트해야 합니다

3. **가스비**
   - Sepolia와 Bifrost는 실제 가스비가 발생합니다 (테스트넷이지만)
   - 충분한 테스트 이더를 확보하세요

4. **MetaMask 설정**
   - 프론트엔드에서 사용하는 MetaMask도 같은 네트워크로 설정해야 합니다
   - Sepolia: 네트워크 ID 11155111
   - Bifrost: 네트워크 ID 49088

## 🔧 문제 해결

### RPC URL 오류
```
Error: RPC_URL for sepolia network is required...
```
→ `.env` 파일에 `SEPOLIA_RPC_URL` 또는 `RPC_URL`을 확인하세요.

### 컨트랙트 연결 실패
```
Error: FolioToken contract not initialized...
```
→ `.env` 파일의 `FOLIO_TOKEN_ADDRESS`와 `NFT_CONTRACT_ADDRESS`가 올바른지 확인하세요.

### 네트워크 불일치
→ MetaMask와 서버가 같은 네트워크를 사용하는지 확인하세요.

## 📚 추가 자료

- [Hardhat Network Configuration](https://hardhat.org/hardhat-runner/docs/config#networks-configuration)
- [Sepolia Testnet](https://sepolia.dev/)
- [Bifrost Testnet](https://thebifrost.io/)
