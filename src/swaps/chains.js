export const OxChainIds = {
    sepolia: 11155111,
    ethereum: 1,
  };
  
export function getOxApiBase(chainId) {
    if (chainId === 11155111) return 'https://sepolia.api.0x.org/swap/v1';
    return 'https://api.0x.org/swap/v1';
}
