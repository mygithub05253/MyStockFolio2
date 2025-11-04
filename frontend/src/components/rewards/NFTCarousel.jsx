import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';
import NFTCard from './NFTCard';
import { FiChevronLeft, FiChevronRight, FiAward } from 'react-icons/fi';

const NFTCarousel = () => {
    const { isLoggedIn, userInfo } = useSelector(state => state.user);
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!isLoggedIn || !userInfo?.walletAddress) {
            setLoading(false);
            return;
        }

        const fetchNFTs = async () => {
            try {
                const response = await axiosInstance.get('/api/blockchain/nft/owned', {
                    params: { address: userInfo.walletAddress }
                });
                
                if (response.data?.nfts && Array.isArray(response.data.nfts)) {
                    setNfts(response.data.nfts);
                } else {
                    setNfts([]);
                }
            } catch (err) {
                console.error('NFT 목록 조회 실패:', err);
                // 블록체인 API가 연결되지 않은 경우 조용히 처리
                setError('NFT 목록을 불러올 수 없습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchNFTs();
    }, [isLoggedIn, userInfo?.walletAddress]);

    const handlePrevious = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === 0 ? Math.max(0, nfts.length - 1) : prevIndex - 1
        );
    };

    const handleNext = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === nfts.length - 1 ? 0 : prevIndex + 1
        );
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return null; // 에러 발생 시 조용히 처리 (블록체인 API 미연결)
    }

    if (nfts.length === 0) {
        return (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-md p-6 mb-6 text-center">
                <div className="flex flex-col items-center justify-center">
                    <div className="bg-indigo-100 rounded-full p-4 mb-3">
                        <FiAward className="text-4xl text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        아직 받은 NFT가 없습니다
                    </h3>
                    <p className="text-sm text-gray-600">
                        포트폴리오 성과를 달성하면 NFT 인증서를 받을 수 있습니다!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FiAward className="text-2xl text-indigo-600" />
                    포트폴리오 성과 NFT
                </h3>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={handlePrevious}
                        disabled={nfts.length <= 1}
                        className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="이전 NFT"
                    >
                        <FiChevronLeft className="text-xl text-gray-700" />
                    </button>
                    <span className="text-sm text-gray-600 font-medium min-w-[60px] text-center">
                        {currentIndex + 1} / {nfts.length}
                    </span>
                    <button
                        onClick={handleNext}
                        disabled={nfts.length <= 1}
                        className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="다음 NFT"
                    >
                        <FiChevronRight className="text-xl text-gray-700" />
                    </button>
                </div>
            </div>

            {/* NFT Cards */}
            <div className="relative">
                {/* Main Display */}
                <div className="overflow-hidden">
                    <div 
                        className="flex transition-transform duration-300 ease-in-out"
                        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                        {nfts.map((nft, index) => (
                            <div key={index} className="min-w-full px-1">
                                <NFTCard nft={nft} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pagination Dots (for 2+ NFTs) */}
                {nfts.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        {nfts.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`transition-all w-2 h-2 rounded-full ${
                                    index === currentIndex
                                        ? 'bg-indigo-600 w-8'
                                        : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                                aria-label={`NFT ${index + 1}로 이동`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NFTCarousel;

