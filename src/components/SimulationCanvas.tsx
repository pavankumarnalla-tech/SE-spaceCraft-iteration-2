import React, { useRef, useEffect } from 'react';
import { SimulationEngine } from '../simulation/SimulationEngine';

interface CanvasProps {
  engine: SimulationEngine;
  width?: number;
  height?: number;
}

export const SimulationCanvas: React.FC<CanvasProps> = ({ engine, width = 900, height = 500 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      engine.update(dt);

      // Background
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawBackgroundGrid(ctx, canvas.width, canvas.height);

      const craftPos = engine.spacecraft.getState().position;
      const destPos = engine.environment.getDestination().position;

      // Intended Path (Simple dashed line from spacecraft to target)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(craftPos.x, craftPos.y);
      ctx.lineTo(destPos.x, destPos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      drawDestination(ctx, engine.environment.getDestination());
      
      const obstacles = engine.environment.getObstacles();
      obstacles.forEach(obs => drawObstacle(ctx, obs));

      drawSpacecraft(ctx, engine);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [engine]);

  return (
    <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-auto block"
      />
    </div>
  );
};

function drawBackgroundGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
}

function drawDestination(ctx: CanvasRenderingContext2D, dest: any) {
  const { x, y } = dest.position;
  
  // Target marker
  ctx.fillStyle = '#0ea5e9'; // sky-500
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#38bdf8'; // sky-400
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, dest.arrivalRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Label
  ctx.fillStyle = '#e2e8f0'; // slate-200
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TARGET', x, y + dest.arrivalRadius + 16);
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: any) {
  const { x, y } = obs.position;
  
  // Physical obstacle
  ctx.fillStyle = '#ef4444'; // red-500
  ctx.beginPath();
  ctx.arc(x, y, obs.radius, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.fillStyle = '#e2e8f0'; // slate-200
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OBSTACLE', x, y + obs.radius + 14);
}

function drawSpacecraft(ctx: CanvasRenderingContext2D, engine: SimulationEngine) {
  const craft = engine.spacecraft.getState();
  const { x, y } = craft.position;

  ctx.save();
  ctx.translate(x, y);
  
  ctx.rotate(craft.heading);

  // Flame (only when moving)
  if (craft.speed > 0.1) {
    const flameSize = 10 + Math.random() * 5;
    ctx.fillStyle = '#f97316'; // orange-500
    ctx.beginPath();
    ctx.moveTo(-12, -4);
    ctx.lineTo(-12 - flameSize, 0);
    ctx.lineTo(-12, 4);
    ctx.closePath();
    ctx.fill();
  }

  // Hull color reflects active spacecraft subsystem state
  if (craft.status === 'AVOIDING') {
    ctx.fillStyle = '#f43f5e'; // rose-500
  } else if (craft.status === 'REPLANNING') {
    ctx.fillStyle = '#eab308'; // yellow-500
  } else if (craft.status === 'EXECUTING_TASK') {
    ctx.fillStyle = '#10b981'; // emerald-500
  } else {
    ctx.fillStyle = '#f8fafc'; // slate-50
  }

  ctx.beginPath();
  ctx.moveTo(16, 0);       // Nose
  ctx.lineTo(-12, -10);    // Back left
  ctx.lineTo(-6, 0);       // Back center
  ctx.lineTo(-12, 10);     // Back right
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Task execution ring effect around craft when executing mission task
  if (craft.status === 'EXECUTING_TASK') {
    const pulseRadius = 22 + Math.sin(performance.now() * 0.01) * 5;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}
