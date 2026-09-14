import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, FreeMode } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';

const worldEdits = [
  {
    id: 1,
    region: "India",
    subtext: "Royal Heritage",
    location: "Rajasthan",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800",
    link: "/world-edit/india?edit=royal-heritage#collection"
  },
  {
    id: 2,
    region: "Korea",
    subtext: "Minimal Elegance",
    location: "Seoul",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800",
    link: "/world-edit/korea?edit=minimal-elegance#collection"
  },
  {
    id: 3,
    region: "Turkey",
    subtext: "Timeless Beauty",
    location: "Istanbul",
    image: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&q=80&w=800",
    link: "/world-edit/turkey?edit=timeless-beauty#collection"
  },
  {
    id: 4,
    region: "Arabia",
    subtext: "Golden Opulence",
    location: "Dubai",
    image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=800",
    link: "/world-edit/arabia?edit=golden-opulence#collection"
  },
  {
    id: 5,
    region: "Europe",
    subtext: "Classic Glamour",
    location: "Paris",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800",
    link: "/world-edit/europe?edit=classic-glamour#collection"
  }
];

const WorldEdit = () => {
  return (
    <section className="bg-[#F8F4EF] py-12 lg:py-20 overflow-hidden relative border-t border-[#e5d5df]/30">
      {/* Background Decorative Element */}
      <div className="absolute top-20 right-0 pointer-events-none select-none overflow-hidden opacity-[0.02]">
        <span className="text-[30rem] font-serif italic text-[#b13896] leading-none">Global</span>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-16">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-12">
          <div className="space-y-6 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-[1px] bg-[#b13896]" />
              <span className="text-[14px] md:text-[12px] tracking-[0.4em] font-bold text-[#4a3f44] uppercase">
                WORLD EDIT
              </span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl lg:text-6xl font-serif text-[#161114] leading-tight"
            >
              Beauty <span className="text-[#b13896] italic">Beyond Borders</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-[#4a3f44] font-serif text-base md:text-lg leading-relaxed max-w-lg"
            >
              A curation of masterpieces inspired by the world's most evocative cultures and artistry.
            </motion.p>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-4 hidden md:flex">
                <button className="world-prev w-14 h-14 rounded-full border border-[#e5d5df] flex items-center justify-center text-[#161114] hover:bg-[#b13896] hover:text-white hover:border-[#b13896] transition-all duration-500 group">
                  <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <button className="world-next w-14 h-14 rounded-full border border-[#e5d5df] flex items-center justify-center text-[#161114] hover:bg-[#b13896] hover:text-white hover:border-[#b13896] transition-all duration-500 group">
                  <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
          </div>
        </div>

        {/* Swiper Slider */}
        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination, FreeMode]}
            spaceBetween={30}
            slidesPerView={1.2}
            freeMode={true}
            navigation={{
              prevEl: '.world-prev',
              nextEl: '.world-next',
            }}
            pagination={{
              clickable: true,
              el: '.world-pagination',
            }}
            breakpoints={{
              640: { slidesPerView: 2.2 },
              1024: { slidesPerView: 3.2 },
              1440: { slidesPerView: 3.8 },
            }}
            className="w-full"
          >
            {worldEdits.map((item, index) => (
              <SwiperSlide key={item.id}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  className="group relative h-[480px] lg:h-[520px] overflow-hidden rounded-[1.5rem] cursor-pointer shadow-sm hover:shadow-xl transition-shadow duration-700"
                >
                  {/* Image */}
                  <img 
                    src={item.image} 
                    alt={item.region} 
                    className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-110"
                  />
                  
                  {/* Overlays - Increased for better visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1816]/95 via-[#1A1816]/20 to-transparent opacity-90 transition-opacity duration-700" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[14px] tracking-[0.4em] font-bold text-[#b13896] uppercase">
                           {item.subtext}
                        </span>
                        <h3 className="text-2xl lg:text-3xl font-serif text-white tracking-wide">{item.region}</h3>
                        <p className="text-[14px] text-white/60 font-serif italic">{item.location}</p>
                      </div>
                      
                      <div className="pt-4 border-t border-white/10 flex items-center justify-between group/btn">
                         <Link to={item.link} className="flex items-center gap-3 text-[14px] tracking-[0.3em] font-bold text-white uppercase group-hover:text-[#F8F4EF] transition-colors">
                            Explore Collection
                         </Link>
                         <div className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center text-white group-hover/btn:bg-[#b13896] group-hover/btn:border-[#b13896] transition-all duration-300">
                            <ArrowUpRight size={16} />
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Number Badge - Subtle */}
                  <div className="absolute top-8 right-8 text-white/10 font-serif text-4xl">
                    0{item.id}
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          {/* Mobile Pagination */}
          <div className="world-pagination mt-16 flex justify-center lg:hidden" />
          
          {/* Custom Scroll Progress Bar for Premium touch */}
          <div className="mt-20 h-[1px] w-full bg-[#e5d5df]/30 relative rounded-full hidden lg:block">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-[#b13896] w-1/4 rounded-full"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "circOut" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorldEdit;