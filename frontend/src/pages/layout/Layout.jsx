import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../modules/user';
import Header from '../../components/layout/Header';
import MainContent from '../../components/layout/MainContent';
import Footer from '../../components/layout/Footer';
import TransactionNotification from '../../components/notifications/TransactionNotification';
import { useRewardPolling } from '../../hooks/useRewardPolling';


const Layout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isLoggedIn, userInfo } = useSelector(state => state.user);
    const [notification, setNotification] = useState(null);

    const handleNewReward = (reward) => {
        if (reward.transactionHash) {
            setNotification({
                isOpen: true,
                type: 'reward',
                amount: reward.amount,
                transactionHash: reward.transactionHash,
                tokenType: 'ERC-20'
            });
        }
    };

    const handleNewNFT = (achievement) => {
        if (achievement.transactionHash) {
            setNotification({
                isOpen: true,
                type: 'nft',
                achievementType: achievement.achievementType,
                tokenId: achievement.tokenId,
                transactionHash: achievement.transactionHash,
                tokenType: 'ERC-721',
                metadata: achievement.metadata
            });
        }
    };

    useRewardPolling(userInfo, isLoggedIn, handleNewReward, handleNewNFT); 

    // [Redux 상태 초기화 및 라우팅 분기 로직]
    useEffect(() => {
        const checkAuthAndRedirect = () => {
            const token = sessionStorage.getItem('accessToken');
            
            // 토큰이 있지만 아직 로그인 상태가 아닌 경우
            // App.jsx에서 인증 복원 중일 수 있으므로 리다이렉트하지 않음
            // (App.jsx의 useEffect가 인증을 복원할 것입니다)
            
            if (!token && isLoggedIn) {
                dispatch(logout());
                if (location.pathname !== '/') {
                    navigate('/', { replace: true });
                }
                return;
            }

            // 2. 경로별 리다이렉션 처리 (라우팅 제어)
            // [문제 해결] 비로그인 시 메인 화면이 나오도록 경로 제어
            if (location.pathname === '/') {
                if (isLoggedIn) {
                    // 로그인 상태: / -> /dashboard로 리다이렉트
                    navigate('/dashboard', { replace: true });
                }
                // 비로그인 상태: /에 머무름 (Main.jsx 표시)
                
            } else if ((location.pathname === '/signin' || location.pathname === '/signup') && isLoggedIn) {
                 // 로그인/회원가입 페이지에 로그인 상태로 접근 시 대시보드로 리다이렉트
                 navigate('/dashboard', { replace: true });
                 
            } else {
                 // 보호된 경로로 접근 시 비로그인 상태이면 리다이렉트
                 // 단, 토큰이 있는 경우 인증 복원 중일 수 있으므로 제외 (App.jsx가 처리할 것)
                 const protectedPaths = ['/dashboard', '/portfolio', '/market', '/rewards', '/mypage'];
                 if (protectedPaths.includes(location.pathname) && !isLoggedIn && !token) {
                     navigate('/', { replace: true });
                 }
            }
        };

        // 짧은 지연 후 실행하여 App.jsx의 인증 복원이 완료될 시간을 줌
        const timeoutId = setTimeout(checkAuthAndRedirect, 100);
        
        return () => clearTimeout(timeoutId);
        
    }, [location.pathname, isLoggedIn, navigate, dispatch]);

    return (
        <div className="flex flex-col min-h-screen max-w-md mx-auto shadow-lg bg-gray-50">
            <Header />
            <MainContent>
                <Outlet />
            </MainContent>
            <Footer />
            {notification && (
                <TransactionNotification
                    isOpen={notification.isOpen}
                    onClose={() => setNotification(null)}
                    type={notification.type}
                    amount={notification.amount}
                    transactionHash={notification.transactionHash}
                    achievementType={notification.achievementType}
                    tokenType={notification.tokenType}
                    tokenId={notification.tokenId}
                    metadata={notification.metadata}
                />
            )}
        </div>
    );
};

export default Layout;