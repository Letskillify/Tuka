import React, { useEffect, useState } from "react";
import { db } from "../components/Firebase";
import { doc, getDoc } from "firebase/firestore";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingBag, Trash2, ArrowLeft, ShieldCheck, Truck, Minus, Plus, CheckCircle2, AlertCircle, Tag, ChevronRight, Gift, Sparkles } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { useStore } from "../hooks/useStore";
import { motion, AnimatePresence } from "framer-motion";

const Cart = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartItems, updateCartQuantity, removeFromCart, liveProductsMap } = useStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveStocks, setLiveStocks] = useState({});
  
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);

  // Check URL query param for coupons
  useEffect(() => {
    const promo = searchParams.get('promo') || searchParams.get('coupon') || searchParams.get('code');
    if (promo) {
      setCouponCode(promo);
      setShowCoupon(true);
    }
  }, [searchParams]);

  // Real-time live stock synchronization
  useEffect(() => {
    setItems(cartItems);

    if (cartItems.length === 0) {
      setLoading(false);
      return;
    }

    const newLiveStocks = {};
    cartItems.forEach((item) => {
      if (!item.id) return;
      const [baseId, size] = item.id.split('_');
      const liveProduct = liveProductsMap[baseId];

      let actualStock = Number(item.stock || 0);
      if (liveProduct) {
        if (size && liveProduct.sizeVariants && liveProduct.sizeVariants.length > 0) {
          const variant = liveProduct.sizeVariants.find((v) => v.size === size);
          actualStock = variant ? Number(variant.stock || 0) : 0;
        } else {
          actualStock = Number(liveProduct.stock || 0);
        }
      }
      newLiveStocks[item.id] = actualStock;

      if (actualStock <= 0) {
        removeFromCart(item.id);
      } else if (item.quantity > actualStock) {
        updateCartQuantity(item.id, actualStock);
      }
    });

    setLiveStocks(newLiveStocks);
    setLoading(false);
  }, [cartItems, liveProductsMap, updateCartQuantity, removeFromCart]);

  const removeItem = async (id) => {
    await removeFromCart(id);
  };

  const subtotal = items.reduce((sum, i) => sum + (Number(i.price) * (i.quantity || 1)), 0);
  const originalTotal = items.reduce((sum, i) => sum + (Number(i.original_price || i.price) * (i.quantity || 1)), 0);
  const productSavings = originalTotal - subtotal;

  const handleApplyCoupon = () => {
    setCouponError("");
    const code = couponCode.toUpperCase().trim();
    
    if (code === "TUKA10") {
      setDiscount(subtotal * 0.1);
      setAppliedCoupon(code);
    } else if (code === "WELCOME20") {
      setDiscount(subtotal * 0.2);
      setAppliedCoupon(code);
    } else if (code === "GIFT500") {
      setDiscount(Math.min(500, subtotal));
      setAppliedCoupon(code);
    } else {
      setCouponError("Invalid coupon code");
      setDiscount(0);
      setAppliedCoupon("");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon("");
    setDiscount(0);
    setCouponCode("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFAF5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-[1.5px] border-[#b13896]"></div>
      </div>
    );
  }

  const total = Math.max(0, subtotal - discount);

  return (
    <div className="min-h-screen bg-[#FDFAF5] font-sans text-[#161114]">
      
      {/* Hero Breadcrumb */}
      <Breadcrumb 
        title="Shopping Cart"
        subtitle={`${items.length} ${items.length === 1 ? 'item' : 'items'} in your collection`}
        bgImage="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1600"
        links={[
          { name: 'Home', href: '/?ref=cart#hero' },
          { name: 'Shop', href: '/shop?cat=all#products' },
          { name: 'Cart', href: '/cart?step=view#cart-summary', active: true }
        ]}
      />

      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-8 pb-20">
        
        {/* Continue Shopping Link */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-[13px] text-[#4a3f44]">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
          <Link 
            to="/shop?cat=all#products" 
            className="inline-flex items-center gap-2 text-[12px] font-bold text-[#b13896] hover:text-[#161114] transition-colors"
          >
            <ArrowLeft size={14} />
            Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          /* Empty Cart */
          <div className="py-24 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#f7ebf2] flex items-center justify-center mb-6">
              <ShoppingBag size={32} strokeWidth={1} className="text-[#b13896]/40" />
            </div>
            <h2 className="font-serif text-2xl text-[#161114] mb-2">Your cart is empty</h2>
            <p className="text-[14px] text-[#4a3f44] mb-8 max-w-sm">Looks like you haven't added any pieces to your collection yet.</p>
            <Link 
              to="/shop?cat=all#products" 
              className="bg-[#161114] text-white px-8 py-3.5 rounded-xl text-[14px] font-bold uppercase tracking-[0.2em] hover:bg-[#b13896] transition-all duration-500"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            
            {/* Cart Items */}
            <div className="flex-1 min-w-0">
              {/* Table Header - Desktop */}
              <div className="hidden sm:grid grid-cols-[1fr_120px_120px_40px] gap-6 pb-4 border-b border-[#e5d5df]/40 mb-0">
                <span className="text-[14px] font-bold uppercase tracking-[0.2em] text-[#4a3f44]">Product</span>
                <span className="text-[14px] font-bold uppercase tracking-[0.2em] text-[#4a3f44] text-center">Quantity</span>
                <span className="text-[14px] font-bold uppercase tracking-[0.2em] text-[#4a3f44] text-right">Total</span>
                <span></span>
              </div>

              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    key={item.id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_40px] gap-4 sm:gap-6 items-center py-6 border-b border-[#e5d5df]/20"
                  >
                    {/* Product Info */}
                    <div className="flex items-center gap-4">
                      <Link 
                        to={`/product/${item.id.split('_')[0]}?ref=cart#product-details`}
                        className="w-20 h-24 sm:w-[72px] sm:h-[90px] rounded-lg overflow-hidden bg-[#f7ebf2] flex-shrink-0 border border-[#e5d5df]/30 hover:border-[#b13896]/30 transition-colors"
                      >
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </Link>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-[#b13896] uppercase tracking-[0.3em] mb-1">Tuka</p>
                        <Link to={`/product/${item.id.split('_')[0]}?ref=cart#product-details`} className="text-[15px] font-serif text-[#161114] hover:text-[#b13896] transition-colors line-clamp-2 leading-snug block">
                          {item.name}
                        </Link>
                        <div className="flex items-baseline gap-2 mt-1.5">
                          <span className="text-[14px] font-medium text-[#161114]">₹{Number(item.price).toLocaleString()}</span>
                          {Number(item.original_price) > Number(item.price) && (
                            <span className="text-[12px] text-[#4a3f44]/50 line-through">₹{Number(item.original_price).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center justify-center">
                      <div className="flex items-center border border-[#e5d5df] rounded-lg overflow-hidden bg-white">
                        <button
                          onClick={() => updateCartQuantity(item.id, (item.quantity || 1) - 1)}
                          className="w-9 h-9 flex items-center justify-center text-[#161114] hover:bg-[#f7ebf2] transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-9 text-center font-bold text-[#161114] text-[13px]">
                          {item.quantity || 1}
                        </span>
                        <button 
                          onClick={() => updateCartQuantity(item.id, (item.quantity || 1) + 1)}
                          disabled={(item.quantity || 1) >= Math.min(10, liveStocks[item.id] ?? item.stock ?? 1)}
                          className="w-9 h-9 flex items-center justify-center text-[#161114] hover:bg-[#f7ebf2] transition-colors disabled:opacity-20"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="text-right">
                      <p className="text-[15px] font-medium text-[#161114]">
                        ₹{(Number(item.price) * (item.quantity || 1)).toLocaleString()}
                      </p>
                    </div>

                    {/* Remove */}
                    <div className="flex justify-end">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-[#4a3f44]/40 hover:text-[#b13896] transition-colors"
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary Sidebar */}
            <aside className="w-full lg:w-[380px] flex-shrink-0">
              <div className="lg:sticky lg:top-24 bg-white rounded-2xl border border-[#e5d5df]/30 overflow-hidden shadow-sm">
                
                {/* Summary Header */}
                <div className="px-6 py-5 border-b border-[#e5d5df]/20">
                  <h2 className="text-[15px] font-bold text-[#161114] uppercase tracking-wider">Order Summary</h2>
                </div>

                <div className="px-6 py-5 space-y-4">
                  {/* Subtotal */}
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#4a3f44]">Subtotal ({items.length} items)</span>
                    <span className="font-medium text-[#161114]">₹{subtotal.toLocaleString()}</span>
                  </div>

                  {/* Savings */}
                  {productSavings > 0 && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-emerald-600">Product Discount</span>
                      <span className="font-medium text-emerald-600">−₹{productSavings.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Shipping */}
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#4a3f44]">Delivery</span>
                    <span className="font-medium text-emerald-600">Free</span>
                  </div>

                  {/* Coupon Discount */}
                  {discount > 0 && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-emerald-600">Coupon ({appliedCoupon})</span>
                      <span className="font-medium text-emerald-600">−₹{discount.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Coupon Input */}
                  <div className="pt-1">
                    {!showCoupon && !appliedCoupon ? (
                      <button 
                        onClick={() => setShowCoupon(true)}
                        className="flex items-center gap-2 text-[12px] font-bold text-[#b13896] hover:text-[#161114] transition-colors"
                      >
                        <Tag size={14} />
                        Apply Coupon Code
                      </button>
                    ) : !appliedCoupon ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Enter code" 
                            className="flex-1 border border-[#e5d5df] rounded-lg px-4 py-2.5 text-[12px] font-bold tracking-wider text-[#161114] outline-none focus:border-[#b13896] transition-all uppercase placeholder:text-[#4a3f44]/30 placeholder:normal-case bg-[#FDFAF5]"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          />
                          <button 
                            onClick={handleApplyCoupon}
                            className="bg-[#161114] text-white px-5 py-2.5 rounded-lg text-[14px] font-bold uppercase tracking-wider hover:bg-[#b13896] transition-all"
                          >
                            Apply
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-[14px] text-red-500 flex items-center gap-1.5">
                            <AlertCircle size={12} /> {couponError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span className="text-[14px] font-bold text-emerald-700 uppercase tracking-wider">{appliedCoupon}</span>
                        </div>
                        <button onClick={removeCoupon} className="text-[14px] font-bold text-red-500 hover:text-red-700 transition-colors">
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="pt-4 border-t border-[#e5d5df]/30 flex justify-between items-baseline">
                    <span className="text-[14px] font-bold text-[#161114]">Total</span>
                    <span className="text-2xl font-serif text-[#161114]">₹{total.toLocaleString()}</span>
                  </div>

                  {/* Checkout Button */}
                  <button 
                    onClick={() => navigate("/checkout")}
                    disabled={items.length === 0}
                    className="w-full bg-[#161114] text-white py-4 rounded-xl text-[14px] font-bold uppercase tracking-[0.25em] hover:bg-[#b13896] transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                  >
                    Proceed to Checkout
                  </button>

                  {/* Trust */}
                  <div className="flex items-center justify-center gap-6 pt-3">
                    <div className="flex items-center gap-1.5 text-[#4a3f44]">
                      <ShieldCheck size={14} strokeWidth={1.5} />
                      <span className="text-[14px] font-medium">Secure</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#4a3f44]">
                      <Truck size={14} strokeWidth={1.5} />
                      <span className="text-[14px] font-medium">Free Shipping</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#4a3f44]">
                      <Gift size={14} strokeWidth={1.5} />
                      <span className="text-[14px] font-medium">Gift Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
