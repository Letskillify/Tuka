import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Palette, Scissors, ArrowRight, ShieldCheck, Feather, Layers, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../Firebase';
import SectionHeader from './SectionHeader';

const MAGENTA = '#b13896';
const DARK = '#161114';
const LIGHT_BG = '#FDFBF9';
const SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const hindshreeCollections = [
  {
    id: 'mul-cotton',
    name: 'Mul Cotton',
    category: 'Cotton',
    tag: 'Ultra-Soft Malmal',
    desc: 'Lightweight, breathable, semi-sheer Malmal cotton woven for effortless summer elegance.',
    image: 'https://images.unsplash.com/photo-1610030470298-40e1eaccf77d?auto=format&fit=crop&q=80&w=600',
    link: '/shop?cat=mul-cotton#products'
  },
  {
    id: 'hand-paint',
    name: 'Hand Paint',
    category: 'Craft',
    tag: 'Wearable Canvas',
    desc: 'Freehand motif paintings crafted with organic natural dyes by rural Bengal weavers.',
    image: 'https://images.unsplash.com/photo-1583390389001-8c9ac72a65f4?auto=format&fit=crop&q=80&w=600',
    link: '/shop?cat=hand-paint#products'
  },
  {
    id: 'applic',
    name: 'Applic',
    category: 'Craft',
    tag: 'Appliqué Stitched',
    desc: 'Intricate geometric fabric cutout stitching celebrating age-old Bengali needlecraft.',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600',
    link: '/shop?cat=applic#products'
  },
  {
    id: 'ikkat-cotton',
    name: 'Ikkat Cotton',
    category: 'Cotton',
    tag: 'Resist-Dyed Warp',
    desc: 'Precision tie-and-dye warp patterns interlaced into vibrant, long-lasting cotton sarees.',
    image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600',
    link: '/shop?cat=ikkat-cotton#products'
  },
  {
    id: 'plain-khadi',
    name: 'Plain Khadi',
    category: 'Khadi',
    tag: 'Hand-Spun Purity',
    desc: 'Raw, unbleached hand-spun khadi yarn delivering rich tactile depth and organic warmth.',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=600',
    link: '/shop?cat=plain-khadi#products'
  },
  {
    id: 'khadi-applic',
    name: 'Khadi Applic',
    category: 'Khadi',
    tag: 'Textured Craft',
    desc: 'Hand-spun khadi fabric embellished with handcrafted appliqué motif patches.',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=600',
    link: '/shop?cat=khadi-applic#products'
  },
  {
    id: 'dongri-khadi',
    name: 'Dongri Khadi',
    category: 'Khadi',
    tag: 'Rustic Slub Weave',
    desc: 'Thick, slubbed khadi yarn engineered for a structured drape and rich textured feel.',
    image: 'https://images.unsplash.com/photo-1584949514123-474cfa705df2?auto=format&fit=crop&q=80&w=600',
    link: '/shop?cat=dongri-khadi#products'
  },
  {
    id: 'baluchari-khadi',
    name: 'Baluchari Khadi',
    category: 'Khadi',
    tag: 'Narrative Borders',
    desc: 'Intricate story borders inspired by classical Bengal terracotta art on hand-spun khadi.',
    image: 'https://images.unsplash.com/photo-1606744881023-e5d4cb05c48b?auto=format&fit=crop&q=80&w=600',
    link: '/shop?cat=baluchari-khadi#products'
  },
  {
    id: 'tissue-linen',
    name: 'Tissue Linen',
    category: 'Linen',
    tag: 'Metallic Metallic Glow',
    desc: 'Fine Zari metallic threads interlaced with pure flax linen for a subtle golden shimmer.',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=600',
    link: '/shop?cat=tissue-linen#products'
  },
  {
    id: 'plain-linen',
    name: 'Plain Linen',
    category: 'Linen',
    tag: 'Natural Luxury Flax',
    desc: 'Pure European flax linen featuring a crisp, breathable drape and slubbed organic texture.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600',
    link: '/shop?cat=plain-linen#products'
  },
  {
    id: 'linen-jamdani',
    name: 'Linen Jamdani',
    category: 'Linen',
    tag: 'Supplementary Weft',
    desc: 'Featherlight linen adorned with hand-inserted translucent Jamdani geometric motifs.',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600',
    link: '/shop?cat=linen-jamdani#products'
  }
];

const categories = ['All', 'Cotton', 'Craft', 'Khadi', 'Linen'];

const HindshreeSection = () => {
  const [activeCategory, setActiveCategory] = useState('Cotton');
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "homepage"), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });
    return () => unsub();
  }, []);

  const bannerImg = settings?.hindshreeBannerImage || "https://images.unsplash.com/photo-1583390389001-8c9ac72a65f4?auto=format&fit=crop&q=80&w=1000";

  const [activeTab, setActiveTab] = useState('All');

  const filteredCollections = activeTab === 'All'
    ? hindshreeCollections
    : hindshreeCollections.filter(item => item.category === activeTab);

  return (
    <section className="py-12 lg:py-20 bg-[#161114] text-white relative overflow-hidden">
      {/* Background Subtle Accent Glows */}
      <div
        className="absolute top-1/4 left-0 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ background: MAGENTA }}
      />
      <div
        className="absolute bottom-1/4 right-0 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-15"
        style={{ background: '#d97706' }}
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10">

        {/* Top Header & Brand Narrative Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-10 lg:mb-14">

          {/* Model Image Column */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
              <img
                src={bannerImg}
                alt="Hindshree Bengal Handloom Model"
                className="w-full h-[480px] sm:h-[560px] object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />

              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#161114] via-transparent to-transparent opacity-80" />

              {/* Badge top left */}
              <div
                className="absolute top-5 left-5 z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
                style={{ background: 'rgba(22,17,20,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(177,56,150,0.4)' }}
              >
                <Sparkles size={14} style={{ color: MAGENTA }} />
                <span className="text-[10px] tracking-[0.25em] text-white font-bold uppercase" style={{ fontFamily: SANS }}>
                  Hindshree Heritage
                </span>
              </div>

              {/* Caption Overlay bottom left */}
              <div className="absolute bottom-6 left-6 right-6 z-10 space-y-2">
                <span className="text-[10px] tracking-[0.3em] uppercase text-white/60 font-medium block" style={{ fontFamily: SANS }}>
                  BENGAL HANDLOOM STUDIO
                </span>
                <p className="text-white text-xl sm:text-2xl font-light leading-snug" style={{ fontFamily: SERIF }}>
                  "Where every thread is an artist's brushstroke."
                </p>
              </div>
            </div>

            {/* Glowing Backdrop Circle */}
            <div
              className="absolute -inset-4 rounded-3xl -z-10 opacity-20 blur-3xl"
              style={{ background: `radial-gradient(circle, ${MAGENTA} 0%, transparent 70%)` }}
            />
          </div>

          {/* Description & Narrative Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full" style={{ background: `${MAGENTA}20`, border: `1px solid ${MAGENTA}40` }}>
              <Palette size={14} style={{ color: '#f3c7ea' }} />
              <span className="text-[11px] tracking-[0.3em] font-bold uppercase text-white/90" style={{ fontFamily: SANS }}>
                Hindshree Saree Collection
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight leading-tight" style={{ fontFamily: SERIF }}>
              Bengal Handloom & <br />
              <em className="italic font-normal" style={{ color: MAGENTA }}>
                Unbound Creativity
              </em>
            </h2>

            <p className="text-sm sm:text-base text-white/70 font-light leading-relaxed" style={{ fontFamily: SANS }}>
              Hindshree is a tribute to Bengal’s rich handloom ecosystem—where ancient pit looms meet contemporary artistic experimentation. From delicate hand-painted motifs and hand-stitched appliqué art to raw, textured khadi and tissue linen glows, Hindshree celebrates the unlimited creative capacity of Bengal's weavers and painters.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}>
                <Feather size={20} className="mb-2" style={{ color: MAGENTA }} />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1" style={{ fontFamily: SANS }}>100% Hand-Spun</h4>
                <p className="text-[11px] text-white/50 font-light" style={{ fontFamily: SANS }}>Natural cotton, khadi & linen yarn purity.</p>
              </div>

              <div className="p-4 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}>
                <Palette size={20} className="mb-2" style={{ color: MAGENTA }} />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1" style={{ fontFamily: SANS }}>Artistic Painting</h4>
                <p className="text-[11px] text-white/50 font-light" style={{ fontFamily: SANS }}>Freehand canvas artwork with plant dyes.</p>
              </div>

              <div className="p-4 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}>
                <Scissors size={20} className="mb-2" style={{ color: MAGENTA }} />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1" style={{ fontFamily: SANS }}>Hand Appliqué</h4>
                <p className="text-[11px] text-white/50 font-light" style={{ fontFamily: SANS }}>Intricate needlecraft cutout applique.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Collection Showcase Section */}
        <div className="space-y-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#b13896] block mb-1" style={{ fontFamily: SANS }}>
                EXPLORE ALL 11 COLLECTIONS
              </span>
              <h3 className="text-2xl sm:text-3xl font-light text-white" style={{ fontFamily: SERIF }}>
                The Hindshree Anthology
              </h3>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-nowrap sm:flex-wrap w-full sm:w-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-4 py-2 rounded-full text-[11px] tracking-wider font-semibold whitespace-nowrap transition-all duration-300 ${activeTab === cat
                      ? 'bg-[#b13896] text-white shadow-[0_0_15px_rgba(177,56,150,0.4)] scale-105'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  style={{ fontFamily: SANS }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of All 11 Hindshree Collections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCollections.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="group relative rounded-2xl overflow-hidden flex flex-col justify-between border border-white/10 transition-all duration-500 hover:border-[#b13896]/60 hover:shadow-[0_10px_30px_rgba(177,56,150,0.2)]"
                style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}
              >
                {/* Image Container */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161114] via-transparent to-transparent opacity-90" />

                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[9px] tracking-widest font-bold uppercase bg-black/70 text-white/90 backdrop-blur-md border border-white/15" style={{ fontFamily: SANS }}>
                    {item.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xl font-medium text-white mb-1.5 group-hover:text-[#f3c7ea] transition-colors" style={{ fontFamily: SERIF }}>
                      {item.name}
                    </h4>
                    <p className="text-xs text-white/60 font-light leading-relaxed" style={{ fontFamily: SANS }}>
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <Link
                      to={item.link}
                      className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] font-bold uppercase text-[#b13896] hover:text-white transition-colors"
                      style={{ fontFamily: SANS }}
                    >
                      <span>Explore Collection</span>
                      <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default HindshreeSection;
