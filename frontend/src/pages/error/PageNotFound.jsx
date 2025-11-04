import React from 'react';
import { Link } from 'react-router-dom';

const PageNotFound = () => {
  return (
    <div>
      <p>페이지가 존재하지 않습니다.😱</p>
      <Link to={"/"}>메인으로 이동</Link>
    </div>
  );
};

export default PageNotFound;