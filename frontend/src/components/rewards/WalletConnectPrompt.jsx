import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCreditCard, FiExternalLink } from 'react-icons/fi';

const WalletConnectPrompt = () => {
    const navigate = useNavigate();
    
    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 mb-6 border border-blue-200">
            <div className="flex items-start gap-4">
                <div className="bg-blue-500 rounded-full p-3">
                    <FiCreditCard className="text-2xl text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                        지갑 주소 등록하고 블록체인 리워드 받기
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        지갑 주소를 등록하면 포트폴리오 활동에 따라 FOLIO 토큰을 받고, 성과 NFT를 발행받을 수 있습니다.
                    </p>
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="text-blue-600 font-semibold">✓</span>
                            <span>자산 추가 시 자동으로 FOLIO 토큰 획득</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="text-blue-600 font-semibold">✓</span>
                            <span>포트폴리오 성과 달성 시 NFT 인증서 발행</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="text-blue-600 font-semibold">✓</span>
                            <span>리워드를 Ethereum 블록체인에 영구 기록</span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            // MyPage로 이동하여 지갑 연결 유도
                            navigate('/mypage');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                        지갑 주소 등록하기
                    </button>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>ℹ</span>
                    <span>MetaMask가 없으신가요?</span>
                    <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                        설치하기 <FiExternalLink className="text-xs" />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default WalletConnectPrompt;

