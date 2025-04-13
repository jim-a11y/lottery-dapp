async function main() {
    const Lottery = await ethers.getContractFactory("Lottery"); // 替換為你的合約名稱
    const lottery = await Lottery.deploy(ethers.utils.parseEther("0.01")); // 初始化參數
  
    await lottery.deployed();
  
    console.log("Lottery deployed to:", lottery.address);
  }
  
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });