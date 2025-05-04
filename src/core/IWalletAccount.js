import { ethers, formatEther } from 'ethers';

export class IWalletAccount {
  constructor(privateKey, provider, path, index) {
    this.wallet = new ethers.Wallet(privateKey, provider);
    this.path = path;
    this.index = index;
    this.provider = provider;
  }

  get address() {
    return this.wallet.address;
  }

  async getBalance() {
    const bal = await this.provider.getBalance(this.wallet.address);;
    return formatEther(bal);
  }

  async signMessage(message) {
    return await this.wallet.signMessage(message);
  }

  async sendTransaction(to, amountInEth) {
    const tx = await this.wallet.sendTransaction({
      to,
      value: ethers.utils.parseEther(amountInEth)
    });
    return tx.hash;
  }
}
