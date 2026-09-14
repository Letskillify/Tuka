import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Heart } from 'lucide-react';

const TheEdit = () => {
  return (
    <section className="bg-[#FDFAF5] py-20 lg:py-32 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-10">
        
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-4 text-[#4a3f44]">
            <div className="w-8 lg:w-16 h-[1px] bg-[#e5d5df]" />
            <span className="text-[14px] md:text-[12px] tracking-[0.4em] font-bold uppercase">The Edit</span>
            <div className="w-8 lg:w-16 h-[1px] bg-[#e5d5df]" />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#161114] leading-tight">
            Trending Now. <span className="text-[#b13896] italic">Loved Always.</span>
          </h2>
          <p className="text-[#4a3f44] font-serif text-base md:text-lg">
            Discover what everyone is loving right now.
          </p>
        </div>

        {/* Promo Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Trending Luxe Card */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative bg-[#F1E9E2] rounded-2xl overflow-hidden flex flex-col md:flex-row h-full min-h-[450px] hover:shadow-[0_20px_50px_rgba(122,14,46,0.15)] hover:-translate-y-2 transition-all duration-700"
          >
            <div className="w-full md:w-1/2 p-10 flex flex-col justify-center space-y-6 z-10 relative">
              <div className="flex items-center gap-3 text-white md:text-[#b13896]">
                <Sparkles size={16} className="group-hover:rotate-12 transition-transform duration-500" />
                <span className="text-[14px] tracking-[0.3em] font-bold uppercase">Trending Luxe</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-serif text-white md:text-[#161114] leading-tight md:group-hover:text-[#b13896] transition-colors duration-500">
                Bold. Beautiful. <br />
                Unmistakably You.
              </h3>
              <p className="text-[14px]  text-white/80 md:text-[#4a3f44] font-serif leading-relaxed max-w-[250px]">
                This season's must-have designs, chosen for you.
              </p>
              <Link 
                to="/shop?filter=trending#products"
                className="bg-[#b13896] text-white px-8 py-3.5 text-[14px] tracking-[0.2em] font-bold uppercase transition-all w-fit shadow-xl hover:bg-[#5E0B24] group-hover:scale-105 active:scale-95"
              >
                Shop Trending
              </Link>
            </div>
            <div className="absolute right-0 bottom-0 top-0 w-full md:w-3/5 h-full overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1610030470298-40e1eaccf77d?auto=format&fit=crop&q=80&w=800"
                alt="Trending Handloom Saree"
                className="w-full h-full object-cover object-[center_20%] lg:object-center transition-transform duration-[1.5s] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#F1E9E2] via-[#F1E9E2]/40 to-transparent md:block hidden" />
              <div className="absolute inset-0 bg-black/40 md:hidden block" />
            </div>
          </motion.div>

          {/* Best Sellers Card */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative bg-[#EEEAE6] rounded-2xl overflow-hidden flex flex-col md:flex-row h-full min-h-[450px] hover:shadow-[0_20px_50px_rgba(122,14,46,0.15)] hover:-translate-y-2 transition-all duration-700"
          >
            <div className="w-full md:w-1/2 p-10 flex flex-col justify-center space-y-6 z-10 relative">
              <div className="flex items-center gap-3 text-white md:text-[#b13896]">
                <Heart size={16} className="group-hover:scale-110 transition-transform duration-500" />
                <span className="text-[14px] tracking-[0.3em] font-bold uppercase">Best Sellers</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-serif text-white md:text-[#161114] leading-tight md:group-hover:text-[#b13896] transition-colors duration-500">
                Loved for a Reason. <br />
                Chosen by You.
              </h3>
              <p className="text-[14px] text-white/80 md:text-[#4a3f44] font-serif leading-relaxed max-w-[250px]">
                Customer favorites that never go out of style.
              </p>
              <Link 
                to="/shop?filter=best-sellers#products"
                className="bg-[#b13896] text-white px-8 py-3.5 text-[14px] tracking-[0.2em] font-bold uppercase transition-all w-fit shadow-xl hover:bg-[#5E0B24] group-hover:scale-105 active:scale-95"
              >
                Shop Best Sellers
              </Link>
            </div>
            <div className="absolute right-0 bottom-0 top-0 w-full md:w-3/5 h-full overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1583390389001-8c9ac72a65f4?auto=format&fit=crop&q=80&w=800"
                alt="Best Sellers Handloom Saree"
                className="w-full h-full object-cover object-center transition-transform duration-[1.5s] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#EEEAE6] via-[#EEEAE6]/40 to-transparent md:block hidden" />
              <div className="absolute inset-0 bg-black/40 md:hidden block" />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default TheEdit;
