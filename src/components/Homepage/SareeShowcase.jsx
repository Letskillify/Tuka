import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, Leaf, Feather, Sparkles, ArrowRight, Palette, Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionHeader from './SectionHeader';

const MAGENTA = '#b13896';
const LIGHT_BG = '#FAF7F9';
const SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const sareeData = [
  {
    id: 'dhaniakhali',
    number: '01',
    title: 'Dhaniakhali Saree',
    subtitle: 'The Firm & Crisp Heritage of Hooghly',
    origin: 'Hooghly District, West Bengal',
    giTag: 'GI Certified Origin',
    image: 'img/d.jpeg',
    tagline: 'DENSE WEAVE & KANCHHA BORDER',
    story: 'Meticulously handwoven on traditional pit looms with 100s count combed cotton yarn, featuring iconic Kanchha contrast borders and a crisp silhouette that naturally softens with every wash.',
    features: [
      {
        icon: <Award size={15} strokeWidth={1.5} />,
        title: 'GI Certified Craft',
        desc: 'Guaranteed origin from Hooghly master pit looms.'
      },
      {
        icon: <ShieldCheck size={15} strokeWidth={1.5} />,
        title: '100s Fine Cotton',
        desc: 'High-density yarn for structured, opaque drape.'
      },
      {
        icon: <Leaf size={15} strokeWidth={1.5} />,
        title: '100% Eco-Sustainable',
        desc: 'Natural dyes free of harsh toxic chemicals.'
      },
      {
        icon: <Feather size={15} strokeWidth={1.5} />,
        title: 'All-Day Crisp Comfort',
        desc: 'Cool, highly breathable weave for all seasons.'
      }
    ],
    catLink: '/shop?cat=dhaniakhali#products'
  },
  {
    id: 'begumpuri',
    number: '02',
    title: 'Begumpuri Saree',
    subtitle: 'The Lightweight Artistry of Begampur',
    origin: 'Begampur, Hooghly, West Bengal',
    giTag: 'Handloom Craft',
    image: 'img/b.jpeg',
    tagline: 'FEATHERLIGHT TEXTURE & FISH-SCALE MOTIFS',
    story: 'Celebrated for its cloud-like lightness and serrated Macha Chokh (fish-scale) borders, Begumpuri sarees combine loose-twist cotton yarns with 300+ years of uncompromised Bengali weaving heritage.',
    features: [
      {
        icon: <Feather size={15} strokeWidth={1.5} />,
        title: 'Weightless Drape',
        desc: 'Ultra-soft loose-twist cotton for effortless ease.'
      },
      {
        icon: <Sparkles size={15} strokeWidth={1.5} />,
        title: 'Macha Chokh Motif',
        desc: 'Hand-wrought serrated fish-scale border art.'
      },
      {
        icon: <Award size={15} strokeWidth={1.5} />,
        title: 'Weaver Heritage',
        desc: 'Preserved by traditional master artisan families.'
      },
      {
        icon: <Leaf size={15} strokeWidth={1.5} />,
        title: 'Pure Organic Cotton',
        desc: '100% natural yarn for maximum skin breathability.'
      }
    ],
    catLink: '/shop?cat=begumpuri#products'
  },
  {
    id: 'shantipuri',
    number: '03',
    title: 'Shantipuri Saree',
    subtitle: 'The Royal Fine-Weave Legacy of Nadia',
    origin: 'Shantipur, Nadia District, West Bengal',
    giTag: 'GI Tagged Royal Heritage',
    image: 'img/s.jpeg',
    tagline: 'GOSSAMER WEAVE & JACQUARD MOTIFS',
    story: 'Patronized by 15th-century Bengali royalty, Shantipur sarees are woven with micro-fine 120s combed cotton. Featuring intricate Bhomra and Taj dobby borders, they drape with liquid silk elegance.',
    features: [
      {
        icon: <Award size={15} strokeWidth={1.5} />,
        title: '120s Micro-Fine Yarn',
        desc: 'Gossamer thread count for a fluid royal drape.'
      },
      {
        icon: <Sparkles size={15} strokeWidth={1.5} />,
        title: 'Royal Dobby Motifs',
        desc: 'Intricate Bhomra & Taj palace garden motifs.'
      },
      {
        icon: <ShieldCheck size={15} strokeWidth={1.5} />,
        title: 'GI Certified',
        desc: 'Authentic royal textile craft from Nadia.'
      },
      {
        icon: <Leaf size={15} strokeWidth={1.5} />,
        title: 'Ethical Artisanal',
        desc: 'Direct fair-trade wages supporting weavers.'
      }
    ],
    catLink: '/shop?cat=shantipuri#products'
  },
  {
    id: 'hindshree',
    number: '04',
    title: 'Hindshree Collection',
    subtitle: 'Unbound Creativity & Handloom Innovation',
    origin: 'Weaving Clusters, West Bengal',
    giTag: 'Signature Handloom Craft',
    image: 'img/h.jpeg',
    tagline: 'FREEHAND ARTWORK & APPLIQUÉ NEEDLEWORK',
    story: 'Hindshree merges ancient pit-loom techniques with modern artistic flair—combining freehand organic painting, hand appliqué needlework, and subtle metallic tissue linen glows.',
    features: [
      {
        icon: <Feather size={15} strokeWidth={1.5} />,
        title: 'Hand-Spun Yarns',
        desc: 'Pure cotton, textured khadi, and European flax linen.'
      },
      {
        icon: <Palette size={15} strokeWidth={1.5} />,
        title: 'Freehand Painting',
        desc: 'Motif artwork crafted with plant-based natural dyes.'
      },
      {
        icon: <Scissors size={15} strokeWidth={1.5} />,
        title: 'Hand Appliqué',
        desc: 'Intricate Bengali fabric cutout needlework.'
      },
      {
        icon: <Sparkles size={15} strokeWidth={1.5} />,
        title: 'Metallic Linen Glow',
        desc: 'Fine Zari metallic threads interlaced into pure flax linen.'
      }
    ],
    catLink: '/shop?cat=hindshree#products'
  }
];

const SareeShowcase = () => {
  const [activeTab, setActiveTab] = useState(sareeData[0].id);

  return (
    <section className="py-10 lg:py-16 relative overflow-hidden bg-white">
      {/* Subtle Luxury Gradient Lines */}
      <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(177,56,150,0.2), transparent)' }} />
      <div className="absolute bottom-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)' }} />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        
        {/* Standardized Unified Section Header */}
        <SectionHeader
          badgeText="THE BRAND PROMISE"
          badgeIcon={<Sparkles size={13} />}
          titlePrefix="Craftsmanship in Every"
          highlightText="Detail"
          description="We curate luxury ethnic pieces directly from the source — celebrating Indian heritage, weavers, and your timeless expressions."
        />

        {/* Quick jump tabs - Mobile Scrollable & Desktop Centered */}
        <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 mt-2 mb-8 lg:mb-12 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide px-1 sm:px-0">
          {sareeData.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`group shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-[13px] tracking-wider uppercase font-semibold transition-all duration-300 flex items-center gap-2 border ${
                  isActive
                    ? 'bg-[#161114] text-white border-[#161114] shadow-md'
                    : 'bg-[#FAF7F9] text-[#161114] border-black/5 hover:border-[#b13896]/30 hover:bg-white'
                }`}
                style={{ fontFamily: SANS }}
              >
                <span
                  className={`text-[13px] font-bold ${
                    isActive ? 'text-[#f4cfeb]' : 'text-[#b13896]'
                  }`}
                >
                  {item.number}
                </span>
                {item.title}
              </a>
            );
          })}
        </div>

        {/* Individual Saree Sections - Premium & Compact Editorial Cards */}
        <div className="space-y-10 lg:space-y-14">
          {sareeData.map((item, index) => {
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={item.id}
                id={item.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="scroll-mt-24 relative rounded-2xl sm:rounded-3xl p-5 sm:p-7 lg:p-10 overflow-hidden border transition-all duration-300 hover:shadow-xl group"
                style={{
                  background: isEven ? LIGHT_BG : '#FFFFFF',
                  borderColor: isEven ? 'rgba(177, 56, 150, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center relative z-10">
                  
                  {/* Model Photo Container - Preserving original height */}
                  <div className={`lg:col-span-6 relative ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                    <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-shadow duration-500">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-[420px] sm:h-[540px] lg:h-[640px] object-cover object-center transition-transform duration-700 group-hover:scale-105"
                      />

                      {/* Luxurious Dual Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#161114]/80 via-black/10 to-transparent pointer-events-none" />

                      {/* Top Glassmorphism Badges */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                        <div
                          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md bg-[#161114]/75 border border-white/20 shadow-sm"
                        >
                          <ShieldCheck size={14} className="text-amber-400" />
                          <span className="text-[13px] tracking-wider text-white font-semibold uppercase" style={{ fontFamily: SANS }}>
                            {item.giTag}
                          </span>
                        </div>

                        <span
                          className="text-[13px] tracking-wider text-white font-bold px-3 py-1 rounded-full backdrop-blur-md bg-[#b13896]/80 border border-white/20 shadow-sm"
                          style={{ fontFamily: SANS }}
                        >
                          {item.number}
                        </span>
                      </div>

                      {/* Bottom Overlay Info on Image */}
                      <div className="absolute bottom-4 left-4 right-4 z-10">
                        <span className="text-[13px] tracking-[0.25em] text-white/75 uppercase block mb-0.5 font-semibold" style={{ fontFamily: SANS }}>
                          ORIGIN & REGION
                        </span>
                        <p className="text-white text-base sm:text-lg font-medium tracking-wide" style={{ fontFamily: SERIF }}>
                          {item.origin}
                        </p>
                      </div>
                    </div>

                    {/* Subtle Ambient Accent Glow */}
                    <div
                      className="absolute -inset-2 rounded-3xl -z-10 opacity-20 blur-xl transition-opacity group-hover:opacity-35 pointer-events-none"
                      style={{ background: `radial-gradient(circle, ${MAGENTA} 0%, transparent 70%)` }}
                    />
                  </div>

                  {/* Content Container - Sleek & Compact */}
                  <div className={`lg:col-span-6 space-y-4 sm:space-y-5 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                    
                    {/* Header Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-5 h-[2px] bg-[#b13896]" />
                        <span className="text-[13px] tracking-[0.25em] font-bold uppercase text-[#b13896]" style={{ fontFamily: SANS }}>
                          {item.tagline}
                        </span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-gray-900 tracking-tight leading-tight mb-1" style={{ fontFamily: SERIF }}>
                        {item.title}
                      </h3>
                      <p className="text-[13px] sm:text-sm text-gray-500 font-medium" style={{ fontFamily: SANS }}>
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Story Narrative - Concise & Elegant */}
                    <div className="border-l-2 border-[#b13896]/40 pl-3.5 py-0.5">
                      <p className="text-[13px] sm:text-sm text-gray-700 leading-relaxed font-normal" style={{ fontFamily: SANS }}>
                        {item.story}
                      </p>
                    </div>

                    {/* Features Grid - Clean 2-column layout */}
                    <div className="pt-1">
                      <h4 className="text-[13px] tracking-[0.2em] uppercase font-bold text-gray-900 mb-2.5" style={{ fontFamily: SANS }}>
                        Craftsmanship & Features
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {item.features.map((feat, fIdx) => (
                          <div
                            key={fIdx}
                            className="p-3 rounded-xl flex items-start gap-2.5 transition-all duration-300 bg-white border border-black/5 hover:border-[#b13896]/25 hover:shadow-sm"
                          >
                            <div className="p-1.5 rounded-lg shrink-0 bg-[#b13896]/10 text-[#b13896]">
                              {feat.icon}
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-[13px] font-bold text-gray-900 leading-snug mb-0.5 truncate" style={{ fontFamily: SANS }}>
                                {feat.title}
                              </h5>
                              <p className="text-[13px] text-gray-500 font-normal leading-snug" style={{ fontFamily: SANS }}>
                                {feat.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
                      <Link
                        to={item.catLink}
                        className="group/btn inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-white font-bold text-[13px] tracking-[0.15em] uppercase transition-all duration-300 bg-[#b13896] hover:bg-[#972d7f] hover:shadow-lg hover:shadow-[#b13896]/20 active:scale-95 cursor-pointer"
                        style={{ fontFamily: SANS }}
                      >
                        <span>Explore {item.title}</span>
                        <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                      </Link>

                      <span className="text-[13px] text-gray-500 font-medium tracking-wide uppercase flex items-center gap-1.5" style={{ fontFamily: SANS }}>
                        <span className="w-2 h-2 rounded-full bg-[#b13896]" /> Handwoven in West Bengal
                      </span>
                    </div>

                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SareeShowcase;
