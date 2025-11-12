'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Radar from './components/Radar';
import DebugPanel from './components/DebugPanel';
import { CHAINS } from './types/chains';
import { useHypersync } from './hooks/useHypersync';

function HomeContent() {
  const chains = Object.values(CHAINS);
  const chainIds = chains.map((c) => c.chainId);
  const { chainData, isLoading, error } = useHypersync(chainIds);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Threshold state (in USD)
  const [threshold, setThreshold] = useState(0);
  
  // Network filter state - manage selected chain IDs
  const [selectedChainIds, setSelectedChainIds] = useState<Set<number>>(() => {
    // Initialize from URL query string or default to all
    const networksParam = searchParams.get('networks');
    if (networksParam) {
      const networkIds = networksParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      return new Set(networkIds);
    }
    return new Set(chainIds);
  });

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

  // Update URL when network selection changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedIds = Array.from(selectedChainIds).sort((a, b) => a - b);
    
    if (selectedIds.length === chainIds.length) {
      // All selected - remove param for cleaner URL
      params.delete('networks');
    } else if (selectedIds.length > 0) {
      // Some selected - add to URL
      params.set('networks', selectedIds.join(','));
    } else {
      // None selected - still show param (edge case)
      params.set('networks', '');
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    router.replace(newUrl, { scroll: false });
  }, [selectedChainIds, chainIds, router]);

  // Toggle network selection
  const toggleNetwork = (chainId: number) => {
    setSelectedChainIds((prev) => {
      const next = new Set(prev);
      if (next.has(chainId)) {
        next.delete(chainId);
      } else {
        next.add(chainId);
      }
      return next;
    });
  };

  // Select/deselect all networks
  const toggleAll = () => {
    if (selectedChainIds.size === chainIds.length) {
      // All selected - deselect all
      setSelectedChainIds(new Set());
    } else {
      // Some or none selected - select all
      setSelectedChainIds(new Set(chainIds));
    }
  };

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

            {/* Network Selection Filter */}
            <div className="mb-8 p-4 bg-gray-900 border border-green-600 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-green-400 font-mono text-sm font-bold">Network Filter</h3>
                <button
                  onClick={toggleAll}
                  className="text-green-500 hover:text-green-400 font-mono text-xs underline"
                >
                  {selectedChainIds.size === chainIds.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {chains.map((chain) => {
                  const isSelected = selectedChainIds.has(chain.chainId);
                  return (
                    <button
                      key={chain.chainId}
                      onClick={() => toggleNetwork(chain.chainId)}
                      className={`px-3 py-1.5 rounded font-mono text-sm transition-all border-2 ${
                        isSelected
                          ? 'border-current opacity-100'
                          : 'border-gray-700 opacity-40 hover:opacity-60'
                      }`}
                      style={{
                        color: chain.color,
                        backgroundColor: isSelected ? `${chain.color}15` : 'transparent',
                      }}
                    >
                      {chain.name}
                    </button>
                  );
                })}
              </div>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {chains.filter(chain => selectedChainIds.has(chain.chainId)).map((chain) => {
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
                  {threshold === 0 ? 'All Transfers' : `$${threshold.toLocaleString()} USDC`}
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
                    background: threshold === 0 
                      ? 'linear-gradient(to right, #374151 0%, #374151 100%)'
                      : `linear-gradient(to right, #22c55e 0%, #22c55e ${(threshold / 20000) * 100}%, #374151 ${(threshold / 20000) * 100}%, #374151 100%)`
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

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black p-8 flex items-center justify-center">
        <div className="text-green-500 font-mono text-2xl animate-pulse">⟳ Loading...</div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
