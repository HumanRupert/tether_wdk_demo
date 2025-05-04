import { Client } from '@account-abstraction/sdk';
import { JsonRpcProvider } from 'ethers';

export class Erc4337ClientEvm {
  constructor(account, config) {
    this.account = account;
    this.config = config;
    this.client = null;
  }

  async init() {
    const provider = new JsonRpcProvider(this.config.rpcUrl);

    this.client = await Client.init(
      this.config.entryPointAddress,
      this.account.wallet,
      provider,
      {
        bundlerUrl: this.config.bundlerUrl
      }
    );
  }

  async transfer({ recipient, amount }) {
    const value = BigInt(amount);
    const userOp = await this.client.buildUserOp({
      target: recipient,
      data: '0x',
      value
    });

    const userOpHash = await this.client.sendUserOp(userOp);
    return userOpHash;
  }

  async quoteTransfer({ recipient, amount }) {
    const value = BigInt(amount);
    const userOp = await this.client.buildUserOp({
      target: recipient,
      data: '0x',
      value
    });

    return {
      gasLimit: userOp.callGasLimit.toString(),
      preVerificationGas: userOp.preVerificationGas.toString()
    };
  }
}
