# 🎯 Stable Radar

Real-time USDC stablecoin transfer visualization across multiple blockchain networks using Envio Hypersync.

![Stable Radar](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Viem](https://img.shields.io/badge/Viem-latest-purple?style=for-the-badge)

## 🌐 Supported Networks

- **Ethereum** (Mainnet) - Chain ID: 1
- **Base** - Chain ID: 8453
- **Polygon** - Chain ID: 137
- **Arbitrum** - Chain ID: 42161
- **Optimism** - Chain ID: 10
- **Sonic** - Chain ID: 146

## ✨ Features

- 🎨 **Old-school radar visualization** - Classic green CRT-style radar displays for each chain
- ⚡ **Real-time updates** - Polls Hypersync endpoints every 500ms for new USDC transfers
- 🔄 **Deduplication** - Prevents showing the same transaction multiple times
- 🎯 **Multi-chain support** - Monitors 6 different blockchain networks simultaneously
- 🔐 **Backend API** - Secure Node.js API routes to keep API keys private
- 🎭 **Beautiful UI** - Modern, responsive design with custom colors for each chain

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd stable-radar
```

2. Install dependencies:
```bash
npm install
```

3. **Configure API Token (REQUIRED)**:

> ⚠️ **Important**: HyperSync requires API tokens from November 3, 2025

Create a `.env.local` file:
```bash
echo 'HYPERSYNC_API_KEY=your-api-token-here' > .env.local
```

Get your API token from the [Envio Dashboard](https://envio.dev/app/api-tokens)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Architecture

### Frontend (`/app`)
- **page.tsx** - Main dashboard displaying all chain radars
- **components/Radar.tsx** - Animated radar visualization component
- **hooks/useHypersync.ts** - Custom React hook for polling Hypersync data
- **types/chains.ts** - TypeScript definitions and chain configurations

### Backend (`/app/api`)
- **hypersync/route.ts** - API endpoint that queries Hypersync and decodes events

### Key Technologies
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Viem** - Ethereum library for decoding events
- **Canvas API** - For rendering radar visualizations
- **Tailwind CSS** - Utility-first CSS framework

## 📡 How It Works

1. **Frontend Polling**: The `useHypersync` hook polls the backend API every 500ms for each chain
2. **Backend Query**: The API route queries Envio Hypersync with the USDC contract address and Transfer event signature
3. **Event Decoding**: Uses Viem to decode ERC-20 Transfer events from the logs
4. **Deduplication**: Tracks seen transaction hashes to prevent duplicates
5. **Visualization**: New transactions appear as blips on the radar that fade out over time

## 🎨 Customization

### Adding a New Chain

Edit `/app/types/chains.ts` and add your chain to the `CHAINS` object:

```typescript
newchain: {
  name: 'NEW CHAIN',
  chainId: 12345,
  color: '#ff00ff',
  usdcAddress: '0x...',
  hypersyncUrl: 'https://12345.hypersync.xyz',
}
```

### Adjusting Poll Interval

Edit `/app/hooks/useHypersync.ts` and change the interval:

```typescript
const interval = setInterval(() => {
  fetchChainData(chainId);
}, 1000); // Change from 500ms to 1000ms
```

## 🔧 Configuration

### Environment Variables

- `HYPERSYNC_API_KEY` - (Optional) Envio Hypersync API key

## 📊 USDC Contract Addresses

| Chain | Contract Address |
|-------|-----------------|
| Ethereum | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| Base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Polygon | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` |
| Arbitrum | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| Optimism | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |
| Sonic | `0x29219dd400f2Bf60E5a23d13Be72B486D4038894` |

## 🐛 Troubleshooting

### No transactions appearing?

- Check the browser console for errors
- Verify the Hypersync endpoint is accessible
- Ensure your network supports the chain IDs

### Performance issues?

- Reduce the polling frequency in `useHypersync.ts`
- Increase the cleanup threshold for old transactions
- Reduce the number of chains being monitored

## 📝 License

MIT

## 🙏 Acknowledgments

- **Envio** - For providing the Hypersync infrastructure
- **Viem** - For excellent Ethereum utilities
- **Next.js** - For the amazing React framework

---

Built with ❤️ for the blockchain community
