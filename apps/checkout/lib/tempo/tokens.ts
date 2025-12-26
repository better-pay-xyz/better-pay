export const ALPHA_USD = {
  address: '0x20c0000000000000000000000000000000000001' as const,
  symbol: 'AlphaUSD',
  decimals: 6,
}

export const BETA_USD = {
  address: '0x20c0000000000000000000000000000000000002' as const,
  symbol: 'BetaUSD',
  decimals: 6,
}

export const THETA_USD = {
  address: '0x20c0000000000000000000000000000000000003' as const,
  symbol: 'ThetaUSD',
  decimals: 6,
}

// Token type for mapping
export type Token = {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
}

// Map currency codes to token addresses
export const CURRENCY_TO_TOKEN: Record<string, Token> = {
  'USDC': ALPHA_USD,
  'AlphaUSD': ALPHA_USD,
  'USDT': BETA_USD,
  'BetaUSD': BETA_USD,
  'ThetaUSD': THETA_USD,
}

// Standard ERC20 ABI for transfers
export const erc20Abi = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const
