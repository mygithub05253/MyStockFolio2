from pydantic import BaseModel
from typing import List, Optional

class PriceResponse(BaseModel):
    ticker: str
    price: float
    currency: str = "USD"
    last_updated: str

class ChartPoint(BaseModel):
    date: str
    price: float

class ChartResponse(BaseModel):
    ticker: str
    history: List[ChartPoint]

class DetailedQuoteResponse(BaseModel):
    ticker: str
    name: str
    current_price: float
    open_price: float
    high_price: float
    low_price: float
    previous_close: float
    volume: int
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    change: float
    change_percent: float
    currency: str
    last_updated: str

class PopularItem(BaseModel):
    ticker: str
    name: str
    current_price: float
    change_percent: float
    currency: str
    category: str = "stock"

class SuggestItem(BaseModel):
    ticker: str
    name: str
    type: str
    sector: str = ""
    market: str = ""

# ⚠️ 분석 관련 모델은 analytics-svc/app/models.py로 이동되었습니다.
# SectorHeatmapItem, HeatmapResponse, RiskMetricsResponse는 더 이상 사용되지 않습니다.

