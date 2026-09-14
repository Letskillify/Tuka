import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Menu, X, ShoppingBag, Heart, User,
  ChevronDown, ChevronLeft, ChevronRight, ArrowRight,
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './Firebase';
import { useAuth } from './useAuth';
import { useStore } from '../hooks/useStore';

/* ─── Design Tokens ──────────────────────────────────── */
const MAGENTA = '#b13896';
const DARK = '#161114';
const LIGHT_BG = '#FBF9FA';
const NAV_SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const NAV_SERIF = "'Playfair Display', Georgia, serif";

const LuxuryHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isTransparentRoute =
    location.pathname === '/' ||
    location.pathname === '/shop' ||
    location.pathname === '/cart' ||
    location.pathname === '/wishlist' ||
    location.pathname === '/account' ||
    location.pathname === '/about' ||
    location.pathname.startsWith('/product/');

  const [scrolled, setScrolled] = useState(!isTransparentRoute || window.scrollY > 40);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenu, setMegaMenu] = useState(null);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const { user } = useAuth();
  const { cartCount, wishlistCount } = useStore();

  // Firestore dynamic products & categories state
  const [dbProducts, setDbProducts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [dbSubcategories, setDbSubcategories] = useState([]);

  useEffect(() => {
    const unsubProds = onSnapshot(collection(db, 'products'), (snap) => {
      setDbProducts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      setDbCategories(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });

    const unsubSubs = onSnapshot(collection(db, 'subcategories'), (snap) => {
      setDbSubcategories(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });

    return () => {
      unsubProds();
      unsubCats();
      unsubSubs();
    };
  }, []);

  useEffect(() => {
    if (!isTransparentRoute) { setScrolled(true); return; }
    setScrolled(window.scrollY > 40);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname, isTransparentRoute]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen || searchOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen, searchOpen]);

  /* ─ Dynamic Nav Data derived from Uploaded Products & Categories ───── */
  const navLinks = useMemo(() => {
    const categoryMap = new Map();

    const addCat = (name) => {
      if (!name || typeof name !== 'string') return;
      const trimmed = name.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (!categoryMap.has(key)) {
        categoryMap.set(key, trimmed);
      }
    };

    // Standard baseline categories
    const defaultCats = [
      'Saree',
      'Boutique Collection',
    ];
    defaultCats.forEach(addCat);

    // Categories uploaded in Firebase 'categories' collection
    dbCategories.forEach((c) => {
      if (c.name && c.status !== 'Inactive') addCat(c.name);
    });

    // Categories from uploaded products
    dbProducts.forEach((p) => {
      if (p.category) addCat(p.category);
    });

    // Categories from uploaded subcategories
    dbSubcategories.forEach((s) => {
      if (s.category) addCat(s.category);
    });

    const categoriesList = Array.from(categoryMap.values()).filter(
      (cat) => cat.toLowerCase() !== 'handloom saree' && cat.toLowerCase() !== 'designer blouse'
    );

    const categoryPromoImages = {
      'handloom saree': 'https://images.unsplash.com/photo-1610030470298-40e1eaccf77d?auto=format&fit=crop&q=80&w=800',
      'designer blouse': 'https://images.unsplash.com/photo-1583390389001-8c9ac72a65f4?auto=format&fit=crop&q=80&w=800',
      'saree': 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800',
      'boutique collection': 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=800',
    };

    const defaultSareeSubcategories = [
      'Dhaniakhali Saree',
      'Begumpuri Saree',
      'Shantipuri Saree',
      'Hindshree saree',
    ];

    const defaultBlouseSubcategories = [
      'Cotton Blouse',
      'Silk Blouse',
      'Printed Blouse',
      'Khadi Blouse',
    ];

    const links = categoriesList.map((catName) => {
      const catKey = catName.toLowerCase();
      const subMap = new Set();

      if (catKey.includes('saree')) {
        defaultSareeSubcategories.forEach((s) => subMap.add(s));
      } else if (catKey.includes('blouse')) {
        defaultBlouseSubcategories.forEach((s) => subMap.add(s));
      }

      // Merge subcategories from Firebase 'subcategories' collection
      dbSubcategories.forEach((s) => {
        if (s.name && s.status !== 'Inactive') {
          const subCatParent = (s.category || '').toLowerCase();
          if (
            subCatParent === catKey ||
            (subCatParent === '' && catKey.includes('saree')) ||
            (subCatParent === 'saree' && catKey.includes('saree'))
          ) {
            subMap.add(s.name);
          }
        }
      });

      // Merge subcategories from uploaded products
      dbProducts.forEach((p) => {
        if (p.subCategory) {
          const prodCat = (p.category || '').toLowerCase();
          if (
            prodCat === catKey ||
            (!prodCat && catKey.includes('saree'))
          ) {
            subMap.add(p.subCategory);
          }
        }
      });

      const subList = catKey.includes('saree')
        ? defaultSareeSubcategories
        : Array.from(subMap);

      const sections = [];
      if (subList.length > 0) {
        const chunkSize = Math.max(4, Math.ceil(subList.length / 3));
        for (let i = 0; i < subList.length; i += chunkSize) {
          const chunk = subList.slice(i, i + chunkSize);
          const icons = ['🪷', '✧', '✿', '◇', '✦'];
          const icon = icons[sections.length % icons.length];
          sections.push({
            title: sections.length === 0 ? `${catName} Subcategories` : `More ${catName} Weaves`,
            icon,
            items: chunk,
          });
        }
      }

      const img = categoryPromoImages[catKey] || 'https://images.unsplash.com/photo-1610030470298-40e1eaccf77d?auto=format&fit=crop&q=80&w=800';

      return {
        name: catName,
        href: `/shop?cat=${encodeURIComponent(catName)}#products`,
        subcategories: subList,
        megaMenu: sections.length > 0 ? {
          sections,
          image: img,
          tagline: 'TERRITORY OF WEAVES',
          heading: catName,
        } : null,
      };
    });

    links.push({ name: 'Our Story', href: '/about?ref=header#story' });
    links.push({ name: 'Contact us', href: '/contact?ref=header#reach-us' });

    return links;
  }, [dbProducts, dbCategories, dbSubcategories]);

  /* ─── Derived header style ────────────────────────── */
  const headerBg = scrolled ? '#ffffff' : 'transparent';
  const headerBorder = scrolled ? 'rgba(0,0,0,0.04)' : 'transparent';
  const textColor = scrolled ? DARK : '#ffffff';

  const logoFilter = scrolled ? 'none' : 'brightness(0) invert(1)';

  return (
    <>
      {/* ── Main Header ───────────────────────────────── */}
      <header
        className="w-full fixed z-50 transition-all duration-500"
        style={{
          top: 0,
          left: 0,
          right: 0,
          background: scrolled
            ? 'rgba(255, 255, 255, 0.94)'
            : 'linear-gradient(to bottom, rgba(14,9,12,0.75) 0%, rgba(14,9,12,0.2) 65%, transparent 100%)',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(177, 56, 150, 0.1)' : '1px solid transparent',
          boxShadow: scrolled ? '0 10px 30px -10px rgba(22, 17, 20, 0.06)' : 'none',
        }}
      >
        <div
          className="max-w-[1440px] mx-auto px-5 lg:px-12 flex items-center justify-between"
          style={{ height: scrolled ? '66px' : '84px', transition: 'height 0.4s ease' }}
        >
          {/* ── Left cluster: Redesigned Menu Toggle & Search ── */}
          <div className="flex items-center gap-3 md:gap-4 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="group relative flex items-center gap-2.5 px-3 py-2 sm:px-4 sm:py-2 rounded-full border transition-all duration-300 hover:shadow-[0_0_20px_rgba(177,56,150,0.25)] hover:border-[#b13896]/50 active:scale-95 cursor-pointer"
              style={{
                borderColor: scrolled ? 'rgba(177, 56, 150, 0.25)' : 'rgba(255, 255, 255, 0.25)',
                background: scrolled ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(16px)',
                color: textColor,
              }}
              aria-label="Open Menu"
            >
              {/* Animated 3-bar toggle icon */}
              <div className="relative w-4 h-4 sm:w-4.5 sm:h-4.5 flex flex-col justify-center items-center gap-1">
                <span className="w-3.5 sm:w-4 h-0.5 rounded-full bg-current transition-all group-hover:w-4.5 group-hover:bg-[#b13896]" />
                <span className="w-4 sm:w-4.5 h-0.5 rounded-full bg-current transition-all group-hover:bg-[#b13896]" />
                <span className="w-2.5 sm:w-3.5 h-0.5 rounded-full bg-current transition-all group-hover:w-4.5 group-hover:bg-[#b13896]" />
              </div>
              {/* Menu text */}
              <span
                className="hidden md:inline-block text-[11px] font-bold uppercase tracking-[0.22em] ml-0.5"
                style={{ fontFamily: NAV_SANS }}
              >
                Menu
              </span>
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-[#b13896]/10 hover:text-[#b13896] group cursor-pointer"
              style={{ color: textColor }}
              aria-label="Search"
            >
              <Search size={19} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* ── Center: Logo ─────────────────────────── */}
          <div className="flex-1 flex justify-center">
            <Link to="/?ref=header#hero" className="block transition-transform duration-500 hover:scale-105">
              <img
                src={scrolled ? '/img/logo.svg' : '/img/Tuka-Logo.svg'}
                alt="Tuka"
                className="object-contain drop-shadow-sm"
                style={{
                  height: scrolled ? '50px' : '44px',
                  transition: 'all 0.4s ease',
                  filter: logoFilter,
                }}
              />
            </Link>
          </div>

          {/* ── Right cluster: Contact Us, Profile, Cart ── */}
          <div className="flex items-center justify-end gap-2 md:gap-4 flex-1">
            <Link
              to="/contact?ref=header#reach-us"
              className="hidden sm:inline-flex text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors hover:text-[#b13896] px-2 py-1"
              style={{ color: textColor, fontFamily: NAV_SANS }}
            >
              Contact Us
            </Link>

            <Link
              to={user ? '/account?tab=overview#profile' : '/login?redirect=account#auth'}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-[#b13896]/10 hover:text-[#b13896] group"
              style={{ color: textColor }}
              aria-label="User Account"
            >
              <User size={20} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
            </Link>

            <Link
              to="/cart?step=view#cart-summary"
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-[#b13896]/10 group"
              style={{ color: textColor }}
              aria-label="Cart"
            >
              <ShoppingBag
                size={20}
                strokeWidth={1.5}
                className="group-hover:scale-110 transition-transform"
                style={{ color: cartCount > 0 ? MAGENTA : 'inherit' }}
              />
              {cartCount > 0 && <BadgeDot count={cartCount} />}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Fullscreen Search Overlay ─────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
            style={{ background: 'rgba(26,16,64,0.96)', backdropFilter: 'blur(20px)' }}
          >
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute top-7 right-8 p-2 text-white/50 hover:text-white transition-colors"
            >
              <X size={26} strokeWidth={1.2} />
            </button>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-2xl px-6"
            >
              <p
                className="text-center text-[12px] tracking-[0.4em] uppercase mb-8 font-medium"
                style={{ color: MAGENTA }}
              >
                Search our collections
              </p>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchVal.trim()) {
                    navigate(`/shop?q=${encodeURIComponent(searchVal.trim())}#products`);
                    setSearchOpen(false);
                  }
                }}
                className="relative flex items-center border-b border-white/20 focus-within:border-[#b13896] transition-colors duration-300 pb-2"
              >
                <Search size={18} strokeWidth={1.2} className="absolute left-0 text-white/30" />
                <input
                  autoFocus
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search sarees, khadi, designer blouses…"
                  className="w-full bg-transparent pl-8 pr-4 py-4 text-white text-lg font-light placeholder-white/25 outline-none"
                  style={{ fontFamily: NAV_SANS }}
                />
                {searchVal && (
                  <button type="button" onClick={() => setSearchVal('')} className="absolute right-0 text-white/30 hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                )}
              </form>
              <div className="mt-10 flex flex-wrap gap-3 justify-center">
                {['Silk Sarees', 'Cotton Saree', 'Khadi', 'Linen Jamdani', 'Designer Blouse'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSearchVal(tag);
                      navigate(`/shop?q=${encodeURIComponent(tag)}#products`);
                      setSearchOpen(false);
                    }}
                    className="px-5 py-2 border border-white/15 text-white/60 hover:border-[#b13896] hover:text-[#b13896] hover:bg-[#b13896]/10 transition-all duration-300 text-[11px] font-bold tracking-widest uppercase rounded-full cursor-pointer"
                    style={{ fontFamily: NAV_SANS }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile Drawer ─────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[90]"
              style={{ background: 'rgba(26,16,64,0.6)', backdropFilter: 'blur(4px)' }}
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 top-0 bottom-0 z-[100] w-[88vw] max-w-sm flex flex-col overflow-hidden"
              style={{ background: DARK }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-6 py-5"
                style={{ borderBottom: `1px solid ${MAGENTA}25` }}
              >
                <div className="flex items-center gap-3">
                  <img src="/img/Tuka-Logo.svg" alt="Tuka" className="h-8" style={{ filter: 'brightness(0) invert(1)' }} />
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-full transition-colors cursor-pointer"
                  style={{ border: `1px solid ${MAGENTA}40`, color: '#ffffff', background: `${MAGENTA}15` }}
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              {/* Quick Category Tag Pills */}
              

              {/* Nav items */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname + location.search === link.href;

                  return (
                    <div key={link.name} style={{ borderBottom: `1px solid rgba(177,56,150,0.12)` }}>
                      <div className="flex justify-between items-center py-4">
                        <Link
                          to={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`text-lg font-light flex items-center gap-2 transition-colors ${
                            isActive ? 'text-[#f4cfeb] font-semibold' : 'text-white/90 hover:text-[#b13896]'
                          }`}
                          style={{ fontFamily: NAV_SANS }}
                        >
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#b13896]" />}
                          {link.name}
                        </Link>
                        {link.megaMenu && (
                          <button
                            onClick={() => setMobileExpanded(mobileExpanded === link.name ? null : link.name)}
                            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                          >
                            <ChevronDown
                              size={18}
                              strokeWidth={1.5}
                              style={{
                                color: MAGENTA,
                                transform: mobileExpanded === link.name ? 'rotate(180deg)' : 'rotate(0)',
                                transition: 'transform 0.3s ease',
                              }}
                            />
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {mobileExpanded === link.name && link.megaMenu && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden mb-4"
                          >
                            <div
                              className="rounded-xl p-4 space-y-5"
                              style={{ background: 'rgba(177, 56, 150,0.12)', border: '1px solid rgba(177, 56, 150,0.2)' }}
                            >
                              {link.megaMenu.sections.map((section, idx) => (
                                <div key={idx} className="space-y-2">
                                  <p className="text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: '#f4cfeb' }}>
                                    {section.icon} {section.title}
                                  </p>
                                  <ul className="space-y-1.5 pl-3">
                                    {section.items.map((item, i) => (
                                      <li key={i}>
                                        <Link
                                          to={`/shop?cat=${encodeURIComponent(link.name)}&q=${encodeURIComponent(item)}#products`}
                                          onClick={() => setMobileOpen(false)}
                                          className="text-xs text-white/70 hover:text-white transition-colors block py-0.5"
                                          style={{ fontFamily: NAV_SANS }}
                                        >
                                          {item}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Drawer footer */}
              <div
                className="px-6 py-5"
                style={{ borderTop: `1px solid ${MAGENTA}25`, background: 'rgba(22,17,20,0.95)' }}
              >
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    to="/wishlist?ref=drawer#wishlist"
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-col items-center py-2.5 px-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#b13896] transition-all relative group"
                  >
                    <Heart size={18} strokeWidth={1.5} className="text-[#f4cfeb] mb-1" />
                    <span className="text-[9px] tracking-wider font-bold uppercase text-white/80">Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className="absolute top-1.5 right-3 bg-[#b13896] text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/account?tab=overview#profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-col items-center py-2.5 px-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#b13896] transition-all group"
                  >
                    <User size={18} strokeWidth={1.5} className="text-[#f4cfeb] mb-1" />
                    <span className="text-[9px] tracking-wider font-bold uppercase text-white/80">Account</span>
                  </Link>

                  <Link
                    to="/cart?ref=drawer#cart"
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-col items-center py-2.5 px-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#b13896] transition-all relative group"
                  >
                    <ShoppingBag size={18} strokeWidth={1.5} className="text-[#f4cfeb] mb-1" />
                    <span className="text-[9px] tracking-wider font-bold uppercase text-white/80">Cart</span>
                    {cartCount > 0 && (
                      <span className="absolute top-1.5 right-3 bg-[#b13896] text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── Badge Dot ──────────────────────────────────────── */
const MAGENTA_LOCAL = '#b13896';
const BadgeDot = ({ count }) => (
  <span
    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
    style={{ background: MAGENTA_LOCAL }}
  >
    {count}
  </span>
);

/* ─── Header Icon Button ─────────────────────────────── */
const HdrIconBtn = ({ children, onClick, label, scrolled }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="group p-2.5 rounded-full transition-all duration-300"
    style={{
      background: scrolled ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.1)',
      color: scrolled ? DARK : 'rgba(255,255,255,0.9)',
    }}
  >
    <span className="group-hover:text-[#b13896] transition-colors block">{children}</span>
  </button>
);

/* ─── Mega Menu Panel ────────────────────────────────── */
const MegaMenuPanel = ({ link }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 8 }}
    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    className="absolute top-full left-0 w-full z-[100]"
    style={{
      background: '#ffffff',
      borderTop: '1px solid rgba(0,0,0,0.04)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
    }}
  >
    <div className="max-w-[1440px] mx-auto flex h-[420px]">
      {/* Links */}
      <div className="flex-1 py-10 px-12 overflow-y-auto">
        <div
          className={`grid gap-x-12 gap-y-8 ${link.megaMenu.sections.length <= 2 ? 'grid-cols-2' : 'grid-cols-4'
            }`}
        >
          {link.megaMenu.sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xl opacity-70">{section.icon}</span>
                <h4
                  className="text-[12px] tracking-[0.25em] font-bold uppercase"
                  style={{ color: DARK }}
                >
                  {section.title}
                </h4>
              </div>
              <ul className="space-y-3 pl-9">
                {section.items.map((item, i) => (
                  <li key={i}>
                    <Link
                      to={`/shop?q=${encodeURIComponent(item)}#products`}
                      className="text-[14px] text-gray-500 hover:text-[#b13896] hover:translate-x-1 transition-all duration-200 block"
                      style={{ fontFamily: NAV_SANS }}
                    >
                      {item}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link
                    to={link.href}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors"
                    style={{ color: MAGENTA_LOCAL }}
                  >
                    Shop all <ArrowRight size={11} strokeWidth={2.5} />
                  </Link>
                </li>
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Promo image */}
      <div
        className="w-[380px] relative overflow-hidden flex-shrink-0 group"
      >
        <img
          src={link.megaMenu.image}
          alt={link.name}
          className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-110"
        />
        <div
          className="absolute inset-0 flex flex-col justify-end p-10"
          style={{ background: 'linear-gradient(to top, rgba(22,17,20,0.85) 0%, rgba(22,17,20,0.2) 50%, transparent 100%)' }}
        >
          <span className="text-[10px] tracking-[0.45em] font-bold uppercase mb-3" style={{ color: MAGENTA_LOCAL }}>
            {link.megaMenu.tagline}
          </span>
          <h3
            className="text-3xl font-light text-white mb-6 leading-snug italic"
            style={{ fontFamily: NAV_SERIF }}
          >
            {link.megaMenu.heading}
          </h3>
          <Link
            to={link.href}
            className="inline-flex items-center justify-center text-[11px] font-bold tracking-[0.25em] uppercase px-8 py-4 transition-all duration-500 hover:tracking-[0.3em] w-fit rounded-sm"
            style={{ background: MAGENTA_LOCAL, color: '#fff' }}
          >
            Explore
          </Link>
        </div>
      </div>
    </div>
  </motion.div>
);

export default LuxuryHeader;
