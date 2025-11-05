import axios from 'axios';
import store from '../store';
import { logout } from '../modules/user';
import { resetPortfolio } from '../modules/portfolio';
import { resetDashboard } from '../modules/dashboard';
import { resetRewards } from '../modules/rewards';

const axiosInstance = axios.create({
    baseURL: 'http://127.0.0.1:8080',
    timeout: 30000, // 15초에서 30초로 증가
    headers: {
        'Content-Type': 'application/json',
    }
});

// 요청 인터셉터 (변경 없음)
axiosInstance.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        // 특정 API에 더 긴 타임아웃 적용
        if (config.url && (
            config.url.includes('/api/market/') || 
            config.url.includes('/api/dashboard/') ||
            config.url.includes('/api/blockchain/')
        )) {
            config.timeout = 45000; // 시장 데이터, 대시보드, 블록체인 API는 45초
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        // 타임아웃 에러 처리 개선
        if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
            console.warn('요청 타임아웃 (서버가 응답하는데 시간이 걸리고 있습니다):', error.config?.url);
            // 타임아웃 에러를 그대로 전달하여 각 컴포넌트에서 처리하도록 함
            // 에러가 앱 전체를 멈추지 않도록 함
            return Promise.reject(error);
        }
        
        if (error.response && error.response.status === 401) {
            const token = sessionStorage.getItem('accessToken');
            if (token && !error.config._retry) {
                error.config._retry = true;
                try {
                    const response = await axios.get(`${axiosInstance.defaults.baseURL}/api/user/profile`, {
                        headers: { 'Authorization': `Bearer ${token }` }
                    });
                    if (response.data) {
                        return Promise.reject(error);
                    }
                } catch (retryError) {
                    console.error('Token validation failed, logging out...');
                    sessionStorage.removeItem('accessToken');
                    store.dispatch(resetPortfolio());
                    store.dispatch(resetDashboard());
                    store.dispatch(resetRewards());
                    store.dispatch(logout());
                    if (window.location.pathname !== '/signin') {
                        window.location.href = '/signin';
                    }
                }
            } else {
                console.error('Unauthorized! Logging out...');
                sessionStorage.removeItem('accessToken');
                store.dispatch(resetPortfolio());
                store.dispatch(resetDashboard());
                store.dispatch(resetRewards());
                store.dispatch(logout());
                if (window.location.pathname !== '/signin') {
                    window.location.href = '/signin';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;