import logging
from datetime import datetime, timedelta
import yfinance as yf
from typing import List, Dict
from .models import SectorHeatmapItem, HeatmapResponse, RiskMetricsResponse
from collections import defaultdict
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

class AnalyticsService:
    @staticmethod
    def classify_sector(ticker: str, asset_type: str, name: str = "") -> str:
        """티커와 자산 유형을 기반으로 섹터 분류"""
        ticker_upper = ticker.upper()
        name_lower = name.lower()
        
        # 한국 주식 섹터 분류
        if ticker.endswith('.KS') or ticker.endswith('.KQ'):
            if '삼성' in name or '005930' in ticker or 'SK하이닉스' in name or '000660' in ticker:
                return "반도체"
            elif '네이버' in name or '035420' in ticker or '카카오' in name:
                return "IT서비스"
            elif '은행' in name or '금융' in name or '증권' in name:
                return "금융"
            elif '바이오' in name or '제약' in name or '화학' in name:
                return "바이오/화학"
            elif '자동차' in name or '현대' in name or '기아' in name:
                return "자동차"
            else:
                return "기타"
        
        # 미국 주식 섹터 분류
        elif asset_type in ['stock', 'STOCK']:
            tech_keywords = ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'AMD', 'INTC', 'ORCL']
            finance_keywords = ['JPM', 'BAC', 'GS', 'MS', 'WFC']
            healthcare_keywords = ['JNJ', 'PFE', 'UNH', 'ABT', 'TMO']
            consumer_keywords = ['AMZN', 'TSLA', 'NKE', 'MCD', 'SBUX']
            energy_keywords = ['XOM', 'CVX', 'SLB', 'COP']
            
            if any(k in ticker_upper for k in tech_keywords) or 'tech' in name_lower or 'technology' in name_lower:
                return "기술"
            elif any(k in ticker_upper for k in finance_keywords) or 'bank' in name_lower or 'financial' in name_lower:
                return "금융"
            elif any(k in ticker_upper for k in healthcare_keywords) or 'health' in name_lower or 'pharma' in name_lower:
                return "헬스케어"
            elif any(k in ticker_upper for k in consumer_keywords) or 'consumer' in name_lower:
                return "소비재"
            elif any(k in ticker_upper for k in energy_keywords) or 'energy' in name_lower or 'oil' in name_lower:
                return "에너지"
            else:
                return "기타"
        
        # 코인/DeFi 분류
        elif asset_type in ['coin', 'COIN', 'DEFI', 'defi']:
            if 'BTC' in ticker_upper or 'BITCOIN' in name_lower:
                return "Layer1"
            elif 'ETH' in ticker_upper or 'ETHEREUM' in name_lower:
                return "Layer1"
            elif 'DEFI' in ticker_upper or 'DEFI' in name_lower or 'DEX' in name_lower:
                return "DeFi"
            elif 'NFT' in ticker_upper or 'NFT' in name_lower:
                return "NFT"
            else:
                return "암호화폐"
        
        # ETF/채권 분류
        elif asset_type in ['etf', 'ETF', 'bond', 'BOND']:
            if asset_type in ['etf', 'ETF']:
                return "ETF"
            else:
                return "채권"
        
        return "기타"
    
    @staticmethod
    def generate_heatmap(portfolio_assets: List[Dict]) -> HeatmapResponse:
        """포트폴리오 자산을 기반으로 히트맵 데이터 생성"""
        sector_data = defaultdict(lambda: {'value': 0.0, 'change_sum': 0.0, 'count': 0, 'assets': []})
        
        for asset in portfolio_assets:
            ticker = asset.get('ticker', '')
            asset_type = asset.get('assetType', '')
            name = asset.get('name', '')
            quantity = asset.get('quantity', 0)
            current_price = asset.get('currentPrice', 0)
            change_percent = asset.get('changePercent', 0)
            
            # 섹터 분류
            sector = AnalyticsService.classify_sector(ticker, asset_type, name)
            
            # 섹터별 집계
            market_value = quantity * current_price
            sector_data[sector]['value'] += market_value
            sector_data[sector]['change_sum'] += change_percent * market_value
            sector_data[sector]['count'] += 1
            sector_data[sector]['assets'].append(ticker)
        
        # 섹터별 가중 평균 변동률 계산 및 위험 수준 판정
        sectors = []
        total_value = sum(data['value'] for data in sector_data.values())
        
        for sector, data in sector_data.items():
            if data['value'] > 0:
                weighted_change = data['change_sum'] / data['value'] if data['value'] > 0 else 0
                
                if abs(weighted_change) > 5:
                    risk_level = "high"
                elif abs(weighted_change) > 2:
                    risk_level = "medium"
                else:
                    risk_level = "low"
                
                sectors.append(SectorHeatmapItem(
                    sector=sector,
                    value=round(data['value'], 2),
                    change_percent=round(weighted_change, 2),
                    asset_count=data['count'],
                    risk_level=risk_level
                ))
        
        sectors.sort(key=lambda x: x.change_percent, reverse=True)
        
        return HeatmapResponse(
            sectors=sectors,
            total_value=round(total_value, 2),
            last_updated=datetime.now().isoformat() + "Z"
        )
    
    @staticmethod
    def calculate_risk_metrics(portfolio_assets: List[Dict]) -> RiskMetricsResponse:
        """포트폴리오의 위험 지표 계산 (변동성, MDD, 베타, 샤프 비율) - 최적화 버전"""
        if not portfolio_assets:
            return RiskMetricsResponse(
                volatility=0.0,
                mdd=0.0,
                beta=1.0,
                sharpe_ratio=0.0,
                recommendation="자산이 없습니다.",
                risk_level="low",
                last_updated=datetime.now().isoformat() + "Z"
            )
        
        price_history = []
        
        try:
            portfolio_values_by_date = {}
            
            for asset in portfolio_assets:
                ticker = asset.get('ticker', '')
                quantity = asset.get('quantity', 0)
                current_price = asset.get('currentPrice', 0)
                
                try:
                    stock = yf.Ticker(ticker)
                    hist = stock.history(period="1mo")
                    
                    if not hist.empty:
                        for date, row in hist.iterrows():
                            date_str = date.strftime('%Y-%m-%d')
                            price = float(row['Close'])
                            if date_str not in portfolio_values_by_date:
                                portfolio_values_by_date[date_str] = 0.0
                            portfolio_values_by_date[date_str] += quantity * price
                    else:
                        current_value = quantity * current_price
                        for i in range(30):
                            date_str = (datetime.now() - timedelta(days=30-i)).strftime('%Y-%m-%d')
                            if date_str not in portfolio_values_by_date:
                                portfolio_values_by_date[date_str] = 0.0
                            portfolio_values_by_date[date_str] += current_value
                except Exception as e:
                    logger.debug(f"가격 조회 실패 {ticker}: {e}")
                    current_value = quantity * current_price
                    for i in range(30):
                        date_str = (datetime.now() - timedelta(days=30-i)).strftime('%Y-%m-%d')
                        if date_str not in portfolio_values_by_date:
                            portfolio_values_by_date[date_str] = 0.0
                        portfolio_values_by_date[date_str] += current_value
            
            sorted_dates = sorted(portfolio_values_by_date.keys())
            price_history = [portfolio_values_by_date[d] for d in sorted_dates]
            
            if len(price_history) < 5:
                current_total = sum(a.get('quantity', 0) * a.get('currentPrice', 0) for a in portfolio_assets)
                price_history = [current_total] * 30
        except Exception as e:
            logger.error(f"히스토리 데이터 수집 실패: {e}")
            current_total = sum(a.get('quantity', 0) * a.get('currentPrice', 0) for a in portfolio_assets)
            price_history = [current_total] * 30
        
        if len(price_history) < 2:
            return RiskMetricsResponse(
                volatility=0.0,
                mdd=0.0,
                beta=1.0,
                sharpe_ratio=0.0,
                recommendation="충분한 가격 데이터가 없습니다.",
                risk_level="low",
                last_updated=datetime.now().isoformat() + "Z"
            )
        
        values_array = np.array(price_history)
        returns = np.diff(values_array) / values_array[:-1] * 100
        volatility = float(np.std(returns)) if len(returns) > 0 else 0.0
        
        peak = np.maximum.accumulate(values_array)
        drawdown = (values_array - peak) / peak * 100
        mdd = float(abs(np.min(drawdown))) if len(drawdown) > 0 else 0.0
        
        try:
            sp500 = yf.Ticker("^GSPC")
            sp500_hist = sp500.history(period="30d")
            if not sp500_hist.empty and len(sp500_hist) >= len(values_array):
                sp500_values = sp500_hist['Close'].values[-len(values_array):]
                sp500_returns = np.diff(sp500_values) / sp500_values[:-1] * 100
                
                if len(returns) > 0 and len(sp500_returns) > 0 and len(returns) == len(sp500_returns):
                    min_len = min(len(returns), len(sp500_returns))
                    returns_aligned = returns[:min_len]
                    sp500_returns_aligned = sp500_returns[:min_len]
                    
                    covariance = np.cov(returns_aligned, sp500_returns_aligned)[0][1]
                    sp500_variance = np.var(sp500_returns_aligned)
                    beta = float(covariance / sp500_variance) if sp500_variance > 0 else 1.0
                else:
                    beta = 1.0
            else:
                beta = 1.0
        except Exception as e:
            logger.warn(f"베타 계산 실패: {e}")
            beta = 1.0
        
        avg_return = float(np.mean(returns)) if len(returns) > 0 else 0.0
        sharpe_ratio = (avg_return / volatility) if volatility > 0 else 0.0
        
        if volatility > 20 or mdd > 15:
            risk_level = "high"
            recommendation = "높은 변동성 또는 큰 낙폭이 감지되었습니다. 리밸런싱을 고려해보세요."
        elif volatility > 10 or mdd > 8:
            risk_level = "medium"
            recommendation = "적당한 변동성이 있습니다. 주의 깊게 관찰하세요."
        else:
            risk_level = "low"
            recommendation = "안정적인 포트폴리오입니다."
        
        return RiskMetricsResponse(
            volatility=round(volatility, 2),
            mdd=round(mdd, 2),
            beta=round(beta, 2),
            sharpe_ratio=round(sharpe_ratio, 2),
            recommendation=recommendation,
            risk_level=risk_level,
            last_updated=datetime.now().isoformat() + "Z"
        )

