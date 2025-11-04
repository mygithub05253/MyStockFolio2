import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiHome, FiBriefcase, FiTrendingUp, FiGift, FiUser } from 'react-icons/fi';

const Footer = () => {
    const location = useLocation();
    const { isLoggedIn } = useSelector(state => state.user);

    const navItems = [
        { path: '/dashboard', icon: FiHome, label: '대시보드' },
        { path: '/portfolio', icon: FiBriefcase, label: '포트폴리오' },
        { path: '/market', icon: FiTrendingUp, label: '시장' },
        { path: '/rewards', icon: FiGift, label: '리워드' },
        { path: '/mypage', icon: FiUser, label: '마이페이지' },
    ];

    const getLinkClass = (path) => {
        let classes = "flex flex-col items-center justify-center flex-1 px-2 py-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors";
        if (location.pathname === path) {
            classes += " text-indigo-600 font-semibold";
        }
        return classes;
    };

    if (!isLoggedIn) {
        return null;
    }

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md h-16 z-10 max-w-md mx-auto">
            <nav className="h-full flex justify-around items-center">
                {navItems.map((item) => (
                    <Link key={item.path} to={item.path} className={getLinkClass(item.path)}>
                        <item.icon className="w-5 h-5 mb-1" />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>
        </footer>
    );
};

export default Footer;

