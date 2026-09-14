import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../components/useAuth';
import { db } from '../components/Firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
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

  // Sync with Firestore or LocalStorage
  useEffect(() => {
    let unsubscribeCart = () => {};
    let unsubscribeWishlist = () => {};

    if (user) {
      // Real-time sync for logged-in user
      const cartRef = collection(db, "users", user.uid, "cart");
      unsubscribeCart = onSnapshot(cartRef, (snap) => {
        setCartItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const wishRef = collection(db, "users", user.uid, "wishlist");
      unsubscribeWishlist = onSnapshot(wishRef, (snap) => {
        setWishlistItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    } else {
      // Guest: Load from LocalStorage
      const loadLocal = () => {
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const localWish = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setCartItems(localCart);
        setWishlistItems(localWish);
      };
      loadLocal();
      
      // Listen for storage changes in other tabs
      window.addEventListener('storage', loadLocal);
      return () => window.removeEventListener('storage', loadLocal);
    }

    return () => {
      unsubscribeCart();
      unsubscribeWishlist();
    };
  }, [user]);

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

    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "cart", product.id), item);
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
    } else {
      let localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const index = localCart.findIndex(i => i.id === product.id);
      
      if (index > -1) {
        localCart[index] = { ...localCart[index], ...item };
      } else {
        localCart.push(item);
      }
      
      localStorage.setItem('cart', JSON.stringify(localCart));
      setCartItems([...localCart]);
      setPopupItem({
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        image: product.image || product.images?.[0] || "",
        stock: stockNum
      });
      setPopupVisible(true);
      return true;
    }
  };

  const removeFromCart = async (productId) => {
    if (user) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "cart", productId));
        return true;
      } catch (error) {
        console.error("Error removing from cart:", error);
        return false;
      }
    } else {
      let localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      localCart = localCart.filter(i => i.id !== productId);
      localStorage.setItem('cart', JSON.stringify(localCart));
      setCartItems([...localCart]);
      return true;
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

    if (user) {
      try {
        const itemRef = doc(db, "users", user.uid, "cart", productId);
        await setDoc(itemRef, { quantity: newQty }, { merge: true });
        return true;
      } catch (error) {
        console.error("Error updating quantity:", error);
        return false;
      }
    } else {
      let localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const index = localCart.findIndex(i => i.id === productId);
      if (index > -1) {
        localCart[index].quantity = newQty;
        localStorage.setItem('cart', JSON.stringify(localCart));
        setCartItems([...localCart]);
      }
      return true;
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

    if (user) {
      try {
        const wishRef = doc(db, "users", user.uid, "wishlist", product.id);
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
    } else {
      let localWish = JSON.parse(localStorage.getItem('wishlist') || '[]');
      if (isAlready) {
        localWish = localWish.filter(i => String(i.id).split('_')[0] !== rawId && i.id !== product.id);
      } else {
        localWish.push(item);
      }
      localStorage.setItem('wishlist', JSON.stringify(localWish));
      setWishlistItems([...localWish]);
      return true;
    }
  };

  const removeFromWishlist = async (productId) => {
    if (user) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "wishlist", productId));
        return true;
      } catch (error) {
        console.error("Error removing from wishlist:", error);
        return false;
      }
    } else {
      let localWish = JSON.parse(localStorage.getItem('wishlist') || '[]');
      localWish = localWish.filter(i => i.id !== productId);
      localStorage.setItem('wishlist', JSON.stringify(localWish));
      setWishlistItems([...localWish]);
      return true;
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        const { getDocs, collection, writeBatch } = await import("firebase/firestore");
        const cartRef = collection(db, "users", user.uid, "cart");
        const snap = await getDocs(cartRef);
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (error) {
        console.error("Error clearing user cart:", error);
      }
    }
    localStorage.removeItem("cart");
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

      {/* Mini Popup */}
      <div 
        className={`fixed z-[9999] bg-white rounded-2xl border border-slate-100 shadow-[0_20px_50px_rgba(22,17,20,0.15)] p-4 flex flex-col gap-3 transition-all duration-300 md:w-[340px] md:bottom-6 md:right-6 bottom-4 left-4 right-4 ${
          popupVisible 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
        }`}
        style={{
          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif"
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-50">
          <span className="text-[11px] font-bold text-[#b13896] tracking-wider uppercase">Added to Cart</span>
          <button 
            type="button"
            onClick={() => setPopupVisible(false)} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Body: Product Info */}
        {popupItem && (
          <div className="flex gap-3.5 items-center">
            <img 
              src={popupItem.image} 
              alt={popupItem.name} 
              className="w-12 h-14 rounded-lg object-cover bg-slate-50 border border-slate-100 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-[13px] font-bold text-slate-800 truncate">{popupItem.name}</h4>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">₹{Number(popupItem.price).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Footer: Quantity Controls */}
        {popupItem && (
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-650 uppercase tracking-wider">Quantity</span>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => updateCartQuantity(popupItem.id, popupQuantity - 1)}
                className="w-7 h-7 bg-white hover:bg-[#b13896]/10 text-slate-650 hover:text-[#b13896] font-bold rounded-lg border border-slate-200 transition-colors flex items-center justify-center text-sm"
              >
                &minus;
              </button>
              <span className="w-6 text-center text-xs font-bold text-slate-800">{popupQuantity}</span>
              <button 
                type="button"
                onClick={() => updateCartQuantity(popupItem.id, popupQuantity + 1)}
                disabled={popupQuantity >= Math.min(10, popupItem.stock || 10)}
                className="w-7 h-7 bg-white hover:bg-[#b13896]/10 text-slate-650 hover:text-[#b13896] disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-650 font-bold rounded-lg border border-slate-200 transition-colors flex items-center justify-center text-sm"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2.5 mt-1">
          <button 
            type="button"
            onClick={() => setPopupVisible(false)}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider transition-all text-center border border-slate-200/50"
          >
            Continue
          </button>
          <button 
            type="button"
            onClick={() => {
              setPopupVisible(false);
              navigate('/cart');
            }}
            className="flex-1 py-2.5 rounded-xl bg-[#b13896] hover:bg-[#962e7f] text-white text-[11px] font-bold uppercase tracking-wider transition-all text-center shadow-md shadow-[#b13896]/20"
          >
            Go to Cart
          </button>
        </div>
      </div>
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
