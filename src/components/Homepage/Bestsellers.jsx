import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { Loader2, ShoppingBag, Heart, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../Firebase';
import { useStore } from '../../hooks/useStore';
import SectionHeader from './SectionHeader';
import AttributeBadges from '../AttributeBadges';

import 'swiper/css';
import 'swiper/css/navigation';

const MAGENTA   = '#b13896';
const DARK    = '#161114';
const LIGHT_BG  = '#FDF8F2';
const DARK_TEXT = '#161114';
const SERIF     = "'Playfair Display', Georgia, serif";
const SANS      = "'Plus Jakarta Sans', 'Inter', sans-serif";

const BestSellers = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartLoadings, setCartLoadings] = useState({});
  const [wishlistLoadings, setWishlistLoadings] = useState({});
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(8));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setProducts(list);
        setLoading(false);
      },
      (e) => {
        console.error("Error listening to bestsellers:", e);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const { addToCart, addToWishlist, isInCart, isInWishlist } = useStore();

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    setCartLoadings(prev => ({ ...prev, [product.id]: true }));
    try {
      const defaultVariant = product.sizeVariants && product.sizeVariants.length > 0 
        ? (product.sizeVariants.find(v => Number(v.stock || 0) > 0) || product.sizeVariants[0])
        : null;

      const productToCart = {
        ...product,
        id: defaultVariant ? `${product.id}_${defaultVariant.size}` : product.id,
        name: defaultVariant ? `${product.name} (${defaultVariant.size})` : product.name,
        price: defaultVariant ? Number(defaultVariant.price) : Number(product.price),
        original_price: defaultVariant ? Number(defaultVariant.original_price) : Number(product.original_price),
        stock: defaultVariant ? Number(defaultVariant.stock) : Number(product.stock),
        selectedSize: defaultVariant ? defaultVariant.size : null
      };

      await addToCart(productToCart);
    } finally {
      setCartLoadings(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const handleAddToWishlist = async (e, product) => {
    e.stopPropagation();
    setWishlistLoadings(prev => ({ ...prev, [product.id]: true }));
    try {
      await addToWishlist(product);
    } finally {
      setWishlistLoadings(prev => ({ ...prev, [product.id]: false }));
    }
  };

  return (
    <section className="py-10 lg:py-16 relative overflow-hidden" style={{ backgroundColor: LIGHT_BG, borderTop: '1px solid rgba(26,16,64,0.06)' }}>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">

        {/* Standardized Unified Section Header */}
        <SectionHeader
          badgeText="OUR BESTSELLERS"
          badgeIcon={<Sparkles />}
          titlePrefix="Most"
          highlightText="Loved"
          description="Our customers' favorite picks — handpicked ethnic fashion from across India's finest handloom workshops."
          className="mb-6"
        />

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-3 -mt-4 mb-8">
          <button
            ref={prevRef}
            aria-label="Previous product"
            className="w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none shadow-sm hover:shadow-md"
            style={{ borderColor: 'rgba(26,16,64,0.18)', color: '#3D3460', background: '#FFFFFF' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = MAGENTA; e.currentTarget.style.color = MAGENTA; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(26,16,64,0.18)'; e.currentTarget.style.color = '#3D3460'; }}
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <button
            ref={nextRef}
            aria-label="Next product"
            className="w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none shadow-sm hover:shadow-md"
            style={{ borderColor: 'rgba(26,16,64,0.18)', color: '#3D3460', background: '#FFFFFF' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = MAGENTA; e.currentTarget.style.color = MAGENTA; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(26,16,64,0.18)'; e.currentTarget.style.color = '#3D3460'; }}
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Product Slider */}
        <div className="relative">
          <Swiper
            modules={[Navigation]}
            spaceBetween={16}
            slidesPerView={1.35}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            breakpoints={{
              480: { slidesPerView: 2, spaceBetween: 20 },
              768: { slidesPerView: 2.8, spaceBetween: 24 },
              1024: { slidesPerView: 3.5, spaceBetween: 24 },
              1280: { slidesPerView: 4.2, spaceBetween: 24 },
            }}
            className="!overflow-visible"
          >
            {loading ? (
              <div className="flex gap-6 w-full">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex-1 min-w-[280px] aspect-[4/5] animate-pulse rounded-xl" style={{ background: 'rgba(26,16,64,0.06)' }} />
                ))}
              </div>
            ) : products.map((product) => {
              const defaultVariant = product.sizeVariants && product.sizeVariants.length > 0
                ? (product.sizeVariants.find(v => Number(v.stock || 0) > 0) || product.sizeVariants[0])
                : null;
              
              const price = defaultVariant ? Number(defaultVariant.price) : Number(product.price || 0);
              const original_price = defaultVariant ? Number(defaultVariant.original_price) : Number(product.original_price || 0);
              const stock = defaultVariant ? Number(defaultVariant.stock || 0) : Number(product.stock || 0);
              const compoundId = defaultVariant ? `${product.id}_${defaultVariant.size}` : product.id;

              const inWishlist = isInWishlist(product.id);
              const inCart = isInCart(compoundId);

              return (
                <SwiperSlide key={product.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="group flex flex-col space-y-4 cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {/* Image frame */}
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl border bg-[#FBF7F2] transition-all duration-500 hover:shadow-[0_12px_35px_rgba(26,16,64,0.10)]" style={{ borderColor: 'rgba(26,16,64,0.08)' }}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                      />

                      {/* Top floating attribute badges */}
                      <div className="absolute top-3 left-3 z-10 max-w-[65%]">
                        <AttributeBadges attributes={product.attributes} />
                      </div>

                      {/* Top floating wishlist button */}
                      <button
                        onClick={(e) => handleAddToWishlist(e, product)}
                        disabled={wishlistLoadings[product.id]}
                        aria-label="Add to wishlist"
                        className="absolute top-4 right-4 w-9 h-9 rounded-full border border-black/10 bg-white/95 flex items-center justify-center shadow-sm transition-all duration-300 z-10"
                        style={{ color: inWishlist ? MAGENTA : '#161114' }}
                      >
                        {wishlistLoadings[product.id] ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Heart size={14} fill={inWishlist ? MAGENTA : 'none'} stroke={inWishlist ? MAGENTA : 'currentColor'} strokeWidth={inWishlist ? 0 : 1.5} />
                        )}
                      </button>

                      {/* Clean Hover Slide-up for Quick Purchase */}
                      {stock > 0 && (
                        <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-10">
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={cartLoadings[product.id]}
                            className="w-full py-3 text-[9px] tracking-[0.22em] font-bold uppercase flex items-center justify-center gap-2 rounded-lg border border-transparent text-white transition-colors duration-300 shadow-md"
                            style={{ background: inCart ? '#161114' : MAGENTA }}
                          >
                            {cartLoadings[product.id] ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <ShoppingBag size={12} />
                            )}
                            {inCart ? 'Added to Bag' : 'Add to Bag'}
                          </button>
                        </div>
                      )}

                      {stock <= 0 && (
                        <div className="absolute top-4 left-4 z-10">
                          <span className="text-white text-[8px] tracking-[0.25em] font-bold uppercase px-3 py-1.5 rounded-full" style={{ background: 'rgba(26,16,64,0.85)' }}>
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Metadata & Specifications */}
                    <div className="px-1 text-center space-y-1">
                      <p className="text-[9px] tracking-[0.25em] font-bold uppercase" style={{ color: '#3D3460', fontFamily: SANS }}>
                        {product.brand || "Tuka"}
                      </p>
                      
                      <h3 
                        className="text-lg lg:text-xl font-light transition-colors duration-300"
                        style={{ color: DARK, fontFamily: SERIF }}
                      >
                        {product.name}
                      </h3>

                      <div className="flex items-center justify-center gap-3 pt-0.5">
                        <span className="text-base font-semibold" style={{ color: MAGENTA }}>
                          ₹{Number(price).toLocaleString()}
                        </span>
                        {original_price > price && (
                          <span className="text-xs line-through" style={{ color: '#3D3460', opacity: 0.45 }}>
                            ₹{Number(original_price).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default BestSellers;