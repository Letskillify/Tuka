import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../Firebase';

const EditorialBanner = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "homepage"), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });
    return () => unsub();
  }, []);

  const bgImg = settings?.editorialImage || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&auto=format&fit=crop&q=80";

  return (
    <section className="px-4 lg:px-10 py-16 bg-[#FDFAF5]">
      <div className="relative w-full h-[550px] md:h-[600px] lg:h-[750px] rounded-[32px] md:rounded-[48px] overflow-hidden group border border-[#C9A96E]/20 shadow-[0_20px_50px_rgba(44,26,14,0.08)]">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={bgImg} 
            alt="Editorial Banner"
            className="w-full h-full object-cover transition-transform duration-[8s] group-hover:scale-110 opacity-60"
          />
          {/* Light-themed Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FDFAF5]/95 via-[#FDFAF5]/60 to-transparent md:from-[#FDFAF5]" /> 
        </div>

        {/* Content Overlay */}
        <div className="relative h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-4xl space-y-8 md:space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex gap-4"
          >
            {['JOURNAL', 'CRAFTSMANSHIP'].map(tag => (
              <span key={tag} className="bg-[#640D14]/10 backdrop-blur-md border border-[#640D14]/20 px-4 md:px-5 py-2 rounded-full text-[9px] md:text-[14px] tracking-[0.3em] font-black text-[#640D14] uppercase">
                {tag}
              </span>
            ))}
          </motion.div>

          <div className="space-y-6 md:space-y-8">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 1 }}
              className="font-serif text-[#2C1A0E] leading-[1.1] tracking-tight"
            >
              <span 
                style={{ fontFamily: 'var(--font-script)', fontWeight: 100 }} 
                className="text-6xl md:text-7xl lg:text-7xl block mb-2 md:mb-6 text-[#640D14]/60"
              >
                From Mine, to Klein,
              </span>
              <span className="text-3xl md:text-5xl lg:text-6xl block italic font-light leading-snug">
                to You: The Evolution of a Diamond Dynasty
              </span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 1 }}
              className="text-[#5C3D1E] text-sm md:text-lg font-sans leading-relaxed max-w-2xl font-medium"
            >
              Mark Klein greets me with the easy confidence of a third-generation diamantaire. His desk tells a deeper story—part archive, part playground where light is sculpted into legacy. Discover the visionary approach behind our most iconic creations.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="text-[#640D14]/60 text-[14px] md:text-[14px] tracking-[0.4em] font-black uppercase pt-6 flex items-center gap-6"
          >
            <span className="h-[1px] w-12 bg-[#640D14]/30"></span>
            WRITTEN BY KATERINA PEREZ
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="pt-4"
          >
            <Link
              to="/journal?story=diamond-dynasty#story"
              className="inline-block px-10 py-4 bg-[#640D14] text-[#FDFAF5] text-[14px] tracking-[0.3em] font-black uppercase rounded-full hover:bg-[#2C1A0E] transition-colors duration-500 shadow-xl shadow-[#640D14]/20"
            >
              Read the Story
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default EditorialBanner;

