import React from 'react';
import { motion } from 'framer-motion';
import Breadcrumb from '../components/Breadcrumb';

const CRIMSON = '#b13896';
const DARK = '#161114';
const GOLD = '#b13896';
const CREAM = '#FDFAF5';
const SERIF = "'Cormorant Garamond', Georgia, serif";

const fadeUp = {
  initial: { opacity: 0, y: 35 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
};

const About = () => {
  const breadcrumbLinks = [
    { name: 'Home', href: '/?ref=about#hero' },
    { name: 'About Us', href: '/about?ref=breadcrumb#story', active: true }
  ];

  return (
    <div className="overflow-hidden" style={{ backgroundColor: CREAM, color: DARK }}>

      {/* ── BREADCRUMB HERO ────────────────────────────────────── */}
      <Breadcrumb
        title="About TUKA"
        subtitle="Woven in Bengal. Curated for the World."
        bgImage="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=1600"
        links={breadcrumbLinks}
      />

      {/* ── SECTION 1: ABOUT TUKA ───────────────────────── */}
      <section className="relative px-6 py-20 lg:py-32" id="story">
        <div className="max-w-[1320px] mx-auto">

          {/* Eyebrow and Section Header */}
          <div className="max-w-3xl mb-14 lg:mb-20 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[1px]" style={{ background: CRIMSON }} />
              <span className="text-xs lg:text-[13px] tracking-[0.4em] font-bold text-[#4a3f44] uppercase">
                About TUKA
              </span>
            </div>

            <h1
              className="font-light leading-[1.1] tracking-tight"
              style={{
                fontFamily: SERIF,
                fontSize: 'clamp(2.4rem, 5.5vw, 4.5rem)',
                color: DARK
              }}
            >
              Woven in Bengal. <br />
              <span className="italic" style={{ color: CRIMSON }}>Curated for the World.</span>
            </h1>
          </div>

          {/* Asymmetric 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-stretch">

            {/* Left: Premium Editorial Imagery */}
            <motion.div
              className="lg:col-span-5 flex flex-col justify-between space-y-8"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative group overflow-hidden rounded-[4px] border border-[#e5d5df]/25 shadow-[0_20px_50px_rgba(42,38,35,0.04)] aspect-[4/5] bg-[#fcf6f9]">
                <img
                  src="https://images.unsplash.com/photo-1534126511673-b6899657816a?auto=format&fit=crop&q=80&w=1000"
                  alt="Crafting and Designing"
                  className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[#b13896]/[0.03] pointer-events-none" />
              </div>

              {/* Minimal Brand Credo Box */}
              <div className="border-l border-[#e5d5df] pl-6 space-y-3 hidden lg:block">
                <span className="text-[14px] tracking-widest font-bold uppercase text-[#4a3f44]">Heritage Credo</span>
                <p className="text-[17px] font-light leading-relaxed italic text-[#5C534C]" style={{ fontFamily: SERIF }}>
                  "We believe a saree is more than a garment—it is a piece of heritage, carrying the story of its craft, its community and the hands that created it."
                </p>
              </div>
            </motion.div>

            {/* Right: Narrative Content */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-8">
              <div className="text-[15px] lg:text-[16px] text-[#5C534C] leading-relaxed font-light space-y-6">

                <motion.p
                  className="text-[19px] lg:text-[22px] text-[#161114] leading-relaxed font-light"
                  style={{ fontFamily: SERIF }}
                  {...fadeUp}
                >
                  TUKA Boutique is a curated destination for authentic handloom and traditional sarees from the diverse regions of Bengal.
                </motion.p>

                <motion.p {...fadeUp} transition={{ delay: 0.05 }}>
                  Born from a deep appreciation for Bengal’s rich textile heritage, TUKA seeks to bring together sarees that celebrate the artistry, craftsmanship and traditions of generations of weavers. We believe a saree is more than a garment—it is a piece of heritage, carrying the story of its craft, its community and the hands that created it.
                </motion.p>

                <motion.div
                  className="p-6 lg:p-8 rounded-[2px] border-l-2 bg-[#FDFAF5] space-y-3 my-4"
                  style={{ borderColor: CRIMSON }}
                  {...fadeUp}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-[16px] lg:text-[18px] text-[#161114] leading-relaxed font-light" style={{ fontFamily: SERIF }}>
                    Our endeavour is to promote authenticity, craftsmanship and timeless elegance, while introducing the beauty of Bengal’s handloom traditions to customers across India and around the world.
                  </p>
                </motion.div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── PARALLAX TEXT RIBBON ───────────────────────────────── */}
      <div
        className="w-full py-4 border-t border-b border-[#e5d5df]/30 overflow-hidden"
        style={{ background: '#161114' }}
      >
        <motion.div
          className="flex whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 25, ease: 'linear', repeat: Infinity }}
        >
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="text-[14px] lg:text-[13px] tracking-[0.25em] uppercase font-light px-16 text-[#b13896]"
              style={{ fontFamily: SERIF }}
            >
              ✦ Authentic ✦ Timeless ✦ Woven with Purpose
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── SECTION 2: PURPOSE BEYOND BUSINESS ────────────────── */}
      <section className="px-6 py-20 lg:py-32 border-t border-[#e5d5df]/30" style={{ backgroundColor: '#FDFCF7' }}>
        <div className="max-w-[1320px] mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">

            {/* Left Hand: Purpose & Bodhika Foundation */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-[1px]" style={{ background: CRIMSON }} />
                  <span className="text-xs lg:text-[13px] tracking-[0.4em] font-bold text-[#4a3f44] uppercase">
                    Social Purpose
                  </span>
                </div>

                <h2
                  className="font-light leading-[1.1] tracking-tight"
                  style={{
                    fontFamily: SERIF,
                    fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)',
                    color: DARK
                  }}
                >
                  Driven by a Purpose <br />
                  <span className="italic" style={{ color: CRIMSON }}>Beyond Business.</span>
                </h2>
              </div>

              <div className="text-[15px] lg:text-[16px] text-[#5C534C] leading-relaxed font-light space-y-6">
                <motion.p
                  className="text-[18px] lg:text-[20px] text-[#161114] leading-relaxed font-light"
                  style={{ fontFamily: SERIF }}
                  {...fadeUp}
                >
                  TUKA is also driven by a purpose beyond business. Our promoter is a Co-Founder of Bodhika Foundation, a non-profit initiative working towards creating opportunities in education and skill development for students and young people in need.
                </motion.p>

                <motion.p {...fadeUp} transition={{ delay: 0.1 }}>
                  We believe enterprise and social purpose can grow together. As TUKA grows, we aspire to support this larger vision and contribute to creating meaningful opportunities.
                </motion.p>
              </div>
            </div>

            {/* Right Hand: Fine Art Frame */}
            <motion.div
              className="lg:col-span-5 relative group"
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              {/* Outer floating border accent */}
              <div className="absolute -inset-3 border border-[#e5d5df]/30 translate-x-3 translate-y-3 pointer-events-none rounded-[4px] transition-transform duration-500 group-hover:translate-x-1.5 group-hover:translate-y-1.5" />

              <div className="relative overflow-hidden aspect-[4/5] rounded-[4px] border border-[#e5d5df]/25 bg-[#fcf6f9] shadow-[0_15px_40px_rgba(42,38,35,0.03)] z-10">
                <img
                  src="https://images.unsplash.com/photo-1453733190148-c44698c26578?auto=format&fit=crop&q=80&w=1200"
                  alt="Empowerment and Social Purpose"
                  className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                />
              </div>
            </motion.div>

          </div>

        </div>
      </section>

      {/* ── SECTION 3: BRAND MOTTO & SIGN-OFF ──────────────────── */}
      <section className="border-t border-[#e5d5df]/30" style={{ background: CREAM }}>
        <div className="max-w-[1320px] mx-auto px-6 py-16 lg:py-24 text-center">
          <motion.div className="max-w-3xl mx-auto space-y-6" {...fadeUp}>
            <span className="text-[12px] tracking-[0.3em] uppercase font-bold text-[#4a3f44] block">
              TUKA Boutique
            </span>
            <h2
              className="italic font-light leading-snug"
              style={{
                fontFamily: SERIF,
                fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
                color: CRIMSON
              }}
            >
              Authentic. Timeless. Woven with Purpose.
            </h2>
            <div className="w-16 h-[1px] mx-auto mt-6" style={{ background: GOLD }} />
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default About;