import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../Firebase';
import SectionHeader from './SectionHeader';

const categories = [
  {
    id: 1,
    key: 'saree',
    name: 'SAREE',
    image: 'https://images.unsplash.com/photo-1610030470298-40e1eaccf77d?auto=format&fit=crop&q=80&w=1000',
    link: '/shop?cat=saree#products'
  },
  {
    id: 2,
    key: 'blouse',
    name: 'BLOUSE',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1000',
    link: '/shop?cat=blouse#products'
  },
  {
    id: 3,
    key: 'newin',
    name: 'NEW IN',
    image: 'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?auto=format&fit=crop&q=80&w=1000',
    link: '/shop?cat=new-in#products'
  },
  {
    id: 4,
    key: 'boutique',
    name: 'BOUTIQUE COLLECTION',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1000',
    link: '/shop?cat=boutique-collection#products'
  }
];

const MAGENTA = '#b13896';
const DARK = '#161114';
const LIGHT_BG = '#FBF9FA';
const SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const CategorySection = () => {
  const [catSettings, setCatSettings] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "homepage"), (snap) => {
      if (snap.exists()) {
        setCatSettings(snap.data());
      }
    });
    return () => unsub();
  }, []);

  const displayCategories = categories.map((cat) => ({
    ...cat,
    image: catSettings?.[`categoryImage_${cat.key}`] || cat.image,
  }));

  return (
    <section
      className="py-10 lg:py-16 overflow-hidden relative"
      style={{ backgroundColor: LIGHT_BG }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">

        {/* Standardized Unified Section Header */}
        <SectionHeader
          badgeText="EXCLUSIVE CURATION"
          badgeIcon={<Sparkles />}
          titlePrefix="Shop By"
          highlightText="Category"
          description="Hand-curated luxury collections meticulously crafted for bridal, groom, and contemporary celebrations."
        />

        {/* Categories Grid (Flush desktop, ultra-premium rounded cards on mobile) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {displayCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden aspect-[3/4] sm:aspect-[2/3] w-full rounded-2xl lg:rounded-none border border-black/5 shadow-md lg:shadow-none cursor-pointer"
            >
              <Link to={category.link} className="block w-full h-full relative">

                {/* Background Image */}
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]"
                />

                {/* Dark Editorial Overlay */}
                <div
                  className="absolute inset-0 transition-opacity duration-500 opacity-65 group-hover:opacity-80 z-10"
                  style={{
                    background: 'linear-gradient(to top, rgba(22, 17, 20, 0.95) 0%, rgba(22, 17, 20, 0.35) 50%, transparent 80%)'
                  }}
                />

                {/* Subtle Hover Magenta Tint overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity duration-700 z-10 pointer-events-none"
                  style={{ background: MAGENTA }}
                />

                {/* Text Overlay */}
                <div className="absolute inset-x-0 bottom-6 sm:bottom-8 z-20 flex flex-col items-center justify-center space-y-2.5 px-3">
                  <span className="text-[9px] tracking-[0.3em] font-extrabold uppercase text-[#f4cfeb] opacity-80">
                    HERITAGE WEAVE
                  </span>
                  <h3
                    className="text-white text-xs sm:text-sm lg:text-base font-semibold tracking-[0.2em] text-center transition-all duration-300 group-hover:tracking-[0.25em]"
                    style={{ fontFamily: SANS }}
                  >
                    {category.name}
                  </h3>

                  {/* Subtle growing boundary line */}
                  <span
                    className="h-[1.5px] w-6 group-hover:w-10 transition-all duration-500 ease-out"
                    style={{ background: MAGENTA }}
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;