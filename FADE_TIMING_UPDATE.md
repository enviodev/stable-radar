# ⏱️ Block Time-Based Fade Duration

## Overview

Transaction blips (dots) on the radar now persist and fade out over a duration matching the chain's block time. This creates a more meaningful visualization where the persistence of blips corresponds to the actual blockchain's rhythm.

## Behavior

### Before
- **Fixed fade time**: All chains faded out in ~3.3 seconds
- **Not synchronized**: Fade time didn't relate to block time
- **Formula**: `fadeProgress += 0.005` at 60fps

### After
- **Dynamic fade time**: Each chain fades over its block time
- **Synchronized**: Blips persist for exactly one block interval
- **Formula**: `fadeProgress += 1.0 / (blockTime × 60)` at 60fps

## Fade Duration by Chain

| Chain | Block Time | Fade Duration | Visual Effect |
|-------|-----------|---------------|---------------|
| **Ethereum** | 12 seconds | 12 seconds | Blips persist long, slow fade |
| **Base** | 2 seconds | 2 seconds | Quick appearance and fade |
| **Polygon** | 2 seconds | 2 seconds | Quick appearance and fade |

## Mathematical Implementation

### Formula

```typescript
// At 60 frames per second:
fadeSpeed = 1.0 / (blockTime × 60 frames)

// Examples:
// Ethereum (12s): 1.0 / 720 = 0.00139 per frame
// Base (2s):      1.0 / 120 = 0.00833 per frame
```

### Frame Calculations

**Ethereum (12 second blocks)**:
```
Fade speed: 0.00139 per frame
Frames to fade: 1.0 / 0.00139 = 720 frames
Time to fade: 720 / 60fps = 12 seconds ✅
```

**Base (2 second blocks)**:
```
Fade speed: 0.00833 per frame
Frames to fade: 1.0 / 0.00833 = 120 frames
Time to fade: 120 / 60fps = 2 seconds ✅
```

## Visual Experience

### Ethereum (12s blocks)
```
Transaction appears → Stays bright
   ↓ (3 seconds)
Still visible, slightly dimmed
   ↓ (6 seconds) 
Fading out gradually
   ↓ (12 seconds)
Completely faded, removed ✅
```

### Base/Polygon (2s blocks)
```
Transaction appears → Stays bright
   ↓ (0.5 seconds)
Starting to fade
   ↓ (1.5 seconds)
Fading fast
   ↓ (2 seconds)
Completely faded, removed ✅
```

## Code Implementation

### Fade Speed Calculation

```typescript
// In Radar component
const fadeSpeed = 1.0 / (blockTime * 60);

// Used in animation loop:
radarTransactionsRef.current = radarTransactionsRef.current
  .map((tx) => ({
    ...tx,
    fadeProgress: tx.fadeProgress + fadeSpeed,
  }))
  .filter((tx) => tx.fadeProgress < 1);
```

### Alpha Calculation

The opacity of each blip is based on `fadeProgress`:

```typescript
const alpha = Math.max(0, 1 - tx.fadeProgress);
ctx.globalAlpha = alpha;

// Examples:
// fadeProgress = 0.0 → alpha = 1.0 (fully visible)
// fadeProgress = 0.5 → alpha = 0.5 (half transparent)
// fadeProgress = 1.0 → alpha = 0.0 (invisible, removed)
```

## Why This Matters

### 1. **Synchronized with Blockchain**
Each blip represents a transaction in a block and persists for exactly one block time. This creates an accurate representation of the blockchain's tempo.

### 2. **Chain Characteristics**
- **Ethereum**: Long persistence reflects its deliberate, secure block production
- **Faster chains**: Quick fade reflects their high-speed nature

### 3. **Visual Density**
Chains with more transactions per block will show more blips simultaneously:
- Ethereum: Up to 12 seconds worth of blips visible
- Base: Only 2 seconds worth visible

### 4. **One Rotation = One Block Time**
Combined with the rotation timing, the visualization is completely synchronized:
- One full radar rotation = one block produced
- Blips appear and fade within one rotation cycle

## Comparative View

### Ethereum vs Base Visualization

**Ethereum (12s blocks)**:
```
Radar rotation: Slow (12 seconds)
Blip persistence: Long (12 seconds)
Visual density: High (many blips visible at once)
Impression: Steady, substantial activity
```

**Base (2s blocks)**:
```
Radar rotation: Fast (2 seconds)
Blip persistence: Short (2 seconds)
Visual density: Lower (fewer blips visible at once)
Impression: Quick, dynamic activity
```

## Performance Considerations

### Memory Management

With longer fade times (like Ethereum's 12 seconds):
- More blips visible simultaneously
- But we already limit to 100 transactions per chain in memory
- Older transactions beyond the limit are automatically removed

### Frame Rate Impact

No performance impact from different fade speeds:
- Same calculation per frame
- Same drawing operations
- Only the increment value differs

## Visual Smoothness

### Fade Curve

The fade is linear (constant rate):
```
Alpha = 1 - fadeProgress

fadeProgress: 0.0 → 0.2 → 0.4 → 0.6 → 0.8 → 1.0
Alpha:        1.0 → 0.8 → 0.6 → 0.4 → 0.2 → 0.0
```

This creates a smooth, gradual fade that's easy on the eyes.

### Glow Effect

Each blip also has a glow that fades:
```typescript
// Main blip
ctx.globalAlpha = alpha;
ctx.arc(x, y, 3, 0, Math.PI * 2);

// Glow (half intensity)
ctx.globalAlpha = alpha * 0.5;
ctx.arc(x, y, 6, 0, Math.PI * 2);
```

## Example Timeline: Ethereum Transaction

```
Time: 0s
├─ Transaction appears
├─ Blip at full brightness (alpha = 1.0)
└─ fadeProgress = 0.0

Time: 3s (25% through)
├─ Still very visible
├─ Slight dimming (alpha = 0.75)
└─ fadeProgress = 0.25

Time: 6s (50% through)
├─ Noticeably faded
├─ Half transparent (alpha = 0.5)
└─ fadeProgress = 0.5

Time: 9s (75% through)
├─ Significantly faded
├─ Barely visible (alpha = 0.25)
└─ fadeProgress = 0.75

Time: 12s (complete)
├─ Completely faded
├─ Removed from display (alpha = 0.0)
└─ fadeProgress = 1.0 → REMOVED
```

## Testing the Fade

### Visual Test

1. Open http://localhost:3000
2. Watch Ethereum radar:
   - Note how long blips stay visible (12 seconds)
   - Count along with the rotation
   - Blips should fade out as the sweep completes one rotation

3. Compare with Base radar:
   - Blips fade much faster (2 seconds)
   - Rotation is also faster
   - More dynamic, less "crowded" appearance

### Console Verification

The fade calculations are constant per chain:

```typescript
// Ethereum
blockTime: 12
fadeSpeed: 0.00139 per frame
Result: 12 second fade ✅

// Base
blockTime: 2
fadeSpeed: 0.00833 per frame
Result: 2 second fade ✅
```

## Adjusting Fade Behavior

### Make Blips Last Longer

To make blips persist for 2× block time:
```typescript
const fadeSpeed = 1.0 / (blockTime * 60 * 2); // Double duration
```

### Make Blips Last Shorter

To make blips persist for 0.5× block time:
```typescript
const fadeSpeed = 1.0 / (blockTime * 60 * 0.5); // Half duration
```

### Non-linear Fade

For a different fade curve (e.g., exponential):
```typescript
// Instead of: alpha = 1 - fadeProgress
// Use: alpha = Math.pow(1 - fadeProgress, 2) // Faster fade at end
// Or:  alpha = 1 - Math.pow(fadeProgress, 2) // Faster fade at start
```

## Summary

✅ **Blips persist for exactly one block time**  
✅ **Synchronized with rotation** (both based on blockTime)  
✅ **Smooth linear fade** from full to transparent  
✅ **Chain-specific** (12s for ETH, 2s for Base/Polygon)  
✅ **More meaningful visualization** - persistence reflects reality  

---

**Result**: Blips now tell a time-based story that matches the blockchain's actual rhythm! 🎯

