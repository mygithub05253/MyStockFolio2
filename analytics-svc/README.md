# Analytics Service - 포트폴리오 분석 서비스

포트폴리오 분석 및 위험 지표 계산을 담당하는 FastAPI 마이크로서비스

## 기술 스택

### Core Framework
- **FastAPI 0.x**: 고성능 비동기 Python 웹 프레임워크
- **Uvicorn**: ASGI 서버
- **Python 3.9+**: 프로그래밍 언어

### 데이터 분석
- **NumPy**: 수치 계산 및 통계 분석
  - 표준편차 계산 (변동성)
  - 배열 연산 및 수학 함수
- **Pandas**: 데이터 분석 및 처리
  - 시계열 데이터 처리
  - 데이터프레임 조작

### 금융 데이터
- **yfinance**: 과거 가격 데이터 수집
  - 포트폴리오 가치 히스토리 계산
  - 베타 계산용 시장 데이터 (S&P 500)

### 비동기 처리
- **FastAPI BackgroundTasks**: 백그라운드 작업 처리
  - 위험 지표 계산 비동기화
  - 작업 상태 추적 (인메모리 캐시)

### 데이터 검증
- **Pydantic**: 데이터 모델 및 검증

## 설치 및 실행

### 사전 요구사항
- **Python** 3.9 이상
- **pip** 패키지 관리자

### 설치

```bash
cd analytics-svc

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
cd analytics-svc
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8003
```

#### Windows (PowerShell)
```powershell
cd analytics-svc
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8003
```

#### Linux/Mac
```bash
cd analytics-svc
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8003
```

#### 실행 스크립트 사용

**Windows**:
```cmd
cd analytics-svc
run_local.bat
```

**Linux/Mac**:
```bash
cd analytics-svc
chmod +x run_local.sh
./run_local.sh
```

**서버**: http://127.0.0.1:8003  
**API 문서**: http://127.0.0.1:8003/docs  
**헬스체크**: http://127.0.0.1:8003/health

### 실행 옵션 설명

- `--reload`: 코드 변경 시 자동 재시작 (개발 모드)
- `--host 127.0.0.1`: 로컬호스트 바인딩
- `--port 8003`: 서비스 포트 지정

### 주의사항

1. **의존성 설치 확인**:
   ```bash
   cd analytics-svc
   pip install -r requirements.txt
   ```

2. **Python 버전**: Python 3.9 이상 필요

3. **각 서비스는 별도 터미널/CMD 창에서 실행**해야 합니다.

4. **실행 순서**: 
   - 먼저 `market-data-svc` 실행 (포트 8001)
   - 그 다음 `analytics-svc` 실행 (포트 8003)
   - 마지막으로 Spring Boot 백엔드 실행 (포트 8080)

## 프로젝트 구조

```
analytics-svc/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱 및 엔드포인트
│   ├── models.py            # Pydantic 데이터 모델
│   └── service.py           # 분석 로직 (히트맵, 위험 지표)
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
  "service": "analytics-svc"
}
```

### 히트맵 생성

```
POST /api/analytics/heatmap
```

**요청 Body**:
```json
[
  {
    "ticker": "AAPL",
    "assetType": "STOCK",
    "name": "Apple Inc.",
    "quantity": 10.0,
    "currentPrice": 175.50,
    "changePercent": 0.75
  },
  ...
]
```

**응답**:
```json
{
  "sectors": [
    {
      "sector": "기술",
      "value": 17550.00,
      "change_percent": 0.75,
      "asset_count": 5,
      "risk_level": "low"
    },
    ...
  ],
  "total_value": 50000.00,
  "last_updated": "2024-01-15T10:30:00Z"
}
```

**섹터 분류**:
- **미국 주식**: 기술, 금융, 헬스케어, 소비재, 에너지, 기타
- **한국 주식**: 반도체, IT서비스, 금융, 바이오/화학, 자동차, 기타
- **코인**: Layer1, DeFi, NFT, 암호화폐
- **ETF/채권**: ETF, 채권

**위험 수준 판정**:
- `high`: 변동률 절대값 > 5%
- `medium`: 변동률 절대값 > 2%
- `low`: 변동률 절대값 ≤ 2%

### 위험 지표 계산 (비동기)

```
POST /api/analytics/risk
```

**요청 Body**: 히트맵과 동일한 형식

**응답** (즉시 반환):
```json
{
  "job_id": "uuid-string",
  "status": "processing",
  "message": "위험 지표 계산이 시작되었습니다. /api/analytics/risk/{job_id} 엔드포인트로 결과를 조회하세요."
}
```

**결과 조회**:
```
GET /api/analytics/risk/{job_id}
```

**응답**:
- **진행 중** (202 Accepted): `{"detail": "Job is still processing"}`
- **완료** (200 OK): 위험 지표 데이터
- **실패** (500 Internal Server Error): 에러 메시지

### 위험 지표 계산 (동기)

```
POST /api/analytics/risk/sync
```

**요청 Body**: 히트맵과 동일한 형식

**응답** (즉시 결과 반환):
```json
{
  "volatility": 15.25,
  "mdd": 8.50,
  "beta": 1.05,
  "sharpe_ratio": 1.20,
  "recommendation": "적당한 변동성이 있습니다. 주의 깊게 관찰하세요.",
  "risk_level": "medium",
  "last_updated": "2024-01-15T10:30:00Z"
}
```

## 위험 지표 설명

### 1. Volatility (변동성)
- **정의**: 일일 수익률의 표준편차
- **계산**: `np.std(returns) * 100`
- **단위**: %
- **의미**: 높을수록 가격 변동이 큼

### 2. MDD (Maximum Drawdown, 최대 낙폭)
- **정의**: 최고점 대비 최저점의 하락률
- **계산**: `abs((최저점 - 최고점) / 최고점) * 100`
- **단위**: %
- **의미**: 최악의 경우 손실 가능성

### 3. Beta (베타)
- **정의**: S&P 500 대비 포트폴리오 민감도
- **계산**: `covariance(portfolio_returns, sp500_returns) / variance(sp500_returns)`
- **단위**: 없음
- **의미**:
  - `beta > 1`: 시장보다 변동성 큼
  - `beta = 1`: 시장과 동일
  - `beta < 1`: 시장보다 변동성 작음

### 4. Sharpe Ratio (샤프 비율)
- **정의**: 위험 대비 수익률
- **계산**: `평균 수익률 / 변동성`
- **단위**: 없음
- **의미**: 높을수록 위험 대비 수익률 우수

### 위험 수준 판정

```python
if volatility > 20 or mdd > 15:
    risk_level = "high"
    recommendation = "높은 변동성 또는 큰 낙폭이 감지되었습니다. 리밸런싱을 고려해보세요."
elif volatility > 10 or mdd > 8:
    risk_level = "medium"
    recommendation = "적당한 변동성이 있습니다. 주의 깊게 관찰하세요."
else:
    risk_level = "low"
    recommendation = "안정적인 포트폴리오입니다."
```

## 사용한 외부 API

### Yahoo Finance API (yfinance)

**용도**: 과거 가격 데이터 수집

**사용 사례**:
1. **포트폴리오 가치 히스토리**:
   - 각 자산의 30일 가격 데이터 조회
   - 일별 포트폴리오 총 가치 계산
   
2. **베타 계산**:
   - S&P 500 지수 (`^GSPC`) 30일 데이터
   - 포트폴리오 수익률과 시장 수익률 비교

**데이터 기간**: 최근 30일 (1개월)

**폴백 처리**:
- 가격 데이터 조회 실패 시 현재 가치로 대체
- 데이터 부족 시 기본값 사용

## 데이터 모델 (Pydantic)

### PortfolioAssetRequest
```python
{
    "ticker": str,
    "assetType": str,        # "STOCK", "COIN", "BOND", "ETF"
    "name": str,
    "quantity": float,
    "currentPrice": float,
    "changePercent": float
}
```

### HeatmapResponse
```python
{
    "sectors": List[SectorHeatmapItem],
    "total_value": float,
    "last_updated": str  # ISO 8601
}

SectorHeatmapItem {
    "sector": str,
    "value": float,          # 섹터별 시장 가치
    "change_percent": float,  # 가중 평균 변동률
    "asset_count": int,      # 해당 섹터 자산 개수
    "risk_level": str        # "high", "medium", "low"
}
```

### RiskMetricsResponse
```python
{
    "volatility": float,      # 변동성 (%)
    "mdd": float,            # 최대 낙폭 (%)
    "beta": float,           # 베타
    "sharpe_ratio": float,   # 샤프 비율 (선택사항)
    "recommendation": str,   # 리밸런싱 권장 메시지
    "risk_level": str,       # "high", "medium", "low"
    "last_updated": str      # ISO 8601
}
```

## 서비스 분리 이점

### 독립적 스케일링
- 시세 조회와 분석 작업 분리
- 분석 작업만 별도로 확장 가능
- 리소스 할당 최적화

### 관심사 분리
- 시세 데이터: `market-data-svc` (포트 8001)
- 분석 로직: `analytics-svc` (포트 8003)

### 성능 개선
- 무거운 작업(위험 지표 계산)이 가벼운 작업(시세 조회)에 영향 없음
- 비동기 처리로 응답성 향상

### 배포 독립성
- 각 서비스 독립 배포/재시작 가능
- 장애 격리

## 비동기 작업 처리

### BackgroundTasks 사용

```python
@app.post("/api/analytics/risk")
async def calculate_risk_metrics(
    portfolio_assets: List[PortfolioAssetRequest],
    background_tasks: BackgroundTasks
):
    job_id = str(uuid.uuid4())
    background_tasks.add_task(process_risk_metrics, job_id, assets_dict)
    return {"job_id": job_id, "status": "processing"}
```

### 작업 상태 추적

**인메모리 캐시** (현재):
- `job_cache = {}`: 작업 ID별 상태 저장
- 프로세스 재시작 시 손실

**향후 개선**:
- Redis 캐싱으로 영구 저장
- 작업 큐 시스템 (Celery/RQ)
- 웹소켓으로 실시간 진행 상황 전송

## 성능 최적화

### 병렬 데이터 수집
- 여러 자산의 가격 데이터를 병렬로 조회
- yfinance API 호출 최적화

### 데이터 기간 제한
- 기본 30일 데이터로 제한
- 계산 시간 단축

### 에러 핸들링
- 일부 자산 데이터 실패 시에도 다른 자산으로 계산 진행
- 폴백 값 사용

## 계산 알고리즘

### 히트맵 생성
1. 각 자산을 섹터로 분류 (`classify_sector`)
2. 섹터별 집계:
   - 시장 가치 합계
   - 가중 평균 변동률 계산
   - 자산 개수
3. 위험 수준 판정
4. 변동률 기준 정렬

### 위험 지표 계산
1. 각 자산의 30일 가격 데이터 수집
2. 일별 포트폴리오 총 가치 계산
3. 일일 수익률 계산: `(오늘 - 어제) / 어제 * 100`
4. 통계 계산:
   - 변동성: 수익률 표준편차
   - MDD: 최고점 대비 최저점
   - 베타: S&P 500 대비 공분산/분산
   - 샤프 비율: 평균 수익률 / 변동성

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

## 트러블슈팅

### 포트가 이미 사용 중인 경우

**Windows**:
```cmd
# 포트 사용 확인
netstat -ano | findstr :8003

# 프로세스 종료 (PID 확인 후)
taskkill /PID [PID번호] /F
```

**Linux/Mac**:
```bash
# 포트 사용 확인
lsof -i :8003

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

### NumPy/Pandas 설치 오류
```bash
pip install --upgrade pip
pip install numpy pandas
```

### 계산 시간 오래 걸림
- 자산 개수가 많을수록 계산 시간 증가
- 비동기 방식 사용 권장 (`/api/analytics/risk`)
- 백엔드 타임아웃 설정 확인 (30초)

### 데이터 부족 오류
- 일부 자산은 과거 데이터가 없을 수 있음
- 폴백 로직으로 현재 가치 사용

### yfinance API 제한
- 과도한 요청 시 일시적 제한 가능
- 백엔드에서 캐싱 활용 권장

## 향후 개선 사항

### Redis 캐싱
- 작업 결과 영구 저장
- 작업 상태 추적

### 작업 큐 시스템
- **Celery**: 분산 작업 큐
- **RQ**: Redis 기반 작업 큐
- 워커 프로세스 분리

### 실시간 진행 상황
- WebSocket으로 진행률 전송
- 프론트엔드에서 진행 바 표시

### 추가 지표
- Sortino Ratio (하방 위험 중심)
- Treynor Ratio (시장 위험 중심)
- Information Ratio (벤치마크 대비)
