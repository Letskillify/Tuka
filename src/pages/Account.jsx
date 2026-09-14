import React, { useState, useEffect } from "react";
import { useAuth } from "../components/useAuth";
import { db } from "../components/Firebase";
import { doc, getDoc, updateDoc, collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { 
  User, 
  Package, 
  Heart, 
  LogOut, 
  ChevronRight, 
  Settings, 
  ShoppingBag, 
  CreditCard, 
  MapPin, 
  Bell,
  Award,
  Crown,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  Truck,
  MessageCircle,
  X,
  Phone,
  Mail,
  Check,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Breadcrumb from "../components/Breadcrumb";

const Account = () => {
  const { user, logout, deleteAccount, syncGuestOrders } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const breadcrumbLinks = [
    { name: 'Home', href: '/' },
    { name: 'Account', href: '/account?tab=overview', active: true }
  ];

  const setActiveTab = (tabName) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabName);
    setSearchParams(params, { replace: true });
  };

  const [userData, setUserData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [stats, setStats] = useState({ cart: 0, wishlist: 0 });
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Address Form Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
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
  const [profileForm, setProfileForm] = useState({ displayName: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    let unsubUser = () => {};
    let unsubOrders = () => {};

    const setupListeners = async () => {
      try {
        // 1. Listen to user profile document & saved addresses
        const userRef = doc(db, "users", user.uid);
        unsubUser = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setUserData(data);
            setAddresses(data.savedAddresses || []);
            setProfileForm({
              displayName: data.displayName || user.displayName || "",
              phone: data.phone || ""
            });
          }
        });

        // 2. Sync guest orders & listen to user orders (by UID and Email)
        if (syncGuestOrders) syncGuestOrders(user);

        const cleanEmail = (user.email || "").trim().toLowerCase();
        const qUidOrders = query(collection(db, "orders"), where("userId", "==", user.uid));
        const qEmailOrders = query(collection(db, "orders"), where("customerEmail", "==", cleanEmail));

        let unsubEmail = () => {};

        let uidList = [];
        let emailList = [];

        const mergeAndSortOrders = () => {
          const orderMap = new Map();
          uidList.forEach(item => orderMap.set(item.id, item));
          emailList.forEach(item => orderMap.set(item.id, item));
          const combined = Array.from(orderMap.values());
          combined.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setRecentOrders(combined);
        };

        const unsubUid = onSnapshot(qUidOrders, (snap) => {
          uidList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          mergeAndSortOrders();
        });

        if (cleanEmail) {
          unsubEmail = onSnapshot(qEmailOrders, (snap) => {
            emailList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            mergeAndSortOrders();
          });
        }

        unsubOrders = () => {
          unsubUid();
          unsubEmail();
        };

        // 3. Get Cart & Wishlist Count
        const cartSnap = await getDocs(collection(db, "users", user.uid, "cart"));
        const wishlistSnap = await getDocs(collection(db, "users", user.uid, "wishlist"));
        setStats({
          cart: cartSnap.size,
          wishlist: wishlistSnap.size
        });
      } catch (err) {
        console.error("Account page setup error:", err);
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

  // Handle Address Save (Add or Edit)
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

  // Save Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: profileForm.displayName.trim(),
        phone: profileForm.phone.trim()
      });
      setShowProfileModal(false);
    } catch (err) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSavingProfile(false);
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

  // Loading State - Dark Preloader Background
  if (loading) {
    return (
      <div className="min-h-screen bg-[#161114] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b13896]" />
        <p className="text-xs font-bold text-[#f4cfeb] uppercase tracking-[0.3em]">Loading Your Account...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFAF5] font-sans text-[#161114] pb-24">
      {/* Breadcrumb Header */}
      <Breadcrumb
        title="My Account"
        subtitle="Manage your saved addresses, track atelier orders, update profile details, and access concierge."
        bgImage="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=1600"
        links={breadcrumbLinks}
        badgeText="HOUSE OF TUKA"
      />

      <div className="max-w-[1240px] mx-auto px-6 pt-10">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-4 mb-8 border-b border-[#e5d5df]/40">
          {[
            { id: 'overview', label: 'Overview & Profile', icon: User },
            { id: 'orders', label: 'Orders & Tracking', icon: Package },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
            { id: 'concierge', label: 'Tuka ', icon: MessageCircle },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#b13896] text-white shadow-lg shadow-[#b13896]/20 scale-105'
                    : 'bg-white text-[#4a3f44] border border-[#e5d5df]/60 hover:border-[#b13896] hover:text-[#b13896]'
                }`}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar - Member Badge Card & Quick Links */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#161114] text-white rounded-[32px] p-8 border border-[#b13896]/30 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#b13896]/15 rounded-full blur-3xl" />
              
              <div className="flex items-center gap-5 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                    {userData?.photoURL ? (
                      <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={32} className="text-white/40" />
                    )}
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#b13896] rounded-lg flex items-center justify-center text-white border-2 border-[#161114]">
                    <Crown size={14} />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-white leading-snug">
                    {userData?.displayName || user?.displayName || "Tuka Patron"}
                  </h2>
                  <p className="text-[10px] font-bold text-[#f4cfeb] uppercase tracking-[0.25em] mt-1">
                    {userData?.phone || user?.email}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-[#b13896] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/15"
                >
                  <Edit2 size={13} /> Edit Profile
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center text-xs text-white/60 font-light">
                <span>Account Status:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle size={12} /> Verified
                </span>
              </div>
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Link to="/cart" className="bg-white p-6 rounded-[24px] border border-[#e5d5df]/40 hover:border-[#b13896] transition-all group shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#b13896]/10 flex items-center justify-center text-[#b13896]">
                    <ShoppingBag size={18} />
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-2xl font-bold text-[#161114]">{stats.cart}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cart Items</p>
              </Link>

              <Link to="/wishlist" className="bg-white p-6 rounded-[24px] border border-[#e5d5df]/40 hover:border-[#b13896] transition-all group shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#b13896]/10 flex items-center justify-center text-[#b13896]">
                    <Heart size={18} fill="currentColor" />
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-2xl font-bold text-[#161114]">{stats.wishlist}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Saved Wishlist</p>
              </Link>
            </div>

            {/* Logout & Deactivate */}
            <div className="bg-white rounded-[24px] p-4 border border-[#e5d5df]/40 space-y-2">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all text-left text-slate-700 hover:text-[#b13896]"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Sign Out</span>
                </div>
                <ChevronRight size={14} />
              </button>

              {!showDeleteConfirm ? (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-center py-2 text-[10px] font-bold text-red-500/70 hover:text-red-600 uppercase tracking-widest transition-colors"
                >
                  Deactivate Account
                </button>
              ) : (
                <div className="p-3 bg-red-50 rounded-xl space-y-3 text-center">
                  <p className="text-xs text-red-700 font-bold">Are you sure you want to delete your account?</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-bold text-slate-700"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDeleteAccount}
                      className="flex-1 py-1.5 bg-red-600 rounded-lg text-xs font-bold text-white shadow-sm"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Main Panel - Render Active Tab */}
          <div className="lg:col-span-8 space-y-6">

            {/* TAB 1: OVERVIEW & PROFILE */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {/* Profile Card */}
                <div className="bg-white rounded-[32px] p-8 border border-[#e5d5df]/40 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="text-xl font-serif text-[#161114]">Personal Information</h3>
                      <p className="text-xs text-slate-400">Synced in real-time to your Tuka account</p>
                    </div>
                    <button 
                      onClick={() => setShowProfileModal(true)}
                      className="px-4 py-2 rounded-full border border-[#b13896] text-[#b13896] text-xs font-bold uppercase tracking-wider hover:bg-[#b13896] hover:text-white transition-all cursor-pointer"
                    >
                      Edit Info
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6 text-sm">
                    <div className="p-4 rounded-2xl bg-[#F8F4EF]/60 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Full Name</span>
                      <span className="font-semibold text-slate-800">{userData?.displayName || user?.displayName || "Not specified"}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#F8F4EF]/60 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Email Address</span>
                      <span className="font-semibold text-slate-800">{user?.email}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#F8F4EF]/60 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Phone Number</span>
                      <span className="font-semibold text-slate-800">{userData?.phone || "Not specified"}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#F8F4EF]/60 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Saved Addresses</span>
                      <span className="font-semibold text-slate-800">{addresses.length} Locations</span>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Overview Preview */}
                <div className="bg-white rounded-[32px] p-8 border border-[#e5d5df]/40 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-serif text-[#161114]">Recent Orders</h3>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-[#b13896] hover:underline uppercase tracking-wider"
                    >
                      View All Orders →
                    </button>
                  </div>

                  {recentOrders.length > 0 ? (
                    <div className="space-y-4">
                      {recentOrders.slice(0, 2).map((order) => (
                        <div key={order.id} className="p-5 rounded-2xl bg-[#F8F4EF]/50 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#b13896]/10 flex items-center justify-center text-[#b13896]">
                              <Package size={20} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 tracking-wider">#{order.id.slice(0, 8).toUpperCase()}</p>
                              <p className="text-[11px] text-slate-400 font-medium">
                                {new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
                            <span className="text-sm font-bold text-[#b13896]">₹{Number(order.total || 0).toLocaleString()}</span>
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-[#b13896] border border-rose-200">
                              {order.status || 'Processing'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No recent acquisitions found.</p>
                  )}
                </div>

              </motion.div>
            )}

            {/* TAB 2: ORDERS & TRACKING */}
            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-white rounded-[32px] p-8 border border-[#e5d5df]/40 shadow-sm space-y-6">
                  <div className="border-b pb-4">
                    <h3 className="text-2xl font-serif text-[#161114]">Orders & Live Tracking</h3>
                    <p className="text-xs text-slate-400 mt-1">Real-time status updates from our weaving atelier directly to your doorstep</p>
                  </div>

                  {recentOrders.length > 0 ? (
                    <div className="space-y-6">
                      {recentOrders.map((order) => {
                        const status = (order.status || 'Processing').toLowerCase();
                        const isShipped = status.includes('shipped') || status.includes('delivered');
                        const isDelivered = status.includes('delivered');

                        return (
                          <div key={order.id} className="p-6 rounded-3xl bg-[#F8F4EF]/40 border border-[#e5d5df]/60 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#b13896] block">Order ID</span>
                                <h4 className="text-base font-bold text-slate-900">#{order.id.slice(0, 10).toUpperCase()}</h4>
                                <span className="text-xs text-slate-400">
                                  Placed on {new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-left sm:text-right">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Total Amount</span>
                                <span className="text-lg font-bold text-[#b13896]">₹{Number(order.total || 0).toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Order Status Timeline */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Status Tracker</span>
                              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                                <div className="space-y-1">
                                  <div className="w-8 h-8 rounded-full bg-[#b13896] text-white flex items-center justify-center mx-auto">
                                    <Check size={14} />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-700 block">Order Placed</span>
                                </div>
                                <div className="space-y-1">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors ${
                                    isShipped ? 'bg-[#b13896] text-white' : 'bg-slate-200 text-slate-400'
                                  }`}>
                                    <Truck size={14} />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-700 block">Handcrafted & Shipped</span>
                                </div>
                                <div className="space-y-1">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors ${
                                    isDelivered ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                                  }`}>
                                    <CheckCircle size={14} />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-700 block">Delivered</span>
                                </div>
                              </div>
                            </div>

                            {/* Ordered Items List */}
                            {order.items && order.items.length > 0 && (
                              <div className="pt-2 space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Items Purchased</span>
                                <div className="space-y-2">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-100">
                                      <img src={item.image || item.productImage} alt="" className="w-10 h-12 object-cover rounded-lg" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate">{item.name || item.productName}</p>
                                        <p className="text-[11px] text-slate-400">Qty: {item.quantity || 1}</p>
                                      </div>
                                      <span className="text-xs font-bold text-slate-700">₹{Number(item.price || item.unitPrice || 0).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Order Action Buttons */}
                            <div className="pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3">
                              <Link
                                to={`/order-details?orderNumber=${encodeURIComponent(order.orderNumber || order.id)}`}
                                className="px-4 py-2 bg-white border border-[#e5d5df] hover:border-[#b13896] text-[#b13896] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <FileText size={14} /> View Details &amp; Invoice
                              </Link>
                              <a
                                href={`https://shiprocket.co/tracking/${encodeURIComponent(order.awbCode || order.orderNumber || order.id)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <Truck size={14} /> Shiprocket Track
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-[#F8F4EF]/50 rounded-3xl border border-dashed border-slate-200">
                      <ShoppingBag size={44} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-600 font-serif text-lg">No orders placed yet.</p>
                      <Link to="/shop" className="mt-4 inline-block px-6 py-2.5 bg-[#b13896] text-white rounded-full text-xs font-bold uppercase tracking-wider">
                        Explore Collection
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 3: SAVED ADDRESSES */}
            {activeTab === 'addresses' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-white rounded-[32px] p-8 border border-[#e5d5df]/40 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="text-2xl font-serif text-[#161114]">Saved Addresses</h3>
                      <p className="text-xs text-slate-400">Add or edit addresses saved directly to Firestore for single-tap checkout</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingAddressId(null);
                        setAddressForm({ fullName: "", phone: "", altPhone: "", houseNumber: "", street: "", locality: "", landmark: "", city: "", state: "", pincode: "", addressType: "Home", isDefault: false });
                        setShowAddressModal(true);
                      }}
                      className="px-5 py-2.5 rounded-full bg-[#b13896] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md hover:bg-[#972d7f] transition-all cursor-pointer"
                    >
                      <Plus size={16} /> Add Address
                    </button>
                  </div>

                  {addresses.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div key={addr.id} className="p-5 rounded-2xl bg-[#F8F4EF]/60 border border-slate-200/80 space-y-3 relative group">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-bold text-slate-900 text-sm">{addr.fullName}</h4>
                            <div className="flex items-center gap-1.5">
                              {addr.addressType && (
                                <span className="text-[9px] font-bold uppercase bg-slate-200/60 text-slate-700 px-2 py-0.5 rounded">
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
                            {addr.city}, {addr.state} - <span className="font-bold text-slate-800">{addr.pincode}</span>
                          </p>
                          <p className="text-xs text-slate-500">Phone: {addr.phone} {addr.altPhone ? ` | Alt: ${addr.altPhone}` : ''}</p>

                          <div className="pt-2 flex items-center gap-3 border-t border-slate-200/60">
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
                              className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-[#F8F4EF]/40 rounded-2xl border border-dashed border-slate-200">
                      <MapPin size={36} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-sm font-semibold text-slate-600">No saved addresses found.</p>
                      <button
                        onClick={() => setShowAddressModal(true)}
                        className="mt-3 text-xs font-bold text-[#b13896] hover:underline uppercase tracking-wider"
                      >
                        + Add Your First Address
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 4: ARTISAN CONCIERGE */}
            {activeTab === 'concierge' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-[#161114] text-white rounded-[32px] p-8 border border-[#b13896]/30 shadow-xl space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center">
                    <MessageCircle size={24} />
                  </div>
                  <h3 className="text-2xl font-serif">Tuka Concierge & VIP Support</h3>
                  <p className="text-sm text-white/70 font-light leading-relaxed max-w-xl">
                    Need live video verification of saree fabrics, custom blouse sizing advice, or urgent delivery dispatch? Connect directly with our studio weavers on WhatsApp (+91 62659 98887).
                  </p>
                  <a
                    href="https://wa.me/916265998887?text=Hello%20Tuka%20Concierge,%20I%20need%20VIP%20assistance."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#25D366]/30 transition-all cursor-pointer"
                  >
                    <MessageCircle size={18} /> Chat on WhatsApp (+91 62659 98887)
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  {editingAddressId ? "Edit Address" : "Add Shipping Address"}
                </h3>
                <button onClick={() => setShowAddressModal(false)} className="text-slate-400 hover:text-slate-700">
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-500 uppercase block mb-1">Alt Phone (Optional)</label>
                    <input
                      type="text"
                      value={addressForm.altPhone || ""}
                      onChange={(e) => setAddressForm({ ...addressForm, altPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">Flat / House / Bldg *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apt 4B, Ruby Towers"
                      value={addressForm.houseNumber || ""}
                      onChange={(e) => setAddressForm({ ...addressForm, houseNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">Locality / Area *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sector 1"
                      value={addressForm.locality || ""}
                      onChange={(e) => setAddressForm({ ...addressForm, locality: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500 uppercase block mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Near Metro"
                      value={addressForm.landmark || ""}
                      onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Address Type</label>
                  <div className="flex gap-2">
                    {["Home", "Work"].map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setAddressForm({ ...addressForm, addressType: type })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                          addressForm.addressType === type
                            ? "bg-[#b13896] text-white border-[#b13896]"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="accent-[#b13896]"
                  />
                  <span className="font-semibold text-slate-600">Set as default shipping address</span>
                </label>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="flex-1 py-2.5 border rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#b13896] text-white rounded-xl font-bold hover:bg-[#972d7f]"
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-serif text-xl font-bold text-slate-900">Edit Profile</h3>
                <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-700">
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
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#b13896] outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 py-2.5 border rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex-1 py-2.5 bg-[#b13896] text-white rounded-xl font-bold hover:bg-[#972d7f]"
                  >
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Account;
