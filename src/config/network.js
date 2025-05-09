import dotenv from 'dotenv';
dotenv.config();

const { INFURA_KEY } = process.env;

if (!INFURA_KEY) {
  throw new Error("Missing INFURA_KEY or STACKUP_ID in environment variables");
}

export const RPC_URL = `https://sepolia.infura.io/v3/${INFURA_KEY}`;

export const EvmAccountAbstractionConfig = {
    rpcUrl: RPC_URL,
    zerodevProjectId: 'ID',
    bundlerUrl: 'https://rpc.zerodev.app/api/v2/bundler/ID',
      entryPointAddress: "0x0576a174D229E3cFA37253523E645A78A0C91B57",
  };
  