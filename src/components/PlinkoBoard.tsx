import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Ball, Peg, RiskLevel } from '../types';
import { MULTIPLIERS_CONFIG, getSlotColors } from '../utils/constants';
import { sound } from '../utils/audio';

interface PlinkoBoardProps {
  rows: number;
  riskLevel: RiskLevel;
  fastMode: boolean;
  onBallLanded: (multiplier: number, betAmount: number, slotIndex: number) => void;
  activeBalls: Ball[];
  onRemoveBall: (ballId: string) => void;
  highlightedSlot: { index: number; time: number } | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export const PlinkoBoard: React.FC<PlinkoBoardProps> = ({
  rows,
  riskLevel,
  fastMode,
  onBallLanded,
  activeBalls,
  onRemoveBall,
  highlightedSlot,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reference for balls inside animation loop to avoid stale closure
  const ballsRef = useRef<Ball[]>([]);
  ballsRef.current = activeBalls;

  const particlesRef = useRef<Particle[]>([]);
  const slotFlashRef = useRef<{ index: number; time: number } | null>(null);

  // Sync slot flash
  useEffect(() => {
    if (highlightedSlot) {
      slotFlashRef.current = highlightedSlot;
    }
  }, [highlightedSlot]);

  // Keep track of board layout dimensions
  const layoutRef = useRef({
    width: 680,
    height: 540,
    pegSpacing: 44,
    rowSpacing: 38,
    startY: 65,
    pegRadius: 4.5,
    ballRadius: 7.5,
    slotsY: 480,
    slotWidth: 50,
    slotsStartX: 50,
  });

  const lastSizeRef = useRef({ width: 0, height: 0 });

  const multipliers = MULTIPLIERS_CONFIG[riskLevel][rows] || MULTIPLIERS_CONFIG.medium[8];

  // Initialize and generate pegs
  const [pegs, setPegs] = useState<Peg[]>([]);

  const generatePegs = useCallback((boardWidth: number, boardHeight: number, rowCount: number) => {
    const topMargin = 55;
    const bottomMargin = 75; // Space for slots at bottom
    const availableHeight = boardHeight - topMargin - bottomMargin;
    const rowSpacing = availableHeight / (rowCount + 0.2);

    // Peg spacing: max width in bottom row has (rowCount + 2) pegs
    const maxPegsInBottom = rowCount + 2;
    const availableWidth = boardWidth * 0.88;
    const pegSpacing = Math.min(50, availableWidth / (maxPegsInBottom - 1));

    const centerX = boardWidth / 2;
    const pegList: Peg[] = [];

    for (let r = 0; r < rowCount; r++) {
      const pegsInThisRow = r + 3;
      const rowWidth = (pegsInThisRow - 1) * pegSpacing;
      const startX = centerX - rowWidth / 2;
      const y = topMargin + r * rowSpacing;

      for (let c = 0; c < pegsInThisRow; c++) {
        pegList.push({
          x: startX + c * pegSpacing,
          y: y,
          radius: Math.max(3.5, Math.min(5.5, pegSpacing * 0.12)),
          row: r,
          col: c,
          lastHitTime: 0,
          glowIntensity: 0,
        });
      }
    }

    const slotCount = rowCount + 1;
    // Slots fit under bottom pegs
    const bottomRowWidth = (maxPegsInBottom - 1) * pegSpacing;
    const slotWidth = bottomRowWidth / slotCount;
    const slotsStartX = centerX - bottomRowWidth / 2;
    const slotsY = topMargin + (rowCount - 0.25) * rowSpacing + 18;

    layoutRef.current = {
      width: boardWidth,
      height: boardHeight,
      pegSpacing,
      rowSpacing,
      startY: topMargin,
      pegRadius: Math.max(3.5, Math.min(5.5, pegSpacing * 0.12)),
      ballRadius: Math.max(6, Math.min(8.5, pegSpacing * 0.2)),
      slotsY,
      slotWidth,
      slotsStartX,
    };

    setPegs(pegList);
  }, []);

  // Update layout on container resize safely
  useEffect(() => {
    let rafId: number | null = null;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!entries || !entries.length || !containerRef.current || !canvasRef.current) return;
        const entry = entries[0];
        const width = Math.round(entry.contentRect.width);
        const height = Math.round(entry.contentRect.height);

        if (width <= 0 || height <= 0) return;

        // Skip if dimensions haven't significantly changed to avoid layout thrashing
        if (
          Math.abs(lastSizeRef.current.width - width) < 2 &&
          Math.abs(lastSizeRef.current.height - height) < 2
        ) {
          return;
        }

        lastSizeRef.current = { width, height };

        const dpr = window.devicePixelRatio || 1;
        const canvas = canvasRef.current;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.resetTransform?.();
          ctx.scale(dpr, dpr);
        }

        generatePegs(width, height, rows);
      });
    };

    const observer = new ResizeObserver(handleResize);

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [rows, generatePegs]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gravity = fastMode ? 0.46 : 0.28;
    const restitution = 0.58;

    const render = () => {
      const { width, height, slotsY, slotWidth, slotsStartX, ballRadius } = layoutRef.current;
      const now = performance.now();

      // Clear frame with deep gradient
      ctx.clearRect(0, 0, width, height);

      // Draw subtle background grid/glow in canvas
      const bgGlow = ctx.createRadialGradient(width / 2, height * 0.35, 10, width / 2, height * 0.45, width * 0.6);
      bgGlow.addColorStop(0, 'rgba(124, 58, 237, 0.08)');
      bgGlow.addColorStop(0.5, 'rgba(88, 28, 135, 0.04)');
      bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // --- 1. Draw Pegs ---
      pegs.forEach((peg) => {
        const timeSinceHit = now - peg.lastHitTime;
        const isHitRecent = timeSinceHit < 250;
        const hitIntensity = isHitRecent ? Math.max(0, 1 - timeSinceHit / 250) : 0;

        ctx.save();
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.radius + (hitIntensity * 2.5), 0, Math.PI * 2);

        if (hitIntensity > 0) {
          // Glowing peg flash
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 16 * hitIntensity;
          ctx.fill();

          // Outer ripple ring
          ctx.beginPath();
          ctx.arc(peg.x, peg.y, peg.radius + 12 * hitIntensity, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.8 * hitIntensity})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          // Standard sleek metallic peg with soft cyan sheen
          ctx.fillStyle = '#cbd5e1';
          ctx.shadowColor = 'rgba(148, 163, 184, 0.4)';
          ctx.shadowBlur = 4;
          ctx.fill();

          // Highlight dot
          ctx.beginPath();
          ctx.arc(peg.x - peg.radius * 0.3, peg.y - peg.radius * 0.3, peg.radius * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
        ctx.restore();
      });

      // --- 2. Update & Draw Particles (Sparks on hit) ---
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.alpha -= 0.035;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- 3. Update & Draw Balls ---
      const activeList = ballsRef.current;
      for (let bIndex = activeList.length - 1; bIndex >= 0; bIndex--) {
        const ball = activeList[bIndex];
        if (ball.resolved) continue;

        // Apply physics
        ball.vy += gravity;
        ball.vx *= 0.995;
        ball.vy *= 0.998;

        ball.x += ball.vx;
        ball.y += ball.vy;

        // Add trail dot
        ball.trail.push({ x: ball.x, y: ball.y, alpha: 0.8 });
        if (ball.trail.length > (fastMode ? 10 : 16)) {
          ball.trail.shift();
        }

        // Draw trail
        for (let t = 0; t < ball.trail.length; t++) {
          const pt = ball.trail[t];
          const trAlpha = (t / ball.trail.length) * 0.45;
          ctx.save();
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, ballRadius * (0.3 + (t / ball.trail.length) * 0.6), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(245, 158, 11, ${trAlpha})`;
          ctx.fill();
          ctx.restore();
        }

        // Check peg collisions
        for (let pIdx = 0; pIdx < pegs.length; pIdx++) {
          const peg = pegs[pIdx];
          const dx = ball.x - peg.x;
          const dy = ball.y - peg.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = ballRadius + peg.radius;

          if (dist < minDist && dist > 0.001) {
            // Collision normal
            const nx = dx / dist;
            const ny = dy / dist;

            // Push out
            const overlap = minDist - dist;
            ball.x += nx * overlap * 1.02;
            ball.y += ny * overlap * 1.02;

            // Reflect velocity with restitution
            const dot = ball.vx * nx + ball.vy * ny;
            if (dot < 0) {
              // Add slight random kick to prevent balls getting stuck vertically
              const randomJitter = (Math.random() - 0.5) * 0.55;
              ball.vx = (ball.vx - (1 + restitution) * dot * nx) + randomJitter;
              ball.vy = (ball.vy - (1 + restitution) * dot * ny) * 0.75 + 0.15;

              // Ensure downward velocity bias so ball doesn't bounce endlessly up
              if (ball.vy < -2) ball.vy = -2;

              peg.lastHitTime = now;
              sound.playPegHit(peg.row / rows);

              // Spawn hit sparks
              for (let s = 0; s < 3; s++) {
                particlesRef.current.push({
                  x: peg.x + nx * peg.radius,
                  y: peg.y + ny * peg.radius,
                  vx: (Math.random() - 0.5) * 2.5 + nx * 1.2,
                  vy: (Math.random() - 0.5) * 2.5 + ny * 1.2,
                  color: '#38bdf8',
                  size: Math.random() * 2 + 1,
                  alpha: 1,
                  life: 1,
                });
              }
            }
          }
        }

        // Walls / Left & Right board constraint (elastic pushback)
        const leftWall = width * 0.04;
        const rightWall = width * 0.96;
        if (ball.x < leftWall) {
          ball.x = leftWall;
          ball.vx = Math.abs(ball.vx) * 0.7;
        } else if (ball.x > rightWall) {
          ball.x = rightWall;
          ball.vx = -Math.abs(ball.vx) * 0.7;
        }

        // Check landing in bottom slots
        if (ball.y >= slotsY - 4) {
          ball.resolved = true;
          // Calculate slot index based on X
          const rawIndex = Math.floor((ball.x - slotsStartX) / slotWidth);
          const slotIndex = Math.max(0, Math.min(multipliers.length - 1, rawIndex));
          const multiplier = multipliers[slotIndex];

          // Trigger slot highlight
          slotFlashRef.current = { index: slotIndex, time: now };

          // Play sound
          sound.playMultiplierLand(multiplier);

          // Particles for slot landing
          const colors = getSlotColors(multiplier);
          for (let p = 0; p < 12; p++) {
            particlesRef.current.push({
              x: ball.x,
              y: slotsY + 10,
              vx: (Math.random() - 0.5) * 5,
              vy: -Math.random() * 4 - 1,
              color: colors.border,
              size: Math.random() * 3 + 1.5,
              alpha: 1,
              life: 1,
            });
          }

          // Callback to parent to update wallet & history
          onBallLanded(multiplier, ball.betAmount, slotIndex);
          onRemoveBall(ball.id);
          continue;
        }

        // Draw Ball (Glossy Golden/Red Neon Casino Orb)
        ctx.save();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);

        // Core ball gradient (Bright golden amber / flame)
        const ballGrad = ctx.createRadialGradient(
          ball.x - ballRadius * 0.35,
          ball.y - ballRadius * 0.35,
          ballRadius * 0.15,
          ball.x,
          ball.y,
          ballRadius
        );
        ballGrad.addColorStop(0, '#FFFBEB');
        ballGrad.addColorStop(0.3, '#FBBF24');
        ballGrad.addColorStop(0.7, '#EA580C');
        ballGrad.addColorStop(1, '#991B1B');

        ctx.fillStyle = ballGrad;
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 14;
        ctx.fill();

        // Inner specular highlight
        ctx.beginPath();
        ctx.arc(ball.x - ballRadius * 0.35, ball.y - ballRadius * 0.35, ballRadius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fill();

        ctx.restore();
      }

      // --- 4. Draw Multiplier Slots at Bottom of Canvas ---
      const slotCount = multipliers.length;
      const flash = slotFlashRef.current;

      for (let i = 0; i < slotCount; i++) {
        const mult = multipliers[i];
        const slotX = slotsStartX + i * slotWidth;
        const slotY = slotsY;
        const slotH = 44;
        const colors = getSlotColors(mult);

        const isFlashing = flash && flash.index === i && (now - flash.time) < 400;
        const flashIntensity = isFlashing ? Math.max(0, 1 - (now - flash.time) / 400) : 0;

        ctx.save();

        // Slot rounded box
        const radius = 6;
        const x = slotX + 2;
        const y = slotY - (flashIntensity * 5); // Little bounce jump
        const w = slotWidth - 4;
        const h = slotH;

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();

        // Background gradient
        if (isFlashing) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = colors.border;
          ctx.shadowBlur = 24 * flashIntensity;
        } else {
          ctx.fillStyle = colors.border;
          ctx.shadowColor = colors.glow;
          ctx.shadowBlur = 8;
        }
        ctx.fill();

        // Inner dark fill with subtle opacity
        ctx.fillStyle = isFlashing ? 'rgba(255,255,255,0.95)' : 'rgba(15, 12, 28, 0.45)';
        ctx.fill();

        // Slot border
        ctx.strokeStyle = isFlashing ? '#ffffff' : colors.border;
        ctx.lineWidth = isFlashing ? 2.5 : 1.5;
        ctx.stroke();

        // Top glossy specular bar
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 3);
        ctx.lineTo(x + w - 4, y + 3);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Multiplier Text
        ctx.fillStyle = isFlashing ? '#000000' : (colors.text || '#ffffff');
        ctx.font = `bold ${slotWidth < 40 ? 11 : 13}px 'Rajdhani', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;
        ctx.fillText(`${mult}x`, x + w / 2, y + h / 2 + 1);

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [rows, pegs, multipliers, fastMode, onBallLanded, onRemoveBall]);

  return (
    <div
      ref={containerRef}
      id="plinko-canvas-container"
      className="relative w-full h-full min-h-[400px] flex items-center justify-center select-none overflow-hidden rounded-xl bg-gradient-to-b from-[#130d24] via-[#0e091c] to-[#080511] border border-amber-500/20 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]"
    >
      {/* Top entry chute visualizer */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10">
        <div className="w-12 h-2.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600 shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
        <div className="w-6 h-3 bg-gradient-to-b from-amber-400/80 to-transparent border-x border-amber-300/40" />
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
    </div>
  );
};
