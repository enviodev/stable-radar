# Implementation Details

## 🎯 Project Overview

Stable Radar is a real-time visualization dashboard for USDC stablecoin transfers across 6 blockchain networks, powered by Envio Hypersync.

## 📁 Project Structure

```
stable-radar/
├── app/
│   ├── api/
│   │   └── hypersync/
│   │       └── route.ts          # Backend API for Hypersync queries
│   ├── components/
│   │   └── Radar.tsx              # Animated radar visualization component
│   ├── hooks/
│   │   └── useHypersync.ts        # React hook for polling chain data
│   ├── types/
│   │   └── chains.ts              # TypeScript types and chain configs
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main dashboard page
├── public/                         # Static assets
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
└── README.md                       # Documentation
```

## 🔧 Implementation Details

### 1. Chain Configuration (`app/types/chains.ts`)

Defines all supported chains with:
- Chain name and ID
- USDC contract address
- Hypersync endpoint URL
- Display color

### 2. Backend API (`app/api/hypersync/route.ts`)

**Key Features:**
- Queries Hypersync endpoints for USDC Transfer events
- Decodes event logs using Viem
- Implements deduplication logic (tracks seen transaction hashes)
- Maintains per-chain block tracking for incremental queries
- Supports optional API key authentication
- Auto-cleanup of old transaction hashes (keeps last 5000)

**Query Strategy:**
- First query: Starts from latest blocks (uses archive_height)
- Subsequent queries: Uses `next_block` from previous response
- Limits range to 10,000 blocks per query for performance

**Deduplication:**
- Maintains a Set of seen transaction hashes per chain
- Checks each transaction hash before processing
- Periodically cleans up old hashes (10% chance per request)

### 3. Frontend Hook (`app/hooks/useHypersync.ts`)

**Polling Logic:**
- Polls each chain's API endpoint every 500ms
- Accumulates transactions across polls
- Maintains total count per chain
- Handles errors gracefully

### 4. Radar Component (`app/components/Radar.tsx`)

**Visualization Features:**
- Canvas-based radar display (400x400px)
- Concentric circles and radial grid lines
- Rotating sweep beam with gradient tail
- Transaction blips that fade out over time
- Displays chain name and transaction count
- Custom color per chain

**Animation:**
- Uses requestAnimationFrame for smooth 60fps
- Sweep rotates at 0.02 radians per frame
- Blips fade at 0.005 alpha per frame
- Auto-cleanup of old seen hashes (keeps last 500)

### 5. Main Dashboard (`app/page.tsx`)

- Grid layout (responsive: 1/2/3 columns)
- Displays all 6 chain radars simultaneously
- Shows live status indicator
- Loading and error states

## 🔄 Data Flow

```
┌─────────────────┐      500ms poll      ┌──────────────────┐
│                 │ ──────────────────▶  │                  │
│  Frontend Hook  │                      │  API Route       │
│  (useHypersync) │ ◀──────────────────  │  (/api/hypersync)│
│                 │   Transaction Data   │                  │
└─────────────────┘                      └──────────────────┘
        │                                         │
        │                                         │
        ▼                                         ▼
┌─────────────────┐                      ┌──────────────────┐
│                 │                      │                  │
│  Radar          │                      │  Hypersync       │
│  Components     │                      │  Endpoints       │
│                 │                      │  (*.hypersync.xyz)│
└─────────────────┘                      └──────────────────┘
```

## 📡 Hypersync Query Format

**Request:**
```json
{
  "from_block": <last_block>,
  "to_block": <last_block + 10000>,
  "logs": [{
    "address": ["<usdc_address>"],
    "topics": [["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]]
  }],
  "field_selection": {
    "block": ["timestamp"],
    "transaction": ["block_hash", "from", "to", "value", "status", "chain_id"],
    "log": ["address", "topic0", "topic1", "topic2", "topic3", "transaction_hash", "block_number", "data"]
  }
}
```

**Topic0:** `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`
(keccak256 hash of "Transfer(address,address,uint256)")

## 🧪 Testing the API

Test individual chain endpoints:

```bash
# Ethereum
curl http://localhost:3000/api/hypersync?chainId=1

# Base
curl http://localhost:3000/api/hypersync?chainId=8453

# Polygon
curl http://localhost:3000/api/hypersync?chainId=137

# Arbitrum
curl http://localhost:3000/api/hypersync?chainId=42161

# Optimism
curl http://localhost:3000/api/hypersync?chainId=10

# Sonic
curl http://localhost:3000/api/hypersync?chainId=146
```

**Expected Response:**
```json
{
  "chain": "ETHEREUM",
  "chainId": 1,
  "transactions": [...],
  "count": 5,
  "totalTransactions": 5
}
```

## ⚡ Performance Optimizations

1. **Deduplication:** Prevents showing the same transaction twice
2. **Block Tracking:** Only queries new blocks, not entire history
3. **Range Limiting:** Limits queries to 10,000 blocks at a time
4. **Memory Management:** Auto-cleanup of old transaction hashes
5. **Client-side Rendering:** Radar animations run on client
6. **Efficient Polling:** Only fetches new data every 500ms

## 🔐 Security

- API key stored in environment variable (not exposed to frontend)
- Backend API handles all Hypersync communication
- No sensitive data in client-side code

## 🎨 Customization Options

### Change Poll Interval
Edit `app/hooks/useHypersync.ts`, line with `setInterval`:
```typescript
const interval = setInterval(() => {
  fetchChainData(chainId);
}, 500); // Change this value (in milliseconds)
```

### Change Radar Size
Edit `app/components/Radar.tsx`, canvas dimensions:
```typescript
<canvas
  ref={canvasRef}
  width={400}  // Change width
  height={400} // Change height
```

### Change Animation Speed
Edit `app/components/Radar.tsx`:
```typescript
sweepAngleRef.current += 0.02; // Sweep speed
tx.fadeProgress = tx.fadeProgress + 0.005; // Fade speed
```

### Add More Chains
1. Add to `CHAINS` in `app/types/chains.ts`
2. Component will automatically render it

## 🐛 Known Limitations

1. **Historical Data:** Only shows transactions from when the server starts
2. **Memory Growth:** Long-running servers may accumulate transaction data
3. **Rate Limiting:** Hypersync may rate-limit aggressive polling
4. **Block Timestamps:** May fall back to current time if timestamp unavailable

## 🚀 Production Deployment

Before deploying:

1. Set `HYPERSYNC_API_KEY` in production environment
2. Consider increasing poll interval for production
3. Add error tracking (e.g., Sentry)
4. Add analytics (e.g., Google Analytics)
5. Consider caching strategy for API responses
6. Set up monitoring for Hypersync availability

## 📊 Monitoring

Key metrics to track:
- API response times per chain
- Transaction throughput per chain
- Error rates
- Memory usage
- Client-side performance (FPS)

---

Built with Next.js 16, TypeScript, and Viem

