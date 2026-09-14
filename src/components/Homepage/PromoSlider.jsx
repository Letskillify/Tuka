import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import SectionHeader from './SectionHeader';

import 'swiper/css';
import 'swiper/css/navigation';

const collections = [
  {
    id: 1,
    label: 'COTTON TANT',
    title: 'Mul Cotton Sarees',
    image: 'https://images.unsplash.com/photo-1610030470298-40e1eaccf77d?auto=format&fit=crop&q=80&w=800',
    link: '/shop?cat=handloom-saree&type=mul-cotton#products'
  },
  {
    id: 2,
    label: 'TRADITIONAL WEAVES',
    title: 'Dhaniakhali & Begampuri',
    image: 'https://images.unsplash.com/photo-1583390389001-8c9ac72a65f4?auto=format&fit=crop&q=80&w=800',
    link: '/shop?cat=handloom-saree&type=dhaniakhali#products'
  },
  {
    id: 3,
    label: 'PURE BENGAL SILK',
    title: 'Bishnupuri Pure Silk',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800',
    link: '/shop?cat=handloom-saree&type=bishnupuri-pure-silk#products'
  },
  {
    id: 4,
    label: 'HANDSPUN KHADI',
    title: 'Plain & Applic Khadi',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800',
    link: '/shop?cat=handloom-saree&type=plain-khadi#products'
  },
  {
    id: 5,
    label: 'LIGHTWEIGHT LINEN',
    title: 'Linen Jamdani',
    image: 'https://images.unsplash.com/photo-1610030469215-f47b8a2c8e01?auto=format&fit=crop&q=80&w=800',
    link: '/shop?cat=handloom-saree&type=linen-jamdani#products'
  },
  {
    id: 6,
    label: 'BENGAL DESIGNER',
    title: 'Designer Blouses',
    image: 'https://images.unsplash.com/photo-1544413660-299165566b1d?auto=format&fit=crop&q=80&w=800',
    link: '/shop?cat=designer-blouse#products'
  }
];

const MAGENTA  = '#b13896';
const DARK   = '#161114';
const IVORY    = '#FBF9FA';
const SANS     = "'Plus Jakarta Sans', 'Inter', sans-serif";
const SERIF    = "'Playfair Display', Georgia, serif";

const PromoSlider = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <section
      className="w-full relative py-10 lg:py-16 overflow-hidden"
      style={{ backgroundColor: IVORY, borderTop: '1px solid rgba(26,16,64,0.06)' }}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mb-6 flex flex-col items-center text-center">
        {/* Standardized Unified Section Header */}
        <SectionHeader
          badgeText="FEATURED COLLECTIONS"
          badgeIcon={<Sparkles />}
          titlePrefix="Curated Just"
          highlightText="for You"
          description="Handpicked Bengal weaves, silk sarees, and designer blouses tailored for elegance."
          className="mb-8"
        />
        
        {/* Custom Navigation */}
        <div className="flex items-center gap-3 -mt-6">
          <button
            ref={prevRef}
            aria-label="Previous slide"
            className="w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md"
            style={{ borderColor: 'rgba(26,16,64,0.18)', color: '#3D3460', background: '#FFFFFF' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = MAGENTA; e.currentTarget.style.color = MAGENTA; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(26,16,64,0.18)'; e.currentTarget.style.color = '#3D3460'; }}
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <button
            ref={nextRef}
            aria-label="Next slide"
            className="w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md"
            style={{ borderColor: 'rgba(26,16,64,0.18)', color: '#3D3460', background: '#FFFFFF' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = MAGENTA; e.currentTarget.style.color = MAGENTA; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(26,16,64,0.18)'; e.currentTarget.style.color = '#3D3460'; }}
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Slider */}
      <div className="px-6 lg:px-12">
        <Swiper
          modules={[Navigation, Autoplay]}
          spaceBetween={16}
          slidesPerView={1.2}
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
          onBeforeInit={(swiper) => {
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          breakpoints={{
            480: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
            1280: { slidesPerView: 5 },
          }}
          className="w-full !overflow-visible"
        >
          {collections.map((item) => (
            <SwiperSlide key={item.id}>
              <Link
                to={item.link}
                className="group relative block h-[380px] lg:h-[450px] overflow-hidden rounded-lg"
                style={{ background: '#E8E0D5' }}
              >
                {/* Image */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-110"
                />

                {/* Overlay */}
                <div
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(to top, rgba(22,17,20,0.9) 0%, rgba(22,17,20,0.3) 50%, transparent 100%)' }}
                />

                {/* Label badge */}
                <div
                  className="absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] font-bold tracking-[0.25em] uppercase"
                  style={{ background: MAGENTA, color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {item.label}
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 lg:p-6">
                  <div className="space-y-2 transform transition-transform duration-500 ease-out group-hover:-translate-y-2.5">
                    <h3
                      className="text-white font-light text-[19px] lg:text-[22px] leading-tight"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-white/75 text-[9px] tracking-widest uppercase font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <span className="group-hover:text-[#b13896] transition-colors">Discover</span>
                      <div
                        className="w-6 h-6 rounded-full border border-white/25 flex items-center justify-center transition-all duration-300 group-hover:border-[#b13896] group-hover:bg-[#b13896]"
                      >
                        <ChevronRight size={12} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default PromoSlider;
