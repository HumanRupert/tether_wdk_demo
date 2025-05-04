import { CBridge } from '@celer-network/cbridge-sdk';

export function createCBridgeInstance(signer) {
  return new CBridge({
    signer,
    network: 'testnet'
  });
}
