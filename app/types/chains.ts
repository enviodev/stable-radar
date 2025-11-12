export interface ChainConfig {
  name: string;
  chainId: number;
  color: string;
  usdcAddress: string;
  hypersyncUrl: string;
  blockTime: number; // Average block time in seconds
}

export const CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    name: 'ETHEREUM',
    chainId: 1,
    color: '#00ff00',
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    hypersyncUrl: 'https://1.hypersync.xyz',
    blockTime: 12, // ~12 seconds per block
  },
  base: {
    name: 'BASE',
    chainId: 8453,
    color: '#0052ff',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    hypersyncUrl: 'https://8453.hypersync.xyz',
    blockTime: 2, // ~2 seconds per block
  },
  polygon: {
    name: 'POLYGON',
    chainId: 137,
    color: '#8247e5',
    usdcAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    hypersyncUrl: 'https://137.hypersync.xyz',
    blockTime: 2, // ~2 seconds per block
  },
  // Temporarily disabled for optimization
  // arbitrum: {
  //   name: 'ARBITRUM',
  //   chainId: 42161,
  //   color: '#28a0f0',
  //   usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  //   hypersyncUrl: 'https://42161.hypersync.xyz',
  //   blockTime: 0.25, // ~250ms per block
  // },
  // optimism: {
  //   name: 'OPTIMISM',
  //   chainId: 10,
  //   color: '#ff0420',
  //   usdcAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  //   hypersyncUrl: 'https://10.hypersync.xyz',
  //   blockTime: 2, // ~2 seconds per block
  // },
  // sonic: {
  //   name: 'SONIC',
  //   chainId: 146,
  //   color: '#00d4ff',
  //   usdcAddress: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894',
  //   hypersyncUrl: 'https://146.hypersync.xyz',
  //   blockTime: 1, // ~1 second per block
  // },
};

export interface TransactionData {
  transactionHash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string; // String to avoid BigInt serialization issues
  timestamp: number;
  chainId: number;
}

export interface HypersyncLog {
  transaction_hash: string;
  block_number: number;
  address: string;
  topic0: string;
  topic1: string;
  topic2: string;
  topic3: string | null;
  data?: string;
}

export interface HypersyncTransaction {
  block_hash: string;
  from: string;
  to: string;
  value: string;
  status: number;
}

export interface HypersyncBlock {
  timestamp: number;
}

export interface HypersyncDataItem {
  logs: HypersyncLog[];
  transactions: HypersyncTransaction[];
  blocks?: HypersyncBlock[];
}

export interface HypersyncResponse {
  data: HypersyncDataItem[];
  archive_height: number;
  next_block: number;
  total_execution_time: number;
  rollback_guard: any;
}
