import React from 'react';
import { motion } from 'framer-motion';

const MAGENTA = '#b13896';
const DARK  = '#161114';
const SANS    = "'Plus Jakarta Sans', 'Inter', sans-serif";

const items = [
  '🪷 Handloom Sarees',
  '✦ Bishnupuri Pure Silk',
  '✿ Designer Blouses',
  '🌸 Dhaniakhali & Begampuri',
  '✦ Handspun Khadi',
  '🛍 Fine Linen Jamdani',
  '💫 4.9★ Customer Rated',
  '✦ Free Pan India Shipping',
  '🪷 Authentic Loom Mark Certified',
  '✦ Easy 30-Day Returns',
];

const Marquee = () => {
  const doubled = [...items, ...items];

  return (
    <div
      className="w-full overflow-hidden py-3.5"
      style={{ background: DARK, borderTop: `1px solid ${MAGENTA}25`, borderBottom: `1px solid ${MAGENTA}25` }}
    >
      <div className="relative flex">
        <motion.div
          className="flex shrink-0 gap-0"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 32, ease: 'linear', repeat: Infinity }}
        >
          {doubled.map((item, index) => (
            <span
              key={index}
              className="shrink-0 px-10 text-[13px] lg:text-[13px] tracking-[0.25em] uppercase font-bold whitespace-nowrap"
              style={{ color: MAGENTA, fontFamily: SANS }}
            >
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Marquee;
