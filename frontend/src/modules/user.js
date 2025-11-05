// 액션 타입 정의
const LOGIN_SUCCESS = 'user/LOGIN_SUCCESS';
const LOGOUT = 'user/LOGOUT';
const UPDATE_USER_INFO = 'user/UPDATE_USER_INFO'; // 사용자 정보 업데이트 액션

// 액션 생성 함수
export const loginSuccess = (userData) => ({
    type: LOGIN_SUCCESS,
    payload: userData // 예: { userId, email, nickname }
});

export const logout = () => ({
    type: LOGOUT
});

export const updateUserInfo = (userInfo) => ({
    type: UPDATE_USER_INFO,
    payload: userInfo
});

// 초기 상태 - sessionStorage에서 복원 시도
const getInitialState = () => {
    const token = sessionStorage.getItem('accessToken');
    // 토큰이 있으면 로그인 상태로 간주 (API 호출로 실제 정보는 나중에 업데이트)
    if (token) {
        // sessionStorage에서 저장된 사용자 정보 복원 시도
        try {
            const savedUserInfo = sessionStorage.getItem('userInfo');
            if (savedUserInfo) {
                return {
                    isLoggedIn: true,
                    userInfo: JSON.parse(savedUserInfo)
                };
            }
        } catch (e) {
            console.error('Failed to parse saved userInfo:', e);
        }
        // 저장된 정보가 없어도 토큰이 있으면 로그인 상태로 간주
        return {
            isLoggedIn: true,
            userInfo: null // API 호출로 나중에 업데이트
        };
    }
    return {
        isLoggedIn: false,
        userInfo: null
    };
};

const initialState = getInitialState();

// 리듀서
function user(state = initialState, action) {
    switch (action.type) {
        case LOGIN_SUCCESS:
            // 로그인 성공 시 sessionStorage에 사용자 정보 저장
            try {
                sessionStorage.setItem('userInfo', JSON.stringify(action.payload));
            } catch (e) {
                console.error('Failed to save userInfo to sessionStorage:', e);
            }
            return {
                ...state,
                isLoggedIn: true,
                userInfo: action.payload // 로그인 시 받은 사용자 정보 저장
            };
        case LOGOUT:
            // 로그아웃 시 sessionStorage 정리
            sessionStorage.removeItem('userInfo');
            return {
                ...state,
                isLoggedIn: false,
                userInfo: null // 로그아웃 시 사용자 정보 초기화
            };
        case UPDATE_USER_INFO:
            // 사용자 정보 업데이트 시 sessionStorage도 업데이트
            try {
                sessionStorage.setItem('userInfo', JSON.stringify(action.payload));
            } catch (e) {
                console.error('Failed to update userInfo in sessionStorage:', e);
            }
            return {
                ...state,
                userInfo: action.payload
            };
        default:
            return state;
    }
}

export default user;