import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Maximize2, X } from 'lucide-react';

const MAGENTA = '#b13896';
const DARK = '#161114';
const LIGHT_BG = '#FDFBF9';
const SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const videoClips = [
  {
    id: 1,
    title: "The Rhythm of the Loom",
    desc: "Watch the warp and weft interlacing dynamically on a traditional wooden pit loom.",
    videoUrl: "https://res.cloudinary.com/ewqgfmrg/video/upload/v1784458201/tuka1_ebqj4b.mp4", 
    tag: "Handloom Weaving"
  },
  {
    id: 2,
    title: "Spindle & Bobbin",
    desc: "Weavers spinning natural cotton threads onto small bobbins using vintage charkhas.",
    videoUrl: "https://res.cloudinary.com/ewqgfmrg/video/upload/v1784458201/tuka4_eiflfp.mp4",
    tag: "Thread Spinning"
  },
  {
    id: 3,
    title: "Beating the Weft",
    desc: "A close look at pressing each row of thread with the reed to lock the saree's texture.",
    videoUrl: "https://res.cloudinary.com/ewqgfmrg/video/upload/v1784458201/tuka3_ox4a4i.mp4",
    tag: "Motif Placements"
  }
];

const heritageTools = [
  {
    id: 'loom',
    title: "Weaving Loom (Tant)",
    subtitle: "The Handloom Machine",
    desc: "The wooden framework where the weaver sits. In Bengal, handloom pit looms and frame looms are passed down through generations to create world-famous cottons, khadi, and silks.",
    image: "https://images.unsplash.com/photo-1584949514123-474cfa705df2?auto=format&fit=crop&q=80&w=800",
    allied: "Framework"
  },
  {
    id: 'artisan',
    title: "Women Weavers",
    subtitle: "Masters of the Loom",
    desc: "Bengal sarees come to life through the dexterity of women and men craftspeople who thread each spindle. They handle the intricate count alignments and hand-paint or applique details.",
    image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&q=80&w=800",
    allied: "Warp Alignment"
  },
  {
    id: 'shuttle',
    title: "Weaving Shuttle",
    subtitle: "The Weft Carrier",
    desc: "A boat-shaped wooden tool carrying the bobbin with the cross-wise weft thread. It is shot swiftly back and forth across the warp threads, making the rhythmic 'clack-clack' sounds.",
    image: "https://images.unsplash.com/photo-1606744881023-e5d4cb05c48b?auto=format&fit=crop&q=80&w=800",
    allied: "Weft Tool"
  },
  {
    id: 'bobbins',
    title: "Pirns & Bobbins",
    subtitle: "Yarn Spools",
    desc: "Small wooden or paper tubes onto which dyed yarn is wound. The pirn sits securely inside the hollow core of the shuttle, releasing yarn continuously as the shuttle glides.",
    image: "https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&q=80&w=800",
    allied: "Colored Yarn"
  }
];

const WeavingHeritage = () => {
  const [activeVideo, setActiveVideo] = useState(videoClips[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoomedTool, setZoomedTool] = useState(null);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoSelect = (clip) => {
    setActiveVideo(clip);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  // Animation variants
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <section 
      className="py-20 lg:py-32 relative overflow-hidden selection:bg-[#b13896] selection:text-white" 
      style={{ backgroundColor: LIGHT_BG }}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Section Header */}
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="space-y-5 mb-20 text-center"
        >
          <div className="flex items-center justify-center gap-4">
            <span className="w-12 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${MAGENTA})` }} />
            <span
              className="text-[10px] tracking-[0.4em] font-bold uppercase"
              style={{ color: MAGENTA, fontFamily: SANS }}
            >
              Bengal Craft Narrative
            </span>
            <span className="w-12 h-[1px]" style={{ background: `linear-gradient(-90deg, transparent, ${MAGENTA})` }} />
          </div>
          
          <h2
            className="font-light leading-tight tracking-tight text-4xl md:text-6xl"
            style={{ color: DARK, fontFamily: SERIF }}
          >
            The Soul of <span className="italic font-medium" style={{ color: MAGENTA }}>Bengal Handloom</span>
          </h2>
          
          <p
            className="text-[15px] lg:text-[17px] leading-relaxed max-w-2xl mx-auto font-light text-gray-500"
            style={{ fontFamily: SANS }}
          >
            Behind every weave lies the history of Bengal. Journey through vintage Kolkata, the rhythm of the wooden pit loom, and the traditional instruments that forge our heirloom sarees.
          </p>
        </motion.div>

        {/* Narrative & Video Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-24 items-stretch">
          
          {/* Left Narrative Card */}
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="lg:col-span-5 rounded-[2rem] p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden group shadow-2xl shadow-black/5"
            style={{ 
              background: `linear-gradient(145deg, #161114 0%, #2a1a23 100%)`,
              border: `1px solid rgba(177, 56, 150, 0.15)` 
            }}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay group-hover:scale-110 group-hover:opacity-30 transition-all duration-[3000ms] ease-out"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&q=80&w=800')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#161114] opacity-80" />

            <div className="space-y-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#b13896]/30 bg-[#b13896]/10 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b13896] animate-pulse" />
                <span className="text-[9px] tracking-widest font-bold uppercase text-white">Historical Symphony</span>
              </div>
              
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-light text-white leading-[1.1]" style={{ fontFamily: SERIF }}>
                From Old Kolkata to rural <span className="italic" style={{ color: MAGENTA }}>Tant Ghar</span>
              </h3>
              
              <div className="space-y-4">
                <p className="text-[15px] text-gray-300 font-light leading-relaxed opacity-90" style={{ fontFamily: SANS }}>
                  Bengal's handloom is not a mere industry; it's a centuries-old heritage. From the royal patronage of cotton weaves in the neighborhoods of Old Kolkata to the rural cottage looms of Shantipur and Dhaniakhali.
                </p>
                <p className="text-[15px] text-gray-400 font-light leading-relaxed opacity-80" style={{ fontFamily: SANS }}>
                  Every single saree tells a story of local mud houses, of women singing traditional folk songs while spinning yarn bobbins, and weavers guiding shuttles in unison.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Media Card (Video) */}
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="lg:col-span-7 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl shadow-black/5 bg-white border border-black/5 relative"
          >
            {/* Video Canvas */}
            <div className="relative h-[300px] lg:h-[400px] w-full bg-[#161114] overflow-hidden group">
              <video 
                ref={videoRef}
                src={activeVideo.videoUrl}
                autoPlay muted loop playsInline
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
              />
              
              {/* Central Play Button */}
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors duration-300 cursor-pointer"
                onClick={togglePlay}
              >
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:scale-110 hover:bg-[#b13896] hover:border-[#b13896] transition-all duration-300 shadow-2xl">
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </div>
              </div>

              {/* Tag Overlays */}
              <div className="absolute top-6 left-6 z-10 flex gap-2">
                <span className="font-bold tracking-widest text-[10px] uppercase px-4 py-2 rounded-full text-white bg-black/40 backdrop-blur-md border border-white/10">
                  🎬 {activeVideo.tag}
                </span>
              </div>
            </div>

            {/* Video Meta & Selectors */}
            <div className="p-8 lg:p-10 flex-1 flex flex-col justify-between bg-white">
              <div className="mb-8">
                <h4 className="text-2xl font-medium mb-2" style={{ color: DARK, fontFamily: SERIF }}>
                  {activeVideo.title}
                </h4>
                <p className="text-[14px] text-gray-500 font-light max-w-lg leading-relaxed" style={{ fontFamily: SANS }}>
                  {activeVideo.desc}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {videoClips.map((clip) => {
                  const isActive = clip.id === activeVideo.id;
                  return (
                    <button
                      key={clip.id}
                      onClick={() => handleVideoSelect(clip)}
                      className={`text-left p-4 rounded-2xl transition-all duration-300 flex flex-col justify-between border ${
                        isActive 
                          ? 'border-[#b13896] bg-[#b13896]/5 shadow-lg shadow-[#b13896]/10' 
                          : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-gray-100/50'
                      }`}
                    >
                      <span className={`text-[10px] tracking-widest font-bold uppercase mb-3 ${isActive ? 'text-[#b13896]' : 'text-gray-400'}`}>
                        Clip 0{clip.id}
                      </span>
                      <span className={`text-[13px] font-medium leading-tight ${isActive ? 'text-[#161114]' : 'text-gray-600'}`}>
                        {clip.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Allied Items Photo Exhibition */}
        
      </div>

      {/* Elegant Tool Details Modal */}
      <AnimatePresence>
        {zoomedTool && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#161114]/90 backdrop-blur-md"
            onClick={() => setZoomedTool(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl bg-[#FDFBF9] rounded-[2rem] overflow-hidden shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setZoomedTool(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center text-gray-800 hover:bg-white hover:scale-105 transition-all"
              >
                <X size={20} />
              </button>

              <div className="grid md:grid-cols-2">
                <div className="h-64 md:h-full w-full relative">
                  <img 
                    src={zoomedTool.image} 
                    alt={zoomedTool.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-8 md:p-10 flex flex-col justify-center space-y-6">
                  <div>
                    <span className="text-[10px] tracking-widest font-extrabold uppercase text-[#b13896] block mb-2">
                      {zoomedTool.subtitle}
                    </span>
                    <h3 className="text-3xl font-light mb-4" style={{ color: DARK, fontFamily: SERIF }}>
                      {zoomedTool.title}
                    </h3>
                    <p className="text-[15px] text-gray-600 font-light leading-relaxed" style={{ fontFamily: SANS }}>
                      {zoomedTool.desc}
                    </p>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-200">
                    <span className="text-[11px] tracking-widest font-bold text-gray-400 uppercase block mb-1">Category</span>
                    <span className="text-[14px] font-medium text-gray-800">{zoomedTool.allied}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default WeavingHeritage;