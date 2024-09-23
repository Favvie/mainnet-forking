import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    const TOKEN_HOLDER = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621";

    await helpers.impersonateAccount(TOKEN_HOLDER);
    const impersonatedSigner = await ethers.getSigner(TOKEN_HOLDER);

    const amountOut = ethers.parseUnits("20", 18);
    const amountInMax = ethers.parseUnits("1000", 6);

    const USDC_Contract = await ethers.getContractAt("IERC20", USDC, impersonatedSigner);
    const WETH_Contract = await ethers.getContractAt("IERC20", WETH, impersonatedSigner);
    const DAI_Contract = await ethers.getContractAt("IERC20", DAI);
    
    const ROUTER = await ethers.getContractAt("IUniswapV2Router", ROUTER_ADDRESS, impersonatedSigner);

    await USDC_Contract.approve(ROUTER, amountOut);

    const wethBal = await ethers.provider.getBalance(impersonatedSigner.address);
    const daiBal = await DAI_Contract.balanceOf(impersonatedSigner.address);
    const deadline = Math.floor(Date.now() / 1000) + (60 * 10);

    console.log("weth balance before swap", Number(wethBal));
    console.log("dai balance before swap", Number(daiBal));

    
    const amountIn = ethers.parseEther("1"); // 1 ETH
    const amountOutMin = 0; // We're not setting a minimum, but in production you should!

    await ROUTER.swapExactETHForTokens(
        amountOutMin,
        [WETH, DAI],
        impersonatedSigner.address,
        deadline,
        { value: ethers.parseEther("1") }
    );

    const wethBalAfter = await ethers.provider.getBalance(impersonatedSigner.address);
    const daiBalAfter = await DAI_Contract.balanceOf(impersonatedSigner.address);

    console.log("=========================================================");

    console.log("weth balance after swap", Number(wethBalAfter));
    console.log("dai balance after swap", Number(daiBalAfter));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
