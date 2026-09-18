import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube, Mail, ArrowRight, MapPin, Phone, Sparkles, MessageCircle } from 'lucide-react';

const DARK = '#161114';
const MAGENTA = '#b13896';
const SERIF = "'Playfair Display', Georgia, serif";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const sections = [
    {
      title: "SHOP",
      links: [
        { name: "Handloom Sarees", href: "/shop?cat=Saree#products" },
        { name: "Dhaniakhali Saree", href: "/shop?q=Dhaniakhali#products" },
        { name: "Begumpuri Saree", href: "/shop?q=Begumpuri#products" },
        { name: "Shantipuri Saree", href: "/shop?q=Shantipuri#products" },
        { name: "Jamdani Saree", href: "/shop?q=Jamdani#products" },
      ]
    },
    {
      title: "COLLECTIONS",
      links: [
        { name: "Hindshree Saree", href: "/shop?q=Hindshree#products" },
        { name: "Designer Blouses", href: "/shop?cat=Designer%20Blouse#products" },
        { name: "Boutique Collection", href: "/shop?cat=Boutique%20Collection#products" },
        { name: "Kantha Stitch Saree", href: "/shop?q=Kantha#products" },
        { name: "Tussar Silk Saree", href: "/shop?q=Tussar#products" },
      ]
    },
    {
      title: "HELP & SUPPORT",
      links: [
        { name: "Contact Us", href: "/contact?ref=footer#reach-us" },
        { name: "Order Details & Tracking", href: "/order-details" },
        { name: "Return Policy", href: "/return-policy?ref=footer#returns" },
        { name: "Privacy Policy", href: "/privacy-policy?ref=footer#privacy" },
        { name: "Terms & Conditions", href: "/terms-and-conditions?ref=footer#terms" },
      ]
    },
    {
      title: "COMPANY",
      links: [
        { name: "Our Story", href: "/about?ref=footer#our-story" },
        { name: "All Products", href: "/shop?cat=all#products" },
        { name: "My Account", href: "/account?ref=footer" },
        { name: "Wishlist", href: "/wishlist?ref=footer" },
        { name: "Cart", href: "/cart?ref=footer" },
      ]
    }
  ];

  return (
    <footer className="w-full relative overflow-hidden bg-[#FDFBF9] border-t border-slate-200/80 font-sans">

      {/* ── Newsletter Strip ───────────────────────── */}
      <div style={{ backgroundColor: DARK }} className="py-14 sm:py-18 px-4 sm:px-8 border-b border-white/10 relative">

        {/* Subtle Ambient Radial Glow */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 0%, ${MAGENTA} 0%, transparent 65%)`,
            filter: 'blur(40px)'
          }}
        />

        <div className="max-w-[1360px] mx-auto relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">

          {/* Newsletter Text */}
          <div className="text-center lg:text-left space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[#b13896]/40 bg-[#b13896]/15 text-xs font-bold tracking-[0.2em] text-[#f4cfeb] uppercase mb-1">
              <Sparkles size={13} className="text-[#f4cfeb]" />
              <span>HOUSE OF TUKA CONCIERGE</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-light text-white tracking-tight leading-tight" style={{ fontFamily: SERIF }}>
              Subscribe for Heritage Previews & Offers
            </h3>
            <p className="text-sm sm:text-base text-white/70 font-light leading-relaxed">
              Be the first to receive new weaver drop alerts, festive discounts, and bespoke styling tips.
            </p>
          </div>

          {/* Newsletter Form */}
          <form className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 max-w-md shrink-0" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email address"
              className="px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white text-sm sm:text-base placeholder:text-white/40 focus:outline-none focus:border-[#b13896] transition-all flex-1 min-w-[280px] font-sans"
              required
            />
            <button
              type="submit"
              className="px-7 py-4 rounded-xl text-xs sm:text-sm tracking-widest font-bold uppercase transition-all duration-300 flex items-center justify-center gap-2 bg-[#b13896] hover:bg-[#962e7f] text-white shadow-lg cursor-pointer shrink-0"
            >
              <span>Subscribe</span>
              <ArrowRight size={16} />
            </button>
          </form>

        </div>
      </div>

      {/* ── Main Footer Grid ───────────────────────── */}
      <div className="py-16 sm:py-20 px-4 sm:px-8 lg:px-12 bg-[#FDFBF9]">
        <div className="max-w-[1360px] mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 pb-14 border-b border-slate-200/80">

            {/* Left Brand Info */}
            <div className="lg:col-span-4 space-y-6">
              <Link to="/" className="inline-block group">
                <img
                  src="/img/Tuka-Logo.svg"
                  alt="Tuka"
                  className="h-12 sm:h-14 object-contain brightness-0 transition-transform group-hover:scale-105 duration-300"
                />
              </Link>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-light max-w-sm">
                Tuka brings you authentic Bengal ethnic fashion — hand-woven by hereditary master artisans to celebrate timeless tradition and everyday elegance.
              </p>

              {/* Direct Contacts - Normal Sans-Serif Numbers */}
              <div className="space-y-3 pt-2 text-sm sm:text-base text-slate-800 font-sans">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#b13896]/10 flex items-center justify-center shrink-0">
                    <Phone size={16} className="text-[#b13896]" />
                  </div>
                  <span className="font-semibold text-slate-900 tracking-normal">+91 62659 98887</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#b13896]/10 flex items-center justify-center shrink-0">
                    <Mail size={16} className="text-[#b13896]" />
                  </div>
                  <span className="font-medium text-slate-800">hello@tuka.in</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#b13896]/10 flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-[#b13896]" />
                  </div>
                  <span className="font-medium text-slate-800">Bengal Weaving Cluster, West Bengal, India</span>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="flex items-center gap-3.5 pt-3">
                {[
                  { icon: <Instagram size={19} />, href: 'https://www.instagram.com/reel/Da623OHsZyl/?igsh=MjB3MzBwbjJudnli', label: 'Instagram' },
                  { icon: <Facebook size={19} />, href: 'https://www.facebook.com/share/p/14iA59vUbt6/', label: 'Facebook' },
                  { icon: <MessageCircle size={19} />, href: 'https://wa.me/message/VFPFWD6OPAYVC1', label: 'WhatsApp' },
                ].map(({ icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-[#b13896] text-slate-800 hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm cursor-pointer"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Right Navigation Columns */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10">
              {sections.map((section) => (
                <div key={section.title} className="space-y-5">
                  <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-900 border-b-2 border-[#b13896]/30 pb-2.5 inline-block">
                    {section.title}
                  </h4>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        <Link
                          to={link.href}
                          className="text-sm sm:text-[15px] text-slate-700 hover:text-[#b13896] transition-colors font-normal hover:translate-x-0.5 inline-block"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

          </div>

          {/* ── Bottom Bar (Copyright & Policy Links) ───────────────────────── */}
          <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600 font-sans">
            <p className="text-center sm:text-left font-normal">
              © {currentYear} House of Tuka. All Rights Reserved. Crafted with care in India.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium">
              <Link to="/privacy-policy" className="hover:text-[#b13896] transition-colors">
                Privacy Policy
              </Link>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden sm:inline-block" />
              <Link to="/terms-and-conditions" className="hover:text-[#b13896] transition-colors">
                Terms & Conditions
              </Link>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden sm:inline-block" />
              <Link to="/return-policy" className="hover:text-[#b13896] transition-colors">
                Returns & Exchange
              </Link>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
