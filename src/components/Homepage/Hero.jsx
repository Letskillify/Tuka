import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, Sparkles, Gem, ShieldCheck, Heart, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../Firebase';
import 'swiper/css';

const MAGENTA = '#b13896';
const DARK    = '#161114';
const SANS    = "'Plus Jakarta Sans', 'Inter', sans-serif";
const SERIF   = "'Playfair Display', Georgia, serif";

const usps = [
  '🪷 Handloom Sarees',
  '✿ Ethnic Kurtis',
  '🌸 Bridal Collections',
  '✦ Premium Fabrics',
];

const whyChooseFeatures = [
  {
    icon: <Sparkles className="w-4 h-4" strokeWidth={1.5} />,
    title: "Pure Handloom",
    description: "Directly sourced from traditional weavers across India."
  },
  {
    icon: <Gem className="w-4 h-4" strokeWidth={1.5} />,
    title: "Heirloom Quality",
    description: "Hand-finished with precision to survive generations."
  },
  {
    icon: <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />,
    title: "Authentic Materials",
    description: "100% genuine silks, linens, and metallic fibers."
  },
  {
    icon: <Heart className="w-4 h-4" strokeWidth={1.5} />,
    title: "Fair Trade Pride",
    description: "Guaranteed fair wages and ethical community trade."
  },
  {
    icon: <Award className="w-4 h-4" strokeWidth={1.5} />,
    title: "Premier Trust",
    description: "Rated 4.9★ by over 10k+ luxury fashion lovers."
  }
];

const Hero = () => {
  const videoRef   = useRef(null);
  const sectionRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [heroSettings, setHeroSettings] = useState(null);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const contentY   = useTransform(scrollYProgress, [0, 1], [0, 60]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "homepage"), (snap) => {
      if (snap.exists()) {
        setHeroSettings(snap.data());
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [heroSettings?.heroVideoUrl]);

  const bgImg = heroSettings?.heroBgImage || '/img/b (1).jpeg';
  const videoUrl = heroSettings?.heroVideoUrl || 'https://res.cloudinary.com/ewqgfmrg/video/upload/v1784458209/tuka2_vrapwj.mp4';

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ height: '100svh', minHeight: 640 }}
    >
      {/* ── VIDEO / IMAGE BG ──── */}
      <motion.div className="absolute inset-0 z-0 origin-center" style={{ scale: videoScale }}>
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url('${bgImg}')`, opacity: loaded ? 0 : 1 }}
        />
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay muted loop playsInline
          onCanPlay={() => setLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      </motion.div>

      {/* ── OVERLAYS ──── */}
      {/* ── OVERLAYS & AMBIENT GLOWS ──── */}
      {/* Dark luxury base tint */}
      <div className="absolute inset-0 z-10" style={{ background: 'rgba(16,11,14,0.55)' }} />
      
      {/* Ambient magenta radial light aura behind text */}
      <div
        className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full pointer-events-none z-10 opacity-40 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(177,56,150,0.45) 0%, rgba(177,56,150,0.1) 45%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />

      {/* Cinematic left side gradient overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{ background: 'linear-gradient(110deg, rgba(14,9,12,0.92) 0%, rgba(14,9,12,0.55) 45%, transparent 85%)' }}
      />
      {/* Bottom fade for USP bar */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 h-[60%]"
        style={{ background: 'linear-gradient(to top, rgba(14,9,12,0.98) 0%, rgba(14,9,12,0.6) 40%, transparent 100%)' }}
      />
      {/* Top navbar fade */}
      <div
        className="absolute inset-x-0 top-0 z-10 h-36"
        style={{ background: 'linear-gradient(to bottom, rgba(14,9,12,0.65) 0%, transparent 100%)' }}
      />

      {/* ── CONTENT ──── */}
      <motion.div
        className="absolute inset-0 z-20 flex flex-col justify-center"
        style={{ y: contentY }}
      >
        <div className="max-w-[1440px] mx-auto w-full px-6 lg:px-16 pt-24 lg:pt-32 pb-28 lg:pb-36">

          {/* Eyebrow badge */}
          <motion.div
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full mb-5 transition-all duration-300"
            style={{
              background: 'rgba(177, 56, 150, 0.18)',
              border: '1px solid rgba(244, 207, 235, 0.3)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 25px rgba(177, 56, 150, 0.25)',
            }}
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: MAGENTA }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#f4cfeb' }} />
            </span>
            <span
              className="text-[10px] sm:text-[11px] tracking-[0.32em] uppercase font-bold text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(90deg, #fce4f7 0%, #f4cfeb 100%)',
                fontFamily: SANS,
              }}
            >
              Handwoven with patience and pride
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-white mb-5 font-light max-w-3xl drop-shadow-sm"
            style={{
              fontFamily: SERIF,
              fontSize: 'clamp(2.5rem, 5.2vw, 4.4rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.015em',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            The Heritage of{' '}
            <em
              className="italic font-normal block sm:inline relative"
              style={{
                color: '#f4cfeb',
                textShadow: '0 0 35px rgba(177,56,150,0.65), 0 0 10px rgba(177,56,150,0.4)',
              }}
            >
              Bengal Handloom
            </em>
          </motion.h1>

          {/* Sub-copy */}
          <motion.p
            className="mb-6 max-w-lg text-white/90 font-light leading-relaxed text-sm sm:text-base tracking-wide"
            style={{ fontFamily: SANS, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            Authentic handloom sarees in Cotton, Khadi, Linen, Silk & exquisite tailored blouses directly from master weaver looms.
          </motion.p>
         
        </div>
      </motion.div>

      {/* ── SCROLL CUE ──── */}
      <motion.button
        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        className="absolute z-30 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/50 hover:text-[#f4cfeb] transition-all duration-300 group cursor-pointer"
        style={{ bottom: 145 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.6 }}
      >
        <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 group-hover:text-[#f4cfeb] transition-colors">
          Explore
        </span>
        <motion.div
          className="p-2 rounded-full border border-white/10 group-hover:border-[#b13896]/50 bg-black/20 group-hover:bg-[#b13896]/20 backdrop-blur-md transition-all"
          animate={{ y: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        >
          <ChevronDown size={16} strokeWidth={1.5} />
        </motion.div>
      </motion.button>

      {/* ── BRAND PROMISE CARDS BAR ──── */}
      <div className="absolute bottom-0 inset-x-0 z-30">
        <motion.div
          className="max-w-[1440px] mx-auto px-4 lg:px-10 pb-3.5 lg:pb-5"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Desktop grid */}
          <div className="hidden lg:grid lg:grid-cols-5 gap-3.5">
            {whyChooseFeatures.map((feature, i) => (
              <div
                key={i}
                className="group flex flex-col items-center text-center px-4 py-3.5 rounded-2xl transition-all duration-500 hover:-translate-y-1.5 hover:border-[#b13896]/60 hover:shadow-[0_12px_35px_rgba(177,56,150,0.25)] relative border"
                style={{
                  background: 'rgba(20, 14, 18, 0.72)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                }}
              >
                {/* Glow accent bar on hover */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-gradient-to-r from-transparent via-[#b13896] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />

                {/* Icon Container */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center mb-2.5 transition-all duration-500 relative shrink-0 group-hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg, rgba(177, 56, 150, 0.25) 0%, rgba(177, 56, 150, 0.08) 100%)',
                    border: '1px solid rgba(244, 207, 235, 0.3)',
                    boxShadow: 'inset 0 0 10px rgba(177, 56, 150, 0.2)'
                  }}
                >
                  <span className="transition-colors duration-300 text-[#f4cfeb] group-hover:text-white">
                    {feature.icon}
                  </span>
                </div>

                <h3
                  className="text-[11px] tracking-[0.16em] font-extrabold uppercase mb-1 transition-colors duration-300 text-white/95 group-hover:text-[#f4cfeb]"
                  style={{ fontFamily: SANS }}
                >
                  {feature.title}
                </h3>
                
                <p
                  className="text-[10.5px] leading-tight font-light text-white/75 group-hover:text-white/95 transition-colors duration-300"
                  style={{ fontFamily: SANS }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Mobile slider */}
          <div
            className="lg:hidden overflow-hidden rounded-2xl border"
            style={{
              background: 'rgba(20, 14, 18, 0.82)',
              backdropFilter: 'blur(24px)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            }}
          >
            <Swiper
              spaceBetween={0}
              slidesPerView={1}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              modules={[Autoplay]}
              className="w-full"
            >
              {whyChooseFeatures.map((feature, i) => (
                <SwiperSlide key={i}>
                  <div className="flex items-center justify-center gap-3.5 px-4 py-3.5 text-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(177, 56, 150, 0.3) 0%, rgba(177, 56, 150, 0.1) 100%)',
                        border: '1px solid rgba(244, 207, 235, 0.35)',
                      }}
                    >
                      <span className="text-[#f4cfeb]">{feature.icon}</span>
                    </div>
                    <div className="text-left">
                      <h3
                        className="text-[11px] tracking-[0.14em] font-bold uppercase text-white"
                        style={{ fontFamily: SANS }}
                      >
                        {feature.title}
                      </h3>
                      <p
                        className="text-[10px] text-white/75 font-light"
                        style={{ fontFamily: SANS }}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
