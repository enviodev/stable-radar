import { NextRequest, NextResponse } from 'next/server';
import { decodeEventLog } from 'viem';
import { CHAINS, ChainConfig, HypersyncResponse, TransactionData } from '@/app/types/chains';

// ERC20 Transfer event ABI
const TRANSFER_EVENT_ABI = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { name: 'from', type: 'address', indexed: true },
    { name: 'to', type: 'address', indexed: true },
    { name: 'value', type: 'uint256', indexed: false },
  ],
} as const;

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Every visitor shares the same response per chain for this long, so HyperSync
// load stays flat no matter how many people have the page open.
const CACHE_SECONDS = 10;

// Each response covers the most recent transfers in this window. Clients
// dedupe by transaction hash, so overlapping windows are fine.
const LOOKBACK_SECONDS = 15;

// Safety cap on payload size; Base USDC peaks at roughly 50 transfers per second.
const MAX_TRANSFERS = 2000;

type CachedResult = { at: number; body?: ChainResult };
type ChainResult = { chain: string; chainId: number; transactions: TransactionData[]; count: number };

// Per-instance memo so a warm function also reuses results between CDN misses
const cache: Record<number, CachedResult> = {};
const inflight: Record<number, Promise<ChainResult> | undefined> = {};
// Latest known chain tip, refreshed from every query response
const tips: Record<number, number> = {};

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = process.env.HYPERSYNC_API_KEY;
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  return headers;
}

async function getTip(chain: ChainConfig): Promise<number> {
  if (tips[chain.chainId]) return tips[chain.chainId];
  const res = await fetch(`${chain.hypersyncUrl}/height`, { headers: authHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error(`height ${res.status}`);
  const { height } = await res.json();
  tips[chain.chainId] = height;
  return height;
}

async function fetchLatestTransfers(chain: ChainConfig): Promise<ChainResult> {
  const tip = await getTip(chain);
  const lookbackBlocks = Math.ceil((LOOKBACK_SECONDS + CACHE_SECONDS) / chain.blockTime);
  // The cached tip lags by up to one cache window, so start before it and read to the head
  const fromBlock = Math.max(0, tip - lookbackBlocks);

  console.log(`[${chain.name}] Querying from block ${fromBlock}`);
  const res = await fetch(`${chain.hypersyncUrl}/query`, {
    method: 'POST',
    headers: authHeaders(),
    cache: 'no-store',
    body: JSON.stringify({
      from_block: fromBlock,
      logs: [{ address: [chain.usdcAddress.toLowerCase()], topics: [[TRANSFER_TOPIC]] }],
      field_selection: {
        log: ['topic0', 'topic1', 'topic2', 'topic3', 'transaction_hash', 'block_number', 'data'],
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[${chain.name}] Hypersync query failed:`, res.status, errorText);
    throw new Error(`Hypersync query failed: ${res.status}`);
  }

  const data: HypersyncResponse = await res.json();
  if (data.archive_height) tips[chain.chainId] = data.archive_height;

  const seen = new Set<string>();
  const transactions: TransactionData[] = [];
  const now = Date.now();

  for (const item of data.data ?? []) {
    for (const log of item.logs) {
      if (seen.has(log.transaction_hash)) continue;
      try {
        const decoded = decodeEventLog({
          abi: [TRANSFER_EVENT_ABI],
          data: (log.data || '0x') as `0x${string}`,
          topics: [log.topic0, log.topic1, log.topic2, log.topic3].filter(Boolean) as [`0x${string}`, ...`0x${string}`[]],
        });
        const args = decoded.args as { from: string; to: string; value: bigint };
        seen.add(log.transaction_hash);
        transactions.push({
          transactionHash: log.transaction_hash,
          blockNumber: log.block_number,
          from: args.from,
          to: args.to,
          value: args.value.toString(),
          timestamp: now,
          chainId: chain.chainId,
        });
      } catch (error) {
        console.error('Error decoding log:', error);
      }
    }
  }

  const latest = transactions.slice(-MAX_TRANSFERS);
  return { chain: chain.name, chainId: chain.chainId, transactions: latest, count: latest.length };
}

export async function GET(request: NextRequest) {
  const chainId = parseInt(request.nextUrl.searchParams.get('chainId') ?? '');
  const chain = Object.values(CHAINS).find((c) => c.chainId === chainId);

  if (!chain) {
    return NextResponse.json({ error: 'Invalid chain ID' }, { status: 400 });
  }

  try {
    const hit = cache[chain.chainId];
    let body: ChainResult;
    if (hit && Date.now() - hit.at < CACHE_SECONDS * 1000) {
      // A recent failure is cached too, so errors never turn into a retry storm
      if (!hit.body) throw new Error('cooling down after upstream error');
      body = hit.body;
    } else {
      // Collapse concurrent requests for the same chain into one upstream call
      inflight[chain.chainId] ??= fetchLatestTransfers(chain)
        .then((result) => {
          cache[chain.chainId] = { at: Date.now(), body: result };
          return result;
        })
        .catch((error) => {
          cache[chain.chainId] = { at: Date.now() };
          throw error;
        })
        .finally(() => {
          inflight[chain.chainId] = undefined;
        });
      body = await inflight[chain.chainId]!;
    }

    return NextResponse.json(body, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=30`,
      },
    });
  } catch (error) {
    console.error(`[${chain.name}] Hypersync error:`, error);
    return NextResponse.json(
      { error: 'Temporarily unavailable', chain: chain.name, chainId: chain.chainId },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
