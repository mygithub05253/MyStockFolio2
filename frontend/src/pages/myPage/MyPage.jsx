import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import axiosInstance from '../../api/axiosInstance';
import { logout, updateUserInfo } from '../../modules/user';
import { resetPortfolio } from '../../modules/portfolio';
import { resetDashboard } from '../../modules/dashboard';
import { resetRewards } from '../../modules/rewards';
import BasicButton from '../../components/button/BasicButton';

// 아이콘 import
import { FiCopy, FiExternalLink, FiLogOut, FiEdit2, FiX, FiCheck, FiTrash2, FiLink } from 'react-icons/fi';

const MyPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userInfo } = useSelector(state => state.user);

    // 수정 모드 상태
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [isEditingWallet, setIsEditingWallet] = useState(false);
    const [nickname, setNickname] = useState(userInfo?.nickname || '');
    const [walletAddress, setWalletAddress] = useState(userInfo?.walletAddress || '');
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [tokenBalance, setTokenBalance] = useState(null);
    const [balanceLoading, setBalanceLoading] = useState(false);

    // 사용자 정보 로드
    React.useEffect(() => {
        if (userInfo) {
            setNickname(userInfo.nickname || '');
            setWalletAddress(userInfo.walletAddress || '');
        }
    }, [userInfo]);

    // 토큰 잔액 조회
    React.useEffect(() => {
        const fetchTokenBalance = async () => {
            if (!userInfo?.walletAddress) {
                setTokenBalance(null);
                return;
            }

            try {
                setBalanceLoading(true);
                const response = await axiosInstance.get(
                    `/api/blockchain/token/balance?address=${userInfo.walletAddress}`
                );
                if (response.data?.balance !== undefined) {
                    setTokenBalance(parseFloat(response.data.balance).toFixed(2));
                } else {
                    setTokenBalance('0');
                }
            } catch (err) {
                console.error('토큰 잔액 조회 실패:', err);
                setTokenBalance('0');
            } finally {
                setBalanceLoading(false);
            }
        };

        fetchTokenBalance();
    }, [userInfo?.walletAddress]);

    const handleLogout = () => {
        sessionStorage.removeItem('accessToken');
        dispatch(resetPortfolio());
        dispatch(resetDashboard());
        dispatch(resetRewards());
        dispatch(logout());
        alert('로그아웃 되었습니다.');
        navigate('/');
    };

    // 지갑 주소 복사 핸들러
    const handleCopyAddress = () => {
        if (userInfo?.walletAddress) {
            navigator.clipboard.writeText(userInfo.walletAddress)
                .then(() => alert('지갑 주소가 복사되었습니다.'))
                .catch(err => console.error('주소 복사 실패:', err));
        }
    };

    // Etherscan 링크 핸들러
    const handleEtherscanLink = () => {
        if (userInfo?.walletAddress) {
            const etherscanUrl = `https://etherscan.io/address/${userInfo.walletAddress}`;
            window.open(etherscanUrl, '_blank', 'noopener,noreferrer');
        }
    };

    // 닉네임 수정 시작
    const handleStartEditNickname = () => {
        setIsEditingNickname(true);
        setError('');
    };

    // 닉네임 수정 취소
    const handleCancelEditNickname = () => {
        setIsEditingNickname(false);
        setNickname(userInfo?.nickname || '');
        setError('');
    };

    // 닉네임 수정 저장
    const handleSaveNickname = async () => {
        if (!nickname.trim()) {
            setError('닉네임을 입력해주세요.');
            return;
        }

        if (nickname.trim() === userInfo?.nickname) {
            setIsEditingNickname(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axiosInstance.put('/api/user/profile', {
                nickname: nickname.trim(),
                walletAddress: userInfo?.walletAddress || null
            });

            dispatch(updateUserInfo(response.data));
            setIsEditingNickname(false);
            alert('닉네임이 수정되었습니다.');
        } catch (err) {
            console.error('닉네임 수정 실패:', err);
            setError(err.response?.data?.error || '닉네임 수정 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // MetaMask 연결 함수
    const handleConnectMetaMask = async () => {
        // MetaMask 설치 여부 확인
        if (typeof window.ethereum === 'undefined') {
            const install = window.confirm(
                'MetaMask가 설치되어 있지 않습니다.\n\nMetaMask를 설치하시겠습니까?'
            );
            if (install) {
                window.open('https://metamask.io/download/', '_blank', 'noopener,noreferrer');
            }
            return;
        }

        try {
            setLoading(true);
            setError('');

            // MetaMask 연결 요청
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
            
            // 연결된 계정 주소 가져오기
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            // 주소를 입력 필드에 자동으로 설정
            setWalletAddress(address);
            
            alert('MetaMask에서 지갑 주소를 가져왔습니다.');
        } catch (err) {
            console.error('MetaMask 연결 실패:', err);
            
            if (err.code === 4001) {
                setError('MetaMask 연결이 거부되었습니다. 다시 시도해주세요.');
            } else if (err.code === -32002) {
                setError('이미 연결 요청이 진행 중입니다. MetaMask를 확인해주세요.');
            } else {
                setError('MetaMask 연결 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
            }
        } finally {
            setLoading(false);
        }
    };

    // 지갑 주소 수정 시작
    const handleStartEditWallet = () => {
        setIsEditingWallet(true);
        setError('');
    };

    // 지갑 주소 수정 취소
    const handleCancelEditWallet = () => {
        setIsEditingWallet(false);
        setWalletAddress(userInfo?.walletAddress || '');
        setError('');
    };

    // 지갑 주소 수정 저장
    const handleSaveWallet = async () => {
        const trimmedWallet = walletAddress.trim();
        
        // 빈 문자열이면 제거 (null로 설정)
        if (trimmedWallet === '') {
            // 지갑 주소 제거 확인
            if (userInfo?.walletAddress && !window.confirm('지갑 주소를 제거하시겠습니까?')) {
                return;
            }
        } else {
            // 지갑 주소 형식 검증
            if (!trimmedWallet.startsWith('0x') || trimmedWallet.length !== 42) {
                setError('지갑 주소 형식이 올바르지 않습니다. (0x로 시작하는 42자리 주소)');
                return;
            }
        }

        if (trimmedWallet === userInfo?.walletAddress) {
            setIsEditingWallet(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axiosInstance.put('/api/user/profile', {
                nickname: userInfo?.nickname || '',
                walletAddress: trimmedWallet === '' ? null : trimmedWallet
            });

            dispatch(updateUserInfo(response.data));
            setIsEditingWallet(false);
            alert(trimmedWallet === '' ? '지갑 주소가 제거되었습니다.' : '지갑 주소가 수정되었습니다.');
        } catch (err) {
            console.error('지갑 주소 수정 실패:', err);
            setError(err.response?.data?.error || '지갑 주소 수정 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 계정 삭제 확인 다이얼로그 표시
    const handleShowDeleteConfirm = () => {
        setShowDeleteConfirm(true);
        setDeletePassword('');
        setError('');
    };

    // 계정 삭제 취소
    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
        setDeletePassword('');
        setError('');
    };

    // 계정 삭제 실행
    const handleDeleteAccount = async () => {
        // 일반 회원가입 사용자는 비밀번호 확인 필요
        const isMystockfolioUser = userInfo?.provider === 'mystockfolio' || !userInfo?.provider;
        
        // 일반 회원가입 사용자는 비밀번호 확인 필요
        if (isMystockfolioUser && (!deletePassword || deletePassword.trim() === '')) {
            setError('계정 삭제를 위해 비밀번호를 입력해주세요.');
            return;
        }

        // 소셜 로그인 사용자는 추가 확인 (비밀번호 없이 바로 삭제 가능)
        const confirmMessage = isMystockfolioUser 
            ? '정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며 모든 포트폴리오 데이터가 삭제됩니다.'
            : '정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며 모든 포트폴리오 데이터가 삭제됩니다.\n\n소셜 로그인 계정은 비밀번호 확인 없이 삭제됩니다.';

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const requestBody = isMystockfolioUser ? { password: deletePassword } : {};
            await axiosInstance.delete('/api/user/profile', {
                data: requestBody
            });

            alert('계정이 삭제되었습니다.');
            
            // 로그아웃 처리
            sessionStorage.removeItem('accessToken');
            dispatch(resetPortfolio());
            dispatch(resetDashboard());
            dispatch(resetRewards());
            dispatch(logout());
            navigate('/');
        } catch (err) {
            console.error('계정 삭제 실패:', err);
            const errorMessage = err.response?.data?.error || err.response?.data?.message || '계정 삭제 중 오류가 발생했습니다.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // userInfo가 로드되지 않았을 경우 처리
    if (!userInfo) {
        return (
            <div className="container mx-auto p-4 max-w-2xl">
                <p className="text-gray-600">로그인이 필요합니다.</p>
            </div>
        );
    }

    const isMystockfolioUser = userInfo?.provider === 'mystockfolio' || !userInfo?.provider;

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">마이페이지</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* 사용자 정보 섹션 */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-semibold mb-4">계정 정보</h2>
                <div className="space-y-3">
                    <p><span className="font-medium">이메일:</span> {userInfo.email}</p>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">닉네임:</span>
                        {isEditingNickname ? (
                            <div className="flex-1 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    disabled={loading}
                                />
                                <button
                                    onClick={handleSaveNickname}
                                    disabled={loading}
                                    className="text-green-600 hover:text-green-700"
                                    title="저장"
                                >
                                    <FiCheck size={20} />
                                </button>
                                <button
                                    onClick={handleCancelEditNickname}
                                    disabled={loading}
                                    className="text-red-600 hover:text-red-700"
                                    title="취소"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className="flex-1">{userInfo.nickname}</span>
                                <button
                                    onClick={handleStartEditNickname}
                                    className="text-indigo-600 hover:text-indigo-700"
                                    title="수정"
                                >
                                    <FiEdit2 size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 블록체인 정보 섹션 */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-semibold mb-4">블록체인 정보</h2>
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">지갑 주소:</span>
                        {isEditingWallet ? (
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={walletAddress}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setWalletAddress(value);
                                            // 주소 형식 자동 검증 (입력 중에는 공백 허용)
                                            const trimmedValue = value.trim();
                                            if (trimmedValue && !trimmedValue.startsWith('0x')) {
                                                setError('지갑 주소는 0x로 시작해야 합니다.');
                                            } else if (trimmedValue && trimmedValue.length !== 42) {
                                                setError('지갑 주소는 42자리여야 합니다.');
                                            } else {
                                                setError('');
                                            }
                                        }}
                                        onPaste={(e) => {
                                            // 붙여넣기 시 자동으로 공백 제거
                                            const pastedText = e.clipboardData.getData('text').trim();
                                            setTimeout(() => {
                                                setWalletAddress(pastedText);
                                            }, 0);
                                        }}
                                        placeholder="0x... 또는 MetaMask 연결 버튼 클릭"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={handleConnectMetaMask}
                                        disabled={loading}
                                        className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md flex items-center gap-1 text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        title="MetaMask 연결"
                                    >
                                        <FiLink size={16} />
                                        MetaMask 연결
                                    </button>
                                    <button
                                        onClick={handleSaveWallet}
                                        disabled={loading}
                                        className="text-green-600 hover:text-green-700 p-1"
                                        title="저장"
                                    >
                                        <FiCheck size={20} />
                                    </button>
                                    <button
                                        onClick={handleCancelEditWallet}
                                        disabled={loading}
                                        className="text-red-600 hover:text-red-700 p-1"
                                        title="취소"
                                    >
                                        <FiX size={20} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    MetaMask 지갑 주소를 자동으로 가져오거나, 직접 입력하실 수 있습니다.
                                </p>
                            </div>
                        ) : (
                            <>
                                <span className="truncate flex-1">{userInfo.walletAddress || '등록되지 않음'}</span>
                                {userInfo.walletAddress && (
                                    <>
                                        <button
                                            onClick={handleCopyAddress}
                                            className="text-gray-500 hover:text-gray-700"
                                            title="주소 복사"
                                        >
                                            <FiCopy size={18} />
                                        </button>
                                        <button
                                            onClick={handleEtherscanLink}
                                            className="text-gray-500 hover:text-gray-700"
                                            title="Etherscan에서 보기"
                                        >
                                            <FiExternalLink size={18} />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={handleStartEditWallet}
                                    className="text-indigo-600 hover:text-indigo-700"
                                    title={userInfo.walletAddress ? "수정" : "등록"}
                                >
                                    <FiEdit2 size={18} />
                                </button>
                            </>
                        )}
                    </div>
                    <p>
                        <span className="font-medium">Folio Token 잔액:</span>{' '}
                        {balanceLoading ? (
                            <span className="text-gray-500">로딩 중...</span>
                        ) : (
                            <span className="text-indigo-600 font-semibold">
                                {tokenBalance !== null ? `${tokenBalance} FOLIO` : '0 FOLIO'}
                            </span>
                        )}
                    </p>
                    <p><span className="font-medium">보상 내역:</span> {'준비 중'}</p>
                </div>
            </div>

            {/* 계정 삭제 섹션 */}
            {showDeleteConfirm ? (
                <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow mb-6">
                    <h2 className="text-xl font-semibold mb-4 text-red-700">계정 삭제 확인</h2>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-700">
                            계정을 삭제하면 모든 포트폴리오 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                        </p>
                        {/* 일반 회원가입 사용자만 비밀번호 입력 필드 표시 */}
                        {isMystockfolioUser ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    비밀번호 확인:
                                </label>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="비밀번호를 입력하세요"
                                    disabled={loading}
                                />
                            </div>
                        ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                <p className="text-sm text-yellow-800">
                                    <strong>소셜 로그인 계정</strong>이므로 비밀번호 확인 없이 계정을 삭제할 수 있습니다.
                                </p>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <BasicButton
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                                <FiTrash2 className="inline-block mr-2" />
                                계정 삭제
                            </BasicButton>
                            <BasicButton
                                onClick={handleCancelDelete}
                                disabled={loading}
                                className="flex-1 bg-gray-500 hover:bg-gray-600"
                            >
                                취소
                            </BasicButton>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-6">
                    <BasicButton
                        onClick={handleShowDeleteConfirm}
                        className="w-full bg-red-500 hover:bg-red-600"
                    >
                        <FiTrash2 className="inline-block mr-2" />
                        계정 삭제
                    </BasicButton>
                </div>
            )}

            {/* 로그아웃 버튼 */}
            <BasicButton onClick={handleLogout} className="w-full bg-gray-500 hover:bg-gray-600">
                <FiLogOut className="inline-block mr-2" /> 로그아웃
            </BasicButton>
        </div>
    );
};

export default MyPage;
