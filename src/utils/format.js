import { ethers } from 'ethers';

export function formatEthBalance(balanceInWei, precision = 4) {
  const eth = ethers.utils.formatEther(balanceInWei);
  return parseFloat(eth).toFixed(precision);
}

export function shortenAddress(address, chars = 4) {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTokenAmount(rawValue, decimals = 18, precision = 4) {
  const factor = 10 ** decimals;
  return (rawValue / factor).toFixed(precision);
}

export function formatTimestamp(ts) {
  const date = new Date(ts * 1000);
  return date.toLocaleString();
}
