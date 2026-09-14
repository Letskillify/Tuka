import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Heart, Share2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const MAGENTA = '#b13896';
const SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const ProductDetailHero = ({ 
  product, 
  activePrice, 
  activeOriginalPrice, 
  discountPercent, 
  isWishlisted, 
  onWishlistClick, 
  wishlistLoading 
}) => {
  const navigate = useNavigate();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on Tuka!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Product link copied to clipboard!');
    }
  };

  return (
    <div className="relative w-full pt-20 sm:pt-24 pb-6 sm:pb-8 px-4 sm:px-8 bg-[#161114] text-white overflow-hidden border-b border-white/10">
      
      {/* Luxury Ambient Spotlight & Hairline Borders */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 20%, ${MAGENTA} 0%, transparent 65%)`,
          filter: 'blur(45px)'
        }}
      />
      <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(177,56,150,0.4), transparent)' }} />
      <div className="absolute bottom-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

      <div className="max-w-[1440px] mx-auto relative z-10 flex flex-col items-center text-center">
        
        {/* Navigation & Action Bar */}
        <div className="w-full flex items-center justify-between gap-4 mb-3 sm:mb-5">
          
          {/* Left: Back Navigation Pill */}
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase" style={{ fontFamily: SANS }}>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-white/10 hover:bg-[#b13896] text-white/90 hover:text-white border border-white/15 transition-all duration-300 group cursor-pointer shadow-sm"
            >
              <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform text-[#f4cfeb]" />
              <span>Back</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-white/40">
              <span>/</span>
              <Link to="/shop" className="text-white/60 hover:text-white transition-colors">
                Shop
              </Link>
              {product.category && (
                <>
                  <span>/</span>
                  <Link to={`/shop?cat=${encodeURIComponent(product.category)}`} className="text-[#f4cfeb] font-semibold">
                    {product.category}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right: Quick Share & Wishlist */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15 transition-all cursor-pointer"
              title="Share Product"
            >
              <Share2 size={14} />
            </button>
            <button
              onClick={onWishlistClick}
              disabled={wishlistLoading}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                isWishlisted
                  ? 'bg-[#b13896] border-[#b13896] text-white'
                  : 'bg-white/10 hover:bg-[#b13896] border-white/15 text-white/80 hover:text-white'
              }`}
              title="Add to Wishlist"
            >
              <Heart size={14} fill={isWishlisted ? "currentColor" : "none"} />
            </button>
          </div>

        </div>

        {/* Category & Craft Pill */}
        <motion.div 
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-[#b13896]/40 bg-[#b13896]/15 backdrop-blur-md text-[9px] sm:text-[10px] font-bold tracking-[0.22em] text-[#f4cfeb] uppercase mb-2 shadow-sm"
          style={{ fontFamily: SANS }}
        >
          <Sparkles size={11} className="text-[#f4cfeb]" />
          <span>{product.category || 'HANDLOOM MASTERPIECE'}</span>
          {product.subCategory && <span className="opacity-70">• {product.subCategory}</span>}
        </motion.div>

        {/* Compact & Premium Product Name */}
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-white leading-tight max-w-4xl px-2 py-3"
          style={{ fontFamily: SERIF }}
        >
          {product.name}
        </motion.h1>

        {/* Highlights Strip: Price, Discount & Authenticity */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs"
          style={{ fontFamily: SANS }}
        >
          {/* Price Badge */}
          <div className="flex items-baseline gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15">
            <span className="font-semibold text-white text-sm sm:text-base">
              ₹{Number(activePrice).toLocaleString()}
            </span>
            {activeOriginalPrice > activePrice && (
              <span className="text-xs text-white/50 line-through">
                ₹{Number(activeOriginalPrice).toLocaleString()}
              </span>
            )}
          </div>

          {/* Savings pill */}
          {discountPercent > 0 && (
            <span className="px-3 py-1 rounded-full bg-[#b13896] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
              Save {discountPercent}%
            </span>
          )}

          {/* Authenticity mark */}
          <div className="flex items-center gap-1.5 text-white/70 text-[10px] uppercase font-semibold tracking-wider">
            <ShieldCheck size={13} className="text-[#f4cfeb]" />
            <span>100% Handloom Certified</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default ProductDetailHero;
