import React, { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { db } from "./Firebase";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Trash2, ShoppingCart, ArrowLeft, Star, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../hooks/useStore";
import Breadcrumb from "./Breadcrumb";

const Wishlist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart, liveProductsMap } = useStore();
  const [wishlistRaw, setWishlistRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingItems, setMovingItems] = useState({});

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const wishRef = collection(db, "users", user.uid, "wishlist");
    const unsubscribe = onSnapshot(
      wishRef,
      (snap) => {
        const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setWishlistRaw(records);
        setLoading(false);
      },
      (error) => {
        console.error("Wishlist snapshot error:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Combine wishlist records with live real-time product stock & details
  const items = wishlistRaw.map((record) => {
    const liveProduct = liveProductsMap[record.id];
    if (liveProduct) {
      return { ...record, ...liveProduct, id: record.id };
    }
    return record;
  });

  const removeItem = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "wishlist", id));
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const moveToCart = async (item) => {
    if (!user) return;

    // Choose default variant if size variants exist
    const defaultVariant = item.sizeVariants && item.sizeVariants.length > 0
      ? (item.sizeVariants.find(v => Number(v.stock || 0) > 0) || item.sizeVariants[0])
      : null;

    const stock = defaultVariant ? Number(defaultVariant.stock || 0) : Number(item.stock || 0);

    if (stock <= 0) {
      alert("This item is currently out of stock.");
      return;
    }

    setMovingItems(prev => ({ ...prev, [item.id]: true }));
    try {
      const productToCart = {
        ...item,
        id: defaultVariant ? `${item.id}_${defaultVariant.size}` : item.id,
        name: defaultVariant ? `${item.name} (${defaultVariant.size})` : item.name,
        price: defaultVariant ? Number(defaultVariant.price) : Number(item.price),
        original_price: defaultVariant ? Number(defaultVariant.original_price) : Number(item.original_price),
        stock: stock,
        selectedSize: defaultVariant ? defaultVariant.size : null
      };

      const success = await addToCart(productToCart);
      if (success) {
        await removeItem(item.id);
        alert("Moved to your collection!");
      }
    } catch (error) {
      console.error("Error moving to cart:", error);
    } finally {
      setMovingItems(prev => ({ ...prev, [item.id]: false }));
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F4EF] flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#b13896]"></div>
          <Heart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#b13896]/50 animate-pulse" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4EF] font-sans text-[#161114]">
      {/* Hero Breadcrumb */}
      <Breadcrumb
        title="The Wishlist"
        subtitle="A curated selection of exquisite handloom sarees and designer blouses, awaiting your next celebration."
        bgImage="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=1600"
        links={[
          { name: 'Home', href: '/' },
          { name: 'Shop', href: '/shop' },
          { name: 'Wishlist', href: '/wishlist', active: true }
        ]}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 pb-20">

        {/* Grid */}
        <AnimatePresence mode="popLayout">
          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
              {items.map((item, idx) => {
                const defaultVariant = item.sizeVariants && item.sizeVariants.length > 0
                  ? (item.sizeVariants.find(v => Number(v.stock || 0) > 0) || item.sizeVariants[0])
                  : null;

                const price = defaultVariant ? Number(defaultVariant.price) : Number(item.price || 0);
                const original_price = defaultVariant ? Number(defaultVariant.original_price) : Number(item.original_price || 0);
                const stock = defaultVariant ? Number(defaultVariant.stock || 0) : Number(item.stock || 0);
                const isOutOfStock = stock <= 0;

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                    key={item.id}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/product/${item.id}`)}
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden bg-[#f7ebf2] mb-8 border border-[#e5d5df]/30 transition-all duration-700 ease-out group-hover:shadow-[0_30px_60px_rgba(122,14,46,0.1)]">
                      <img
                        src={item.image || item.images?.[0]}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110 opacity-95 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-[#161114]/0 group-hover:bg-[#161114]/5 transition-colors duration-500" />

                      {/* Quick Actions */}
                      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 z-20">
                        <button
                          onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                          className="w-12 h-12 bg-white/90 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-[#4a3f44]/30 hover:text-red-600 transition-all shadow-lg"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      {/* Add to Cart Overlay */}
                      <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-20">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveToCart(item); }}
                          disabled={isOutOfStock || movingItems[item.id]}
                          className={`w-full py-4 text-[14px] tracking-[0.2em] font-bold uppercase flex items-center justify-center gap-3 transition-all rounded-xl shadow-xl ${isOutOfStock
                              ? 'bg-red-50 text-red-400 cursor-not-allowed border border-red-100'
                              : 'bg-[#161114] text-white hover:bg-[#b13896]'
                            }`}
                        >
                          {movingItems[item.id] ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <ShoppingCart size={16} />
                          )}
                          {isOutOfStock ? 'Out of Stock' : 'Move to Collection'}
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4 px-2 text-center">
                      <div className="space-y-1">
                        <p className="text-[14px] tracking-[0.3em] font-bold uppercase text-[#4a3f44] mb-2">{item.brand || "Tuka "}</p>
                        <h3 className="text-xl font-serif text-[#161114] group-hover:text-[#b13896] transition-colors duration-300">
                          {item.name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-center gap-4 pt-2">
                        <p className="text-lg font-medium text-[#b13896]">
                          ₹{Number(price || 0).toLocaleString()}
                        </p>
                        {original_price > price && (
                          <p className="text-sm text-[#4a3f44]/40 line-through">
                            ₹{Number(original_price).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-40 text-center bg-[#f7ebf2]/30 rounded-[64px] border border-[#e5d5df]/20"
            >
              <div className="w-32 h-32 bg-[#b13896]/5 rounded-[40px] flex items-center justify-center mx-auto mb-10 text-[#b13896]/20">
                <Heart size={64} />
              </div>
              <h3 className="text-4xl font-serif text-[#161114] mb-6 italic font-bold">Your collection is empty</h3>
              <p className="text-[#4a3f44] font-serif text-lg italic mb-12">
                Explore our boutique and save your favorites here for later.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-4 bg-[#b13896] text-white px-16 py-6 rounded-2xl font-bold uppercase tracking-[0.4em] text-[14px] hover:bg-[#161114] transition-all shadow-xl shadow-[#b13896]/20"
              >
                Start Exploring
                <ArrowLeft size={20} strokeWidth={2} className="rotate-180" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};


export default Wishlist;
