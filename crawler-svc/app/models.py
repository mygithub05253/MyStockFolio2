from pydantic import BaseModel
from typing import Optional, List, Dict


class KRStockInfo(BaseModel):
    """
    한국 주식 기본 정보 모델
    """
    ticker: str
    name: str
    market: str  # KOSPI, KOSDAQ 등
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[float] = None
    listed_shares: Optional[int] = None
    website: Optional[str] = None


class KRStockQuote(BaseModel):
    """
    한국 주식 시세 정보 모델
    """
    ticker: str
    name: str
    current_price: float
    previous_close: float
    change: float
    change_percent: float
    volume: int
    high_price: float
    low_price: float
    open_price: float
    currency: str = "KRW"


class BondInfo(BaseModel):
    """
    채권 정보 모델
    """
    bond_type: str  # 국고채3년, 회사채3년 등
    name: str
    yield_rate: Optional[float] = None  # 수익률
    maturity: Optional[str] = None  # 만기일
    coupon_rate: Optional[float] = None  # 이자율
    last_updated: Optional[str] = None


class IndexInfo(BaseModel):
    """
    지수 정보 모델
    """
    index_code: str  # MSCI_ACWI, FTSE_100 등
    name: str
    current_value: float
    change: float
    change_percent: float
    last_updated: Optional[str] = None

