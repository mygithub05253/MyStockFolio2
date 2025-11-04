import React from 'react';
import { faBell, faHouse, faSearch, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, NavLink, Outlet } from 'react-router-dom';

const AdminLayout = () => {

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-gray-100">
      <div className="flex flex-col w-full max-w-md h-[800px] md:h-screen bg-white shadow-lg p-7">
        <header className="flex items-center w-full h-24">
          <Link to={"/"} className="text-2xl font-semibold">Dongwon's Todo</Link>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <nav className="flex items-center justify-between w-full h-24">
          <NavLink to={"/todo"} className="text-center">
            <FontAwesomeIcon icon={faHouse} className="text-2xl p-1 text-gray-400" />
            <p className="text-gray-400">피드</p>
          </NavLink>
          <NavLink to={"/search"} className="text-center">
            <FontAwesomeIcon icon={faSearch} className="text-2xl p-1 text-gray-400" />
            <p className="text-gray-400">검색</p>
          </NavLink>
          <NavLink to={"/notice"} className="text-center">
            <FontAwesomeIcon icon={faBell} className="text-2xl p-1 text-gray-400" />
            <p className="text-gray-400">알림</p>
          </NavLink>
          <NavLink to={"/my"} className="text-center">
            <FontAwesomeIcon icon={faUser} className="text-2xl p-1 text-gray-400" />
            <p className="text-gray-400">My</p>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default AdminLayout;