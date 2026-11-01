import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Eye,
  Download,
  CreditCard,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Printer,
  X,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Check,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../../components/Firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

// Status configuration options
export const ORDER_STATUSES = [
  { value: "confirmed", label: "Confirmed", icon: CheckCircle2, color: "blue", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "processing", label: "Processing", icon: Clock, color: "indigo", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "packed", label: "Packed", icon: Package, color: "amber", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "shipped", label: "Shipped", icon: Truck, color: "sky", bg: "bg-sky-50 text-sky-700 border-sky-200" },
  { value: "delivered", label: "Delivered", icon: CheckCircle2, color: "emerald", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "cancelled", label: "Cancelled", icon: XCircle, color: "rose", bg: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "returned", label: "Returned", icon: RotateCcw, color: "slate", bg: "bg-slate-100 text-slate-700 border-slate-200" }
];

export const PAYMENT_STATUSES = [
  { value: "Paid", label: "Paid", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  { value: "Pending", label: "Pending", bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  { value: "Failed", label: "Failed", bg: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  { value: "Refunded", label: "Refunded", bg: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" }
];

export const getOrderStatusBadge = (rawStatus) => {
  const norm = String(rawStatus || "confirmed").toLowerCase().trim();
  const matched = ORDER_STATUSES.find((s) => s.value === norm || s.label.toLowerCase() === norm);
  return matched || { value: norm, label: rawStatus || "Confirmed", bg: "bg-slate-100 text-slate-700 border-slate-200" };
};

export const getPaymentStatusBadge = (rawStatus) => {
  const norm = String(rawStatus || "Pending").trim();
  const matched = PAYMENT_STATUSES.find((s) => s.value.toLowerCase() === norm.toLowerCase());
  return matched || { value: norm, label: rawStatus || "Pending", bg: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" };
};

const formatDate = (val) => {
  if (!val) return "Recent";
  const date = val?.seconds ? new Date(val.seconds * 1000) : new Date(val);
  if (Number.isNaN(date.getTime())) return "Recent";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const OrdersTable = ({ orders = [], isDarkMode = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Tracking form states inside modal
  const [trackingCourier, setTrackingCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [isBookingIThink, setIsBookingIThink] = useState(false);

  // Cashfree Payment Sync state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncRefInput, setSyncRefInput] = useState("");
  const [syncAmountInput, setSyncAmountInput] = useState("1.00");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncCashfreePayment = async (e) => {
    e.preventDefault();
    const pid = syncRefInput.trim();
    if (!pid) return;

    setIsSyncing(true);
    try {
      const res = await fetch("/api/cashfree/verify-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "claim-payment",
          paymentId: pid,
          claimAmount: Number(syncAmountInput) || 1,
          customerName: "Patron (Cashfree Online)",
          customerPhone: "9999999999"
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage(`Payment ${pid} successfully synced! Order #${data.orderNumber} recorded.`);
        setShowSyncModal(false);
        setSyncRefInput("");
      } else {
        setToastMessage(data.error || "Failed to sync payment.");
      }
    } catch (err) {
      setToastMessage("Error communicating with Cashfree verify endpoint.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Open modal with order data initialized
  const handleOpenOrderModal = (order) => {
    setSelectedOrder(order);
    setTrackingCourier(order.courierName || order.shippingCarrier || "iThink Express");
    setTrackingNumber(order.trackingNumber || order.awbNumber || order.awbCode || "");
    setTrackingUrl(order.trackingUrl || "");
  };

  const handleBookIThinkShipment = async (order) => {
    if (!order) return;
    setIsBookingIThink(true);
    try {
      const res = await fetch("/api/ithink/create-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, order })
      });
      const data = await res.json();
      if (data.success && data.waybill) {
        setTrackingNumber(data.waybill);
        setTrackingCourier(data.logisticName || "iThink Express Courier");
        setTrackingUrl(data.trackingUrl || `https://ithinklogistics.trackshipment.in/${data.waybill}`);
        showToast(`Dispatched via iThink Logistics! AWB: ${data.waybill}`);
      } else {
        showToast(data.error || "iThink booking notice: Awaiting manifest approval.");
      }
    } catch (e) {
      showToast("Failed to book iThink shipment: " + e.message);
    } finally {
      setIsBookingIThink(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ─── Update Order Status ──────────────────────────────────────────────
  const handleUpdateOrderStatus = async (order, newStatus) => {
    setUpdatingId(order.id);
    try {
      const orderRef = doc(db, "orders", order.id);
      const updateData = {
        orderStatus: newStatus.toLowerCase(),
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      await updateDoc(orderRef, updateData);

      // If user ID exists, update customer's subcollection order document
      if (order.userId) {
        try {
          const userOrderRef = doc(db, "users", order.userId, "orders", order.id);
          await updateDoc(userOrderRef, updateData);
        } catch (e) {
          // non-blocking
        }
      }

      // Update active modal order state if open
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder((prev) => ({
          ...prev,
          orderStatus: newStatus.toLowerCase(),
          status: newStatus
        }));
      }

      showToast(`Order #${order.orderNumber || order.id.slice(0, 8)} status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update status. Please check permissions.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── Update Payment Status ───────────────────────────────────────────
  const handleUpdatePaymentStatus = async (order, newPaymentStatus) => {
    setUpdatingId(order.id);
    try {
      const orderRef = doc(db, "orders", order.id);
      const updateData = {
        paymentStatus: newPaymentStatus,
        updatedAt: serverTimestamp()
      };

      await updateDoc(orderRef, updateData);

      if (order.userId) {
        try {
          const userOrderRef = doc(db, "users", order.userId, "orders", order.id);
          await updateDoc(userOrderRef, updateData);
        } catch (e) {}
      }

      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder((prev) => ({
          ...prev,
          paymentStatus: newPaymentStatus
        }));
      }

      showToast(`Payment status updated to ${newPaymentStatus}`);
    } catch (err) {
      console.error("Error updating payment status:", err);
      alert("Failed to update payment status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── Save Tracking Information ───────────────────────────────────────
  const handleSaveTracking = async () => {
    if (!selectedOrder) return;
    setIsSavingTracking(true);
    try {
      const orderRef = doc(db, "orders", selectedOrder.id);
      const updateData = {
        courierName: trackingCourier,
        shippingCarrier: trackingCourier,
        trackingNumber: trackingNumber.trim(),
        awbNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim(),
        updatedAt: serverTimestamp()
      };

      // Automatically set order status to "shipped" if tracking number is added
      if (trackingNumber.trim() && selectedOrder.orderStatus !== "delivered") {
        updateData.orderStatus = "shipped";
        updateData.status = "Shipped";
      }

      await updateDoc(orderRef, updateData);

      if (selectedOrder.userId) {
        try {
          const userOrderRef = doc(db, "users", selectedOrder.userId, "orders", selectedOrder.id);
          await updateDoc(userOrderRef, updateData);
        } catch (e) {}
      }

      setSelectedOrder((prev) => ({
        ...prev,
        ...updateData
      }));

      showToast("Tracking information saved successfully!");
    } catch (err) {
      console.error("Error saving tracking info:", err);
      alert("Failed to save tracking details.");
    } finally {
      setIsSavingTracking(false);
    }
  };

  // ─── Export Orders to CSV ─────────────────────────────────────────────
  const exportToCSV = () => {
    if (orders.length === 0) {
      alert("No orders available to export.");
      return;
    }

    const headers = [
      "Order Number",
      "Date",
      "Customer Name",
      "Email",
      "Phone",
      "Items Count",
      "Total (INR)",
      "Payment Status",
      "Payment Method",
      "Order Status",
      "Tracking Number",
      "City",
      "State",
      "Pincode"
    ];

    const rows = filteredOrders.map((o) => {
      const addr = o.shippingAddress || {};
      return [
        `"${o.orderNumber || o.id}"`,
        `"${formatDate(o.createdAt)}"`,
        `"${o.customerName || addr.fullName || "Customer"}"`,
        `"${o.customerEmail || ""}"`,
        `"${o.customerPhone || addr.phone || ""}"`,
        o.items?.length || 0,
        o.total || 0,
        `"${o.paymentStatus || "Pending"}"`,
        `"${o.paymentMethod || "Online Payment"}"`,
        `"${o.orderStatus || o.status || "confirmed"}"`,
        `"${o.trackingNumber || o.awbNumber || ""}"`,
        `"${addr.city || ""}"`,
        `"${addr.state || ""}"`,
        `"${addr.pincode || ""}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tuka_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Filter & Search Logic ────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status Tab Filter
    if (activeTab !== "all") {
      result = result.filter((o) => {
        const s = String(o.orderStatus || o.status || "confirmed").toLowerCase();
        return s === activeTab.toLowerCase();
      });
    }

    // Payment Status Filter
    if (paymentFilter !== "all") {
      result = result.filter((o) => {
        const p = String(o.paymentStatus || "Pending").toLowerCase();
        return p === paymentFilter.toLowerCase();
      });
    }

    // Payment Method Filter
    if (paymentMethodFilter !== "all") {
      result = result.filter((o) => {
        const m = String(o.paymentMethod || "").toLowerCase();
        if (paymentMethodFilter === "online") return m.includes("online") || m.includes("card") || m.includes("upi");
        if (paymentMethodFilter === "cod") return m.includes("cash") || m.includes("cod");
        return true;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((o) => {
        const num = String(o.orderNumber || o.id || "").toLowerCase();
        const name = String(o.customerName || o.shippingAddress?.fullName || "").toLowerCase();
        const email = String(o.customerEmail || "").toLowerCase();
        const phone = String(o.customerPhone || o.shippingAddress?.phone || "").toLowerCase();
        const city = String(o.shippingAddress?.city || "").toLowerCase();
        const tracking = String(o.trackingNumber || o.awbNumber || "").toLowerCase();
        return num.includes(q) || name.includes(q) || email.includes(q) || phone.includes(q) || city.includes(q) || tracking.includes(q);
      });
    }

    // Sorting
    result.sort((a, b) => {
      const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
      const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();

      if (sortBy === "newest") return dateB - dateA;
      if (sortBy === "oldest") return dateA - dateB;
      if (sortBy === "highest") return (Number(b.total) || 0) - (Number(a.total) || 0);
      if (sortBy === "lowest") return (Number(a.total) || 0) - (Number(b.total) || 0);
      return 0;
    });

    return result;
  }, [orders, activeTab, paymentFilter, paymentMethodFilter, searchQuery, sortBy]);

  // Statistics counts
  const stats = useMemo(() => {
    const totalCount = orders.length;
    let totalRevenue = 0;
    let paidCount = 0;
    let pendingFulfillment = 0;
    let shippedCount = 0;
    let deliveredCount = 0;

    orders.forEach((o) => {
      const pStatus = String(o.paymentStatus || "").toLowerCase();
      const oStatus = String(o.orderStatus || o.status || "").toLowerCase();

      if (pStatus === "paid") {
        totalRevenue += Number(o.total || 0);
        paidCount += 1;
      }
      if (["confirmed", "processing", "packed"].includes(oStatus)) {
        pendingFulfillment += 1;
      }
      if (oStatus === "shipped") {
        shippedCount += 1;
      }
      if (oStatus === "delivered") {
        deliveredCount += 1;
      }
    });

    return { totalCount, totalRevenue, paidCount, pendingFulfillment, shippedCount, deliveredCount };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-[#161114] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#b13896]/40 flex items-center gap-3 text-xs font-semibold"
          >
            <span className="p-1 bg-[#b13896] rounded-full text-white">
              <Check size={12} strokeWidth={3} />
            </span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Metric Summary Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <div className="p-2 bg-slate-50 rounded-xl text-slate-700">
              <ShoppingBag size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all channels</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Revenue (Paid)</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">₹{stats.totalRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">{stats.paidCount} paid transactions</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">To Pack / Process</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Package size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.pendingFulfillment}</p>
          <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Action required</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">In Transit</span>
            <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
              <Truck size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.shippedCount}</p>
          <p className="text-[11px] text-sky-600 font-semibold mt-0.5">Shipped via courier</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Delivered</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.deliveredCount}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Successfully completed</p>
        </div>
      </div>

      {/* ─── Main Orders Section ─── */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-2 bg-[#b13896]/10 rounded-xl text-[#b13896]">
                  <ShoppingBag size={18} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Order Management & Fulfillment</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View customer transactions, track payment status, and update shipment progression
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowSyncModal(true)}
                className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#b13896] border border-purple-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                title="Sync unlinked or external Cashfree payment ID"
              >
                <CreditCard size={14} />
                <span>Sync Cashfree Ref</span>
              </button>

              <button
                onClick={exportToCSV}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                title="Export current view to CSV"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Status Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 pt-1">
            {[
              { id: "all", label: "All Orders", count: orders.length },
              { id: "confirmed", label: "Confirmed", count: orders.filter((o) => (o.orderStatus || o.status || "confirmed").toLowerCase() === "confirmed").length },
              { id: "packed", label: "Packed", count: orders.filter((o) => (o.orderStatus || o.status || "").toLowerCase() === "packed").length },
              { id: "shipped", label: "Shipped", count: orders.filter((o) => (o.orderStatus || o.status || "").toLowerCase() === "shipped").length },
              { id: "delivered", label: "Delivered", count: orders.filter((o) => (o.orderStatus || o.status || "").toLowerCase() === "delivered").length },
              { id: "cancelled", label: "Cancelled", count: orders.filter((o) => (o.orderStatus || o.status || "").toLowerCase() === "cancelled").length }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-[#161114] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100/80"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order #, customer, phone…"
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b13896]/30 focus:border-[#b13896]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Payment Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Payment:</span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#b13896]/30"
              >
                <option value="all">All Payment Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Method:</span>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#b13896]/30"
              >
                <option value="all">All Payment Methods</option>
                <option value="online">Online Payment (UPI/Card)</option>
                <option value="cod">Cash on Delivery (COD)</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#b13896]/30"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Desktop Table ─── */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.14em] bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-4">Order ID & Date</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Items</th>
                <th className="px-5 py-4">Total Amount</th>
                <th className="px-5 py-4">Payment Status</th>
                <th className="px-6 py-4">Order Status (Update)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const oStatus = getOrderStatusBadge(order.orderStatus || order.status);
                const pStatus = getPaymentStatusBadge(order.paymentStatus);
                const isUpdating = updatingId === order.id;
                const itemsCount = order.items?.length || 1;
                const previewImg = order.items?.[0]?.productImage || order.items?.[0]?.image;

                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Order ID & Date */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="font-mono text-xs font-bold text-slate-900 block group-hover:text-[#b13896] transition-colors">
                          #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Calendar size={11} />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4">
                      <div className="space-y-0.5 max-w-[200px]">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {order.customerName || order.customer || order.shippingAddress?.fullName || "Guest Customer"}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {order.customerEmail || order.shippingAddress?.email || "No email"}
                        </p>
                        {order.customerPhone && (
                          <p className="text-[11px] text-slate-400 font-mono">
                            {order.customerPhone}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Items */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {previewImg ? (
                          <img
                            src={previewImg}
                            alt=""
                            className="w-9 h-11 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <Package size={15} />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {itemsCount} {itemsCount === 1 ? "item" : "items"}
                          </p>
                          <p className="text-[11px] text-slate-400 max-w-[120px] truncate">
                            {order.items?.[0]?.productName || order.items?.[0]?.name || "Bengal Handloom"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Amount & Method */}
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          ₹{Number(order.total || 0).toLocaleString()}
                        </p>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          {order.paymentMethod || "Online"}
                        </span>
                        {order.paymentId && (
                          <span className="inline-block mt-0.5 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Ref: {order.paymentId}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Payment Status Dropdown / Badge */}
                    <td className="px-5 py-4">
                      <div className="relative inline-block">
                        <select
                          value={order.paymentStatus || "Pending"}
                          onChange={(e) => handleUpdatePaymentStatus(order, e.target.value)}
                          disabled={isUpdating}
                          className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border cursor-pointer appearance-none pr-6 focus:outline-none focus:ring-2 focus:ring-[#b13896]/30 ${pStatus.bg}`}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Failed">Failed</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
                    </td>

                    {/* Order Status Selector (Live Update) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <select
                            value={(order.orderStatus || order.status || "confirmed").toLowerCase()}
                            onChange={(e) => handleUpdateOrderStatus(order, e.target.value)}
                            disabled={isUpdating}
                            className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border cursor-pointer appearance-none pr-7 focus:outline-none focus:ring-2 focus:ring-[#b13896]/30 transition-all ${oStatus.bg}`}
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st.value} value={st.value}>
                                {st.label}
                              </option>
                            ))}
                          </select>
                          {isUpdating ? (
                            <Loader2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-slate-500" />
                          ) : (
                            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenOrderModal(order)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#b13896] hover:text-white text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                        title="View Full Details"
                      >
                        <Eye size={13} />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-16 text-center">
                    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                      <ShoppingBag size={22} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 mb-1">No orders found</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {searchQuery || activeTab !== "all" || paymentFilter !== "all"
                        ? "No orders match the current filter criteria. Try clearing filters."
                        : "Orders will appear here once customers place purchases on the store."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Mobile Cards ─── */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filteredOrders.map((order) => {
            const oStatus = getOrderStatusBadge(order.orderStatus || order.status);
            const pStatus = getPaymentStatusBadge(order.paymentStatus);
            const previewImg = order.items?.[0]?.productImage || order.items?.[0]?.image;

            return (
              <div key={order.id} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs font-bold text-slate-900">
                      #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${pStatus.bg}`}>
                      {order.paymentStatus || "Pending"}
                    </span>
                    <span className="text-sm font-bold text-[#b13896]">
                      ₹{Number(order.total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  {previewImg && (
                    <img
                      src={previewImg}
                      alt=""
                      className="w-10 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {order.customerName || order.customer || order.shippingAddress?.fullName || "Guest Customer"}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {order.items?.length || 1} item(s) • {order.paymentMethod || "Online"}
                    </p>
                  </div>
                </div>

                {/* Mobile Status Selectors */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Order Status:
                    </label>
                    <select
                      value={(order.orderStatus || order.status || "confirmed").toLowerCase()}
                      onChange={(e) => handleUpdateOrderStatus(order, e.target.value)}
                      className={`w-full text-xs font-bold uppercase px-2.5 py-1.5 rounded-xl border ${oStatus.bg}`}
                    >
                      {ORDER_STATUSES.map((st) => (
                        <option key={st.value} value={st.value}>{st.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Payment:
                    </label>
                    <select
                      value={order.paymentStatus || "Pending"}
                      onChange={(e) => handleUpdatePaymentStatus(order, e.target.value)}
                      className={`w-full text-xs font-bold uppercase px-2.5 py-1.5 rounded-xl border ${pStatus.bg}`}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleOpenOrderModal(order)}
                    className="mt-4 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#b13896] hover:text-white text-slate-700 text-xs font-bold shrink-0"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Detailed Order Modal / Drawer ─── */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[28px] shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100"
            >
              {/* Modal Header */}
              <div className="bg-[#161114] text-white p-6 sm:p-7 flex items-start justify-between relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-[#b13896]/15 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-1 relative z-10">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-[#b13896]/30 text-[#f4cfeb] px-3 py-0.5 rounded-full border border-[#b13896]/40">
                      Order Details
                    </span>
                    <span className="text-xs text-white/50">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  <h3 className="text-2xl font-serif font-light text-white pt-1">
                    #{selectedOrder.orderNumber || selectedOrder.id}
                  </h3>
                  <p className="text-xs text-white/60">
                    Customer: <strong className="text-white">{selectedOrder.customerName || selectedOrder.shippingAddress?.fullName}</strong> ({selectedOrder.customerEmail || "No email"})
                  </p>
                </div>

                <div className="flex items-center gap-2 relative z-10">
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    title="Print Invoice / Packing Slip"
                  >
                    <Printer size={15} />
                    <span className="hidden sm:inline">Print</span>
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1 text-slate-800">
                {/* ─── Fulfillment Stepper ─── */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/70 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Fulfillment Progression
                    </h4>
                    <span className={`text-[11px] font-bold uppercase px-3 py-1 rounded-full border ${getOrderStatusBadge(selectedOrder.orderStatus).bg}`}>
                      Current: {getOrderStatusBadge(selectedOrder.orderStatus).label}
                    </span>
                  </div>

                  {/* Stepper Bar */}
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {[
                      { step: "confirmed", label: "Confirmed" },
                      { step: "packed", label: "Packed" },
                      { step: "shipped", label: "Shipped" },
                      { step: "delivered", label: "Delivered" }
                    ].map((st, i) => {
                      const stages = ["confirmed", "processing", "packed", "shipped", "delivered"];
                      const currentIdx = stages.indexOf((selectedOrder.orderStatus || "confirmed").toLowerCase());
                      const targetIdx = stages.indexOf(st.step);
                      const isComplete = currentIdx >= targetIdx && targetIdx !== -1;
                      const isCurrent = (selectedOrder.orderStatus || "").toLowerCase() === st.step;

                      return (
                        <div key={st.step} className="text-center space-y-1.5">
                          <button
                            onClick={() => handleUpdateOrderStatus(selectedOrder, st.step)}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                              isComplete
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                : "bg-white text-slate-600 border-slate-200 hover:border-[#b13896]"
                            }`}
                          >
                            {isComplete && <Check size={12} strokeWidth={3} />}
                            <span>{st.label}</span>
                          </button>
                          <span className="text-[10px] text-slate-400 block font-medium">Step {i + 1}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Action Progression Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/70">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Advance:</span>
                    {selectedOrder.orderStatus !== "packed" && selectedOrder.orderStatus !== "shipped" && selectedOrder.orderStatus !== "delivered" && (
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder, "packed")}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Package size={13} />
                        <span>Mark as Packed</span>
                      </button>
                    )}
                    {selectedOrder.orderStatus !== "shipped" && selectedOrder.orderStatus !== "delivered" && (
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder, "shipped")}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Truck size={13} />
                        <span>Mark as Shipped</span>
                      </button>
                    )}
                    {selectedOrder.orderStatus !== "delivered" && (
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder, "delivered")}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 size={13} />
                        <span>Mark as Delivered</span>
                      </button>
                    )}
                    {selectedOrder.orderStatus !== "cancelled" && (
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to mark this order as Cancelled?")) {
                            handleUpdateOrderStatus(selectedOrder, "cancelled");
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold ml-auto cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>

                {/* ─── Tracking & Courier Details Form ─── */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Truck size={14} className="text-[#b13896]" />
                      Shipping & Courier Tracking
                    </h4>
                    {selectedOrder.trackingNumber && (
                      <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                        AWB: {selectedOrder.trackingNumber}
                      </span>
                    )}
                  </div>

                  {/* Origin Warehouse Info */}
                  <div className="p-3 bg-purple-50/70 border border-purple-200/60 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#b13896] shrink-0" />
                      <span className="text-slate-700">
                        <strong>Pickup Origin:</strong> 2KA BOUTIQUE, Shop No 82, Poonam Parkview, Yazoo Park, Global City, Virar West, PIN 401303 (Warehouse ID: 127493)
                      </span>
                    </div>
                  </div>

                  {(selectedOrder.iThinkNotice || selectedOrder.iThinkError) && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>iThink Notice:</strong> {selectedOrder.iThinkNotice || selectedOrder.iThinkError}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Courier Partner
                      </label>
                      <input
                        type="text"
                        value={trackingCourier}
                        onChange={(e) => setTrackingCourier(e.target.value)}
                        placeholder="e.g. Delhivery, BlueDart, DTDC"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#b13896]/30"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        AWB / Tracking Number
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#b13896]/30"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Tracking URL (Optional)
                      </label>
                      <input
                        type="text"
                        value={trackingUrl}
                        onChange={(e) => setTrackingUrl(e.target.value)}
                        placeholder="https://delhivery.com/track/..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#b13896]/30"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleBookIThinkShipment(selectedOrder)}
                        disabled={isBookingIThink}
                        className="px-4 py-2 rounded-xl bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        {isBookingIThink ? <Loader2 size={13} className="animate-spin" /> : <Truck size={13} />}
                        <span>Book with iThink Logistics</span>
                      </button>

                      {(trackingNumber || selectedOrder.awbCode || selectedOrder.trackingNumber) && (
                        <>
                          <button
                            onClick={async () => {
                              const code = trackingNumber || selectedOrder.awbCode || selectedOrder.trackingNumber;
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
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
                          >
                            <FileText size={13} />
                            <span>Print Label</span>
                          </button>

                          <a
                            href={trackingUrl || `https://ithinklogistics.trackshipment.in/${trackingNumber || selectedOrder.awbCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
                          >
                            <ExternalLink size={13} />
                            <span>Track Live</span>
                          </a>
                        </>
                      )}
                    </div>

                    <button
                      onClick={handleSaveTracking}
                      disabled={isSavingTracking}
                      className="px-4 py-2 rounded-xl bg-[#161114] hover:bg-[#b13896] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isSavingTracking && <Loader2 size={13} className="animate-spin" />}
                      <span>Save Tracking</span>
                    </button>
                  </div>
                </div>

                {/* ─── Customer & Payment Information ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Delivery Address */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#b13896]" />
                      Delivery Destination
                    </h4>
                    <p className="text-xs font-bold text-slate-900">
                      {selectedOrder.shippingAddress?.fullName || selectedOrder.customerName || "Customer"}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedOrder.shippingAddress?.houseNumber && `${selectedOrder.shippingAddress.houseNumber}, `}
                      {selectedOrder.shippingAddress?.street || selectedOrder.shippingAddress?.address || "No street address"}<br />
                      {selectedOrder.shippingAddress?.locality && `${selectedOrder.shippingAddress.locality}, `}
                      {selectedOrder.shippingAddress?.city || "City"},{" "}
                      {selectedOrder.shippingAddress?.state || "State"} -{" "}
                      <strong>{selectedOrder.shippingAddress?.pincode || "Pincode"}</strong>
                    </p>
                    <div className="pt-2 text-xs text-slate-500 space-y-0.5 border-t border-slate-200/60">
                      <p className="flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400" />
                        <span>{selectedOrder.shippingAddress?.phone || selectedOrder.customerPhone || "No phone provided"}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-400" />
                        <span>{selectedOrder.customerEmail || "No email provided"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <CreditCard size={13} className="text-[#b13896]" />
                        Payment Overview
                      </h4>
                      <select
                        value={selectedOrder.paymentStatus || "Pending"}
                        onChange={(e) => handleUpdatePaymentStatus(selectedOrder, e.target.value)}
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border cursor-pointer ${getPaymentStatusBadge(selectedOrder.paymentStatus).bg}`}
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Failed">Failed</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <strong className="text-slate-900">{selectedOrder.paymentMethod || "Online Payment"}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Payment ID:</span>
                        {selectedOrder.paymentId ? (
                          <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {selectedOrder.paymentId}
                          </span>
                        ) : selectedOrder.cashfreeOrderId ? (
                          <span className="font-mono text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            CF: {selectedOrder.cashfreeOrderId}
                          </span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </div>
                      <div className="pt-1.5 pb-1 flex items-center justify-between border-t border-slate-200/60">
                        <span className="text-[11px] text-slate-500">Email: <strong>{selectedOrder.emailStatus?.customer === "sent" ? "Delivered" : (selectedOrder.emailStatus?.customer || "Pending")}</strong></span>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              showToast("Sending confirmation email...");
                              const res = await fetch("/api/cashfree/verify-order", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "resend-email", orderId: selectedOrder.id })
                              });
                              const data = await res.json();
                              if (data.success && data.emailStatus?.customer === "sent") {
                                showToast(`Confirmation email sent to ${selectedOrder.customerEmail}!`);
                              } else {
                                showToast(data.error || "Failed to send email. Check SMTP settings.");
                              }
                            } catch (e) {
                              showToast("Error sending email: " + e.message);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#b13896] border border-purple-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Mail size={12} />
                          <span>Resend Email</span>
                        </button>
                      </div>
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{Number(selectedOrder.subtotal || selectedOrder.total || 0).toLocaleString()}</span>
                      </div>
                      {Number(selectedOrder.shipping || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>Shipping:</span>
                          <span>₹{Number(selectedOrder.shipping).toLocaleString()}</span>
                        </div>
                      )}
                      {Number(selectedOrder.discount || 0) > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Discount Applied:</span>
                          <span>-₹{Number(selectedOrder.discount).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                        <span>Total Paid:</span>
                        <span className="text-[#b13896]">₹{Number(selectedOrder.total || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── Purchased Items ─── */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Package size={14} className="text-[#b13896]" />
                    Purchased Handloom Items ({selectedOrder.items?.length || 0})
                  </h4>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {(selectedOrder.items || []).map((item, idx) => (
                      <div key={idx} className="p-3.5 sm:p-4 flex items-center gap-4 bg-white hover:bg-slate-50/50 transition-colors">
                        <img
                          src={item.productImage || item.image || "https://images.unsplash.com/photo-1610030470298-40e1eaccf77d?auto=format&fit=crop&q=80&w=200"}
                          alt={item.productName || item.name}
                          className="w-12 h-15 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.productName || item.name || "Handloom Saree"}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            {item.size && <span>Size: <strong>{item.size}</strong></span>}
                            {item.color && <span>• Color: <strong>{item.color}</strong></span>}
                            <span>• Qty: <strong>{item.quantity || 1}</strong></span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-900">
                            ₹{Number(item.subtotal || (item.unitPrice * (item.quantity || 1)) || item.price || 0).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            ₹{Number(item.unitPrice || item.price || 0).toLocaleString()} each
                          </p>
                        </div>
                      </div>
                    ))}

                    {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No item breakdown recorded for this order.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Order ID: <code className="font-mono text-[11px] text-slate-600">{selectedOrder.id}</code>
                </span>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#161114] hover:bg-[#b13896] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Cashfree Payment Sync Modal ─── */}
      <AnimatePresence>
        {showSyncModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2 text-slate-900 font-serif font-bold text-lg">
                  <CreditCard size={20} className="text-[#b13896]" />
                  <span>Sync Cashfree Payment</span>
                </div>
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                If a customer completed payment on Cashfree (e.g. Ref ID: <code className="font-mono text-[#b13896] bg-purple-50 px-1 py-0.5 rounded">688991276</code>), enter the reference ID below to immediately link or record the order into the admin database.
              </p>

              <form onSubmit={handleSyncCashfreePayment} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Cashfree Ref ID / Payment ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 688991276"
                    value={syncRefInput}
                    onChange={(e) => setSyncRefInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-[#b13896]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={syncAmountInput}
                    onChange={(e) => setSyncAmountInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-[#b13896]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSyncModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="px-5 py-2.5 rounded-xl bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
                  >
                    {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    <span>Sync &amp; Record</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrdersTable;
