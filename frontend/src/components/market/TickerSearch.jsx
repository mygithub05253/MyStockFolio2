import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

const TickerSearch = ({ onSearch, onSelectTicker }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            if (searchTerm.length > 1) {
                const fetchSuggestions = async () => {
                    try {
                        const response = await axiosInstance.get(`/api/market/suggest?q=${searchTerm}`);
                        setSuggestions(response.data);
                    } catch (err) {
                        console.error('자동완성 로드 실패:', err);
                        setSuggestions([]);
                    }
                };
                fetchSuggestions();
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(debounceTimeout);
    }, [searchTerm]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            onSearch(searchTerm.trim().toUpperCase());
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (ticker) => {
        setSearchTerm(ticker);
        onSelectTicker(ticker);
        setSuggestions([]);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 relative">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    placeholder="종목 코드 입력 (예: AAPL, BTC-USD, 005930.KS)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button
                    type="submit"
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-5 rounded-md transition-colors text-sm"
                >
                    검색
                </button>
            </form>
            {suggestions.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-300 rounded-md w-full sm:max-w-[calc(100%-120px)] mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {suggestions.map((s) => (
                        <li
                            key={s.ticker}
                            onClick={() => handleSuggestionClick(s.ticker)}
                            className="p-3 hover:bg-gray-100 cursor-pointer flex justify-between items-center text-sm"
                        >
                            <span>{s.name} ({s.ticker})</span>
                            <span className="text-xs text-gray-500">{s.type === 'stock' ? '주식' : '코인'}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default TickerSearch;

