// frontend/src/pages/portfolio/AssetInsert.jsx

import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';
import useInput from '../../hooks/useInput';
import BasicButton from '../../components/button/BasicButton.jsx';
import { addAsset } from '../../modules/portfolio'; 
import { setDashboardStats, setLoading as setDashboardLoading, setError as setDashboardError } from '../../modules/dashboard';

// 자산 유형 옵션
const ASSET_TYPES = [
    { value: 'STOCK', label: '주식 (STOCK)' },
    { value: 'COIN', label: '코인 (COIN)' },
    { value: 'STABLECOIN', label: '스테이블코인 (STABLECOIN)' },
    { value: 'DEFI', label: 'DeFi 토큰 (DEFI)' },
    { value: 'NFT', label: 'NFT (NFT)' },
    { value: 'OTHER', label: '기타 (OTHER)' },
];

// 추천 주식 티커 예시 (미국 + 한국)
const POPULAR_STOCKS = [
    // 미국 주식
    { ticker: 'AAPL', name: 'Apple Inc.', region: 'US' },
    { ticker: 'MSFT', name: 'Microsoft Corporation', region: 'US' },
    { ticker: 'GOOGL', name: 'Alphabet Inc. (Google)', region: 'US' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', region: 'US' },
    { ticker: 'TSLA', name: 'Tesla Inc.', region: 'US' },
    { ticker: 'NVDA', name: 'NVIDIA Corporation', region: 'US' },
    { ticker: 'META', name: 'Meta Platforms Inc.', region: 'US' },
    { ticker: 'BRK.B', name: 'Berkshire Hathaway', region: 'US' },
    { ticker: 'JPM', name: 'JPMorgan Chase & Co.', region: 'US' },
    { ticker: 'V', name: 'Visa Inc.', region: 'US' },
    { ticker: 'JNJ', name: 'Johnson & Johnson', region: 'US' },
    { ticker: 'WMT', name: 'Walmart Inc.', region: 'US' },
    { ticker: 'PG', name: 'Procter & Gamble', region: 'US' },
    { ticker: 'MA', name: 'Mastercard Inc.', region: 'US' },
    { ticker: 'DIS', name: 'Walt Disney Company', region: 'US' },
    { ticker: 'NFLX', name: 'Netflix Inc.', region: 'US' },
    { ticker: 'ADBE', name: 'Adobe Inc.', region: 'US' },
    { ticker: 'CRM', name: 'Salesforce Inc.', region: 'US' },
    { ticker: 'PYPL', name: 'PayPal Holdings Inc.', region: 'US' },
    { ticker: 'INTC', name: 'Intel Corporation', region: 'US' },
    { ticker: 'AMD', name: 'Advanced Micro Devices', region: 'US' },
    { ticker: 'COIN', name: 'Coinbase Global Inc.', region: 'US' },
    // 한국 주식 (KRX 코드)
    { ticker: '005930.KS', name: '삼성전자', region: 'KR' },
    { ticker: '000660.KS', name: 'SK하이닉스', region: 'KR' },
    { ticker: '035420.KS', name: 'NAVER', region: 'KR' },
    { ticker: '035720.KS', name: '카카오', region: 'KR' },
    { ticker: '005380.KS', name: '현대차', region: 'KR' },
    { ticker: '051910.KS', name: 'LG화학', region: 'KR' },
    { ticker: '006400.KS', name: '삼성SDI', region: 'KR' },
    { ticker: '207940.KS', name: '삼성바이오로직스', region: 'KR' },
];

// 추천 암호화폐 티커 예시
const POPULAR_COINS = [
    { ticker: 'BTC-USD', name: 'Bitcoin', marketCap: '1' },
    { ticker: 'ETH-USD', name: 'Ethereum', marketCap: '2' },
    { ticker: 'BNB-USD', name: 'Binance Coin', marketCap: '3' },
    { ticker: 'XRP-USD', name: 'Ripple', marketCap: '4' },
    { ticker: 'ADA-USD', name: 'Cardano', marketCap: '5' },
    { ticker: 'SOL-USD', name: 'Solana', marketCap: '6' },
    { ticker: 'DOGE-USD', name: 'Dogecoin', marketCap: '7' },
    { ticker: 'DOT-USD', name: 'Polkadot', marketCap: '8' },
    { ticker: 'MATIC-USD', name: 'Polygon', marketCap: '9' },
    { ticker: 'AVAX-USD', name: 'Avalanche', marketCap: '10' },
    { ticker: 'LINK-USD', name: 'Chainlink', marketCap: '11' },
    { ticker: 'ATOM-USD', name: 'Cosmos', marketCap: '12' },
    { ticker: 'UNI-USD', name: 'Uniswap', marketCap: '13' },
    { ticker: 'LTC-USD', name: 'Litecoin', marketCap: '14' },
    { ticker: 'ALGO-USD', name: 'Algorand', marketCap: '15' },
    { ticker: 'VET-USD', name: 'VeChain', marketCap: '16' },
    { ticker: 'XLM-USD', name: 'Stellar', marketCap: '17' },
    { ticker: 'FIL-USD', name: 'Filecoin', marketCap: '18' },
];

// 추천 스테이블코인 예시
const POPULAR_STABLECOINS = [
    { ticker: 'USDT-USD', name: 'Tether', type: 'USD' },
    { ticker: 'USDC-USD', name: 'USD Coin', type: 'USD' },
    { ticker: 'BUSD-USD', name: 'Binance USD', type: 'USD' },
    { ticker: 'DAI-USD', name: 'Dai', type: 'USD' },
    { ticker: 'TUSD-USD', name: 'TrueUSD', type: 'USD' },
];

// 추천 DeFi 토큰 예시
const POPULAR_DEFI = [
    { ticker: 'UNI-USD', name: 'Uniswap', protocol: 'DEX' },
    { ticker: 'AAVE-USD', name: 'Aave', protocol: 'Lending' },
    { ticker: 'SUSHI-USD', name: 'SushiSwap', protocol: 'DEX' },
    { ticker: 'COMP-USD', name: 'Compound', protocol: 'Lending' },
    { ticker: 'MKR-USD', name: 'Maker', protocol: 'Stablecoin' },
    { ticker: 'SNX-USD', name: 'Synthetix', protocol: 'Derivatives' },
    { ticker: 'CRV-USD', name: 'Curve DAO', protocol: 'DEX' },
    { ticker: 'YFI-USD', name: 'yearn.finance', protocol: 'Yield' },
];

const AssetInsert = ({ portfolioId, onInsertSuccess }) => {
    const dispatch = useDispatch();
    const portfolios = useSelector(state => state.portfolio?.list || []);
    const currentAssets = portfolios.find(p => p.id === portfolioId)?.assets || [];
    
    // 상태 관리
    const [assetType, setAssetType] = useState(ASSET_TYPES[0].value);
    const [inputMode, setInputMode] = useState('select'); // 'select' 또는 'manual'
    const [selectedTicker, setSelectedTicker] = useState('');
    const [manualTicker, setManualTicker] = useState('');
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [avgBuyPrice, setAvgBuyPrice] = useState('');
    const [error, setError] = useState('');

    // 자산 유형에 따른 추천 티커
    const recommendedTickers = useMemo(() => {
        switch (assetType) {
            case 'STOCK':
                return POPULAR_STOCKS;
            case 'COIN':
                return POPULAR_COINS;
            case 'STABLECOIN':
                return POPULAR_STABLECOINS;
            case 'DEFI':
                return POPULAR_DEFI;
            default:
                return [];
        }
    }, [assetType]);

    // 자산 유형 변경 시 티커 초기화
    const handleAssetTypeChange = (e) => {
        setAssetType(e.target.value);
        setSelectedTicker('');
        setManualTicker('');
        setName('');
    };

    // 티커 선택 시 이름 자동 채움
    const handleTickerSelect = (e) => {
        const selected = e.target.value;
        setSelectedTicker(selected);
        
        // 선택한 티커에 해당하는 이름 자동 입력
        const tickerInfo = recommendedTickers.find(t => t.ticker === selected);
        if (tickerInfo) {
            setName(tickerInfo.name);
        }
    };

    // 입력 모드 토글
    const toggleInputMode = () => {
        setInputMode(prev => prev === 'select' ? 'manual' : 'select');
        setSelectedTicker('');
        setManualTicker('');
        setName('');
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 최종 티커 결정
        const finalTicker = inputMode === 'select' ? selectedTicker : manualTicker;

        // 입력값 검사
        if (!finalTicker.trim()) {
            setError('티커/심볼을 입력하거나 선택해주세요.');
            return;
        }
        
        const quantityNum = parseFloat(quantity);
        const priceNum = parseFloat(avgBuyPrice);
        
        if (isNaN(quantityNum) || quantityNum <= 0) {
            setError('수량을 0보다 큰 숫자로 입력해주세요.');
            return;
        }
        
        if (isNaN(priceNum) || priceNum <= 0) {
            setError('평균 매입 가격을 0보다 큰 숫자로 입력해주세요.');
            return;
        }

        console.log('자산 추가 요청:', {
            portfolioId,
            ticker: finalTicker.toUpperCase(),
            quantity: quantityNum,
            avgBuyPrice: priceNum,
            assetType,
            name: name.trim() || null
        });

        // 낙관적 추가: 임시 항목 먼저 반영
        const prevAssets = currentAssets;

        // 미리 추가(임시 ID)
        const tempAsset = {
            id: Date.now(),
            ticker: finalTicker.toUpperCase(),
            quantity: quantityNum,
            avgBuyPrice: priceNum,
            assetType: assetType,
            name: name.trim() || finalTicker.toUpperCase()
        };
        dispatch(addAsset(portfolioId, tempAsset));

        try {
            const response = await axiosInstance.post(`/api/portfolios/${portfolioId}/assets`, {
                ticker: finalTicker.toUpperCase(),
                quantity: quantityNum,
                avgBuyPrice: priceNum,
                assetType: assetType,
                name: name.trim() || null 
            });

            const newAsset = response.data;
            // 서버 자산으로 교체
            // 간단히: 임시 항목 제거 후 서버 항목 추가
            dispatch(addAsset(portfolioId, newAsset));

            alert(`자산 ${newAsset.name} (${newAsset.ticker})가 포트폴리오에 추가되었습니다.`);

            // 대시보드 즉시 갱신
            try {
                dispatch(setDashboardLoading(true));
                const statsResp = await axiosInstance.get('/api/dashboard/stats');
                dispatch(setDashboardStats(statsResp.data));
            } catch (e) {
                console.warn('대시보드 갱신 실패:', e);
                dispatch(setDashboardError(e.message));
            } finally {
                dispatch(setDashboardLoading(false));
            }

            // 성공 후 입력 폼 초기화 및 콜백
            setSelectedTicker('');
            setManualTicker('');
            setQuantity('');
            setAvgBuyPrice('');
            setName('');
            if (onInsertSuccess) onInsertSuccess();

        } catch (error) {
            console.error('자산 추가 실패:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || '자산 추가 중 오류가 발생했습니다.';
            setError(errorMessage);
            // 롤백
            // prevAssets로 복구: setAssetsForPortfolio 사용은 여기서 접근 불가하므로 onInsertSuccess에서 새로고침 되게 하거나, 단순 경고 후 페이지 새로고침
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">💼 새 자산 추가</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* 자산 유형 선택 */}
                <div>
                    <label htmlFor="assetType" className="block text-sm font-medium text-gray-700 mb-1">
                        자산 유형 *
                    </label>
                    <select
                        id="assetType"
                        value={assetType}
                        onChange={handleAssetTypeChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {ASSET_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                </div>

                {/* 티커 입력 모드 선택 */}
                {recommendedTickers.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-600">
                            {inputMode === 'select' ? '📋 추천 목록에서 선택' : '✏️ 직접 입력'}
                        </span>
                        <button
                            type="button"
                            onClick={toggleInputMode}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            {inputMode === 'select' ? '직접 입력하기' : '목록에서 선택하기'}
                        </button>
                    </div>
                )}

                {/* 티커/심볼 선택 (선택 모드) */}
                {inputMode === 'select' && recommendedTickers.length > 0 && (
                    <div>
                        <label htmlFor="tickerSelect" className="block text-sm font-medium text-gray-700 mb-1">
                            티커/심볼 선택 *
                        </label>
                        <select
                            id="tickerSelect"
                            value={selectedTicker}
                            onChange={handleTickerSelect}
                            required={inputMode === 'select'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">-- 티커를 선택하세요 --</option>
                            {recommendedTickers.map((item) => (
                                <option key={item.ticker} value={item.ticker}>
                                    {item.ticker} - {item.name}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            인기 {assetType === 'STOCK' ? '주식' : assetType === 'COIN' ? '암호화폐' : '자산'} 목록입니다
                        </p>
                    </div>
                )}

                {/* 티커/심볼 직접 입력 (수동 모드) */}
                {(inputMode === 'manual' || recommendedTickers.length === 0) && (
                    <div>
                        <label htmlFor="tickerManual" className="block text-sm font-medium text-gray-700 mb-1">
                            ✏️ 티커/심볼 직접 입력 *
                        </label>
                        <input
                            id="tickerManual"
                            type="text"
                            value={manualTicker}
                            onChange={(e) => setManualTicker(e.target.value)}
                            placeholder="예: AAPL, BTC-USD, 005930.KS"
                            required={inputMode === 'manual'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            정확한 티커 심볼을 입력하세요 (대소문자 구분 없음)
                        </p>
                    </div>
                )}
                
                {/* 이름 (선택 사항) */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        🏷️ 자산 이름 (선택)
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="예: 애플, 비트코인, 삼성전자"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        {inputMode === 'select' && selectedTicker 
                            ? '티커 선택 시 자동 입력됨' 
                            : '비워두면 티커로 자동 설정됩니다'}
                    </p>
                </div>
                
                {/* 수량 */}
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                        📦 보유 수량 *
                    </label>
                    <input
                        id="quantity"
                        type="number"
                        min="0.000001"
                        step="any"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0.00"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* 평균 매입 가격 */}
                <div>
                    <label htmlFor="avgBuyPrice" className="block text-sm font-medium text-gray-700 mb-1">
                        💰 평균 매입 가격 * (₩ 또는 USD)
                    </label>
                    <input
                        id="avgBuyPrice"
                        type="number"
                        min="0.000001"
                        step="any"
                        value={avgBuyPrice}
                        onChange={(e) => setAvgBuyPrice(e.target.value)}
                        placeholder="0.00"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                
                {/* 오류 메시지 */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <BasicButton type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors">
                    ➕ 자산 등록
                </BasicButton>
            </form>
        </div>
    );
};

export default AssetInsert;