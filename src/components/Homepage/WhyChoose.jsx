import React from 'react';
import { motion } from 'framer-motion';
import { Gem, Award, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import SectionHeader from './SectionHeader';

const SANS     = "'Plus Jakarta Sans', 'Inter', sans-serif";
const MAGENTA  = '#b13896';
const DARK     = '#161114';
const LIGHT_BG = '#FDFBFB';

const features = [
  {
    icon: <Sparkles className="w-5 h-5" strokeWidth={1.5} />,
    title: "Pure Handloom",
    description: "Directly sourced from traditional weavers and handloom houses across India's master craft clusters."
  },
  {
    icon: <Gem className="w-5 h-5" strokeWidth={1.5} />,
    title: "Heirloom Quality",
    description: "Every accessory and garment is hand-finished with meticulous precision to survive generations."
  },
  {
    icon: <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />,
    title: "Authentic Materials",
    description: "Rigorous certification checks ensuring 100% genuine silks, linens, and pure metallic fibers."
  },
  {
    icon: <Heart className="w-5 h-5" strokeWidth={1.5} />,
    title: "Fair Trade Pride",
    description: "Proudly supporting regional weavers with guaranteed fair wages and ethical community trade."
  },
  {
    icon: <Award className="w-5 h-5" strokeWidth={1.5} />,
    title: "Premier Trust",
    description: "Rated 4.9★ by over 10k+ luxury fashion collectors, wedding wardrobes, and daily stylists."
  }
];

const QualitySection = () => {
  return (
    <section
      className="py-10 lg:py-16 relative overflow-hidden"
      style={{ backgroundColor: LIGHT_BG, borderTop: '1px solid rgba(22,17,20,0.04)' }}
    >
      {/* Ambient Radial Background Glows */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] opacity-[0.05] pointer-events-none rounded-full blur-[120px]"
        style={{ background: MAGENTA }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-[0.04] pointer-events-none rounded-full blur-[100px]"
        style={{ background: MAGENTA }}
      />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-16 w-full relative z-10">

        {/* Standardized Unified Section Header */}
        <SectionHeader
          badgeText="THE BRAND PROMISE"
          badgeIcon={<Sparkles />}
          titlePrefix="Craftsmanship in Every"
          highlightText="Detail"
          description="We curate luxury ethnic pieces directly from the source — celebrating Indian heritage, weavers, and your timeless expressions."
        />

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col items-center text-center p-8 lg:p-9 rounded-3xl bg-white transition-all duration-500 hover:shadow-[0_20px_50px_rgba(177,56,150,0.12)] hover:-translate-y-1.5 relative border border-black/[0.04] hover:border-[#b13896]/30"
            >
              {/* Icon Container with dual-ring hover glow */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all duration-500 relative"
                style={{
                  background: `${MAGENTA}08`,
                  border: '1px solid rgba(177, 56, 150, 0.2)',
                  boxShadow: 'inset 0 0 12px rgba(177, 56, 150, 0.04)'
                }}
              >
                <div
                  className="absolute inset-[3px] rounded-full opacity-0 scale-75 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 shadow-md shadow-[#b13896]/30"
                  style={{ background: MAGENTA }}
                />
                <span className="relative z-10 transition-colors duration-500 group-hover:text-white" style={{ color: MAGENTA }}>
                  {React.cloneElement(feature.icon, {
                    className: "w-5 h-5 transition-colors duration-500",
                    style: { color: 'inherit' }
                  })}
                </span>
              </div>

              <h3
                className="text-[13px] tracking-[0.18em] font-extrabold uppercase mb-3 transition-colors duration-300 group-hover:text-[#b13896]"
                style={{ color: DARK, fontFamily: SANS }}
              >
                {feature.title}
              </h3>
              
              <p
                className="text-[13px] leading-relaxed font-light text-gray-500 group-hover:text-gray-700 transition-colors duration-500"
                style={{ fontFamily: SANS }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QualitySection;