import React, { useState, useEffect } from "react";
import { useStore } from "../hooks/useStore";
import { useAuth } from "../components/useAuth";
import { db } from "../components/Firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  CreditCard,
  User,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Loader2,
  Sparkles,
  CheckCircle2,
  Tag,
  Home,
  Briefcase,
  Building,
  Check
} from "lucide-react";

// Safe dynamic Cashfree loader helper
const loadCashfreeSDK = async (mode = "sandbox") => {
  try {
    const cashfreeSdk = await import("@cashfreepayments/cashfree-js");
    const loadFn = cashfreeSdk.load || cashfreeSdk.default?.load;
    if (loadFn) {
      return await loadFn({ mode });
    }
  } catch (e) {
    console.warn("[Checkout] Cashfree SDK import warning:", e);
  }
  if (typeof window !== "undefined" && window.Cashfree) {
    return new window.Cashfree({ mode });
  }
  throw new Error("Unable to load Cashfree Payment gateway. Please refresh or try Cash on Delivery.");
};

const Checkout = () => {
  const { cartItems, cartCount, clearCart } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Session-bound Idempotency Key
  const [idempotencyKey] = useState(() => "idemp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9));

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("online");

  // Support single product "Buy Now" flow passed via location.state or full cart checkout
  const checkoutItems = location.state?.buyNowItem ? [location.state.buyNowItem] : cartItems;

  // Complete Full Address State
  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    altPhone: "",
    houseNumber: "",
    street: "",
    locality: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    addressType: "Home" // "Home" | "Work"
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Promo Code State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  // Prefill saved address if user is logged in
  useEffect(() => {
    if (!user) return;
    const loadUserSavedAddresses = async () => {
      try {
        const uSnap = await getDoc(doc(db, "users", user.uid));
        if (uSnap.exists()) {
          const uData = uSnap.data();
          const list = uData.savedAddresses || [];
          setSavedAddresses(list);
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            setFormData((prev) => ({
              ...prev,
              name: defaultAddr.fullName || prev.name || user.displayName || "",
              email: prev.email || user.email || "",
              phone: defaultAddr.phone || prev.phone || "",
              altPhone: defaultAddr.altPhone || prev.altPhone || "",
              houseNumber: defaultAddr.houseNumber || prev.houseNumber || "",
              street: defaultAddr.street || defaultAddr.address || prev.street || "",
              locality: defaultAddr.locality || prev.locality || "",
              landmark: defaultAddr.landmark || prev.landmark || "",
              city: defaultAddr.city || prev.city || "",
              state: defaultAddr.state || prev.state || "",
              pincode: defaultAddr.pincode || prev.pincode || "",
              addressType: defaultAddr.addressType || "Home"
            }));
          }
        }
      } catch (err) {
        console.error("Saved address fetch error:", err);
      }
    };
    loadUserSavedAddresses();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  const estimatedSubtotal = checkoutItems.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0);

  // Promo Code Handler
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError("");
    const code = couponInput.trim().toUpperCase();

    if (!code) {
      setCouponError("Please enter a valid coupon code.");
      return;
    }

    if (code === "TUKA10") {
      const disc = Math.round(estimatedSubtotal * 0.1);
      setDiscountAmount(disc);
      setAppliedCoupon("TUKA10 (10% OFF)");
    } else if (code === "WELCOME20") {
      const disc = Math.round(estimatedSubtotal * 0.2);
      setDiscountAmount(disc);
      setAppliedCoupon("WELCOME20 (20% OFF)");
    } else if (code === "GIFT500") {
      const disc = Math.min(500, estimatedSubtotal);
      setDiscountAmount(disc);
      setAppliedCoupon("GIFT500 (₹500 OFF)");
    } else {
      setCouponError("Invalid promo code. Try TUKA10 or WELCOME20.");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon("");
    setDiscountAmount(0);
    setCouponInput("");
    setCouponError("");
  };

  const finalTotal = Math.max(0, estimatedSubtotal - discountAmount);

  const submitOrderToBackend = async (payMethod, paymentDetails = null) => {
    try {
      const payload = {
        idempotencyKey,
        userId: user?.uid || null,
        customerEmail: formData.email,
        customerName: formData.name,
        customerPhone: formData.phone,
        shippingAddress: {
          fullName: formData.name,
          phone: formData.phone,
          altPhone: formData.altPhone || "",
          houseNumber: formData.houseNumber || "",
          street: formData.street || "",
          locality: formData.locality || "",
          landmark: formData.landmark || "",
          city: formData.city || "",
          state: formData.state || "",
          pincode: formData.pincode || "",
          addressType: formData.addressType || "Home"
        },
        items: checkoutItems.map((item) => ({
          productId: String(item.id).split("_")[0],
          size: item.selectedSize || (item.id.includes("_") ? item.id.split("_")[1] : null),
          color: item.color || null,
          quantity: item.quantity || 1,
          name: item.name,
          price: item.price,
          image: item.image
        })),
        paymentMethod: payMethod,
        paymentDetails,
        couponCode: appliedCoupon ? appliedCoupon.split(" ")[0] : null
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        if (!res.ok) throw new Error(`Order placement failed with server status ${res.status}.`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Order placement failed.");
      }

      // Clear cart ONLY after verified success
      await clearCart();

      // Navigate to dedicated Order Success page
      navigate(`/order-success?orderId=${data.orderId}&orderNumber=${data.orderNumber}`, {
        state: { order: data.order, orderId: data.orderId, orderNumber: data.orderNumber }
      });
    } catch (err) {
      console.error("[Checkout] Order Submission Error:", err);
      setErrorMessage(err.message || "Failed to process order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.houseNumber.trim() ||
      !formData.street.trim() ||
      !formData.locality.trim() ||
      !formData.city.trim() ||
      !formData.pincode.trim()
    ) {
      setErrorMessage("Please complete all required fields (Name, Email, Phone, House/Flat, Street, Locality, City, and Pincode).");
      return;
    }

    setLoading(true);

    if (paymentMethod === "cod") {
      await submitOrderToBackend("cod");
      return;
    }

    // Online Payment Flow via Cashfree /api/cashfree/create-order
    try {
      const initRes = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: appliedCoupon ? appliedCoupon.split(" ")[0] : null,
          items: checkoutItems.map((i) => ({
            productId: String(i.id).split("_")[0],
            size: i.selectedSize || (i.id.includes("_") ? i.id.split("_")[1] : null),
            quantity: i.quantity || 1
          })),
          customerDetails: {
            id: user?.uid || "guest",
            email: formData.email,
            phone: formData.phone
          }
        })
      });

      let cData = {};
      try {
        cData = await initRes.json();
      } catch (jsonErr) {
        if (!initRes.ok) throw new Error(`Cashfree initialization returned server status ${initRes.status}.`);
      }

      if (!initRes.ok) {
        throw new Error(cData.error || "Could not initialize online payment.");
      }

      // Check for dev mode fallback
      if (typeof cData.payment_session_id === "string" && cData.payment_session_id.includes("_mock_")) {
        await submitOrderToBackend("cashfree", {
          cashfreeOrderId: cData.order_id
        });
        return;
      }

      const cashfree = await loadCashfreeSDK("sandbox"); // Use "production" for live

      const checkoutOptions = {
        paymentSessionId: cData.payment_session_id
      };

      cashfree.checkout(checkoutOptions).then(async (result) => {
        if (result.error) {
          if (result.error.code !== "window_closed" && !result.error.message?.includes("cancelled")) {
            navigate("/order-failed", { state: { error: result.error.message || "Payment attempt failed." } });
          } else {
            setErrorMessage(result.error.message || "Payment was cancelled.");
            setLoading(false);
          }
          return;
        }

        if (result.paymentDetails) {
          // Verify with local backend
          await submitOrderToBackend("cashfree", {
            cashfreeOrderId: cData.order_id
          });
        } else if (result.redirect) {
          console.log("Cashfree redirecting...");
        }
      });

    } catch (err) {
      console.error("[Checkout] Cashfree setup error:", err);
      setErrorMessage(err.message || "Failed to initialize payment gateway.");
      setLoading(false);
    }
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F4EF] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-serif text-[#161114] mb-4 italic">Your collection is empty</h1>
        <p className="text-xs text-slate-500 mb-8 max-w-sm">Explore our handloom sarees and designer blouses to add items to checkout.</p>
        <Link to="/shop" className="px-10 py-4 bg-[#b13896] text-white font-bold rounded-2xl uppercase tracking-[0.25em] text-xs shadow-xl hover:bg-[#161114] transition-all">
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFAF5] pt-10 pb-24 px-4 sm:px-6 lg:px-8 font-sans text-[#161114]">
      <div className="max-w-[1340px] mx-auto">

        {/* Header Bar */}
        <div className="mb-10 border-b border-[#e5d5df]/50 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <Link to="/cart" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-[#4a3f44] hover:text-[#b13896] transition-colors group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Return to Selection
            </Link>
            <h1 className="text-3xl sm:text-5xl font-serif text-[#161114]">
              Checkout <span className="text-[#b13896] italic font-light">&amp; Acquisition Protocol</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-full border border-[#e5d5df]/80 shadow-sm text-xs font-bold uppercase tracking-wider text-[#4a3f44]">
            <ShieldCheck size={18} className="text-[#b13896]" />
            <span>Server-Verified Encrypted Protocol</span>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-4 text-rose-700 text-xs shadow-sm"
          >
            <AlertCircle size={20} className="shrink-0 text-rose-500" />
            <span className="font-semibold">{errorMessage}</span>
          </motion.div>
        )}

        <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Main Form Inputs */}
          <div className="lg:col-span-7 space-y-10">

            {/* Step 1: Customer Identity */}
            <section className="bg-white rounded-[32px] p-6 md:p-8 border border-[#e5d5df]/60 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-[#b13896] text-white flex items-center justify-center font-serif text-sm font-bold shadow-md">1</span>
                  <h2 className="text-xl font-serif text-[#161114]">Patron Identity</h2>
                </div>
                {user ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-100 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Logged In Patron
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    Guest Checkout
                  </span>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Full Name *</label>
                  <input
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="First & Last Name"
                    className="w-full bg-[#F8F4EF]/50 border border-[#e5d5df] rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#b13896] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Email Address *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="patron@example.com"
                    className="w-full bg-[#F8F4EF]/50 border border-[#e5d5df] rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#b13896] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Primary Mobile Phone *</label>
                  <input
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 00000 00000"
                    className="w-full bg-[#F8F4EF]/50 border border-[#e5d5df] rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#b13896] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Alternative Phone (Optional)</label>
                  <input
                    name="altPhone"
                    value={formData.altPhone}
                    onChange={handleInputChange}
                    placeholder="Secondary Contact"
                    className="w-full bg-[#F8F4EF]/50 border border-[#e5d5df] rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#b13896] transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Step 2: Shipping Address */}
            <section className="bg-white rounded-[32px] p-6 md:p-8 border border-[#e5d5df]/60 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-[#b13896] text-white flex items-center justify-center font-serif text-sm font-bold shadow-md">2</span>
                  <h2 className="text-xl font-serif text-[#161114]">Destination Atelier</h2>
                </div>
              </div>

              {/* Saved Address Quick Selector for Logged-In Users */}
              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Saved Addresses:</span>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => (
                      <button
                        type="button"
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setFormData((prev) => ({
                            ...prev,
                            name: addr.fullName || prev.name,
                            phone: addr.phone || prev.phone,
                            altPhone: addr.altPhone || prev.altPhone,
                            houseNumber: addr.houseNumber || prev.houseNumber,
                            street: addr.street || addr.address || prev.street,
                            locality: addr.locality || prev.locality,
                            landmark: addr.landmark || prev.landmark,
                            city: addr.city || prev.city,
                            state: addr.state || prev.state,
                            pincode: addr.pincode || prev.pincode,
                            addressType: addr.addressType || "Home"
                          }));
                        }}
                        className={`p-4 rounded-2xl text-xs text-left border transition-all cursor-pointer ${selectedAddressId === addr.id
                          ? "bg-white border-[#b13896] ring-2 ring-[#b13896]/20 shadow-md"
                          : "bg-[#F8F4EF]/40 border-[#e5d5df] hover:bg-white"
                          }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-bold text-slate-900">{addr.fullName}</p>
                          <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {addr.addressType || "Home"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {addr.houseNumber ? `${addr.houseNumber}, ` : ''}{addr.street}, {addr.city}
                        </p>
                        <p className="text-[11px] font-bold text-slate-700 mt-1">Pincode: {addr.pincode}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Address Input Grid */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Flat / House No / Building Name *</label>
                  <input
                    name="houseNumber"
                    required
                    value={formData.houseNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. Apt 4B, Emerald Residency"
                    className="w-full bg-[#F8F4EF]/50 border border-[#e5d5df] rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#b13896] transition-all"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Street / Road / Apartment *</label>
                  <input
                    name="street"
                    required
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="e.g. Park Street, 2nd Main Road"
                    className="w-full bg-[#F8F4EF]/50 border border-[#e5d5df] rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#b13896] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Locality / Area / Suburb *</label>
                  <input
                    name="locality"
                    required
                    value={formData.locality}
                    onChange={handleInputChange}
                    placeholder="e.g. Salt Lake Sector 1"
                    className="w-full bg-[#F8F4EF]/50 border border-[#e5d5df] rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#b13896] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Landmark (Optional)</label>
                  <input
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleInputChange}
                    placeholder="e.g. Near City Centre Metro"
                    className="w-full bg-[#F8F4EF]/50 border border-[#e5d5df] rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#b13896] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">City *</label>
                  <input
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Kolkata"
                    className="w-full bg-[#F8F4EF]/50 border border-[#e5d5df] rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#b13896] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">State *</label>
                  <input
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="e.g. West Bengal"
                    className="w-full bg-[#F8F4EF]/50 border border-[#e5d5df] rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:border-[#b13896] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Pincode *</label>
                  <input
                    name="pincode"
                    required
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="6-digit PIN"
                    className="w-full bg-[#F8F4EF]/50 border border-[#e5d5df] rounded-xl px-4 py-3 text-xs text-slate-900 font-mono outline-none focus:border-[#b13896] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Address Category *</label>
                  <div className="flex gap-3">
                    {[
                      { id: "Home", label: "Home", icon: Home },
                      { id: "Work", label: "Work / Office", icon: Briefcase }
                    ].map((cat) => {
                      const isSelected = formData.addressType === cat.id;
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => setFormData((prev) => ({ ...prev, addressType: cat.id }))}
                          className={`flex-1 py-3 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${isSelected
                            ? "bg-[#b13896] text-white border-[#b13896] shadow-sm"
                            : "bg-[#F8F4EF]/40 text-slate-700 border-[#e5d5df] hover:border-[#b13896]"
                            }`}
                        >
                          <cat.icon size={14} />
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </section>

            {/* Step 3: Payment Protocol */}
            <section className="bg-white rounded-[32px] p-6 md:p-8 border border-[#e5d5df]/60 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <span className="w-9 h-9 rounded-full bg-[#b13896] text-white flex items-center justify-center font-serif text-sm font-bold shadow-md">3</span>
                <h2 className="text-xl font-serif text-[#161114]">Payment Protocol</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setPaymentMethod("online")}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col items-start gap-2 ${paymentMethod === "online"
                    ? "bg-[#b13896] text-white border-[#b13896] shadow-lg"
                    : "bg-[#F8F4EF]/50 text-slate-900 border-[#e5d5df] hover:border-[#b13896]"
                    }`}
                >
                  <CreditCard size={22} />
                  <span className="text-xs font-bold uppercase tracking-wider">Online Payment Gateway</span>
                  <span className={`text-[11px] ${paymentMethod === "online" ? "text-white/80" : "text-slate-500"}`}>
                    UPI, Credit/Debit Cards, Netbanking
                  </span>
                </div>

                <div
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col items-start gap-2 ${paymentMethod === "cod"
                    ? "bg-[#b13896] text-white border-[#b13896] shadow-lg"
                    : "bg-[#F8F4EF]/50 text-slate-900 border-[#e5d5df] hover:border-[#b13896]"
                    }`}
                >
                  <Truck size={22} />
                  <span className="text-xs font-bold uppercase tracking-wider">Cash on Delivery (COD)</span>
                  <span className={`text-[11px] ${paymentMethod === "cod" ? "text-white/80" : "text-slate-500"}`}>
                    Pay cash upon door delivery
                  </span>
                </div>
              </div>
            </section>

          </div>

          {/* Right Column: Order Summary & Coupon */}
          <aside className="lg:col-span-5">
            <div className="bg-white rounded-[32px] border border-[#e5d5df]/60 p-8 sticky top-28 shadow-xl space-y-6">
              <h3 className="text-2xl font-serif text-[#161114] border-b border-slate-100 pb-4">Acquisition Summary</h3>

              {/* Items List */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {checkoutItems.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-20 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-serif font-bold text-slate-900 truncate">{item.name}</h4>
                      <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                        <span>
                          Qty: <strong>{item.quantity || 1}</strong>
                          {item.selectedSize && <span className="ml-2 font-semibold text-[#b13896]">({item.selectedSize})</span>}
                        </span>
                        <span className="font-bold text-[#b13896] text-xs">₹{(Number(item.price) * (item.quantity || 1)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Box */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Apply Privilege Promo Code</span>

                {appliedCoupon ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-bold">
                    <div className="flex items-center gap-2">
                      <Tag size={15} />
                      <span>{appliedCoupon}</span>
                    </div>
                    <button type="button" onClick={removeCoupon} className="text-rose-600 underline text-[10px]">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. TUKA10 or WELCOME20"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 bg-[#F8F4EF]/60 border border-[#e5d5df] rounded-xl px-3 py-2 text-xs text-slate-900 font-mono outline-none focus:border-[#b13896]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-[#161114] hover:bg-[#b13896] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {couponError && <p className="text-[10px] text-rose-600 font-semibold">{couponError}</p>}
              </div>

              {/* Financial Totals */}
              <div className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{estimatedSubtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Privilege Discount</span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Dispatch</span>
                  <span className="text-emerald-600 font-semibold">Complimentary</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Total Acquisition</span>
                  <span className="text-3xl font-serif text-[#b13896]">₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-[0.25em] transition-all bg-[#161114] hover:bg-[#b13896] text-white shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing Acquisition...</span>
                  </>
                ) : (
                  <span>Place Order &amp; Pay</span>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400 leading-relaxed font-light">
                By placing this order, you agree to House of Tuka&apos;s <Link to="/terms-and-conditions" className="text-[#b13896] underline">Terms of Service</Link> and <Link to="/privacy-policy" className="text-[#b13896] underline">Privacy Policy</Link>.
              </p>
            </div>
          </aside>

        </form>
      </div>
    </div>
  );
};

export default Checkout;
