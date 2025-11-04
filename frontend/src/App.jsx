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
      if (window.location.pathname === '/oauth2/callback' || window.location.pathname === '/oauth2/signup') {
        return;
      }

      const token = sessionStorage.getItem('accessToken');
      
      if (token) {
        try {
          const response = await Promise.race([
            axiosInstance.get('/api/user/profile'),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 10000)
            )
          ]);
          
          const { userId, email, nickname, provider, walletAddress } = response.data;
          dispatch(loginSuccess({ userId, email, nickname, provider, walletAddress }));
          console.log('로그인 상태 복원:', { userId, email, nickname, provider });
        } catch (error) {
          // 401 에러가 아니면 토큰을 유지 (네트워크 오류 등일 수 있음)
          if (error.response && error.response.status === 401) {
            console.error('토큰 검증 실패 (401):', error);
            sessionStorage.removeItem('accessToken');
            dispatch(resetPortfolio());
            dispatch(resetDashboard());
            dispatch(resetRewards());
            dispatch(logout());
          } else {
            console.warn('인증 확인 실패 (네트워크 오류 가능):', error.message);
          }
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
