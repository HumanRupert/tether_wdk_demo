import { ethers } from 'ethers';
import ERC20_ABI from '../abi/erc20.js';
import { ChainIds } from './chains.js';

export class BridgeAdapterCBridge {
  constructor(cbridgeInstance, walletAccount, chainId) {
    this.cbridge = cbridgeInstance;
    this.wallet = walletAccount;
    this.chainId = chainId;
  }

  _getChainIdFromName(name) {
    return ChainIds[name.toLowerCase()];
  }

  async quoteBridge({ recipient, token, amount, targetChain }) {
    const dstChainId = this._getChainIdFromName(targetChain);
    const amountInWei = ethers.BigNumber.from(amount);

    const configs = await this.cbridge.getTransferConfigs({
      fromChainId: this.chainId,
      toChainId: dstChainId,
      tokenSymbol: 'USDT'
    });

    if (!configs.length) {
      throw new Error("No transfer configs available for this route.");
    }

    const config = configs[0];

    return {
      gasCost: config.baseFee,
      bridgeCost: 0,
      amount: amountInWei.toString()
    };
  }

  async bridge({ recipient, token, amount, targetChain }) {
    const dstChainId = this._getChainIdFromName(targetChain);
    const amountInWei = ethers.BigNumber.from(amount);

    const tokenContract = new ethers.Contract(token, ERC20_ABI, this.wallet.wallet);
    const allowance = await tokenContract.allowance(this.wallet.address, this.cbridge.cBridgeContractAddress);
    if (allowance.lt(amountInWei)) {
      const approvalTx = await tokenContract.approve(this.cbridge.cBridgeContractAddress, amountInWei);
      await approvalTx.wait();
    }

    const tx = await this.cbridge.send({
      receiver: recipient,
      tokenSymbol: 'USDT',
      amount: amountInWei.toString(),
      dstChainId,
      srcChainId: this.chainId,
      slippageTolerance: 3000
    });

    const receipt = await tx.wait();

    return {
      hash: receipt.transactionHash,
      gasCost: receipt.gasUsed?.toNumber() || 0,
      bridgeCost: 0
    };
  }
}
