from pydantic import BaseModel
from typing import List, Optional

class SectorHeatmapItem(BaseModel):
    sector: str
    value: float
    change_percent: float
    asset_count: int
    risk_level: str

class HeatmapResponse(BaseModel):
    sectors: List[SectorHeatmapItem]
    total_value: float
    last_updated: str

class RiskMetricsResponse(BaseModel):
    volatility: float
    mdd: float
    beta: float
    sharpe_ratio: Optional[float] = None
    recommendation: str
    risk_level: str
    last_updated: str

