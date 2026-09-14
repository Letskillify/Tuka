import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, ArrowRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/free-mode';

const socialPosts = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1610030469215-f47b8a2c8e01?auto=format&fit=crop&q=80&w=600",
    label: "Sarees",
    time: "2h"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=600",
    label: "Handloom Craft",
    time: "5h"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=600",
    label: "Bags",
    time: "12h"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1583390389001-8c9ac72a65f4?auto=format&fit=crop&q=80&w=600",
    label: "Kurtis",
    time: "1d"
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=600",
    label: "Ethnic",
    time: "2d"
  }
];

const MAGENTA = '#b13896';
const DARK  = '#161114';
const SANS    = "'Plus Jakarta Sans', 'Inter', sans-serif";
const SERIF   = "'Playfair Display', Georgia, serif";

const TheJournal = () => {
  return (
    <section className="py-12 lg:py-20 overflow-hidden relative" style={{ background: '#FDF8F2', borderTop: '1px solid rgba(26,16,64,0.06)' }}>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-10 text-left">

        {/* Header */}
        <div className="mb-16 space-y-4 text-center">
          <div className="flex items-center justify-center gap-4">
            <span className="w-12 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${MAGENTA})` }} />
            <span
              className="text-[10px] tracking-[0.4em] font-bold uppercase"
              style={{ color: MAGENTA, fontFamily: SANS }}
            >
              Our Style World
            </span>
            <span className="w-12 h-[1px]" style={{ background: `linear-gradient(-90deg, transparent, ${MAGENTA})` }} />
          </div>

          <h2
            className="text-3xl md:text-5xl lg:text-6xl font-light leading-tight"
            style={{ color: DARK, fontFamily: SERIF }}
          >
            Moments that <span className="italic" style={{ color: MAGENTA }}>inspire us</span>
          </h2>

          <p
            className="text-[14px] lg:text-[15px] leading-relaxed max-w-2xl mx-auto font-light text-gray-500"
            style={{ fontFamily: SANS }}
          >
            A glimpse into Tuka's world — from authentic cotton handlooms to designer blouses. Follow us for daily style inspiration.
          </p>
        </div>

        {/* Instagram Slider */}
        <div className="mb-16">
          <Swiper
            modules={[Autoplay, FreeMode]}
            spaceBetween={20}
            slidesPerView={1.5}
            freeMode={true}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            breakpoints={{
              640: { slidesPerView: 2.5 },
              1024: { slidesPerView: 4 },
              1280: { slidesPerView: 5 }
            }}
            className="!overflow-visible"
          >
            {socialPosts.map((post, index) => (
              <SwiperSlide key={post.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative aspect-[4/5] overflow-hidden cursor-pointer rounded-2xl shadow-sm hover:shadow-xl transition-all duration-700"
                >
                  <img
                    src={post.image}
                    alt="Social Post"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Overlay Info */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="px-2 py-1 rounded-full text-[9px] font-bold tracking-wide uppercase text-white" style={{ background: 'rgba(232,135,58,0.85)', fontFamily: SANS }}>
                      {post.label}
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <Instagram size={12} className="text-white/70" />
                    <span className="text-[10px] text-white/70" style={{ fontFamily: SANS }}>@tuka.official • {post.time}</span>
                  </div>

                  {/* Hover Darken */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center"
        >
          <a
            href="https://instagram.com/tuka.official?utm_source=tuka_website&utm_medium=style_world#tuka-instagram"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110" style={{ background: MAGENTA }}>
              <Instagram size={20} />
            </div>
            <div className="flex items-center gap-3 border-b border-transparent pb-1" style={{ borderColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = MAGENTA}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
            >
              <span className="text-[12px] font-bold tracking-[0.2em] uppercase" style={{ color: DARK, fontFamily: SANS }}>FOLLOW @TUKA</span>
              <span className="text-[12px] border-l pl-3 italic" style={{ color: '#3D3460', fontFamily: SANS, borderColor: 'rgba(26,16,64,0.2)' }}>@tuka.official</span>
              <ArrowRight size={16} style={{ color: MAGENTA }} className="transition-transform group-hover:translate-x-1" />
            </div>
          </a>
        </motion.div>

      </div>
    </section>
  );
};

export default TheJournal;