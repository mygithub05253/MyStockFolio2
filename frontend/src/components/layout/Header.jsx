import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../modules/user';
import { resetPortfolio } from '../../modules/portfolio';
import { resetDashboard } from '../../modules/dashboard';
import { resetRewards } from '../../modules/rewards';
import { FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi';

const Header = ({ title = 'MyStockFolio' }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoggedIn, userInfo } = useSelector(state => state.user);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    // 메뉴 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleLogout = () => {
        sessionStorage.removeItem('accessToken');
        dispatch(resetPortfolio());
        dispatch(resetDashboard());
        dispatch(resetRewards());
        dispatch(logout());
        setShowMenu(false);
        navigate('/');
    };

    const handleGoToMyPage = () => {
        setShowMenu(false);
        navigate('/mypage');
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
            <div className="container mx-auto px-4 py-3 max-w-md">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-indigo-600">{title}</h1>
                    {isLoggedIn && userInfo && (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <span className="text-indigo-600 font-semibold text-sm">
                                        {userInfo.nickname?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-600 hidden sm:inline">{userInfo.nickname}</span>
                                <FiChevronDown className={`text-gray-500 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {/* 드롭다운 메뉴 */}
                            {showMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-30">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-sm font-semibold text-gray-900">{userInfo.nickname}</p>
                                        <p className="text-xs text-gray-500 truncate">{userInfo.email}</p>
                                    </div>
                                    
                                    <button
                                        onClick={handleGoToMyPage}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <FiUser size={16} />
                                        마이페이지
                                    </button>
                                    
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <FiLogOut size={16} />
                                        로그아웃
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;

