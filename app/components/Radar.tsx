'use client';

import { useEffect, useRef, useState } from 'react';

interface RadarProps {
  chainName: string;
  transactionCount: number;
  color?: string;
  blockTime: number; // Block time in seconds
  explorerUrl: string; // Block explorer base URL
  transactions: Array<{
    transactionHash: string;
    timestamp: number;
    value: string; // USDC value (with 6 decimals)
  }>;
}

interface RadarTransaction {
  angle: number;
  distance: number;
  timestamp: number;
  fadeProgress: number;
  hash: string;
  size: number; // Circle radius in pixels
  discovered: boolean; // Whether sweep has passed over it
  value: string; // USDC value for tooltip
}

export default function Radar({ chainName, transactionCount, color = '#00ff00', blockTime, explorerUrl, transactions }: RadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const radarTransactionsRef = useRef<RadarTransaction[]>([]);
  const sweepAngleRef = useRef(0);
  const previousSweepAngleRef = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const seenHashesRef = useRef<Set<string>>(new Set());
  const [hoveredBlip, setHoveredBlip] = useState<{ value: string; x: number; y: number; hash: string } | null>(null);

  // Calculate rotation speed based on block time
  // Full rotation (2π radians) should take blockTime seconds
  // At 60fps: rotationSpeed = (2π) / (blockTime * 60 frames)
  const rotationSpeed = (Math.PI * 2) / (blockTime * 60);

  // Calculate fade speed based on block time
  // Blips should persist for one full block time, then fade out
  // fadeProgress goes from 0 to 1 over blockTime seconds
  // At 60fps: fadeSpeed = 1.0 / (blockTime * 60 frames)
  const fadeSpeed = 1.0 / (blockTime * 60);

  // Calculate blip size based on USDC value
  // Uses logarithmic scaling to handle wide range of values
  const calculateBlipSize = (valueString: string): number => {
    try {
      // Convert from 6 decimals to USD
      const valueInUSDC = Number(BigInt(valueString) / BigInt(1_000_000));
      
      // Logarithmic scaling
      // $100 = size 2
      // $1,000 = size 3
      // $10,000 = size 5
      // $100,000 = size 8
      // $1,000,000 = size 12
      const minSize = 2;
      const maxSize = 15;
      const logValue = Math.log10(Math.max(valueInUSDC, 1));
      const size = minSize + (logValue / 6) * (maxSize - minSize);
      
      return Math.min(Math.max(size, minSize), maxSize);
    } catch {
      return 3; // Default size if parsing fails
    }
  };

  // Add new transactions to radar
  useEffect(() => {
    transactions.forEach((tx) => {
      // Skip if already displayed
      if (seenHashesRef.current.has(tx.transactionHash)) {
        return;
      }

      // Calculate size based on value
      const blipSize = calculateBlipSize(tx.value);

      // Add to radar (initially undiscovered)
      const newTransaction: RadarTransaction = {
        angle: Math.random() * Math.PI * 2,
        distance: 0.3 + Math.random() * 0.6,
        timestamp: tx.timestamp,
        fadeProgress: 0,
        hash: tx.transactionHash,
        size: blipSize,
        discovered: false, // Will be discovered when sweep passes
        value: tx.value, // Store value for tooltip
      };

      radarTransactionsRef.current.push(newTransaction);
      seenHashesRef.current.add(tx.transactionHash);
    });
  }, [transactions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    // Mouse move handler for hover detection
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Check if mouse is over any visible blip
      let foundBlip: { value: string; x: number; y: number; hash: string } | null = null;

      for (const tx of radarTransactionsRef.current) {
        if (!tx.discovered) continue; // Skip undiscovered blips

        const blipX = centerX + Math.cos(tx.angle) * tx.distance * radius;
        const blipY = centerY + Math.sin(tx.angle) * tx.distance * radius;
        const distance = Math.sqrt(Math.pow(mouseX - blipX, 2) + Math.pow(mouseY - blipY, 2));

        // Check if mouse is within blip radius (including glow)
        if (distance <= tx.size * 2) {
          foundBlip = {
            value: tx.value,
            x: event.clientX,
            y: event.clientY,
            hash: tx.hash,
          };
          break; // Take first match
        }
      }

      setHoveredBlip(foundBlip);
    };

    const handleMouseLeave = () => {
      setHoveredBlip(null);
    };

    // Click handler to open block explorer
    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Check if click is on any visible blip
      for (const tx of radarTransactionsRef.current) {
        if (!tx.discovered) continue; // Skip undiscovered blips

        const blipX = centerX + Math.cos(tx.angle) * tx.distance * radius;
        const blipY = centerY + Math.sin(tx.angle) * tx.distance * radius;
        const distance = Math.sqrt(Math.pow(mouseX - blipX, 2) + Math.pow(mouseY - blipY, 2));

        // Check if click is within blip radius (including glow)
        if (distance <= tx.size * 2) {
          // Open block explorer in new tab
          window.open(`${explorerUrl}${tx.hash}`, '_blank', 'noopener,noreferrer');
          break; // Only open first match
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);

    const drawRadar = () => {
      // Clear canvas with dark background
      ctx.fillStyle = '#000a00';
      ctx.fillRect(0, 0, width, height);

      // Draw concentric circles
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw radial lines
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius
        );
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      // Update discovery status and draw transactions (blips)
      const currentSweepAngle = sweepAngleRef.current % (Math.PI * 2);
      const previousSweepAngle = previousSweepAngleRef.current % (Math.PI * 2);
      
      radarTransactionsRef.current.forEach((tx) => {
        // Check if sweep has just crossed this blip's angle
        if (!tx.discovered) {
          const blipAngle = tx.angle;
          
          // Check if blip angle is between previous and current sweep position
          // This detects when sweep has just crossed the blip
          let crossed = false;
          
          // Handle normal case (no wraparound)
          if (currentSweepAngle >= previousSweepAngle) {
            // Sweep moved forward normally
            crossed = (blipAngle >= previousSweepAngle && blipAngle <= currentSweepAngle);
          } else {
            // Wraparound case: sweep crossed from 2π to 0
            crossed = (blipAngle >= previousSweepAngle || blipAngle <= currentSweepAngle);
          }
          
          if (crossed) {
            tx.discovered = true;
          }
        }
        
        // Only draw if discovered
        if (tx.discovered) {
          const x = centerX + Math.cos(tx.angle) * tx.distance * radius;
          const y = centerY + Math.sin(tx.angle) * tx.distance * radius;
          
          const alpha = Math.max(0, 1 - tx.fadeProgress);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          
          // Main blip with variable size
          ctx.beginPath();
          ctx.arc(x, y, tx.size, 0, Math.PI * 2);
          ctx.fill();

          // Glow effect (2x the main size, half alpha)
          ctx.globalAlpha = alpha * 0.5;
          ctx.beginPath();
          ctx.arc(x, y, tx.size * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1;

      // Draw sweeping radar line
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(sweepAngleRef.current);

      // Draw the bright leading edge line (at angle 0, pointing right)
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radius, 0);
      ctx.stroke();

      // Draw sweep cone (trail behind the line, going counterclockwise)
      // This creates the fade effect trailing the bright line
      ctx.fillStyle = color + '15';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      // Arc from -30° to 0° (counterclockwise trail behind the line)
      ctx.arc(0, 0, radius, -Math.PI / 6, 0);
      ctx.lineTo(0, 0);
      ctx.fill();

      // Add gradient overlay for smoother fade
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      gradient.addColorStop(0, color + '20');
      gradient.addColorStop(0.8, color + '10');
      gradient.addColorStop(1, color + '00');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, -Math.PI / 6, 0);
      ctx.lineTo(0, 0);
      ctx.fill();

      ctx.restore();

      // Update sweep angle based on block time
      // Store previous angle before updating
      previousSweepAngleRef.current = sweepAngleRef.current;
      sweepAngleRef.current += rotationSpeed;

      // Update transactions (fade them out based on block time)
      // Don't fade the currently hovered blip
      const hoveredHash = hoveredBlip?.hash;
      radarTransactionsRef.current = radarTransactionsRef.current
        .map((tx) => ({
          ...tx,
          // Don't increase fade progress for hovered blip
          fadeProgress: tx.hash === hoveredHash ? tx.fadeProgress : tx.fadeProgress + fadeSpeed,
        }))
        .filter((tx) => tx.fadeProgress < 1);

      // Cleanup old seen hashes (keep last 1000)
      if (seenHashesRef.current.size > 1000) {
        const arr = Array.from(seenHashesRef.current);
        seenHashesRef.current = new Set(arr.slice(-500));
      }

      animationFrameRef.current = requestAnimationFrame(drawRadar);
    };

    drawRadar();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
    };
  }, [color, rotationSpeed, fadeSpeed, hoveredBlip, explorerUrl]);

  // Format USDC value for display
  const formatUSDC = (valueString: string): string => {
    try {
      const valueInUSDC = Number(BigInt(valueString) / BigInt(1_000_000));
      return `$${valueInUSDC.toLocaleString()} USDC`;
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="rounded-lg border-2 cursor-crosshair hover:cursor-pointer"
          style={{
            borderColor: color,
            boxShadow: `0 0 20px ${color}40`,
          }}
        />
        
        {/* Tooltip */}
        {hoveredBlip && (
          <div
            className="fixed z-50 px-3 py-2 text-sm font-mono bg-black border-2 rounded-lg shadow-lg pointer-events-none"
            style={{
              borderColor: color,
              color: color,
              left: `${hoveredBlip.x + 10}px`,
              top: `${hoveredBlip.y - 30}px`,
            }}
          >
            {formatUSDC(hoveredBlip.value)}
          </div>
        )}
        <div
          className="absolute top-4 left-4 text-sm font-mono font-bold"
          style={{ color: color }}
        >
          {chainName}
        </div>
        <div
          className="absolute top-4 right-4 text-xs font-mono opacity-70"
          style={{ color: color }}
          title="Block time - one full rotation per block"
        >
          {blockTime}s/block
        </div>
        <div
          className="absolute bottom-4 right-4 text-2xl font-mono font-bold"
          style={{ color: color }}
        >
          {transactionCount.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
