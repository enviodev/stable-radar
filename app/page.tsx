'use client';

import { useState } from 'react';
import Radar from './components/Radar';
import DebugPanel from './components/DebugPanel';
import { CHAINS } from './types/chains';
import { useHypersync } from './hooks/useHypersync';

export default function Home() {
  const chains = Object.values(CHAINS);
  const chainIds = chains.map((c) => c.chainId);
  const { chainData, isLoading, error } = useHypersync(chainIds);
  
  // Threshold state (in USD)
  const [threshold, setThreshold] = useState(1000);

  // Filter transactions by threshold
  const filterByThreshold = (transactions: any[]) => {
    return transactions.filter((tx) => {
      // Parse USDC value (6 decimals)
      const valueInUSDC = BigInt(tx.value) / BigInt(1_000_000);
      const valueInUSD = Number(valueInUSDC);
      return valueInUSD >= threshold;
    });
  };

  return (
    <main className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-green-400 mb-4 font-mono tracking-wider">
            STABLE RADAR
          </h1>
          <p className="text-xl text-green-300 font-mono">
            Real-time USDC Transaction Monitoring Across Multiple Chains
          </p>
          <div className="mt-4 text-green-500 font-mono text-sm flex items-center justify-center gap-4">
            <span className="animate-pulse">● LIVE</span>
            {isLoading && <span className="text-yellow-500">⟳ Initializing...</span>}
            {error && <span className="text-red-500">⚠ Error: {error}</span>}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {chains.map((chain) => {
            const data = chainData[chain.chainId];
            const allTransactions = data?.transactions || [];
            const filteredTransactions = filterByThreshold(allTransactions);
            const totalCount = data?.totalCount || 0;

            return (
              <div key={chain.chainId} className="flex justify-center">
                <Radar
                  chainName={chain.name}
                  transactionCount={totalCount}
                  color={chain.color}
                  blockTime={chain.blockTime}
                  transactions={filteredTransactions.map((tx) => ({
                    transactionHash: tx.transactionHash,
                    timestamp: tx.timestamp,
                    value: tx.value, // Pass value for size calculation
                  }))}
                />
              </div>
            );
          })}
        </div>

        {/* Threshold Control */}
        <div className="max-w-3xl mx-auto mb-12 p-6 bg-gray-900 border-2 border-green-600 rounded-lg">
          <div className="text-center mb-4">
            <h3 className="text-green-400 font-mono text-xl font-bold mb-2">
              Minimum Transfer Amount Filter
            </h3>
            <div className="text-green-300 font-mono text-3xl font-bold">
              ${threshold.toLocaleString()} USDC
            </div>
            <p className="text-green-600 text-sm mt-2">
              Only showing transfers above this amount
            </p>
          </div>
          
          <div className="relative">
            <input
              type="range"
              min="0"
              max="50000"
              step="100"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              style={{
                background: `linear-gradient(to right, #22c55e 0%, #22c55e ${(threshold / 50000) * 100}%, #374151 ${(threshold / 50000) * 100}%, #374151 100%)`
              }}
            />
            <div className="flex justify-between text-green-600 font-mono text-xs mt-2">
              <span>$0</span>
              <span>$10k</span>
              <span>$25k</span>
              <span>$50k</span>
            </div>
          </div>

          <div className="mt-4 flex gap-2 justify-center flex-wrap">
            <button
              onClick={() => setThreshold(0)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 font-mono text-sm rounded border border-green-700"
            >
              Show All
            </button>
            <button
              onClick={() => setThreshold(1000)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 font-mono text-sm rounded border border-green-700"
            >
              $1,000+
            </button>
            <button
              onClick={() => setThreshold(5000)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 font-mono text-sm rounded border border-green-700"
            >
              $5,000+
            </button>
            <button
              onClick={() => setThreshold(10000)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 font-mono text-sm rounded border border-green-700"
            >
              $10,000+
            </button>
            <button
              onClick={() => setThreshold(25000)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 font-mono text-sm rounded border border-green-700"
            >
              $25,000+
            </button>
            <button
              onClick={() => setThreshold(50000)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 font-mono text-sm rounded border border-green-700"
            >
              $50,000+
            </button>
          </div>
        </div>

        <footer className="text-center text-green-600 font-mono text-sm mt-12">
          <div className="mb-2">
            <p className="text-xs text-green-700 mb-4">
              Monitoring: Ethereum • Base • Polygon • Arbitrum • Optimism • Sonic
            </p>
          </div>
          <p>Powered by Envio Hypersync • {new Date().getFullYear()}</p>
        </footer>
      </div>

      <DebugPanel chainData={chainData} error={error} />
    </main>
  );
}
