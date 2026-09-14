import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PremiumPreloader = ({ onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 1100; // Smooth 1.1s loading duration

    let animationFrameId;

    const updateCounter = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      // Smooth ease-out cubic curve for natural luxurious progression
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(easeProgress * 100);

      setCounter(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      } else {
        // Short pause at 100% before triggering completion transition
        setTimeout(() => {
          setLoading(false);
          if (onComplete) {
            setTimeout(onComplete, 500); // Trigger after exit animation starts
          }
        }, 180);
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [onComplete]);

  // Luxury ease curve
  const luxuryEase = [0.16, 1, 0.3, 1];

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 0.97,
            filter: "blur(10px)",
            transition: { duration: 0.55, ease: luxuryEase }
          }}
          className="fixed inset-0 z-[9999] bg-[#0e090d] text-white flex items-center justify-center p-4 overflow-hidden select-none"
        >
          {/* Subtle Ambient Radial Glow */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.25, 0.4, 0.25],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(177,56,150,0.22)_0%,rgba(157,2,122,0.08)_45%,transparent_70%)] pointer-events-none blur-3xl"
          />

          {/* Micro Grain Texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Compact Centered Luxury Capsule Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: luxuryEase }}
            className="relative z-10 w-full max-w-[360px] sm:max-w-[400px] p-7 sm:p-9 rounded-3xl bg-[#160f15]/85 backdrop-blur-2xl border border-[#b13896]/20 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(177,56,150,0.1)] flex flex-col items-center text-center overflow-hidden"
          >
            {/* Top Accent Shimmer Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#b13896]/50 to-transparent" />

            {/* Brand Logo */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: luxuryEase }}
              className="mb-4 flex justify-center items-center"
            >
              <img
                src="/img/Tuka-Logo.svg"
                alt="Tuka"
                className="h-10 sm:h-12 w-auto object-contain"
                style={{ filter: 'brightness(0) invert(1) drop-shadow(0 2px 10px rgba(177,56,150,0.3))' }}
              />
            </motion.div>

            {/* Brand Subtitle & Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: luxuryEase }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.32em] uppercase text-[#e9bee0]/90">
                Authentic Bengal Handloom
              </span>
              <span className="text-[8.5px] sm:text-[9px] font-medium tracking-[0.24em] uppercase text-[#b13896]/70 mt-0.5">
                Kolkata &bull; Bishnupur &bull; Dhaniakhali
              </span>
            </motion.div>

            {/* Micro Progress Loader Section */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: luxuryEase }}
              className="w-full mt-7 flex flex-col items-center gap-2.5"
            >
              {/* Micro Progress Track */}
              <div className="w-full h-[3px] bg-[#b13896]/15 rounded-full relative overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#9d027a] via-[#b13896] to-[#f2bce4] rounded-full"
                  style={{ width: `${counter}%` }}
                  transition={{ ease: "linear" }}
                />
                {/* Glowing edge node */}
                <motion.div
                  className="absolute top-0 h-full w-3 bg-[#ffffff] blur-[1px] -translate-x-1/2"
                  style={{ left: `${counter}%`, opacity: counter > 0 && counter < 100 ? 0.8 : 0 }}
                />
              </div>

              {/* Progress Labels */}
              <div className="w-full flex items-center justify-between text-[10px] font-mono tracking-wider text-[#b13896]/80">
                <span className="text-[9px] uppercase tracking-[0.2em] font-sans font-medium text-white/50">Crafting Elegance</span>
                <span className="font-semibold tabular-nums text-[#f2bce4]">{counter}%</span>
              </div>
            </motion.div>

            {/* Bottom Subtle Reflection */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 h-20 bg-[#b13896]/10 rounded-full blur-2xl pointer-events-none" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PremiumPreloader;
