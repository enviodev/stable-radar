'use client';

import { useState, useEffect } from 'react';
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

  // Animated page title (radar sweep effect)
  useEffect(() => {
    const frames = [
      '📡 STABLE RADAR',
      '📡● STABLE RADAR',
      '📡◐ STABLE RADAR', 
      '📡◓ STABLE RADAR',
      '📡◑ STABLE RADAR',
      '📡◒ STABLE RADAR',
    ];
    let currentFrame = 0;

    const interval = setInterval(() => {
      document.title = frames[currentFrame];
      currentFrame = (currentFrame + 1) % frames.length;
    }, 500); // 500ms per frame

    return () => {
      clearInterval(interval);
      document.title = '📡 STABLE RADAR';
    };
  }, []);

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
            {/* LIVE Status - Top Right */}
            <div className="fixed top-4 right-4 z-50 text-green-500 font-mono text-sm flex items-center gap-3 bg-black px-4 py-2 rounded-lg border border-green-600">
              <span className="animate-pulse">● LIVE</span>
              {isLoading && <span className="text-yellow-500">⟳ Initializing...</span>}
              {error && <span className="text-red-500">⚠ Error: {error}</span>}
            </div>

            <header className="text-center mb-12">
              <h1 className="text-6xl font-black text-green-400 mb-4 tracking-[0.3em] font-[family-name:var(--font-orbitron)]">
                STABLE RADAR
              </h1>
              <p className="text-xl text-green-300 font-mono">
                Real-time USDC Transaction Monitoring Across Multiple Chains
              </p>
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
                      explorerUrl={chain.explorerUrl}
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
            <div className="max-w-2xl mx-auto mb-12 p-4 bg-gray-900 border border-green-600 rounded-lg">
              <div className="text-center mb-3">
                <h3 className="text-green-400 font-mono text-sm font-bold mb-1">
                  Minimum Transfer Amount
                </h3>
                <div className="text-green-300 font-mono text-xl font-bold">
                  ${threshold.toLocaleString()} USDC
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="20000"
                  step="100"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                  style={{
                    background: `linear-gradient(to right, #22c55e 0%, #22c55e ${(threshold / 20000) * 100}%, #374151 ${(threshold / 20000) * 100}%, #374151 100%)`
                  }}
                />
                <div className="flex justify-between text-green-600 font-mono text-xs mt-1">
                  <span>$0</span>
                  <span>$5k</span>
                  <span>$10k</span>
                  <span>$15k</span>
                  <span>$20k</span>
                </div>
              </div>
            </div>

            <footer className="text-center text-green-600 font-mono text-sm mt-12">
              <div className="mb-2">
                <p className="text-xs text-green-700 mb-4">
                  Monitoring: Ethereum • Base • Polygon • Arbitrum • Optimism • Sonic • HyperEVM • Worldchain • XDC
                </p>
              </div>
              <p>
                Powered by{' '}
                <a
                  href="https://envio.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500 hover:text-green-400 underline"
                >
                  ENVIO
                </a>
                {' '}Hypersync
              </p>
            </footer>
      </div>

      <DebugPanel chainData={chainData} error={error} />
    </main>
  );
}
