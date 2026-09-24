'use client';

import { useState, useEffect, useRef } from 'react';
import { CHAINS, TransactionData } from '../types/chains';

interface ChainData {
  chainId: number;
  transactions: TransactionData[];
  totalCount: number;
}

// Maximum transactions to keep in memory per chain (for visualization)
const MAX_TRANSACTIONS_PER_CHAIN = 100;

// Hashes remembered per chain for dedupe; far more than one response ever returns
const MAX_SEEN_PER_CHAIN = 10000;

// Matches the API's shared cache window, so polling faster would only return cached data
const POLL_INTERVAL = 10000;

// Fetched transfers are replayed block by block at the chain's own pace, so the
// radar keeps moving between polls instead of arriving in one burst
const MIN_TICK_MS = 500;

const chainConfig = (chainId: number) => Object.values(CHAINS).find((c) => c.chainId === chainId);

export function useHypersync(chainIds: number[]) {
  const [chainData, setChainData] = useState<Record<number, ChainData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);
  const initializedRef = useRef(false);
  const seenRef = useRef<Record<number, Set<string>>>({});
  const countRef = useRef<Record<number, number>>({});
  const queueRef = useRef<Record<number, TransactionData[]>>({});
  const failingRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initialData: Record<number, ChainData> = {};
    chainIds.forEach((chainId) => {
      initialData[chainId] = { chainId, transactions: [], totalCount: 0 };
      seenRef.current[chainId] = new Set();
      countRef.current[chainId] = 0;
      queueRef.current[chainId] = [];
    });
    setChainData(initialData);

    const updateError = () => {
      const failing = Array.from(failingRef.current).map((id) => chainConfig(id)?.name ?? `Chain ${id}`);
      setError(failing.length ? `Reconnecting to ${failing.join(', ')}` : null);
    };

    const fetchChainData = async (chainId: number) => {
      try {
        const response = await fetch(`/api/hypersync?chainId=${chainId}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.error) {
          console.error(`[Chain ${chainId}] Failed to fetch:`, response.status, data.error);
          failingRef.current.add(chainId);
          updateError();
          return;
        }

        failingRef.current.delete(chainId);
        updateError();

        // Responses overlap, so only queue transfers we have not seen yet
        let seen = seenRef.current[chainId];
        const fresh: TransactionData[] = (data.transactions || []).filter(
          (tx: TransactionData) => !seen.has(tx.transactionHash),
        );
        fresh.forEach((tx) => seen.add(tx.transactionHash));
        if (seen.size > MAX_SEEN_PER_CHAIN) {
          seen = seenRef.current[chainId] = new Set(Array.from(seen).slice(-MAX_SEEN_PER_CHAIN / 2));
        }

        // Never let the replay fall more than two polls behind the chain head
        const blockTime = chainConfig(chainId)?.blockTime ?? 2;
        const queue = [...queueRef.current[chainId], ...fresh];
        const head = queue.length ? queue[queue.length - 1].blockNumber : 0;
        const oldestAllowed = head - Math.ceil((2 * POLL_INTERVAL) / 1000 / blockTime);
        queueRef.current[chainId] = queue.filter((tx) => tx.blockNumber > oldestAllowed);

        setIsLoading(false);
      } catch (err) {
        console.error(`Error fetching chain ${chainId}:`, err);
        failingRef.current.add(chainId);
        updateError();
      }
    };

    // Release the next block(s) of queued transfers for one chain
    const releaseNextBlocks = (chainId: number, blocksPerTick: number) => {
      const queue = queueRef.current[chainId];
      if (!queue.length) return;

      const lastBlock = queue[0].blockNumber + blocksPerTick - 1;
      const cut = queue.findIndex((tx) => tx.blockNumber > lastBlock);
      const released = cut === -1 ? queue : queue.slice(0, cut);
      queueRef.current[chainId] = cut === -1 ? [] : queue.slice(cut);

      const now = Date.now();
      const stamped = released.map((tx) => ({ ...tx, timestamp: now }));
      countRef.current[chainId] += stamped.length;

      setChainData((prev) => {
        const existing = prev[chainId] || { chainId, transactions: [], totalCount: 0 };
        return {
          ...prev,
          [chainId]: {
            chainId,
            transactions: [...existing.transactions, ...stamped].slice(-MAX_TRANSACTIONS_PER_CHAIN),
            totalCount: countRef.current[chainId],
          },
        };
      });
    };

    chainIds.forEach((chainId) => {
      const blockTimeMs = (chainConfig(chainId)?.blockTime ?? 2) * 1000;
      const tickMs = Math.max(blockTimeMs, MIN_TICK_MS);
      const blocksPerTick = Math.ceil(tickMs / blockTimeMs);

      fetchChainData(chainId);
      intervalRefs.current.push(setInterval(() => fetchChainData(chainId), POLL_INTERVAL));
      intervalRefs.current.push(setInterval(() => releaseNextBlocks(chainId, blocksPerTick), tickMs));
    });

    return () => {
      intervalRefs.current.forEach((interval) => clearInterval(interval));
      intervalRefs.current = [];
      initializedRef.current = false;
    };
  }, []); // Empty dependency array - only run once

  return { chainData, isLoading, error };
}
