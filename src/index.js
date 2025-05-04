import { WalletManagerEvm } from './wallet/WalletManagerEvm.js';
import { RPC_URL } from './config/network.js';
import dotenv from 'dotenv';
dotenv.config();

const { SEED } = process.env;

const main = async () => {
  const walletManager = new WalletManagerEvm(SEED, { rpcUrl: RPC_URL });
  const eoa = walletManager.getAccount(0);

  console.log("EOA Address:", eoa.address);

  const balance = await eoa.getBalance();
  console.log("EOA Balance (ETH):", balance);

  const signature = await eoa.signMessage("Please verify ownership");
  console.log("Signature:", signature);
};

main().catch(console.error);
