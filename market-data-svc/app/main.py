from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import logging
from .models import PriceResponse, ChartResponse, DetailedQuoteResponse, PopularItem, SuggestItem, ChartPoint
from .service import MarketDataService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Market Data Service",
    description="Provides real-time and historical financial data.",
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

service = MarketDataService()

@app.get("/api/market/price", response_model=PriceResponse, status_code=status.HTTP_200_OK)
async def get_current_price(ticker: str):
    logger.info(f"Price request received for ticker: {ticker}")
    
    try:
        data = service.fetch_price(ticker)
        logger.info(f"Price fetched for {ticker}: {data['price']} {data['currency']}")
        return PriceResponse(**data)
    except ValueError as e:
        logger.warning(f"No price data found for ticker: {ticker}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching price for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch price data for '{ticker}'")

@app.get("/api/market/chart", response_model=ChartResponse, status_code=status.HTTP_200_OK)
async def get_historical_chart(ticker: str, period: str = "7d"):
    logger.info(f"Chart request received for ticker: {ticker}, period: {period}")
    
    try:
        chart_data_raw = service.fetch_chart(ticker, period)
        chart_points = [ChartPoint(**item) for item in chart_data_raw]
        logger.info(f"Chart data fetched for {ticker}: {len(chart_points)} data points")
        return ChartResponse(ticker=ticker.upper(), history=chart_points)
    except ValueError as e:
        logger.warning(f"No historical data found for ticker: {ticker}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching chart for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch chart data for '{ticker}'")

@app.get("/api/market/quote", response_model=DetailedQuoteResponse, status_code=status.HTTP_200_OK)
async def get_detailed_quote(ticker: str):
    logger.info(f"Detailed quote request received for ticker: {ticker}")
    
    try:
        data = service.fetch_detailed_quote(ticker)
        logger.info(f"Detailed quote fetched for {ticker}: {data['current_price']} {data['currency']}")
        return DetailedQuoteResponse(**data)
    except ValueError as e:
        logger.warning(f"No quote data found for ticker: {ticker}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching detailed quote for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch detailed quote for '{ticker}'")

@app.get("/api/market/popular", response_model=List[PopularItem], status_code=status.HTTP_200_OK)
async def get_popular():
    logger.info("Popular request received")
    try:
        return service.fetch_popular()
    except Exception as e:
        logger.error(f"Error fetching popular: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch popular items")

@app.get("/api/market/suggest", response_model=List[SuggestItem], status_code=status.HTTP_200_OK)
async def suggest(q: str):
    logger.info(f"Suggest request received for query: {q}")
    try:
        results = service.suggest_tickers(q)
        return [SuggestItem(**item) for item in results]
    except Exception as e:
        logger.error(f"Error suggesting tickers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to suggest tickers")

@app.get("/api/market/top", response_model=List[PopularItem], status_code=status.HTTP_200_OK)
async def top(category: str = "gainers"):
    logger.info(f"Top request received for category: {category}")
    try:
        return service.fetch_top(category)
    except Exception as e:
        logger.error(f"Error fetching top: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch top movers")

@app.get("/api/market/indices", response_model=List[Dict], status_code=status.HTTP_200_OK)
async def get_market_indices():
    logger.info("Indices request received")
    try:
        return service.fetch_indices()
    except Exception as e:
        logger.error(f"Error fetching indices: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch indices")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "market-data-svc"}

# ⚠️ 분석 관련 엔드포인트는 analytics-svc(포트 8003)로 이동되었습니다.
# 기존 호환성을 위해 리다이렉트 또는 deprecated 메시지 표시 가능
