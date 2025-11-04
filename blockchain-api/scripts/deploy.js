const hre = require("hardhat");

async function main() {
    const network = hre.network.name;
    console.log(`🚀 Starting deployment to ${network}...\n`);

    // 1. FolioToken 배포
    console.log("📦 Deploying FolioToken...");
    const FolioToken = await hre.ethers.getContractFactory("FolioToken");
    const folioToken = await FolioToken.deploy();
    await folioToken.waitForDeployment();
    const folioTokenAddress = await folioToken.getAddress();
    console.log(`✅ FolioToken deployed to: ${folioTokenAddress}`);

    // 2. PortfolioAchievementNFT 배포
    console.log("\n📦 Deploying PortfolioAchievementNFT...");
    const NFT = await hre.ethers.getContractFactory("PortfolioAchievementNFT");
    const nft = await NFT.deploy();
    await nft.waitForDeployment();
    const nftAddress = await nft.getAddress();
    console.log(`✅ PortfolioAchievementNFT deployed to: ${nftAddress}`);

    // 3. 환경 변수 파일 업데이트 안내
    console.log("\n📝 Please update your .env file with the following addresses:");
    console.log(`FOLIO_TOKEN_ADDRESS=${folioTokenAddress}`);
    console.log(`NFT_CONTRACT_ADDRESS=${nftAddress}`);

    // 4. ABI 파일 저장 안내
    console.log("\n💡 Tip: Save the contract ABIs from artifacts/ folder:");
    console.log("   - artifacts/contracts/FolioToken.sol/FolioToken.json");
    console.log("   - artifacts/contracts/PortfolioAchievementNFT.sol/PortfolioAchievementNFT.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

