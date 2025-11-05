import './App.css';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import router from './routes/router';
import axiosInstance from './api/axiosInstance';
import { loginSuccess, logout } from './modules/user';
import { resetPortfolio } from './modules/portfolio';
import { resetDashboard } from './modules/dashboard';
import { resetRewards } from './modules/rewards';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeAuth = async () => {
      // OAuth2 콜백 페이지는 인증 초기화 스킵
      if (window.location.pathname === '/oauth2/callback' || window.location.pathname === '/oauth2/signup') {
        return;
      }

      const token = sessionStorage.getItem('accessToken');
      
      if (token) {
        // sessionStorage에서 이미 사용자 정보가 복원되었는지 확인
        // (modules/user.js에서 초기 상태로 복원됨)
        
        // 백그라운드에서 최신 사용자 정보로 업데이트 (조용히 실행)
        try {
          const response = await axiosInstance.get('/api/user/profile');
          const { userId, email, nickname, provider, walletAddress } = response.data;
          dispatch(loginSuccess({ userId, email, nickname, provider, walletAddress }));
          console.log('사용자 정보 업데이트 완료:', { userId, email, nickname, provider });
        } catch (error) {
          // 401 에러인 경우에만 로그아웃 처리
          if (error.response && error.response.status === 401) {
            console.error('토큰 검증 실패 (401), 로그아웃 처리:', error);
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('userInfo');
            dispatch(resetPortfolio());
            dispatch(resetDashboard());
            dispatch(resetRewards());
            dispatch(logout());
          }
          // 다른 에러(네트워크 오류 등)는 무시하고 저장된 정보 사용
        }
      }
    };

    initializeAuth();
  }, [dispatch]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
