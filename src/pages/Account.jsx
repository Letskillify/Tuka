import React, { useState, useEffect } from "react";
import { useAuth } from "../components/useAuth";
import { db } from "../components/Firebase";
import { doc, getDoc, updateDoc, collection, getDocs, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  User,
  Package,
  Heart,
  LogOut,
  ChevronRight,
  ShoppingBag,
  CreditCard,
  MapPin,
  Crown,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Truck,
  MessageCircle,
  X,
  Check,
  FileText,
  Star,
  Search,
  Printer,
  ShieldCheck,
  Sparkles,
  CreditCard as CardIcon,
  ChevronDown,
  ArrowRight,
  Settings,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Account = () => {
  const { user, loading: authLoading, logout, deleteAccount, syncGuestOrders } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const setActiveTab = (tabName) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabName);
    setSearchParams(params, { replace: true });
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const [userData, setUserData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [savedCards, setSavedCards] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [stats, setStats] = useState({ cart: 0, wishlist: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');

  // Address Form Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeServiceable, setPincodeServiceable] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    altPhone: "",
    houseNumber: "",
    street: "",
    locality: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    addressType: "Home",
    isDefault: false
  });

  // Profile Edit State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName: "", phone: "", photoURL: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Payment Method Modal State
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardHolder: "",
    cardNumber: "",
    expiry: "",
    cardType: "Visa",
    isDefault: false
  });

  // Product Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Live Order Tracking Search State
  const [trackWaybillInput, setTrackWaybillInput] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  // Invoice Details Modal State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }

    let unsubUser = () => { };
    let unsubOrders = () => { };

    const setupListeners = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        unsubUser = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setUserData(data);
            setAddresses(data.savedAddresses || []);
            setSavedCards(data.savedPaymentMethods || []);
            setProfileForm({
              displayName: data.displayName || user.displayName || "",
              phone: data.phone || "",
              photoURL: data.photoURL || user.photoURL || ""
            });
          }
        });

        if (syncGuestOrders) syncGuestOrders(user);

        const cleanEmail = (user.email || "").trim().toLowerCase();
        const qUidOrders = query(collection(db, "orders"), where("userId", "==", user.uid));
        const qEmailOrders = query(collection(db, "orders"), where("customerEmail", "==", cleanEmail));

        let uidList = [];
        let emailList = [];

        const mergeAndSortOrders = () => {
          const orderMap = new Map();
          uidList.forEach(item => orderMap.set(item.id, item));
          emailList.forEach(item => orderMap.set(item.id, item));
          const combined = Array.from(orderMap.values());
          combined.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

          const totalSpent = combined.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
          setStats(prev => ({ ...prev, totalSpent }));
          setRecentOrders(combined);
        };

        const unsubUid = onSnapshot(qUidOrders, (snap) => {
          uidList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          mergeAndSortOrders();
        });

        if (cleanEmail) {
          onSnapshot(qEmailOrders, (snap) => {
            emailList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            mergeAndSortOrders();
          });
        }

        unsubOrders = () => {
          unsubUid();
        };

        // Fetch User Reviews
        const qReviews = query(collection(db, "reviews"), where("userId", "==", user.uid));
        onSnapshot(qReviews, (snap) => {
          setUserReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Cart & Wishlist counts
        const cartSnap = await getDocs(collection(db, "users", user.uid, "cart"));
        const wishlistSnap = await getDocs(collection(db, "users", user.uid, "wishlist"));
        setStats(prev => ({
          ...prev,
          cart: cartSnap.size,
          wishlist: wishlistSnap.size
        }));

      } catch (err) {
        console.error("Account setup error:", err);
      } finally {
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      unsubUser();
      unsubOrders();
    };
  }, [user, navigate]);

  // Pincode Lookup
  const handlePincodeBlur = async () => {
    if (!addressForm.pincode || addressForm.pincode.length !== 6) return;
    setPincodeLoading(true);
    setPincodeServiceable(null);
    try {
      const res = await fetch(`/api/delhivery/check-pincode?pincode=${addressForm.pincode}`);
      const data = await res.json();
      if (data.is_serviceable) {
        setPincodeServiceable(true);
        if (data.delivery_codes && data.delivery_codes[0]?.postal_code) {
          const info = data.delivery_codes[0].postal_code;
          if (info.district && !addressForm.city) setAddressForm(prev => ({ ...prev, city: info.district }));
          if (info.state_code && !addressForm.state) setAddressForm(prev => ({ ...prev, state: info.state_code }));
        }
      } else {
        setPincodeServiceable(false);
      }
    } catch {
      setPincodeServiceable(true);
    } finally {
      setPincodeLoading(false);
    }
  };

  // Save Address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.fullName || !addressForm.phone || !addressForm.street || !addressForm.pincode) {
      alert("Please fill in all required address fields.");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      let updatedList = [...addresses];

      if (editingAddressId) {
        updatedList = updatedList.map(a => a.id === editingAddressId ? { ...addressForm, id: editingAddressId } : a);
      } else {
        const newAddr = { ...addressForm, id: `addr_${Date.now()}` };
        if (updatedList.length === 0) newAddr.isDefault = true;
        updatedList.push(newAddr);
      }

      if (addressForm.isDefault) {
        updatedList = updatedList.map(a => ({
          ...a,
          isDefault: a.id === (editingAddressId || updatedList[updatedList.length - 1].id)
        }));
      }

      await updateDoc(userRef, { savedAddresses: updatedList });
      setShowAddressModal(false);
      setEditingAddressId(null);
      setAddressForm({ fullName: "", phone: "", altPhone: "", houseNumber: "", street: "", locality: "", landmark: "", city: "", state: "", pincode: "", addressType: "Home", isDefault: false });
    } catch (err) {
      alert("Failed to save address: " + err.message);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Remove this saved address?")) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const updatedList = addresses.filter(a => a.id !== id);
      await updateDoc(userRef, { savedAddresses: updatedList });
    } catch (err) {
      alert("Failed to delete address: " + err.message);
    }
  };

  // Save Payment Card
  const handleSaveCard = async (e) => {
    e.preventDefault();
    if (!cardForm.cardHolder || !cardForm.cardNumber || !cardForm.expiry) {
      alert("Please complete card details.");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const maskedNum = "•••• •••• •••• " + cardForm.cardNumber.replace(/\D/g, "").slice(-4);
      const newCard = {
        id: `card_${Date.now()}`,
        cardHolder: cardForm.cardHolder,
        cardNumberMasked: maskedNum,
        expiry: cardForm.expiry,
        cardType: cardForm.cardType,
        isDefault: cardForm.isDefault || savedCards.length === 0
      };

      let updatedCards = [...savedCards];
      if (newCard.isDefault) {
        updatedCards = updatedCards.map(c => ({ ...c, isDefault: false }));
      }
      updatedCards.push(newCard);

      await updateDoc(userRef, { savedPaymentMethods: updatedCards });
      setShowCardModal(false);
      setCardForm({ cardHolder: "", cardNumber: "", expiry: "", cardType: "Visa", isDefault: false });
    } catch (err) {
      alert("Failed to save payment method: " + err.message);
    }
  };

  // Delete Card
  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Delete this saved payment card?")) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const updatedList = savedCards.filter(c => c.id !== cardId);
      await updateDoc(userRef, { savedPaymentMethods: updatedList });
    } catch (err) {
      alert("Failed to delete payment card: " + err.message);
    }
  };

  // Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: profileForm.displayName.trim(),
        phone: profileForm.phone.trim(),
        photoURL: profileForm.photoURL.trim()
      });
      setShowProfileModal(false);
    } catch (err) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit Review
  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!selectedReviewItem || !reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      await addDoc(collection(db, "reviews"), {
        productId: selectedReviewItem.productId || selectedReviewItem.id,
        productName: selectedReviewItem.name || selectedReviewItem.productName || "Handloom Collection",
        productImage: selectedReviewItem.image || selectedReviewItem.productImage || "",
        userId: user.uid,
        userName: userData?.displayName || user.displayName || "Verified Buyer",
        rating,
        title: reviewTitle.trim() || "Exquisite Craftsmanship",
        comment: reviewComment.trim(),
        createdAt: serverTimestamp(),
        verifiedPurchase: true
      });

      setShowReviewModal(false);
      setReviewTitle("");
      setReviewComment("");
      setRating(5);
      alert("Thank you! Your product review has been submitted.");
    } catch (err) {
      alert("Failed to submit review: " + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Live Order Tracking (Delhivery API)
  const handleFetchTracking = async (e) => {
    if (e) e.preventDefault();
    if (!trackWaybillInput.trim()) return;

    setTrackingLoading(true);
    setTrackingError("");
    setTrackingResult(null);

    try {
      const queryParam = trackWaybillInput.trim();
      const res = await fetch(`/api/ithink/track?awb=${encodeURIComponent(queryParam)}&orderNumber=${encodeURIComponent(queryParam)}`);
      const data = await res.json();

      if (data && (data.success || data.awb || data.scans?.length > 0)) {
        setTrackingResult(data);
      } else {
        setTrackingError(data.message || data.error || "No live shipment tracking updates found for this Waybill or Order Number.");
      }
    } catch (err) {
      setTrackingError("Failed to fetch live shipment data: " + err.message);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      navigate("/");
    } catch (error) {
      alert("Failed to delete account. Please try again.");
    }
  };

  const getAccountOrderStatusBadge = (rawStatus) => {
    const norm = String(rawStatus || "confirmed").toLowerCase().trim();
    if (norm.includes("delivered")) return { label: "Delivered", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (norm.includes("shipped") || norm.includes("transit")) return { label: "Shipped", bg: "bg-sky-50 text-sky-700 border-sky-200" };
    if (norm.includes("packed")) return { label: "Packed", bg: "bg-amber-50 text-amber-700 border-amber-200" };
    if (norm.includes("processing")) return { label: "Processing", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    if (norm.includes("cancel")) return { label: "Cancelled", bg: "bg-rose-50 text-rose-700 border-rose-200" };
    if (norm.includes("return")) return { label: "Returned", bg: "bg-slate-100 text-slate-700 border-slate-200" };
    return { label: "Confirmed", bg: "bg-blue-50 text-blue-700 border-blue-200" };
  };

  const filteredOrders = recentOrders.filter((order) => {
    if (orderFilter === 'all') return true;
    const st = String(order.orderStatus || order.status || 'confirmed').toLowerCase();
    if (orderFilter === 'in_transit') return st.includes('shipped') || st.includes('transit');
    if (orderFilter === 'delivered') return st.includes('delivered');
    if (orderFilter === 'processing') return st.includes('processing') || st.includes('packed') || st.includes('confirmed') || st.includes('placed');
    if (orderFilter === 'cancelled') return st.includes('cancel');
    return true;
  });

  const navMenuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: User, count: null },
    { id: 'orders', label: 'Order History', icon: Package, count: recentOrders.length },
    { id: 'tracking', label: 'Track Shipment', icon: Truck, count: null },
    { id: 'reviews', label: 'Product Reviews', icon: Star, count: userReviews.length },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin, count: addresses.length },
    { id: 'payment-methods', label: 'Saved Cards', icon: CardIcon, count: savedCards.length },
    { id: 'billing', label: 'Tax Invoices', icon: FileText, count: null },
    { id: 'concierge', label: 'VIP Concierge', icon: MessageCircle, count: null },
  ];

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#161114] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b13896]" />
        <p className="text-xs font-bold text-[#f4cfeb] uppercase tracking-[0.3em]">Loading Account...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F5] font-sans text-[#161114] pt-28 lg:pt-36 pb-24 selection:bg-[#b13896] selection:text-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Subtle Page Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6">
          <Link to="/" className="hover:text-[#b13896] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[#b13896]">My Account</span>
        </div>

        {/* Dashboard Grid Container */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* Left Vertical Sidebar (Desktop) & Mobile Top Menu */}
          <div className="lg:col-span-4 space-y-6">

            {/* Patron Profile Box */}
            <div className="bg-white rounded-3xl p-6 border border-[#e6ded8] shadow-sm relative overflow-hidden space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-[#161114] border border-white/20 flex items-center justify-center overflow-hidden shadow-md">
                    {userData?.photoURL || user?.photoURL ? (
                      <img src={userData?.photoURL || user?.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={30} className="text-white/60" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#b13896] rounded-lg flex items-center justify-center text-white border-2 border-white">
                    <Crown size={12} />
                  </div>
                </div>

                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#b13896]/10 text-[#b13896] text-[9px] font-bold uppercase tracking-widest mb-1">
                    <Sparkles size={10} /> House Patron
                  </span>
                  <h2 className="text-xl font-serif font-bold text-[#161114] truncate">
                    {userData?.displayName || user?.displayName || "Tuka Patron"}
                  </h2>
                  <p className="text-xs text-slate-500 truncate font-sans">
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Lifetime Spend Badge */}
              <div className="p-4 rounded-2xl bg-[#F8F4EF] border border-[#e6ded8]/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Lifetime Patronage</span>
                  <span className="text-lg font-serif font-bold text-[#b13896]">₹{stats.totalSpent.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#e6ded8] hover:border-[#b13896] text-[#b13896] text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <Edit2 size={12} /> Edit
                </button>
              </div>

              {/* Navigation Menu Links */}
              <div className="space-y-1.5 pt-2">
                {navMenuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${isActive
                        ? 'bg-[#161114] text-white shadow-md'
                        : 'text-slate-700 hover:bg-[#F8F4EF] hover:text-[#b13896]'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={16} className={isActive ? 'text-[#f4cfeb]' : 'text-slate-400'} />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.count !== null && item.count > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-[#b13896] text-white' : 'bg-[#F8F4EF] text-[#b13896]'}`}>
                            {item.count}
                          </span>
                        )}
                        <ChevronRight size={14} className={isActive ? 'text-white' : 'text-slate-300'} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sign Out & Deactivate */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </div>
                  <ChevronRight size={14} />
                </button>
              </div>

            </div>

          </div>

          {/* Right Main Dashboard Area */}
          <div className="lg:col-span-8 space-y-6">

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                {/* 4 Stats Cards Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-[#e6ded8] shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Spent</span>
                    <span className="text-xl font-serif font-bold text-[#b13896]">₹{stats.totalSpent.toLocaleString()}</span>
                  </div>

                  <button onClick={() => setActiveTab('orders')} className="bg-white p-5 rounded-3xl border border-[#e6ded8] shadow-xs hover:border-[#b13896] text-left cursor-pointer transition-colors">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">My Orders</span>
                    <span className="text-xl font-serif font-bold text-[#161114]">{recentOrders.length}</span>
                  </button>

                  <Link to="/wishlist" className="bg-white p-5 rounded-3xl border border-[#e6ded8] shadow-xs hover:border-[#b13896] transition-colors">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Wishlist</span>
                    <span className="text-xl font-serif font-bold text-[#161114]">{stats.wishlist} Items</span>
                  </Link>

                  <button onClick={() => setActiveTab('addresses')} className="bg-white p-5 rounded-3xl border border-[#e6ded8] shadow-xs hover:border-[#b13896] text-left cursor-pointer transition-colors">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Addresses</span>
                    <span className="text-xl font-serif font-bold text-[#161114]">{addresses.length} Saved</span>
                  </button>
                </div>

                {/* Profile Overview Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e6ded8] shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-[#161114]">Personal Information</h3>
                      <p className="text-xs text-slate-400">Synced to your Tuka patron account</p>
                    </div>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="px-4 py-2 rounded-xl border border-[#b13896] text-[#b13896] text-xs font-bold uppercase tracking-wider hover:bg-[#b13896] hover:text-white transition-all cursor-pointer"
                    >
                      Edit Info
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-[#F8F4EF] border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Full Name</span>
                      <span className="font-semibold text-slate-900 text-sm">{userData?.displayName || user?.displayName || "Not specified"}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#F8F4EF] border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Email Address</span>
                      <span className="font-semibold text-slate-900 text-sm">{user?.email}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#F8F4EF] border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Phone Number</span>
                      <span className="font-semibold text-slate-900 text-sm">{userData?.phone || "Not specified"}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Preview */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e6ded8] shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-serif font-bold text-[#161114]">Recent Acquisitions</h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-[#b13896] hover:underline uppercase tracking-wider cursor-pointer"
                    >
                      View All ({recentOrders.length}) →
                    </button>
                  </div>

                  {recentOrders.length > 0 ? (
                    <div className="space-y-3">
                      {recentOrders.slice(0, 3).map((order) => (
                        <div key={order.id} className="p-4 sm:p-5 rounded-2xl bg-[#F8F4EF] border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#b13896]/10 flex items-center justify-center text-[#b13896] shrink-0">
                              <Package size={22} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 font-mono">#{order.orderNumber || order.id.slice(0, 10).toUpperCase()}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                                </span>
                                {order.paymentId && (
                                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    Ref: {order.paymentId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                            <span className="text-base font-serif font-bold text-[#b13896]">₹{Number(order.total || 0).toLocaleString()}</span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getAccountOrderStatusBadge(order.orderStatus || order.status).bg}`}>
                              {getAccountOrderStatusBadge(order.orderStatus || order.status).label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-[#F8F4EF] rounded-2xl border border-dashed border-slate-200">
                      <ShoppingBag size={38} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-600 font-serif">No acquisitions recorded yet.</p>
                      <Link to="/shop" className="mt-3 inline-block px-5 py-2.5 bg-[#b13896] text-white rounded-full text-xs font-bold uppercase tracking-wider">
                        Explore Collection
                      </Link>
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* TAB 2: ORDERS */}
            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e6ded8] shadow-xs space-y-6">

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-[#161114]">Order History</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Track shipment progress, download tax invoices, and write reviews</p>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                      {[
                        { id: 'all', label: 'All Orders' },
                        { id: 'processing', label: 'Processing' },
                        { id: 'in_transit', label: 'In Transit' },
                        { id: 'delivered', label: 'Delivered' },
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setOrderFilter(f.id)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all ${orderFilter === f.id ? 'bg-[#161114] text-white' : 'bg-[#F8F4EF] text-slate-600 hover:bg-slate-200'}`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredOrders.length > 0 ? (
                    <div className="space-y-6">
                      {filteredOrders.map((order) => {
                        const stBadge = getAccountOrderStatusBadge(order.orderStatus || order.status);
                        const rawStatus = String(order.orderStatus || order.status || 'confirmed').toLowerCase();
                        const isCancelled = rawStatus.includes('cancel');
                        const isDelivered = rawStatus.includes('delivered');
                        const isShipped = isDelivered || rawStatus.includes('shipped') || rawStatus.includes('transit');
                        const isPacked = isShipped || rawStatus.includes('packed') || rawStatus.includes('processing');
                        const isConfirmed = isPacked || rawStatus.includes('confirmed') || rawStatus.includes('placed');
                        const payId = order.paymentId || order.cashfreePaymentId || order.cfPaymentId;

                        return (
                          <div key={order.id} className="p-5 sm:p-6 rounded-2xl bg-[#F8F4EF] border border-[#e6ded8] space-y-5">

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#b13896]">Order Number</span>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${stBadge.bg}`}>
                                    {stBadge.label}
                                  </span>
                                </div>
                                <h4 className="text-base font-bold text-slate-900 font-mono">#{order.orderNumber || order.id.slice(0, 10).toUpperCase()}</h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="text-xs text-slate-500">
                                    Date: {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                                  </span>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                    Payment: {order.paymentStatus || 'Pending'}
                                  </span>
                                  {payId && (
                                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      Ref: {payId}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Total Amount</span>
                                <span className="text-lg font-serif font-bold text-[#b13896]">₹{Number(order.total || 0).toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Status Timeline */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Status Timeline</span>
                              {isCancelled ? (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                                  This order was marked as Cancelled.
                                </div>
                              ) : (
                                <div className="grid grid-cols-4 gap-2 text-center pt-1">
                                  <div className="space-y-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto shadow-xs transition-colors ${isConfirmed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                      <Check size={14} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-800 block">Placed</span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors shadow-xs ${isPacked ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                      <Package size={14} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-800 block">Packed</span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors shadow-xs ${isShipped ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                      <Truck size={14} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-800 block">Shipped</span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors shadow-xs ${isDelivered ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                      <CheckCircle size={14} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-800 block">Delivered</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Items List */}
                            {order.items && order.items.length > 0 && (
                              <div className="pt-2 space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Items</span>
                                <div className="space-y-2">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 gap-3">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <img src={item.image || item.productImage || "/img/saree-1.jpg"} alt="" className="w-10 h-12 object-cover rounded-lg shrink-0" />
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold text-slate-900 truncate">{item.name || item.productName}</p>
                                          <p className="text-[11px] text-slate-400">Qty: {item.quantity || 1}</p>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => {
                                          setSelectedReviewItem(item);
                                          setShowReviewModal(true);
                                        }}
                                        className="px-3 py-1 bg-[#b13896]/10 text-[#b13896] hover:bg-[#b13896] hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0"
                                      >
                                        Review
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedInvoiceOrder(order);
                                    setShowInvoiceModal(true);
                                  }}
                                  className="px-4 py-2 bg-white border border-[#e6ded8] hover:border-[#b13896] text-[#b13896] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                  <FileText size={14} /> Tax Invoice
                                </button>

                                <button
                                  onClick={() => {
                                    setTrackWaybillInput(order.awbCode || order.trackingNumber || order.orderNumber || order.id);
                                    setActiveTab('tracking');
                                  }}
                                  className="px-4 py-2 bg-[#161114] hover:bg-[#b13896] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Truck size={14} /> Track Package
                                </button>
                              </div>

                              <Link
                                to={`/orders?orderNumber=${order.orderNumber || order.id}`}
                                className="px-4 py-2 bg-[#b13896]/10 hover:bg-[#b13896] hover:text-white text-[#b13896] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                              >
                                <span>Order Details</span>
                                <ChevronRight size={13} />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-[#F8F4EF] rounded-2xl border border-dashed border-slate-200">
                      <ShoppingBag size={40} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-600 font-serif">No orders found.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 3: TRACK ORDER */}
            {activeTab === 'tracking' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e6ded8] shadow-xs space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-2xl font-serif font-bold text-[#161114]">iThink Logistics Real-Time Tracker</h3>
                    <p className="text-xs text-slate-400 mt-1">Enter your Order Reference Number or Courier AWB Waybill</p>
                  </div>

                  <form onSubmit={handleFetchTracking} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        required
                        value={trackWaybillInput}
                        onChange={(e) => setTrackWaybillInput(e.target.value)}
                        placeholder="Enter Order Number or AWB (e.g. ORD-123456 or 1369010468790)"
                        className="w-full pl-12 pr-4 py-3.5 bg-[#F8F4EF] border border-[#e6ded8] rounded-xl text-xs font-semibold focus:border-[#b13896] outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={trackingLoading}
                      className="px-6 py-3.5 bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0"
                    >
                      {trackingLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Track Shipment <Truck size={16} /></>}
                    </button>
                  </form>

                  {trackingError && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      {trackingError}
                    </div>
                  )}

                  {trackingResult && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-[#161114] text-white space-y-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
                        <div>
                          <span className="text-[10px] font-bold text-[#f4cfeb] uppercase tracking-widest">
                            Courier Partner: {trackingResult.courier || "iThink Express (Delhivery/Partner)"}
                          </span>
                          <h4 className="text-xl font-serif text-white mt-1">
                            {trackingResult.currentStatus || trackingResult.Status?.Status || "In Transit"}
                          </h4>
                        </div>
                        <span className="px-3.5 py-1 rounded-full bg-[#b13896] text-white text-xs font-bold shadow-md">
                          Active Dispatch
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                          <span className="text-white/40 block mb-1 uppercase font-bold text-[9px]">AWB Tracking Code</span>
                          <span className="font-mono text-white font-bold">{trackingResult.awb || trackingResult.AWB || "N/A"}</span>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                          <span className="text-white/40 block mb-1 uppercase font-bold text-[9px]">Expected Delivery</span>
                          <span className="text-white font-bold">
                            {trackingResult.expectedDeliveryDate
                              ? new Date(trackingResult.expectedDeliveryDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                              : "3 to 5 Business Days"}
                          </span>
                        </div>
                      </div>

                      {/* Scans timeline */}
                      {Array.isArray(trackingResult.scans) && trackingResult.scans.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-white/10">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                            Real-Time Courier Checkpoints
                          </span>
                          <div className="space-y-3 border-l-2 border-[#b13896]/40 ml-2 pl-4">
                            {trackingResult.scans.map((scan, i) => (
                              <div key={i} className="relative text-xs space-y-0.5">
                                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#b13896]" />
                                <div className="flex justify-between items-baseline">
                                  <span className="font-bold text-white">{scan.status || "Checkpoint Scan"}</span>
                                  {scan.dateTime && (
                                    <span className="text-[10px] text-white/50">
                                      {new Date(scan.dateTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                  )}
                                </div>
                                {scan.location && (
                                  <p className="text-[11px] text-white/70">
                                    Location: {scan.location}
                                  </p>
                                )}
                                {scan.remark && (
                                  <p className="text-[10px] text-white/40 italic">
                                    {scan.remark}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {trackingResult.trackingUrl && (
                        <div className="pt-2">
                          <a
                            href={trackingResult.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-bold text-[#f4cfeb] hover:text-white underline underline-offset-4"
                          >
                            <span>Open Official iThink Tracking Page</span>
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 4: REVIEWS */}
            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e6ded8] shadow-xs space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-2xl font-serif font-bold text-[#161114]">My Product Reviews</h3>
                    <p className="text-xs text-slate-400 mt-1">Feedback and ratings submitted for your Tuka acquisitions</p>
                  </div>

                  {userReviews.length > 0 ? (
                    <div className="space-y-4">
                      {userReviews.map((rev) => (
                        <div key={rev.id} className="p-4 sm:p-5 rounded-2xl bg-[#F8F4EF] border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src={rev.productImage || "/img/saree-1.jpg"} alt="" className="w-10 h-12 object-cover rounded-lg" />
                              <div>
                                <h4 className="font-bold text-slate-900 text-xs">{rev.productName}</h4>
                                <div className="flex items-center gap-1 text-amber-500 mt-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={12} fill={i < rev.rating ? "currentColor" : "none"} />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                              Verified Review
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800">{rev.title}</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-[#F8F4EF] rounded-2xl border border-dashed border-slate-200">
                      <Star size={36} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-600 font-serif">No reviews submitted yet.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 5: SAVED ADDRESSES */}
            {activeTab === 'addresses' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e6ded8] shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-[#161114]">Saved Shipping Addresses</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Manage delivery locations for 1-click express checkout</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingAddressId(null);
                        setAddressForm({ fullName: "", phone: "", altPhone: "", houseNumber: "", street: "", locality: "", landmark: "", city: "", state: "", pincode: "", addressType: "Home", isDefault: false });
                        setShowAddressModal(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#b13896] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:bg-[#972d7f] transition-all cursor-pointer shrink-0"
                    >
                      <Plus size={16} /> Add New Address
                    </button>
                  </div>

                  {addresses.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div key={addr.id} className="p-5 rounded-2xl bg-[#F8F4EF] border border-slate-200 space-y-3 relative">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-bold text-slate-900 text-sm">{addr.fullName}</h4>
                            <div className="flex items-center gap-1.5">
                              {addr.addressType && (
                                <span className="text-[9px] font-bold uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                                  {addr.addressType}
                                </span>
                              )}
                              {addr.isDefault && (
                                <span className="text-[9px] font-bold uppercase tracking-widest bg-[#b13896] text-white px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {addr.houseNumber ? `${addr.houseNumber}, ` : ''}{addr.street}
                            {addr.locality ? `, ${addr.locality}` : ''}
                            {addr.landmark ? ` (Landmark: ${addr.landmark})` : ''}
                            <br />
                            {addr.city}, {addr.state} - <span className="font-bold text-slate-900">{addr.pincode}</span>
                          </p>
                          <p className="text-xs text-slate-500">Phone: {addr.phone}</p>

                          <div className="pt-2 flex items-center gap-4 border-t border-slate-200">
                            <button
                              onClick={() => {
                                setEditingAddressId(addr.id);
                                setAddressForm(addr);
                                setShowAddressModal(true);
                              }}
                              className="text-xs font-bold text-[#b13896] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-[#F8F4EF] rounded-2xl border border-dashed border-slate-200">
                      <MapPin size={38} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-600 font-serif">No saved addresses.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 6: SAVED CARDS */}
            {activeTab === 'payment-methods' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e6ded8] shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-[#161114]">Saved Payment Methods</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Encrypted card details for quick single-tap checkout</p>
                    </div>
                    <button
                      onClick={() => setShowCardModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-[#b13896] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:bg-[#972d7f] transition-all cursor-pointer shrink-0"
                    >
                      <Plus size={16} /> Add Card
                    </button>
                  </div>

                  {savedCards.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {savedCards.map((card) => (
                        <div key={card.id} className="p-6 rounded-2xl bg-[#161114] text-white space-y-4 relative shadow-xl">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#f4cfeb]">{card.cardType || "Card"}</span>
                            {card.isDefault && <span className="text-[9px] font-bold bg-[#b13896] px-2 py-0.5 rounded-full uppercase">Default</span>}
                          </div>
                          <p className="font-mono text-lg font-bold tracking-widest text-white">{card.cardNumberMasked}</p>
                          <div className="flex justify-between items-center text-xs text-white/60">
                            <span>Holder: {card.cardHolder}</span>
                            <span>Exp: {card.expiry}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteCard(card.id)}
                            className="text-xs text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer pt-1"
                          >
                            <Trash2 size={12} /> Remove Card
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-[#F8F4EF] rounded-2xl border border-dashed border-slate-200">
                      <CardIcon size={38} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-600 font-serif">No payment cards saved.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 7: BILLING & INVOICES */}
            {activeTab === 'billing' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e6ded8] shadow-xs space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-2xl font-serif font-bold text-[#161114]">Billing Details & Invoices</h3>
                    <p className="text-xs text-slate-400 mt-1">Official purchase statements and GST tax invoice receipts</p>
                  </div>

                  {recentOrders.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold text-slate-900 font-mono">Invoice #{order.id.slice(0, 10).toUpperCase()}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'} | Method: {order.paymentMethod || 'Online Payment'}
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                            <span className="text-base font-bold text-[#b13896] font-serif">₹{Number(order.total || 0).toLocaleString()}</span>
                            <button
                              onClick={() => {
                                setSelectedInvoiceOrder(order);
                                setShowInvoiceModal(true);
                              }}
                              className="px-4 py-2 bg-[#F8F4EF] hover:bg-[#b13896] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <FileText size={14} /> View Invoice
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No billing records available.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 8: CONCIERGE */}
            {activeTab === 'concierge' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-[#161114] text-white rounded-3xl p-6 sm:p-8 border border-[#b13896]/30 shadow-xl space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center">
                    <MessageCircle size={26} />
                  </div>
                  <h3 className="text-2xl font-serif text-white">Tuka Concierge & VIP Support</h3>
                  <p className="text-xs sm:text-sm text-white/70 font-light leading-relaxed max-w-xl">
                    Need live video verification of saree fabrics, custom blouse sizing advice, or urgent delivery dispatch? Connect directly with our studio weavers on WhatsApp (+91 74004 44522).
                  </p>
                  <a
                    href="https://wa.me/917400444522?text=Hello%20Tuka%20Concierge,%20I%20need%20VIP%20assistance."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#25D366]/30 transition-all cursor-pointer"
                  >
                    <MessageCircle size={18} /> Chat on WhatsApp (+91 74004 44522)
                  </a>
                </div>
              </motion.div>
            )}

          </div>

        </div>

      </div>

      {/* ADDRESS MODAL */}
      <AnimatePresence>
        {showAddressModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  {editingAddressId ? "Edit Shipping Address" : "Add Shipping Address"}
                </h3>
                <button onClick={() => setShowAddressModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-500 uppercase block mb-1">Alt Phone</label>
                    <input
                      type="text"
                      value={addressForm.altPhone || ""}
                      onChange={(e) => setAddressForm({ ...addressForm, altPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">Flat / House *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apt 4B"
                      value={addressForm.houseNumber || ""}
                      onChange={(e) => setAddressForm({ ...addressForm, houseNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Street / Road Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Park Street"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      onBlur={handlePincodeBlur}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    />
                  </div>
                </div>

                {pincodeLoading && <p className="text-[10px] text-[#b13896] font-bold">Checking pincode with Delhivery...</p>}
                {pincodeServiceable === true && <p className="text-[10px] text-emerald-600 font-bold">✓ Pincode serviceable by Delhivery Express</p>}
                {pincodeServiceable === false && <p className="text-[10px] text-amber-600 font-bold">⚠️ Delhivery express unavailable for this pincode</p>}

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="flex-1 py-3 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#b13896] text-white rounded-xl font-bold hover:bg-[#972d7f] cursor-pointer"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROFILE EDIT MODAL */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-serif text-xl font-bold text-slate-900">Edit Profile</h3>
                <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Profile Avatar Image URL</label>
                  <input
                    type="url"
                    value={profileForm.photoURL}
                    onChange={(e) => setProfileForm({ ...profileForm, photoURL: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    placeholder="https://..."
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 py-3 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex-1 py-3 bg-[#b13896] text-white rounded-xl font-bold hover:bg-[#972d7f] cursor-pointer"
                  >
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CARD MODAL */}
      <AnimatePresence>
        {showCardModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-serif text-xl font-bold text-slate-900">Add Payment Card</h3>
                <button onClick={() => setShowCardModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveCard} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Cardholder Name *</label>
                  <input
                    type="text"
                    required
                    value={cardForm.cardHolder}
                    onChange={(e) => setCardForm({ ...cardForm, cardHolder: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Card Number *</label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    placeholder="4532 •••• •••• 8910"
                    value={cardForm.cardNumber}
                    onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">Expiry MM/YY *</label>
                    <input
                      type="text"
                      required
                      placeholder="08/28"
                      value={cardForm.expiry}
                      onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">Network</label>
                    <select
                      value={cardForm.cardType}
                      onChange={(e) => setCardForm({ ...cardForm, cardType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none bg-white"
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="RuPay">RuPay</option>
                      <option value="Amex">Amex</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCardModal(false)}
                    className="flex-1 py-3 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#b13896] text-white rounded-xl font-bold hover:bg-[#972d7f] cursor-pointer"
                  >
                    Save Card
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REVIEW MODAL */}
      <AnimatePresence>
        {showReviewModal && selectedReviewItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-serif text-xl font-bold text-slate-900">Write Product Review</h3>
                <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#F8F4EF] rounded-2xl">
                <img src={selectedReviewItem.image || selectedReviewItem.productImage || "/img/saree-1.jpg"} alt="" className="w-12 h-14 object-cover rounded-xl shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{selectedReviewItem.name || selectedReviewItem.productName}</p>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block mt-0.5">✓ Verified Buyer</span>
                </div>
              </div>

              <form onSubmit={handleSaveReview} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-2 text-center">Your Rating</label>
                  <div className="flex items-center justify-center gap-2 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 cursor-pointer transition-transform hover:scale-125"
                      >
                        <Star size={28} fill={(hoverRating || rating) >= star ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Review Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Magnificent silk weave quality!"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Review Comments *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Share your experience regarding the saree texture, drape, embroidery, and delivery..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 py-3 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="flex-1 py-3 bg-[#b13896] text-white rounded-xl font-bold hover:bg-[#972d7f] cursor-pointer"
                  >
                    {submittingReview ? "Submitting..." : "Publish Review"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INVOICE MODAL */}
      <AnimatePresence>
        {showInvoiceModal && selectedInvoiceOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#161114]">TAX INVOICE</h3>
                  <p className="text-[10px] uppercase font-bold text-[#b13896] tracking-widest mt-0.5">House of Tuka Bengal Handlooms</p>
                </div>
                <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex justify-between text-slate-600 border-b pb-3">
                  <div>
                    <span className="font-bold block text-slate-800 font-mono">Invoice No: #{selectedInvoiceOrder.id.slice(0, 10).toUpperCase()}</span>
                    <span>Date: {selectedInvoiceOrder.createdAt?.seconds ? new Date(selectedInvoiceOrder.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold block text-slate-800">Billed To:</span>
                    <span>{selectedInvoiceOrder.customerName || user?.displayName || user?.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">Itemized Breakdown</span>
                  {selectedInvoiceOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1.5 border-b border-slate-100">
                      <span>{item.name || item.productName} (x{item.quantity || 1})</span>
                      <span className="font-bold font-serif">₹{Number(item.price || item.unitPrice || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 space-y-1 text-right border-t">
                  <p className="text-slate-500">Subtotal: ₹{Number(selectedInvoiceOrder.subtotal || selectedInvoiceOrder.total || 0).toLocaleString()}</p>
                  {selectedInvoiceOrder.discount > 0 && <p className="text-emerald-600">Discount: -₹{selectedInvoiceOrder.discount}</p>}
                  <p className="text-base font-bold text-[#b13896] font-serif pt-1">Total Paid: ₹{Number(selectedInvoiceOrder.total || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-[#161114] text-white rounded-xl font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md hover:bg-[#b13896] transition-colors"
                >
                  <Printer size={16} /> Print / Save PDF
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-6 py-3 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Account;
