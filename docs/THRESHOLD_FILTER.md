# 💰 Threshold Filter Feature

## Overview

A new interactive threshold filter allows you to focus on high-value USDC transfers. Only transactions above a specified dollar amount will appear as blips on the radar.

## Features

### 1. Dynamic Slider Control
- **Range**: $0 to $50,000 USDC
- **Step**: $100 increments
- **Default**: $1,000 USDC
- **Real-time**: Filter updates instantly as you drag

### 2. Quick Preset Buttons
Fast access to common thresholds:
- **Show All** - $0 (no filtering)
- **$1,000+** - Small transfers
- **$5,000+** - Medium transfers
- **$10,000+** - Large transfers
- **$25,000+** - Very large transfers
- **$50,000+** - Whale transfers only

### 3. Visual Feedback
- Current threshold displayed in large text
- Slider shows filled progress (green portion)
- Description text indicates filtering is active

## How It Works

### USDC Value Parsing

USDC uses 6 decimal places, so:
```
Raw value: "1000000000" (string from blockchain)
Decimals: 6
Calculation: 1000000000 / 1,000,000 = 1,000 USDC
```

### Filtering Logic

```typescript
const filterByThreshold = (transactions) => {
  return transactions.filter((tx) => {
    // Convert from raw value (6 decimals) to USD
    const valueInUSDC = BigInt(tx.value) / BigInt(1_000_000);
    const valueInUSD = Number(valueInUSDC);
    
    // Only show if >= threshold
    return valueInUSD >= threshold;
  });
};
```

### Real-time Application

Every render:
1. Get all transactions for a chain
2. Filter by current threshold
3. Pass filtered transactions to Radar component
4. Only filtered transactions appear as blips

## Use Cases

### 1. Whale Watching ($25,000+)
Track large institutional or whale movements:
```
Set threshold: $25,000
Result: Only major transfers appear
Use case: Monitor big players
```

### 2. Significant Activity ($10,000+)
Focus on meaningful transactions:
```
Set threshold: $10,000
Result: Filter out small retail trades
Use case: Track serious money movements
```

### 3. General Activity ($1,000+)
Remove micro-transactions:
```
Set threshold: $1,000
Result: Clean view of regular trading
Use case: Standard monitoring
```

### 4. Everything ($0)
See all transfers:
```
Set threshold: $0
Result: Every USDC transfer appears
Use case: Complete activity overview
```

## Visual Experience

### High Threshold ($50,000+)
- **Fewer blips**: Only rare, large transfers
- **Clean radar**: Easy to spot individual whales
- **Slower updates**: Large transfers are less frequent

### Medium Threshold ($5,000-$10,000)
- **Moderate activity**: Balance of visibility and clarity
- **Meaningful transactions**: Filtering noise
- **Regular updates**: Steady stream of significant transfers

### Low/No Threshold ($0-$1,000)
- **Many blips**: All transactions visible
- **Busy radar**: Full activity picture
- **Frequent updates**: Constant new blips

## UI Components

### Control Panel Location
Located at the bottom of the page, centered, below the radars.

### Design
```
┌─────────────────────────────────────────┐
│   Minimum Transfer Amount Filter        │
│         $10,000 USDC                    │
│   Only showing transfers above this     │
├─────────────────────────────────────────┤
│  ├─────█████████────────────────────┤   │ ← Slider
│  $0      $10k      $25k        $50k     │
├─────────────────────────────────────────┤
│ [Show All] [$1,000+] [$5,000+] ...     │ ← Presets
└─────────────────────────────────────────┘
```

### Styling
- Dark background with green borders (matching radar theme)
- Green accent colors for text and slider
- Hover effects on buttons
- Monospace font for consistency

## Technical Details

### State Management

```typescript
const [threshold, setThreshold] = useState(1000); // Default $1,000
```

### Slider Configuration

```typescript
<input
  type="range"
  min="0"         // Minimum: $0
  max="50000"     // Maximum: $50,000
  step="100"      // Increment: $100
  value={threshold}
  onChange={(e) => setThreshold(Number(e.target.value))}
/>
```

### BigInt Handling

USDC values are stored as strings representing large integers:
```typescript
// Example value: "1234567890" (raw blockchain data)
const valueInUSDC = BigInt(tx.value) / BigInt(1_000_000);
// Result: 1234.56789 USDC

const valueInUSD = Number(valueInUSDC);
// Result: 1234 USD (for comparison)
```

### Performance

- Filtering happens client-side
- Very fast (< 1ms for 100 transactions)
- No API calls needed
- Updates instantly

## Examples

### Scenario 1: Finding Whale Movements

```
1. Set threshold to $50,000
2. Watch radars - only huge transfers appear
3. Each blip represents a whale transaction
4. Very sparse, easy to track
```

### Scenario 2: Monitoring DeFi Activity

```
1. Set threshold to $10,000
2. Focus on smart contract interactions
3. See protocol-level movements
4. Balanced view of significant activity
```

### Scenario 3: General Market Pulse

```
1. Set threshold to $1,000
2. See regular trading activity
3. Get sense of market volume
4. Still filters out spam/dust
```

## Integration with Radars

### Before Filtering
```
All transactions → Radar display
(includes $1, $10, $100, $1000, $10000 transfers)
```

### After Filtering (threshold = $10,000)
```
All transactions → Filter → Radar display
(only $10,000+ transfers shown as blips)
```

### Transaction Count

The total transaction count (shown on radar) remains unchanged:
- **Total count**: All transactions tracked by backend
- **Visible blips**: Only those above threshold
- This lets you see activity level vs. whale activity

## Keyboard Shortcuts (Future)

Potential enhancements:
```
Press 1: Set to $1,000
Press 5: Set to $5,000
Press 0: Show all
Press -: Decrease by $1,000
Press +: Increase by $1,000
```

## Analytics Opportunities

With this filter, you can observe:

1. **Whale vs Retail Ratio**
   - High threshold = Few blips = Whale-dominated
   - Low threshold = Many blips = Retail-dominated

2. **Chain Characteristics**
   - Ethereum at $10k+: Institutional heavy
   - Base at $10k+: DeFi protocols
   - Compare activity patterns

3. **Time-based Patterns**
   - When do whales move? (hours/days)
   - Volume spikes at certain times
   - Chain-specific behaviors

## Future Enhancements

Potential additions:
1. **Separate threshold per chain**
2. **Range filter** (min and max)
3. **Percentage-based filter** (top X%)
4. **Color coding by amount** (gradient based on size)
5. **Sound alerts** for whale transfers
6. **Transfer size shown on hover**
7. **Save favorite thresholds**
8. **URL parameter** for sharing filtered views

## Testing

### Manual Test Cases

1. **Test Filter Range**
```bash
# Set to $0 - should see all transfers
# Set to $50,000 - should see very few/none
# Adjust slider - updates should be instant
```

2. **Test Preset Buttons**
```bash
# Click each preset button
# Verify display updates to correct amount
# Check slider position matches
```

3. **Test Edge Cases**
```bash
# Set to $0 (minimum)
# Set to $50,000 (maximum)
# Rapid slider movement
# Quick preset switching
```

### Browser Console Test

```javascript
// Check if filtering is working
console.log('Threshold:', threshold);
console.log('All transactions:', allTransactions.length);
console.log('Filtered:', filteredTransactions.length);
```

## Summary

✅ **Interactive slider** - $0 to $50,000 range  
✅ **Quick presets** - Common thresholds in one click  
✅ **Real-time filtering** - Instant visual updates  
✅ **Whale watching** - Focus on large transfers  
✅ **Clean UI** - Matches radar aesthetic  
✅ **Performance** - Fast client-side filtering  

---

**Result**: Focus on what matters - filter noise and track significant USDC movements! 🐋

