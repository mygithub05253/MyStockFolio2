import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// 인기 종목은 API에서 로드

// 숫자 포맷 함수
  const formatCurrency = (value, fractionDigits = 2) => {
  if (value === null || value === undefined) return '-';
  const options = {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  };
    return value.toLocaleString(undefined, options);
  };

  const formatPercentChange = (value) => {
  if (value === null || value === undefined) return '-';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

const formatVolume = (value) => {
  if (value === null || value === undefined) return '-';
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)}B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return value.toLocaleString();
};

const getFractionDigits = (ticker) => {
  if (!ticker) return 2;
  return ticker.includes('.KS') || ticker.includes('.KQ') ? 0 : 2;
};

const Market = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicker, setSelectedTicker] = useState('AAPL'); // 기본 선택 종목
  const [detailedQuote, setDetailedQuote] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'stock', 'coin'
  const [popular, setPopular] = useState([]);
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [topCategory, setTopCategory] = useState('gainers');
  const [topList, setTopList] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('1mo'); // '1d', '5d', '1mo', '3mo', '6mo', '1y'
  const pollingIntervalRef = useRef(null);
  
  // defaultPopular을 useMemo로 메모이제이션하여 useEffect dependency 경고 방지
  const defaultPopular = useMemo(() => [
    { ticker: 'AAPL', name: 'Apple Inc.', category: 'stock' },
    { ticker: 'MSFT', name: 'Microsoft Corporation', category: 'stock' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', category: 'stock' },
    { ticker: 'TSLA', name: 'Tesla Inc.', category: 'stock' },
    { ticker: '005930.KS', name: 'Samsung Electronics', category: 'stock' },
    { ticker: '000660.KS', name: 'SK Hynix', category: 'stock' },
    { ticker: 'BTC-USD', name: 'Bitcoin', category: 'coin' },
    { ticker: 'ETH-USD', name: 'Ethereum', category: 'coin' },
  ], []);

  // 인기 종목 로드 및 주기적 새로고침 + FastAPI 헬스체크
  useEffect(() => {
    let isMounted = true;
    const pollHealth = async () => {
      try {
        const h = await axiosInstance.get('/api/market/health');
        if (!isMounted) return;
        setServiceAvailable(h.status === 200);
      } catch (e) {
        if (!isMounted) return;
        setServiceAvailable(false);
      }
    };
    pollHealth();
    const healthId = setInterval(pollHealth, 10000);
    const loadPopular = async () => {
      try {
        const resp = await axiosInstance.get('/api/market/popular');
        if (!isMounted) return;
        // 503(Service Unavailable) 또는 빈 목록이면 기본값 사용
        const list = Array.isArray(resp.data) && resp.status === 200 ? resp.data : [];
        const enriched = list.length ? list : defaultPopular;
        setPopular(enriched);
      } catch (e) {
        console.warn('인기 종목 로드 실패:', e);
        // 네트워크/503 시 기본 목록 사용
        setPopular(defaultPopular);
      }
    };
    loadPopular();
    const id = setInterval(loadPopular, 30000); // 30초마다 갱신 (실시간성 향상)
    return () => { isMounted = false; clearInterval(id); clearInterval(healthId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultPopular]);

  // 상세 시세 정보 조회
  const fetchDetailedQuote = async (ticker) => {
      setIsLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get(`/api/market/quote`, { params: { ticker } });
      setDetailedQuote(response.data);
      console.log('상세 시세 조회 성공:', response.data);
    } catch (err) {
      console.error('상세 시세 조회 실패:', err);
      const status = err.response?.status;
      if (status === 503) {
        setError(`'${ticker}' 시세 서비스가 현재 준비 중입니다. 잠시 후 다시 시도해주세요.`);
      } else if (status === 404) {
        setError(`'${ticker}' 시세 데이터가 없습니다.`);
      } else {
        setError(`'${ticker}' 시세 조회 실패: ${err.response?.data?.detail || err.message}`);
      }
      setDetailedQuote(null);
    } finally {
      setIsLoading(false);
    }
    };

  // 차트 데이터 조회 (useCallback으로 메모이제이션)
  const fetchChartData = useCallback(async (ticker, period = chartPeriod) => {
    try {
      const response = await axiosInstance.get(`/api/market/chart`, { params: { ticker, period } });
      setChartData(response.data.history || []);
    } catch (err) {
      console.error('차트 데이터 조회 실패:', err);
      setChartData([]);
    }
  }, [chartPeriod]);

  // 종목 선택 시 즉시 상세 정보 조회
  const handleSelectTicker = (ticker) => {
    setSelectedTicker(ticker);
    setError('');
    fetchDetailedQuote(ticker);
    fetchChartData(ticker, chartPeriod);
  };

  // 검색 실행
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setError('종목 코드를 입력해주세요.');
      return;
    }
    handleSelectTicker(searchTerm.toUpperCase());
  };

  // 입력 변경 시 자동완성 (디바운스)
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) { setSuggestions([]); return; }
    const h = setTimeout(async () => {
      try {
        const resp = await axiosInstance.get('/api/market/suggest', { params: { q: term } });
        setSuggestions(Array.isArray(resp.data) ? resp.data : []);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(h);
  }, [searchTerm]);

  // Top movers 로드
  useEffect(() => {
    const loadTop = async () => {
      try {
        const resp = await axiosInstance.get('/api/market/top', { params: { category: topCategory } });
        setTopList(Array.isArray(resp.data) ? resp.data : []);
      } catch {
        setTopList([]);
      }
    };
    loadTop();
  }, [topCategory]);

  // 선택된 종목의 실시간 가격 업데이트 (5초 간격)
  useEffect(() => {
    if (!selectedTicker || !serviceAvailable) return;

    const pollPrice = async () => {
      try {
        const response = await axiosInstance.get(`/api/market/price`, { params: { ticker: selectedTicker } });
        if (response.data) {
          setDetailedQuote(prev => {
            if (!prev) return prev;
            const newPrice = response.data.price;
            const prevPrice = prev.current_price;
            const change = newPrice - prevPrice;
            const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;

            return {
              ...prev,
              current_price: newPrice,
              change: change,
              change_percent: changePercent,
              last_updated: response.data.last_updated
            };
          });
        }
      } catch (err) {
        console.warn('실시간 가격 업데이트 실패:', err);
      }
    };

    pollPrice();
    const intervalId = setInterval(pollPrice, 5000);
    pollingIntervalRef.current = intervalId;

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [selectedTicker, serviceAvailable]);

  // 초기 로드 (기본 종목)
  useEffect(() => {
    fetchDetailedQuote(selectedTicker);
    fetchChartData(selectedTicker, chartPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 차트 기간 변경 시
  useEffect(() => {
    if (selectedTicker) {
      fetchChartData(selectedTicker, chartPeriod);
    }
  }, [chartPeriod, selectedTicker, fetchChartData]);

  // 필터링된 인기 종목
  const filteredTickers = popular.filter(item => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  return (
    <div className="container mx-auto p-4 max-w-md space-y-4">
      {/* 헤더 */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">시장 탐색</h1>
      </div>

      {/* 검색 바 - TickerSearch 컴포넌트로 교체 예정 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 relative">
        <div className="flex flex-col gap-3">
        <input
          type="text"
            placeholder="종목 코드 입력 (예: AAPL, BTC-USD, 005930.KS)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
          <button
            onClick={handleSearch}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-sm"
          >
            검색
          </button>
        </div>
        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((s) => (
              <li key={s.ticker}
                  className="px-4 py-3 text-sm hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                  onClick={() => { setSearchTerm(s.ticker); handleSelectTicker(s.ticker); setSuggestions([]); }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{s.ticker}</span>
                      {s.sector && (
                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                          {s.sector}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{s.name}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {s.market || s.type}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* HTS 스타일 레이아웃 - 세로 스택 */}
      <div className="flex flex-col gap-4">

        {/* 1행: 인기 종목 리스트 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">인기 종목</h3>
            <div className="flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
        >
          전체
        </button>
        <button
          onClick={() => setActiveTab('stock')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'stock'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
        >
                주식
        </button>
        <button
          onClick={() => setActiveTab('coin')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'coin'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
        >
                코인
        </button>
        <button
          onClick={() => setActiveTab('bond')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'bond'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
        >
                채권
        </button>
        <button
          onClick={() => setActiveTab('etf')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'etf'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
        >
                ETF
        </button>
            </div>
          </div>
          <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {filteredTickers.map((item) => (
              <li
                key={item.ticker}
                onClick={() => handleSelectTicker(item.ticker)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedTicker === item.ticker
                    ? 'bg-indigo-50 border-l-4 border-indigo-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{item.ticker}</div>
                    <div className="text-xs text-gray-600 mt-1">{item.name}</div>
                  </div>
                  <div className="text-right">
                    {serviceAvailable && item.current_price !== undefined ? (
                      <>
                        <div className="text-xs font-semibold text-gray-800">{formatCurrency(item.current_price, getFractionDigits(item.ticker))}</div>
                        <div className={`text-xs ${item.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatPercentChange(item.change_percent)}</div>
                      </>
                    ) : (
                      <span className="text-[10px] px-2 py-1 rounded bg-gray-100 text-gray-600">서비스 준비중</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
      </div>

        {/* 1.5행: Top Movers */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">상위 변동</h3>
            <div className="flex gap-2">
              <button onClick={() => setTopCategory('gainers')} className={`px-3 py-1 rounded text-sm ${topCategory==='gainers'?'bg-green-600 text-white':'bg-gray-100 text-gray-700'}`}>상승</button>
              <button onClick={() => setTopCategory('losers')} className={`px-3 py-1 rounded text-sm ${topCategory==='losers'?'bg-red-600 text-white':'bg-gray-100 text-gray-700'}`}>하락</button>
              <button onClick={() => setTopCategory('active')} className={`px-3 py-1 rounded text-sm ${topCategory==='active'?'bg-indigo-600 text-white':'bg-gray-100 text-gray-700'}`}>거래량</button>
            </div>
          </div>
          <ul className="divide-y divide-gray-200 max-h-72 overflow-y-auto">
            {topList.map((item) => (
              <li key={item.ticker} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{item.ticker}</div>
                  <div className="text-xs text-gray-600 mt-1">{item.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-800">{formatCurrency(item.current_price, getFractionDigits(item.ticker))}</div>
                  <div className={`text-xs ${item.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatPercentChange(item.change_percent)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 2행: 상세 시세 정보 (서비스 미가동 시 안내) */}
        <div className="bg-white rounded-lg shadow p-4">
            {!serviceAvailable && (
              <div className="mb-4 p-4 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                시세 서비스가 현재 준비 중입니다. FastAPI 기동 후 실데이터가 자동 반영됩니다.
              </div>
            )}
            {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500 text-lg">로딩 중...</div>
            </div>
          ) : (serviceAvailable && detailedQuote) ? (
            <>
              {/* 종목 헤더 */}
              <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b-2 border-gray-200">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">{detailedQuote.name}</h2>
                <span className="px-3 py-1 bg-gray-100 rounded-md text-sm font-semibold text-gray-700">
                  {detailedQuote.ticker}
                </span>
              </div>

              {/* 현재가 */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-4 mb-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold">
                    {formatCurrency(detailedQuote.current_price, getFractionDigits(detailedQuote.ticker))}
                    <span className="text-sm ml-2 opacity-90">{detailedQuote.currency}</span>
                  </div>
                  <div className="text-xs opacity-75 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                    실시간
                  </div>
                </div>
                <div className={`text-base font-semibold ${
                  detailedQuote.change >= 0 ? 'text-green-300' : 'text-red-300'
                }`}>
                  {detailedQuote.change >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(detailedQuote.change), getFractionDigits(detailedQuote.ticker))} ({formatPercentChange(detailedQuote.change_percent)})
                </div>
              </div>

              {/* 시세 정보 테이블 */}
              <div className="mb-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="py-2 px-2 font-semibold text-gray-600">시가</td>
                      <td className="py-2 px-2 text-gray-800">{formatCurrency(detailedQuote.open_price, getFractionDigits(detailedQuote.ticker))}</td>
                      <td className="py-2 px-2 font-semibold text-gray-600">고가</td>
                      <td className="py-2 px-2 text-red-600 font-semibold">{formatCurrency(detailedQuote.high_price, getFractionDigits(detailedQuote.ticker))}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-semibold text-gray-600">저가</td>
                      <td className="py-2 px-2 text-blue-600 font-semibold">{formatCurrency(detailedQuote.low_price, getFractionDigits(detailedQuote.ticker))}</td>
                      <td className="py-2 px-2 font-semibold text-gray-600">전일</td>
                      <td className="py-2 px-2 text-gray-800">{formatCurrency(detailedQuote.previous_close, getFractionDigits(detailedQuote.ticker))}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-semibold text-gray-600">거래량</td>
                      <td className="py-2 px-2 text-gray-800">{formatVolume(detailedQuote.volume)}</td>
                      <td className="py-2 px-2 font-semibold text-gray-600">시총</td>
                      <td className="py-2 px-2 text-gray-800">{detailedQuote.market_cap ? formatVolume(detailedQuote.market_cap) : '-'}</td>
                    </tr>
                    {detailedQuote.pe_ratio && (
                      <tr>
                        <td className="py-2 px-2 font-semibold text-gray-600">PER</td>
                        <td className="py-2 px-2 text-gray-800">{detailedQuote.pe_ratio.toFixed(2)}</td>
                        <td className="py-2 px-2"></td>
                        <td className="py-2 px-2"></td>
                </tr>
            )}
          </tbody>
        </table>
              </div>

              {/* 실시간 차트 */}
              {chartData.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-800">가격 추이</h3>
                    <div className="flex gap-2">
                      {['1d', '5d', '1mo', '3mo', '6mo', '1y'].map((period) => {
                        const labels = { '1d': '1일', '5d': '5일', '1mo': '1개월', '3mo': '3개월', '6mo': '6개월', '1y': '1년' };
                        return (
                          <button
                            key={period}
                            onClick={() => setChartPeriod(period)}
                            className={`px-2 py-1 text-xs rounded ${
                              chartPeriod === period
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {labels[period]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <Line
                      data={{
                        labels: chartData.map(d => {
                          const date = new Date(d.date);
                          if (chartPeriod === '1d') return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                          return date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
                        }),
                        datasets: [
                          {
                            label: detailedQuote.ticker,
                            data: chartData.map(d => d.price),
                            borderColor: detailedQuote.change_percent >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                            backgroundColor: detailedQuote.change_percent >= 0 
                              ? 'rgba(34, 197, 94, 0.1)' 
                              : 'rgba(239, 68, 68, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            pointHoverRadius: 4,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                              label: (context) => {
                                return `${formatCurrency(context.parsed.y, getFractionDigits(detailedQuote.ticker))} ${detailedQuote.currency}`;
                              }
                            }
                          }
                        },
                        scales: {
                          x: {
                            display: true,
                            grid: {
                              display: false
                            },
                            ticks: {
                              maxTicksLimit: chartPeriod === '1d' ? 12 : 8,
                              font: {
                                size: 10
                              }
                            }
                          },
                          y: {
                            display: true,
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                              font: {
                                size: 10
                              },
                              callback: (value) => {
                                return formatCurrency(value, getFractionDigits(detailedQuote.ticker));
                              }
                            }
                          }
                        },
                        interaction: {
                          mode: 'nearest',
                          axis: 'x',
                          intersect: false
                        }
                      }}
                      height={200}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-gray-600 mb-1">최저가</p>
                      <p className="text-xs font-semibold text-blue-600">
                        {formatCurrency(Math.min(...chartData.map(d => d.price)), getFractionDigits(detailedQuote.ticker))}
                      </p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-gray-600 mb-1">최고가</p>
                      <p className="text-xs font-semibold text-red-600">
                        {formatCurrency(Math.max(...chartData.map(d => d.price)), getFractionDigits(detailedQuote.ticker))}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              종목을 선택하거나 검색해주세요.
            </div>
          )}
        </div>

        {/* 3행: 매수/매도 기능 */}
        {detailedQuote && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
              거래
            </h3>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⚠</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800 mb-1">매수/매도 기능 준비중</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    주식 포트폴리오 관리 서비스로, 실제 거래 기능은 제공하지 않습니다. 
                    자산 등록 및 관리는 포트폴리오 페이지에서 진행해주세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4행: 호가창 */}
                  {/* 호가 정보 섹션 */}
          {detailedQuote && serviceAvailable ? (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">호가 정보</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">현재가</p>
                  <p className={`text-lg font-bold ${detailedQuote.change >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatCurrency(detailedQuote.current_price, getFractionDigits(selectedTicker))}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">전일 대비</p>
                  <p className={`text-lg font-bold ${detailedQuote.change >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatPercentChange(detailedQuote.change_percent)}
                  </p>
                  <p className={`text-xs ${detailedQuote.change >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatCurrency(Math.abs(detailedQuote.change), getFractionDigits(selectedTicker))}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">시가</p>
                  <p className="font-semibold text-gray-800">
                    {formatCurrency(detailedQuote.open_price, getFractionDigits(selectedTicker))}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">고가</p>
                  <p className="font-semibold text-red-600">
                    {formatCurrency(detailedQuote.high_price, getFractionDigits(selectedTicker))}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">저가</p>
                  <p className="font-semibold text-blue-600">
                    {formatCurrency(detailedQuote.low_price, getFractionDigits(selectedTicker))}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">거래량</p>
                  <p className="font-semibold text-gray-800">
                    {formatVolume(detailedQuote.volume || 0)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 mb-1">전일 종가</p>
                  <p className="font-semibold text-gray-800">
                    {formatCurrency(detailedQuote.previous_close, getFractionDigits(selectedTicker))}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">호가 정보</h3>
              {!serviceAvailable ? (
                <div>
                  <p className="text-sm text-yellow-800 mb-2">시장 데이터 서비스 미연결</p>
                  <p className="text-xs text-yellow-700">
                    실시간 가격을 불러올 수 없어 수익률이 0%로 표시될 수 있습니다. FastAPI 서버를 확인해주세요.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">호가 데이터 준비중...</p>
              )}
            </div>
          )}

        {/* 5행: 뉴스/공시 */}
        {detailedQuote && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
              뉴스 & 공시
            </h3>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📰</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800 mb-1">뉴스 피드 준비중</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    종목 관련 뉴스 및 공시 정보를 제공할 예정입니다.
                    <br />
                    <span className="text-blue-600 font-medium">
                      {detailedQuote.ticker} 관련 최신 뉴스와 재무 공시 정보가 여기에 표시됩니다.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Market;
