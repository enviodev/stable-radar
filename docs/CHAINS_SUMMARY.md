# Stable Radar - Supported Chains

## Overview
The radar now monitors **9 blockchain networks** in real-time for USDC transfers.

---

## Active Chains

### 1. **Ethereum Mainnet** 🟢
- **Chain ID**: 1
- **USDC Address**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- **Block Time**: 12 seconds
- **Color**: Green (`#00ff00`)
- **Explorer**: https://etherscan.io

### 2. **Base** 🔵
- **Chain ID**: 8453
- **USDC Address**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Block Time**: 2 seconds
- **Color**: Blue (`#0052ff`)
- **Explorer**: https://basescan.org

### 3. **Polygon** 🟣
- **Chain ID**: 137
- **USDC Address**: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`
- **Block Time**: 2 seconds
- **Color**: Purple (`#8247e5`)
- **Explorer**: https://polygonscan.com

### 4. **Arbitrum** 🔷
- **Chain ID**: 42161
- **USDC Address**: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- **Block Time**: 0.25 seconds (250ms)
- **Color**: Light Blue (`#28a0f0`)
- **Explorer**: https://arbiscan.io

### 5. **Optimism** 🔴
- **Chain ID**: 10
- **USDC Address**: `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85`
- **Block Time**: 2 seconds
- **Color**: Red (`#ff0420`)
- **Explorer**: https://optimistic.etherscan.io

### 6. **Sonic** 💠
- **Chain ID**: 146
- **USDC Address**: `0x29219dd400f2Bf60E5a23d13Be72B486D4038894`
- **Block Time**: 1 second
- **Color**: Cyan (`#00d4ff`)
- **Explorer**: https://sonicscan.org

### 7. **HyperEVM** 🟠 *(New)*
- **Chain ID**: 998
- **USDC Address**: `0xb88339CB7199b77E23DB6E890353E22632Ba630f`
- **Block Time**: 1 second
- **Color**: Orange (`#ff6b00`)
- **Explorer**: https://explorer.hyperevm.org

### 8. **Worldchain** 🟣 *(New)*
- **Chain ID**: 480
- **USDC Address**: `0x79A02482A880bCe3F13E09da970dC34dB4cD24D1`
- **Block Time**: 2 seconds
- **Color**: Magenta (`#ff00ff`)
- **Explorer**: https://worldscan.org

### 9. **Sei** 🟡 *(New)*
- **Chain ID**: 1329
- **USDC Address**: `0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392`
- **Block Time**: 0.4 seconds (400ms)
- **Color**: Gold (`#ffd700`)
- **Explorer**: https://seitrace.com

---

## Technical Details

### Hypersync Endpoints
All chains use the format: `https://{chainId}.hypersync.xyz`

Example:
- Ethereum: `https://1.hypersync.xyz`
- Base: `https://8453.hypersync.xyz`
- HyperEVM: `https://998.hypersync.xyz`

### Polling Strategy
- **Height Polling**: Every 500ms per chain
- **Transfer Query**: Only when new blocks detected
- **Deduplication**: Transaction hashes tracked per chain
- **Memory Limit**: Max 100 transactions per chain

### Block Time Synchronization
Each radar's rotation speed matches its chain's block time:
- **Fastest**: Arbitrum (0.25s) - 4 rotations per second
- **Slowest**: Ethereum (12s) - 1 rotation per 12 seconds

### Grid Layout
- **Mobile**: 1 column
- **Tablet (md)**: 2 columns
- **Desktop (lg)**: 3 columns
- **XL Screens**: 4 columns

---

## Performance Considerations

### Fast Chains (< 1 second block time)
- **Arbitrum**: 0.25s - Very fast updates
- **Sei**: 0.4s - Rapid block production

These chains will update most frequently and may show more frequent blips.

### Moderate Chains (1-2 seconds)
- **Sonic**: 1s
- **HyperEVM**: 1s
- **Base**: 2s
- **Optimism**: 2s
- **Polygon**: 2s
- **Worldchain**: 2s

Balanced update frequency.

### Slow Chain (> 10 seconds)
- **Ethereum**: 12s - More deliberate, slower rotation

---

## Data Flow

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React)                                   │
│  • Polls /api/hypersync/height every 500ms         │
│  • Detects new blocks                              │
│  • Triggers /api/hypersync?chainId=X               │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Backend API (Next.js)                              │
│  • Authenticates with Hypersync API                │
│  • Queries USDC Transfer events                    │
│  • Decodes event logs with Viem                    │
│  • Deduplicates transactions                       │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Hypersync (Envio)                                  │
│  • Returns Transfer events for USDC contract       │
│  • Provides block height, timestamps, values       │
└─────────────────────────────────────────────────────┘
```

---

## Updated: November 12, 2025
**Status**: ✅ All 9 chains active and monitoring

