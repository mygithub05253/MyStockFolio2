import React from 'react';

const MainContent = ({ children }) => {
    return (
        <main className="flex-grow pb-16 overflow-y-auto">
            {children}
        </main>
    );
};

export default MainContent;

