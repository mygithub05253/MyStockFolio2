import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';
import { FiAward, FiClock, FiExternalLink, FiX } from 'react-icons/fi';

const Rewards = () => {
  const { isLoggedIn, userInfo } = useSelector(state => state.user);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [rewardHistory, setRewardHistory] = useState([]);
  const [achievementHistory, setAchievementHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [testingNFT, setTestingNFT] = useState(false);

  // 활동 타입 한글 변환
  const getActivityName = (activity) => {
    const activityMap = {
      'asset_added': '자산 추가',
      'portfolio_updated': '포트폴리오 수정',
      'dashboard_analysis': '대시보드 분석'
    };
    return activityMap[activity] || activity;
  };

  // 성과 타입 한글 변환
  const getAchievementName = (achievementType) => {
    const achievementMap = {
      'portfolio_maintained_90days': '90일 포트폴리오 유지',
      'return_rate_10percent': '10% 수익률 달성',
      'return_rate_20percent': '20% 수익률 달성',
      'return_rate_50percent': '50% 수익률 달성',
      'return_rate_100percent': '100% 수익률 달성'
    };
    return achievementMap[achievementType] || achievementType;
  };

  // 트랜잭션 상세 정보 모달 컴포넌트
  const TransactionDetailModal = ({ transaction, type, onClose }) => {
    const [txDetails, setTxDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // 트랜잭션 상세 정보 가져오기 (Hooks는 항상 early return 전에 호출)
    useEffect(() => {
      if (transaction?.transactionHash && !txDetails) {
        setLoadingDetails(true);
        axiosInstance.get(`/api/blockchain/transaction/${transaction.transactionHash}`)
          .then(response => {
            setTxDetails(response.data);
          })
          .catch(error => {
            console.error('트랜잭션 상세 정보 조회 실패:', error);
          })
          .finally(() => {
            setLoadingDetails(false);
          });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transaction?.transactionHash]);
    
    if (!transaction) return null;

    const etherscanUrl = transaction.transactionHash 
      ? `https://sepolia.etherscan.io/tx/${transaction.transactionHash}`
      : null;

    // 주소 축약 함수
    const truncateAddress = (address) => {
      if (!address) return '-';
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    // 주소 복사 함수
    const copyToClipboard = (text, label) => {
      navigator.clipboard.writeText(text).then(() => {
        alert(`${label}이(가) 클립보드에 복사되었습니다.`);
      }).catch(err => {
        console.error('복사 실패:', err);
      });
    };

    // Gas 가격 포맷팅 (Wei -> Gwei)
    const formatGasPrice = (gasPrice) => {
      if (!gasPrice) return '-';
      try {
        const gwei = parseFloat(gasPrice) / 1e9;
        return `${gwei.toFixed(2)} Gwei`;
      } catch {
        return gasPrice;
      }
    };

    // 타임스탬프 포맷팅
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return '-';
      try {
        if (typeof timestamp === 'string') {
          return new Date(timestamp).toLocaleString('ko-KR');
        } else if (typeof timestamp === 'number') {
          return new Date(timestamp * 1000).toLocaleString('ko-KR');
        }
        return timestamp;
      } catch {
        return timestamp;
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <h3 className="text-2xl font-bold text-gray-800">
                {type === 'reward' ? '리워드 트랜잭션 상세' : 'NFT 트랜잭션 상세'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            {/* 트랜잭션 상태 */}
            {transaction.transactionHash && (
              <div className={`mb-6 p-4 border rounded-lg ${
                txDetails?.status === 'Success' 
                  ? 'bg-green-50 border-green-200' 
                  : txDetails?.status === 'Failed'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`font-bold text-lg ${
                    txDetails?.status === 'Success' 
                      ? 'text-green-600' 
                      : txDetails?.status === 'Failed'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {txDetails?.status === 'Success' ? '✔' : txDetails?.status === 'Failed' ? '✗' : '⏳'}
                  </span>
                  <span className={`font-semibold ${
                    txDetails?.status === 'Success' 
                      ? 'text-green-700' 
                      : txDetails?.status === 'Failed'
                      ? 'text-red-700'
                      : 'text-gray-700'
                  }`}>
                    {txDetails?.status || 'Pending'}
                  </span>
                  <span className="text-sm text-gray-600 ml-auto">
                    {transaction.tokenType || (type === 'reward' ? 'ERC-20' : 'ERC-721')}
                  </span>
                </div>
                {transaction.transactionHash && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-600 font-mono break-all">
                      {transaction.transactionHash}
                    </span>
                    <button
                      onClick={() => copyToClipboard(transaction.transactionHash, '트랜잭션 해시')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      title="복사"
                    >
                      복사
                    </button>
                  </div>
                )}
              </div>
            )}

            {loadingDetails ? (
              <div className="text-center py-8">
                <p className="text-gray-500">트랜잭션 상세 정보를 불러오는 중...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 왼쪽 컬럼 */}
                  <div className="space-y-4">
                    {/* 활동/성과 정보 */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="text-sm font-semibold text-gray-600 block mb-2">
                        {type === 'reward' ? '활동 유형' : '성과 유형'}
                      </label>
                      <p className="text-gray-800 font-medium">
                        {type === 'reward' 
                          ? getActivityName(transaction.activity)
                          : getAchievementName(transaction.achievementType)}
                      </p>
                    </div>

                    {type === 'reward' && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <label className="text-sm font-semibold text-gray-600 block mb-2">
                          리워드 금액
                        </label>
                        <p className="text-green-600 font-bold text-2xl">
                          +{transaction.amount} FOLIO
                        </p>
                      </div>
                    )}

                    {type === 'nft' && transaction.tokenId && (
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <label className="text-sm font-semibold text-gray-600 block mb-2">
                          Token ID
                        </label>
                        <p className="text-gray-800 font-mono text-lg font-bold">
                          #{transaction.tokenId}
                        </p>
                      </div>
                    )}

                    {/* From 주소 */}
                    {txDetails?.from && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <label className="text-sm font-semibold text-gray-600 block mb-2">
                          발신 주소 (From)
                        </label>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-800 font-mono text-sm">
                            {truncateAddress(txDetails.from)}
                          </p>
                          <button
                            onClick={() => copyToClipboard(txDetails.from, '발신 주소')}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                            title="주소 복사"
                          >
                            복사
                          </button>
                        </div>
                      </div>
                    )}

                    {/* To 주소 */}
                    {txDetails?.to && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <label className="text-sm font-semibold text-gray-600 block mb-2">
                          수신 주소 (To)
                        </label>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-800 font-mono text-sm">
                            {truncateAddress(txDetails.to)}
                          </p>
                          <button
                            onClick={() => copyToClipboard(txDetails.to, '수신 주소')}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                            title="주소 복사"
                          >
                            복사
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 오른쪽 컬럼 */}
                  <div className="space-y-4">
                    {/* 블록 정보 */}
                    {txDetails?.blockNumber && (
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <label className="text-sm font-semibold text-gray-600 block mb-2">
                          블록 번호
                        </label>
                        <p className="text-gray-800 font-mono text-lg font-bold">
                          {txDetails.blockNumber.toLocaleString()}
                        </p>
                        {txDetails.confirmations !== undefined && (
                          <p className="text-sm text-gray-600 mt-1">
                            {txDetails.confirmations.toLocaleString()} 블록 확인됨
                          </p>
                        )}
                      </div>
                    )}

                    {/* Gas 정보 - MetaMask 스타일 */}
                    {txDetails?.gasUsed && (
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <label className="text-sm font-semibold text-gray-600 block mb-3">
                          가스 정보
                        </label>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">가스 사용량:</span>
                            <span className="text-gray-800 font-mono font-semibold">
                              {parseInt(txDetails.gasUsed).toLocaleString()} gas
                            </span>
                          </div>
                          {txDetails.effectiveGasPrice && (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">가스 가격:</span>
                                <span className="text-gray-800 font-mono">
                                  {formatGasPrice(txDetails.effectiveGasPrice)}
                                </span>
                              </div>
                              <div className="pt-2 border-t border-yellow-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-semibold text-gray-700">총 가스비:</span>
                                  <span className="text-gray-800 font-mono font-bold">
                                    {((parseInt(txDetails.gasUsed) * parseFloat(txDetails.effectiveGasPrice)) / 1e18).toFixed(6)} ETH
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 타임스탬프 */}
                    {(txDetails?.timestampFormatted || transaction.timestamp) && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <label className="text-sm font-semibold text-gray-600 block mb-2">
                          <FiClock className="inline mr-1" />
                          타임스탬프
                        </label>
                        <p className="text-gray-800">
                          {txDetails?.timestampFormatted 
                            ? formatTimestamp(txDetails.timestampFormatted)
                            : transaction.timestamp}
                        </p>
                      </div>
                    )}

                    {/* Nonce 및 트랜잭션 인덱스 */}
                    {(txDetails?.nonce !== undefined || txDetails?.transactionIndex !== undefined) && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <label className="text-sm font-semibold text-gray-600 block mb-2">
                          트랜잭션 정보
                        </label>
                        <div className="space-y-1">
                          {txDetails?.nonce !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Nonce:</span>
                              <span className="text-gray-800 font-mono font-semibold">
                                {txDetails.nonce}
                              </span>
                            </div>
                          )}
                          {txDetails?.transactionIndex !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">트랜잭션 인덱스:</span>
                              <span className="text-gray-800 font-mono">
                                {txDetails.transactionIndex}
                              </span>
                            </div>
                          )}
                          {txDetails?.blockHash && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">블록 해시:</span>
                              <span className="text-gray-800 font-mono text-xs truncate max-w-[200px]">
                                {truncateAddress(txDetails.blockHash)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* NFT 메타데이터 */}
                    {type === 'nft' && transaction.metadata && (
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <label className="text-sm font-semibold text-gray-600 block mb-2">
                          NFT 상세 정보
                        </label>
                        <div className="space-y-2 text-gray-800">
                          {transaction.metadata.returnRate && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">수익률:</span>
                              <span className="font-semibold">
                                {parseFloat(transaction.metadata.returnRate).toFixed(2)}%
                              </span>
                            </div>
                          )}
                          {transaction.metadata.period && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">유지 기간:</span>
                              <span className="font-semibold">{transaction.metadata.period}일</span>
                            </div>
                          )}
                          {transaction.metadata.totalValue && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">총 자산:</span>
                              <span className="font-semibold">
                                ${parseFloat(transaction.metadata.totalValue).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 블록 탐색기 링크 */}
                {etherscanUrl && (
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <label className="text-sm font-semibold text-gray-600 block mb-3">
                      블록 탐색기에서 확인
                    </label>
                    <a
                      href={etherscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                      <FiExternalLink className="text-lg" />
                      <span>Sepolia Etherscan에서 열기</span>
                    </a>
                    <p className="text-xs text-gray-500 mt-2">
                      트랜잭션 상세 정보, Gas 사용량, 블록 번호 등을 확인할 수 있습니다.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 하단 액션 버튼 */}
            <div className="mt-6 pt-4 border-t flex justify-end gap-3">
              {etherscanUrl && (
                <a
                  href={etherscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                >
                  <FiExternalLink />
                  블록 탐색기에서 보기
                </a>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 히스토리 가져오기 함수
  const fetchAchievementHistory = async () => {
    try {
      const achievementResponse = await axiosInstance.get('/api/blockchain/achievement/history');
      if (achievementResponse.data?.achievements) {
        setAchievementHistory(achievementResponse.data.achievements);
      }
    } catch (error) {
      console.error('NFT 히스토리 조회 실패:', error);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !userInfo?.walletAddress) {
      setLoading(false);
      return;
    }

    const fetchRewardData = async () => {
      try {
        setLoading(true);
        
        // 토큰 잔액 조회
        const balanceResponse = await axiosInstance.get(
          `/api/blockchain/token/balance?address=${userInfo.walletAddress}`
        );
        if (balanceResponse.data?.balance !== undefined) {
          setTokenBalance(parseFloat(balanceResponse.data.balance).toFixed(2));
        }

        // 리워드 히스토리 조회
        const [historyResponse, achievementResponse] = await Promise.all([
          axiosInstance.get('/api/blockchain/reward/history'),
          axiosInstance.get('/api/blockchain/achievement/history')
        ]);
        
        if (historyResponse.data?.rewards) {
          setRewardHistory(historyResponse.data.rewards);
        }
        
        if (achievementResponse.data?.achievements) {
          setAchievementHistory(achievementResponse.data.achievements);
        }
        } catch (error) {
        console.error('리워드 데이터 조회 실패:', error);
        if (error.response?.status === 401) {
          // 인증 실패
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRewardData();
  }, [isLoggedIn, userInfo?.walletAddress]);

  if (!isLoggedIn) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-gray-700">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  if (!userInfo?.walletAddress) {
    return (
      <div className="p-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-gray-700 mb-4">지갑 주소가 등록되지 않았습니다.</p>
          <a href="/mypage" className="text-blue-600 hover:underline">
            MyPage에서 지갑 주소 등록하기 →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <FiAward className="text-3xl text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-800">리워드 센터</h1>
      </div>

      {/* 보유 토큰 현황 */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg shadow-lg border border-indigo-100">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">내 FOLIO 토큰 잔액</h2>
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-4xl text-indigo-600">
            {loading ? '로딩 중...' : (tokenBalance !== null ? `${tokenBalance} FOLIO` : '0 FOLIO')}
          </span>
        </div>
      </div>

       {/* 토큰 획득 방법 안내 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">토큰 획득 방법</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-semibold">✓</span>
            <span>포트폴리오에 새 자산 등록 시 <span className="font-semibold text-indigo-600">+10~20 FOLIO</span></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-semibold">✓</span>
            <span>포트폴리오 수정 시 <span className="font-semibold text-indigo-600">+10~20 FOLIO</span></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-semibold">✓</span>
            <span>대시보드 분석 조회 시 <span className="font-semibold text-indigo-600">+10~20 FOLIO</span> (일일 1회)</span>
          </li>
        </ul>
      </div>

      {/* 트랜잭션 히스토리 */}
       <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <FiClock className="text-xl text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-700">트랜잭션 히스토리</h2>
        </div>

        {/* 탭 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTab === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setSelectedTab('reward')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTab === 'reward'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ERC-20 리워드
            </button>
            <button
              onClick={() => setSelectedTab('nft')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTab === 'nft'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ERC-721 NFT
            </button>
          </div>
          
          {/* NFT 강제 발행 테스트 버튼 (데모용) */}
          {(selectedTab === 'all' || selectedTab === 'nft') && (
            <button
              onClick={async () => {
                if (testingNFT) return;
                setTestingNFT(true);
                
                const achievementType = 'return_rate_10percent';
                const metadata = {
                  returnRate: '10.0',
                  period: '90',
                  totalValue: '1000000'
                };
                
                try {
                  const response = await axiosInstance.post('/api/blockchain/nft/test-mint', {
                    achievementType: achievementType,
                    metadata: metadata
                  });
                  // 성공 알림 표시
                  const successMessage = `✅ NFT 발행 성공!\n\n` +
                    `Token ID: #${response.data.tokenId}\n` +
                    `Transaction Hash: ${response.data.transactionHash}\n\n` +
                    `블록체인에서 확인하시겠습니까?`;
                  
                  if (window.confirm(successMessage)) {
                    window.open(`https://sepolia.etherscan.io/tx/${response.data.transactionHash}`, '_blank');
                  }
                  
                  // 히스토리 새로고침
                  await fetchAchievementHistory();
                  
                  // 트랜잭션 상세 정보 모달 열기
                  setSelectedTransaction({
                    transaction: {
                      ...response.data,
                      achievementType: achievementType,
                      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                      tokenType: 'ERC-721',
                      metadata: metadata
                    },
                    type: 'nft'
                  });
                } catch (error) {
                  console.error('NFT 발행 실패:', error);
                  alert(`NFT 발행 실패: ${error.response?.data?.error || error.message}`);
                } finally {
                  setTestingNFT(false);
                }
              }}
              disabled={testingNFT}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {testingNFT ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>NFT 발행 중...</span>
                </>
              ) : (
                <>
                  <FiAward />
                  <span>NFT 테스트 발행 (데모용)</span>
                </>
              )}
            </button>
          )}
        </div>
        
        {loading ? (
          <p className="text-sm text-gray-500">로딩 중...</p>
        ) : (
          <div className="space-y-3">
                         {/* ERC-20 리워드 히스토리 */}
             {(selectedTab === 'all' || selectedTab === 'reward') && rewardHistory.map((reward, index) => (
               <div 
                 key={`reward-${index}`} 
                 className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                 onClick={() => setSelectedTransaction({ transaction: reward, type: 'reward' })}
               >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-semibold">ERC-20</span>
                    <span className="font-semibold text-gray-800">{getActivityName(reward.activity)}</span>
                    <span className="text-green-600 font-bold">+{reward.amount} FOLIO</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <FiClock className="text-gray-400" />
                    <span>{reward.timestamp}</span>
                  </div>
                  {reward.transactionHash && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-600 font-mono truncate flex-1">{reward.transactionHash}</span>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${reward.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <FiExternalLink className="text-sm" />
                          <span>확인</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

                         {/* ERC-721 NFT 히스토리 */}
             {(selectedTab === 'all' || selectedTab === 'nft') && achievementHistory.map((achievement, index) => (
               <div 
                 key={`nft-${index}`} 
                 className="flex items-start justify-between p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
                 onClick={() => setSelectedTransaction({ transaction: achievement, type: 'nft' })}
               >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-semibold">ERC-721</span>
                    <span className="font-semibold text-gray-800">{getAchievementName(achievement.achievementType)}</span>
                    {achievement.tokenId && (
                      <span className="text-xs text-gray-600">Token ID: {achievement.tokenId}</span>
                    )}
                  </div>
                  {achievement.metadata && (
                    <div className="text-xs text-gray-600 mb-1">
                      {achievement.metadata.returnRate && (
                        <span>수익률: {parseFloat(achievement.metadata.returnRate).toFixed(2)}%</span>
                      )}
                      {achievement.metadata.period && (
                        <span>유지 기간: {achievement.metadata.period}일</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <FiClock className="text-gray-400" />
                    <span>{achievement.timestamp}</span>
                  </div>
                  {achievement.transactionHash && (
                    <div className="mt-2 pt-2 border-t border-purple-200">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-600 font-mono truncate flex-1">{achievement.transactionHash}</span>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${achievement.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <FiExternalLink className="text-sm" />
                          <span>확인</span>
                        </a>
                      </div>
                    </div>
                  )}
      </div>
              </div>
            ))}

            {selectedTab === 'all' && rewardHistory.length === 0 && achievementHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-2">아직 받은 리워드나 NFT가 없습니다.</p>
                <p className="text-xs text-gray-400">자산을 추가하거나 포트폴리오를 수정하면 리워드를 받을 수 있습니다!</p>
              </div>
            )}
            {selectedTab === 'reward' && rewardHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-2">아직 받은 리워드가 없습니다.</p>
              </div>
            )}
            {selectedTab === 'nft' && achievementHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-2">아직 발행된 NFT가 없습니다.</p>
                <p className="text-xs text-gray-400">포트폴리오 성과를 달성하면 NFT 인증서를 받을 수 있습니다!</p>
              </div>
            )}
          </div>
        )}
      </div>
      {/* 트랜잭션 상세 정보 모달 */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction.transaction}
          type={selectedTransaction.type}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
};

export default Rewards;