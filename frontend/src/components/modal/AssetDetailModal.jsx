import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';
import BasicButton from '../button/BasicButton.jsx';
import useInput from '../../hooks/useInput';
import { updateAsset } from '../../modules/portfolio'; // updateAsset 액션 import
import { setDashboardStats, setLoading as setDashboardLoading, setError as setDashboardError } from '../../modules/dashboard';

const ASSET_TYPES = [
    { value: 'STOCK', label: '주식 (STOCK)' },
    { value: 'COIN', label: '코인 (COIN)' },
    { value: 'BLOCKCHAIN', label: '기타 블록체인 자산' },
];

const AssetDetailModal = ({ isOpen, onClose, asset, portfolioId, onChanged }) => {
    const dispatch = useDispatch();
    const [isEditing, setIsEditing] = useState(false); // 수정 모드
    const [error, setError] = useState('');
    
    // 수정 필드 상태
    const [name, onChangeName] = useInput(asset.name || '');
    const [quantity, onChangeQuantity] = useInput(asset.quantity);
    const [avgBuyPrice, onChangeAvgBuyPrice] = useInput(asset.avgBuyPrice);
    const [assetType, setAssetType] = useState(asset.assetType || ASSET_TYPES[0].value);
    
    // 모달 열릴 때 상태 초기화
    useEffect(() => {
        if (asset) {
            onChangeName({ target: { value: asset.name || '' } });
            onChangeQuantity({ target: { value: asset.quantity } });
            onChangeAvgBuyPrice({ target: { value: asset.avgBuyPrice } });
            setAssetType(asset.assetType || ASSET_TYPES[0].value);
            setIsEditing(false); // 모달이 다시 열리면 보기 모드 시작
            setError('');
        }
    }, [asset, isOpen]);

    if (!isOpen || !asset) return null;

    // 임시 시세 데이터 (향후 시세 연동 예정)
    const currentPrice = 1.25; 
    const valuation = asset.quantity * currentPrice;
    const initialValue = asset.quantity * asset.avgBuyPrice;
    const gainLoss = valuation - initialValue;
    const returnRate = (gainLoss / initialValue) * 100;
    const returnColor = returnRate > 0 ? 'text-green-500' : returnRate < 0 ? 'text-red-500' : 'text-gray-500';


    // 자산 수정 제출
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const newQuantity = parseFloat(quantity);
        const newAvgBuyPrice = parseFloat(avgBuyPrice);
        
        if (newQuantity <= 0 || newAvgBuyPrice <= 0) {
            setError('수량과 매입 가격은 0보다 커야 합니다.');
            return;
        }

        try {
            // [API 호출]: PUT /api/portfolios/{portfolioId}/assets/{assetId}
            const updatedData = {
                name: name.trim(),
                quantity: newQuantity,
                avgBuyPrice: newAvgBuyPrice,
                assetType: assetType,
                ticker: asset.ticker // 티커는 수정 불가로 가정
            };
            
            // 낙관적 업데이트: 기존 값을 백업, UI 먼저 반영
            const previous = { ...asset };
            const optimistic = { ...asset, ...updatedData };
            dispatch(updateAsset(portfolioId, optimistic));

            const response = await axiosInstance.put(`/api/portfolios/${portfolioId}/assets/${asset.id}`, updatedData);
            const updatedAsset = response.data;
            // 서버 응답으로 한 번 더 확정 반영
            dispatch(updateAsset(portfolioId, updatedAsset));
            alert(`${updatedAsset.name} 자산 정보가 수정되었습니다.`);
            if (onChanged) {
                try { await onChanged(); } catch (_) {}
            }
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
            setIsEditing(false);
            // onClose(); // 수정 후 모달을 닫을 수도 있음 (선택 사항)

        } catch (error) {
            console.error("자산 수정 실패:", error.response ? error.response.data : error.message);
            const errorMessage = error.response?.data?.error || '자산 수정 중 오류가 발생했습니다.';
            setError(errorMessage);
            // 롤백: 전달받은 asset으로 복구
            try { dispatch(updateAsset(portfolioId, asset)); } catch (_) {}
        }
    };


    // 모달 배경 및 컨테이너 (모바일 뷰 고정)
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
                
                {/* 모달 헤더 */}
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold">{asset.name || asset.ticker} 상세</h3>
                    {isEditing ? (
                        <BasicButton onClick={() => setIsEditing(false)} size="sm" className="bg-gray-500 hover:bg-gray-600">취소</BasicButton>
                    ) : (
                        <BasicButton onClick={onClose} size="sm">닫기</BasicButton>
                    )}
                </div>

                {/* 모달 본문 */}
                <div className="p-4 max-h-[80vh] overflow-y-auto">
                    
                    {error && <p className="text-sm text-red-600 mb-4 text-center">{error}</p>}
                    
                    {/* [보기 모드] */}
                    {!isEditing && (
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-700">보유 현황</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <p className="text-sm"><span className="font-medium text-gray-500">평단가:</span> ₩{asset.avgBuyPrice.toFixed(2)}</p>
                                <p className="text-sm"><span className="font-medium text-gray-500">현재가:</span> ₩{currentPrice.toFixed(2)}</p>
                                <p className="text-sm"><span className="font-medium text-gray-500">수량:</span> {asset.quantity.toFixed(4)}</p>
                                <p className={`font-semibold ${returnColor}`}><span className="font-medium text-gray-500">수익률:</span> {returnRate.toFixed(2)}%</p>
                                <p className="text-sm col-span-2"><span className="font-medium text-gray-500">평가 금액:</span> ₩{valuation.toFixed(2)}</p>
                            </div>
                            
                            <hr className="my-4" />
                            
                            {/* TODO: 차트 영역 (P2-2 단계에서 FastAPI 연동 후 수정) */}
                            <div className="h-48 bg-gray-100 flex items-center justify-center rounded">
                                <p className="text-gray-400">차트 영역 (API 연동 예정)</p>
                            </div>

                            <BasicButton onClick={() => setIsEditing(true)} className="w-full bg-blue-500 hover:bg-blue-600">
                                자산 정보 수정
                            </BasicButton>
                        </div>
                    )}
                    
                    {/* [수정 모드] */}
                    {isEditing && (
                        <form onSubmit={handleUpdateSubmit} className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-700">자산 정보 수정</h4>
                            
                            {/* 자산 이름 수정 */}
                            <div>
                                <label htmlFor="editName" className="block text-sm font-medium text-gray-700">자산 이름</label>
                                <input id="editName" type="text" value={name} onChange={onChangeName} className="w-full px-3 py-2 mt-1 border rounded-md" placeholder="자산 이름" />
                            </div>
                            
                            {/* 자산 유형 수정 (티커 수정이 없으므로, 유형도 수정 가능하도록) */}
                            <div>
                                <label htmlFor="editAssetType" className="block text-sm font-medium text-gray-700">자산 유형 *</label>
                                <select
                                    id="editAssetType"
                                    value={assetType}
                                    onChange={(e) => setAssetType(e.target.value)}
                                    className="w-full px-3 py-2 mt-1 border rounded-md"
                                >
                                    {ASSET_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 수량 수정 */}
                            <div>
                                <label htmlFor="editQuantity" className="block text-sm font-medium text-gray-700">보유 수량 *</label>
                                <input id="editQuantity" type="number" min="0.000001" step="any" value={quantity} onChange={onChangeQuantity} required className="w-full px-3 py-2 mt-1 border rounded-md" />
                            </div>
                            
                            {/* 평균 매입 가격 수정 */}
                            <div>
                                <label htmlFor="editAvgBuyPrice" className="block text-sm font-medium text-gray-700">평균 매입 가격 *</label>
                                <input id="editAvgBuyPrice" type="number" min="0.000001" step="any" value={avgBuyPrice} onChange={onChangeAvgBuyPrice} required className="w-full px-3 py-2 mt-1 border rounded-md" />
                            </div>

                            <BasicButton type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                변경 사항 저장
                            </BasicButton>
                        </form>
                    )}
                </div>
                
            </div>
        </div>
    );
};

export default AssetDetailModal;