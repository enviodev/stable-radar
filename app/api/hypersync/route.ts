import { NextRequest, NextResponse } from 'next/server';
import { decodeEventLog } from 'viem';
import { CHAINS, HypersyncResponse, TransactionData } from '@/app/types/chains';

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

// Store last seen block for each chain
const lastSeenBlocks: Record<number, number> = {};

// Store seen transaction hashes for deduplication (per chain)
const seenTransactions: Record<number, Set<string>> = {};

// Initialize seen transactions sets
Object.values(CHAINS).forEach((chain) => {
  seenTransactions[chain.chainId] = new Set();
  lastSeenBlocks[chain.chainId] = 0;
});

// Clean up old transaction hashes periodically (keep last 10000 per chain)
function cleanupSeenTransactions(chainId: number) {
  const seen = seenTransactions[chainId];
  if (seen.size > 10000) {
    const arr = Array.from(seen);
    seenTransactions[chainId] = new Set(arr.slice(-5000));
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chainId = searchParams.get('chainId');
  const debug = searchParams.get('debug') === 'true';

  if (!chainId) {
    return NextResponse.json({ error: 'Chain ID required' }, { status: 400 });
  }

  const chain = Object.values(CHAINS).find((c) => c.chainId === parseInt(chainId));

  if (!chain) {
    return NextResponse.json({ error: 'Invalid chain ID' }, { status: 400 });
  }

  const debugInfo: any = {
    chain: chain.name,
    chainId: chain.chainId,
    usdcAddress: chain.usdcAddress,
    hypersyncUrl: chain.hypersyncUrl,
  };

  try {
    // Get the last block we queried, or query only the latest blocks on first run
    let fromBlock = lastSeenBlocks[chain.chainId];
    
    // For the first query, get the archive height first
    if (!fromBlock) {
      // Make a quick query to get the current archive height
      const heightQuery = {
        from_block: 0,
        to_block: 1,
        logs: [],
        field_selection: { block: ['number'] },
      };
      
      // Build headers with API key for height query
      const heightHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const apiKey = process.env.HYPERSYNC_API_KEY;
      if (apiKey) {
        heightHeaders['Authorization'] = `Bearer ${apiKey}`;
      }
      
      const heightResponse = await fetch(`${chain.hypersyncUrl}/query`, {
        method: 'POST',
        headers: heightHeaders,
        body: JSON.stringify(heightQuery),
      });
      
      if (heightResponse.ok) {
        const heightData: HypersyncResponse = await heightResponse.json();
        if (heightData.archive_height) {
          // Start from 10000 blocks ago to get recent activity
          fromBlock = Math.max(0, heightData.archive_height - 10000);
          console.log(`[${chain.name}] Starting from block ${fromBlock} (archive height: ${heightData.archive_height})`);
        }
      }
      
      // Fallback: if we still don't have a block, use 0
      if (!fromBlock) {
        fromBlock = 0;
      }
    }

    const queryPayload = {
      from_block: fromBlock,
      to_block: fromBlock + 10000, // Limit range
      logs: [
        {
          address: [chain.usdcAddress.toLowerCase()],
          topics: [['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']],
        },
      ],
      field_selection: {
        block: ['timestamp'],
        transaction: ['block_hash', 'from', 'to', 'value', 'status', 'chain_id'],
        log: ['address', 'topic0', 'topic1', 'topic2', 'topic3', 'transaction_hash', 'block_number', 'data'],
      },
    };

    debugInfo.fromBlock = fromBlock;
    debugInfo.queryPayload = queryPayload;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key - REQUIRED from November 3, 2025
    const apiKey = process.env.HYPERSYNC_API_KEY;
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      debugInfo.hasApiKey = true;
    } else {
      debugInfo.hasApiKey = false;
      console.warn(`[${chain.name}] WARNING: No API key found. HyperSync requires API tokens from November 3, 2025.`);
    }

    console.log(`[${chain.name}] Querying from block ${fromBlock}...`);
    
    const response = await fetch(`${chain.hypersyncUrl}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify(queryPayload),
    });

    debugInfo.responseStatus = response.status;
    debugInfo.responseOk = response.ok;

    if (!response.ok) {
      const errorText = await response.text();
      debugInfo.errorResponse = errorText;
      console.error(`[${chain.name}] Hypersync query failed:`, response.status, errorText);
      throw new Error(`Hypersync query failed: ${response.status} - ${errorText}`);
    }

    const data: HypersyncResponse = await response.json();

    debugInfo.archiveHeight = data.archive_height;
    debugInfo.nextBlock = data.next_block;
    debugInfo.dataItems = data.data?.length || 0;
    debugInfo.totalLogs = data.data?.reduce((acc, item) => acc + item.logs.length, 0) || 0;

    console.log(`[${chain.name}] Response: ${debugInfo.dataItems} items, ${debugInfo.totalLogs} logs, next_block: ${data.next_block}`);

    // Update last seen block
    if (data.next_block) {
      lastSeenBlocks[chain.chainId] = data.next_block;
    } else if (data.archive_height && !lastSeenBlocks[chain.chainId]) {
      // On first query, set to current archive height
      lastSeenBlocks[chain.chainId] = data.archive_height;
    }

    // Process and deduplicate transactions
    const transactions: TransactionData[] = [];
    const seen = seenTransactions[chain.chainId];

    for (const item of data.data) {
      for (let i = 0; i < item.logs.length; i++) {
        const log = item.logs[i];
        
        // Skip if we've already seen this transaction
        if (seen.has(log.transaction_hash)) {
          continue;
        }

        try {
          // Decode the transfer event to get the value
          // The topics are: topic0 (event signature), topic1 (from), topic2 (to)
          // The value is in the data field (non-indexed parameter)
          const decoded = decodeEventLog({
            abi: [TRANSFER_EVENT_ABI],
            data: (log as any).data || '0x',
            topics: [log.topic0, log.topic1, log.topic2, log.topic3].filter(Boolean) as any,
          });

          const transferData = decoded.args as { from: string; to: string; value: bigint };

          // Get block timestamp - use current time as fallback since blocks might not always be included
          const timestamp = (item as any).blocks?.[0]?.timestamp || Date.now();

          transactions.push({
            transactionHash: log.transaction_hash,
            blockNumber: log.block_number,
            from: transferData.from,
            to: transferData.to,
            value: transferData.value.toString(), // Convert BigInt to string for JSON serialization
            timestamp: typeof timestamp === 'number' ? timestamp * 1000 : Date.now(), // Convert to milliseconds
            chainId: chain.chainId,
          });

          // Mark as seen
          seen.add(log.transaction_hash);
        } catch (error) {
          console.error('Error decoding log:', error);
          // Continue processing other logs
        }
      }
    }

    // Cleanup old transactions periodically
    if (Math.random() < 0.1) {
      // 10% chance
      cleanupSeenTransactions(chain.chainId);
    }

    console.log(`[${chain.name}] Processed ${transactions.length} new transactions, total seen: ${seen.size}`);

    const result = {
      chain: chain.name,
      chainId: chain.chainId,
      transactions,
      count: transactions.length,
      totalTransactions: seen.size,
      ...(debug ? { debug: debugInfo } : {}),
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`[${chain?.name || 'Unknown'}] Hypersync error:`, error);
    debugInfo.error = error.message;
    debugInfo.errorStack = error.stack;
    return NextResponse.json({ 
      error: error.message,
      chain: chain?.name,
      chainId: chain?.chainId,
      debug: debugInfo 
    }, { status: 500 });
  }
}

