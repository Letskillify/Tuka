import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import SectionHeader from './SectionHeader';

import 'swiper/css';
import 'swiper/css/navigation';

const reviews = [
  {
    name: "Priya Sharma",
    location: "Mumbai",
    purchase: "Dhaniakhali Cotton Saree",
    quote: "The Dhaniakhali saree I ordered was breathtaking! The weave density, contrast Kanchha border, and pure cotton texture exceeded all expectations.",
    rating: 5,
    verified: true,
  },
  {
    name: "Ananya Roy",
    location: "Kolkata",
    purchase: "Begumpuri Handloom Saree",
    quote: "As someone who loves authentic Bengal handloom, Tuka is a revelation. The Begumpuri saree is featherlight, breathable, and drapes like a dream.",
    rating: 5,
    verified: true,
  },
  {
    name: "Sunita Mukherjee",
    location: "Delhi",
    purchase: "Shantipuri Fine Weave",
    quote: "The Shantipuri saree with Bhomra motifs feels like wearing royalty. Unmatched 120s thread count quality and beautiful packaging.",
    rating: 5,
    verified: true,
  },
  {
    name: "Kavitha Reddy",
    location: "Hyderabad",
    purchase: "Saree & Designer Blouse Set",
    quote: "Ordered a designer blouse along with a Khadi Applic saree. The tailoring fit, finishing, and fabric soft feel are absolutely flawless!",
    rating: 5,
    verified: true,
  },
  {
    name: "Debjani Bose",
    location: "Bengaluru",
    purchase: "Hindshree Hand Paint Saree",
    quote: "The Hindshree collection is sheer art on handloom. The hand-painted organic floral saree received endless compliments at the wedding.",
    rating: 5,
    verified: true,
  }
];

const MAGENTA = '#b13896';
const LIGHT_BG = '#FBF9FA';
const DARK = '#161114';
const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";

const TestimonialSection = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <section className="py-10 lg:py-16 relative overflow-hidden selection:bg-[#b13896] selection:text-white" style={{ background: LIGHT_BG }}>
      {/* Subtle ambient light gradient background decoration */}
      <div
        className="absolute top-0 inset-x-0 h-40 pointer-events-none opacity-60"
        style={{ background: 'linear-gradient(180deg, #ffffff 0%, transparent 100%)' }}
      />
      <div
        className="absolute -top-24 right-10 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-30"
        style={{ background: `${MAGENTA}20` }}
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Standardized Unified Section Header */}
        <SectionHeader
          badgeText="CUSTOMER LOVE & REVIEWS"
          badgeIcon={<Heart />}
          titlePrefix="Real Stories."
          highlightText="Real Elegance."
          description="Discover why thousands of saree connoisseurs and patrons across India choose Tuka for authentic Bengal handlooms."
        />

        {/* Overall Rating Stats & Navigation Controls */}
        <div className="flex items-center justify-center gap-6 -mt-6 mb-8 flex-wrap">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white border border-gray-200/80 shadow-sm">
            <div className="flex -space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <div className="text-left border-l border-gray-200 pl-3">
              <span className="text-xs font-bold text-gray-900 block" style={{ fontFamily: SANS }}>4.95 / 5.0 Rating</span>
              <span className="text-[10px] text-gray-500 font-medium block" style={{ fontFamily: SANS }}>2,500+ Verified Buyers</span>
            </div>
          </div>

          {/* Custom Carousel Arrows */}
          <div className="flex items-center gap-2.5">
            <button
              ref={prevRef}
              aria-label="Previous testimonial"
              className="w-11 h-11 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center shadow-sm hover:bg-[#b13896] hover:text-white hover:border-[#b13896] transition-all duration-300 active:scale-95"
            >
              <ChevronLeft size={20} strokeWidth={1.5} />
            </button>
            <button
              ref={nextRef}
              aria-label="Next testimonial"
              className="w-11 h-11 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center shadow-sm hover:bg-[#b13896] hover:text-white hover:border-[#b13896] transition-all duration-300 active:scale-95"
            >
              <ChevronRight size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={24}
            slidesPerView={1.1}
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            breakpoints={{
              640: { slidesPerView: 1.6 },
              1024: { slidesPerView: 2.8 },
              1280: { slidesPerView: 3 },
            }}
            className="!overflow-visible"
          >
            {reviews.map((review, index) => (
              <SwiperSlide key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-8 lg:p-10 rounded-3xl bg-white border border-gray-200/70 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(177,56,150,0.08)] hover:border-[#b13896]/30 transition-all duration-500 flex flex-col justify-between h-full group"
                  style={{ minHeight: '340px' }}
                >
                  <div>
                    {/* Top row: Rating + Verified Badge */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex gap-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                        ))}
                      </div>

                      {review.verified && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <ShieldCheck size={12} />
                          <span className="text-[10px] font-bold tracking-wider uppercase" style={{ fontFamily: SANS }}>
                            Verified
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quote text */}
                    <p 
                      className="text-gray-800 text-base lg:text-lg leading-relaxed italic font-normal mb-6 group-hover:text-gray-900 transition-colors"
                      style={{ fontFamily: SERIF }}
                    >
                      "{review.quote}"
                    </p>
                  </div>

                  {/* Author Card Footer */}
                  <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${MAGENTA} 0%, #85216e 100%)`, fontFamily: SANS }}
                      >
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900" style={{ fontFamily: SANS }}>
                          {review.name}
                        </h4>
                        <p className="text-[11px] text-gray-500 font-normal" style={{ fontFamily: SANS }}>
                          {review.location}
                        </p>
                      </div>
                    </div>

                    {/* Purchased Item tag */}
                    <span
                      className="text-[10px] tracking-wider uppercase font-semibold px-2.5 py-1 rounded-md bg-gray-50 text-gray-500 border border-gray-100 hidden sm:inline-block"
                      style={{ fontFamily: SANS }}
                    >
                      {review.purchase}
                    </span>
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

      </div>
    </section>
  );
};

export default TestimonialSection;