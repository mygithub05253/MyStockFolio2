import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BasicButton from '../../components/button/BasicButton.jsx';

const Main = () => {
    const navigate = useNavigate();
    const { isLoggedIn } = useSelector(state => state.user);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
            
            {/* 상단 버튼 영역 (모바일 최적화) */}
            <header className="absolute top-0 right-0 p-4 w-full max-w-md mx-auto">
                {!isLoggedIn && (
                    // [1. 회원가입 버튼 제거 완료]
                    <div className="flex justify-end space-x-3"> 
                        <BasicButton
                            onClick={() => navigate('/signin')}
                            className="text-sm bg-transparent hover:bg-indigo-50 text-indigo-600 border border-indigo-600 px-3 py-1"
                        >
                            로그인
                        </BasicButton>
                    </div>
                )}
            </header>

            <div className="max-w-md w-full mt-20"> 
                {/* 메인 콘텐츠 */}
                <img
                    src="/images/main/penguin.png" 
                    alt="MyStockFolio 펭귄 로고"
                    className="mx-auto w-48 h-48 mb-6"
                />
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                    MyStockFolio
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    나만의 포트폴리오를 관리하고 <br /> 활동으로 Folio Token을 보상받으세요.
                </p>

                {/* 메인 시작 버튼 */}
                {!isLoggedIn && (
                     <div className="flex justify-center mt-6">
                        <BasicButton
                            onClick={() => navigate('/signin')}
                            className="w-40 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            시작하기
                        </BasicButton>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Main;