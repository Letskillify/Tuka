import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass, Search, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';

const NotFound = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}#products`);
    }
  };

  const quickCategories = [
    { label: "Handloom Sarees", query: "saree" },
    { label: "Silk Collections", query: "silk" },
    { label: "Chanderi Dupattas", query: "dupatta" },
    { label: "Bridal Lehengas", query: "lehenga" }
  ];

  return (
    <div className="min-h-screen bg-[#161114] text-white flex items-center justify-center px-6 py-20 font-sans overflow-hidden relative selection:bg-[#b13896] selection:text-white">
      
      {/* Glow Orbs & Ambient Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(177,56,150,0.18)_0%,transparent_65%)] blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(177,56,150,0.08)_0%,transparent_70%)] blur-[90px] pointer-events-none -z-10" />
      
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10" 
        style={{ backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`, backgroundSize: '32px 32px' }} 
      />

      <div className="text-center max-w-3xl mx-auto space-y-10 relative z-10">
        
        {/* Animated Badge & Icon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center justify-center gap-4"
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              y: [0, -8, 0]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="w-20 h-20 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center text-[#b13896] shadow-[0_0_50px_rgba(177,56,150,0.25)]"
          >
            <Compass size={38} strokeWidth={1.2} />
          </motion.div>

          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[11px] font-bold uppercase tracking-[0.3em] text-[#b13896]">
            <Sparkles size={12} /> Page Not Found
          </span>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="space-y-4"
        >
          <h1 className="text-7xl md:text-9xl font-serif font-light tracking-tight leading-none">
            4<span className="italic font-normal text-[#b13896]">0</span>4
          </h1>
          <h2 className="text-2xl md:text-4xl font-serif text-white/90 tracking-wide">
            Lost in Handloom Elegance
          </h2>
          <p className="text-white/60 text-xs md:text-sm font-sans tracking-[0.2em] uppercase max-w-lg mx-auto leading-relaxed pt-2">
            The masterpiece or drape you are searching for has been moved or is currently residing in our exclusive private vault.
          </p>
        </motion.div>

        {/* Live Search Input */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          onSubmit={handleSearch}
          className="relative max-w-md mx-auto group"
        >
          <div className="relative flex items-center">
            <Search size={18} className="absolute left-4 text-white/40 group-focus-within:text-[#b13896] transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sarees, dupattas, collections..."
              className="w-full pl-12 pr-28 py-3.5 bg-white/5 border border-white/10 rounded-full text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#b13896] focus:bg-white/10 backdrop-blur-md transition-all shadow-lg"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-5 py-2 rounded-full bg-[#b13896] hover:bg-[#972d7f] text-white text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
            >
              Search
            </button>
          </div>
        </motion.form>

        {/* Quick Category Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="space-y-3 pt-2"
        >
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-semibold">
            Or explore popular categories:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {quickCategories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => navigate(`/shop?q=${cat.query}#products`)}
                className="px-4 py-2 rounded-full bg-white/5 hover:bg-[#b13896]/20 border border-white/10 hover:border-[#b13896]/50 text-white/80 hover:text-white text-xs transition-all duration-300 backdrop-blur-sm cursor-pointer"
              >
                {cat.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
        >
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-[#161114] hover:bg-white/90 text-xs font-bold uppercase tracking-[0.2em] rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-95 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Return to Home
          </Link>

          <Link
            to="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full transition-all duration-300 shadow-xl shadow-[#b13896]/20 active:scale-95 group"
          >
            <ShoppingBag size={16} />
            Explore Store
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Brand Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-[11px] tracking-[0.3em] text-white/30 uppercase font-serif pt-10"
        >
          Tuka &copy; {new Date().getFullYear()} — Handcrafted Heritage & Luxury Sarees
        </motion.p>

      </div>
    </div>
  );
};

export default NotFound;
