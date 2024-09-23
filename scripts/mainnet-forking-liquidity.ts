import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const USDC_DAI_PAIR = "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5";

    const TOKEN_HOLDER = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621";

    await helpers.impersonateAccount(TOKEN_HOLDER);
    const impersonatedSigner = await ethers.getSigner(TOKEN_HOLDER);

    const amountUSDCDeposit = ethers.parseUnits("2", 6);
    const amountDAIDeposit = ethers.parseUnits("2", 18);

    const amountAMin = ethers.parseUnits("1", 6);
    const amountBMin = ethers.parseUnits("1", 18);


    const USDC_Contract = await ethers.getContractAt("IERC20", USDC, impersonatedSigner);
    const DAI_Contract = await ethers.getContractAt("IERC20", DAI, impersonatedSigner);
    const LP_Contract = await ethers.getContractAt("IERC20", USDC_DAI_PAIR, impersonatedSigner );
    
    
    const ROUTER = await ethers.getContractAt("IUniswapV2Router", ROUTER_ADDRESS, impersonatedSigner);

    await USDC_Contract.approve(ROUTER, amountUSDCDeposit);
    await DAI_Contract.approve(ROUTER, amountDAIDeposit);
    

    const usdcBal = await USDC_Contract.balanceOf(impersonatedSigner.address);
    const daiBal = await DAI_Contract.balanceOf(impersonatedSigner.address);
    const LPBal = await LP_Contract.balanceOf(impersonatedSigner.address)

    const deadline = Math.floor(Date.now() / 1000) + (60 * 10);

    console.log("usdc balance before liquidity", Number(usdcBal));
    console.log("dai balance before liquidity", Number(daiBal));
    console.log("LP token balance before liquidity", Number(LPBal));

    const usdcAllowance = await USDC_Contract.allowance(impersonatedSigner.address, ROUTER_ADDRESS);
    console.log("USDC allowance:", ethers.formatUnits(usdcAllowance, 6)); // Format using 6 decimals

    const daiAllowance = await DAI_Contract.allowance(impersonatedSigner.address, ROUTER_ADDRESS);
    console.log("DAI allowance:", ethers.formatUnits(daiAllowance, 6)); // Format using 6 decimals

    await ROUTER.addLiquidity(USDC, DAI, amountUSDCDeposit, amountDAIDeposit, amountAMin, amountBMin, TOKEN_HOLDER, deadline )

    console.log("=========================================================");

    const usdcBalAfter = await USDC_Contract.balanceOf(impersonatedSigner.address);
    const daiBalAfter = await DAI_Contract.balanceOf(impersonatedSigner.address);
    const LPBalAfter = await LP_Contract.balanceOf(impersonatedSigner.address);

    await LP_Contract.approve(ROUTER_ADDRESS, LPBalAfter);

    console.log("usdc balance after liquidity", Number(usdcBalAfter));
    console.log("dai balance after liquidity", Number(daiBalAfter));
    console.log("LP token balance after liquidity", Number(LPBalAfter));

    // const LPWithdraw = LPBalAfter - BigInt(1);
    const LPAllowance = await LP_Contract.allowance(impersonatedSigner.address, ROUTER_ADDRESS);
    console.log("LP allowance:", ethers.formatUnits(LPAllowance, 6)); // Format using 6 decimals


    const removeLiqTX = await ROUTER.removeLiquidity(USDC, DAI, LPBalAfter, 0, 0, impersonatedSigner.address, deadline )
    await removeLiqTX.wait();
    console.log("=========================================================");

    const usdcBalAfterRemove = await USDC_Contract.balanceOf(impersonatedSigner.address);
    const daiBalAfterRemove = await DAI_Contract.balanceOf(impersonatedSigner.address);
    const LPBalAfterRemove = await LP_Contract.balanceOf(impersonatedSigner.address);

    console.log("usdc balance after removing liquidity", Number(usdcBalAfterRemove));
    console.log("dai balance after removing liquidity", Number(daiBalAfterRemove));
    console.log("LP token balance after removing liquidity", Number(LPBalAfterRemove));

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
