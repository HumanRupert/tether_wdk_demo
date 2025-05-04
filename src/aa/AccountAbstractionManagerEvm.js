import { ethers, parseEther, parseUnits, Contract } from 'ethers';
import Safe, { EthersAdapter } from '@safe-global/protocol-kit';

import { createCBridgeInstance } from '../bridge/cBridgeClient.js';
import { BridgeAdapterCBridge } from '../bridge/BridgeAdapterCBridge.js';
import { SwapAdapter0x } from '../swap/SwapAdapter0x.js';

import { getZeroDevSafeSigner } from '@zerodev/gnosis-safe';
import { createZeroDevBundlerClient, createZeroDevPaymasterClient } from '@zerodev/sdk';

export const ERC20_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

export class AccountAbstractionManagerEvm {
  constructor(eoaWallet, config) {
    this.eoaWallet = eoaWallet;
    this.config = config;

    this.ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: eoaWallet
    });

    this.safeSdk = null;
    this.erc4337Signer = null;
    this.bridgeAdapter = null;
    this.swapAdapter = null;
    this.chainId = config.chainId;
  }

  async initSafe(safeAddress) {
    this.safeSdk = await Safe.create({
      ethAdapter: this.ethAdapter,
      safeAddress
    });
  }

  async initERC4337(account) {
    const bundler = createZeroDevBundlerClient({
      projectId: this.config.zerodevProjectId,
      chainId: this.chainId
    });

    const paymaster = createZeroDevPaymasterClient({
      projectId: this.config.zerodevProjectId,
      chainId: this.chainId
    });

    this.erc4337Signer = await getZeroDevSafeSigner({
      projectId: this.config.zerodevProjectId,
      signer: account.wallet,
      bundler,
      paymaster
    });
  }

  async initBridge(account) {
    const cBridge = createCBridgeInstance(account.wallet);
    this.bridgeAdapter = new BridgeAdapterCBridge(cBridge, account, this.chainId);
  }

  async initSwap(account) {
    this.swapAdapter = new SwapAdapter0x(account, this.chainId);
  }

  async quoteSwap(options) {
    if (!this.swapAdapter) throw new Error("Swap adapter not initialized");
    return await this.swapAdapter.quoteSwap(options);
  }

  async swap(options) {
    if (!this.swapAdapter) throw new Error("Swap adapter not initialized");
    return await this.swapAdapter.swap(options);
  }


  async transfer({ recipient, amount, tokenAddress = null }) {
    if (!this.erc4337Signer) throw new Error("ZeroDev ERC-4337 signer not initialized");

    if (tokenAddress) {
      return await this._transferERC20Via4337({ tokenAddress, recipient, amount });
    }

    const tx = await this.erc4337Signer.sendTransaction({
      to: recipient,
      value: parseEther(amount.toString()),
      data: '0x'
    });

    const receipt = await tx.wait();
    return receipt.hash;
  }

  async _transferERC20Via4337({ tokenAddress, recipient, amount }) {
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, this.eoaWallet.provider);
    const decimals = await tokenContract.decimals();
    const formattedAmount = parseUnits(amount.toString(), decimals);

    const data = tokenContract.interface.encodeFunctionData("transfer", [recipient, formattedAmount]);

    const tx = await this.erc4337Signer.sendTransaction({
      to: tokenAddress,
      value: 0n,
      data
    });

    const receipt = await tx.wait();
    return receipt.hash;
  }

  async bridge(options) {
    if (!this.bridgeAdapter) {
      throw new Error("Bridge not initialized. Call initBridge(account) first.");
    }
    return await this.bridgeAdapter.bridge(options);
  }

  async quoteBridge(options) {
    if (!this.bridgeAdapter) {
      throw new Error("Bridge not initialized. Call initBridge(account) first.");
    }
    return await this.bridgeAdapter.quoteBridge(options);
  }

  async quoteSupply({ tokenAddress, amount, recipient }) {
    const txData = await this._buildTokenTransferData(tokenAddress, recipient, amount);
    const safeTx = await this.safeSdk.createTransaction({ safeTransactionData: txData });
    const gasEstimate = await this.safeSdk.estimateGas(safeTx);
    return { txData, gasEstimate: gasEstimate.toString() };
  }

  async supply({ tokenAddress, amount, recipient }) {
    const txData = await this._buildTokenTransferData(tokenAddress, recipient, amount);
    const safeTx = await this.safeSdk.createTransaction({ safeTransactionData: txData });
    return safeTx;
  }

  async _buildTokenTransferData(tokenAddress, recipient, amount) {
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, this.eoaWallet.provider);
    const decimals = await tokenContract.decimals();
    const formattedAmount = parseUnits(amount.toString(), decimals);

    return {
      to: tokenAddress,
      data: tokenContract.interface.encodeFunctionData("transfer", [recipient, formattedAmount]),
      value: "0"
    };
  }

  async getAbstractedAddress() {
    if (!this.safeSdk) throw new Error("Safe not initialized");
    return this.safeSdk.getAddress();
  }
}
