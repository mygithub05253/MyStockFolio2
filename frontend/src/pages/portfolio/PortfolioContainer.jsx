// frontend/src/pages/portfolio/PortfolioContainer.jsx

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';
import { addPortfolio, setPortfolios, updatePortfolio, removePortfolio, selectPortfolio, setAssetsForPortfolio } from '../../modules/portfolio'; // Redux 액션 import
import { setDashboardStats, setLoading as setDashboardLoading, setError as setDashboardError } from '../../modules/dashboard';
import AssetItem from './AssetItem.jsx'; // .jsx 확장자 사용 확인

// 자산 상세/추가 UI
import AssetDetailModal from '../../components/modal/AssetDetailModal.jsx';
import AssetInsert from './AssetInsert.jsx';
import BasicButton from '../../components/button/BasicButton.jsx';
import useInput from '../../hooks/useInput.js';


const PortfolioContainer = () => {
    const dispatch = useDispatch();
    // Redux에서 포트폴리오 목록과 선택된 포트폴리오 ID 가져오기
    const portfolioState = useSelector(state => state.portfolio);
    
    // 안전한 기본값 설정
    const portfolios = (portfolioState && Array.isArray(portfolioState.list)) ? portfolioState.list : [];
    const selectedPortfolioId = portfolioState?.selectedPortfolioId || null;
    const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId) || null;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [isInsertMode, setIsInsertMode] = useState(false);
    const [newPortfolioName, onChangeNewPortfolioName, setNewPortfolioName] = useInput('');
    const [editPortfolioName, onChangeEditPortfolioName, setEditPortfolioName] = useInput('');
    
    const refreshPortfoliosAndDashboard = async () => {
        try {
            const [pfResp, statsResp] = await Promise.all([
                axiosInstance.get('/api/portfolios'),
                axiosInstance.get('/api/dashboard/stats')
            ]);
            dispatch(setPortfolios(pfResp.data));
            dispatch(setDashboardStats(statsResp.data));
        } catch (err) {
            console.warn('새로고침 실패:', err);
        }
    };


    // [P2-1. 포트폴리오 목록 조회 로직]
    useEffect(() => {
        const fetchPortfolios = async () => {
            try {
                const response = await axiosInstance.get('/api/portfolios');
                const portfolioList = Array.isArray(response.data) ? response.data : [];
                console.log('API Response:', response.data);
                dispatch(setPortfolios(portfolioList));
                if (portfolioList.length > 0) {
                    dispatch(selectPortfolio(portfolioList[0].id));
                }
            } catch (error) {
                console.error("포트폴리오 목록 로드 실패:", error);
                console.error("Error details:", error.response?.data);
            }
        };
        fetchPortfolios();
    }, [dispatch]);

    // 선택된 포트폴리오의 자산 목록을 서버에서 로드하여 상태에 반영
    useEffect(() => {
        const fetchAssets = async () => {
            if (!selectedPortfolioId) return;
            try {
                const resp = await axiosInstance.get(`/api/portfolios/${selectedPortfolioId}/assets`);
                const assets = Array.isArray(resp.data) ? resp.data : [];
                dispatch(setAssetsForPortfolio(selectedPortfolioId, assets));
            } catch (err) {
                console.warn('자산 목록 로드 실패:', err.response?.data || err.message);
                dispatch(setAssetsForPortfolio(selectedPortfolioId, []));
            }
        };
        fetchAssets();
    }, [dispatch, selectedPortfolioId]);

    // [P2-1. 포트폴리오 생성 로직]
    const handleCreatePortfolio = async () => {
      if (!newPortfolioName.trim()) {
          alert("포트폴리오 이름을 입력해주세요.");
          return;
      }

      // 낙관적 생성: 임시 항목 추가
      const temp = { id: Date.now(), name: newPortfolioName.trim(), assets: [] };
      dispatch(addPortfolio(temp));
      try {
          const response = await axiosInstance.post('/api/portfolios', { name: newPortfolioName.trim() });
          const created = response.data;
          alert(`포트폴리오 '${created.name}'가 생성되었습니다.`);
          setNewPortfolioName('');
          await refreshPortfoliosAndDashboard();
          // 대시보드 즉시 갱신
          try {
              dispatch(setDashboardLoading(true));
              const statsResp = await axiosInstance.get('/api/dashboard/stats');
              dispatch(setDashboardStats(statsResp.data));
          } catch (e) {
              console.warn('대시보드 갱신 실패:', e);
              dispatch(setDashboardError(e.message));
          } finally {
              dispatch(setDashboardLoading(false));
          }
      } catch (error) {
          console.error("포트폴리오 생성 실패:", error.response ? error.response.data : error.message);
          if (error.response && error.response.data?.error) {
            alert(`포트폴리오 생성 실패: ${error.response.data.error}`);
          } else {
            alert("포트폴리오 생성 중 오류가 발생했습니다.");
          }
          // 롤백: 목록 재조회로 복구
          await refreshPortfoliosAndDashboard();
      }
    };

    const handleAssetClick = (asset) => {
      setSelectedAsset(asset);
      setIsModalOpen(true);
    };
  
    const closeModal = () => {
      setIsModalOpen(false);
      setSelectedAsset(null);
    };
    
    const toggleInsertMode = () => {
        setIsInsertMode(prev => !prev);
    };

    // 포트폴리오가 없을 때 생성 폼을 먼저 보여줌 (필요 시 사용)

    // 모바일 뷰 중앙 정렬 및 너비 제한은 Layout.jsx에서 처리
    return (
      <div className="container mx-auto p-4 max-w-md"> 
          <h1 className="text-2xl font-bold mb-6">내 포트폴리오</h1>

          {/* 포트폴리오 생성 섹션 */}
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-3">새 포트폴리오 생성</h2>
              <div className="flex space-x-2">
                  <input 
                      type="text" 
                      value={newPortfolioName}
                      onChange={onChangeNewPortfolioName}
                      placeholder="포트폴리오 이름을 입력하세요"
                      className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <BasicButton onClick={handleCreatePortfolio} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4">
                      생성
                  </BasicButton>
              </div>
          </div>

          {/* 포트폴리오 선택 UI 영역 (TODO: 추후 여러 개일 때 선택 기능 구현 필요) */}
          {Array.isArray(portfolios) && portfolios.length > 0 && (
              <div className="mb-4 space-y-3">
                  <select 
                      className="w-full p-2 border rounded-md shadow-sm"
                      value={selectedPortfolioId || ''}
                      onChange={(e) => {
                          const id = Number(e.target.value);
                          setEditPortfolioName('');
                          dispatch(selectPortfolio(id));
                      }}
                  >
                      {portfolios.map((p, idx) => (
                          <option key={p.id ?? `pf-${idx}`} value={p.id}>
                              {p.name}
                          </option>
                      ))}
                  </select>
                  {selectedPortfolio && (
                      <div className="flex gap-2">
                          <input
                              type="text"
                              value={editPortfolioName}
                              onChange={onChangeEditPortfolioName}
                              placeholder={`'${selectedPortfolio.name}' 이름 수정`}
                              className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <BasicButton
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3"
                              onClick={async () => {
                                  const name = editPortfolioName.trim();
                                  if (!name) { alert('새 이름을 입력해주세요.'); return; }
                                  // 낙관적 업데이트: 기존 이름 백업, 먼저 반영
                                  const prevName = selectedPortfolio.name;
                                  dispatch(updatePortfolio(selectedPortfolio.id, { name }));
                                  try {
                                      const resp = await axiosInstance.put(`/api/portfolios/${selectedPortfolio.id}`, { name });
                                      const updated = resp.data;
                                      dispatch(updatePortfolio(selectedPortfolio.id, { name: updated.name }));
                                      alert('포트폴리오 이름이 수정되었습니다.');
                                      setEditPortfolioName('');
                                      // 대시보드 갱신
                                      try {
                                          dispatch(setDashboardLoading(true));
                                          const statsResp = await axiosInstance.get('/api/dashboard/stats');
                                          dispatch(setDashboardStats(statsResp.data));
                                      } finally {
                                          dispatch(setDashboardLoading(false));
                                      }
                                  } catch (err) {
                                      console.error('포트폴리오 수정 실패:', err.response?.data || err.message);
                                      alert('포트폴리오 수정 중 오류가 발생했습니다. 변경을 되돌립니다.');
                                      // 롤백
                                      dispatch(updatePortfolio(selectedPortfolio.id, { name: prevName }));
                                  }
                              }}
                          >
                              이름 수정
                          </BasicButton>
                          <BasicButton
                              className="bg-red-600 hover:bg-red-700 text-white px-3"
                              onClick={async () => {
                                  if (!window.confirm(`'${selectedPortfolio.name}' 포트폴리오를 삭제하시겠습니까?`)) return;
                                  // 낙관적 제거: 먼저 제거 후 서버 호출
                                  dispatch(removePortfolio(selectedPortfolio.id));
                                  try {
                                      await axiosInstance.delete(`/api/portfolios/${selectedPortfolio.id}`);
                                      alert('포트폴리오가 삭제되었습니다.');
                                      // 대시보드 갱신
                                      try {
                                          dispatch(setDashboardLoading(true));
                                          const statsResp = await axiosInstance.get('/api/dashboard/stats');
                                          dispatch(setDashboardStats(statsResp.data));
                                      } finally {
                                          dispatch(setDashboardLoading(false));
                                      }
                                  } catch (err) {
                                      console.error('포트폴리오 삭제 실패:', err.response?.data || err.message);
                                      alert('포트폴리오 삭제 중 오류가 발생했습니다. 변경을 되돌립니다.');
                                      await refreshPortfoliosAndDashboard();
                                  }
                              }}
                          >
                              삭제
                          </BasicButton>
                      </div>
                  )}
              </div>
          )}


          {/* 자산 추가 버튼 */}
          {selectedPortfolioId && (
              <BasicButton onClick={toggleInsertMode} className="w-full mb-4 bg-green-500 hover:bg-green-600">
                  {isInsertMode ? '자산 목록 보기' : '자산 추가'}
              </BasicButton>
          )}

          {/* 자산 추가 폼 or 자산 목록 */}
          {isInsertMode ? (
                <AssetInsert 
                    portfolioId={selectedPortfolioId} 
                    onInsertSuccess={async () => { 
                        toggleInsertMode(); 
                        await refreshPortfoliosAndDashboard();
                    }} 
                />
            ) : (
                <div className="space-y-4">
                    {selectedPortfolio ? (
                        selectedPortfolio.assets && selectedPortfolio.assets.length > 0 ? (
                            selectedPortfolio.assets.map((asset, idx) => (
                                <AssetItem 
                                    key={asset.id ?? `asset-${idx}`} 
                                    asset={asset} 
                                    portfolioId={selectedPortfolioId} // portfolioId 전달
                                    onClick={() => handleAssetClick(asset)} // 클릭 시 상세 모달 열기
                                    onChanged={refreshPortfoliosAndDashboard} // 자산 변경 시 새로고침
                                />
                            ))
                        ) : (
                            // ... (자산 없음 메시지 유지) ...
                             <p className="text-center text-gray-500 mt-10 p-4 bg-white rounded-lg shadow-sm">
                                포트폴리오 '{selectedPortfolio.name}'에 등록된 자산이 없습니다.
                            </p>
                        )
                    ) : (
                         <p className="text-center text-gray-500 mt-10 p-4 bg-white rounded-lg shadow-sm">
                            포트폴리오를 생성하여 투자를 시작하세요.
                         </p>
                    )}
                </div>
            )}
            

            {/* 자산 상세 모달 */}
            {selectedAsset && (
                <AssetDetailModal 
                    isOpen={isModalOpen} 
                    onClose={closeModal} 
                    asset={selectedAsset} 
                    portfolioId={selectedPortfolioId} // <-- portfolioId 전달
                    onChanged={refreshPortfoliosAndDashboard}
                />
            )}
        </div>
  );
};

export default PortfolioContainer;