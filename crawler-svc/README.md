# Crawler Service

한국 주식, ETF, 채권, 지수 데이터를 크롤링하는 FastAPI 서비스입니다.

## 기능

- 한국 주식 기본 정보 조회 (회사명, 섹터, 시가총액)
- 한국 주식 시세 정보 조회 (현재가, 변동률, 거래량)
- 한국 주식 재무정보 조회
- 한국 주식 뉴스 조회
- 채권 정보 조회
- 지수 정보 조회

## 실행 방법

```bash
cd crawler-svc
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8005
```

API 문서: http://127.0.0.1:8005/docs

## API 엔드포인트

### 한국 주식

- `GET /api/crawler/kr-stock/info/{ticker}` - 주식 기본 정보
- `GET /api/crawler/kr-stock/quote/{ticker}` - 주식 시세 정보
- `GET /api/crawler/kr-stock/financial/{ticker}` - 재무정보
- `GET /api/crawler/kr-stock/news/{ticker}?limit=10` - 뉴스 목록

### 채권

- `GET /api/crawler/bond/list` - 채권 목록
- `GET /api/crawler/bond/{bond_type}` - 특정 채권 정보

### 지수

- `GET /api/crawler/index/list` - 지수 목록
- `GET /api/crawler/index/{index_code}` - 특정 지수 정보

## 주의사항

- Rate limiting 준수 (요청 간 최소 0.5초 간격)
- robots.txt 준수
- 법적/윤리적 고려사항 준수

