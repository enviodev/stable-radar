# Debugging Guide

## 🐛 Debug Mode

The application now includes a comprehensive debug panel to help diagnose issues with the Hypersync integration.

### Accessing Debug Mode

1. Open the application at [http://localhost:3000](http://localhost:3000)
2. Click the **"🐛 Debug Mode"** button in the bottom-right corner
3. View real-time information about each chain's data

### Debug Panel Features

- **Chain Status**: See transaction counts for each chain
- **Error Display**: View any errors from the API
- **API Test Button**: Test all endpoints with debug info
- **Console Logs**: Detailed server logs in terminal

### Server-Side Debugging

All API requests log detailed information to the console:

```bash
npm run dev
```

Look for logs like:
```
[ETHEREUM] Querying from block 23769352...
[ETHEREUM] Response: 1 items, 7585 logs, next_block: 23769444
[ETHEREUM] Processed 7585 new transactions, total seen: 20085
```

### API Debug Endpoints

Test individual chains with debug mode:

```bash
# With debug info
curl "http://localhost:3000/api/hypersync?chainId=1&debug=true" | jq

# Without debug info (production mode)
curl "http://localhost:3000/api/hypersync?chainId=8453" | jq
```

### Common Issues & Solutions

#### Issue: "Failed to fetch"
**Cause**: Network error or CORS issue
**Solution**: 
- Check if dev server is running: `ps aux | grep "next dev"`
- Restart server: `npm run dev`
- Check browser console for detailed error

#### Issue: "Do not know how to serialize a BigInt"
**Status**: ✅ FIXED
**Solution**: BigInt values are now converted to strings before JSON serialization

#### Issue: No transactions appearing
**Cause**: Querying old blocks without USDC activity
**Solution**: 
- ✅ Now automatically queries recent blocks (last 10,000)
- Check console logs to see which blocks are being queried

#### Issue: Duplicate transactions
**Status**: ✅ PREVENTED
**Solution**: 
- Deduplication logic tracks seen transaction hashes
- Separate tracking per chain
- Auto-cleanup of old hashes

### Checking Chain Status

```bash
# Quick status check for all chains
for id in 1 8453 137 42161 10 146; do
  echo "Chain $id:"
  curl -s "localhost:3000/api/hypersync?chainId=$id" | jq -r '"\(.chain): \(.totalTransactions) txs"'
done
```

### Expected Behavior

✅ **First Query**: Each chain queries last 10,000 blocks and finds recent USDC transfers
✅ **Subsequent Queries**: Only new blocks are queried (incremental)
✅ **Deduplication**: Same transaction never appears twice
✅ **Visualization**: New transactions appear as radar blips that fade out

### Monitoring Performance

Watch real-time updates:
```bash
# Terminal 1: Run dev server with logs
npm run dev

# Terminal 2: Watch API calls
watch -n 1 'curl -s localhost:3000/api/hypersync?chainId=8453 | jq "{chain,count,total:.totalTransactions}"'
```

### Network Requirements

- Outbound HTTPS to `*.hypersync.xyz`
- Ports: 3000 (dev server)
- No firewall blocking fetch requests

### Debug Checklist

- [ ] Dev server is running on port 3000
- [ ] Browser console shows no errors
- [ ] API endpoints return 200 status
- [ ] Transaction counts are increasing
- [ ] Radar blips are appearing on screen
- [ ] No CORS errors in console
- [ ] BigInt serialization working (no errors)

## 📊 Performance Metrics

Expected performance:
- **API Response Time**: 100-500ms per chain
- **Poll Interval**: 500ms
- **Memory Usage**: ~100MB for server
- **Blips Per Chain**: Varies by chain activity

## 🔧 Advanced Debugging

### Enable Verbose Logging

Edit `app/api/hypersync/route.ts` and add more console.log statements:

```typescript
console.log('Detailed query payload:', JSON.stringify(queryPayload, null, 2));
console.log('Full response data:', JSON.stringify(data, null, 2));
```

### Test Hypersync Directly

```bash
# Test Hypersync API directly (outside Next.js)
curl -X POST "https://8453.hypersync.xyz/query" \
  -H "Content-Type: application/json" \
  -d '{
    "from_block": 38050000,
    "logs": [{
      "address": ["0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"],
      "topics": [["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]]
    }],
    "field_selection": {
      "log": ["transaction_hash", "block_number"]
    }
  }'
```

### Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Filter: `/api/hypersync`
4. Watch requests every 500ms
5. Inspect responses

---

If issues persist, check the GitHub issues or contact support with:
- Browser console logs
- Server terminal logs
- Network tab screenshots
- System info (OS, Node version)

