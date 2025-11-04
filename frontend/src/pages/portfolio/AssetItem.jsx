import React from 'react';
import { useDispatch } from 'react-redux';
import { addAsset } from '../../modules/portfolio';
import axiosInstance from '../../api/axiosInstance';
import BasicButton from '../../components/button/BasicButton.jsx';
import { deleteAsset } from '../../modules/portfolio'; 
import { setDashboardStats, setLoading as setDashboardLoading, setError as setDashboardError } from '../../modules/dashboard';
// FiEdit는 수정 버튼이 제거되면서 필요 없으므로 제거
import { FiTrash2 } from 'react-icons/fi'; // 아이콘 import

const AssetItem = ({ asset, portfolioId, onClick, onChanged }) => {
    const dispatch = useDispatch();

    // 안전한 데이터 접근
    const quantity = asset?.quantity || 0;
    const avgBuyPrice = asset?.avgBuyPrice || 0;
    const currentPrice = 1.25; // 임시 데이터
    const valuation = quantity * currentPrice;
    const initialValue = quantity * avgBuyPrice;
    const gainLoss = valuation - initialValue;
    const returnRate = (initialValue > 0) ? (gainLoss / initialValue) * 100 : 0;
    
    // 수익률 색상
    const returnColor = returnRate > 0 ? 'text-green-500' : returnRate < 0 ? 'text-red-500' : 'text-gray-500';

    // 자산 삭제 (낙관적)
    const handleDelete = async (e) => {
        e.stopPropagation(); // 부모 항목 클릭 (상세 모달) 이벤트 방지

        if (!window.confirm(`자산 ${asset.name || asset.ticker}를 포트폴리오에서 삭제하시겠습니까?`)) {
            return;
        }
        
        // 낙관적 제거
        dispatch(deleteAsset(portfolioId, asset.id));
        try {
            await axiosInstance.delete(`/api/portfolios/${portfolioId}/assets/${asset.id}`);
            alert(`자산 ${asset.name || asset.ticker}가 성공적으로 삭제되었습니다.`);
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
        } catch (error) {
            console.error("자산 삭제 실패:", error.response ? error.response.data : error.message);
            alert('자산 삭제 중 오류가 발생했습니다. 변경을 되돌립니다.');
            // 롤백: 삭제했던 자산을 다시 추가
            try { dispatch(addAsset(portfolioId, asset)); } catch (_) {}
        }
    };

    return (
        <div 
            // 자산 항목 전체를 클릭하여 상세 모달을 열도록 유도
            className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition duration-150" 
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-lg font-semibold text-gray-800">{asset.name || asset.ticker}</p>
                    <p className="text-xs text-gray-500">{asset.assetType} | {asset.ticker}</p>
                </div>
                <div className="flex space-x-2">
                    {/* [★★★ 수정 버튼 제거 완료 ★★★] 수정은 상세 모달(onClick) 내에서 이루어집니다. */}
                    
                    {/* 삭제 버튼 */}
                    <BasicButton 
                        onClick={handleDelete} 
                        size="sm" 
                        className="bg-red-500 hover:bg-red-600 px-2 py-1"
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </BasicButton>
                </div>
            </div>

            <div className="flex justify-between text-sm mt-3">
                <div>
                    <p className="text-gray-600">수량: {quantity.toFixed(4)}</p>
                    <p className="text-gray-600">평단: ₩{avgBuyPrice.toFixed(2)}</p>
                </div>
                <div className="text-right">
                    <p className="font-medium text-gray-800">평가액: ₩{valuation.toFixed(2)}</p>
                    <p className={`font-semibold ${returnColor}`}>수익률: {returnRate.toFixed(2)}%</p>
                </div>
            </div>
        </div>
    );
};

export default AssetItem;