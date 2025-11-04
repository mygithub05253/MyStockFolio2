import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { setDashboardStats, setLoading, setError } from '../../modules/dashboard'; 
import { setTokenBalance, setRewardsLoading, setRewardsError } from '../../modules/rewards';
import TokenBalanceCard from '../../components/rewards/TokenBalanceCard';
import NFTCarousel from '../../components/rewards/NFTCarousel';
import WalletConnectPrompt from '../../components/rewards/WalletConnectPrompt';
import { Pie, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title
} from 'chart.js';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title
);

const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₩ 0';
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        minimumFractionDigits: 0,
    }).format(amount);
};

const formatPercentage = (rate) => {
    if (rate === undefined || rate === null) return '0.00%';
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(2)}%`;
};

const getReturnColorClass = (rate) => {
    if (rate === undefined || rate === null) return 'text-gray-600';
    return rate > 0 ? 'text-green-500' : rate < 0 ? 'text-red-500' : 'text-gray-600';
};

const Dashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { stats, isLoading, error } = useSelector(state => state.dashboard);
    const { isLoggedIn, userInfo } = useSelector(state => state.user);
    const { balance, balanceFormatted, isLoading: isRewardsLoading } = useSelector(state => state.rewards);
    const [marketIndices, setMarketIndices] = useState([]);
    const [topGainers, setTopGainers] = useState([]);
    const [heatmapData, setHeatmapData] = useState(null);
    const [riskMetrics, setRiskMetrics] = useState(null);

    useEffect(() => {
        if (!isLoggedIn) return; 
        
        let isMounted = true;
        let hasFetched = false;
        
        const fetchDashboardStats = async () => {
            if (hasFetched) return;
            hasFetched = true;
            
            dispatch(setLoading(true));
            try {
                const response = await axiosInstance.get('/api/dashboard/stats');
                if (!isMounted) return;
                
                console.log('대시보드 API 응답:', response.data);
                
                if (response.data) {
                    dispatch(setDashboardStats(response.data));
                }
            } catch (err) {
                if (!isMounted) return;
                console.error("대시보드 통계 로드 실패:", err);
                if (err.response?.status === 401) {
                    console.error('인증 실패 - 로그인 상태 확인 필요');
                } else {
                    dispatch(setError(err.message));
                }
            } finally {
                if (isMounted) {
                    dispatch(setLoading(false));
                }
            }
        };
        
        fetchDashboardStats();
        
        return () => {
            isMounted = false;
        };
    }, [dispatch, isLoggedIn]);

    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                const resp = await axiosInstance.get('/api/market/indices');
                setMarketIndices(Array.isArray(resp.data) ? resp.data : []);
            } catch (err) {
                console.error('시장 지수 로드 실패:', err);
                setMarketIndices([]);
            }
        };
        fetchMarketData();
        const intervalId = setInterval(fetchMarketData, 60000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const fetchTopGainers = async () => {
            try {
                const resp = await axiosInstance.get('/api/market/top', { params: { category: 'gainers' } });
                setTopGainers(Array.isArray(resp.data) ? resp.data.slice(0, 3) : []);
            } catch (err) {
                console.error('Top gainers 로드 실패:', err);
                setTopGainers([]);
            }
        };
        fetchTopGainers();
    }, []);

    // 히트맵 데이터 로드
    useEffect(() => {
        if (!isLoggedIn) return;
        
        const fetchHeatmap = async () => {
            try {
                const response = await axiosInstance.get('/api/dashboard/heatmap');
                setHeatmapData(response.data);
                console.log('히트맵 데이터 로드 완료:', response.data);
            } catch (err) {
                // 타임아웃 에러는 조용히 처리
                if (err.code === 'ECONNABORTED') {
                    console.warn('히트맵 데이터 로드 타임아웃 (서버 응답 지연)');
                } else {
                    console.error('히트맵 데이터 로드 실패:', err);
                }
                setHeatmapData(null);
            }
        };
        
        fetchHeatmap();
    }, [isLoggedIn]);

    // 위험 지표 데이터 로드 (비동기 폴링 방식)
    useEffect(() => {
        if (!isLoggedIn) return;
        
        let pollingInterval = null;
        let maxAttempts = 30; // 최대 30번 시도 (약 30초)
        let attempts = 0;
        
        const startRiskMetricsCalculation = async () => {
            try {
                // 작업 시작
                const startResponse = await axiosInstance.post('/api/dashboard/risk/start');
                const jobId = startResponse.data.jobId;
                console.log('위험 지표 계산 작업 시작:', jobId);
                
                // 폴링으로 결과 조회
                pollingInterval = setInterval(async () => {
                    attempts++;
                    
                    if (attempts > maxAttempts) {
                        clearInterval(pollingInterval);
                        console.warn('위험 지표 계산 타임아웃');
                        setRiskMetrics(null);
                        return;
                    }
                    
                    try {
                        const resultResponse = await axiosInstance.get(`/api/dashboard/risk/result/${jobId}`);
                        
                        if (resultResponse.status === 200 && resultResponse.data) {
                            // 결과 받음
                            clearInterval(pollingInterval);
                            setRiskMetrics(resultResponse.data);
                            console.log('위험 지표 데이터 로드 완료:', resultResponse.data);
                        }
                        // 202 응답이면 아직 처리 중 (계속 폴링)
                    } catch (err) {
                        if (err.response?.status === 202) {
                            // 아직 처리 중, 계속 폴링
                            console.log('위험 지표 계산 진행 중...');
                        } else {
                            // 에러 발생
                            clearInterval(pollingInterval);
                            console.error('위험 지표 데이터 로드 실패:', err);
                            setRiskMetrics(null);
                        }
                    }
                }, 1000); // 1초마다 폴링
            } catch (err) {
                console.error('위험 지표 계산 시작 실패:', err);
                setRiskMetrics(null);
            }
        };
        
        startRiskMetricsCalculation();
        
        // cleanup
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [isLoggedIn]);

    const hasData = stats && (stats.totalMarketValue !== undefined || stats.totalInitialInvestment !== undefined);
    
    const displayData = {
        totalMarketValue: hasData ? (stats.totalMarketValue ?? 0) : 0,
        totalReturnRate: hasData ? (stats.totalReturnRate ?? 0) : 0,
        totalGainLoss: hasData ? (stats.totalGainLoss ?? 0) : 0,
        totalInitialInvestment: hasData ? (stats.totalInitialInvestment ?? 0) : 0,
        assetAllocations: (stats.assetAllocations && stats.assetAllocations.length > 0) ? stats.assetAllocations : [],
        assetReturns: (stats.assetReturns && stats.assetReturns.length > 0) ? stats.assetReturns : []
    };
    
    // FastAPI 서비스 상태 확인 (Hooks는 최상위에서 호출해야 함)
    const [marketServiceAvailable, setMarketServiceAvailable] = useState(true);
    
    useEffect(() => {
        let isMounted = true;
        let intervalId = null;
        
        const checkMarketService = async () => {
            let retries = 0;
            const maxRetries = 2;
            
            while (retries <= maxRetries && isMounted) {
                try {
                    const response = await axiosInstance.get('/api/market/health', {
                        timeout: 5000
                    });
                    if (isMounted) {
                        setMarketServiceAvailable(response.status === 200);
                    }
                    return;
                } catch (err) {
                    retries++;
                    if (retries > maxRetries) {
                        if (isMounted) {
                            setMarketServiceAvailable(false);
                        }
                    } else if (isMounted) {
                        await new Promise(resolve => setTimeout(resolve, 500 * retries));
                    }
                }
            }
        };
        
        checkMarketService();
        intervalId = setInterval(checkMarketService, 30000);
        
        return () => {
            isMounted = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, []);

    // FOLIO 토큰 잔액 조회
    useEffect(() => {
        if (!isLoggedIn || !userInfo?.walletAddress) {
            return;
        }

        const fetchTokenBalance = async () => {
            try {
                dispatch(setRewardsLoading(true));
                const response = await axiosInstance.get('/api/blockchain/token/balance', {
                    params: { address: userInfo.walletAddress }
                });
                
                if (response.data) {
                    dispatch(setTokenBalance(response.data));
                }
            } catch (err) {
                console.error('토큰 잔액 조회 실패:', err);
                // 블록체인 API가 연결되지 않은 경우 조용히 무시
                dispatch(setRewardsError('토큰 잔액을 불러올 수 없습니다.'));
            } finally {
                dispatch(setRewardsLoading(false));
            }
        };

        fetchTokenBalance();
        // 30초마다 잔액 갱신
        const intervalId = setInterval(fetchTokenBalance, 30000);
        return () => clearInterval(intervalId);
    }, [dispatch, isLoggedIn, userInfo?.walletAddress]);

    console.log('=== 대시보드 데이터 검증 ===');
    console.log('Redux stats:', stats);
    console.log('표시 데이터:', displayData);
    console.log('로그인 사용자:', userInfo);
    console.log('자산별 수익률 개수:', displayData.assetReturns.length);

    if (isLoading) {
        return <div className="container mx-auto p-4 max-w-md text-center mt-10">데이터를 불러오는 중입니다...</div>;
    }

    if (error) {
        return <div className="container mx-auto p-4 max-w-md text-center mt-10 text-red-600">오류 발생: {error}</div>;
    }

    const pieChartData = {
        labels: displayData.assetAllocations.map(item => {
            const typeLabels = {
                'STOCK': '주식',
                'COIN': '코인',
                'STABLECOIN': '스테이블코인',
                'DEFI': 'DeFi',
                'NFT': 'NFT',
                'OTHER': '기타'
            };
            return typeLabels[item.assetType] || item.assetType;
        }),
        datasets: [{
            label: '자산 배분',
            data: displayData.assetAllocations.map(item => item.value),
            backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)',
                'rgba(255, 159, 64, 0.8)',
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
        }]
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const percentage = displayData.assetAllocations[context.dataIndex]?.percentage || 0;
                        return `${label}: ${formatCurrency(value)} (${percentage.toFixed(1)}%)`;
                    }
                }
            }
        }
    };

    const generateMockTimeSeriesData = () => {
        const days = 30;
        const baseValue = displayData.totalInitialInvestment || 1000000;
        const currentValue = displayData.totalMarketValue || baseValue;
        const dates = [];
        const values = [];
        
        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }));
            
            const progress = (days - i) / days;
            const value = baseValue + (currentValue - baseValue) * progress;
            values.push(value);
        }
        
        return { dates, values };
    };

    const timeSeriesData = generateMockTimeSeriesData();

    const lineChartData = {
        labels: timeSeriesData.dates,
        datasets: [{
            label: '총 자산 가치',
            data: timeSeriesData.values,
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.3,
            fill: true,
        }]
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return formatCurrency(context.parsed.y);
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value);
                    }
                }
            }
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-md"> 
            <h1 className="text-2xl font-bold mb-4">대시보드</h1>
            <p className="mb-6 text-gray-600">
                안녕하세요, {userInfo?.nickname || '사용자'}님! 포트폴리오 현황을 확인하세요.
            </p>

            {/* FOLIO 토큰 잔액 카드 */}
            {userInfo?.walletAddress && (
                <TokenBalanceCard 
                    balance={balance}
                    balanceFormatted={balanceFormatted}
                    isLoading={isRewardsLoading}
                />
            )}

            {/* NFT 인증서 갤러리 */}
            {userInfo?.walletAddress && (
                <NFTCarousel />
            )}

            {/* 지갑 미연결 사용자를 위한 안내 */}
            {!userInfo?.walletAddress && (
                <WalletConnectPrompt />
            )}

            {/* 시장 데이터 서비스 상태 알림 */}
            {!marketServiceAvailable && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-amber-600">⚠</span>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-800">시장 데이터 서비스 미연결</p>
                            <p className="text-xs text-amber-700 mt-1">
                                실시간 가격을 불러올 수 없어 수익률이 0%로 표시될 수 있습니다. FastAPI 서버를 확인해주세요.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 시장 지수 */}
            {marketIndices.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold">주요 지수</h2>
                        <button 
                            onClick={() => navigate('/market')}
                            className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                            더 보기 >
                        </button>
                    </div>
                    <div className="space-y-2">
                        {marketIndices.slice(0, 3).map((idx) => (
                            <div key={idx.symbol} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-gray-800">{idx.display}</span>
                                    <span className="text-sm text-gray-500">{idx.name}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-semibold">{idx.value.toFixed(2)}</div>
                                    <div className={`text-xs ${getReturnColorClass(idx.change_percent)}`}>
                                        {formatPercentage(idx.change_percent)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                    onClick={() => navigate('/market')}
                    className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-4 rounded-lg flex flex-col items-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition"
                >
                    <span className="text-3xl">🇺🇸</span>
                    <span className="font-semibold">해외주식</span>
                </button>
                <button 
                    onClick={() => navigate('/market')}
                    className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white p-4 rounded-lg flex flex-col items-center gap-2 hover:from-blue-700 hover:to-cyan-700 transition"
                >
                    <span className="text-3xl">🇰🇷</span>
                    <span className="font-semibold">국내주식</span>
                </button>
                <button 
                    onClick={() => navigate('/market')}
                    className="bg-gradient-to-br from-yellow-600 to-orange-600 text-white p-4 rounded-lg flex flex-col items-center gap-2 hover:from-yellow-700 hover:to-orange-700 transition"
                >
                    <span className="text-3xl">🏅</span>
                    <span className="font-semibold">채권</span>
                </button>
                <button 
                    onClick={() => navigate('/market')}
                    className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-4 rounded-lg flex flex-col items-center gap-2 hover:from-emerald-700 hover:to-teal-700 transition"
                >
                    <span className="text-3xl">📊</span>
                    <span className="font-semibold">ETF</span>
                </button>
            </div>

            {/* 주요 통계 카드 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">총 자산 가치</p>
                    <p className="text-xl font-bold text-indigo-600">
                        {formatCurrency(displayData.totalMarketValue)}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">총 수익률</p>
                    <p className={`text-xl font-bold ${getReturnColorClass(displayData.totalReturnRate)}`}>
                        {formatPercentage(displayData.totalReturnRate)}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow col-span-2">
                    <p className="text-sm text-gray-500">총 손익</p>
                    <p className={`text-xl font-bold ${getReturnColorClass(displayData.totalGainLoss)}`}>
                         {formatCurrency(displayData.totalGainLoss)}
                    </p>
                </div>
            </div>

            {/* Top Gainers Preview */}
            {topGainers.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold">급상승 종목</h2>
                        <button 
                            onClick={() => navigate('/market')}
                            className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                            전체 보기 >
                        </button>
                    </div>
                    <div className="space-y-2">
                        {topGainers.map((item, idx) => (
                            <div key={item.ticker || idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <div>
                                    <div className="font-semibold text-gray-800 text-sm">{item.ticker}</div>
                                    <div className="text-xs text-gray-600">{item.name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-semibold">{item.current_price?.toFixed(2)}</div>
                                    <div className="text-xs text-green-600">+{item.change_percent?.toFixed(2)}%</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 자산별 수익률 분석 */}
            {displayData.assetReturns.length > 0 ? (
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h2 className="text-xl font-semibold mb-3">자산별 수익률</h2>
                    <div className="space-y-2">
                        {displayData.assetReturns.map((asset) => (
                            <div key={asset.assetId || asset.ticker} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-800 text-sm">{asset.ticker}</span>
                                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">{asset.assetType}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">{asset.name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-semibold text-gray-800">{formatCurrency(asset.currentValue)}</div>
                                    <div className={`text-xs font-semibold ${getReturnColorClass(asset.returnRate)}`}>
                                        {formatPercentage(asset.returnRate)}
                                    </div>
                                    <div className={`text-xs ${getReturnColorClass(asset.gainLoss)}`}>
                                        {formatCurrency(asset.gainLoss)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h2 className="text-xl font-semibold mb-3">자산별 수익률</h2>
                    <div className="text-center py-8 text-gray-500">
                        <p>포트폴리오에 등록된 자산이 없습니다.</p>
                        <p className="text-sm mt-2">포트폴리오 페이지에서 자산을 추가해주세요.</p>
                    </div>
                </div>
            )}

            {/* 자산 배분 차트 */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h2 className="text-xl font-semibold mb-3">자산 배분</h2>
                <div className="h-64">
                    {displayData.assetAllocations.length > 0 ? (
                        <Pie data={pieChartData} options={pieChartOptions} />
                    ) : (
                        <div className="h-full flex justify-center items-center">
                            <p className="text-gray-400">자산 데이터가 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 자산 추이 차트 */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                 <h2 className="text-xl font-semibold mb-3">자산 추이 (최근 30일)</h2>
                <div className="h-64">
                    {displayData.totalMarketValue > 0 ? (
                        <Line data={lineChartData} options={lineChartOptions} />
                    ) : (
                        <div className="h-full flex justify-center items-center">
                            <p className="text-gray-400">자산 데이터가 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 히트맵 분석 */}
            {heatmapData && heatmapData.sectors && heatmapData.sectors.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h2 className="text-xl font-semibold mb-3">섹터별 히트맵 분석</h2>
                    <div className="space-y-3">
                        {heatmapData.sectors.map((sector, idx) => {
                            const getHeatmapColor = (change) => {
                                if (change > 3) return 'bg-green-600';
                                if (change > 1) return 'bg-green-400';
                                if (change > -1) return 'bg-gray-300';
                                if (change > -3) return 'bg-red-400';
                                return 'bg-red-600';
                            };
                            
                            const getRiskBadgeColor = (risk) => {
                                if (risk === 'high') return 'bg-red-100 text-red-700';
                                if (risk === 'medium') return 'bg-yellow-100 text-yellow-700';
                                return 'bg-green-100 text-green-700';
                            };
                            
                            return (
                                <div key={idx} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-800">{sector.sector}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${getRiskBadgeColor(sector.riskLevel)}`}>
                                                {sector.riskLevel === 'high' ? '높음' : sector.riskLevel === 'medium' ? '보통' : '낮음'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-semibold text-gray-800">{formatCurrency(sector.value)}</div>
                                            <div className={`text-xs font-semibold ${getReturnColorClass(sector.changePercent)}`}>
                                                {formatPercentage(sector.changePercent)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className={`flex-1 h-3 rounded ${getHeatmapColor(sector.changePercent)}`} 
                                             style={{ minWidth: '100px' }}></div>
                                        <span className="text-xs text-gray-500">{sector.assetCount}개 자산</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">총 시장 가치</span>
                            <span className="font-semibold text-gray-800">{formatCurrency(heatmapData.totalValue)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 위험 지표 분석 */}
            {riskMetrics && (
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h2 className="text-xl font-semibold mb-3">위험 지표 분석</h2>
                    <div className="space-y-4">
                        {/* 위험 수준 배지 */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-600">위험 수준:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                riskMetrics.riskLevel === 'high' 
                                    ? 'bg-red-100 text-red-700' 
                                    : riskMetrics.riskLevel === 'medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                            }`}>
                                {riskMetrics.riskLevel === 'high' ? '높음' : riskMetrics.riskLevel === 'medium' ? '보통' : '낮음'}
                            </span>
                        </div>

                        {/* 위험 지표 그리드 */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">변동성 (Volatility)</p>
                                <p className="text-lg font-bold text-blue-700">{riskMetrics.volatility?.toFixed(2) || '0.00'}%</p>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">최대 낙폭 (MDD)</p>
                                <p className="text-lg font-bold text-purple-700">{riskMetrics.mdd?.toFixed(2) || '0.00'}%</p>
                            </div>
                            <div className="bg-indigo-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">베타 (Beta)</p>
                                <p className="text-lg font-bold text-indigo-700">{riskMetrics.beta?.toFixed(2) || '1.00'}</p>
                            </div>
                            <div className="bg-teal-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">샤프 비율</p>
                                <p className="text-lg font-bold text-teal-700">{riskMetrics.sharpeRatio?.toFixed(2) || 'N/A'}</p>
                            </div>
                        </div>

                        {/* 리밸런싱 권장 알림 */}
                        {riskMetrics.riskLevel !== 'low' && (
                            <div className={`p-3 rounded-lg border-l-4 ${
                                riskMetrics.riskLevel === 'high'
                                    ? 'bg-red-50 border-red-500'
                                    : 'bg-yellow-50 border-yellow-500'
                            }`}>
                                <div className="flex items-start gap-2">
                                    <span className="text-lg">
                                        {riskMetrics.riskLevel === 'high' ? '⚠' : '⚡'}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800 mb-1">리밸런싱 권장</p>
                                        <p className="text-xs text-gray-700">{riskMetrics.recommendation}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
