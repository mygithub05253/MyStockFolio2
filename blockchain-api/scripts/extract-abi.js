const fs = require('fs');
const path = require('path');

/**
 * Hardhat 컴파일 후 생성된 ABI 파일을 src/abis로 복사
 */
async function extractABIs() {
    const artifactsDir = path.join(__dirname, '../artifacts/contracts');
    const abisDir = path.join(__dirname, '../src/abis');

    // abis 디렉토리 생성
    if (!fs.existsSync(abisDir)) {
        fs.mkdirSync(abisDir, { recursive: true });
    }

    // FolioToken ABI 추출
    const folioTokenArtifact = path.join(artifactsDir, 'FolioToken.sol/FolioToken.json');
    if (fs.existsSync(folioTokenArtifact)) {
        const artifact = JSON.parse(fs.readFileSync(folioTokenArtifact, 'utf8'));
        fs.writeFileSync(
            path.join(abisDir, 'FolioToken.json'),
            JSON.stringify(artifact.abi, null, 2)
        );
        console.log('✅ FolioToken ABI extracted');
    }

    // PortfolioAchievementNFT ABI 추출
    const nftArtifact = path.join(artifactsDir, 'PortfolioAchievementNFT.sol/PortfolioAchievementNFT.json');
    if (fs.existsSync(nftArtifact)) {
        const artifact = JSON.parse(fs.readFileSync(nftArtifact, 'utf8'));
        fs.writeFileSync(
            path.join(abisDir, 'PortfolioAchievementNFT.json'),
            JSON.stringify(artifact.abi, null, 2)
        );
        console.log('✅ PortfolioAchievementNFT ABI extracted');
    }

    console.log('\n💡 ABIs saved to src/abis/');
}

extractABIs().catch(console.error);

