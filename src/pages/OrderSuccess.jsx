import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { db } from "../components/Firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../components/useAuth";
import { CheckCircle, Package, ArrowRight, ShieldCheck, Mail, MapPin, Truck, ShoppingBag, Clock, Copy, Check, Lock, ExternalLink } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { motion } from "framer-motion";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [copiedLink, setCopiedLink] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get("orderId") || location.state?.orderId;
  const orderNumber = queryParams.get("orderNumber") || order?.orderNumber;

  useEffect(() => {
    if (order) {
      setLoading(false);
      return;
    }
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const oSnap = await getDoc(doc(db, "orders", orderId));
        if (oSnap.exists()) {
          setOrder({ id: oSnap.id, ...oSnap.data() });
        }
      } catch (err) {
        console.error("Order fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#161114] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-[#b13896] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-[0.3em] text-[#f4cfeb] font-bold">Verifying Order Details...</p>
      </div>
    );
  }

  const finalOrderNumber = order?.orderNumber || orderNumber || "ORD-SUCCESS";
  const items = order?.items || [];
  const addr = order?.shippingAddress || {};
  const guestToken = order?.guestAccessToken;
  const guestTrackUrl = guestToken ? `${window.location.origin}/track-guest?orderNumber=${encodeURIComponent(finalOrderNumber)}&token=${encodeURIComponent(guestToken)}` : null;

  const handleCopyTrackLink = () => {
    if (!guestTrackUrl) return;
    navigator.clipboard.writeText(guestTrackUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#FDFAF5] font-sans text-[#161114] pb-24">
      <Breadcrumb
        title="Order Confirmation"
        subtitle={`Order #${finalOrderNumber} successfully received`}
        bgImage="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1600"
        links={[
          { name: "Home", href: "/" },
          { name: "Checkout", href: "/checkout" },
          { name: "Success", href: "#", active: true }
        ]}
      />

      <div className="max-w-[1100px] mx-auto px-6 pt-10">
        
        {/* Celebration Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[32px] p-8 md:p-12 border border-[#e5d5df]/60 shadow-xl text-center space-y-6 relative overflow-hidden mb-12"
        >
          <div className="w-20 h-20 rounded-full bg-[#b13896]/10 text-[#b13896] flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle size={44} strokeWidth={1.5} />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#b13896]">
              CONGRATULATIONS &amp; THANK YOU
            </span>
            <h1 className="text-3xl md:text-5xl font-serif text-[#161114]">
              Your Handloom Acquisition is <span className="italic font-light text-[#b13896]">Confirmed</span>
            </h1>
            <p className="text-sm text-slate-500 max-w-xl mx-auto font-light leading-relaxed">
              We have received your order. Master hereditary weavers in Bengal have been notified to assemble and inspect your handwoven drape.
            </p>
          </div>

          {/* Reference Pill */}
          <div className="inline-flex items-center gap-4 bg-[#161114] text-white px-6 py-3.5 rounded-full shadow-lg">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Order Number</span>
            <span className="font-mono text-base font-bold text-[#f4cfeb]">#{finalOrderNumber}</span>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 border-t border-slate-100 max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-[#b13896]" />
              <span>Email sent to: <strong>{order?.customerEmail || "your email"}</strong></span>
            </div>
          </div>
        </motion.div>

        {/* Order Details Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Items & Summary */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Purchased Items Card */}
            <div className="bg-white rounded-[28px] p-6 md:p-8 border border-[#e5d5df]/40 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-serif text-xl text-[#161114]">Purchased Items ({items.length})</h3>
                <span className="text-xs font-bold uppercase tracking-wider text-[#b13896] bg-[#b13896]/10 px-3 py-1 rounded-full">
                  {order?.paymentStatus || "Confirmed"}
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
                        <span>Qty: <strong>{item.quantity || 1}</strong></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900">
                        ₹{Number(item.subtotal || (item.unitPrice * item.quantity) || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">₹{Number(order?.subtotal || 0).toLocaleString()}</span>
                </div>
                {order?.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount Code Applied</span>
                    <span>-₹{Number(order.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping &amp; Handling</span>
                  <span className="text-emerald-600 font-semibold">Complimentary</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Total Paid</span>
                  <span className="text-2xl font-serif text-[#b13896]">₹{Number(order?.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Destination Atelier & Actions */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Delivery Address Card */}
            <div className="bg-white rounded-[28px] p-6 border border-[#e5d5df]/40 shadow-sm space-y-4">
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
                <p className="font-bold text-slate-900 text-sm">{order?.customerName || addr.fullName}</p>
                {addr.houseNumber && <p className="font-semibold text-slate-800">{addr.houseNumber}</p>}
                <p>{addr.street || addr.address}</p>
                {addr.locality && <p>{addr.locality}</p>}
                {addr.landmark && <p className="text-slate-500 italic">Landmark: {addr.landmark}</p>}
                <p>{addr.city}{addr.state ? `, ${addr.state}` : ''} - <strong>{addr.pincode}</strong></p>
                <p className="text-slate-500 pt-1">Phone: {order?.customerPhone || addr.phone}</p>
                {addr.altPhone && <p className="text-slate-400">Alt Phone: {addr.altPhone}</p>}
              </div>
            </div>

            {/* Guest Order Security Card */}
            {guestTrackUrl && (
              <div className="bg-white rounded-[28px] p-6 border border-[#b13896]/30 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#b13896]">
                  <Lock size={15} />
                  <span>Guest Order Access Token</span>
                </div>
                <p className="text-xs text-slate-500 font-light leading-relaxed">
                  Bookmark or copy your private guest tracking link to monitor delivery status without logging in:
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleCopyTrackLink}
                    className="flex-1 py-2.5 px-3 bg-[#F8F4EF] hover:bg-[#e5d5df]/40 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-[#e5d5df]"
                  >
                    {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedLink ? "Link Copied!" : "Copy Guest Link"}</span>
                  </button>
                  <Link
                    to={`/track-guest?orderNumber=${encodeURIComponent(finalOrderNumber)}&token=${encodeURIComponent(guestToken)}`}
                    target="_blank"
                    className="py-2.5 px-3 bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold rounded-xl flex items-center justify-center transition-all shadow-sm"
                  >
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            )}

            {/* Account CTA */}
            <div className="bg-[#161114] text-white rounded-[28px] p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#f4cfeb]">
                <ShieldCheck size={16} />
                <span>Order Status &amp; Tracking</span>
              </div>
              <p className="text-xs text-white/70 font-light leading-relaxed">
                {user ? (
                  "You can view live status updates, download invoices, and manage your delivery anytime in your account."
                ) : (
                  "You checked out as a guest. Create an account with your email to automatically sync and track all your orders."
                )}
              </p>

              {user ? (
                <Link
                  to="/account?tab=orders"
                  className="w-full py-3 rounded-xl bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Package size={15} /> View My Orders
                </Link>
              ) : (
                <Link
                  to={`/signup?email=${encodeURIComponent(order?.customerEmail || "")}`}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-[#b13896] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-white/20"
                >
                  Create Account to Sync <ArrowRight size={15} />
                </Link>
              )}
            </div>

            <Link
              to="/shop"
              className="w-full py-3.5 rounded-2xl bg-white border border-[#e5d5df] hover:border-[#b13896] text-slate-800 hover:text-[#b13896] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <ShoppingBag size={15} /> Return to Shop
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
};

export default OrderSuccess;
