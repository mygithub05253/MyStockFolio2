import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiX, FiExternalLink } from 'react-icons/fi';

const TransactionNotification = ({ 
  isOpen, 
  onClose, 
  type, 
  amount, 
  transactionHash,
  achievementType,
  tokenType,
  tokenId,
  metadata
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(), 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTypeInfo = () => {
    if (type === 'reward') {
      return {
        title: '리워드 적립 완료',
        message: `${amount} FOLIO 토큰이 적립되었습니다`,
        color: 'bg-green-500',
        badge: 'ERC-20'
      };
    } else if (type === 'nft') {
      const achievementNames = {
        'portfolio_maintained_90days': '90일 포트폴리오 유지',
        'return_rate_10percent': '10% 수익률 달성',
        'return_rate_20percent': '20% 수익률 달성',
        'return_rate_50percent': '50% 수익률 달성',
        'return_rate_100percent': '100% 수익률 달성'
      };
      const achievementName = achievementNames[achievementType] || '성과 달성';
      let additionalInfo = '';
      if (metadata) {
        if (metadata.returnRate) {
          additionalInfo = ` (${parseFloat(metadata.returnRate).toFixed(2)}% 수익률)`;
        } else if (metadata.period) {
          additionalInfo = ` (${metadata.period}일 유지)`;
        }
      }
      return {
        title: 'NFT 인증서 발행 완료',
        message: `${achievementName}${additionalInfo}`,
        color: 'bg-purple-500',
        badge: 'ERC-721'
      };
    }
    return { title: '', message: '', color: '', badge: '' };
  };

  const typeInfo = getTypeInfo();
  const etherscanUrl = transactionHash 
    ? `https://sepolia.etherscan.io/tx/${transactionHash}`
    : null;

  return (
    <div 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className={`${typeInfo.color} text-white rounded-lg shadow-xl p-4`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <FiCheckCircle className="text-2xl flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">{typeInfo.title}</h3>
                {typeInfo.badge && (
                  <span className="text-xs px-2 py-0.5 bg-white bg-opacity-20 rounded font-semibold">
                    {typeInfo.badge}
                  </span>
                )}
              </div>
              <p className="text-sm mb-2">{typeInfo.message}</p>
              {tokenId && (
                <p className="text-xs mb-1 opacity-90">Token ID: {tokenId}</p>
              )}
              {transactionHash && (
                <div className="mt-2 pt-2 border-t border-white border-opacity-30">
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="opacity-90">트랜잭션 해시:</span>
                    <span className="font-mono truncate flex-1">{transactionHash}</span>
                  </div>
                  {etherscanUrl && (
                    <a
                      href={etherscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-colors w-fit"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FiExternalLink className="text-sm" />
                      <span>Etherscan에서 확인</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(), 300);
            }}
            className="ml-2 text-white hover:text-gray-200 transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionNotification;

