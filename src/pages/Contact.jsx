import React, { useState } from 'react';
import { Mail, Phone, MapPin, MessageCircle, Clock, Send, ChevronDown, Sparkles, ShieldCheck, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import Breadcrumb from '../components/Breadcrumb';

const MAGENTA = '#b13896';
const DARK = '#161114';
const SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    const textMsg = `Hello Tuka Studio,\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nInquiry: ${formData.subject}\nMessage: ${formData.message}`;
    const whatsappUrl = `https://wa.me/916265998887?text=${encodeURIComponent(textMsg)}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => setSubmitted(false), 3000);
  };

  const breadcrumbLinks = [
    { name: 'Home', href: '/' },
    { name: 'Contact Us', active: true }
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF9] text-[#161114]">
      
      {/* Centered Premium Page Hero Header */}
      <Breadcrumb 
        title="Contact Us"
        subtitle="We'd love to hear from you. Reach out for weave consultations, custom blouse measurements, or order tracking."
        links={breadcrumbLinks}
      />

      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 py-12 lg:py-20">
        
        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Left Column: Direct Concierge & Studio Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 space-y-6"
          >
            {/* Direct Studio Info Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              
              <div>
                <span className="text-[10px] font-bold tracking-[0.25em] text-[#b13896] uppercase block mb-1" style={{ fontFamily: SANS }}>
                  STUDIO CONCIERGE
                </span>
                <h2 className="text-2xl sm:text-3xl font-light text-[#161114]" style={{ fontFamily: SERIF }}>
                  We are here to assist you
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-light mt-1.5 leading-relaxed" style={{ fontFamily: SANS }}>
                  Have questions about fabric texture, saree drapes, or custom blouses? Connect directly with our studio team.
                </p>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100 font-sans">
                
                {/* Phone / WhatsApp */}
                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#b13896]/30 transition-all">
                  <div className="p-2.5 rounded-xl bg-[#b13896]/10 text-[#b13896] shrink-0 mt-0.5">
                    <Phone size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block" style={{ fontFamily: SANS }}>
                      Call or WhatsApp
                    </span>
                    <a 
                      href="https://wa.me/916265998887" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-base font-semibold text-slate-900 font-sans tracking-normal hover:text-[#b13896] transition-colors block"
                    >
                      +91 62659 98887
                    </a>
                    <span className="text-[11px] text-slate-500 font-normal" style={{ fontFamily: SANS }}>
                      Mon – Sat, 9:30 AM – 8:30 PM IST
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#b13896]/30 transition-all">
                  <div className="p-2.5 rounded-xl bg-[#b13896]/10 text-[#b13896] shrink-0 mt-0.5">
                    <Mail size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block" style={{ fontFamily: SANS }}>
                      Email Support
                    </span>
                    <a 
                      href="mailto:hello@tuka.in" 
                      className="text-base font-semibold text-slate-900 font-sans hover:text-[#b13896] transition-colors block"
                    >
                      hello@tuka.in
                    </a>
                    <span className="text-[11px] text-slate-500 font-normal" style={{ fontFamily: SANS }}>
                      Response within 2 business hours
                    </span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#b13896]/30 transition-all">
                  <div className="p-2.5 rounded-xl bg-[#b13896]/10 text-[#b13896] shrink-0 mt-0.5">
                    <MapPin size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block" style={{ fontFamily: SANS }}>
                      Studio Location
                    </span>
                    <p className="text-sm font-semibold text-slate-900 font-sans leading-snug">
                      Bengal Handloom Weaving Hub
                    </p>
                    <span className="text-[11px] text-slate-500 font-normal" style={{ fontFamily: SANS }}>
                      Hooghly & Kolkata, West Bengal, India
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Direct WhatsApp Instant Chat Banner */}
            <div className="bg-[#161114] rounded-3xl p-6 sm:p-7 text-white relative overflow-hidden shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366]">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#25D366]" style={{ fontFamily: SANS }}>
                    INSTANT ASSISTANCE
                  </span>
                  <h3 className="text-base font-medium text-white" style={{ fontFamily: SERIF }}>
                    Need Real Fabric Video Clips?
                  </h3>
                </div>
              </div>
              <p className="text-xs text-white/70 font-light mb-4 leading-relaxed" style={{ fontFamily: SANS }}>
                Tap below to chat directly with our studio team on WhatsApp for custom drape advice, weave verification, or order updates.
              </p>
              <a 
                href="https://wa.me/916265998887?text=Hello%20Tuka%20Studio,%20I%20need%20assistance%20with%20a%20saree%20order."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md font-sans"
              >
                <MessageCircle size={16} />
                <span>Chat on WhatsApp (+91 62659 98887)</span>
              </a>
            </div>

            {/* Heritage Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-3">
                <Award size={20} className="text-[#b13896] shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900" style={{ fontFamily: SANS }}>100% Handloom</h4>
                  <p className="text-[10px] text-slate-500" style={{ fontFamily: SANS }}>Pure Natural Yarns</p>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-3">
                <ShieldCheck size={20} className="text-[#b13896] shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900" style={{ fontFamily: SANS }}>GI Certified</h4>
                  <p className="text-[10px] text-slate-500" style={{ fontFamily: SANS }}>Authentic Origin</p>
                </div>
              </div>
            </div>

          </motion.div>

          {/* Right Column: High Visibility Contact & Inquiry Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm relative">
              
              <div className="mb-6 pb-4 border-b border-slate-100">
                <span className="text-[10px] font-bold tracking-[0.25em] text-[#b13896] uppercase block mb-1" style={{ fontFamily: SANS }}>
                  SEND A MESSAGE
                </span>
                <h2 className="text-2xl sm:text-3xl font-light text-[#161114]" style={{ fontFamily: SERIF }}>
                  Inquire or Custom Order
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-light mt-1" style={{ fontFamily: SANS }}>
                  Fill out the form below. Your message formats automatically for instant response via WhatsApp.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Full Name & Phone */}
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block" style={{ fontFamily: SANS }}>
                      Full Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#b13896] focus:bg-white transition-all font-sans" 
                      placeholder="e.g. Ananya Sharma" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block" style={{ fontFamily: SANS }}>
                      Phone / WhatsApp *
                    </label>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#b13896] focus:bg-white transition-all font-sans tracking-normal" 
                      placeholder="+91 98765 43210" 
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block" style={{ fontFamily: SANS }}>
                    Email Address *
                  </label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#b13896] focus:bg-white transition-all font-sans" 
                    placeholder="ananya@example.com" 
                  />
                </div>

                {/* Inquiry Category */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block" style={{ fontFamily: SANS }}>
                    Inquiry Category
                  </label>
                  <div className="relative">
                    <select 
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#b13896] focus:bg-white transition-all appearance-none cursor-pointer font-sans"
                    >
                      <option>Saree Inquiry & Weave Consultation</option>
                      <option>Custom Blouse Tailoring</option>
                      <option>Order Tracking & Support</option>
                      <option>Boutique & Bulk Orders</option>
                      <option>General Inquiry</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block" style={{ fontFamily: SANS }}>
                    Your Message *
                  </label>
                  <textarea 
                    rows="4" 
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm text-slate-900 outline-none focus:border-[#b13896] focus:bg-white transition-all resize-none font-sans" 
                    placeholder="Specify saree weave preferences, custom blouse measurements, or order questions..."
                  />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  className="w-full py-3.5 sm:py-4 rounded-xl bg-[#b13896] hover:bg-[#962e7f] text-white font-bold text-xs uppercase tracking-[0.2em] transition-all shadow-md shadow-[#b13896]/20 flex items-center justify-center gap-2 cursor-pointer"
                  style={{ fontFamily: SANS }}
                >
                  <Send size={15} />
                  <span>{submitted ? 'Opening WhatsApp...' : 'Send Message via WhatsApp'}</span>
                </button>

              </form>

            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Contact;