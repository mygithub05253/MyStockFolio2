import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance'; 
import useInput from '../../hooks/useInput'; 
import BasicButton from '../../components/button/BasicButton.jsx'; 

// Redux 추가
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../modules/user'; 

// 소셜 로그인 아이콘 import
import googleIcon from '../../assets/images/google.png';
import kakaoIcon from '../../assets/images/kakao.png';
import naverIcon from '../../assets/images/naver.png';

const SignIn = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [email, onChangeEmail] = useInput('');
    const [password, onChangePassword] = useInput('');
    const [error, setError] = useState(''); 

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }

        try {
            // 백엔드 로그인 API 호출
            const response = await axiosInstance.post('/api/auth/login', {
                email: email,
                password: password
            });

            const { accessToken, userId, email: userEmail, nickname, provider, walletAddress } = response.data;

            if (accessToken) {
                sessionStorage.setItem('accessToken', accessToken);
                dispatch(loginSuccess({ userId, email: userEmail, nickname, provider, walletAddress }));

                alert(`${nickname || '사용자'}님, 환영합니다!`);
                navigate('/dashboard'); 
            } else {
                 setError('로그인 응답에 액세스 토큰이 없습니다.');
            }

        } catch (err) {
            console.error('로그인 실패:', err.response ? err.response.data : err.message);
            const errorMessage = err.response?.data?.error || '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
            setError(errorMessage); 
        }
    };

    // 소셜 로그인 버튼 클릭 핸들러
    const handleSocialLogin = (provider) => {
        // 백엔드 OAuth2 엔드포인트로 리다이렉트
        const backendUrl = 'http://localhost:8080';
        window.location.href = `${backendUrl}/oauth2/authorization/${provider}`;
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">MyStockFolio</h1>
                    <p className="text-indigo-100 text-sm">언제 어디서나 나만의 포트폴리오</p>
                </div>
                
                <div className="p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-center text-gray-900">
                        로그인
                    </h2>
                    <form className="space-y-4" onSubmit={onSubmit}>
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700"
                        >
                            이메일 주소
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={onChangeEmail}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                        >
                            비밀번호
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={onChangePassword}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="********"
                        />
                    </div>

                    {/* 오류 메시지 표시 */}
                    {error && (
                        <p className="text-sm text-red-600 text-center">{error}</p>
                    )}

                    <BasicButton type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3">
                        로그인
                    </BasicButton>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500 font-medium">
                            다른 방법으로 로그인
                        </span>
                    </div>
                </div>

                {/* 소셜 로그인 버튼들 */}
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => handleSocialLogin('google')} 
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                        title="Google 로그인"
                    >
                        <img src={googleIcon} alt="Google" className="w-10 h-10" />
                        <span className="text-xs text-gray-600">Google</span>
                    </button>
                    <button 
                        onClick={() => handleSocialLogin('kakao')} 
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                        title="Kakao 로그인"
                    >
                        <img src={kakaoIcon} alt="Kakao" className="w-10 h-10" />
                        <span className="text-xs text-gray-600">Kakao</span>
                    </button>
                    <button 
                        onClick={() => handleSocialLogin('naver')} 
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                        title="Naver 로그인"
                    >
                        <img src={naverIcon} alt="Naver" className="w-10 h-10" />
                        <span className="text-xs text-gray-600">Naver</span>
                    </button>
                </div>

                {/* 회원가입 링크 */}
                <div className="text-sm text-center pt-2">
                    <span className="text-gray-600">계정이 없으신가요? </span>
                    <button
                        onClick={() => navigate('/signup')}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        회원가입
                    </button>
                </div>
                </div>
            </div>
        </div>
    );
};

export default SignIn;
