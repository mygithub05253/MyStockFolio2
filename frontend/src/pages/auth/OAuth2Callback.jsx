import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../modules/user';

/**
 * OAuth2 로그인 성공 후 리다이렉션 페이지
 * 백엔드에서 토큰과 사용자 정보를 쿼리 파라미터로 전달받음
 */
const OAuth2Callback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const nickname = searchParams.get('nickname');
    const provider = searchParams.get('provider');
    const walletAddress = searchParams.get('walletAddress');

    if (accessToken && userId && email && nickname) {
      // 이미 처리된 경우 중복 실행 방지
      if (sessionStorage.getItem('accessToken') === accessToken) {
        console.log('이미 처리된 로그인입니다. 중복 실행 방지');
        navigate('/dashboard', { replace: true });
        return;
      }

      // 세션 스토리지에 토큰 저장
      sessionStorage.setItem('accessToken', accessToken);

      // Redux 스토어에 사용자 정보 저장
      dispatch(loginSuccess({
        userId: parseInt(userId),
        email,
        nickname,
        provider: provider || 'google', // 기본값은 google (OAuth2 콜백이므로)
        walletAddress: walletAddress || null
      }));

      console.log('OAuth2 로그인 완료:', { userId, email, nickname });
      alert(`${nickname}님, 환영합니다!`);

      // 대시보드로 이동
      navigate('/dashboard', { replace: true });
    } else {
      console.error('OAuth2 로그인 정보가 불완전합니다.');
      alert('로그인 처리 중 오류가 발생했습니다.');
      navigate('/signin', { replace: true });
    }
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default OAuth2Callback;

