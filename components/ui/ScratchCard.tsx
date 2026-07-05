'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScratchCardProps {
  onReveal: () => void;
  rewardText: string;
}

export default function ScratchCard({ onReveal, rewardText }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill overlay
    ctx.fillStyle = '#2c2c2c'; // Dark charcoal
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add metallic/scratch pattern texture (simple noise)
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#1a1a1a' : '#3e3e3e';
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
    
    // Add text overlay
    ctx.fillStyle = '#facc15'; // Gold
    ctx.font = 'bold 20px serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCRATCH TO REVEAL', canvas.width / 2, canvas.height / 2 + 7);
  }, []);

  const handleScratch = (e: any) => {
    if (isRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    checkReveal();
  };

  const checkReveal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentCount = 0;
    
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentCount++;
    }

    const totalPixels = pixels.length / 4;
    const percent = (transparentCount / totalPixels) * 100;
    setScratchPercent(percent);

    if (percent > 40 && !isRevealed) {
      setIsRevealed(true);
      onReveal();
      // Fade out canvas entirely
      canvas.style.transition = 'opacity 0.5s ease-out';
      canvas.style.opacity = '0';
      setTimeout(() => {
        canvas.style.pointerEvents = 'none';
      }, 500);
    }
  };

  return (
    <div className="relative w-[300px] h-[150px] mx-auto rounded-2xl overflow-hidden shadow-2xl border-4 border-yellow-500/20 bg-gradient-to-br from-yellow-50 to-orange-100">
      
      {/* Reward Content (Underneath) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
        <Gift className="text-yellow-600 mb-2" size={32} />
        <h3 className="text-xl font-serif font-bold text-gray-900">{rewardText}</h3>
        <p className="text-xs text-gray-500 font-medium tracking-widest mt-1">APPLIED TO WALLET</p>
      </div>

      {/* Confetti Overlay */}
      {isRevealed && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
        >
          <Sparkles className="text-yellow-500 absolute top-4 left-4 animate-ping" size={24} />
          <Sparkles className="text-yellow-600 absolute bottom-4 right-4 animate-pulse" size={20} />
        </motion.div>
      )}

      {/* Canvas Overlay */}
      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        className="absolute inset-0 w-full h-full cursor-pointer touch-none"
        onMouseMove={(e) => e.buttons === 1 && handleScratch(e)}
        onTouchMove={handleScratch}
      />
    </div>
  );
}
