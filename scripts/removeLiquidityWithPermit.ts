import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const ETH_DAI_PAIR = "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11";

    const TOKEN_HOLDER = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621";

    await helpers.impersonateAccount(TOKEN_HOLDER);
    const impersonatedSigner = await ethers.getSigner(TOKEN_HOLDER);

    const amountDAIDeposit = ethers.parseUnits("2", 18);

    const amountAMin = ethers.parseUnits("1", 18);


    const DAI_Contract = await ethers.getContractAt("IERC20", DAI, impersonatedSigner);
    
    const LP_DAI_ETH_Contract = await ethers.getContractAt("IERC20", ETH_DAI_PAIR, impersonatedSigner);

    const ROUTER = await ethers.getContractAt("IUniswapV2Router", ROUTER_ADDRESS, impersonatedSigner);

    await DAI_Contract.approve(ROUTER, amountDAIDeposit);
    

    const daiBal = await DAI_Contract.balanceOf(impersonatedSigner.address);
    const ETHBal = await ethers.provider.getBalance(impersonatedSigner.address)

    const ETHDAIBal = await LP_DAI_ETH_Contract.balanceOf(impersonatedSigner.address)

    const deadline = Math.floor(Date.now() / 1000) + (60 * 10);

    console.log("dai balance before liquidity", Number(daiBal));
    console.log("ETH token balance before liquidity", Number(ETHBal));
    console.log("LP DAI ETH token balance before liquidity", Number(ETHDAIBal));    
    

    await ROUTER.addLiquidityETH(
        DAI, 
        amountDAIDeposit, 
        amountAMin, 
        1, 
        TOKEN_HOLDER, 
        deadline,
        {value: ethers.parseEther("0.1")}
        )


    console.log("=========================================================");

    const daiBalAfter = await DAI_Contract.balanceOf(impersonatedSigner.address);
    const ETHBalAfter = await ethers.provider.getBalance(impersonatedSigner.address)
    const ETHDAIBalAfter = await LP_DAI_ETH_Contract.balanceOf(impersonatedSigner.address);

    console.log("dai balance after liquidity", Number(daiBalAfter));
    console.log("ETH token balance after liquidity", Number(ETHBalAfter));
    console.log("LP ETH token balance after liquidity", Number(ETHDAIBalAfter));

    await LP_DAI_ETH_Contract.approve(ROUTER, ETHDAIBalAfter);


    console.log("=========================================================");

    // const removeLiqTX = await ROUTER.removeLiquidityETH(
    //     DAI, 
    //     ETHDAIBalAfter, 
    //     0, 
    //     0, 
    //     impersonatedSigner.address, 
    //     deadline,
    //     { gasLimit: 1000000 }
    //     )
    // await removeLiqTX.wait();
    

    // const daiBalAfterRemove = await DAI_Contract.balanceOf(impersonatedSigner.address);
    // const ETHBalAfterREmove = await ethers.provider.getBalance(impersonatedSigner.address)
    // const ETHDAIBalAfterRemove = await LP_DAI_ETH_Contract.balanceOf(impersonatedSigner.address);


    // console.log("dai balance after removing liquidity", Number(daiBalAfterRemove));
    // console.log("ETH balance after removing liquidity", Number(ETHBalAfterREmove));
    // console.log("LP DAI ETH token balance after removing liquidity", Number(ETHDAIBalAfterRemove));


    // Create the domain for EIP-712 signature
    const nonce = await LP_DAI_ETH_Contract.nonces(TOKEN_HOLDER);
    const name = await LP_DAI_ETH_Contract.name();
    const chainId = await impersonatedSigner.getChainId();
    const domain = {
    name: name,
    version: "1",
    chainId: chainId,
    verifyingContract: ETH_DAI_PAIR,
    };

    // Define the Permit types (EIP-2612)
      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

     // Define the values for the permit
      const values = {
        owner: TOKEN_HOLDER,
        spender: ROUTER_ADDRESS, // Uniswap Router
        value: ETHDAIBalAfter, // Amount of LP tokens to remove
        nonce: nonce,
        deadline: deadline,
      };

    // Sign the permit message using EIP-712
      const signature = await impersonatedSigner._signTypedData(domain, types, values);
      const { v, r, s } = ethers.splitSignature(signature);

    const removeLiqTX = await ROUTER.removeLiquidityETHWithPermit(
        DAI, 
        ETHDAIBalAfter, 
        0, 
        0, 
        impersonatedSigner.address, 
        deadline,
        false,
        v,
        r,
        s,
        { gasLimit: 1000000 }  // Added gasLimit
        )
    await removeLiqTX.wait();
    

    const daiBalAfterRemove = await DAI_Contract.balanceOf(impersonatedSigner.address);
    const ETHBalAfterREmove = await ethers.provider.getBalance(impersonatedSigner.address)
    const ETHDAIBalAfterRemove = await LP_DAI_ETH_Contract.balanceOf(impersonatedSigner.address);


    console.log("dai balance after removing liquidity", Number(daiBalAfterRemove));
    console.log("ETH balance after removing liquidity", Number(ETHBalAfterREmove));
    console.log("LP DAI ETH token balance after removing liquidity", Number(ETHDAIBalAfterRemove));

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
