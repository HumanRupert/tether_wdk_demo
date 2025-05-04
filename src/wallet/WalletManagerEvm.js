import { JsonRpcProvider, HDNodeWallet } from 'ethers';
import * as bip39 from 'bip39';
import { IWalletAccount } from '../core/IWalletAccount.js';

export class WalletManagerEvm {
  constructor(seedPhrase, config) {
    if (!WalletManagerEvm.isValidSeedPhrase(seedPhrase)) {
      throw new Error('Invalid seed phrase.');
    }

    this.seedPhrase = seedPhrase;
    this.rpcUrl = config.rpcUrl;
    this.provider = new JsonRpcProvider(this.rpcUrl);

    const seed = bip39.mnemonicToSeedSync(seedPhrase);
    this.root = HDNodeWallet.fromSeed(seed);
  }

  getAccount(index = 0) {
    const path = `m/44'/60'/0'/0/${index}`;
    const child = this.root.derivePath(path);
    return new IWalletAccount(child.privateKey, this.provider, path, index);
  }

  static getRandomSeedPhrase() {
    return bip39.generateMnemonic();
  }

  static isValidSeedPhrase(mnemonic) {
    return bip39.validateMnemonic(mnemonic);
  }
}
