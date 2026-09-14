import React from 'react';
import { motion } from 'framer-motion';
import Breadcrumb from '../components/Breadcrumb';

const CRIMSON = '#b13896';
const DARK = '#161114';
const GOLD = '#b13896';
const TAUPE = '#4a3f44';
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
        title="Our Weaving Heritage"
        subtitle="Centuries of master weaving tradition, reimagined for the modern woman."
        bgImage="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=1600"
        links={breadcrumbLinks}
      />

      {/* ── SECTION 1: MEET THE FOUNDERS ───────────────────────── */}
      <section className="relative px-6 py-20 lg:py-32">
        <div className="max-w-[1320px] mx-auto">

          {/* Eyebrow and Section Header */}
          <div className="max-w-3xl mb-14 lg:mb-20 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[1px]" style={{ background: CRIMSON }} />
              <span className="text-xs lg:text-[13px] tracking-[0.4em] font-bold text-[#4a3f44] uppercase">
                Meet The Founders
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
              A Friendship. A Shared Love <br />
              <span className="italic" style={{ color: CRIMSON }}>for Travel. A World of Inspiration.</span>
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
                <span className="text-[14px] tracking-widest font-bold uppercase text-[#4a3f44]">Philosophy</span>
                <p className="text-[17px] font-light leading-relaxed italic text-[#5C534C]" style={{ fontFamily: SERIF }}>
                  "Handlooms that feel effortless, look sophisticated, and carry the warmth of master weaver heritage."
                </p>
              </div>
            </motion.div>

            {/* Right: The Founders Narrative */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-8">
              <div className="text-[15px] lg:text-[16px] text-[#5C534C] leading-relaxed font-light space-y-6">

                <motion.p
                  className="text-[19px] lg:text-[21px] text-[#161114] leading-relaxed font-light"
                  style={{ fontFamily: SERIF }}
                  {...fadeUp}
                >
                  TUKA began with a love for authentic handloom craft and Bengal's loom legacy.
                </motion.p>

                <motion.p {...fadeUp} transition={{ delay: 0.05 }}>
                  As best friends, The Founders found inspiration wherever their journeys took them—from rural weaving clusters in Dhaniakhali and Begampur to Shantipur and Bishnupur. Every village introduced them to master weavers, distinctive yarn counts, and sarees that told a story of their own.
                </motion.p>

                <motion.p {...fadeUp} transition={{ delay: 0.1 }}>
                  Along the way, they discovered a shared fascination for Bengal handlooms—pieces that captured the beauty of traditional pit looms while remaining modern, airy, and wearable every day. They saw sarees as more than garments; they are living heirlooms, expressions of grace, and reflections of Bengali culture.
                </motion.p>

                <motion.div
                  className="py-6 border-t border-b border-[#e5d5df]/30 italic text-[19px] lg:text-[23px] text-[#161114] leading-snug font-light text-center"
                  style={{ fontFamily: SERIF }}
                  {...fadeUp}
                  transition={{ delay: 0.15 }}
                >
                  Inspired by the master weavers, they dreamed of bringing Bengal's finest weaves directly from loom to wardrobe.
                </motion.div>

                <motion.div
                  className="p-6 rounded-[2px] border-l-2 bg-[#FDFAF5] space-y-3"
                  style={{ borderColor: CRIMSON }}
                  {...fadeUp}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-[18px] lg:text-[20px] font-medium text-[#161114] leading-none" style={{ fontFamily: SERIF }}>
                    And so, TUKA was born.
                  </p>
                  <p className="text-sm text-[#4a3f44] leading-relaxed">
                    The name draws inspiration from tactile grace and authenticity. That same philosophy lies at the heart of TUKA: handloom sarees and designer blouses that feel weightless, look regal, and honor the master weavers who create them.
                  </p>
                </motion.div>

                <motion.p {...fadeUp} transition={{ delay: 0.25 }}>
                  Today, TUKA is a curated universe of Bengal handlooms inspired by heritage and reimagined for the modern woman. Each collection brings together pure cottons, silks, khadi, and fine linen Jamdani—designed to become part of your story.
                </motion.p>

                <motion.p {...fadeUp} transition={{ delay: 0.3 }}>
                  For The Founders, TUKA is more than a brand. It is a commitment to weaver welfare, ethical fair trade, and preserving India's textile art for generations to come.
                </motion.p>

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
              ✦ Trends That Travel the World
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── SECTION 2: FROM OUR JOURNEY TO YOURS ────────────────── */}
      <section className="px-6 py-20 lg:py-32 border-t border-[#e5d5df]/30" style={{ backgroundColor: '#FDFCF7' }}>
        <div className="max-w-[1320px] mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">

            {/* Left Hand: Typography Introduction */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-[1px]" style={{ background: CRIMSON }} />
                  <span className="text-xs lg:text-[13px] tracking-[0.4em] font-bold text-[#4a3f44] uppercase">
                    From Our Journey to Yours
                  </span>
                </div>

                <h2
                  className="font-light leading-[1.1] tracking-tight"
                  style={{
                    fontFamily: SERIF,
                    fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                    color: DARK
                  }}
                >
                  What began at the loom <br />
                  <span className="italic" style={{ color: CRIMSON }}>is now a cherished part of your wardrobe.</span>
                </h2>
              </div>

              <div className="text-[15px] lg:text-[16px] text-[#5C534C] leading-relaxed font-light space-y-6">
                <motion.p {...fadeUp}>
                  We created TUKA for women who love to express themselves with timeless grace—who believe that a saree doesn’t need a royal festival to feel special. Whether worn during daily work, grand celebrations, intimate gatherings, or gifted with love, we hope every TUKA saree creates a memory that is uniquely yours.
                </motion.p>

                <motion.p {...fadeUp} transition={{ delay: 0.1 }}>
                  When you choose TUKA, you’re not simply choosing a saree. You’re draping centuries of Indian heritage, supporting weaver families, and wearing true craftsmanship.
                </motion.p>

                <motion.p {...fadeUp} transition={{ delay: 0.15 }}>
                  As founders, there is something incredibly special about seeing our pieces become part of your stories. You are not just our customer; you are part of the journey we began together as two best friends with one shared dream.
                </motion.p>

                <motion.p
                  className="text-[18px] lg:text-[20px] italic font-light text-[#161114]"
                  style={{ fontFamily: SERIF }}
                  {...fadeUp}
                  transition={{ delay: 0.2 }}
                >
                  Our journey inspired TUKA. Now, we can’t wait to be part of yours.
                </motion.p>
              </div>
            </div>

            {/* Right Hand: Elegant Fine Art Frame */}
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
                  alt="Travel and discovery moments"
                  className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                />
              </div>
            </motion.div>

          </div>

        </div>
      </section>

      {/* ── SECTION 3: LIGHT PREMIUM SIGN-OFF ──────────────────── */}
      <section className="border-t border-[#e5d5df]/30" style={{ background: CREAM }}>
        <div className="max-w-[1320px] mx-auto px-6 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">

            {/* Founders Closing Column */}
            <motion.div className="lg:col-span-8 space-y-4" {...fadeUp}>
              <span className="text-[12px] tracking-[0.3em] uppercase font-bold text-[#4a3f44]">
                With Love,
              </span>
              <p
                className="italic font-light leading-none"
                style={{
                  fontFamily: SERIF,
                  fontSize: 'clamp(2.4rem, 5vw, 4.2rem)',
                  color: CRIMSON
                }}
              >
                The Founders
              </p>
              <div className="flex items-center gap-3">
                <span className="w-6 h-[1px]" style={{ background: GOLD }} />
                <span className="text-[13px] tracking-[0.2em] uppercase font-bold text-[#161114]">
                  Founders, TUKA
                </span>
              </div>
            </motion.div>

            {/* Giant Monogram brand stamp */}
            <motion.div
              className="lg:col-span-4 flex justify-start lg:justify-end"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div
                className="text-[42px] lg:text-[50px] font-light tracking-[0.1em]"
                style={{ fontFamily: SERIF, color: '#e5d5df' }}
              >
                TUKA
              </div>
            </motion.div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default About;