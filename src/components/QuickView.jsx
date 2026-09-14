import React, { useState } from "react";
import { X, ShoppingBag, Heart, Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';

const QuickView = ({ product, onClose }) => {
  const { addToCart, addToWishlist, isInCart, isInWishlist } = useStore();
  const [isOpen, setIsOpen] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddToCart = async () => {
    setCartLoading(true);
    try {
      await addToCart(product, quantity);
    } finally {
      setCartLoading(false);
    }
  };

  const handleAddToWishlist = async () => {
    setWishlistLoading(true);
    try {
      await addToWishlist(product);
    } finally {
      setWishlistLoading(false);
    }
  };

  if (!isOpen || !product) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[999] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none mt-10`}>
        <div
          className={`bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden pointer-events-auto transform transition-all duration-300 ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-8 py-6 border-b border-[#E6CCB2]/50 bg-gradient-to-r from-[#C6A664]/5 to-[#4A4A4A]/5">
            <h2 className="text-lg font-black text-[#4A4A4A] uppercase tracking-tight">
              Quick View
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setTimeout(() => onClose?.(), 300);
              }}
              className="p-2 rounded-full hover:bg-[#FDFBF7] transition-colors text-[#4A4A4A]"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Image Section */}
            <div className="flex items-center justify-center">
              <div className="bg-gradient-to-br from-[#FDFBF7] to-[#E6CCB2]/20 rounded-3xl flex items-center justify-center w-full aspect-square relative overflow-hidden group">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-8 group-hover:scale-110 transition-transform duration-300"
                />
                {product.original_price && product.original_price > product.price && (
                  <div className="absolute top-4 right-4 bg-[#C6A664] text-white px-4 py-2 rounded-full text-xs font-black">
                    SALE
                  </div>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Title */}
                <h3 className="text-3xl font-black text-[#4A4A4A] leading-tight">
                  {product.name}
                </h3>

                {/* Rating & Price */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="text-[#C6A664] text-lg">★</div>
                      ))}
                    </div>
                    <span className="text-sm text-[#4A4A4A]/50 font-medium">(128 reviews)</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black text-[#C6A664]">
                      ₹{Number(product.price).toLocaleString()}
                    </span>
                    {product.original_price > product.price && (
                      <span className="text-lg font-bold text-[#4A4A4A]/30 line-through">
                        ₹{Number(product.original_price).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-sm text-[#4A4A4A]/70 leading-relaxed">
                    {product.description}
                  </p>
                )}

                {/* Suitable For */}
                {product.suitable_for && (
                  <div className="bg-[#FDFBF7] rounded-xl p-4 border border-[#E6CCB2]/30">
                    <p className="text-xs font-black text-[#4A4A4A]/40 uppercase tracking-wider mb-1">
                      Suitable for
                    </p>
                    <p className="text-sm font-semibold text-[#4A4A4A]">
                      {product.suitable_for}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-4">
                {/* Quantity Selector */}
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-[#4A4A4A]/60 uppercase tracking-wider">Quantity</span>
                  <div className="flex items-center border border-[#E6CCB2] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 text-[#4A4A4A] hover:bg-[#FDFBF7] transition-colors font-black"
                    >
                      −
                    </button>
                    <span className="px-6 py-2 font-black text-[#4A4A4A] border-l border-r border-[#E6CCB2]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 text-[#4A4A4A] hover:bg-[#FDFBF7] transition-colors font-black"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-[#4A4A4A] text-white font-black uppercase tracking-wider hover:bg-[#2A2A2A] transition-all transform active:scale-95 shadow-lg shadow-[#4A4A4A]/20"
                  >
                    View Full Details
                  </button>
                  <button
                    onClick={handleAddToWishlist}
                    disabled={wishlistLoading}
                    className="px-6 py-4 rounded-2xl bg-[#FDFBF7] border border-[#E6CCB2] text-[#C6A664] font-black hover:bg-[#E6CCB2]/10 transition-colors flex items-center justify-center"
                  >
                    {wishlistLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Heart size={20} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                    )}
                  </button>
                </div>

                {/* Add to Cart */}
                <button 
                  onClick={() => product.stock > 0 && handleAddToCart()}
                  disabled={product.stock <= 0 || cartLoading}
                  className={`w-full px-6 py-4 rounded-2xl font-black uppercase tracking-wider transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                    product.stock <= 0
                    ? 'bg-red-900/50 text-white cursor-not-allowed border border-red-500/30'
                    : isInCart(product.id)
                    ? 'bg-accent text-white shadow-accent/20'
                    : 'bg-[#C6A664] text-white hover:bg-[#B59553] shadow-[#C6A664]/20'
                  }`}
                >
                  {cartLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <ShoppingBag size={20} />
                  )}
                  {product.stock <= 0 ? 'Out of Stock' : isInCart(product.id) ? 'Added to Cart' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default QuickView;


