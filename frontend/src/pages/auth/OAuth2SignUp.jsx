import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../modules/user';
import axiosInstance from '../../api/axiosInstance';

/**
 * OAuth2 로그인 후 추가 정보 입력 페이지 (회원가입 완료)
 */
const OAuth2SignUp = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const email = searchParams.get('email');
  const defaultNickname = searchParams.get('nickname');
  const provider = searchParams.get('provider');
  const providerId = searchParams.get('providerId');

  const [nickname, setNickname] = useState(defaultNickname || '');
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 필수 파라미터가 없으면 로그인 페이지로 리다이렉트
    if (!email || !provider || !providerId) {
      alert('잘못된 접근입니다.');
      navigate('/signin', { replace: true });
    }
  }, [email, provider, providerId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (nickname.trim().length < 2) {
      setError('닉네임은 2자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      // OAuth2 회원가입 완료 API 호출
      const response = await axiosInstance.post('/api/auth/oauth2/complete', {
        email,
        nickname: nickname.trim(),
        provider,
        providerId,
        walletAddress: walletAddress.trim() || null
      });

      const { userId, email: userEmail, nickname: userNickname, provider: responseProvider, walletAddress: responseWalletAddress, accessToken } = response.data;

      if (!accessToken) {
        setError('회원가입 응답에 액세스 토큰이 없습니다.');
        return;
      }

      // 세션 스토리지에 토큰 저장
      sessionStorage.setItem('accessToken', accessToken);

      // Redux 스토어에 사용자 정보 저장
      dispatch(loginSuccess({
        userId: parseInt(userId),
        email: userEmail,
        nickname: userNickname,
        provider: responseProvider || provider, // 응답에서 오는 provider 우선, 없으면 쿼리 파라미터 사용
        walletAddress: responseWalletAddress || null
      }));

      console.log('OAuth2 회원가입 완료:', { userId, email: userEmail, nickname: userNickname });
      alert(`${userNickname}님, 회원가입이 완료되었습니다!`);

      // 대시보드로 이동
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('OAuth2 회원가입 실패:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || '회원가입 처리 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderDisplayName = (provider) => {
    switch (provider?.toLowerCase()) {
      case 'google':
        return 'Google';
      case 'naver':
        return 'Naver';
      case 'kakao':
        return 'Kakao';
      default:
        return 'OAuth2';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            추가 정보 입력
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getProviderDisplayName(provider)} 계정으로 로그인하셨습니다.
            <br />
            닉네임을 입력해주세요.
          </p>
        </div>

        {/* 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* 이메일 (읽기 전용) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email || ''}
                readOnly
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-500 rounded-lg focus:outline-none bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* 닉네임 입력 */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                닉네임 <span className="text-red-500">*</span>
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                placeholder="닉네임을 입력하세요 (2자 이상)"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                maxLength={50}
              />
            </div>

            {/* 지갑 주소 (선택) */}
            <div>
              <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-1">
                지갑 주소 (선택사항)
              </label>
              <input
                id="walletAddress"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="MetaMask 지갑 주소 (선택)"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 제출 버튼 */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                isLoading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              } transition-colors`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  처리 중...
                </>
              ) : (
                '시작하기'
              )}
            </button>
          </div>
        </form>

        {/* 주의사항 */}
        <div className="mt-4">
          <p className="text-xs text-center text-gray-500">
            닉네임은 다른 사용자에게 표시되는 이름입니다.
            <br />
            나중에 프로필 설정에서 변경할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OAuth2SignUp;

