import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Gavel, Scale, FileText, Globe, RefreshCcw } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

const TermsAndConditions = () => {
  const fader = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
  };

  const breadcrumbLinks = [
    { name: 'Home', href: '/' },
    { name: 'Terms', href: '/terms-and-conditions', active: true }
  ];

  return (
    <div className="min-h-screen bg-[#FDFAF5] text-[#161114] font-sans overflow-hidden">
      
      {/* Premium Breadcrumb */}
      <Breadcrumb 
        title="Terms & Conditions"
        subtitle="The legal framework governing our relationship with our valued patrons."
        bgImage="https://images.unsplash.com/photo-1554034483-04fac19c3d71?auto=format&fit=crop&q=80&w=1600"
        links={breadcrumbLinks}
      />

      <div className="max-w-4xl mx-auto py-20 px-6 relative z-10">
        <motion.div {...fader}>
          
          <div className="space-y-20 sm:space-y-24 text-[#4a3f44] leading-relaxed tracking-wide text-base sm:text-lg font-light">
            <section className="space-y-8 group">
              <div className="flex items-center gap-5 text-[#b13896]">
                <div className="w-12 h-12 rounded-2xl bg-[#b13896]/5 flex items-center justify-center shadow-sm group-hover:bg-[#b13896] group-hover:text-white transition-all duration-500">
                  <Scale size={22} />
                </div>
                <h2 className="text-[#161114] text-2xl font-serif font-bold tracking-tight">01. Acceptance of Terms</h2>
              </div>
              <p className="font-serif">
                By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. 
                In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
              </p>
            </section>

            <section className="space-y-8 group">
              <div className="flex items-center gap-5 text-[#b13896]">
                <div className="w-12 h-12 rounded-2xl bg-[#b13896]/5 flex items-center justify-center shadow-sm group-hover:bg-[#b13896] group-hover:text-white transition-all duration-500">
                  <FileText size={22} />
                </div>
                <h2 className="text-[#161114] text-2xl font-serif font-bold tracking-tight">02. Intellectual Property</h2>
              </div>
              <p className="font-serif">
                The Site and its original content, features, and functionality are owned by Tuka and are protected by international copyright, 
                trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
              </p>
            </section>

            <section className="space-y-8 group">
              <div className="flex items-center gap-5 text-[#b13896]">
                <div className="w-12 h-12 rounded-2xl bg-[#b13896]/5 flex items-center justify-center shadow-sm group-hover:bg-[#b13896] group-hover:text-white transition-all duration-500">
                  <Gavel size={22} />
                </div>
                <h2 className="text-[#161114] text-2xl font-serif font-bold tracking-tight">03. Termination</h2>
              </div>
              <p className="font-serif">
                We may terminate your access to the Site, without cause or notice, which may result in the forfeiture and destruction of all information 
                associated with you. All provisions of this Agreement that by their nature should survive termination shall survive termination.
              </p>
            </section>

            <section className="space-y-8 group">
              <div className="flex items-center gap-5 text-[#b13896]">
                <div className="w-12 h-12 rounded-2xl bg-[#b13896]/5 flex items-center justify-center shadow-sm group-hover:bg-[#b13896] group-hover:text-white transition-all duration-500">
                  <Globe size={22} />
                </div>
                <h2 className="text-[#161114] text-2xl font-serif font-bold tracking-tight">04. Governing Law</h2>
              </div>
              <p className="font-serif">
                This Agreement (and any further rules, polices, or guidelines incorporated by reference) shall be governed and construed in accordance with 
                the laws of India, without giving effect to any principles of conflicts of law.
              </p>
            </section>

            <section className="space-y-8 group">
              <div className="flex items-center gap-5 text-[#b13896]">
                <div className="w-12 h-12 rounded-2xl bg-[#b13896]/5 flex items-center justify-center shadow-sm group-hover:bg-[#b13896] group-hover:text-white transition-all duration-500">
                  <RefreshCcw size={22} />
                </div>
                <h2 className="text-[#161114] text-2xl font-serif font-bold tracking-tight">05. Changes to This Agreement</h2>
              </div>
              <p className="font-serif">
                We reserve the right, at our sole discretion, to modify or replace these Terms and Conditions by posting the updated terms on the Site. 
                Your continued use of the Site after any such changes constitutes your acceptance of the new Terms and Conditions.
              </p>
            </section>
          </div>

          <div className="mt-32 pt-16 border-t border-[#e5d5df]/20 text-center">
            <p className="text-[14px] tracking-[0.5em] uppercase text-[#4a3f44]/30 font-bold font-serif">© 2026 TUKA. Bengal Handlooms.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
