import logging
from datetime import datetime
import yfinance as yf
from typing import List, Dict
from .models import PopularItem
from .api_providers import DataServiceWithFallback
import json
import os

logger = logging.getLogger(__name__)

class MarketDataService:
    @staticmethod
    def fetch_price(ticker: str) -> Dict:
        try:
            result = DataServiceWithFallback.fetch_price(ticker)
            last_updated = datetime.now().isoformat() + "Z"
            
            return {
                "ticker": ticker.upper(),
                "price": result["price"],
                "currency": result["currency"],
                "last_updated": last_updated,
                "provider": result.get("provider", "unknown")
            }
        except Exception as e:
            logger.error(f"All providers failed for {ticker}: {str(e)}")
            raise ValueError(f"No price data for {ticker}")
    
    @staticmethod
    def fetch_chart(ticker: str, period: str = "7d") -> List[Dict]:
        try:
            return DataServiceWithFallback.fetch_chart(ticker, period)
        except Exception as e:
            logger.error(f"Chart fetch failed for {ticker}: {str(e)}")
            raise ValueError(f"No historical data for {ticker}")
    
    @staticmethod
    def fetch_detailed_quote(ticker: str) -> Dict:
        try:
            result = DataServiceWithFallback.fetch_detailed_quote(ticker)
            last_updated = datetime.now().isoformat() + "Z"
            
            return {
                "ticker": ticker.upper(),
                "name": result["name"],
                "current_price": result["current_price"],
                "open_price": result["open_price"],
                "high_price": result["high_price"],
                "low_price": result["low_price"],
                "previous_close": result["previous_close"],
                "volume": result["volume"],
                "market_cap": result.get("market_cap"),
                "pe_ratio": result.get("pe_ratio"),
                "change": result["change"],
                "change_percent": result["change_percent"],
                "currency": result["currency"],
                "last_updated": last_updated,
                "provider": result.get("provider", "unknown")
            }
        except Exception as e:
            logger.error(f"All providers failed for {ticker}: {str(e)}")
            raise ValueError(f"No quote data for {ticker}")
    
    @staticmethod
    def fetch_popular() -> List[PopularItem]:
        tickers = [
            ("AAPL", "stock"), ("MSFT", "stock"), ("GOOGL", "stock"), ("TSLA", "stock"), ("AMZN", "stock"),
            ("NVDA", "stock"), ("META", "stock"),
            ("005930.KS", "stock"), ("000660.KS", "stock"), ("035420.KS", "stock"),
            ("BTC-USD", "coin"), ("ETH-USD", "coin"), ("SOL-USD", "coin"),
            ("TLT", "bond"), ("IEF", "bond"), ("HYG", "bond"),
            ("SPY", "etf"), ("QQQ", "etf"), ("VIXY", "etf")
        ]
        
        results = []
        for t, cat in tickers:
            try:
                stock = yf.Ticker(t)
                info = stock.info
                price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose')
                prev = info.get('previousClose') or price or 0
                name = info.get('longName') or info.get('shortName') or t
                currency = info.get('currency', 'USD')
                if price is None:
                    continue
                change_percent = ((price - prev) / prev * 100) if prev else 0
                results.append(PopularItem(
                    ticker=t.upper(),
                    name=name,
                    current_price=float(price),
                    change_percent=float(change_percent),
                    currency=currency,
                    category=cat
                ))
            except Exception as e:
                logger.warning(f"Popular fetch failed for {t}: {str(e)}")
                continue
        
        return results
    
    @staticmethod
    def fetch_top(category: str = "gainers") -> List[PopularItem]:
        tickers = [
            ("AAPL", "stock"), ("MSFT", "stock"), ("GOOGL", "stock"), ("TSLA", "stock"), ("AMZN", "stock"),
            ("NVDA", "stock"), ("META", "stock"),
            ("005930.KS", "stock"), ("000660.KS", "stock"), ("035420.KS", "stock"),
            ("BTC-USD", "coin"), ("ETH-USD", "coin"), ("SOL-USD", "coin"),
            ("TLT", "bond"), ("IEF", "bond"), ("HYG", "bond"),
            ("SPY", "etf"), ("QQQ", "etf"), ("VIXY", "etf")
        ]
        
        items = []
        for t, cat in tickers:
            try:
                stock = yf.Ticker(t)
                info = stock.info
                price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose')
                prev = info.get('previousClose') or price or 0
                volume = info.get('volume') or info.get('regularMarketVolume') or 0
                if price is None:
                    continue
                chg_pct = ((price - prev) / prev * 100) if prev else 0
                name = info.get('longName') or info.get('shortName') or t
                currency = info.get('currency', 'USD')
                items.append(PopularItem(
                    ticker=t.upper(),
                    name=name,
                    current_price=float(price),
                    change_percent=float(chg_pct),
                    currency=currency,
                    category=cat
                ))
                items[-1].__dict__['volume'] = int(volume)
            except Exception:
                continue
        
        if category == 'losers':
            items.sort(key=lambda x: x.change_percent)
        elif category == 'active':
            items.sort(key=lambda x: x.__dict__.get('volume', 0), reverse=True)
        else:
            items.sort(key=lambda x: x.change_percent, reverse=True)
        
        return items[:10]
    
    @staticmethod
    def fetch_indices() -> List[Dict]:
        indices = [
            {"symbol": "^IXIC", "name": "나스닥", "display": "NASDAQ"},
            {"symbol": "^DJI", "name": "다우존스", "display": "Dow Jones"},
            {"symbol": "^GSPC", "name": "S&P 500", "display": "S&P 500"},
            {"symbol": "^KS11", "name": "코스피", "display": "KOSPI"},
            {"symbol": "^KQ11", "name": "코스닥", "display": "KOSDAQ"}
        ]
        
        results = []
        for idx in indices:
            try:
                stock = yf.Ticker(idx["symbol"])
                info = stock.info
                price = info.get('regularMarketPrice') or info.get('currentPrice') or info.get('previousClose')
                prev = info.get('previousClose') or price or 0
                if price is None:
                    continue
                chg_pct = ((price - prev) / prev * 100) if prev else 0
                results.append({
                    "symbol": idx["symbol"],
                    "name": idx["name"],
                    "display": idx["display"],
                    "value": float(price),
                    "change_percent": float(chg_pct)
                })
            except Exception as e:
                logger.error(f"Index fetch error {idx['symbol']}: {e}")
                continue
        
        return results
    
    @staticmethod
    def load_ticker_database() -> List[Dict]:
        """티커 데이터베이스 로드"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), "ticker_database.json")
            if os.path.exists(db_path):
                with open(db_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                logger.warn(f"티커 데이터베이스 파일을 찾을 수 없습니다: {db_path}")
                return []
        except Exception as e:
            logger.error(f"티커 데이터베이스 로드 실패: {e}")
            return []
    
    @staticmethod
    def suggest_tickers(q: str) -> List[Dict]:
        """종목명 또는 티커로 검색 (강화된 버전)"""
        if not q or len(q.strip()) < 1:
            return []
        
        q_lower = q.strip().lower()
        ticker_db = MarketDataService.load_ticker_database()
        
        # 검색 결과 리스트
        results = []
        
        # 1. 정확한 티커 매칭 (우선순위 높음)
        exact_ticker_matches = [
            item for item in ticker_db
            if item.get('ticker', '').lower() == q_lower
        ]
        results.extend(exact_ticker_matches)
        
        # 2. 티커 부분 매칭
        ticker_partial_matches = [
            item for item in ticker_db
            if q_lower in item.get('ticker', '').lower() and item not in results
        ]
        results.extend(ticker_partial_matches)
        
        # 3. 종목명 매칭 (한글명 포함)
        name_matches = [
            item for item in ticker_db
            if (q_lower in item.get('name', '').lower() or 
                q_lower in item.get('name_ko', '').lower()) and item not in results
        ]
        results.extend(name_matches)
        
        # 결과 포맷팅 및 제한
        formatted_results = []
        for item in results[:15]:  # 최대 15개
            formatted_results.append({
                "ticker": item.get('ticker', ''),
                "name": item.get('name_ko') or item.get('name', ''),
                "type": item.get('type', 'stock'),
                "sector": item.get('sector', ''),
                "market": item.get('market', '')
            })
        
        logger.info(f"티커 검색 완료 - 쿼리: '{q}', 결과: {len(formatted_results)}개")
        return formatted_results
    
    # ⚠️ 분석 관련 메서드(classify_sector, generate_heatmap, calculate_risk_metrics)는
    # analytics-svc/app/service.py로 이동되었습니다.
