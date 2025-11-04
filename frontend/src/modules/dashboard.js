// frontend/src/modules/dashboard.js

// 액션 타입 정의
const SET_DASHBOARD_STATS = 'dashboard/SET_DASHBOARD_STATS';
const SET_LOADING = 'dashboard/SET_LOADING';
const SET_ERROR = 'dashboard/SET_ERROR';
const RESET_DASHBOARD = 'dashboard/RESET_DASHBOARD';

// 액션 생성 함수
export const setDashboardStats = (stats) => ({
    type: SET_DASHBOARD_STATS,
    payload: stats
});

export const setLoading = (isLoading) => ({
    type: SET_LOADING,
    payload: isLoading
});

export const setError = (error) => ({
    type: SET_ERROR,
    payload: error
});

export const resetDashboard = () => ({
    type: RESET_DASHBOARD
});

// 초기 상태
const initialState = {
    stats: {
        totalMarketValue: 0,
        totalInitialInvestment: 0,
        totalGainLoss: 0,
        totalReturnRate: 0,
        assetAllocations: [], // 자산 배분 데이터 (Pie Chart)
        assetReturns: [], // 자산별 수익률 데이터
    },
    isLoading: false,
    error: null,
};

// 리듀서
function dashboard(state = initialState, action) {
    switch (action.type) {
        case SET_DASHBOARD_STATS:
            return {
                ...state,
                stats: action.payload,
                isLoading: false,
                error: null,
            };
        case SET_LOADING:
            return {
                ...state,
                isLoading: action.payload,
            };
        case SET_ERROR:
            return {
                ...state,
                error: action.payload,
                isLoading: false,
            };
        case RESET_DASHBOARD:
            return initialState;
        default:
            return state;
    }
}

export default dashboard;