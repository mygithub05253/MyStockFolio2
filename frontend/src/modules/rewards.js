// 리워드 관련 Redux 모듈

// 액션 타입 정의
const SET_TOKEN_BALANCE = 'rewards/SET_TOKEN_BALANCE';
const SET_LOADING = 'rewards/SET_LOADING';
const SET_ERROR = 'rewards/SET_ERROR';
const RESET_REWARDS = 'rewards/RESET_REWARDS';

// 액션 생성 함수
export const setTokenBalance = (balance) => ({
    type: SET_TOKEN_BALANCE,
    payload: balance
});

export const setLoading = (loading) => ({
    type: SET_LOADING,
    payload: loading
});

export const setError = (error) => ({
    type: SET_ERROR,
    payload: error
});

export const resetRewards = () => ({
    type: RESET_REWARDS
});

// 기존 setLoading과 충돌 방지
export const setRewardsLoading = (loading) => ({
    type: SET_LOADING,
    payload: loading
});

export const setRewardsError = (error) => ({
    type: SET_ERROR,
    payload: error
});

// 초기 상태
const initialState = {
    balance: 0,
    balanceFormatted: '0.0 FOLIO',
    isLoading: false,
    error: null
};

// 리듀서
function rewards(state = initialState, action) {
    switch (action.type) {
        case SET_TOKEN_BALANCE:
            return {
                ...state,
                balance: action.payload.balance || 0,
                balanceFormatted: action.payload.balanceFormatted || '0.0 FOLIO',
                isLoading: false,
                error: null
            };
        case SET_LOADING:
            return {
                ...state,
                isLoading: action.payload
            };
        case SET_ERROR:
            return {
                ...state,
                error: action.payload,
                isLoading: false
            };
        case RESET_REWARDS:
            return initialState;
        default:
            return state;
    }
}

export default rewards;

