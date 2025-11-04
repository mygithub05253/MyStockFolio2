import logging
import os
from typing import Dict, Optional, List
import requests
from datetime import datetime
import yfinance as yf
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class YahooFinanceProvider:
    """Yahoo Finance API를 통한 데이터 제공"""
    
    @staticmethod
    def fetch_price(ticker: str) -> Optional[Dict]:
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            current_price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose')
            
            if current_price is None:
                return None
            
            currency = info.get('currency', 'USD')
            return {
                "price": float(current_price),
                "currency": currency,
                "provider": "yahoo"
            }
        except Exception as e:
            logger.warning(f"Yahoo Finance fetch_price failed for {ticker}: {str(e)}")
            return None
    
    @staticmethod
    def fetch_detailed_quote(ticker: str) -> Optional[Dict]:
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            current_price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose')
            if current_price is None:
                return None
            
            open_price = info.get('regularMarketOpen') or info.get('open') or current_price
            high_price = info.get('regularMarketDayHigh') or info.get('dayHigh') or current_price
            low_price = info.get('regularMarketDayLow') or info.get('dayLow') or current_price
            previous_close = info.get('previousClose') or info.get('regularMarketPreviousClose') or current_price
            volume = info.get('volume') or info.get('regularMarketVolume') or 0
            market_cap = info.get('marketCap')
            pe_ratio = info.get('trailingPE') or info.get('forwardPE')
            change = current_price - previous_close
            change_percent = (change / previous_close * 100) if previous_close != 0 else 0
            name = info.get('longName') or info.get('shortName') or ticker
            currency = info.get('currency', 'USD')
            
            return {
                "name": name,
                "current_price": float(current_price),
                "open_price": float(open_price),
                "high_price": float(high_price),
                "low_price": float(low_price),
                "previous_close": float(previous_close),
                "volume": int(volume),
                "market_cap": float(market_cap) if market_cap else None,
                "pe_ratio": float(pe_ratio) if pe_ratio else None,
                "change": float(change),
                "change_percent": float(change_percent),
                "currency": currency,
                "provider": "yahoo"
            }
        except Exception as e:
            logger.warning(f"Yahoo Finance fetch_detailed_quote failed for {ticker}: {str(e)}")
            return None
    
    @staticmethod
    def fetch_chart(ticker: str, period: str = "7d") -> Optional[List[Dict]]:
        try:
            stock = yf.Ticker(ticker)
            hist = stock.history(period=period)
            
            if hist.empty:
                return None
            
            chart_data = []
            for date, row in hist.iterrows():
                chart_data.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "price": float(row['Close'])
                })
            
            return chart_data
        except Exception as e:
            logger.warning(f"Yahoo Finance fetch_chart failed for {ticker}: {str(e)}")
            return None


class AlphaVantageProvider:
    """Alpha Vantage API를 통한 데이터 제공"""
    
    BASE_URL = "https://www.alphavantage.co/query"
    
    @staticmethod
    def _get_api_key() -> Optional[str]:
        return os.getenv('ALPHA_VANTAGE_API_KEY')
    
    @staticmethod
    def fetch_price(ticker: str) -> Optional[Dict]:
        api_key = AlphaVantageProvider._get_api_key()
        if not api_key:
            return None
        
        try:
            params = {
                'function': 'GLOBAL_QUOTE',
                'symbol': ticker.replace('.KS', '').replace('.KQ', ''),
                'apikey': api_key
            }
            response = requests.get(AlphaVantageProvider.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if 'Error Message' in data or 'Note' in data:
                return None
            
            quote = data.get('Global Quote', {})
            if not quote:
                return None
            
            price = quote.get('05. price')
            if not price:
                return None
            
            return {
                "price": float(price),
                "currency": "USD",
                "provider": "alphavantage"
            }
        except Exception as e:
            logger.warning(f"Alpha Vantage fetch_price failed for {ticker}: {str(e)}")
            return None
    
    @staticmethod
    def fetch_detailed_quote(ticker: str) -> Optional[Dict]:
        api_key = AlphaVantageProvider._get_api_key()
        if not api_key:
            return None
        
        try:
            params = {
                'function': 'GLOBAL_QUOTE',
                'symbol': ticker.replace('.KS', '').replace('.KQ', ''),
                'apikey': api_key
            }
            response = requests.get(AlphaVantageProvider.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if 'Error Message' in data or 'Note' in data:
                return None
            
            quote = data.get('Global Quote', {})
            if not quote:
                return None
            
            price = float(quote.get('05. price', 0))
            open_price = float(quote.get('02. open', price))
            high_price = float(quote.get('03. high', price))
            low_price = float(quote.get('04. low', price))
            previous_close = float(quote.get('08. previous close', price))
            volume = int(quote.get('06. volume', 0))
            change = float(quote.get('09. change', 0))
            change_percent = float(quote.get('10. change percent', '0').replace('%', ''))
            
            return {
                "name": ticker.upper(),
                "current_price": price,
                "open_price": open_price,
                "high_price": high_price,
                "low_price": low_price,
                "previous_close": previous_close,
                "volume": volume,
                "market_cap": None,
                "pe_ratio": None,
                "change": change,
                "change_percent": change_percent,
                "currency": "USD",
                "provider": "alphavantage"
            }
        except Exception as e:
            logger.warning(f"Alpha Vantage fetch_detailed_quote failed for {ticker}: {str(e)}")
            return None


class CoinGeckoProvider:
    """CoinGecko API를 통한 암호화폐 데이터 제공"""
    
    BASE_URL = "https://api.coingecko.com/api/v3"
    
    @staticmethod
    def _get_coin_id(ticker: str) -> Optional[str]:
        coin_mapping = {
            'BTC-USD': 'bitcoin',
            'ETH-USD': 'ethereum',
            'SOL-USD': 'solana',
            'BNB-USD': 'binancecoin',
            'ADA-USD': 'cardano',
            'XRP-USD': 'ripple',
            'DOGE-USD': 'dogecoin',
            'MATIC-USD': 'matic-network',
            'DOT-USD': 'polkadot',
            'AVAX-USD': 'avalanche-2'
        }
        return coin_mapping.get(ticker)
    
    @staticmethod
    def fetch_price(ticker: str) -> Optional[Dict]:
        coin_id = CoinGeckoProvider._get_coin_id(ticker)
        if not coin_id:
            return None
        
        try:
            url = f"{CoinGeckoProvider.BASE_URL}/simple/price"
            params = {
                'ids': coin_id,
                'vs_currencies': 'usd',
                'include_24hr_change': 'true'
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if coin_id not in data:
                return None
            
            coin_data = data[coin_id]
            price = coin_data.get('usd')
            if not price:
                return None
            
            return {
                "price": float(price),
                "currency": "USD",
                "provider": "coingecko"
            }
        except Exception as e:
            logger.warning(f"CoinGecko fetch_price failed for {ticker}: {str(e)}")
            return None
    
    @staticmethod
    def fetch_detailed_quote(ticker: str) -> Optional[Dict]:
        coin_id = CoinGeckoProvider._get_coin_id(ticker)
        if not coin_id:
            return None
        
        try:
            url = f"{CoinGeckoProvider.BASE_URL}/coins/{coin_id}"
            params = {
                'localization': 'false',
                'tickers': 'false',
                'market_data': 'true',
                'community_data': 'false',
                'developer_data': 'false'
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            market_data = data.get('market_data', {})
            current_price = market_data.get('current_price', {}).get('usd')
            if not current_price:
                return None
            
            high_24h = market_data.get('high_24h', {}).get('usd', current_price)
            low_24h = market_data.get('low_24h', {}).get('usd', current_price)
            price_change_24h = market_data.get('price_change_24h', 0)
            price_change_percentage_24h = market_data.get('price_change_percentage_24h', 0)
            market_cap = market_data.get('market_cap', {}).get('usd')
            volume_24h = market_data.get('total_volume', {}).get('usd', 0)
            
            return {
                "name": data.get('name', ticker),
                "current_price": float(current_price),
                "open_price": float(current_price - price_change_24h) if price_change_24h else float(current_price),
                "high_price": float(high_24h),
                "low_price": float(low_24h),
                "previous_close": float(current_price - price_change_24h) if price_change_24h else float(current_price),
                "volume": int(volume_24h) if volume_24h else 0,
                "market_cap": float(market_cap) if market_cap else None,
                "pe_ratio": None,
                "change": float(price_change_24h),
                "change_percent": float(price_change_percentage_24h),
                "currency": "USD",
                "provider": "coingecko"
            }
        except Exception as e:
            logger.warning(f"CoinGecko fetch_detailed_quote failed for {ticker}: {str(e)}")
            return None


class DataServiceWithFallback:
    """여러 데이터 제공자를 시도하는 Fallback 서비스"""
    
    @staticmethod
    def fetch_price(ticker: str) -> Dict:
        ticker_upper = ticker.upper()
        
        if ticker_upper.endswith('-USD') and any(ticker_upper.startswith(coin) for coin in ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOGE', 'MATIC', 'DOT', 'AVAX']):
            providers = [CoinGeckoProvider, YahooFinanceProvider]
        else:
            providers = [YahooFinanceProvider, AlphaVantageProvider]
        
        last_error = None
        for provider in providers:
            try:
                result = provider.fetch_price(ticker)
                if result:
                    return result
            except Exception as e:
                last_error = e
                logger.warning(f"{provider.__name__} failed for {ticker}: {str(e)}")
                continue
        
        raise ValueError(f"No price data available for {ticker} from any provider")
    
    @staticmethod
    def fetch_detailed_quote(ticker: str) -> Dict:
        ticker_upper = ticker.upper()
        
        if ticker_upper.endswith('-USD') and any(ticker_upper.startswith(coin) for coin in ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOGE', 'MATIC', 'DOT', 'AVAX']):
            providers = [CoinGeckoProvider, YahooFinanceProvider]
        else:
            providers = [YahooFinanceProvider, AlphaVantageProvider]
        
        last_error = None
        for provider in providers:
            try:
                result = provider.fetch_detailed_quote(ticker)
                if result:
                    return result
            except Exception as e:
                last_error = e
                logger.warning(f"{provider.__name__} failed for {ticker}: {str(e)}")
                continue
        
        raise ValueError(f"No quote data available for {ticker} from any provider")
    
    @staticmethod
    def fetch_chart(ticker: str, period: str = "7d") -> List[Dict]:
        result = YahooFinanceProvider.fetch_chart(ticker, period)
        if result:
            return result
        
        raise ValueError(f"No historical data available for {ticker}")

