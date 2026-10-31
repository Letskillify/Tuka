import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../components/useAuth';
import { db } from '../components/Firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupItem, setPopupItem] = useState(null);

  const activeCartItem = cartItems.find(i => i.id === popupItem?.id);
  const popupQuantity = activeCartItem ? activeCartItem.quantity : 1;

  // Auto-close cart popup after 5 seconds of inactivity
  useEffect(() => {
    if (popupVisible && popupItem) {
      const timer = setTimeout(() => {
        setPopupVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [popupVisible, popupItem?.id, popupQuantity]);

  const [liveProductsMap, setLiveProductsMap] = useState({});
  const [deviceId] = useState(() => {
    let id = localStorage.getItem("tuka_device_id");
    if (!id) {
      id = "device_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("tuka_device_id", id);
    }
    return id;
  });

  const activeId = user?.uid || deviceId;

  // Real-time listener for all products to keep stock synced across the app
  useEffect(() => {
    const unsubProds = onSnapshot(collection(db, "products"), (snap) => {
      const map = {};
      snap.docs.forEach((docSnap) => {
        map[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
      });
      setLiveProductsMap(map);
    });
    return () => unsubProds();
  }, []);

  // Sync with Firestore dynamically for EVERYONE (Users & Guests)
  useEffect(() => {
    const cartRef = collection(db, "carts", activeId, "items");
    const unsubscribeCart = onSnapshot(cartRef, (snap) => {
      setCartItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const wishRef = collection(db, "wishlists", activeId, "items");
    const unsubscribeWishlist = onSnapshot(wishRef, (snap) => {
      setWishlistItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeCart();
      unsubscribeWishlist();
    };
  }, [activeId]);

  const addToCart = async (product, qty = 1) => {
    // Guard against zero-stock
    const stockNum = Number(product.stock || 0);
    if (stockNum <= 0) {
      alert('This item is currently out of stock.');
      return false;
    }

    const existing = cartItems.find(i => i.id === product.id);
    const maxAllowed = Math.min(10, stockNum);
    const currentQty = existing ? (existing.quantity || 1) : 0;
    const finalQty = Math.min(maxAllowed, currentQty + qty);

    if (existing && currentQty >= maxAllowed) {
      alert(`Limit reached. Maximum available stock: ${stockNum}`);
      return false;
    }

    const item = {
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      original_price: Number(product.original_price) || 0,
      image: product.image || product.images?.[0] || "",
      addedAt: new Date().toISOString(),
      quantity: finalQty,
      stock: stockNum
    };

    try {
      await setDoc(doc(db, "carts", activeId, "items", String(product.id)), item);
      setPopupItem({
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        image: product.image || product.images?.[0] || "",
        stock: stockNum
      });
      setPopupVisible(true);
      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      return false;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await deleteDoc(doc(db, "carts", activeId, "items", String(productId)));
      return true;
    } catch (error) {
      console.error("Error removing from cart:", error);
      return false;
    }
  };

  const updateCartQuantity = async (productId, newQty) => {
    const item = cartItems.find(i => i.id === productId);
    if (!item) return false;

    // Decrement to 0 = remove the item
    if (newQty < 1) {
      return removeFromCart(productId);
    }

    const stockNum = Number(item.stock || 0);
    const maxAllowed = Math.min(10, stockNum > 0 ? stockNum : newQty);
    if (newQty > maxAllowed) {
      alert(`Only ${stockNum} pieces are available in stock.`);
      return false;
    }

    try {
      const itemRef = doc(db, "carts", activeId, "items", String(productId));
      await setDoc(itemRef, { quantity: newQty }, { merge: true });
      return true;
    } catch (error) {
      console.error("Error updating quantity:", error);
      return false;
    }
  };

  const addToWishlist = async (product) => {
    if (!product || !product.id) return false;
    const rawId = String(product.id).split('_')[0];
    const isAlready = wishlistItems.some(i => String(i.id).split('_')[0] === rawId || i.id === product.id);

    const item = {
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      original_price: Number(product.original_price) || 0,
      image: product.image || product.images?.[0] || "",
      addedAt: new Date().toISOString()
    };

    try {
      const wishRef = doc(db, "wishlists", activeId, "items", String(product.id));
      if (isAlready) {
        await deleteDoc(wishRef);
      } else {
        await setDoc(wishRef, item);
      }
      return true;
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await deleteDoc(doc(db, "wishlists", activeId, "items", String(productId)));
      return true;
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      return false;
    }
  };

  const clearCart = async () => {
    try {
      const cartRef = collection(db, "carts", activeId, "items");
      const snap = await getDocs(cartRef);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (error) {
      console.error("Error clearing user cart:", error);
    }
    setCartItems([]);
  };

  const isInCart = (productId) => cartItems.some(i => i.id === productId);
  const isInWishlist = (productId) => {
    if (!productId) return false;
    const rawId = String(productId).split('_')[0];
    return wishlistItems.some(i => i.id === productId || String(i.id).split('_')[0] === rawId);
  };

  const MAGENTA = '#b13896';

  return (
    <StoreContext.Provider value={{
      cartItems,
      wishlistItems,
      liveProductsMap,
      cartCount: cartItems.length,
      wishlistCount: wishlistItems.length,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      addToWishlist,
      isInCart,
      isInWishlist
    }}>
      {children}

      {/* Centered Add to Cart Modal */}
      {popupVisible && (
        <div className="fixed inset-0 z-[9999] bg-[#161114]/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200"
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif"
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setPopupVisible(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100/50 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            {/* Header */}
            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-serif text-slate-900">Added to Cart</h3>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Successfully placed in your bag</p>
            </div>

            {/* Product Info */}
            {popupItem && (
              <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <img
                  src={popupItem.image}
                  alt={popupItem.name}
                  className="w-16 h-20 rounded-xl object-cover bg-white shadow-sm flex-shrink-0 border border-slate-200"
                />
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{popupItem.name}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold text-[#b13896]">₹{Number(popupItem.price).toLocaleString()}</p>
                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(popupItem.id, popupQuantity - 1)}
                        className="w-6 h-6 text-slate-500 hover:text-[#b13896] hover:bg-slate-50 rounded flex items-center justify-center font-medium transition-colors"
                      >
                        &minus;
                      </button>
                      <span className="w-4 text-center text-xs font-bold text-slate-800">{popupQuantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(popupItem.id, popupQuantity + 1)}
                        disabled={popupQuantity >= Math.min(10, popupItem.stock || 10)}
                        className="w-6 h-6 text-slate-500 hover:text-[#b13896] hover:bg-slate-50 disabled:opacity-30 rounded flex items-center justify-center font-medium transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                type="button"
                onClick={() => setPopupVisible(false)}
                className="flex-1 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-[11px] border-2 border-slate-200 font-bold uppercase tracking-wider transition-all text-center"
              >
                Continue Shopping
              </button>
              <button
                type="button"
                onClick={() => {
                  setPopupVisible(false);
                  navigate('/cart');
                }}
                className="flex-1 py-3.5 rounded-xl bg-[#161114] hover:bg-[#b13896] text-white text-[11px] font-bold uppercase tracking-wider transition-all text-center shadow-lg"
              >
                Go to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};

// Compatibility export for old hook name
export const useCartWishlist = useStore;
