import React from 'react';
import { motion } from 'framer-motion';

const MAGENTA = '#b13896';
const DARK = '#161114';
const SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

/**
 * Standardized SectionHeader component for Homepage sections.
 */
const SectionHeader = ({
  badgeText,
  badgeIcon,
  titlePrefix,
  highlightText,
  titleSuffix = '',
  description,
  darkTheme = false,
  centered = true,
  className = '',
}) => {
  const textColor = darkTheme ? '#FFFFFF' : DARK;
  const descColor = darkTheme ? 'rgba(255, 255, 255, 0.7)' : '#6B7280';

  return (
    <div className={`flex flex-col ${centered ? 'items-center text-center justify-center' : 'items-start text-left'} mb-8 lg:mb-10 gap-2.5 ${className}`}>
      {/* Eyebrow Badge */}
      {badgeText && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full"
          style={{
            background: darkTheme ? 'rgba(177,56,150,0.15)' : 'rgba(177,56,150,0.08)',
            border: '1px solid rgba(177,56,150,0.25)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {badgeIcon ? (
            React.cloneElement(badgeIcon, { size: 12, style: { color: MAGENTA } })
          ) : (
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: MAGENTA }} />
          )}
          <span
            className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase font-bold"
            style={{ color: darkTheme ? '#f3c7ea' : MAGENTA, fontFamily: SANS }}
          >
            {badgeText}
          </span>
        </motion.div>
      )}

      {/* Main Section Title */}
      <motion.h2
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="font-light leading-tight tracking-tight text-2xl sm:text-3xl md:text-4xl lg:text-4xl"
        style={{ color: textColor, fontFamily: SERIF }}
      >
        {titlePrefix}{' '}
        {highlightText && (
          <em
            className="italic font-normal"
            style={{
              color: MAGENTA,
              textShadow: darkTheme ? '0 0 20px rgba(177,56,150,0.4)' : 'none',
            }}
          >
            {highlightText}
          </em>
        )}
        {titleSuffix && ` ${titleSuffix}`}
      </motion.h2>

      {/* Sub-description */}
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`text-[14px] sm:text-[15px] lg:text-[16px] leading-relaxed font-light ${centered ? 'max-w-2xl mx-auto' : 'max-w-xl'}`}
          style={{ color: descColor, fontFamily: SANS }}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
};

export default SectionHeader;
