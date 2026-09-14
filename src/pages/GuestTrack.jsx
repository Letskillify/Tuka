import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Package, ShieldCheck, Truck, CheckCircle2, Clock, MapPin, Mail, Search, ArrowRight, ShoppingBag, Lock, Sparkles } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { motion } from "framer-motion";

const GuestTrack = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrderNumber = searchParams.get("orderNumber") || "";
  const initialToken = searchParams.get("token") || "";

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [accessToken, setAccessToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [order, setOrder] = useState(null);

  const fetchGuestOrder = async (num, tok) => {
    if (!num || !tok) {
      setErrorMessage("Please enter both your Order Number and Security Access Token.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/orders/track-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: num.trim().toUpperCase(),
          accessToken: tok.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Order tracking failed.");
      }

      setOrder(data.order);
    } catch (err) {
      console.error("[GuestTrack] Fetch Error:", err);
      setErrorMessage(err.message || "Failed to retrieve order. Please check your credentials.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber && initialToken) {
      fetchGuestOrder(initialOrderNumber, initialToken);
    }
  }, [initialOrderNumber, initialToken]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ orderNumber, token: accessToken });
    fetchGuestOrder(orderNumber, accessToken);
  };

  const addr = order?.shippingAddress || {};

  return (
    <div className="min-h-screen bg-[#FDFAF5] font-sans text-[#161114] pb-24">
      <Breadcrumb
        title="Guest Order Concierge"
        subtitle="Track your luxury handloom acquisition using your private security credentials."
        bgImage="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1600"
        links={[
          { name: "Home", href: "/" },
          { name: "Track Guest Order", href: "#", active: true }
        ]}
      />

      <div className="max-w-[1100px] mx-auto px-6 pt-10">
        
        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-8 border border-[#e5d5df]/60 shadow-xl mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#b13896]/10 text-[#b13896] flex items-center justify-center">
              <Lock size={18} />
            </div>
            <div>
              <h2 className="text-xl font-serif text-[#161114]">Secure Access Verification</h2>
              <p className="text-xs text-slate-400">Enter the credentials sent in your order confirmation email</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Order Reference Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. ORD-AB1234"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full bg-[#F8F4EF]/60 border border-[#e5d5df] rounded-2xl px-4 py-3.5 text-xs text-slate-900 font-mono font-bold outline-none focus:border-[#b13896] transition-all"
              />
            </div>
            <div className="md:col-span-5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Security Access Token *</label>
              <input
                type="text"
                required
                placeholder="Paste token from order email link"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full bg-[#F8F4EF]/60 border border-[#e5d5df] rounded-2xl px-4 py-3.5 text-xs text-slate-900 font-mono outline-none focus:border-[#b13896] transition-all"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Clock size={16} className="animate-spin" /> : <Search size={16} />}
                <span>Track</span>
              </button>
            </div>
          </form>

          {errorMessage && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <span>{errorMessage}</span>
            </div>
          )}
        </motion.div>

        {/* Order Details View */}
        {order && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* Status Header */}
            <div className="bg-[#161114] text-white rounded-[32px] p-8 border border-[#b13896]/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#f4cfeb]">VERIFIED GUEST ORDER</span>
                <h1 className="text-3xl font-serif text-white">Order #{order.orderNumber}</h1>
                <p className="text-xs text-white/60">
                  Customer: <strong>{order.customerName}</strong> ({order.customerEmail})
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-4 py-1.5 rounded-full bg-[#b13896] text-white font-bold text-xs uppercase tracking-wider shadow-md">
                  Status: {order.orderStatus}
                </span>
                <span className="text-[11px] text-white/50">Payment: {order.paymentStatus} ({order.paymentMethod})</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              
              {/* Items Card */}
              <div className="lg:col-span-8 bg-white rounded-[32px] p-8 border border-[#e5d5df]/60 shadow-sm space-y-6">
                <h3 className="font-serif text-xl text-[#161114]">Acquisition Breakdown</h3>

                <div className="divide-y divide-slate-100">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="py-4 flex items-center gap-4">
                      <img
                        src={item.productImage || "https://images.unsplash.com/photo-1610030470298-40e1eaccf77d?auto=format&fit=crop&q=80&w=300"}
                        alt={item.productName}
                        className="w-16 h-20 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-serif font-bold text-slate-900 truncate">{item.productName}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          {item.size && (
                            <span className="font-semibold text-[#b13896] bg-rose-50 px-2 py-0.5 rounded">
                              Size: {item.size}
                            </span>
                          )}
                          <span>Qty: <strong>{item.quantity}</strong></span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900">
                          ₹{Number(item.subtotal || (item.unitPrice * item.quantity)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-800">₹{Number(order.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount</span>
                      <span>-₹{Number(order.discount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-emerald-600 font-semibold">Complimentary</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Total</span>
                    <span className="text-2xl font-serif text-[#b13896]">₹{Number(order.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address & Sync Account */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Destination Atelier */}
                <div className="bg-white rounded-[32px] p-6 border border-[#e5d5df]/60 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#b13896]">
                    <MapPin size={16} />
                    <span>Destination Atelier</span>
                  </div>
                  <div className="text-xs space-y-1 leading-relaxed text-slate-700">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-slate-900 text-sm">{addr.fullName || order.customerName}</p>
                      {addr.addressType && (
                        <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {addr.addressType}
                        </span>
                      )}
                    </div>
                    {addr.houseNumber && <p className="font-semibold text-slate-800">{addr.houseNumber}</p>}
                    <p>{addr.street || addr.address}</p>
                    {addr.locality && <p>{addr.locality}</p>}
                    {addr.landmark && <p className="text-slate-500 italic">Landmark: {addr.landmark}</p>}
                    <p>{addr.city}{addr.state ? `, ${addr.state}` : ''} - <strong>{addr.pincode}</strong></p>
                    <p className="text-slate-500 pt-1">Phone: {order.customerPhone || addr.phone}</p>
                    {addr.altPhone && <p className="text-slate-400">Alt Phone: {addr.altPhone}</p>}
                  </div>
                </div>

                {/* Account Sync Card */}
                <div className="bg-[#b13896] text-white rounded-[32px] p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/90">
                    <Sparkles size={16} />
                    <span>Sync to Account</span>
                  </div>
                  <p className="text-xs text-white/80 font-light leading-relaxed">
                    Create an account with <strong>{order.customerEmail}</strong> to link this guest order automatically to your personal account profile.
                  </p>
                  <Link
                    to={`/signup?email=${encodeURIComponent(order.customerEmail)}`}
                    className="w-full py-3.5 rounded-2xl bg-white text-[#b13896] hover:bg-[#161114] hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    Create Account &amp; Sync <ArrowRight size={15} />
                  </Link>
                </div>

              </div>

            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default GuestTrack;
