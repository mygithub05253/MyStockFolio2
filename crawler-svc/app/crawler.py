import logging
import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
from datetime import datetime
import time
import re

logger = logging.getLogger(__name__)


class CrawlerBase:
    """
    크롤러 기본 클래스 - 공통 기능 제공
    """
    
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    @staticmethod
    def _get_session():
        session = requests.Session()
        session.headers.update(CrawlerBase.HEADERS)
        return session
    
    @staticmethod
    def _rate_limit_delay(seconds: float = 1.0):
        """
        Rate limiting을 위한 지연
        """
        time.sleep(seconds)
    
    @staticmethod
    def _parse_number(text: str) -> Optional[float]:
        """
        텍스트에서 숫자 추출 (천단위 구분자 제거)
        """
        if not text:
            return None
        text = text.replace(',', '').replace('원', '').strip()
        try:
            return float(text)
        except ValueError:
            return None
    
    @staticmethod
    def _parse_percent(text: str) -> Optional[float]:
        """
        퍼센트 텍스트를 숫자로 변환
        """
        if not text:
            return None
        text = text.replace('%', '').replace(',', '').strip()
        try:
            return float(text)
        except ValueError:
            return None


class KoreanStockCrawler(CrawlerBase):
    """
    한국 주식 크롤러 - 네이버 금융, 다음 금융 등에서 데이터 수집
    """
    
    NAVER_FINANCE_BASE = "https://finance.naver.com/item/main.naver?code="
    NAVER_NEWS_BASE = "https://finance.naver.com/item/news.naver?code="
    
    def fetch_stock_info(self, ticker: str) -> Optional[Dict]:
        """
        주식 기본 정보 조회 (회사명, 섹터, 시가총액 등)
        """
        try:
            self._rate_limit_delay(0.5)
            url = f"{self.NAVER_FINANCE_BASE}{ticker}"
            session = self._get_session()
            response = session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            name_element = soup.find('div', class_='wrap_company')
            name = name_element.find('h2').get_text(strip=True) if name_element and name_element.find('h2') else ticker
            
            sector_element = soup.find('dl', class_='blind')
            sector = None
            market = None
            if sector_element:
                dts = sector_element.find_all('dt')
                dds = sector_element.find_all('dd')
                for dt, dd in zip(dts, dds):
                    dt_text = dt.get_text(strip=True)
                    dd_text = dd.get_text(strip=True)
                    if '시장구분' in dt_text:
                        market = dd_text
                    elif '종목코드' not in dt_text and '섹터' in dt_text or '업종' in dt_text:
                        sector = dd_text
            
            market_cap_element = soup.find('em', id='_market_sum')
            market_cap = None
            if market_cap_element:
                market_cap_text = market_cap_element.get_text(strip=True)
                market_cap = self._parse_number(market_cap_text)
            
            return {
                "ticker": ticker,
                "name": name,
                "market": market or "UNKNOWN",
                "sector": sector,
                "market_cap": market_cap
            }
        except Exception as e:
            logger.error(f"Error fetching stock info for {ticker}: {str(e)}")
            return None
    
    def fetch_stock_quote(self, ticker: str) -> Optional[Dict]:
        """
        주식 시세 정보 조회 (현재가, 변동률 등)
        """
        try:
            self._rate_limit_delay(0.5)
            url = f"{self.NAVER_FINANCE_BASE}{ticker}"
            session = self._get_session()
            response = session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            no_today = soup.find('div', class_='no_today')
            if not no_today:
                return None
            
            current_price_text = no_today.find('span', class_='blind').get_text(strip=True) if no_today.find('span', class_='blind') else None
            current_price = self._parse_number(current_price_text) if current_price_text else None
            
            if not current_price:
                return None
            
            table_info = soup.find('table', class_='no_info')
            previous_close = current_price
            change = 0
            change_percent = 0
            high_price = current_price
            low_price = current_price
            open_price = current_price
            volume = 0
            
            if table_info:
                rows = table_info.find_all('tr')
                for row in rows:
                    th = row.find('th')
                    td = row.find('td')
                    if th and td:
                        th_text = th.get_text(strip=True)
                        td_text = td.get_text(strip=True)
                        
                        if '전일' in th_text or '전일종가' in th_text:
                            previous_close = self._parse_number(td_text) or current_price
                        elif '고가' in th_text:
                            high_price = self._parse_number(td_text) or current_price
                        elif '저가' in th_text:
                            low_price = self._parse_number(td_text) or current_price
                        elif '시가' in th_text:
                            open_price = self._parse_number(td_text) or current_price
                        elif '거래량' in th_text:
                            volume = int(self._parse_number(td_text) or 0)
            
            change = current_price - previous_close
            change_percent = (change / previous_close * 100) if previous_close != 0 else 0
            
            name_element = soup.find('div', class_='wrap_company')
            name = name_element.find('h2').get_text(strip=True) if name_element and name_element.find('h2') else ticker
            
            return {
                "ticker": ticker,
                "name": name,
                "current_price": current_price,
                "previous_close": previous_close,
                "change": change,
                "change_percent": change_percent,
                "volume": volume,
                "high_price": high_price,
                "low_price": low_price,
                "open_price": open_price,
                "currency": "KRW"
            }
        except Exception as e:
            logger.error(f"Error fetching stock quote for {ticker}: {str(e)}")
            return None
    
    def fetch_financial_info(self, ticker: str) -> Optional[Dict]:
        """
        재무정보 조회 (매출, 영업이익, 순이익 등)
        """
        try:
            self._rate_limit_delay(0.5)
            url = f"{self.NAVER_FINANCE_BASE}{ticker}"
            session = self._get_session()
            response = session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            financial_section = soup.find('div', class_='section cop_analysis')
            if not financial_section:
                return None
            
            financial_data = {}
            
            tables = financial_section.find_all('table')
            for table in tables:
                rows = table.find_all('tr')
                for row in rows:
                    cells = row.find_all(['th', 'td'])
                    if len(cells) >= 2:
                        label = cells[0].get_text(strip=True)
                        value = cells[1].get_text(strip=True)
                        financial_data[label] = self._parse_number(value)
            
            return financial_data
        except Exception as e:
            logger.error(f"Error fetching financial info for {ticker}: {str(e)}")
            return None
    
    def fetch_news(self, ticker: str, limit: int = 10) -> List[Dict]:
        """
        주식 관련 뉴스 조회
        """
        news_list = []
        try:
            self._rate_limit_delay(0.5)
            url = f"{self.NAVER_NEWS_BASE}{ticker}"
            session = self._get_session()
            response = session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            news_items = soup.find_all('dt', class_='title')[:limit]
            for item in news_items:
                link = item.find('a')
                if link:
                    title = link.get_text(strip=True)
                    href = link.get('href', '')
                    full_url = f"https://finance.naver.com{href}" if href.startswith('/') else href
                    
                    news_list.append({
                        "title": title,
                        "url": full_url,
                        "ticker": ticker
                    })
            
            return news_list
        except Exception as e:
            logger.error(f"Error fetching news for {ticker}: {str(e)}")
            return news_list


class BondCrawler(CrawlerBase):
    """
    채권 정보 크롤러 - 한국 채권 데이터 수집
    """
    
    KIS_BOND_BASE = "https://www.kisrating.com/ratingsStatistics/statics_spread.do"
    
    def fetch_bond_list(self) -> List[Dict]:
        """
        채권 목록 조회
        """
        try:
            self._rate_limit_delay(1.0)
            bond_types = ["국고채3년", "국고채5년", "국고채10년", "회사채3년", "회사채5년"]
            bond_list = []
            
            for bond_type in bond_types:
                info = self.fetch_bond_info(bond_type)
                if info:
                    bond_list.append(info)
            
            return bond_list if bond_list else self._get_default_bond_list()
        except Exception as e:
            logger.error(f"Error fetching bond list: {str(e)}")
            return self._get_default_bond_list()
    
    def _get_default_bond_list(self) -> List[Dict]:
        """
        기본 채권 목록 반환
        """
        return [
            {
                "bond_type": "국고채3년",
                "name": "국고채 3년",
                "yield_rate": None,
                "maturity": None,
                "coupon_rate": None,
                "last_updated": datetime.now().isoformat() + "Z"
            },
            {
                "bond_type": "국고채5년",
                "name": "국고채 5년",
                "yield_rate": None,
                "maturity": None,
                "coupon_rate": None,
                "last_updated": datetime.now().isoformat() + "Z"
            },
            {
                "bond_type": "국고채10년",
                "name": "국고채 10년",
                "yield_rate": None,
                "maturity": None,
                "coupon_rate": None,
                "last_updated": datetime.now().isoformat() + "Z"
            }
        ]
    
    def fetch_bond_info(self, bond_type: str) -> Optional[Dict]:
        """
        특정 채권 정보 조회
        """
        try:
            self._rate_limit_delay(1.0)
            
            default_info = {
                "bond_type": bond_type,
                "name": bond_type,
                "yield_rate": None,
                "maturity": None,
                "coupon_rate": None,
                "last_updated": datetime.now().isoformat() + "Z"
            }
            
            if "국고채" in bond_type:
                url = "https://www.kisrating.com/ratingsStatistics/statics_spread.do"
            elif "회사채" in bond_type:
                url = "https://www.kisrating.com/ratingsStatistics/statics_spread.do"
            else:
                return default_info
            
            session = self._get_session()
            response = session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            default_info["last_updated"] = datetime.now().isoformat() + "Z"
            return default_info
        except Exception as e:
            logger.warning(f"Error fetching bond info for {bond_type}: {str(e)}, returning default")
            return {
                "bond_type": bond_type,
                "name": bond_type,
                "yield_rate": None,
                "maturity": None,
                "coupon_rate": None,
                "last_updated": datetime.now().isoformat() + "Z"
            }


class IndexCrawler(CrawlerBase):
    """
    지수 정보 크롤러 - 글로벌 지수 데이터 조회
    """
    
    INDEX_MAPPING = {
        "MSCI_ACWI": "^ACWI",
        "MSCI_WORLD": "^MXWD",
        "FTSE_100": "^FTSE",
        "DAX": "^GDAXI",
        "NIKKEI": "^N225",
        "HANG_SENG": "^HSI"
    }
    
    def fetch_index_list(self) -> List[Dict]:
        """
        지수 목록 조회 (Yahoo Finance 티커 기반)
        """
        index_list = []
        index_codes = [
            {"code": "MSCI_ACWI", "name": "MSCI All Country World Index", "ticker": "^ACWI"},
            {"code": "MSCI_WORLD", "name": "MSCI World Index", "ticker": "^MXWD"},
            {"code": "FTSE_100", "name": "FTSE 100", "ticker": "^FTSE"},
            {"code": "DAX", "name": "DAX", "ticker": "^GDAXI"},
            {"code": "NIKKEI", "name": "Nikkei 225", "ticker": "^N225"},
            {"code": "HANG_SENG", "name": "Hang Seng Index", "ticker": "^HSI"}
        ]
        
        try:
            import yfinance as yf
            
            for idx_info in index_codes:
                try:
                    self._rate_limit_delay(0.3)
                    ticker = yf.Ticker(idx_info["ticker"])
                    info = ticker.info
                    
                    current_value = info.get('regularMarketPrice') or info.get('currentPrice') or info.get('previousClose')
                    previous_close = info.get('previousClose') or current_value or 0
                    
                    if current_value:
                        change = float(current_value) - float(previous_close) if previous_close else 0
                        change_percent = (change / float(previous_close) * 100) if previous_close != 0 else 0
                        
                        index_list.append({
                            "index_code": idx_info["code"],
                            "name": idx_info["name"],
                            "current_value": float(current_value),
                            "change": float(change),
                            "change_percent": float(change_percent),
                            "last_updated": datetime.now().isoformat() + "Z"
                        })
                except Exception as e:
                    logger.warning(f"Error fetching index {idx_info['code']}: {str(e)}")
                    continue
        except ImportError:
            logger.warning("yfinance not available for index data, using default values")
        
        if not index_list:
            return self._get_default_index_list()
        
        return index_list
    
    def _get_default_index_list(self) -> List[Dict]:
        """
        기본 지수 목록 반환
        """
        return [
            {
                "index_code": "MSCI_ACWI",
                "name": "MSCI All Country World Index",
                "current_value": 0.0,
                "change": 0.0,
                "change_percent": 0.0,
                "last_updated": datetime.now().isoformat() + "Z"
            },
            {
                "index_code": "FTSE_100",
                "name": "FTSE 100",
                "current_value": 0.0,
                "change": 0.0,
                "change_percent": 0.0,
                "last_updated": datetime.now().isoformat() + "Z"
            }
        ]
    
    def fetch_index_info(self, index_code: str) -> Optional[Dict]:
        """
        특정 지수 정보 조회
        """
        try:
            ticker_symbol = self.INDEX_MAPPING.get(index_code)
            if not ticker_symbol:
                index_list = self.fetch_index_list()
                for idx in index_list:
                    if idx['index_code'] == index_code:
                        return idx
                return None
            
            import yfinance as yf
            self._rate_limit_delay(0.5)
            
            ticker = yf.Ticker(ticker_symbol)
            info = ticker.info
            
            current_value = info.get('regularMarketPrice') or info.get('currentPrice') or info.get('previousClose')
            previous_close = info.get('previousClose') or current_value or 0
            
            if not current_value:
                return None
            
            change = float(current_value) - float(previous_close) if previous_close else 0
            change_percent = (change / float(previous_close) * 100) if previous_close != 0 else 0
            
            index_names = {
                "MSCI_ACWI": "MSCI All Country World Index",
                "MSCI_WORLD": "MSCI World Index",
                "FTSE_100": "FTSE 100",
                "DAX": "DAX",
                "NIKKEI": "Nikkei 225",
                "HANG_SENG": "Hang Seng Index"
            }
            
            return {
                "index_code": index_code,
                "name": index_names.get(index_code, index_code),
                "current_value": float(current_value),
                "change": float(change),
                "change_percent": float(change_percent),
                "last_updated": datetime.now().isoformat() + "Z"
            }
        except Exception as e:
            logger.error(f"Error fetching index info for {index_code}: {str(e)}")
            return None

