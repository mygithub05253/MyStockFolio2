import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';

export const useRewardPolling = (userInfo, isLoggedIn, onNewReward, onNewNFT) => {
  const [lastRewardTimestamp, setLastRewardTimestamp] = useState(null);
  const [lastNFTTimestamp, setLastNFTTimestamp] = useState(null);
  const pollingIntervalRef = useRef(null);
  const onNewRewardRef = useRef(onNewReward);
  const onNewNFTRef = useRef(onNewNFT);

  useEffect(() => {
    onNewRewardRef.current = onNewReward;
    onNewNFTRef.current = onNewNFT;
  }, [onNewReward, onNewNFT]);

  useEffect(() => {
    if (!isLoggedIn || !userInfo?.walletAddress) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setLastRewardTimestamp(null);
      setLastNFTTimestamp(null);
      return;
    }

    const pollRewards = async () => {
      try {
        const [rewardResponse, nftResponse] = await Promise.all([
          axiosInstance.get('/api/blockchain/reward/history'),
          axiosInstance.get('/api/blockchain/achievement/history')
        ]);
        
        const rewards = rewardResponse.data?.rewards || [];
        const achievements = nftResponse.data?.achievements || [];
        
        if (rewards.length > 0) {
          const latestReward = rewards[0];
          const latestTimestamp = latestReward.timestamp;
          
          if (lastRewardTimestamp && latestTimestamp > lastRewardTimestamp) {
            if (onNewRewardRef.current) {
              onNewRewardRef.current({
                ...latestReward,
                type: 'reward'
              });
            }
          }
          
          if (!lastRewardTimestamp) {
            setLastRewardTimestamp(latestTimestamp);
          } else if (latestTimestamp > lastRewardTimestamp) {
            setLastRewardTimestamp(latestTimestamp);
          }
        }

        if (achievements.length > 0) {
          const latestNFT = achievements[0];
          const latestTimestamp = latestNFT.timestamp;
          
          if (lastNFTTimestamp && latestTimestamp > lastNFTTimestamp) {
            if (onNewNFTRef.current) {
              onNewNFTRef.current({
                ...latestNFT,
                type: 'nft'
              });
            }
          }
          
          if (!lastNFTTimestamp) {
            setLastNFTTimestamp(latestTimestamp);
          } else if (latestTimestamp > lastNFTTimestamp) {
            setLastNFTTimestamp(latestTimestamp);
          }
        }
      } catch (error) {
        console.error('리워드/NFT 폴링 실패:', error);
      }
    };

    pollRewards();
    pollingIntervalRef.current = setInterval(pollRewards, 3000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isLoggedIn, userInfo?.walletAddress, lastRewardTimestamp, lastNFTTimestamp]);

  return { resetPolling: () => { setLastRewardTimestamp(null); setLastNFTTimestamp(null); } };
};

