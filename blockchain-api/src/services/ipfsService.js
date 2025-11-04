const axios = require('axios');
const FormData = require('form-data');

let pinataConfig = null;

/**
 * IPFS 서비스 초기화
 */
function initializeIPFS() {
    const provider = process.env.IPFS_PROVIDER || 'pinata';
    
    if (provider === 'pinata') {
        const apiKey = process.env.PINATA_API_KEY;
        const secretKey = process.env.PINATA_SECRET_KEY;
        
        if (apiKey && secretKey) {
            pinataConfig = { apiKey, secretKey };
            console.log('✅ Pinata IPFS initialized');
        } else {
            console.warn('⚠️ Pinata credentials not set, IPFS upload will fail');
        }
    } else if (provider === 'infura') {
        console.log('✅ Infura IPFS initialized (using HTTP API)');
    } else {
        console.warn('⚠️ Unknown IPFS provider:', provider);
    }
}

/**
 * NFT 메타데이터를 IPFS에 업로드
 */
async function uploadMetadata(metadata) {
    const provider = process.env.IPFS_PROVIDER || 'pinata';
    
    if (provider === 'pinata' && pinataConfig) {
        return await uploadToPinata(metadata);
    } else if (provider === 'infura') {
        return await uploadToInfura(metadata);
    } else {
        throw new Error('IPFS provider not configured properly');
    }
}

/**
 * Pinata에 메타데이터 업로드 (HTTP API 사용)
 */
async function uploadToPinata(metadata) {
    try {
        // OpenSea 표준 메타데이터 형식
        const nftMetadata = {
            name: metadata.name || 'Portfolio Achievement',
            description: metadata.description || 'A portfolio achievement certificate',
            image: metadata.image || 'ipfs://Qm...', // 이미지 IPFS 해시 (향후 추가)
            attributes: [
                {
                    trait_type: 'Achievement Type',
                    value: metadata.achievementType || 'unknown'
                },
                {
                    trait_type: 'Period',
                    value: metadata.period || 0
                },
                {
                    trait_type: 'Return Rate',
                    value: metadata.returnRate || 0,
                    display_type: 'number'
                },
                {
                    trait_type: 'Earned At',
                    value: metadata.earnedAt || new Date().toISOString(),
                    display_type: 'date'
                }
            ],
            external_url: metadata.externalUrl || 'https://mystockfolio.com',
            // 커스텀 필드
            achievementType: metadata.achievementType,
            period: metadata.period,
            returnRate: metadata.returnRate,
            earnedAt: metadata.earnedAt
        };
        
        // Pinata JSON 업로드 API 사용
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinJSONToIPFS',
            {
                pinataContent: nftMetadata,
                pinataMetadata: {
                    name: `Portfolio Achievement - ${metadata.achievementType || 'unknown'}`
                },
                pinataOptions: {
                    cidVersion: 0
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': pinataConfig.apiKey,
                    'pinata_secret_api_key': pinataConfig.secretKey
                }
            }
        );
        
        return response.data.IpfsHash;
    } catch (error) {
        console.error('Pinata upload error:', error.response?.data || error.message);
        throw new Error(`Failed to upload to Pinata: ${error.response?.data?.error || error.message}`);
    }
}

/**
 * Infura에 메타데이터 업로드
 */
async function uploadToInfura(metadata) {
    try {
        const projectId = process.env.INFURA_IPFS_PROJECT_ID;
        const projectSecret = process.env.INFURA_IPFS_PROJECT_SECRET;
        
        if (!projectId || !projectSecret) {
            throw new Error('Infura IPFS credentials not set');
        }
        
        const nftMetadata = {
            name: metadata.name || 'Portfolio Achievement',
            description: metadata.description || 'A portfolio achievement certificate',
            image: metadata.image || '',
            attributes: [
                {
                    trait_type: 'Achievement Type',
                    value: metadata.achievementType || 'unknown'
                },
                {
                    trait_type: 'Period',
                    value: metadata.period || 0
                },
                {
                    trait_type: 'Return Rate',
                    value: metadata.returnRate || 0
                }
            ]
        };
        
        const auth = Buffer.from(`${projectId}:${projectSecret}`).toString('base64');
        
        const response = await axios.post(
            'https://ipfs.infura.io:5001/api/v0/add',
            JSON.stringify(nftMetadata),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`
                },
                params: {
                    'pin': 'true'
                }
            }
        );
        
        // Infura 응답 형식: { Hash: 'Qm...' }
        return response.data.Hash;
    } catch (error) {
        console.error('Infura upload error:', error);
        throw new Error(`Failed to upload to Infura: ${error.message}`);
    }
}

/**
 * IPFS에서 메타데이터 조회
 */
async function getMetadata(ipfsHash) {
    try {
        // IPFS Gateway 사용
        const gateway = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
        const url = `${gateway}${ipfsHash}`;
        
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw new Error(`Failed to fetch IPFS metadata: ${error.message}`);
    }
}

// 초기화
initializeIPFS();

module.exports = {
    uploadMetadata,
    getMetadata,
    initializeIPFS
};

