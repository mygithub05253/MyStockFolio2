import React, { useState, useEffect } from 'react';
import { FiAward, FiClock, FiImage, FiExternalLink } from 'react-icons/fi';

const NFTCard = ({ nft }) => {
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Achievement Type 한글 변환
    const getAchievementTypeLabel = (type) => {
        const labels = {
            'milestone_1m': '첫 100만원',
            'milestone_10m': '천만원 달성',
            'milestone_100m': '1억 달성',
            'positive_return_7d': '7일 수익',
            'positive_return_30d': '30일 수익',
            'diversified_portfolio': '다양한 포트폴리오',
            'high_returns': '높은 수익률',
            'long_term_investor': '장기 투자자',
            'portfolio_maintained_90days': '90일 포트폴리오 유지',
            'return_rate_10percent': '10% 수익률 달성',
            'return_rate_20percent': '20% 수익률 달성',
            'return_rate_50percent': '50% 수익률 달성',
            'return_rate_100percent': '100% 수익률 달성'
        };
        return labels[type] || type;
    };

    // 타임스탬프 포맷팅
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '알 수 없음';
        
        const date = new Date(parseInt(timestamp) * 1000);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // IPFS 또는 로컬 메타데이터 조회
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                // 0. blockchain-api에서 이미 파싱된 메타데이터가 있는 경우 사용
                if (nft.metadata) {
                    setMetadata(nft.metadata);
                    setLoading(false);
                    return;
                }

                // 1. tokenURI가 data URI 형식인 경우 (base64 인코딩된 메타데이터)
                if (nft.tokenURI && nft.tokenURI.startsWith('data:application/json;base64,')) {
                    const base64Data = nft.tokenURI.split(',')[1];
                    try {
                        const decodedJson = atob(base64Data);
                        const parsedMetadata = JSON.parse(decodedJson);
                        setMetadata(parsedMetadata);
                        setLoading(false);
                        return;
                    } catch (decodeError) {
                        console.error('Base64 디코딩 실패:', decodeError);
                        // 계속해서 IPFS 조회 시도
                    }
                }

                // 2. IPFS 해시가 있는 경우
                if (nft.ipfsHash) {
                    // IPFS Gateway URL 생성
                    const gatewayURL = `https://gateway.pinata.cloud/ipfs/${nft.ipfsHash}`;
                    const response = await fetch(gatewayURL);
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch metadata from IPFS');
                    }
                    
                    const data = await response.json();
                    setMetadata(data);
                } else if (nft.tokenURI && nft.tokenURI.startsWith('ipfs://')) {
                    // 3. IPFS URI 형식인 경우
                    const ipfsHash = nft.tokenURI.replace('ipfs://', '');
                    const gatewayURL = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
                    const response = await fetch(gatewayURL);
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch metadata from IPFS');
                    }
                    
                    const data = await response.json();
                    setMetadata(data);
                } else {
                    // 4. 메타데이터가 없는 경우 - 기본 메타데이터 생성
                    setMetadata({
                        name: getAchievementTypeLabel(nft.achievementType),
                        description: '포트폴리오 성과 인증서',
                        attributes: []
                    });
                }
            } catch (err) {
                console.error('메타데이터 조회 실패:', err);
                // 에러 발생 시에도 기본 메타데이터 표시
                setMetadata({
                    name: getAchievementTypeLabel(nft.achievementType),
                    description: '포트폴리오 성과 인증서',
                    attributes: []
                });
            } finally {
                setLoading(false);
            }
        };

        fetchMetadata();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nft.ipfsHash, nft.tokenURI, nft.achievementType, nft.metadata]);

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-4 animate-pulse">
                <div className="h-48 bg-white bg-opacity-20 rounded-md mb-3"></div>
                <div className="h-6 bg-white bg-opacity-20 rounded mb-2"></div>
                <div className="h-4 bg-white bg-opacity-20 rounded w-2/3"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg shadow-lg p-4">
                <div className="flex items-center justify-center h-48 bg-white bg-opacity-20 rounded-md mb-3">
                    <FiImage className="text-6xl text-white opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">
                    {getAchievementTypeLabel(nft.achievementType)}
                </h3>
                <p className="text-sm text-white opacity-75">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg overflow-hidden">
            {/* NFT 이미지 또는 플레이스홀더 */}
            <div className="relative h-48 bg-gradient-to-br from-white to-white opacity-20 flex items-center justify-center">
                {metadata?.image ? (
                    <img 
                        src={metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')} 
                        alt={metadata.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
                        <FiAward className="text-6xl text-white opacity-50" />
                    </div>
                )}
                <div style={{ display: metadata?.image ? 'none' : 'flex' }} className="absolute inset-0 items-center justify-center">
                    <FiAward className="text-6xl text-white opacity-50" />
                </div>
                
                {/* Achievement Badge */}
                <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                    #{nft.tokenId}
                </div>
            </div>

            {/* NFT 정보 */}
            <div className="p-4 text-white">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <FiAward className="text-xl" />
                    {metadata?.name || getAchievementTypeLabel(nft.achievementType)}
                </h3>
                
                {metadata?.description && (
                    <p className="text-sm opacity-90 mb-3 line-clamp-2">
                        {metadata.description}
                    </p>
                )}

                {/* 커스텀 메타데이터 필드 (returnRate, period 등) */}
                {(metadata?.returnRate || metadata?.period || metadata?.totalValue) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {metadata.returnRate && (
                            <div className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                                수익률: {parseFloat(metadata.returnRate).toFixed(2)}%
                            </div>
                        )}
                        {metadata.period && (
                            <div className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                                기간: {metadata.period}일
                            </div>
                        )}
                        {metadata.totalValue && (
                            <div className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                                총 자산: ${parseFloat(metadata.totalValue).toLocaleString()}
                            </div>
                        )}
                    </div>
                )}

                {/* Attributes (OpenSea 표준 형식) */}
                {metadata?.attributes && metadata.attributes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {metadata.attributes.slice(0, 3).map((attr, idx) => (
                            <div key={idx} className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                                {attr.trait_type}: {attr.value}
                            </div>
                        ))}
                    </div>
                )}

                {/* Timestamp & Links */}
                <div className="border-t border-white border-opacity-20 pt-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs opacity-75">
                        <FiClock className="text-sm" />
                        <span>{formatTimestamp(nft.timestamp)}</span>
                    </div>
                    
                    {/* 외부 링크 */}
                    {nft.tokenId && (
                        <div className="flex gap-2">
                            {/* Etherscan 링크 (메인네트/테스트넷 모두 지원) */}
                            {nft.contractAddress && (
                                <a
                                    href={`https://sepolia.etherscan.io/token/${nft.contractAddress}?a=${nft.tokenId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-colors"
                                    title="Etherscan에서 보기"
                                >
                                    <FiExternalLink className="text-sm" />
                                    <span>Etherscan</span>
                                </a>
                            )}
                            {/* IPFS 링크 (data URI가 아닌 경우에만 표시) */}
                            {nft.ipfsHash && !nft.tokenURI?.startsWith('data:') && (
                                <a
                                    href={`https://gateway.pinata.cloud/ipfs/${nft.ipfsHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-colors"
                                    title="IPFS 메타데이터 보기"
                                >
                                    <FiExternalLink className="text-sm" />
                                    <span>IPFS</span>
                                </a>
                            )}
                            {/* tokenURI가 IPFS 형식인 경우 */}
                            {nft.tokenURI && nft.tokenURI.startsWith('ipfs://') && !nft.ipfsHash && (
                                <a
                                    href={`https://gateway.pinata.cloud/ipfs/${nft.tokenURI.replace('ipfs://', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-colors"
                                    title="IPFS 메타데이터 보기"
                                >
                                    <FiExternalLink className="text-sm" />
                                    <span>IPFS</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NFTCard;

