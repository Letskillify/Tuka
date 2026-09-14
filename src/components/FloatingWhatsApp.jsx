import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingWhatsApp = () => {
  const [showTooltip, setShowTooltip] = useState(true);
  const whatsappNumber = '916265998887';
  const defaultMessage = 'Hello Tuka, I have an inquiry regarding handloom sarees and designer blouses.';

  const handleWhatsAppClick = () => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-5 z-[60] flex flex-col items-end pointer-events-auto">
      {/* Tooltip Popup */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="mb-3 bg-[#161114] text-white p-3.5 rounded-2xl shadow-2xl border border-[#b13896]/30 flex items-center gap-3 max-w-[240px]"
          >
            <div className="relative flex-shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-ping absolute top-0 right-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block absolute top-0 right-0" />
              <div className="w-8 h-8 rounded-full bg-[#b13896]/20 flex items-center justify-center text-[#f4cfeb] font-bold text-xs">
                TUKA
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#f4cfeb]">Tuka </p>
              <p className="text-[12px] text-white/90 font-light leading-tight">Need help picking a saree?</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Animated Button */}
      <motion.button
        onClick={handleWhatsAppClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Chat with Tuka on WhatsApp"
        className="relative group w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_10px_30px_rgba(37,211,102,0.45)] cursor-pointer"
      >
        {/* Animated Ripple Pulse Ring */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping opacity-75" />

        {/* WhatsApp Icon */}
        <MessageCircle size={28} className="relative z-10 fill-white text-[#25D366]" />

        {/* Subtle Online Badge */}
        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full z-20" />
      </motion.button>
    </div>
  );
};

export default FloatingWhatsApp;
