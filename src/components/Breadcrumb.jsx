import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const MAGENTA = '#b13896';
const SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const Breadcrumb = ({ 
  title, 
  subtitle, 
  links = [],
}) => {
  return (
    <div className="relative w-full pt-28 pb-10 sm:pt-32 sm:pb-14 px-6 sm:px-12 bg-[#161114] text-white overflow-hidden border-b border-white/10">
      
      {/* Luxurious Ambient Spotlight Glows */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, ${MAGENTA} 0%, transparent 65%)`,
          filter: 'blur(50px)'
        }}
      />
      <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(177,56,150,0.4), transparent)' }} />
      <div className="absolute bottom-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

      <div className="max-w-[1280px] mx-auto text-center flex flex-col items-center relative z-10">
        
        {/* Back to Home & Breadcrumb Trail */}
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase mb-4"
          style={{ fontFamily: SANS }}
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 hover:bg-[#b13896] text-white/90 hover:text-white border border-white/15 transition-all duration-300 group cursor-pointer shadow-sm"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform text-[#f4cfeb]" />
            <span>Home</span>
          </Link>

          {links && links.length > 0 && (
            <div className="flex items-center gap-2 text-white/40">
              {links.map((link, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight size={12} className="text-white/30" />
                  {link.active ? (
                    <span className="text-[#f4cfeb] font-bold px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10">
                      {link.name}
                    </span>
                  ) : (
                    <Link to={link.href} className="text-white/70 hover:text-white transition-colors">
                      {link.name}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </motion.div>

        {/* Centered Page Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-tight max-w-3xl"
          style={{ fontFamily: SERIF }}
        >
          {title}
        </motion.h1>

        {/* Decorative Magenta Accent Line */}
        <motion.div 
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-16 h-[2px] bg-[#b13896] my-4 rounded-full"
        />

        {/* Subtitle */}
        {subtitle && (
          <motion.p 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-xs sm:text-sm text-white/75 font-light tracking-wide max-w-lg leading-relaxed"
            style={{ fontFamily: SANS }}
          >
            {subtitle}
          </motion.p>
        )}

      </div>
    </div>
  );
};

export default Breadcrumb;
