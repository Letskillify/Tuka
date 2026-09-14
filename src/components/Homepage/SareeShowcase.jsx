import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, Leaf, Feather, Sparkles, ArrowRight, Palette, Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionHeader from './SectionHeader';

const MAGENTA = '#b13896';
const DARK = '#161114';
const LIGHT_BG = '#FBF9FA';
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
    tagline: 'DENSE WEAVE & SIGNATURE KANCHHA BORDER',
    story: `Born in the quiet, green villages of Dhaniakhali in Hooghly district, the Dhaniakhali saree is world-renowned for its firm thread count, exceptional body, and distinctive contrast borders known as "Kanchha border". Meticulously handwoven on traditional wooden pit looms with 100s count combed cotton yarn, these sarees feature delicate striped pallus and a structured drape that naturally softens with every wash. Perfect for humid Indian climates, it stands as an enduring symbol of Bengali strength, grace, and everyday luxury.`,
    quote: `"Each thread in a Dhaniakhali saree is beat tightly with the reed, giving it a crisp, regal silhouette that holds shape all day."`,
    features: [
      {
        icon: <Award size={16} strokeWidth={1.5} />,
        title: 'GI Certified Authenticity',
        desc: 'Protected Geographical Indication guaranteeing authentic origin from Hooghly master weavers.'
      },
      {
        icon: <ShieldCheck size={16} strokeWidth={1.5} />,
        title: '100s Count Fine Cotton',
        desc: 'Superior high-density yarn alignment ensuring structure, opacity, and long-lasting durability.'
      },
      {
        icon: <Leaf size={16} strokeWidth={1.5} />,
        title: '100% Eco-Sustainable',
        desc: 'Natural yarn dyed with plant-based, non-toxic, skin-friendly colors free of harsh chemicals.'
      },
      {
        icon: <Feather size={16} strokeWidth={1.5} />,
        title: 'All-Day Crisp Comfort',
        desc: 'Highly breathable natural weave that stays cool in summer and provides timeless elegance.'
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
    story: `Hailing from the historic handloom cluster of Begampur, the Begumpuri saree is celebrated for its ethereal lightness, translucent body, and artistic "Macha chokh" (fish-scale) serrated borders. Woven using loosely twisted cotton yarns by hereditary master weavers, Begumpuri sarees represent a harmonious blend of rustic Bengali heritage and modern minimalist aesthetics. The shuttle glides effortlessly back and forth, creating an airy, cloud-like drape prized by textile connoisseurs across India and beyond.`,
    quote: `"Woven with loosely twisted yarns, Begumpuri sarees feel like a gentle breeze against your skin, blending comfort with subtle charm."`,
    features: [
      {
        icon: <Feather size={16} strokeWidth={1.5} />,
        title: 'Featherlight Weightless Drape',
        desc: 'Ultra-soft loose twist cotton offering an effortless, cloud-like feel for warm weather.'
      },
      {
        icon: <Sparkles size={16} strokeWidth={1.5} />,
        title: 'Macha Chokh Motif Borders',
        desc: 'Signature serrated geometric fish-scale motifs hand-wrought with wooden shuttles.'
      },
      {
        icon: <Award size={16} strokeWidth={1.5} />,
        title: 'Hereditary Weaver Heritage',
        desc: 'Preserving 300+ years of uncompromised family weaving tradition in rural Bengal.'
      },
      {
        icon: <Leaf size={16} strokeWidth={1.5} />,
        title: 'Zero Synthetic Additives',
        desc: 'Crafted entirely with pure organic yarn for maximum skin breathability and eco-purity.'
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
    tagline: 'GOSSAMER WEAVE & JACQUARD ROYAL MOTIFS',
    story: `Tracing its royal lineage to the 15th century under the patronage of the Kings of Nadia, Shantipur is the celebrated cradle of fine Bengal handloom weaving. Famous for its micro-fine 120s count combed cotton, gossamer-thin translucency, and intricate dobby border motifs like "Bhomra" (bumblebee) and "Taj", a Shantipuri saree exudes understated royalty. Each masterpiece takes 5 to 8 days of painstaking loomwork, flowing around the body like liquid silk with an unmatched opulent drape.`,
    quote: `"Patronized by 15th-century Bengali royalty, Shantipuri handlooms combine royal majesty with micro-fine combed yarns."`,
    features: [
      {
        icon: <Award size={16} strokeWidth={1.5} />,
        title: 'Royal 120s Fine Combed Yarns',
        desc: 'Gossamer micro-fine thread count delivering a silky smooth sheen and luxurious fluid drape.'
      },
      {
        icon: <Sparkles size={16} strokeWidth={1.5} />,
        title: 'Bhomra & Taj Dobby Motifs',
        desc: 'Intricate jacquard borders inspired by royal palace gardens and classical architecture.'
      },
      {
        icon: <ShieldCheck size={16} strokeWidth={1.5} />,
        title: 'GI Certified Heritage',
        desc: 'Official protection certifying centuries of royal textile craft in Nadia district.'
      },
      {
        icon: <Leaf size={16} strokeWidth={1.5} />,
        title: 'Direct Fair-Trade Impact',
        desc: 'Empowering traditional weaving families with fair living wages and ethical dignity.'
      }
    ],
    catLink: '/shop?cat=shantipuri#products'
  },
  {
    id: 'hindshree',
    number: '04',
    title: 'Hindshree Signature Collection',
    subtitle: 'Unbound Creativity & Handloom Innovation',
    origin: 'Weaving Clusters, West Bengal',
    giTag: 'Signature Handloom Craft',
    image: 'img/h.jpeg',
    tagline: 'FREEHAND ARTWORK & APPLIQUÉ NEEDLEWORK',
    story: `Hindshree is a tribute to Bengal’s rich handloom ecosystem—where ancient pit looms meet contemporary artistic experimentation. From delicate hand-painted motifs and hand-stitched appliqué art to raw, textured khadi and tissue linen glows, Hindshree celebrates the unlimited creative capacity of Bengal's master weavers and painters.`,
    quote: `"Where every thread is an artist's brushstroke, blending centuries-old weaving tradition with contemporary artistic flair."`,
    features: [
      {
        icon: <Feather size={16} strokeWidth={1.5} />,
        title: '100% Hand-Spun Yarns',
        desc: 'Natural cotton, hand-spun khadi, and pure European flax linen yarn purity.'
      },
      {
        icon: <Palette size={16} strokeWidth={1.5} />,
        title: 'Freehand Organic Painting',
        desc: 'Freehand motif artwork crafted with organic plant-based natural dyes by master weavers.'
      },
      {
        icon: <Scissors size={16} strokeWidth={1.5} />,
        title: 'Hand Appliqué Stitched',
        desc: 'Intricate geometric fabric cutout stitching celebrating age-old Bengali needlecraft.'
      },
      {
        icon: <Sparkles size={16} strokeWidth={1.5} />,
        title: 'Metallic Tissue Linen Glow',
        desc: 'Fine Zari metallic threads interlaced into pure flax linen for a subtle golden shimmer.'
      }
    ],
    catLink: '/shop?cat=hindshree#products'
  }
];

const SareeShowcase = () => {
  const [activeTab, setActiveTab] = useState(sareeData[0].id);

  return (
    <section className="py-14 lg:py-24 relative overflow-hidden bg-white">
      {/* Subtle Luxury Gradient Lines */}
      <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(177,56,150,0.25), transparent)' }} />
      <div className="absolute bottom-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)' }} />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Standardized Unified Section Header */}
        <SectionHeader
          badgeText="THE BRAND PROMISE"
          badgeIcon={<Sparkles size={13} />}
          titlePrefix="Craftsmanship in Every"
          highlightText="Detail"
          description="We curate luxury ethnic pieces directly from the source — celebrating Indian heritage, weavers, and your timeless expressions."
        />

        {/* Quick jump tabs - Mobile Scrollable & Desktop Centered */}
        <div className="flex items-center justify-start sm:justify-center gap-2.5 sm:gap-3 mt-4 mb-12 sm:mb-16 overflow-x-auto pb-3 sm:pb-0 scrollbar-hide px-2 sm:px-0">
          {sareeData.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`group shrink-0 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-[10px] sm:text-[11px] tracking-[0.18em] uppercase font-bold transition-all duration-300 flex items-center gap-2 border ${
                  isActive
                    ? 'bg-[#161114] text-white border-[#161114] shadow-md scale-[1.02]'
                    : 'bg-[#FBF9FA] text-[#161114] border-black/5 hover:border-[#b13896]/40 hover:bg-white'
                }`}
                style={{ fontFamily: SANS }}
              >
                <span
                  className={`text-[9px] sm:text-[10px] font-bold ${
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

        {/* Individual Saree Sections - Ultra Premium Editorial Cards */}
        <div className="space-y-16 lg:space-y-28">
          {sareeData.map((item, index) => {
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={item.id}
                id={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="scroll-mt-28 relative rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-14 overflow-hidden border transition-all duration-500 hover:shadow-xl"
                style={{
                  background: isEven ? LIGHT_BG : '#FFFFFF',
                  borderColor: isEven ? 'rgba(177, 56, 150, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.03)',
                }}
              >
                {/* Large Background Watermark Number */}
                <span
                  className="absolute -top-6 right-4 sm:right-10 text-[100px] sm:text-[160px] lg:text-[200px] font-light select-none pointer-events-none opacity-[0.03] transition-opacity group-hover:opacity-[0.06]"
                  style={{ fontFamily: SERIF, color: DARK }}
                >
                  {item.number}
                </span>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center relative z-10">
                  
                  {/* Model Photo Container */}
                  <div className={`lg:col-span-6 relative ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                    <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl group">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-[420px] sm:h-[540px] lg:h-[640px] object-cover object-center transition-transform duration-1000 group-hover:scale-105"
                      />

                      {/* Luxurious Dual Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#161114]/85 via-black/15 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                        <div
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md"
                          style={{
                            background: 'rgba(22, 17, 20, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                          }}
                        >
                          <ShieldCheck size={13} className="text-amber-400" />
                          <span className="text-[9px] sm:text-[10px] tracking-widest text-white font-bold uppercase" style={{ fontFamily: SANS }}>
                            {item.giTag}
                          </span>
                        </div>

                        <span
                          className="text-xs sm:text-sm tracking-widest text-white/90 font-bold px-3 py-1 rounded-full backdrop-blur-md"
                          style={{ background: 'rgba(177, 56, 150, 0.4)', border: '1px solid rgba(255, 255, 255, 0.2)', fontFamily: SANS }}
                        >
                          {item.number}
                        </span>
                      </div>

                      {/* Bottom Overlay Info on Mobile / Image Overlay */}
                      <div className="absolute bottom-4 left-4 right-4 z-10">
                        <span className="text-[9px] tracking-[0.3em] text-white/70 uppercase block mb-1 font-semibold" style={{ fontFamily: SANS }}>
                          ORIGIN & REGION
                        </span>
                        <p className="text-white text-base sm:text-xl font-medium tracking-wide" style={{ fontFamily: SERIF }}>
                          {item.origin}
                        </p>
                      </div>
                    </div>

                    {/* Ambient Glow */}
                    <div
                      className="absolute -inset-4 rounded-3xl -z-10 opacity-25 blur-2xl transition-opacity group-hover:opacity-45 pointer-events-none"
                      style={{ background: `radial-gradient(circle, ${MAGENTA} 0%, transparent 70%)` }}
                    />
                  </div>

                  {/* Content Container */}
                  <div className={`lg:col-span-6 space-y-5 sm:space-y-6 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                    
                    {/* Header Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-[1.5px] bg-[#b13896]" />
                        <span className="text-[10px] tracking-[0.35em] font-bold uppercase" style={{ color: MAGENTA, fontFamily: SANS }}>
                          {item.tagline}
                        </span>
                      </div>
                      <h3 className="text-2xl sm:text-4xl font-light text-gray-900 tracking-tight leading-tight mb-1" style={{ fontFamily: SERIF }}>
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium" style={{ fontFamily: SANS }}>
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Story Narrative with Quote */}
                    <div className="space-y-3 border-l-2 pl-4 sm:pl-5" style={{ borderColor: `${MAGENTA}40` }}>
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-light" style={{ fontFamily: SANS }}>
                        {item.story}
                      </p>
                      <p className="text-xs italic text-gray-600 font-serif leading-relaxed" style={{ fontFamily: SERIF }}>
                        {item.quote}
                      </p>
                    </div>

                    {/* Features Grid - 2 Column Grid even on Mobile for Clean Layout */}
                    <div className="pt-2">
                      <h4 className="text-[10px] sm:text-[11px] tracking-[0.25em] uppercase font-bold text-gray-900 mb-3" style={{ fontFamily: SANS }}>
                        Craftsmanship & Features
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {item.features.map((feat, fIdx) => (
                          <div
                            key={fIdx}
                            className="p-3 sm:p-3.5 rounded-xl flex items-start gap-3 transition-all duration-300 hover:bg-white hover:shadow-sm border"
                            style={{ background: isEven ? '#FFFFFF' : LIGHT_BG, borderColor: 'rgba(0,0,0,0.04)' }}
                          >
                            <div className="p-2 rounded-lg shrink-0" style={{ background: `${MAGENTA}12`, color: MAGENTA }}>
                              {feat.icon}
                            </div>
                            <div>
                              <h5 className="text-[11px] sm:text-xs font-bold text-gray-900 mb-0.5" style={{ fontFamily: SANS }}>
                                {feat.title}
                              </h5>
                              <p className="text-[11px] text-gray-500 font-light leading-snug" style={{ fontFamily: SANS }}>
                                {feat.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button & Handloom Tag */}
                    <div className="pt-3 flex items-center justify-between gap-4 flex-wrap">
                      <Link
                        to={item.catLink}
                        className="group inline-flex items-center gap-3 px-6 py-3.5 sm:px-7 sm:py-3.5 rounded-full text-white font-bold text-[10px] sm:text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:shadow-lg hover:shadow-[#b13896]/25 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                        style={{ background: MAGENTA, fontFamily: SANS }}
                      >
                        <span>Explore {item.title}</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </Link>

                      <span className="text-[10px] sm:text-xs text-gray-400 font-semibold tracking-wider uppercase flex items-center gap-1.5" style={{ fontFamily: SANS }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#b13896]" /> Handwoven in West Bengal
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
