from fastapi import FastAPI, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import logging
import uuid
from datetime import datetime
from .models import HeatmapResponse, RiskMetricsResponse
from .service import AnalyticsService
from pydantic import BaseModel

# 간단한 인메모리 캐시 (프로덕션에서는 Redis 사용 권장)
job_cache = {}

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Analytics Service",
    description="포트폴리오 분석 및 위험 지표 계산 서비스",
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

service = AnalyticsService()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "analytics-svc"}

# 히트맵 분석 엔드포인트
class PortfolioAssetRequest(BaseModel):
    ticker: str
    assetType: str
    name: str
    quantity: float
    currentPrice: float
    changePercent: float

@app.post("/api/analytics/heatmap", response_model=HeatmapResponse, status_code=status.HTTP_200_OK)
async def generate_heatmap(portfolio_assets: List[PortfolioAssetRequest]):
    logger.info(f"Heatmap request received for {len(portfolio_assets)} assets")
    
    try:
        assets_dict = [
            {
                "ticker": asset.ticker,
                "assetType": asset.assetType,
                "name": asset.name,
                "quantity": asset.quantity,
                "currentPrice": asset.currentPrice,
                "changePercent": asset.changePercent
            }
            for asset in portfolio_assets
        ]
        
        heatmap = service.generate_heatmap(assets_dict)
        logger.info(f"Heatmap generated: {len(heatmap.sectors)} sectors")
        return heatmap
    except Exception as e:
        logger.error(f"Error generating heatmap: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate heatmap: {str(e)}")

# 위험 지표 계산 엔드포인트 (비동기 처리)
@app.post("/api/analytics/risk", status_code=status.HTTP_202_ACCEPTED)
async def calculate_risk_metrics(
    portfolio_assets: List[PortfolioAssetRequest],
    background_tasks: BackgroundTasks
):
    logger.info(f"Risk metrics request received for {len(portfolio_assets)} assets")
    
    job_id = str(uuid.uuid4())
    
    assets_dict = [
        {
            "ticker": asset.ticker,
            "assetType": asset.assetType,
            "name": asset.name,
            "quantity": asset.quantity,
            "currentPrice": asset.currentPrice,
            "changePercent": asset.changePercent
        }
        for asset in portfolio_assets
    ]
    
    background_tasks.add_task(process_risk_metrics, job_id, assets_dict)
    job_cache[job_id] = {"status": "processing", "created_at": datetime.now().isoformat()}
    
    return {
        "job_id": job_id,
        "status": "processing",
        "message": "위험 지표 계산이 시작되었습니다. /api/analytics/risk/{job_id} 엔드포인트로 결과를 조회하세요."
    }

async def process_risk_metrics(job_id: str, assets_dict: List[dict]):
    """백그라운드에서 위험 지표 계산"""
    try:
        logger.info(f"Starting risk metrics calculation for job {job_id}")
        risk_metrics = service.calculate_risk_metrics(assets_dict)
        job_cache[job_id] = {
            "status": "completed",
            "result": risk_metrics.dict(),
            "completed_at": datetime.now().isoformat()
        }
        logger.info(f"Risk metrics calculation completed for job {job_id}")
    except Exception as e:
        logger.error(f"Error calculating risk metrics for job {job_id}: {str(e)}")
        job_cache[job_id] = {
            "status": "failed",
            "error": str(e),
            "failed_at": datetime.now().isoformat()
        }

@app.get("/api/analytics/risk/{job_id}", response_model=RiskMetricsResponse, status_code=status.HTTP_200_OK)
async def get_risk_metrics_result(job_id: str):
    """작업 결과 조회"""
    if job_id not in job_cache:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_data = job_cache[job_id]
    
    if job_data["status"] == "processing":
        raise HTTPException(status_code=202, detail="Job is still processing")
    elif job_data["status"] == "failed":
        raise HTTPException(status_code=500, detail=f"Job failed: {job_data.get('error', 'Unknown error')}")
    else:
        return RiskMetricsResponse(**job_data["result"])

# 위험 지표 계산 엔드포인트 (동기 방식 - 기존 호환성 유지)
@app.post("/api/analytics/risk/sync", response_model=RiskMetricsResponse, status_code=status.HTTP_200_OK)
async def calculate_risk_metrics_sync(portfolio_assets: List[PortfolioAssetRequest]):
    """위험 지표 계산 (동기 방식 - 즉시 결과 반환)"""
    logger.info(f"Risk metrics sync request received for {len(portfolio_assets)} assets")
    
    try:
        assets_dict = [
            {
                "ticker": asset.ticker,
                "assetType": asset.assetType,
                "name": asset.name,
                "quantity": asset.quantity,
                "currentPrice": asset.currentPrice,
                "changePercent": asset.changePercent
            }
            for asset in portfolio_assets
        ]
        
        risk_metrics = service.calculate_risk_metrics(assets_dict)
        logger.info(f"Risk metrics calculated: volatility={risk_metrics.volatility}%, mdd={risk_metrics.mdd}%, beta={risk_metrics.beta}")
        return risk_metrics
    except Exception as e:
        logger.error(f"Error calculating risk metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate risk metrics: {str(e)}")

