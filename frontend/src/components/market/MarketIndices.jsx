import React from 'react';
import { useNavigate } from 'react-router-dom';

const formatPercentChange = (value) => {
    if (value === null || value === undefined) return '-';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const getReturnColorClass = (rate) => {
    if (rate === undefined || rate === null) return 'text-gray-600';
    return rate > 0 ? 'text-green-600' : rate < 0 ? 'text-red-600' : 'text-gray-600';
};

const MarketIndices = ({ indices = [] }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-lg shadow mb-4">
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold">주요 지수</h3>
                <button
                    onClick={() => navigate('/market')}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                    더 보기 &gt;
                </button>
            </div>
            <div className="space-y-2">
                {indices.slice(0, 3).map((idx) => (
                    <div key={idx.symbol} className="flex items-center justify-between py-2 px-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-800 text-sm">{idx.display}</span>
                            <span className="text-xs text-gray-500">{idx.name}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-semibold">{idx.value.toFixed(2)}</div>
                            <div className={`text-xs font-medium ${getReturnColorClass(idx.change_percent)}`}>
                                {formatPercentChange(idx.change_percent)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketIndices;

