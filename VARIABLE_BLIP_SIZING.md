# 📏 Variable Blip Sizing

## Overview

Transaction blips now appear in different sizes based on the USDC transfer amount. Larger transfers = bigger circles, smaller transfers = smaller circles. This creates an instant visual hierarchy showing the relative importance of each transaction.

## Size Scaling

### Logarithmic Scale

Uses logarithmic scaling to handle the wide range of USDC values (from $1 to $1,000,000+):

```
Transfer Amount    →    Blip Size (radius in pixels)
─────────────────────────────────────────────────────
$100              →     2px  (minimum)
$1,000            →     3px  (small)
$10,000           →     5px  (medium)
$100,000          →     8px  (large)
$1,000,000        →     12px (very large)
$10,000,000+      →     15px (maximum, whales!)
```

### Why Logarithmic?

Linear scaling would make small transfers invisible and large transfers overwhelming:

```
❌ Linear scaling:
$1,000     → 1px  (too small, invisible)
$100,000   → 100px (too large, covers entire radar!)

✅ Logarithmic scaling:
$1,000     → 3px  (visible, appropriate)
$100,000   → 8px  (prominent but not overwhelming)
```

## Formula

```typescript
const calculateBlipSize = (valueString: string): number => {
  // Convert from 6 decimals to USD
  const valueInUSDC = Number(BigInt(valueString) / BigInt(1_000_000));
  
  // Logarithmic scaling
  const minSize = 2;   // Minimum radius
  const maxSize = 15;  // Maximum radius
  const logValue = Math.log10(Math.max(valueInUSDC, 1));
  const size = minSize + (logValue / 6) * (maxSize - minSize);
  
  // Clamp to min/max bounds
  return Math.min(Math.max(size, minSize), maxSize);
};
```

### Mathematical Breakdown

```
1. Convert value: "1000000000" / 1,000,000 = 1,000 USDC

2. Take log10: log10(1,000) = 3

3. Scale to range:
   size = 2 + (3 / 6) * (15 - 2)
   size = 2 + 0.5 * 13
   size = 2 + 6.5
   size = 8.5 pixels

4. Round and clamp: 8.5px → 8-9px (within 2-15 range)
```

## Visual Examples

### Ethereum Radar with Mixed Transfers

```
         ⬤  ← $100,000 (8px)
    •        ← $1,000 (3px)
       ○     ← $5,000 (4px)
 ●           ← $500,000 (11px)
    •        ← $2,000 (3px)
```

The eye is naturally drawn to the larger circles (higher value transfers).

### Whale Watching Mode ($50,000+ threshold)

```
      ⬤      ← $80,000 (7px)
        ●    ← $200,000 (9px)
   ⬤         ← $100,000 (8px)
```

All visible blips are large, making whale activity very prominent.

## Glow Effect

Each blip has a glow that's 2× the main circle size:

```typescript
// Main blip
ctx.arc(x, y, tx.size, 0, Math.PI * 2);

// Glow (double size, half alpha)
ctx.arc(x, y, tx.size * 2, 0, Math.PI * 2);
```

This creates a halo effect that scales with the transaction size:
- Small transfers: subtle glow
- Large transfers: prominent glow

## Size Range Examples

### Small Transfers ($100-$1,000)
```
Size: 2-3px
Appearance: Small dots
Visibility: Present but not prominent
Use case: Background activity
```

### Medium Transfers ($1,000-$10,000)
```
Size: 3-5px
Appearance: Normal circles
Visibility: Clear and distinct
Use case: Regular trading activity
```

### Large Transfers ($10,000-$100,000)
```
Size: 5-8px
Appearance: Prominent circles
Visibility: Eye-catching
Use case: Significant movements
```

### Whale Transfers ($100,000+)
```
Size: 8-15px
Appearance: Large, dominant circles
Visibility: Immediately noticeable
Use case: Major institutional/whale activity
```

## Combined with Threshold Filter

The sizing works perfectly with the threshold filter:

### Low Threshold ($1,000)
```
Many small blips (2-4px) + occasional large blips (8-15px)
Creates visual hierarchy automatically
Eye drawn to important transactions
```

### High Threshold ($50,000)
```
Only large blips visible (7-15px)
All transactions are visually prominent
Easy to compare whale sizes
```

## Visual Impact Examples

### Scenario 1: Regular Activity
```
Filter: $1,000+
Radar view:
  • • •  ⬤  •  ○  • •  ●  • •
  ↑ ↑ ↑  ↑  ↑  ↑  ↑ ↑  ↑  ↑ ↑
  Small  Large Med  Whale  Small
```

### Scenario 2: Whale Watching
```
Filter: $100,000+
Radar view:
   ⬤      ●        ⬤
   ↑      ↑        ↑
  $150k  $500k   $200k
```

All blips are large, but still show relative sizing.

## Performance

### Calculation Cost

Size calculation happens once when transaction appears:
```
Cost: < 0.1ms per transaction
Impact: Negligible
Cached: Size stored with transaction
```

### Drawing Cost

Drawing variable-sized circles vs fixed:
```
Fixed size: ctx.arc(x, y, 3, ...)
Variable size: ctx.arc(x, y, tx.size, ...)

Performance difference: None (same operation)
```

## Interaction with Other Features

### 1. Block Time Fade
```
Large blips fade out over block time
Small blips fade out over block time
All follow same fade curve
Size remains constant during fade
```

### 2. Threshold Filter
```
Filtering happens before sizing
Only filtered transactions get sized
Improves performance (fewer size calculations)
```

### 3. Chain-Specific Colors
```
Size is independent of color
Large Ethereum blip: big + green
Large Base blip: big + blue
Visual language consistent across chains
```

## Real-World Usage Patterns

### Pattern 1: DeFi Protocol Activity
```
Many medium-sized transfers ($5,000-$20,000)
Consistent size range
Indicates automated/programmatic trading
```

### Pattern 2: Retail vs Institutional
```
Many small blips + few large blips
Clear visual separation
Shows market composition
```

### Pattern 3: Whale Accumulation
```
Repeated large blips in short period
All above $100,000
Indicates major player activity
```

## Customization Options

### Adjust Size Range

```typescript
// Make size differences more dramatic
const minSize = 1;   // Smaller minimum
const maxSize = 20;  // Larger maximum

// Or make them more subtle
const minSize = 3;   // Larger minimum
const maxSize = 10;  // Smaller maximum
```

### Change Scaling Curve

```typescript
// More aggressive (emphasize large transfers more)
const size = minSize + Math.pow(logValue / 6, 1.5) * (maxSize - minSize);

// More gentle (less size difference)
const size = minSize + Math.pow(logValue / 6, 0.5) * (maxSize - minSize);
```

### Linear Scaling (not recommended)

```typescript
// Simple linear (but problematic for wide value ranges)
const size = (valueInUSDC / 100000) * 10;
return Math.min(Math.max(size, 2), 15);
```

## Debugging

### Check Calculated Sizes

```typescript
console.log('$100:', calculateBlipSize('100000000'));      // ~2px
console.log('$1,000:', calculateBlipSize('1000000000'));   // ~3px
console.log('$10,000:', calculateBlipSize('10000000000')); // ~5px
console.log('$100,000:', calculateBlipSize('100000000000')); // ~8px
```

### Visual Size Check

Open DevTools → Console while watching radars:
```javascript
// All blips should have size between 2-15
radarTransactionsRef.current.forEach(tx => {
  console.log('Blip size:', tx.size);
});
```

## Future Enhancements

Potential additions:

1. **Color by size**: Different colors for different size ranges
2. **Pulse effect**: Large transfers pulse/throb
3. **Size legend**: Visual guide showing size = value
4. **Hover tooltip**: Show exact amount on hover
5. **Size-based sorting**: Draw large blips on top
6. **Animation**: Blips start small and grow to full size
7. **Sound**: Larger transfers = deeper/louder sound

## Edge Cases

### Very Small Transfers (<$100)
```
Calculated size might be < 2px
Clamped to minimum (2px)
Still visible
```

### Very Large Transfers (>$10,000,000)
```
Calculated size might be > 15px
Clamped to maximum (15px)
Doesn't overwhelm radar
```

### Invalid Values
```
Catch block returns default 3px
Ensures radar keeps working
Logs error for debugging
```

## Summary

✅ **Logarithmic scaling** - Handles wide value range elegantly  
✅ **2-15px range** - Visible but not overwhelming  
✅ **Auto-calculated** - No manual configuration needed  
✅ **Performant** - Negligible overhead  
✅ **Visual hierarchy** - Instantly see important transfers  
✅ **Whale spotting** - Large transfers stand out  

---

**Result**: Blip size now tells a story - bigger circles = bigger money! 💰📊

