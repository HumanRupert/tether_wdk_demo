import axios from 'axios';
import { ZeroAddress } from 'ethers';
import { Contract } from 'ethers';
import { getOxApiBase } from './chains.js';

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)'
];

export class SwapAdapter0x {
  constructor(walletAccount, chainId) {
    this.wallet = walletAccount;
    this.chainId = chainId;
  }

  async quoteSwap({ tokenIn, tokenOut, tokenInAmount }) {
    const url = `${getOxApiBase(this.chainId)}/quote?buyToken=${tokenOut}&sellToken=${tokenIn}&sellAmount=${tokenInAmount}`;

    const response = await axios.get(url);
    const data = response.data;

    return {
      tokenInAmount: data.sellAmount,
      tokenOutAmount: data.buyAmount,
      gasCost: data.estimatedGas
    };
  }

  async swap({ tokenIn, tokenOut, tokenInAmount, slippage = 1 }) {
    const userAddress = this.wallet.address;

    const url = `${getOxApiBase(this.chainId)}/swap?buyToken=${tokenOut}&sellToken=${tokenIn}&sellAmount=${tokenInAmount}&takerAddress=${userAddress}&slippagePercentage=${slippage / 100}`;

    const { data: txData } = await axios.get(url);

    // Only approve if token not native ETH
    if (txData.allowanceTarget && tokenIn !== ZeroAddress) {
      const token = new Contract(tokenIn, ERC20_ABI, this.wallet.wallet);
      const currentAllowance = await token.allowance(userAddress, txData.allowanceTarget);
      if (BigInt(currentAllowance) < BigInt(tokenInAmount)) {
        const approveTx = await token.approve(txData.allowanceTarget, tokenInAmount);
        await approveTx.wait();
      }
    }

    const tx = {
      to: txData.to,
      data: txData.data,
      value: BigInt(txData.value || 0),
      gasLimit: BigInt(txData.estimatedGas || 800000)
    };

    const txResponse = await this.wallet.wallet.sendTransaction(tx);
    const receipt = await txResponse.wait();

    return {
      hash: receipt.hash,
      gasCost: Number(receipt.gasUsed),
      tokenInAmount: txData.sellAmount,
      tokenOutAmount: txData.buyAmount
    };
  }
}
