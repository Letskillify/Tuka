import React from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

const NewsletterBar = () => {
  return (
    <section className="bg-[#b13896] py-12 lg:py-16">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left: Text */}
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white">
            <Mail size={28} strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl lg:text-2xl font-serif text-white italic">Be the first to know</h3>
            <p className="text-[14px] lg:text-[14px] tracking-[0.2em] font-bold text-white/70 uppercase">
              Exclusive offers, new arrivals & style updates straight to your inbox.
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <form className="w-full lg:w-1/2 flex flex-col sm:flex-row gap-4">
          <input 
            type="email" 
            placeholder="Enter your email address" 
            className="flex-1 bg-transparent border border-white/30 px-6 py-4 text-white text-sm focus:outline-none focus:border-white transition-colors"
            required
          />
          <button 
            type="submit"
            className="bg-white text-[#b13896] px-10 py-4 text-[14px] tracking-[0.2em] font-bold uppercase hover:bg-[#F8F4EF] transition-all duration-500"
          >
            Subscribe
          </button>
        </form>

      </div>
    </section>
  );
};

export default NewsletterBar;
