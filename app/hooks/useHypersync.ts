'use client';

import { useState, useEffect, useRef } from 'react';
import { TransactionData } from '../types/chains';

interface ChainData {
  chainId: number;
  transactions: TransactionData[];
  totalCount: number;
}

// Maximum transactions to keep in memory per chain (for visualization)
const MAX_TRANSACTIONS_PER_CHAIN = 100;

// Height polling interval (500ms)
const HEIGHT_POLL_INTERVAL = 500;

export function useHypersync(chainIds: number[]) {
  const [chainData, setChainData] = useState<Record<number, ChainData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);
  const initializedRef = useRef(false);
  const lastHeightRef = useRef<Record<number, number>>({});

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Initialize chain data and last heights
    const initialData: Record<number, ChainData> = {};
    chainIds.forEach((chainId) => {
      initialData[chainId] = {
        chainId,
        transactions: [],
        totalCount: 0,
      };
      lastHeightRef.current[chainId] = 0;
    });
    setChainData(initialData);

    // Function to check block height for a chain
    const checkHeight = async (chainId: number) => {
      try {
        const response = await fetch(`/api/hypersync/height?chainId=${chainId}`);
        
        if (!response.ok) {
          console.error(`[Chain ${chainId}] Height check failed:`, response.status);
          return null;
        }

        const data = await response.json();
        return data.height;
      } catch (err: any) {
        console.error(`[Chain ${chainId}] Height error:`, err);
        return null;
      }
    };

    // Function to fetch transaction data for a specific chain
    const fetchChainData = async (chainId: number) => {
      try {
        const response = await fetch(`/api/hypersync?chainId=${chainId}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Chain ${chainId}] Failed to fetch:`, response.status, errorText);
          setError(`Chain ${chainId}: ${response.status} ${errorText}`);
          return;
        }

        const data = await response.json();
        
        if (data.error) {
          console.error(`[Chain ${chainId}] API Error:`, data.error, data.debug);
          setError(`Chain ${chainId}: ${data.error}`);
          return;
        }

        // Clear error on success
        setError(null);

        setChainData((prev) => {
          const existing = prev[chainId] || { chainId, transactions: [], totalCount: 0 };
          
          // Only add new transactions
          const newTransactions = data.transactions || [];
          
          // Combine and limit to last N transactions to prevent memory buildup
          const allTransactions = [...existing.transactions, ...newTransactions];
          const limitedTransactions = allTransactions.slice(-MAX_TRANSACTIONS_PER_CHAIN);

          return {
            ...prev,
            [chainId]: {
              chainId,
              transactions: limitedTransactions,
              totalCount: data.totalTransactions || 0,
            },
          };
        });

        // Set loading to false after first successful fetch
        setIsLoading(false);
      } catch (err: any) {
        console.error(`Error fetching chain ${chainId}:`, err);
        setError(err.message);
      }
    };

    // Height-based polling function
    const pollChainHeight = async (chainId: number) => {
      const currentHeight = await checkHeight(chainId);
      
      if (currentHeight === null) return;

      const lastHeight = lastHeightRef.current[chainId];

      // First time or new block detected
      if (lastHeight === 0 || currentHeight > lastHeight) {
        console.log(`[Chain ${chainId}] New block detected: ${lastHeight} -> ${currentHeight}`);
        lastHeightRef.current[chainId] = currentHeight;
        
        // Fetch transaction data only when there's a new block
        await fetchChainData(chainId);
      }
    };

    // Initial fetch for all chains
    chainIds.forEach((chainId) => {
      pollChainHeight(chainId);
    });

    // Set up height polling for each chain (500ms interval)
    chainIds.forEach((chainId) => {
      const interval = setInterval(() => {
        pollChainHeight(chainId);
      }, HEIGHT_POLL_INTERVAL);
      intervalRefs.current.push(interval);
    });

    // Cleanup
    return () => {
      intervalRefs.current.forEach((interval) => clearInterval(interval));
      intervalRefs.current = [];
      initializedRef.current = false;
    };
  }, []); // Empty dependency array - only run once

  return { chainData, isLoading, error };
}

