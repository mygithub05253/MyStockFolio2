import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance'; // axiosInstance 사용
import useInput from '../../hooks/useInput';
import BasicButton from '../../components/button/BasicButton.jsx';

const SignUp = () => {
    const navigate = useNavigate();
    const [email, onChangeEmail] = useInput('');
    const [password, onChangePassword] = useInput('');
    const [passwordConfirm, onChangePasswordConfirm] = useInput('');
    const [nickname, onChangeNickname] = useInput('');
    const [walletAddress, onChangeWalletAddress] = useInput('');
    const [error, setError] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 1. 프론트엔드 유효성 검사
        if (password !== passwordConfirm) {
            setError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
            return;
        }
        if (!email || !password || !nickname) {
            setError('필수 정보를 모두 입력해주세요.');
            return;
        }
        if (password.length < 8) {
            setError('비밀번호는 8자 이상이어야 합니다.');
            return;
        }

        try {
            // 2. 백엔드 회원가입 API 호출
            const response = await axiosInstance.post('/api/auth/register', {
                email,
                password,
                passwordConfirm,
                nickname,
                walletAddress: walletAddress || null 
            });

            // 3. 성공 처리
            console.log('회원가입 성공:', response.data);
            alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
            navigate('/signin'); 

        } catch (err) {
            console.error('회원가입 실패:', err.response ? err.response.data : err.message);
            
            let errorMessage = '회원가입 중 알 수 없는 오류가 발생했습니다.';
            
            if (err.response && err.response.data) {
                // 백엔드 GlobalExceptionHandler의 오류 메시지 처리
                 if (err.response.data.error) {
                    errorMessage = err.response.data.error; 
                 } else if (err.response.data.email) {
                     // @Valid 유효성 검사 실패 시 (400 Bad Request)
                     errorMessage = `이메일 오류: ${err.response.data.email}`;
                 }
            }
            
            setError(errorMessage);
        }
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
                        회원가입
                    </h2>
                    <form className="space-y-4" onSubmit={onSubmit}>
                    {/* 이메일 */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일 주소 *</label>
                        <input id="email" name="email" type="email" required value={email} onChange={onChangeEmail} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" placeholder="you@example.com" />
                    </div>
                    {/* 닉네임 */}
                    <div>
                        <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">닉네임 *</label>
                        <input id="nickname" name="nickname" type="text" required value={nickname} onChange={onChangeNickname} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" placeholder="사용할 닉네임" />
                    </div>
                    {/* 비밀번호 */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">비밀번호 * (8자 이상)</label>
                        <input id="password" name="password" type="password" required value={password} onChange={onChangePassword} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" placeholder="********" />
                    </div>
                    {/* 비밀번호 확인 */}
                    <div>
                        <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">비밀번호 확인 *</label>
                        <input id="passwordConfirm" name="passwordConfirm" type="password" required value={passwordConfirm} onChange={onChangePasswordConfirm} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="********" />
                    </div>
                    {/* 지갑 주소 (선택) */}
                    <div>
                        <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700">지갑 주소 (선택)</label>
                        <input id="walletAddress" name="walletAddress" type="text" value={walletAddress} onChange={onChangeWalletAddress} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="0x..." />
                        <p className="text-xs text-gray-500 mt-1">
                            소셜/지갑 로그인은 첫 로그인 시 자동 처리됩니다.
                        </p>
                    </div>

                    {/* 오류 메시지 표시 */}
                    {error && (
                        <p className="text-sm text-red-600 text-center mt-4 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
                    )}

                    <BasicButton type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 mt-6">
                        회원가입
                    </BasicButton>
                </form>

                <div className="text-sm text-center pt-2">
                    <span className="text-gray-600">이미 계정이 있으신가요? </span>
                    <button
                        onClick={() => navigate('/signin')}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        로그인
                    </button>
                </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;