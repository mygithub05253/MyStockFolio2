from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
import logging
from .models import KRStockInfo, KRStockQuote, BondInfo, IndexInfo
from .crawler import KoreanStockCrawler, BondCrawler, IndexCrawler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Crawler Service",
    description="Korean stock, ETF, bond, and index data crawler service.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

korean_stock_crawler = KoreanStockCrawler()
bond_crawler = BondCrawler()
index_crawler = IndexCrawler()


@app.get("/api/crawler/kr-stock/info/{ticker}", response_model=KRStockInfo, status_code=status.HTTP_200_OK)
async def get_kr_stock_info(ticker: str):
    """
    한국 주식 기본 정보 조회
    ticker: 6자리 숫자 티커 (예: 005930)
    """
    logger.info(f"KR stock info request for ticker: {ticker}")
    try:
        data = korean_stock_crawler.fetch_stock_info(ticker)
        if not data:
            raise HTTPException(status_code=404, detail=f"No data found for ticker: {ticker}")
        return KRStockInfo(**data)
    except Exception as e:
        logger.error(f"Error fetching KR stock info for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch stock info for '{ticker}'")


@app.get("/api/crawler/kr-stock/quote/{ticker}", response_model=KRStockQuote, status_code=status.HTTP_200_OK)
async def get_kr_stock_quote(ticker: str):
    """
    한국 주식 시세 정보 조회
    ticker: 6자리 숫자 티커 (예: 005930)
    """
    logger.info(f"KR stock quote request for ticker: {ticker}")
    try:
        data = korean_stock_crawler.fetch_stock_quote(ticker)
        if not data:
            raise HTTPException(status_code=404, detail=f"No data found for ticker: {ticker}")
        return KRStockQuote(**data)
    except Exception as e:
        logger.error(f"Error fetching KR stock quote for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch stock quote for '{ticker}'")


@app.get("/api/crawler/kr-stock/financial/{ticker}", response_model=Dict, status_code=status.HTTP_200_OK)
async def get_kr_stock_financial(ticker: str):
    """
    한국 주식 재무정보 조회
    ticker: 6자리 숫자 티커 (예: 005930)
    """
    logger.info(f"KR stock financial request for ticker: {ticker}")
    try:
        data = korean_stock_crawler.fetch_financial_info(ticker)
        if not data:
            raise HTTPException(status_code=404, detail=f"No data found for ticker: {ticker}")
        return data
    except Exception as e:
        logger.error(f"Error fetching KR stock financial for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch financial info for '{ticker}'")


@app.get("/api/crawler/kr-stock/news/{ticker}", response_model=List[Dict], status_code=status.HTTP_200_OK)
async def get_kr_stock_news(ticker: str, limit: int = 10):
    """
    한국 주식 뉴스 조회
    ticker: 6자리 숫자 티커 (예: 005930)
    limit: 최대 뉴스 개수 (기본값: 10)
    """
    logger.info(f"KR stock news request for ticker: {ticker}")
    try:
        data = korean_stock_crawler.fetch_news(ticker, limit)
        return data
    except Exception as e:
        logger.error(f"Error fetching KR stock news for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch news for '{ticker}'")


@app.get("/api/crawler/bond/list", response_model=List[BondInfo], status_code=status.HTTP_200_OK)
async def get_bond_list():
    """
    채권 목록 조회 (국고채, 회사채 등)
    """
    logger.info("Bond list request")
    try:
        data = bond_crawler.fetch_bond_list()
        return [BondInfo(**item) for item in data]
    except Exception as e:
        logger.error(f"Error fetching bond list: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch bond list")


@app.get("/api/crawler/bond/{bond_type}", response_model=BondInfo, status_code=status.HTTP_200_OK)
async def get_bond_info(bond_type: str):
    """
    특정 채권 정보 조회
    bond_type: 국고채3년, 국고채5년, 회사채3년 등
    """
    logger.info(f"Bond info request for type: {bond_type}")
    try:
        data = bond_crawler.fetch_bond_info(bond_type)
        if not data:
            raise HTTPException(status_code=404, detail=f"No data found for bond type: {bond_type}")
        return BondInfo(**data)
    except Exception as e:
        logger.error(f"Error fetching bond info for {bond_type}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch bond info for '{bond_type}'")


@app.get("/api/crawler/index/list", response_model=List[IndexInfo], status_code=status.HTTP_200_OK)
async def get_index_list():
    """
    지수 목록 조회
    """
    logger.info("Index list request")
    try:
        data = index_crawler.fetch_index_list()
        return [IndexInfo(**item) for item in data]
    except Exception as e:
        logger.error(f"Error fetching index list: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch index list")


@app.get("/api/crawler/index/{index_code}", response_model=IndexInfo, status_code=status.HTTP_200_OK)
async def get_index_info(index_code: str):
    """
    특정 지수 정보 조회
    index_code: 지수 코드 (예: MSCI_ACWI, FTSE_100 등)
    """
    logger.info(f"Index info request for code: {index_code}")
    try:
        data = index_crawler.fetch_index_info(index_code)
        if not data:
            raise HTTPException(status_code=404, detail=f"No data found for index: {index_code}")
        return IndexInfo(**data)
    except Exception as e:
        logger.error(f"Error fetching index info for {index_code}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch index info for '{index_code}'")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "crawler-svc"}

