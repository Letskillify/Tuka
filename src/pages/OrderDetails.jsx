import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/useAuth";
import { useStore } from "../hooks/useStore";
import { db } from "../components/Firebase";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";
import { 
  Package, 
  FileText, 
  Printer, 
  Truck, 
  ExternalLink, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Mail, 
  Phone, 
  ChevronRight, 
  Download, 
  ShoppingBag, 
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  Search,
  User,
  Filter,
  Check,
  Loader2
} from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { motion, AnimatePresence } from "framer-motion";

const OrderDetails = () => {
  const { user } = useAuth();
  const { clearCart } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedOrderNum = searchParams.get("orderNumber") || searchParams.get("id") || "";
  const cfOrderId = searchParams.get("cf_order_id") || searchParams.get("order_id") || "";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null);
  const [filterQuery, setFilterQuery] = useState("");

  // Cashfree Verification & Success States
  const [verifyingPayment, setVerifyingPayment] = useState(Boolean(cfOrderId));
  const [paymentSuccessBanner, setPaymentSuccessBanner] = useState(
    searchParams.get("payment") === "success"
      ? { message: "Payment verified successfully! Your order is confirmed." }
      : null
  );

  // Manual Claim by Payment ID state (e.g. for past unlinked payments like 688991276)
  const [claimPaymentInput, setClaimPaymentInput] = useState("");
  const [claimingPayment, setClaimingPayment] = useState(false);

  // Guest Email Filter State if user is not logged in
  const [guestEmailInput, setGuestEmailInput] = useState("");
  const [guestEmailSubmitted, setGuestEmailSubmitted] = useState(() => {
    try {
      return localStorage.getItem("tuka_pending_email") || "";
    } catch (e) {
      return "";
    }
  });
  const [guestLoading, setGuestLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Modals state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [liveTracking, setLiveTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  // Cashfree auto-verification effect on return_url redirect
  useEffect(() => {
    if (!cfOrderId) return;
    let isMounted = true;

    const verify = async () => {
      setVerifyingPayment(true);
      setErrorMsg("");
      try {
        const res = await fetch(`/api/cashfree/verify-order?orderId=${encodeURIComponent(cfOrderId)}`);
        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.success && data.order) {
          if (clearCart) clearCart();
          try {
            localStorage.removeItem("tuka_pending_checkout");
          } catch (e) {}

          const confirmedOrder = { id: data.orderId || data.order.id, ...data.order };
          setActiveOrder(confirmedOrder);
          setOrders((prev) => {
            const without = prev.filter(
              (o) => o.id !== confirmedOrder.id && o.orderNumber !== confirmedOrder.orderNumber
            );
            return [confirmedOrder, ...without];
          });

          setPaymentSuccessBanner({
            paymentId: data.paymentId || confirmedOrder.paymentId,
            orderNumber: data.orderNumber || confirmedOrder.orderNumber,
            total: confirmedOrder.total
          });

          // Clean URL parameters while retaining order context
          setSearchParams(
            { orderNumber: data.orderNumber || confirmedOrder.orderNumber, payment: "success" },
            { replace: true }
          );
        } else {
          setErrorMsg(data.error || "Payment verification could not be confirmed automatically. Please check your bank status.");
        }
      } catch (err) {
        if (isMounted) {
          console.error("[OrderDetails] Cashfree verify error:", err);
          setErrorMsg("Could not verify payment with Cashfree. Please refresh or contact support.");
        }
      } finally {
        if (isMounted) setVerifyingPayment(false);
      }
    };

    verify();
    return () => {
      isMounted = false;
    };
  }, [cfOrderId]);

  // Claim Order by Payment ID (e.g. 688991276)
  const handleClaimPayment = async (e) => {
    e.preventDefault();
    const pid = claimPaymentInput.trim();
    if (!pid) return;

    setClaimingPayment(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/cashfree/verify-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "claim-payment",
          paymentId: pid,
          claimEmail: user?.email || guestEmailSubmitted || "customer@tuka.co.in"
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.order) {
        const ord = { id: data.orderId || data.order.id, ...data.order };
        setActiveOrder(ord);
        setOrders((prev) => [ord, ...prev.filter((o) => o.id !== ord.id)]);
        setPaymentSuccessBanner({
          paymentId: data.paymentId || pid,
          orderNumber: data.orderNumber || ord.orderNumber,
          total: ord.total
        });
        setClaimPaymentInput("");
        setSearchParams({ orderNumber: data.orderNumber || ord.orderNumber }, { replace: true });
      } else {
        setErrorMsg(data.error || "No order found for this payment reference ID.");
      }
    } catch (err) {
      setErrorMsg("Failed to claim payment. Please check your reference ID.");
    } finally {
      setClaimingPayment(false);
    }
  };

  const handleOpenTracking = async (orderToTrack) => {
    const target = orderToTrack || activeOrder;
    if (!target) return;
    setShowTrackingModal(true);
    setTrackingLoading(true);
    setTrackingError("");
    setLiveTracking(null);

    const awb = target.awbCode || target.trackingNumber || target.ithinkShipment?.waybill || "";
    const num = target.orderNumber || target.id || "";

    try {
      const res = await fetch(`/api/ithink/track?awb=${encodeURIComponent(awb)}&orderNumber=${encodeURIComponent(num)}`);
      const data = await res.json();
      setLiveTracking(data);
    } catch (err) {
      console.error("Live tracking fetch error:", err);
      setTrackingError("Failed to fetch live updates from courier network.");
    } finally {
      setTrackingLoading(false);
    }
  };

  // Fetch all orders for logged in user OR guest email
  useEffect(() => {
    let unsubUid = () => {};
    let unsubEmail = () => {};

    const fetchAllOrders = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        const emailToUse = (user?.email || guestEmailSubmitted || "").trim().toLowerCase();
        const orderMap = new Map();

        // 1. Direct Lookup by URL Order Identifier (orderNumber, id, cashfreeOrderId)
        if (selectedOrderNum) {
          try {
            const numClean = selectedOrderNum.trim();
            // Try by ID
            const directSnap = await getDoc(doc(db, "orders", numClean));
            if (directSnap.exists()) {
              orderMap.set(directSnap.id, { id: directSnap.id, ...directSnap.data() });
            }

            // Try by orderNumber
            const numQ = query(collection(db, "orders"), where("orderNumber", "==", numClean.toUpperCase()));
            const numSnap = await getDocs(numQ);
            numSnap.forEach((d) => orderMap.set(d.id, { id: d.id, ...d.data() }));

            // Try by cashfreeOrderId
            const cfQ = query(collection(db, "orders"), where("cashfreeOrderId", "==", numClean));
            const cfSnap = await getDocs(cfQ);
            cfSnap.forEach((d) => orderMap.set(d.id, { id: d.id, ...d.data() }));
          } catch (numErr) {
            console.warn("[OrderDetails] Direct order query warning:", numErr.message);
          }
        }

        // 2. Query by Authenticated User or Email
        const qUid = user?.uid ? query(collection(db, "orders"), where("userId", "==", user.uid)) : null;
        const qEmail = emailToUse ? query(collection(db, "orders"), where("customerEmail", "==", emailToUse)) : null;

        const promises = [];
        if (qUid) promises.push(getDocs(qUid));
        if (qEmail) promises.push(getDocs(qEmail));

        if (promises.length > 0) {
          const results = await Promise.all(promises);
          results.forEach((snap) => {
            snap.docs.forEach((d) => {
              orderMap.set(d.id, { id: d.id, ...d.data() });
            });
          });
        }

        const list = Array.from(orderMap.values());
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setOrders(list);

        if (list.length > 0) {
          if (selectedOrderNum) {
            const found = list.find(
              (o) => o.orderNumber?.toUpperCase() === selectedOrderNum.trim().toUpperCase() || o.id === selectedOrderNum || o.cashfreeOrderId === selectedOrderNum.trim()
            );
            setActiveOrder(found || list[0]);
          } else {
            setActiveOrder(list[0]);
          }
        } else {
          setActiveOrder(null);
          if (guestEmailSubmitted) {
            setErrorMsg(`No orders found associated with email: ${guestEmailSubmitted}`);
          }
        }
      } catch (err) {
        console.error("[OrderDetails] Fetch Error:", err);
        setErrorMsg(err.message || "Failed to load orders.");
      } finally {
        setLoading(false);
        setGuestLoading(false);
      }
    };

    fetchAllOrders();
  }, [user, guestEmailSubmitted, selectedOrderNum]);

  // Handle Order Select
  const handleSelectOrder = (ord) => {
    setActiveOrder(ord);
    setSearchParams({ orderNumber: ord.orderNumber || ord.id });
  };

  // Handle Guest Email Search
  const handleGuestEmailSubmit = (e) => {
    e.preventDefault();
    if (!guestEmailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmailInput.trim())) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setGuestLoading(true);
    setGuestEmailSubmitted(guestEmailInput.trim().toLowerCase());
  };

  // iThink Logistics Tracking URL
  const getTrackingUrl = () => {
    if (!activeOrder) return "https://ithinklogistics.trackshipment.in/";
    const awb = activeOrder.awbCode || activeOrder.trackingNumber || activeOrder.ithinkShipment?.waybill;
    if (activeOrder.trackingUrl) return activeOrder.trackingUrl;
    if (awb) return `https://ithinklogistics.trackshipment.in/${encodeURIComponent(awb)}`;
    return `https://ithinklogistics.trackshipment.in/`;
  };

  // Filtered orders list by search query (order number or product name)
  const filteredOrders = orders.filter((ord) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    const matchNum = (ord.orderNumber || ord.id || "").toLowerCase().includes(q);
    const matchItems = ord.items?.some((i) => (i.productName || i.name || "").toLowerCase().includes(q));
    return matchNum || matchItems;
  });

  const addr = activeOrder?.shippingAddress || {};
  const items = activeOrder?.items || [];
  const status = (activeOrder?.orderStatus || activeOrder?.status || "confirmed").toLowerCase();
  const paymentStatus = activeOrder?.paymentStatus || "Paid";

  return (
    <div className="min-h-screen bg-[#FDFAF5] font-sans text-[#161114] pb-24">
      
      {/* Breadcrumb Header */}
      <Breadcrumb
        title="My Orders & Tax Invoices"
        subtitle="Select any order to view itemized breakdown, download tax invoices, and track live iThink Logistics shipments."
        bgImage="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1600"
        links={[
          { name: "Home", href: "/" },
          { name: "Orders", href: "#", active: true }
        ]}
      />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Cashfree Payment Verification Loader */}
        {verifyingPayment && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-purple-50 border border-purple-200 rounded-3xl flex items-center justify-between gap-4 text-purple-900 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Loader2 size={24} className="animate-spin text-[#b13896] shrink-0" />
              <div>
                <h4 className="text-sm font-bold font-serif">Verifying Your Cashfree Payment...</h4>
                <p className="text-xs text-purple-700">Please wait a moment while our gateway confirms the transaction and updates your order records.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment Success Celebration Banner */}
        {paymentSuccessBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-emerald-900 shadow-md relative overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Payment Confirmed
                  </span>
                  {paymentSuccessBanner.paymentId && (
                    <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded border border-emerald-200">
                      Payment ID: {paymentSuccessBanner.paymentId}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-serif font-bold text-slate-900">
                  {paymentSuccessBanner.orderNumber ? `Order #${paymentSuccessBanner.orderNumber} successfully recorded!` : "Acquisition Completed Successfully!"}
                </h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Your handloom order has been stored in your account, manifested for dispatch, and notified to our master weavers.
                </p>
              </div>
            </div>
            <button
              onClick={() => setPaymentSuccessBanner(null)}
              className="self-end md:self-center p-2 text-emerald-600 hover:text-emerald-900 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}

        {/* Guest User Email Lookup Prompt (if not logged in) */}
        {!user && orders.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] p-8 border border-[#e5d5df]/80 shadow-xl max-w-xl mx-auto text-center space-y-6 mb-12"
          >
            <div className="w-16 h-16 rounded-full bg-[#b13896]/10 text-[#b13896] flex items-center justify-center mx-auto">
              <Mail size={28} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif text-[#161114]">Find Your Orders</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Sign in to your account or enter the email address used during checkout to view all your orders and download invoices.
              </p>
            </div>

            <form onSubmit={handleGuestEmailSubmit} className="space-y-3">
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="Enter checkout email address"
                  value={guestEmailInput}
                  onChange={(e) => setGuestEmailInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#F8F4EF]/60 border border-[#e5d5df] rounded-2xl text-xs outline-none focus:border-[#b13896]"
                />
              </div>
              <button
                type="submit"
                disabled={guestLoading}
                className="w-full py-3.5 bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {guestLoading ? <Clock size={16} className="animate-spin" /> : <Search size={16} />}
                <span>Fetch My Orders</span>
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 flex justify-center gap-4 text-xs font-bold text-slate-600">
              <span>Already have an account?</span>
              <Link to="/login" className="text-[#b13896] underline">
                Sign In
              </Link>
            </div>

            {errorMsg && <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>}
          </motion.div>
        )}

        {/* Main Orders Display Layout */}
        {(orders.length > 0 || loading) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ── LEFT COLUMN: ORDERS LIST SIDEBAR (4 COLS) ── */}
            <div className="lg:col-span-4 bg-white rounded-[32px] p-6 border border-[#e5d5df]/60 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <Package size={20} className="text-[#b13896]" />
                  <h2 className="font-serif text-xl text-[#161114]">Orders List</h2>
                </div>
                <span className="text-xs font-bold text-[#b13896] bg-[#b13896]/10 px-3 py-1 rounded-full border border-[#b13896]/20">
                  {orders.length} Order(s)
                </span>
              </div>

              {/* Quick Claim / Lookup by Payment ID (e.g. 688991276) */}
              <div className="p-4 rounded-2xl bg-[#F8F4EF] border border-[#e5d5df] space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  <ShieldCheck size={14} className="text-[#b13896]" />
                  <span>Find by Payment Ref ID</span>
                </div>
                <form onSubmit={handleClaimPayment} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Enter Ref ID e.g. 688991276"
                    value={claimPaymentInput}
                    onChange={(e) => setClaimPaymentInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e5d5df] rounded-xl text-xs outline-none focus:border-[#b13896]"
                  />
                  <button
                    type="submit"
                    disabled={claimingPayment}
                    className="w-full py-2 bg-[#b13896] hover:bg-[#972d7f] text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {claimingPayment ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                    <span>Find &amp; Link Order</span>
                  </button>
                </form>
              </div>

              {/* Filter / Search input inside list */}
              {orders.length > 3 && (
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by order # or item..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-[#F8F4EF]/60 border border-[#e5d5df] rounded-xl text-xs outline-none focus:border-[#b13896]"
                  />
                </div>
              )}

              {/* Orders List Items */}
              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {filteredOrders.map((ord) => {
                  const isSelected = activeOrder?.id === ord.id || activeOrder?.orderNumber === ord.orderNumber;
                  const itemPreview = ord.items?.[0];

                  return (
                    <div
                      key={ord.id}
                      onClick={() => handleSelectOrder(ord)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? "bg-white border-[#b13896] ring-2 ring-[#b13896]/20 shadow-md"
                          : "bg-[#F8F4EF]/40 border-[#e5d5df] hover:bg-white hover:border-[#b13896]/50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-900 block">
                            #{ord.orderNumber || ord.id.slice(0, 10).toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {ord.createdAt?.seconds ? new Date(ord.createdAt.seconds * 1000).toLocaleDateString("en-IN") : "Recent"}
                          </span>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-[#b13896] px-2 py-0.5 rounded border border-rose-100 block">
                            {ord.paymentStatus || "Paid"}
                          </span>
                          {ord.paymentId && (
                            <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 block">
                              Ref: {ord.paymentId}
                            </span>
                          )}
                        </div>
                      </div>

                      {itemPreview && (
                        <div className="flex items-center gap-3 pt-1">
                          <img
                            src={itemPreview.productImage || itemPreview.image || "https://images.unsplash.com/photo-1610030470298-40e1eaccf77d?auto=format&fit=crop&q=80&w=200"}
                            alt=""
                            className="w-10 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{itemPreview.productName || itemPreview.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {ord.items?.length || 1} item(s) • <strong className="text-[#b13896]">₹{Number(ord.total || 0).toLocaleString()}</strong>
                            </p>
                          </div>
                          <ChevronRight size={16} className={`transition-transform ${isSelected ? "text-[#b13896] translate-x-1" : "text-slate-300"}`} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── RIGHT COLUMN: ACTIVE ORDER COMPLETE DETAILS (8 COLS) ── */}
            <div className="lg:col-span-8 space-y-6">
              {activeOrder ? (
                <motion.div
                  key={activeOrder.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Order Ribbon Header */}
                  <div className="bg-[#161114] text-white rounded-[32px] p-6 sm:p-8 border border-[#b13896]/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#f4cfeb] bg-[#b13896]/30 px-3 py-1 rounded-full border border-[#b13896]/40">
                          VERIFIED ACQUISITION
                        </span>
                        <span className="text-xs text-white/50">
                          {activeOrder.createdAt?.seconds ? new Date(activeOrder.createdAt.seconds * 1000).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                        </span>
                      </div>

                      <h1 className="text-3xl font-serif text-white">
                        Order #{activeOrder.orderNumber || activeOrder.id}
                      </h1>
                      <p className="text-xs text-white/60">
                        Patron: <strong>{activeOrder.customerName}</strong> ({activeOrder.customerEmail})
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[11px] font-semibold text-white/80 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                          {activeOrder.paymentMethod || "Online Payment"}
                        </span>
                        {activeOrder.paymentId && (
                          <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            Ref ID: {activeOrder.paymentId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: Invoice & Shiprocket */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      <button
                        onClick={() => setShowInvoiceModal(true)}
                        className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-white/10 hover:bg-[#b13896] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-white/20 cursor-pointer shadow-md"
                      >
                        <FileText size={16} />
                        <span>Download Invoice</span>
                      </button>

                      <button
                        onClick={() => handleOpenTracking(activeOrder)}
                        className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                      >
                        <Truck size={16} />
                        <span>Track Shipment</span>
                      </button>
                    </div>
                  </div>

                  {/* Items Card */}
                  <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-[#e5d5df]/60 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                      <h3 className="font-serif text-xl text-[#161114]">Items Purchased ({items.length})</h3>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#b13896] bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                        Payment: {paymentStatus}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <div key={idx} className="py-4 flex items-center gap-4">
                          <img
                            src={item.productImage || item.image || "https://images.unsplash.com/photo-1610030470298-40e1eaccf77d?auto=format&fit=crop&q=80&w=300"}
                            alt={item.productName || item.name}
                            className="w-16 h-20 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-serif font-bold text-slate-900 truncate">
                              {item.productName || item.name}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                              {item.size && (
                                <span className="font-semibold text-[#b13896] bg-rose-50 px-2 py-0.5 rounded">
                                  Size: {item.size}
                                </span>
                              )}
                              {item.color && <span>Color: {item.color}</span>}
                              <span>Qty: <strong>{item.quantity || 1}</strong></span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Unit Price: ₹{Number(item.unitPrice || item.price || 0).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900">
                              ₹{Number(item.subtotal || ((item.unitPrice || item.price || 0) * (item.quantity || 1))).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary */}
                    <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold text-slate-900">₹{Number(activeOrder.subtotal || 0).toLocaleString()}</span>
                      </div>
                      {activeOrder.discount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>Privilege Discount</span>
                          <span>-₹{Number(activeOrder.discount).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Insured Shipping Dispatch</span>
                        <span className="text-emerald-600 font-semibold">Complimentary</span>
                      </div>
                      <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                        <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Total Acquisition Paid</span>
                        <span className="text-3xl font-serif text-[#b13896]">₹{Number(activeOrder.total || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Destination Atelier & Status Details */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-[32px] p-6 border border-[#e5d5df]/60 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#b13896]">
                          <MapPin size={16} />
                          <span>Destination Atelier</span>
                        </div>
                        {addr.addressType && (
                          <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {addr.addressType}
                          </span>
                        )}
                      </div>

                      <div className="text-xs space-y-1 leading-relaxed text-slate-700">
                        <p className="font-bold text-slate-900 text-sm">{activeOrder.customerName || addr.fullName}</p>
                        {addr.houseNumber && <p className="font-semibold text-slate-800">{addr.houseNumber}</p>}
                        <p>{addr.street || addr.address}</p>
                        {addr.locality && <p>{addr.locality}</p>}
                        {addr.landmark && <p className="text-slate-500 italic">Landmark: {addr.landmark}</p>}
                        <p>{addr.city}{addr.state ? `, ${addr.state}` : ''} - <strong>{addr.pincode}</strong></p>
                        <p className="text-slate-500 pt-1">Phone: {activeOrder.customerPhone || addr.phone}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-[32px] p-6 border border-[#e5d5df]/60 shadow-sm space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block">Dispatch Actions</span>
                        <p className="text-xs text-slate-500 leading-relaxed font-light">
                          Print an official GST tax invoice or view real-time courier checkpoints via iThink Logistics.
                        </p>
                      </div>

                      <div className="space-y-2 pt-2">
                        <button
                          onClick={() => { setShowInvoiceModal(true); setTimeout(() => window.print(), 400); }}
                          className="w-full py-3 px-4 rounded-xl bg-[#F8F4EF] hover:bg-[#e5d5df]/50 text-slate-900 text-xs font-bold uppercase tracking-wider flex items-center justify-between border border-[#e5d5df] cursor-pointer"
                        >
                          <span className="flex items-center gap-2"><Printer size={15} className="text-[#b13896]" /> Print Tax Invoice</span>
                          <Download size={14} />
                        </button>

                        <button
                          onClick={() => handleOpenTracking(activeOrder)}
                          className="w-full py-3 px-4 rounded-xl bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-between shadow-xs cursor-pointer"
                        >
                          <span className="flex items-center gap-2"><Truck size={15} /> Track via iThink Logistics</span>
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                </motion.div>
              ) : (
                <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200 shadow-sm space-y-4">
                  <ShoppingBag size={48} className="mx-auto text-slate-300" />
                  <h3 className="font-serif text-2xl text-slate-800">Select an Order</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Click any order from the list on the left to view complete details, items, address, and download invoices.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ── PRINTABLE / DOWNLOADABLE INVOICE MODAL ── */}
      <AnimatePresence>
        {showInvoiceModal && activeOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-10 max-w-3xl w-full shadow-2xl space-y-6 relative my-8 text-slate-900 print:p-0 print:shadow-none print:rounded-none">
              
              {/* Modal Control Header */}
              <div className="flex justify-between items-center border-b pb-4 print:hidden">
                <div className="flex items-center gap-2">
                  <Printer size={18} className="text-[#b13896]" />
                  <span className="font-bold text-sm uppercase tracking-wider">Official Tax Invoice Preview</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-[#b13896] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-[#972d7f]"
                  >
                    <Printer size={14} /> Print / Save PDF
                  </button>
                  <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-slate-700">
                    <X size={22} />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Container */}
              <div className="space-y-6 font-sans">
                <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                  <div>
                    <h1 className="text-2xl font-serif font-bold text-[#161114] tracking-wider">HOUSE OF TUKA</h1>
                    <p className="text-xs text-slate-500 mt-1">Authentic Bengal Handloom Heritage</p>
                    <p className="text-[11px] text-slate-400">Bengal Weaving Cluster, West Bengal, India</p>
                    <p className="text-[11px] text-slate-400">GSTIN: 19ABCDE1234F1Z5 | Support: hello@tuka.in</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded-lg inline-block">TAX INVOICE</span>
                    <p className="text-xs font-mono font-bold text-[#b13896] mt-2">#{activeOrder.orderNumber || activeOrder.id}</p>
                    <p className="text-xs text-slate-500">Date: {activeOrder.createdAt?.seconds ? new Date(activeOrder.createdAt.seconds * 1000).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-[#F8F4EF] p-5 rounded-2xl text-xs">
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[#b13896] block mb-1">Customer / Billed To:</span>
                    <p className="font-bold text-slate-900">{activeOrder.customerName}</p>
                    <p>{activeOrder.customerEmail}</p>
                    <p>Phone: {activeOrder.customerPhone}</p>
                  </div>
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[#b13896] block mb-1">Shipping Destination ({addr.addressType || 'Home'}):</span>
                    <p>{addr.houseNumber ? `${addr.houseNumber}, ` : ''}{addr.street || addr.address}</p>
                    <p>{addr.locality ? `${addr.locality}, ` : ''}{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p>Payment: {activeOrder.paymentMethod} ({paymentStatus})</p>
                  </div>
                </div>

                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-slate-700">
                      <th className="py-2.5 font-bold uppercase">Item Description</th>
                      <th className="py-2.5 font-bold uppercase text-center">Variant</th>
                      <th className="py-2.5 font-bold uppercase text-center">Qty</th>
                      <th className="py-2.5 font-bold uppercase text-right">Unit Price</th>
                      <th className="py-2.5 font-bold uppercase text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 font-semibold text-slate-900">{item.productName || item.name}</td>
                        <td className="py-3 text-center">{item.size || '-'}</td>
                        <td className="py-3 text-center">{item.quantity || 1}</td>
                        <td className="py-3 text-right">₹{Number(item.unitPrice || item.price || 0).toLocaleString()}</td>
                        <td className="py-3 text-right font-bold">₹{Number(item.subtotal || ((item.unitPrice || item.price || 0) * (item.quantity || 1))).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <div className="w-64 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subtotal:</span>
                      <span className="font-semibold">₹{Number(activeOrder.subtotal || 0).toLocaleString()}</span>
                    </div>
                    {activeOrder.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount:</span>
                        <span>-₹{Number(activeOrder.discount).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600">Shipping &amp; Handling:</span>
                      <span className="text-emerald-600 font-semibold">FREE</span>
                    </div>
                    <div className="pt-2 border-t border-slate-900 flex justify-between font-bold text-sm text-[#161114]">
                      <span>Grand Total:</span>
                      <span className="text-[#b13896]">₹{Number(activeOrder.total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400 leading-relaxed">
                  Thank you for supporting traditional Bengal hereditary weavers. This is an official computer-generated tax invoice.
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ITHINK LOGISTICS LIVE TRACKING MODAL ── */}
      <AnimatePresence>
        {showTrackingModal && activeOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#b13896]/10 text-[#b13896] flex items-center justify-center">
                    <Truck size={22} />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-slate-900">iThink Logistics Live Tracker</h3>
                    <p className="text-xs text-slate-400">Real-Time Courier Transit &amp; Checkpoints</p>
                  </div>
                </div>
                <button onClick={() => setShowTrackingModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                  <X size={20} />
                </button>
              </div>

              {trackingLoading ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-8 h-8 border-3 border-[#b13896]/20 border-t-[#b13896] rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Contacting iThink Logistics courier network...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-500 uppercase block text-[10px] tracking-wider">Courier Status</span>
                      <span className="font-bold text-[#b13896] text-sm">
                        {liveTracking?.currentStatus || (activeOrder.awbCode ? "Manifest Generated" : "Preparing Shipment")}
                      </span>
                    </div>
                    <div className="sm:text-right">
                      <span className="font-bold text-slate-500 uppercase block text-[10px] tracking-wider">Courier Partner</span>
                      <span className="font-semibold text-slate-900">
                        {liveTracking?.courier || activeOrder.courierName || "iThink Express (Delhivery/Partner)"}
                      </span>
                    </div>
                  </div>

                  {/* Waybill / AWB & Expected Delivery */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">AWB Tracking Code</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {liveTracking?.awb || activeOrder.awbCode || activeOrder.trackingNumber || activeOrder.orderNumber}
                      </span>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Expected Delivery</span>
                      <span className="font-semibold text-slate-900 text-xs">
                        {liveTracking?.expectedDeliveryDate
                          ? new Date(liveTracking.expectedDeliveryDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                          : "3 to 5 Business Days"}
                      </span>
                    </div>
                  </div>

                  {trackingError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                      {trackingError}
                    </div>
                  )}

                  {/* Checkpoints Timeline */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Live Transit Checkpoints
                    </span>

                    {Array.isArray(liveTracking?.scans) && liveTracking.scans.length > 0 ? (
                      <div className="space-y-3 border-l-2 border-[#b13896]/30 ml-3 pl-4">
                        {liveTracking.scans.map((scan, i) => (
                          <div key={i} className="relative text-xs space-y-0.5">
                            <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-[#b13896] border-2 border-white shadow-xs" />
                            <div className="flex justify-between items-baseline">
                              <p className="font-bold text-slate-900">{scan.status || "Checkpoint Scan"}</p>
                              {scan.dateTime && (
                                <span className="text-[10px] text-slate-400">
                                  {new Date(scan.dateTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              )}
                            </div>
                            {scan.location && (
                              <p className="text-[11px] text-slate-600 font-medium">
                                Location: {scan.location}
                              </p>
                            )}
                            {scan.remark && (
                              <p className="text-[10px] text-slate-400 italic">
                                {scan.remark}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3 pt-1">
                        {[
                          { label: "Order Received & Verified", time: "Completed", done: true },
                          { label: "Manifest Generated in iThink Logistics", time: activeOrder.awbCode ? "Manifest Ready" : "In Progress", done: true },
                          { label: "Courier Pickup from Hub (Bengal)", time: "Pending Pickup", done: ['shipped', 'out_for_delivery', 'delivered'].includes(status) },
                          { label: "In Transit via National Air/Surface", time: "Regional Sorting", done: ['shipped', 'out_for_delivery', 'delivered'].includes(status) },
                          { label: "Out for Doorstep Delivery", time: "Destination Hub", done: ['out_for_delivery', 'delivered'].includes(status) },
                          { label: "Delivered to Customer", time: "Final Delivery", done: status === 'delivered' }
                        ].map((step, i) => (
                          <div key={i} className="flex items-center gap-3 text-xs">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                              step.done ? "bg-[#b13896] text-white" : "bg-slate-100 text-slate-300"
                            }`}>
                              <CheckCircle2 size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold ${step.done ? "text-slate-900" : "text-slate-400"}`}>{step.label}</p>
                              <p className="text-[10px] text-slate-400">{step.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <a
                  href={liveTracking?.trackingUrl || getTrackingUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3.5 bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Open iThink Tracking Portal</span>
                  <ExternalLink size={14} />
                </a>

                {(activeOrder.awbCode || liveTracking?.awb) && (
                  <button
                    onClick={async () => {
                      const code = liveTracking?.awb || activeOrder.awbCode;
                      try {
                        const res = await fetch(`/api/ithink/shipping-label?awb=${encodeURIComponent(code)}`);
                        const lData = await res.json();
                        if (lData?.data || lData?.file_url || lData?.pdf_url) {
                          window.open(lData.data || lData.file_url || lData.pdf_url, '_blank');
                        } else {
                          window.open(`https://ithinklogistics.trackshipment.in/${code}`, '_blank');
                        }
                      } catch (e) {
                        window.open(`https://ithinklogistics.trackshipment.in/${code}`, '_blank');
                      }
                    }}
                    className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Shipping Label</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default OrderDetails;
