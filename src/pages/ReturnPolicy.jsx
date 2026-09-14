import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, RefreshCcw, Globe, Sparkles } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

const ReturnPolicy = () => {
  const fader = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 1, ease: [0.19, 1, 0.22, 1] }
  };

  const breadcrumbLinks = [
    { name: 'Home', href: '/' },
    { name: 'Returns', href: '/return-policy', active: true }
  ];

  return (
    <div className="min-h-screen bg-[#FDFAF5] text-[#161114] font-sans overflow-hidden">
      
      {/* Premium Breadcrumb */}
      <Breadcrumb 
        title="Return Policy"
        subtitle="Our commitment to your satisfaction — detailed guidelines for returns and exchanges."
        bgImage="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1600"
        links={breadcrumbLinks}
      />

      <div className="max-w-5xl mx-auto px-6 py-20 relative z-10">
        <motion.div {...fader} className="space-y-24 sm:space-y-32">

          <div className="grid gap-20 lg:gap-32">
            {/* Return Process */}
            <div className="grid md:grid-cols-12 gap-10 items-start group">
              <div className="md:col-span-4 flex items-center gap-5 text-[#b13896]">
                <div className="w-14 h-14 rounded-2xl bg-[#b13896]/5 flex items-center justify-center shadow-sm group-hover:bg-[#b13896] group-hover:text-white transition-all duration-500">
                  <RefreshCcw size={24} />
                </div>
                <h2 className="text-[14px] font-bold uppercase tracking-[0.4em]">Return Process</h2>
              </div>
              <div className="md:col-span-8 space-y-8">
                <p className="text-base sm:text-lg text-[#4a3f44] leading-relaxed font-light">
                  Returns are only accepted for defective products and must be made within 7 days of purchase. A clear video of the product unboxing is required as proof to process any return request. The product must be unused, in its original packaging, with the tag intact, and should include the invoice. To start the return process for defective products, please contact us at <a href="mailto:info@tuka.in" className="text-[#b13896] border-b-2 border-[#b13896]/20 hover:border-[#b13896] transition-all font-bold">info@tuka.in</a>.
                </p>
                <div className="p-10 bg-white/40 rounded-[32px] border border-[#e5d5df]/30 shadow-sm italic">
                  <p className="text-base text-[#161114] leading-relaxed font-serif">
                    "Our courier partner will collect the returned items from your specified address at no extra cost."
                  </p>
                </div>
              </div>
            </div>

            {/* Return Charges */}
            <div className="grid md:grid-cols-12 gap-10 items-start group">
              <div className="md:col-span-4 flex items-center gap-5 text-[#b13896]">
                <div className="w-14 h-14 rounded-2xl bg-[#b13896]/5 flex items-center justify-center shadow-sm group-hover:bg-[#b13896] group-hover:text-white transition-all duration-500">
                  <Globe size={24} />
                </div>
                <h2 className="text-[14px] font-bold uppercase tracking-[0.4em]">Return Charges</h2>
              </div>
              <div className="md:col-span-8">
                <p className="text-base sm:text-lg text-[#4a3f44] leading-relaxed font-light">
                  Returns are free, and our courier partner will handle the collection within India.
                </p>
              </div>
            </div>

            {/* How to Initiate */}
            <div className="grid md:grid-cols-12 gap-10 items-start group">
              <div className="md:col-span-4 flex items-center gap-5 text-[#b13896]">
                <div className="w-14 h-14 rounded-2xl bg-[#b13896]/5 flex items-center justify-center shadow-sm group-hover:bg-[#b13896] group-hover:text-white transition-all duration-500">
                  <Sparkles size={24} />
                </div>
                <h2 className="text-[14px] font-bold uppercase tracking-[0.4em]">Refunding Steps</h2>
              </div>
              <div className="md:col-span-8">
                <ul className="space-y-6">
                  {[
                    "Contact us during the specified period for your product type.",
                    "Wait for confirmation before returning the product.",
                    "Ensure all returns are in their original condition with the invoice included."
                  ].map((step, i) => (
                    <li key={i} className="flex gap-4 text-base sm:text-lg text-[#4a3f44] font-light leading-relaxed">
                      <span className="text-[#b13896] font-bold">•</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Refunds */}
            <div className="grid md:grid-cols-12 gap-10 items-start group">
              <div className="md:col-span-4 flex items-center gap-5 text-[#b13896]">
                <div className="w-14 h-14 rounded-2xl bg-[#b13896]/5 flex items-center justify-center shadow-sm group-hover:bg-[#b13896] group-hover:text-white transition-all duration-500">
                  <ShieldCheck size={24} />
                </div>
                <h2 className="text-[14px] font-bold uppercase tracking-[0.4em]">Refunds</h2>
              </div>
              <div className="md:col-span-8">
                <p className="text-base sm:text-lg text-[#4a3f44] leading-relaxed font-light">
                  Refunds are processed after we receive the product in its original, unused condition with packaging and tags intact. Refunds will be issued within 5 working days via the original payment method or by cheque.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-24 border-t border-[#e5d5df]/30 text-center">
            <p className="text-[14px] tracking-[0.5em] uppercase text-[#4a3f44]/30 font-bold">© 2026 TUKA. Handloom Heritage & Fine Tailoring.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReturnPolicy;
