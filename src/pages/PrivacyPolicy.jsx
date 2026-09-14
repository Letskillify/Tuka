import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Eye, Database } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

const PrivacyPolicy = () => {
  const fader = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
  };

  const breadcrumbLinks = [
    { name: 'Home', href: '/' },
    { name: 'Privacy', href: '/privacy-policy', active: true }
  ];

  return (
    <div className="min-h-screen bg-[#FDFAF5] text-[#161114] font-sans overflow-hidden">
      
      {/* Premium Breadcrumb */}
      <Breadcrumb 
        title="Privacy Policy"
        subtitle="How we protect your data and ensure your trust in our handloom catalog."
        bgImage="https://images.unsplash.com/photo-1544027993-37dbfe43552e?auto=format&fit=crop&q=80&w=1600"
        links={breadcrumbLinks}
      />

      <div className="max-w-4xl mx-auto py-20 px-6 relative z-10">
        <motion.div {...fader}>
          
          <div className="space-y-20 sm:space-y-24 text-[#4a3f44] leading-relaxed tracking-wide text-base sm:text-lg font-light">
            <section className="space-y-8 group">
              <div className="flex items-center gap-5 text-[#b13896]">
                <div className="w-12 h-12 rounded-2xl bg-[#b13896]/5 flex items-center justify-center shadow-sm group-hover:bg-[#b13896] group-hover:text-white transition-all duration-500">
                  <ShieldCheck size={22} />
                </div>
                <h2 className="text-[#161114] text-2xl font-serif font-bold tracking-tight">01. Commitment to Privacy</h2>
              </div>
              <p className="font-serif">
                At Tuka, we respect your privacy and are committed to protecting your personal data. 
                This privacy policy will inform you as to how we look after your personal data when you visit our website 
                and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section className="space-y-8 group">
              <div className="flex items-center gap-5 text-[#b13896]">
                <div className="w-12 h-12 rounded-2xl bg-[#b13896]/5 flex items-center justify-center shadow-sm group-hover:bg-[#b13896] group-hover:text-white transition-all duration-500">
                  <Database size={22} />
                </div>
                <h2 className="text-[#161114] text-2xl font-serif font-bold tracking-tight">02. Data We Collect</h2>
              </div>
              <p className="font-serif">
                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
              </p>
              <ul className="space-y-4">
                {[
                  { label: "Identity Data", desc: "Name, username or similar identifier" },
                  { label: "Contact Data", desc: "Billing address, delivery address, email and phone" },
                  { label: "Financial Data", desc: "Bank account and payment card details" },
                  { label: "Transaction Data", desc: "Payment history and purchased product details" },
                  { label: "Technical Data", desc: "IP address, login data, browser type and version" }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 items-start font-serif">
                    <span className="text-[#b13896] font-bold mt-1.5">•</span>
                    <span><strong className="text-[#161114] font-bold">{item.label}:</strong> {item.desc}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-8 group">
              <div className="flex items-center gap-5 text-[#b13896]">
                <div className="w-12 h-12 rounded-2xl bg-[#b13896]/5 flex items-center justify-center shadow-sm group-hover:bg-[#b13896] group-hover:text-white transition-all duration-500">
                  <Eye size={22} />
                </div>
                <h2 className="text-[#161114] text-2xl font-serif font-bold tracking-tight">03. How We Use Your Data</h2>
              </div>
              <p className="font-serif">
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
              </p>
              <ul className="space-y-4 font-serif">
                {[
                  "To perform the contract we are about to enter into or have entered into with you.",
                  "Where it is necessary for our legitimate interests and your rights do not override them.",
                  "Where we need to comply with a legal obligation."
                ].map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="text-[#b13896] font-bold">•</span>
                    {step}
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-8 group">
              <div className="flex items-center gap-5 text-[#b13896]">
                <div className="w-12 h-12 rounded-2xl bg-[#b13896]/5 flex items-center justify-center shadow-sm group-hover:bg-[#b13896] group-hover:text-white transition-all duration-500">
                  <Lock size={22} />
                </div>
                <h2 className="text-[#161114] text-2xl font-serif font-bold tracking-tight">04. Data Security</h2>
              </div>
              <p className="font-serif">
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. 
                In addition, we limit access to your personal data to those employees and agents who have a business need to know.
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

export default PrivacyPolicy;
