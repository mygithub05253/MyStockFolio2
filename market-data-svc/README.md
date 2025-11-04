# Market Data Service - FastAPI 마켓 데이터 서비스

Yahoo Finance API를 활용한 실시간 시장 데이터 제공 마이크로서비스

## 기술 스택

### Core Framework
- **FastAPI 0.x**: 고성능 비동기 Python 웹 프레임워크
- **Uvicorn**: ASGI 서버 (Python 3.9+)
- **Python 3.9+**: 프로그래밍 언어

### 데이터 소스
- **yfinance**: Yahoo Finance API 통합 라이브러리
  - 실시간 시세 데이터
  - 과거 차트 데이터
  - 시장 지수 정보
  - Top Movers 데이터

### 데이터 검증
- **Pydantic**: 데이터 모델 및 검증
  - 자동 API 문서 생성 (Swagger/OpenAPI)
  - 타입 검증 및 직렬화

### HTTP 클라이언트
- **requests**: 외부 API 호출 (yfinance 내부 사용)

## 설치 및 실행

### 사전 요구사항
- **Python** 3.9 이상
- **pip** 패키지 관리자

### 설치

```bash
cd market-data-svc

# 가상 환경 생성 (권장)
python -m venv venv

# 가상 환경 활성화
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt
```

### 실행

#### Windows (CMD)
```cmd
cd market-data-svc
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

#### Windows (PowerShell)
```powershell
cd market-data-svc
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

#### Linux/Mac
```bash
cd market-data-svc
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

#### 실행 스크립트 사용

**Windows**:
```cmd
cd market-data-svc
run_local.bat
```

**Linux/Mac**:
```bash
cd market-data-svc
chmod +x run_local.sh
./run_local.sh
```

**서버**: http://127.0.0.1:8001  
**API 문서**: http://127.0.0.1:8001/docs  
**헬스체크**: http://127.0.0.1:8001/health

### 실행 옵션 설명

- `--reload`: 코드 변경 시 자동 재시작 (개발 모드)
- `--host 127.0.0.1`: 로컬호스트 바인딩
- `--port 8001`: 서비스 포트 지정

### 주의사항

1. **의존성 설치 확인**:
   ```bash
   cd market-data-svc
   pip install -r requirements.txt
   ```

2. **Python 버전**: Python 3.9 이상 필요

3. **⚠️ 중요**: `python main.py`로 직접 실행하지 마세요. 패키지 구조를 사용하므로 uvicorn으로 실행해야 합니다.

4. **실행 순서**: 
   - 먼저 `market-data-svc` 실행 (포트 8001)
   - 그 다음 `analytics-svc` 실행 (포트 8003)
   - 마지막으로 Spring Boot 백엔드 실행 (포트 8080)

## 프로젝트 구조

```
market-data-svc/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱 및 엔드포인트 정의
│   ├── models.py            # Pydantic 데이터 모델
│   ├── service.py           # Yahoo Finance 통합 서비스 로직
│   └── ticker_database.json # 티커 검색용 데이터베이스 (40+ 종목)
├── requirements.txt         # Python 의존성
├── run_local.bat           # Windows 실행 스크립트
├── run_local.sh            # Linux/Mac 실행 스크립트
└── README.md               # 이 파일
```

## 주요 API 엔드포인트

### Health Check

```
GET /health
```

**응답**:
```json
{
  "status": "healthy",
  "service": "market-data-svc"
}
```

### 실시간 시세 조회

```
GET /api/market/price?ticker=AAPL
```

**응답**:
```json
{
  "ticker": "AAPL",
  "price": 175.50,
  "currency": "USD",
  "last_updated": "2024-01-15T10:30:00Z"
}
```

**지원 티커 형식**:
- 미국 주식: `AAPL`, `MSFT`, `GOOGL`
- 한국 주식: `005930.KS` (삼성전자), `000660.KS` (SK하이닉스)
- 코인: `BTC-USD`, `ETH-USD`
- 채권: `TLT`, `IEF`
- ETF: `SPY`, `QQQ`

### 차트 데이터

```
GET /api/market/chart?ticker=AAPL&period=1mo
```

**Period 옵션**:
- `1d`: 1일
- `5d`: 5일
- `1mo`: 1개월 (기본값)
- `3mo`: 3개월
- `6mo`: 6개월
- `1y`: 1년
- `2y`: 2년
- `5y`: 5년
- `10y`: 10년
- `ytd`: 올해 초부터
- `max`: 전체 기간

**응답**:
```json
{
  "ticker": "AAPL",
  "history": [
    {
      "date": "2024-01-15",
      "price": 175.50,
      "volume": 50000000
    },
    ...
  ]
}
```

### 상세 시세 (HTS 스타일)

```
GET /api/market/quote?ticker=AAPL
```

**응답**:
```json
{
  "ticker": "AAPL",
  "current_price": 175.50,
  "previous_close": 174.20,
  "change": 1.30,
  "change_percent": 0.75,
  "volume": 50000000,
  "market_cap": 2800000000000,
  "currency": "USD",
  "last_updated": "2024-01-15T10:30:00Z"
}
```

### 인기 종목

```
GET /api/market/popular
```

**응답**:
```json
[
  {
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "price": 175.50,
    "change_percent": 0.75,
    "category": "stock"
  },
  ...
]
```

### Top Movers

```
GET /api/market/top?category=gainers
```

**Category 옵션**:
- `gainers`: 상승률 상위
- `losers`: 하락률 상위
- `active`: 거래량 상위

**응답**: `PopularItem[]` (인기 종목과 동일한 형식)

### 시장 지수

```
GET /api/market/indices
```

**응답**:
```json
[
  {
    "symbol": "^GSPC",
    "name": "S&P 500",
    "value": 4800.00,
    "change_percent": 0.50
  },
  {
    "symbol": "^DJI",
    "name": "Dow Jones",
    "value": 38000.00,
    "change_percent": 0.30
  },
  {
    "symbol": "^IXIC",
    "name": "NASDAQ",
    "value": 15000.00,
    "change_percent": 0.80
  },
  {
    "symbol": "^KS11",
    "name": "KOSPI",
    "value": 2500.00,
    "change_percent": -0.20
  }
]
```

### 종목 검색 (자동완성)

```
GET /api/market/suggest?q=AAPL
```

**검색 우선순위**:
1. 정확한 티커 매칭
2. 티커 부분 매칭
3. 종목명 매칭 (영문명 + 한글명)

**응답**:
```json
[
  {
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "type": "stock",
    "sector": "기술",
    "market": "NASDAQ"
  },
  ...
]
```

**최대 결과**: 15개

## 사용한 외부 API

### Yahoo Finance API

**라이브러리**: `yfinance` (Python 패키지)

**기능**:
- 실시간 시세 데이터
- 과거 가격 데이터 (OHLCV)
- 시장 지수 정보
- 주요 종목 리스트

**지원 자산**:
- **미국 주식**: NASDAQ, NYSE 상장 종목
- **한국 주식**: KOSPI, KOSDAQ (`.KS`, `.KQ` 접미사)
- **암호화폐**: Bitcoin, Ethereum 등 (`BTC-USD` 형식)
- **채권**: 미국 국채 (TLT, IEF 등)
- **ETF**: S&P 500, NASDAQ 등 추적 ETF

**제한사항**:
- 무료 API (레이트 리밋 없음, 단 사용량 과다 시 일시적 제한 가능)
- 일부 티커는 데이터가 없을 수 있음 (404 에러 정상)
- 실시간 데이터는 장 운영 시간에만 업데이트
- 한국 주식 데이터는 제한적 (실시간 호가 미제공)

**티커 형식 예시**:
```python
# 미국 주식
"AAPL"  # Apple
"MSFT"  # Microsoft

# 한국 주식
"005930.KS"  # 삼성전자 (KOSPI)
"035420.KQ"  # 네이버 (KOSDAQ)

# 암호화폐
"BTC-USD"  # Bitcoin
"ETH-USD"  # Ethereum

# 채권
"TLT"  # 20년 미국 국채 ETF
"IEF"  # 10년 미국 국채 ETF

# ETF
"SPY"  # S&P 500 추적
"QQQ"  # NASDAQ 100 추적

# 지수
"^GSPC"  # S&P 500 Index
"^DJI"   # Dow Jones Index
"^IXIC"  # NASDAQ Composite
"^KS11"  # KOSPI Index
```

## 데이터 모델 (Pydantic)

### PriceResponse
```python
{
    "ticker": str,
    "price": float,
    "currency": str,  # 기본값: "USD"
    "last_updated": str  # ISO 8601 형식
}
```

### ChartResponse
```python
{
    "ticker": str,
    "history": List[ChartPoint]
}

ChartPoint {
    "date": str,      # YYYY-MM-DD
    "price": float,
    "volume": int
}
```

### DetailedQuoteResponse
```python
{
    "ticker": str,
    "current_price": float,
    "previous_close": float,
    "change": float,
    "change_percent": float,
    "volume": int,
    "market_cap": float,
    "currency": str,
    "last_updated": str
}
```

### PopularItem
```python
{
    "ticker": str,
    "name": str,
    "price": float,
    "change_percent": float,
    "category": str  # "stock", "coin", "bond", "etf"
}
```

### SuggestItem
```python
{
    "ticker": str,
    "name": str,
    "type": str,
    "sector": str,    # "기술", "금융", "반도체" 등
    "market": str     # "NASDAQ", "NYSE", "KOSPI" 등
}
```

## 티커 데이터베이스

### ticker_database.json

로컬 JSON 파일 기반 티커 검색 데이터베이스

**포함 종목**: 40개 이상
- 미국 주식: AAPL, MSFT, GOOGL, TSLA, AMZN 등
- 한국 주식: 삼성전자, SK하이닉스, 네이버, 카카오 등
- 암호화폐: BTC, ETH 등
- ETF: SPY, QQQ 등
- 채권: TLT, IEF 등

**데이터 구조**:
```json
[
  {
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "name_ko": "애플",
    "type": "stock",
    "sector": "기술",
    "market": "NASDAQ"
  },
  ...
]
```

**검색 기능**:
- 티커 정확 매칭
- 티커 부분 매칭
- 종목명 매칭 (영문 + 한글)
- 최대 15개 결과 반환

## CORS 설정

`app/main.py`에서 허용된 도메인:

```python
allow_origins=[
    "http://localhost:8080",   # Spring Boot 백엔드
    "http://127.0.0.1:8080",
    "http://localhost:3000",   # React 프론트엔드
    "http://127.0.0.1:3000"
]
```

## 에러 처리

### 일반적인 에러

1. **404 Not Found**: 티커에 대한 데이터가 없음
   - 일부 티커는 Yahoo Finance에서 지원하지 않을 수 있음
   - 정상적인 응답으로 처리

2. **500 Internal Server Error**: 
   - yfinance API 호출 실패
   - 네트워크 오류
   - 데이터 파싱 오류

3. **Timeout**: 
   - 외부 API 응답 지연
   - 백엔드에서 타임아웃 설정 (5초)

## 성능 최적화

### 캐싱 (백엔드)
- 백엔드 `MarketPriceCacheService`에서 Redis 캐싱
- TTL: 60초
- 중복 요청 방지

### 비동기 처리
- FastAPI의 비동기 엔드포인트 사용
- `async/await` 패턴

## 향후 개선 사항 (P4)

### 데이터 소스 확장
- **Alpha Vantage API**: 무료 티어 통합
- **CoinGecko API**: 암호화폐 데이터 강화
- **크롤링**: 한국 주식/채권 데이터 수집 (crawler-svc)

### 기능 추가
- 실시간 호가 데이터 (WebSocket)
- 뉴스/공시 데이터
- 배치 데이터 업데이트

## 트러블슈팅

### 포트가 이미 사용 중인 경우

**Windows**:
```cmd
# 포트 사용 확인
netstat -ano | findstr :8001

# 프로세스 종료 (PID 확인 후)
taskkill /PID [PID번호] /F
```

**Linux/Mac**:
```bash
# 포트 사용 확인
lsof -i :8001

# 프로세스 종료
kill -9 [PID]
```

### Python 모듈을 찾을 수 없는 경우

```bash
# 가상환경 활성화 후 실행
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
```

### yfinance 설치 오류
```bash
pip install --upgrade pip
pip install yfinance
```

### 포트 충돌
다른 포트로 실행:
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload
```

백엔드 설정도 함께 변경 필요:
```properties
market.data.url=http://127.0.0.1:8002
```

### 데이터 없음 오류
일부 티커는 Yahoo Finance에서 데이터를 제공하지 않을 수 있음 (404 에러 정상)

### 한국 주식 데이터 제한
- 실시간 호가 미제공
- 일부 종목 데이터 부족
- 향후 크롤링 서비스로 보완 예정
