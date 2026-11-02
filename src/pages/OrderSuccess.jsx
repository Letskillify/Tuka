import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { db } from "../components/Firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../components/useAuth";
import { CheckCircle, Package, ArrowRight, ShieldCheck, ShieldAlert, Mail, MapPin, Truck, ShoppingBag, Clock, Copy, Check, Lock, ExternalLink, LogIn, User } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { motion } from "framer-motion";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [copiedLink, setCopiedLink] = useState(false);
  const [accessRestricted, setAccessRestricted] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get("orderId") || location.state?.orderId;
  const orderNumber = queryParams.get("orderNumber") || order?.orderNumber;

  useEffect(() => {
    const targetKey = (orderNumber || orderId || "").toUpperCase();
    if (!user && targetKey) {
      const isPurchasedDevice = (
        typeof window !== "undefined" &&
        (sessionStorage.getItem("tuka_purchased_device_sig_" + targetKey) === "active" ||
         (orderId && sessionStorage.getItem("tuka_purchased_device_sig_" + orderId) === "active") ||
         localStorage.getItem("tuka_purchased_device_sig_" + targetKey) === "active" ||
         (orderId && localStorage.getItem("tuka_purchased_device_sig_" + orderId) === "active"))
      );
      const hasViewed = (
        typeof window !== "undefined" &&
        (sessionStorage.getItem("tuka_order_success_viewed_" + targetKey) === "true" ||
         (orderId && sessionStorage.getItem("tuka_order_success_viewed_" + orderId) === "true"))
      );
      const hasToken = (
        typeof window !== "undefined" &&
        (sessionStorage.getItem("tuka_single_view_token_" + targetKey) === "allowed" ||
         (orderId && sessionStorage.getItem("tuka_single_view_token_" + orderId) === "allowed"))
      );

      if ((location.state?.order || hasToken) && isPurchasedDevice && !hasViewed) {
        try {
          sessionStorage.setItem("tuka_order_success_viewed_" + targetKey, "true");
          if (orderId) sessionStorage.setItem("tuka_order_success_viewed_" + orderId, "true");
          sessionStorage.removeItem("tuka_single_view_token_" + targetKey);
          if (orderId) sessionStorage.removeItem("tuka_single_view_token_" + orderId);
          localStorage.removeItem("tuka_purchased_device_sig_" + targetKey);
          if (orderId) localStorage.removeItem("tuka_purchased_device_sig_" + orderId);
        } catch (e) {}
      } else if (hasViewed) {
        setAccessRestricted("refreshed");
        setLoading(false);
        setOrder(null);
        return;
      } else if (!isPurchasedDevice || !hasToken) {
        setAccessRestricted("unauthorized_device");
        setLoading(false);
        setOrder(null);
        return;
      }
    }

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
  }, [orderId, order, user]);

  if (accessRestricted) {
    const cachedEmail = (() => {
      try {
        return localStorage.getItem("tuka_pending_email") || "";
      } catch (e) {
        return "";
      }
    })();
    const finalOrderNumber = orderNumber || orderId || "ORDER";
    const ordersRedirectUrl = `/orders?orderNumber=${encodeURIComponent(finalOrderNumber)}`;
    const loginUrl = `/login?email=${encodeURIComponent(cachedEmail)}&redirect=${encodeURIComponent(ordersRedirectUrl)}`;

    return (
      <div className="min-h-screen bg-[#FDFAF5] font-sans text-[#161114] pb-24">
        <Breadcrumb
          title="Order Access Restricted"
          subtitle="Protected Single-Device Order View"
          links={[
            { name: "Home", href: "/" },
            { name: "Orders", href: "/orders" }
          ]}
        />
        <div className="max-w-[700px] mx-auto px-6 pt-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] p-8 sm:p-10 border border-[#e5d5df] shadow-2xl text-center space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-[#b13896] to-rose-500" />
            <div className="w-16 h-16 rounded-full bg-rose-50 text-[#b13896] border border-[#e5d5df] flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert size={32} />
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#b13896] bg-[#b13896]/10 px-3 py-1 rounded-full border border-[#b13896]/20">
                {accessRestricted === "refreshed" ? "Single-Use View Expired" : "Protected Single-Device Order"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-[#161114]">
                {accessRestricted === "refreshed" ? "Confirmation Link Expired After Refresh" : "Device Access Restricted"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                {accessRestricted === "refreshed"
                  ? "For your security, this confirmation view was visible only once on this device and has expired after page refresh. Please log in to view complete order history, track shipments, and download invoices."
                  : "This order confirmation is bound to the single device where it was purchased. It cannot be opened on another device. To view your order on this device, please log in with your email address."}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={loginUrl}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn size={16} />
                <span>Login to View Orders</span>
              </Link>
              <Link
                to="/shop"
                className="w-full sm:w-auto px-6 py-3.5 bg-[#F8F4EF] hover:bg-[#ebdbe6] text-[#161114] text-xs font-bold uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#e5d5df]"
              >
                <ShoppingBag size={15} />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

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

  const checkoutEmail =
    order?.customerEmail ||
    order?.shippingAddress?.email ||
    order?.email ||
    location.state?.order?.customerEmail ||
    location.state?.customerEmail ||
    (() => {
      try {
        return localStorage.getItem("tuka_pending_email") || "";
      } catch (e) {
        return "";
      }
    })();

  const ordersRedirectUrl = `/orders?orderNumber=${encodeURIComponent(finalOrderNumber)}`;
  const loginUrl = `/login?email=${encodeURIComponent(checkoutEmail)}&redirect=${encodeURIComponent(ordersRedirectUrl)}`;
  const signupUrl = `/signup?email=${encodeURIComponent(checkoutEmail)}&redirect=${encodeURIComponent(ordersRedirectUrl)}`;

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
              <span>Email sent to: <strong>{checkoutEmail || order?.customerEmail || "your email"}</strong></span>
            </div>
          </div>

          {!user && (
            <div className="pt-4 border-t border-slate-100 max-w-xl mx-auto">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FDFAF5] border border-[#e5d5df] flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Track &amp; View Your Orders</p>
                  <p className="text-[11px] text-slate-500 font-light">
                    Log in with your checkout email to view itemized records, invoices, and live tracking.
                  </p>
                </div>
                <Link
                  to={loginUrl}
                  className="shrink-0 px-5 py-2.5 rounded-xl bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <LogIn size={15} />
                  <span>Login to View Orders</span>
                </Link>
              </div>
            </div>
          )}
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
                  "You checked out as a guest. Log in to your account with this email to view all your orders, track shipments in real time, and download invoices."
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
                <div className="space-y-2.5">
                  <Link
                    to={loginUrl}
                    className="w-full py-3.5 rounded-xl bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <LogIn size={15} /> Login to View Orders
                  </Link>
                  <Link
                    to={signupUrl}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-white/20"
                  >
                    New here? Create Account <ArrowRight size={14} />
                  </Link>
                </div>
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
