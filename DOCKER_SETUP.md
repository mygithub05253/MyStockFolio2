# Docker 설정 가이드

MyStockFolio 프로젝트를 Docker 컨테이너로 실행하기 위한 상세 가이드입니다.

## 사전 요구사항

### 리눅스 환경
- **Ubuntu 20.04 LTS 이상** (또는 다른 Linux 배포판)
- **Docker** 20.10 이상
- **Docker Compose** 2.0 이상
- **Git** (프로젝트 클론용)

### 설치 확인

```bash
# Docker 버전 확인
docker --version

# Docker Compose 버전 확인
docker-compose --version
```

## 1단계: Docker 및 Docker Compose 설치

### Ubuntu/Debian

```bash
# 1. 기존 패키지 업데이트
sudo apt-get update

# 2. 필요한 패키지 설치
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 3. Docker의 공식 GPG 키 추가
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 4. Docker 저장소 추가
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Docker Engine 설치
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 6. Docker 서비스 시작 및 자동 시작 설정
sudo systemctl start docker
sudo systemctl enable docker

# 7. 현재 사용자를 docker 그룹에 추가 (sudo 없이 사용)
sudo usermod -aG docker $USER

# 8. Docker Compose 설치 (별도 설치가 필요한 경우)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 9. 재로그인 또는 그룹 변경 적용
newgrp docker
```

### 설치 확인

```bash
# Docker 실행 확인
docker run hello-world

# Docker Compose 확인
docker compose version
```

## 2단계: 프로젝트 클론 및 준비

### 프로젝트 클론

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/your/projects

# Git에서 클론 (또는 압축 파일 압축 해제)
git clone <repository-url> MyStockFolio
cd MyStockFolio
```

### 환경 변수 파일 생성

각 서비스별로 `.env.example` 파일을 복사하여 `.env` 파일을 생성합니다.

```bash
# Backend 환경 변수
cd backend
cp application.properties.example src/main/resources/application.properties
# application.properties 파일을 편집하여 DB 정보, JWT 시크릿 등 설정

# Blockchain API 환경 변수
cd ../blockchain-api
cp .env.example .env
# .env 파일을 편집하여 RPC URL, Private Key, 컨트랙트 주소 등 설정

# Market Data Service (선택사항)
cd ../market-data-svc
# .env 파일이 필요한 경우 생성

# Analytics Service (선택사항)
cd ../analytics-svc
# .env 파일이 필요한 경우 생성

# Crawler Service (선택사항)
cd ../crawler-svc
# .env 파일이 필요한 경우 생성
```

## 3단계: Dockerfile 작성

각 서비스 폴더에 Dockerfile을 생성합니다.

### Frontend Dockerfile

`frontend/Dockerfile`:

```dockerfile
# 빌드 스테이지
FROM node:18-alpine AS builder

WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

# 실행 스테이지
FROM nginx:alpine

# 빌드 결과물 복사
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx 설정 파일 복사 (선택사항)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# 포트 노출
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Backend Dockerfile

`backend/Dockerfile`:

```dockerfile
# 빌드 스테이지
FROM gradle:7.6-jdk17 AS builder

WORKDIR /app

# Gradle 캐시를 활용하기 위해 build.gradle 먼저 복사
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# 의존성 다운로드 (캐시 활용)
RUN gradle dependencies --no-daemon

# 소스 코드 복사
COPY . .

# JAR 빌드
RUN gradle build -x test --no-daemon

# 실행 스테이지
FROM openjdk:17-jre-slim

WORKDIR /app

# JAR 파일 복사
COPY --from=builder /app/build/libs/*.jar app.jar

# 포트 노출
EXPOSE 8080

# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Market Data Service Dockerfile

`market-data-svc/Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# 시스템 패키지 업데이트
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# requirements.txt 복사 및 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY app ./app

# 포트 노출
EXPOSE 8001

# 서버 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Analytics Service Dockerfile

`analytics-svc/Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# 시스템 패키지 업데이트
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# requirements.txt 복사 및 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY app ./app

# 포트 노출
EXPOSE 8003

# 서버 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003"]
```

### Blockchain API Dockerfile

`blockchain-api/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 8004

# 서버 실행
CMD ["npm", "start"]
```

### Crawler Service Dockerfile

`crawler-svc/Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# 시스템 패키지 업데이트
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# requirements.txt 복사 및 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY app ./app

# 포트 노출
EXPOSE 8005

# 서버 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8005"]
```

## 4단계: Docker Compose 파일 작성

프로젝트 루트에 `docker-compose.yml` 파일을 생성합니다.

`docker-compose.yml`:

```yaml
version: '3.8'

services:
  # MySQL 데이터베이스
  mysql:
    image: mysql:8.0
    container_name: mystockfolio_mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: mystockfolio_db
      MYSQL_USER: ${MYSQL_USER:-mystockfolio}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-password}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database_schema.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - mystockfolio_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Frontend (React)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: mystockfolio_frontend
    ports:
      - "3000:80"
    networks:
      - mystockfolio_network
    depends_on:
      - backend

  # Backend (Spring Boot)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mystockfolio_backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/mystockfolio_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul
      SPRING_DATASOURCE_USERNAME: ${MYSQL_USER:-mystockfolio}
      SPRING_DATASOURCE_PASSWORD: ${MYSQL_PASSWORD:-password}
      MARKET_DATA_URL: http://market-data-svc:8001
      ANALYTICS_DATA_URL: http://analytics-svc:8003
      BLOCKCHAIN_API_URL: http://blockchain-api:8004
    ports:
      - "8080:8080"
    networks:
      - mystockfolio_network
    depends_on:
      mysql:
        condition: service_healthy
      market-data-svc:
        condition: service_started
      analytics-svc:
        condition: service_started
      blockchain-api:
        condition: service_started

  # Market Data Service (FastAPI)
  market-data-svc:
    build:
      context: ./market-data-svc
      dockerfile: Dockerfile
    container_name: mystockfolio_market_data
    ports:
      - "8001:8001"
    networks:
      - mystockfolio_network

  # Analytics Service (FastAPI)
  analytics-svc:
    build:
      context: ./analytics-svc
      dockerfile: Dockerfile
    container_name: mystockfolio_analytics
    ports:
      - "8003:8003"
    networks:
      - mystockfolio_network

  # Blockchain API (Node.js)
  blockchain-api:
    build:
      context: ./blockchain-api
      dockerfile: Dockerfile
    container_name: mystockfolio_blockchain_api
    environment:
      NETWORK: ${BLOCKCHAIN_NETWORK:-localhost}
      RPC_URL: ${BLOCKCHAIN_RPC_URL:-http://ganache:8545}
      PRIVATE_KEY: ${BLOCKCHAIN_PRIVATE_KEY}
      FOLIO_TOKEN_ADDRESS: ${FOLIO_TOKEN_ADDRESS}
      NFT_CONTRACT_ADDRESS: ${NFT_CONTRACT_ADDRESS}
      IPFS_PROVIDER: ${IPFS_PROVIDER:-pinata}
      PINATA_API_KEY: ${PINATA_API_KEY}
      PINATA_SECRET_KEY: ${PINATA_SECRET_KEY}
      PORT: 8004
    ports:
      - "8004:8004"
    networks:
      - mystockfolio_network
    depends_on:
      - ganache

  # Crawler Service (FastAPI) - 선택사항
  crawler-svc:
    build:
      context: ./crawler-svc
      dockerfile: Dockerfile
    container_name: mystockfolio_crawler
    ports:
      - "8005:8005"
    networks:
      - mystockfolio_network

  # Ganache (로컬 블록체인 네트워크) - 선택사항
  ganache:
    image: trufflesuite/ganache:latest
    container_name: mystockfolio_ganache
    ports:
      - "8545:8545"
    command:
      - "--host"
      - "0.0.0.0"
      - "--port"
      - "8545"
      - "--deterministic"
    networks:
      - mystockfolio_network

volumes:
  mysql_data:

networks:
  mystockfolio_network:
    driver: bridge
```

## 5단계: 환경 변수 파일 생성

프로젝트 루트에 `.env` 파일을 생성합니다.

`.env`:

```env
# MySQL 설정
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_USER=mystockfolio
MYSQL_PASSWORD=password

# 블록체인 설정
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_RPC_URL=http://ganache:8545
BLOCKCHAIN_PRIVATE_KEY=your_private_key_here
FOLIO_TOKEN_ADDRESS=0x...
NFT_CONTRACT_ADDRESS=0x...

# IPFS 설정
IPFS_PROVIDER=pinata
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

## 6단계: 데이터베이스 스키마 초기화

`database_schema.sql` 파일이 프로젝트 루트에 있는지 확인합니다. Docker Compose에서 자동으로 초기화 스크립트를 실행합니다.

## 7단계: 컨테이너 빌드 및 실행

### 빌드

```bash
# 모든 서비스 빌드
docker-compose build

# 특정 서비스만 빌드
docker-compose build frontend
docker-compose build backend
```

### 실행

```bash
# 백그라운드 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그만 확인
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 중지

```bash
# 컨테이너 중지
docker-compose stop

# 컨테이너 중지 및 제거
docker-compose down

# 볼륨까지 제거 (데이터 삭제)
docker-compose down -v
```

## 8단계: 스마트 컨트랙트 배포 (Blockchain API)

Ganache 컨테이너가 실행된 후, 스마트 컨트랙트를 배포합니다.

```bash
# blockchain-api 컨테이너에 접속
docker-compose exec blockchain-api sh

# 컨테이너 내에서 배포 스크립트 실행
npm run deploy:local

# 또는 호스트에서 직접 실행
docker-compose exec blockchain-api npm run deploy:local
```

배포가 완료되면 출력된 컨트랙트 주소를 `.env` 파일에 업데이트합니다.

## 9단계: 서비스 확인

### 헬스체크

```bash
# 각 서비스 헬스체크
curl http://localhost:3000  # Frontend
curl http://localhost:8080/api/health  # Backend
curl http://localhost:8001/health  # Market Data Service
curl http://localhost:8003/health  # Analytics Service
curl http://localhost:8004/api/blockchain/token/info  # Blockchain API
```

### 로그 확인

```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend
docker-compose logs -f mysql
```

## 10단계: 트러블슈팅

### 포트 충돌

포트가 이미 사용 중인 경우 `docker-compose.yml`에서 포트를 변경합니다.

```yaml
services:
  frontend:
    ports:
      - "3001:80"  # 3000 대신 3001 사용
```

### 데이터베이스 연결 오류

```bash
# MySQL 컨테이너 로그 확인
docker-compose logs mysql

# MySQL 컨테이너에 접속하여 확인
docker-compose exec mysql mysql -u root -p
```

### 컨테이너 재빌드

코드 변경 후 재빌드가 필요한 경우:

```bash
# 특정 서비스만 재빌드
docker-compose build backend
docker-compose up -d backend

# 모든 서비스 재빌드
docker-compose build
docker-compose up -d
```

### 볼륨 데이터 확인

```bash
# MySQL 데이터 볼륨 확인
docker volume ls
docker volume inspect mystockfolio_mysql_data
```

## 11단계: 프로덕션 배포 (선택사항)

### Nginx 역방향 프록시 설정

프로덕션 환경에서는 Nginx를 사용하여 단일 진입점을 제공할 수 있습니다.

```nginx
# /etc/nginx/sites-available/mystockfolio
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL/TLS 인증서 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt-get install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com
```

## 참고 사항

- **개발 환경**: 로컬 개발 시에는 각 서비스를 개별적으로 실행하는 것이 더 편리할 수 있습니다.
- **프로덕션 환경**: 보안을 위해 환경 변수는 안전하게 관리하세요 (AWS Secrets Manager, HashiCorp Vault 등).
- **데이터 백업**: MySQL 볼륨을 정기적으로 백업하세요.
- **리소스 모니터링**: `docker stats` 명령으로 컨테이너 리소스 사용량을 확인할 수 있습니다.

## 다음 단계

- [ ] 각 서비스 README.md 업데이트 완료
- [ ] Dockerfile 최적화 (멀티 스테이지 빌드)
- [ ] CI/CD 파이프라인 구축 (GitHub Actions, GitLab CI 등)
- [ ] Kubernetes 마이그레이션 (선택사항)
