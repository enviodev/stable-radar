# 🔑 API Token Setup Guide

## Why You Need an API Token

Starting **November 3, 2025**, HyperSync requires API tokens for all requests. This is a mandatory requirement from Envio.

> 📖 Reference: [HyperSync Documentation](https://docs.envio.dev/docs/HyperSync-LLM/hypersync-complete)

## Quick Setup

### 1. Get Your API Token

Visit the [Envio API Tokens Dashboard](https://envio.dev/app/api-tokens) to generate your token.

### 2. Add Token to Your Project

Create a `.env.local` file in the project root:

```bash
echo 'HYPERSYNC_API_KEY=your-actual-token-here' > .env.local
```

Or manually create `.env.local`:

```bash
# Envio Hypersync API Token (REQUIRED)
HYPERSYNC_API_KEY=your-actual-token-here
```

### 3. Restart the Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

The server will automatically load the API token from `.env.local`.

## Verification

To verify your API token is working:

### Browser Check
1. Open [http://localhost:3000](http://localhost:3000)
2. Click the **🐛 Debug Mode** button (bottom-right)
3. Look for `hasApiKey: true` in the debug info

### Terminal Check
```bash
curl -s "http://localhost:3000/api/hypersync?chainId=1&debug=true" | jq '.debug.hasApiKey'
# Should return: true
```

## Common Issues

### ❌ "ERR_INSUFFICIENT_RESOURCES"
**Cause**: No API token or invalid token

**Solution**: 
- Ensure `.env.local` exists with `HYPERSYNC_API_KEY=...`
- Restart the dev server after creating `.env.local`
- Verify token is correct (no extra spaces)

### ❌ "Failed to fetch"
**Cause**: API token not loaded by Next.js

**Solution**:
1. Check file is named exactly `.env.local` (not `.env` or `env.local`)
2. File should be in project root (same directory as `package.json`)
3. Restart dev server completely

### ❌ Debug shows "hasApiKey: false"
**Cause**: Environment variable not loaded

**Solution**:
```bash
# Kill all Next.js processes
pkill -f "next dev"

# Verify .env.local exists and has content
cat .env.local

# Restart
npm run dev
```

## Security Notes

### ✅ Do's
- Keep your API token in `.env.local` (automatically ignored by git)
- Never commit `.env.local` to version control
- Use different tokens for development and production

### ❌ Don'ts
- Don't put the token in `.env` (not gitignored by default)
- Don't hardcode the token in your source code
- Don't share your token publicly

## File Structure

```
stable-radar/
├── .env.local          # Your actual token (gitignored) ✅
├── .env.example        # Template file (committed to git) ✅
├── app/
│   └── api/
│       └── hypersync/
│           └── route.ts  # Reads process.env.HYPERSYNC_API_KEY
└── package.json
```

## Testing Your Setup

Run this comprehensive test:

```bash
# Test all chains
for chainId in 1 8453 137 42161 10 146; do
  echo "Testing Chain $chainId..."
  curl -s "http://localhost:3000/api/hypersync?chainId=$chainId" \
    | jq '{chain, hasApiKey: .debug.hasApiKey, count, total: .totalTransactions}'
done
```

Expected output for each chain:
```json
{
  "chain": "ETHEREUM",
  "count": 150,
  "total": 9558
}
```

## How It Works

The API token is used in the backend API route:

```typescript
// app/api/hypersync/route.ts
const apiKey = process.env.HYPERSYNC_API_KEY;
if (apiKey) {
  headers['Authorization'] = `Bearer ${apiKey}`;
}
```

This keeps your token secure on the server-side and never exposes it to the browser.

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add `HYPERSYNC_API_KEY` to your environment variables in the hosting platform
2. Never commit `.env.local` to git
3. Consider using separate tokens for staging and production

### Vercel Example
```bash
vercel env add HYPERSYNC_API_KEY production
# Paste your token when prompted
```

## Need Help?

- 📖 [HyperSync Documentation](https://docs.envio.dev/docs/HyperSync-LLM/hypersync-complete)
- 💬 [Envio Discord](https://discord.gg/envio)
- 🐛 Use the Debug Panel in the app for diagnostics

---

**Remember**: Without a valid API token, HyperSync requests will fail with "INSUFFICIENT_RESOURCES" errors.

