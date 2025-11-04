import React from 'react';
import { FiAward, FiDollarSign } from 'react-icons/fi';

const TokenBalanceCard = ({ balance, balanceFormatted, isLoading }) => {
    return (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <FiAward className="text-2xl" />
                        My FOLIO 토큰
                    </h3>
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            <p className="text-2xl font-bold">로딩 중...</p>
                        </div>
                    ) : (
                        <p className="text-3xl font-bold">{balanceFormatted}</p>
                    )}
                    <p className="text-sm mt-2 opacity-90">
                        활동 기반 리워드 토큰
                    </p>
                </div>
                <div className="text-right">
                    <div className="bg-white bg-opacity-20 rounded-full p-3">
                        <FiDollarSign className="text-4xl" />
                    </div>
                </div>
            </div>
            
            {/* 잔액이 0일 때 안내 메시지 */}
            {!isLoading && balance === 0 && (
                <div className="mt-4 bg-white bg-opacity-20 rounded-md p-3 text-sm">
                    자산을 추가하면 FOLIO 토큰을 획득할 수 있습니다!
                </div>
            )}
        </div>
    );
};

export default TokenBalanceCard;

