import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { db } from "../components/Firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../components/useAuth";
import { useStore } from '../hooks/useStore';
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Shield, Truck, RotateCcw, Heart, ShoppingBag,
  ArrowLeft, Share2, Gem, Sparkles, ArrowRight, Loader2, ChevronLeft, ChevronRight, Package, Clock, ZoomIn, X, MapPin, CheckCircle2
} from 'lucide-react';
import ProductDetailHero from '../components/ProductDetailHero';
import AttributeBadges from '../components/AttributeBadges';
import ProductReviews from '../components/ProductReviews';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [quantity, setQuantity] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);

  // Lightbox Zoom Modal State
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Delivery Pincode Estimator State
  const [pincode, setPincode] = useState('');
  const [deliveryMsg, setDeliveryMsg] = useState(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  const handlePincodeCheck = (e) => {
    e.preventDefault();
    if (!pincode || pincode.length < 6) return;
    setCheckingPincode(true);
    setTimeout(() => {
      const days = Math.floor(Math.random() * 2) + 3;
      const delDate = new Date();
      delDate.setDate(delDate.getDate() + days);
      const formattedDate = delDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
      setDeliveryMsg(`Free Delivery by ${formattedDate}`);
      setCheckingPincode(false);
    }, 600);
  };

  const handleSizeSelect = (v) => {
    setSelectedSize(v);
    const params = new URLSearchParams(searchParams);
    if (v && v.size) {
      params.set('size', v.size);
    } else {
      params.delete('size');
      params.delete('variant');
    }
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    setLoading(true);
    setSelectedImageIndex(0);
    const urlSize = searchParams.get('size') || searchParams.get('variant');

    const ref = doc(db, "products", id);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setProduct(data);
          if (data.sizeVariants && data.sizeVariants.length > 0) {
            setSelectedSize((prevSelected) => {
              if (prevSelected) {
                const updatedMatch = data.sizeVariants.find(v => v.size === prevSelected.size);
                if (updatedMatch) return updatedMatch;
              }
              const match = urlSize ? data.sizeVariants.find(v => v.size.toLowerCase() === urlSize.toLowerCase()) : null;
              const inStockVariant = data.sizeVariants.find(v => Number(v.stock || 0) > 0);
              return match || inStockVariant || data.sizeVariants[0];
            });
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firebase product detail snapshot error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id, searchParams]);

  const { addToCart, addToWishlist, isInCart, isInWishlist } = useStore();

  const activePrice = selectedSize ? Number(selectedSize.price) : Number(product?.price || 0);
  const activeOriginalPrice = selectedSize ? Number(selectedSize.original_price) : Number(product?.original_price || 0);
  const activeStock = selectedSize ? Number(selectedSize.stock || 0) : Number(product?.stock || 0);

  const handleAddToCart = async () => {
    if (!product) return;
    setCartLoading(true);
    try {
      const productToCart = {
        ...product,
        id: selectedSize ? `${product.id}_${selectedSize.size}` : product.id,
        name: selectedSize ? `${product.name} (${selectedSize.size})` : product.name,
        price: activePrice,
        original_price: activeOriginalPrice,
        stock: activeStock,
        selectedSize: selectedSize ? selectedSize.size : null
      };
      await addToCart(productToCart, quantity);
    } finally {
      setCartLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    const buyNowItem = {
      ...product,
      id: selectedSize ? `${product.id}_${selectedSize.size}` : product.id,
      name: selectedSize ? `${product.name} (${selectedSize.size})` : product.name,
      price: activePrice,
      original_price: activeOriginalPrice,
      stock: activeStock,
      selectedSize: selectedSize ? selectedSize.size : null,
      quantity: quantity,
      image: product.image || product.images?.[0] || ""
    };
    navigate("/checkout", { state: { buyNowItem } });
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    setWishlistLoading(true);
    try {
      await addToWishlist(product);
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#161114] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-[#b13896] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(177,56,150,0.5)]" />
        <p className="text-[12px] uppercase tracking-[0.4em] text-[#f4cfeb] font-bold font-sans">Unveiling Masterpiece...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex flex-col items-center justify-center gap-6 text-center p-6">
        <h2 className="font-serif text-3xl text-[#161114]">Item not found.</h2>
        <button onClick={() => navigate('/shop')} className="text-xs font-bold uppercase tracking-[0.25em] text-[#b13896] border-b border-[#b13896] pb-1 hover:text-[#161114] transition-all cursor-pointer font-sans">Return to Shop</button>
      </div>
    );
  }

  const discountPercent = activeOriginalPrice > activePrice
    ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100)
    : 0;

  const currentCartItemId = selectedSize ? `${product.id}_${selectedSize.size}` : product.id;
  const itemInCart = isInCart(currentCartItemId);

  const imagesList = (product.images && product.images.length > 0) ? product.images : [product.image || 'https://images.unsplash.com/photo-1610030470298-40e1eaccf77d?auto=format&fit=crop&q=80&w=800'];
  const currentImage = imagesList[selectedImageIndex] || imagesList[0];

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans text-[#161114] relative pb-28">

      {/* Customized Dedicated Product Detail Hero Section */}
      <ProductDetailHero
        product={product}
        activePrice={activePrice}
        activeOriginalPrice={activeOriginalPrice}
        discountPercent={discountPercent}
        isWishlisted={isInWishlist(product.id)}
        onWishlistClick={handleAddToWishlist}
        wishlistLoading={wishlistLoading}
      />

      {/* Main Product Section */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">

          {/* Left Column: STICKY Image Gallery */}
          <div className="w-full lg:w-[54%] lg:sticky lg:top-28 self-start">
            <div className="flex flex-col-reverse sm:flex-row gap-4">

              {/* Thumbnail Strip */}
              {imagesList.length > 1 && (
                <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:max-h-[600px] no-scrollbar py-1 sm:py-0 shrink-0">
                  {imagesList.map((imgUrl, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImageIndex(i)}
                      className={`flex-shrink-0 w-16 h-20 sm:w-[72px] sm:h-[94px] rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${selectedImageIndex === i
                          ? 'border-[#b13896] shadow-md scale-105 opacity-100'
                          : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                    >
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image Container */}
              <motion.div
                className="flex-1 aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-100 relative group cursor-zoom-in border border-slate-200/70 shadow-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                onClick={() => setIsZoomOpen(true)}
              >
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                />

                {/* Overlay Prev / Next Buttons if multiple images */}
                {imagesList.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : imagesList.length - 1));
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-slate-900 flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md z-20"
                      title="Previous Image"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) => (prev < imagesList.length - 1 ? prev + 1 : 0));
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-slate-900 flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md z-20"
                      title="Next Image"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                {/* Hover Zoom Hint */}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-slate-900 shadow-md flex items-center gap-1.5 font-sans">
                    <ZoomIn size={14} className="text-[#b13896]" /> Tap to Zoom
                  </span>
                </div>

                {/* Badges on Image */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-10">
                  {discountPercent > 0 && (
                    <span className="bg-[#b13896] text-white px-3 py-1.5 rounded-full text-xs font-bold tracking-normal font-sans shadow-md">
                      -{discountPercent}% OFF
                    </span>
                  )}
                  {activeStock <= 5 && activeStock > 0 && (
                    <span className="bg-[#161114] text-amber-300 px-3 py-1.5 rounded-full text-xs font-bold tracking-normal font-sans shadow-md">
                      Only {activeStock} Left
                    </span>
                  )}
                </div>

                {/* Wishlist Button on Image */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleAddToWishlist(); }}
                  disabled={wishlistLoading}
                  className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer shadow-md z-20 ${isInWishlist(product.id)
                      ? 'bg-[#b13896] text-white'
                      : 'bg-white/85 text-[#161114] hover:bg-[#b13896] hover:text-white'
                    }`}
                >
                  {wishlistLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Heart size={16} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                  )}
                </button>
              </motion.div>
            </div>
          </div>

          {/* Right Column: Detailed Product Info & Purchase Options */}
          <div className="w-full lg:w-[46%] py-1 space-y-6">

            {/* Category, Title & Rating */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AttributeBadges attributes={product.attributes} />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#b13896] font-sans">
                  {product.category || 'Tuka Heritage'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-[#161114] leading-tight font-serif">
                {product.name}
              </h2>

              {/* Rating & Reviews - Standard Normal Font */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="#D4A853" stroke="#D4A853" className={i >= 4 ? 'opacity-30' : ''} />
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-700 font-sans tracking-normal">
                  4.9 <span className="text-slate-400 font-normal">(42 Reviews)</span>
                </span>
              </div>
            </div>

            {/* Price Block - Standard Normal Sans-Serif Font */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans tracking-normal">
                  ₹{Number(activePrice).toLocaleString()}
                </span>
                {activeOriginalPrice > activePrice && (
                  <>
                    <span className="text-base text-slate-400 line-through font-sans tracking-normal">
                      ₹{Number(activeOriginalPrice).toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-[#b13896] bg-[#b13896]/10 px-2.5 py-1 rounded-full font-sans tracking-normal">
                      Save {discountPercent}%
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 font-normal font-sans">
                Inclusive of all taxes. Free shipping across India.
              </p>
            </div>

            {/* Product Description */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light font-sans">
              {product.description || "An exceptional masterwork of pure Bengal loom design, meticulously hand-woven by hereditary weavers to represent authentic heritage and modern luxury."}
            </p>

            {/* Size Variants Grid */}
            {product.sizeVariants && product.sizeVariants.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs font-sans">
                  <span className="font-bold uppercase tracking-wider text-slate-900">Select Size / Fit</span>
                  <span className="text-slate-500 underline cursor-pointer">Size Guide</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.sizeVariants.map((v) => {
                    const isSelected = selectedSize?.size === v.size;
                    const isOutOfStock = Number(v.stock || 0) <= 0;
                    return (
                      <button
                        key={v.size}
                        onClick={() => !isOutOfStock && handleSizeSelect(v)}
                        disabled={isOutOfStock}
                        className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all tracking-normal font-sans border relative cursor-pointer ${isSelected
                            ? 'bg-[#b13896] text-white border-[#b13896] shadow-sm font-bold'
                            : isOutOfStock
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                              : 'bg-white text-slate-900 border-slate-200 hover:border-[#b13896] hover:text-[#b13896]'
                          }`}
                      >
                        {v.size}
                        {v.price && (
                          <span className="ml-1 opacity-80 text-[11px] font-normal font-sans tracking-normal">
                            ₹{Number(v.price).toLocaleString()}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 font-sans">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Quantity</span>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm font-sans">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 flex items-center justify-center text-slate-900 hover:bg-slate-100 transition-colors text-base font-medium border-r border-slate-200 cursor-pointer font-sans"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-bold text-slate-900 text-xs font-sans tracking-normal">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(Math.min(10, activeStock), quantity + 1))}
                    disabled={quantity >= Math.min(10, activeStock)}
                    className="w-9 h-9 flex items-center justify-center text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-30 text-base font-medium border-l border-slate-200 cursor-pointer font-sans"
                  >
                    +
                  </button>
                </div>
                {activeStock <= 5 && activeStock > 0 && (
                  <span className="text-xs font-bold text-amber-600 font-sans tracking-normal">
                    Only {activeStock} left in stock
                  </span>
                )}
              </div>

              {/* Add to Cart & Buy Now Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={activeStock <= 0 || cartLoading}
                  className={`h-12 rounded-xl text-xs uppercase tracking-widest font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md font-sans ${activeStock <= 0
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : itemInCart
                        ? 'bg-[#b13896] text-white shadow-[#b13896]/20'
                        : 'bg-[#161114] text-white hover:bg-[#b13896]'
                    }`}
                >
                  {cartLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ShoppingBag size={16} />
                  )}
                  {activeStock <= 0 ? 'Out of Stock' : itemInCart ? 'In Your Cart' : 'Add to Cart'}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={activeStock <= 0}
                  className="h-12 rounded-xl text-xs uppercase tracking-widest font-bold border-2 border-[#161114] text-[#161114] hover:bg-[#161114] hover:text-white transition-all duration-300 disabled:opacity-30 cursor-pointer font-sans"
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Pincode Delivery Estimator */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2 font-sans">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <MapPin size={15} className="text-[#b13896]" />
                <span>Estimate Delivery Date</span>
              </div>
              <form onSubmit={handlePincodeCheck} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-[#b13896] font-sans tracking-normal"
                />
                <button
                  type="submit"
                  disabled={checkingPincode || pincode.length < 6}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#b13896] text-white text-xs font-bold uppercase transition-all disabled:opacity-40 cursor-pointer font-sans"
                >
                  {checkingPincode ? 'Checking...' : 'Check'}
                </button>
              </form>
              {deliveryMsg && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold font-sans tracking-normal pt-1">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>{deliveryMsg}</span>
                </div>
              )}
            </div>

            {/* Trust Signals Grid */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 font-sans">
              {[
                { icon: Shield, label: "Secure Checkout" },
                { icon: Truck, label: "Free Shipping" },
                { icon: RotateCcw, label: "Easy Returns" },
                { icon: Gem, label: "100% Authentic" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 text-center p-2 rounded-xl bg-white border border-slate-100">
                  <item.icon size={16} className="text-[#b13896]" strokeWidth={1.5} />
                  <span className="text-[10px] font-semibold text-slate-700 leading-tight font-sans">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Accordion Specification Tabs */}
            <div className="space-y-0 pt-2 border-t border-slate-200/60 font-sans">
              {[
                {
                  id: 'details',
                  label: 'Product Details & Specs',
                  content: (
                    <div className="grid grid-cols-2 gap-3 py-2 text-xs">
                      {[
                        { label: 'Reference Code', value: product.id.slice(0, 10).toUpperCase() },
                        { label: 'Fabric / Material', value: product.material || 'Authentic Bengal Cotton / Silk' },
                        { label: 'Selected Size', value: selectedSize ? selectedSize.size : 'Standard / Free Size' },
                        { label: 'Sub-Category', value: product.subCategory || 'Handloom' },
                        { label: 'Origin', value: 'West Bengal, India' },
                      ].map((d, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-sans">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{d.label}</p>
                          <p className="font-semibold text-slate-900 font-sans tracking-normal">{d.value}</p>
                        </div>
                      ))}
                    </div>
                  )
                },
                {
                  id: 'craft',
                  label: 'Heritage & Weaving Craftsmanship',
                  content: (
                    <div className="space-y-2 py-2 text-xs text-slate-600 leading-relaxed font-sans">
                      <p>
                        This item is handwoven using traditional wooden pit looms in Bengal. Motif patterns are wrought using authentic handloom shuttle techniques passed down across generations.
                      </p>
                    </div>
                  )
                },
                {
                  id: 'care',
                  label: 'Care Instructions',
                  content: (
                    <ul className="space-y-2 py-2 text-xs text-slate-600 font-sans">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#b13896]" />
                        <span>Dry clean recommended for silk and tissue weaves</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#b13896]" />
                        <span>Handwash separately in cold water with mild detergent for cottons</span>
                      </li>
                    </ul>
                  )
                },
              ].map((tab) => (
                <div key={tab.id} className="border-b border-slate-200/60">
                  <button
                    onClick={() => setActiveTab(activeTab === tab.id ? '' : tab.id)}
                    className="w-full flex items-center justify-between py-3.5 text-left group cursor-pointer font-sans"
                  >
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans">{tab.label}</span>
                    <ChevronRight
                      size={15}
                      className={`text-slate-400 transition-transform duration-300 ${activeTab === tab.id ? 'rotate-90 text-[#b13896]' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {activeTab === tab.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden font-sans"
                      >
                        {tab.content}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Product Reviews Section */}
            <ProductReviews productId={product.id} />

          </div>
        </div>
      </div>

      {/* ── Lightbox Zoom Modal ── */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setIsZoomOpen(false)}
          >
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer z-10"
            >
              <X size={22} />
            </button>
            <img
              src={currentImage}
              alt={product.name}
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOATING BOTTOM ACTION BAR (Sticky at Bottom Viewport) ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] py-3 px-4 sm:px-6 pr-20 sm:pr-24 lg:pr-28 flex items-center justify-between gap-3 font-sans"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {/* Left: Product Preview info */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={currentImage}
            alt=""
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate font-sans">
              {product.name}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 font-sans tracking-normal">
                ₹{Number(activePrice).toLocaleString()}
              </span>
              {selectedSize && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-sans tracking-normal">
                  {selectedSize.size}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quantity Selector on Desktop */}
          <div className="hidden md:flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 text-xs font-sans">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 flex items-center justify-center text-slate-900 hover:bg-slate-200 transition-colors font-sans"
            >
              −
            </button>
            <span className="w-8 text-center font-bold text-slate-900 font-sans tracking-normal">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(Math.min(10, activeStock), quantity + 1))}
              disabled={quantity >= Math.min(10, activeStock)}
              className="w-8 h-8 flex items-center justify-center text-slate-900 hover:bg-slate-200 transition-colors disabled:opacity-30 font-sans"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={activeStock <= 0 || cartLoading}
            className={`px-4 sm:px-6 h-11 rounded-xl text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md font-sans ${activeStock <= 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : itemInCart
                  ? 'bg-[#b13896] text-white'
                  : 'bg-[#161114] text-white hover:bg-[#b13896]'
              }`}
          >
            {cartLoading ? <Loader2 size={15} className="animate-spin" /> : <ShoppingBag size={15} />}
            <span className="hidden sm:inline font-sans">{activeStock <= 0 ? 'Out of Stock' : itemInCart ? 'In Your Cart' : 'Add to Cart'}</span>
            <span className="sm:hidden font-sans">{itemInCart ? 'In Cart' : 'Add'}</span>
          </button>

          <button
            onClick={handleBuyNow}
            disabled={activeStock <= 0}
            className="px-4 sm:px-6 h-11 rounded-xl text-xs uppercase tracking-wider font-bold bg-[#b13896] hover:bg-[#962e7f] text-white transition-all shadow-md cursor-pointer flex items-center gap-1.5 font-sans"
          >
            <span className="font-sans">Buy Now</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProductDetail;