const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initializeProvider } = require('./config/web3Config');
const tokenRoutes = require('./routes/tokenRoutes');
const nftRoutes = require('./routes/nftRoutes');
const ipfsRoutes = require('./routes/ipfsRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();
const PORT = process.env.PORT || 8004;

// Web3 Provider 초기화
try {
    initializeProvider();
} catch (error) {
    console.error('⚠️ Web3 Provider initialization failed:', error.message);
    console.log('⚠️ Server will start in limited mode (read-only)');
}

// Middleware
app.use(cors({
    origin: [
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    credentials: true
}));
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'blockchain-api',
        network: process.env.NETWORK || 'localhost'
    });
});

// API Routes
app.use('/api/blockchain/token', tokenRoutes);
app.use('/api/blockchain/nft', nftRoutes);
app.use('/api/blockchain/ipfs', ipfsRoutes);
app.use('/api/blockchain/transaction', transactionRoutes);

// Error Handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Blockchain API Server running on http://localhost:${PORT}`);
    console.log(`📡 Network: ${process.env.NETWORK || 'localhost'}`);
    console.log(`🔐 Token Contract: ${process.env.FOLIO_TOKEN_ADDRESS || 'Not deployed'}`);
    console.log(`🎨 NFT Contract: ${process.env.NFT_CONTRACT_ADDRESS || 'Not deployed'}`);
});

