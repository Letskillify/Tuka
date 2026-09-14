// UserPanel.jsx
import React, { useState } from "react";

const orderRows = [
  {
    id: "#10234",
    date: "Feb 08, 2026",
    total: "$128.00",
    status: "Shipped",
  },
  {
    id: "#10221",
    date: "Feb 03, 2026",
    total: "$74.00",
    status: "Processing",
  },
  {
    id: "#10192",
    date: "Jan 27, 2026",
    total: "$212.00",
    status: "Delivered",
  },
];

const wishlistItems = [
  {
    name: "Dhaniakhali Combed Cotton Saree",
    description: "Firm 100s thread count weave with signature Kanchha border.",
    price: "₹3,800.00",
    tag: "Best Seller",
  },
  {
    name: "Begumpuri Lightweight Handloom Saree",
    description: "Featherlight loose twist cotton with Macha Chokh motifs.",
    price: "₹2,600.00",
    tag: "New",
  },
  {
    name: "Bishnupuri Pure Silk Saree",
    description: "Handcrafted pure silk with exquisite luster and soft drape.",
    price: "₹6,500.00",
    tag: "Limited",
  },
];

const cartItems = [
  { name: "Shantipuri 120s Fine Cotton Saree", quantity: 1, price: "₹3,200.00" },
  { name: "Tailored Pure Silk Designer Blouse", quantity: 1, price: "₹1,500.00" },
];

const statusBadgeClasses = (status) => {
  switch (status) {
    case "Shipped":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "Delivered":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100";
  }
};

const UserPanel = () => {
  const [activeTab, setActiveTab] = useState("My Orders");

  const tabs = ["My Orders", "Wishlist", "Cart", "Profile"];

  const renderTabs = () => (
    <div className="w-full border-b border-slate-200 mt-6">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${isActive
                  ? "text-[#811331]"
                  : "text-slate-500 hover:text-slate-900"
                }`}
            >
              {tab}
              {isActive && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#811331]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderOrders = () => (
    <section className="mt-6 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">My Orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track the status of your recent purchases.
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 text-xs font-medium text-slate-600">
          {orderRows.length} orders
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50/60">
            <tr className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              <th className="px-4 sm:px-6 py-3">Order</th>
              <th className="px-4 sm:px-6 py-3">Date</th>
              <th className="px-4 sm:px-6 py-3">Total</th>
              <th className="px-4 sm:px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orderRows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60">
                <td className="px-4 sm:px-6 py-3 font-medium text-slate-900">
                  {row.id}
                </td>
                <td className="px-4 sm:px-6 py-3 text-slate-600">
                  {row.date}
                </td>
                <td className="px-4 sm:px-6 py-3 text-slate-900">
                  {row.total}
                </td>
                <td className="px-4 sm:px-6 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${statusBadgeClasses(
                      row.status
                    )}`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderWishlist = () => (
    <section className="mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Wishlist</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Curated products you’re interested in.
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#811331]/5 text-xs font-medium text-[#811331]">
          {wishlistItems.length} saved
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {wishlistItems.map((item) => (
          <article
            key={item.name}
            className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {item.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.description}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-50 text-[14px] font-medium text-slate-600">
                {item.tag}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">
                {item.price}
              </p>
              <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-[#811331] text-white shadow-sm hover:bg-[#6a0f29] transition-colors"
              >
                Move to cart
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  const renderCart = () => (
    <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-2.5">
          Cart Items
        </h2>
        <div className="space-y-3">
          {cartItems.map((item) => (
            <div
              key={item.name}
              className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {item.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Quantity: {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {item.price}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Cart Summary
        </h2>
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium text-slate-900">₹9,000.00</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Estimated Shipping</span>
            <span className="font-medium text-slate-900">₹200.00</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Tax</span>
            <span className="font-medium text-slate-900">₹180.00</span>
          </div>
          <div className="border-t border-dashed border-slate-200 pt-3 mt-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total
            </span>
            <span className="text-base font-semibold text-slate-900">
              ₹9,380.00
            </span>
          </div>
        </div>
        <button
          type="button"
          className="mt-4 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-[#811331] text-white shadow-sm hover:bg-[#6a0f29] transition-colors"
        >
          Proceed to checkout
        </button>
        <p className="mt-2 text-[14px] text-slate-500 text-center">
          Secure checkout. No additional fees at this step.
        </p>
      </div>
    </section>
  );

  const renderProfile = () => (
    <section className="mt-6 grid gap-4 md:grid-cols-2">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Profile Information
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500 w-24">Name</dt>
            <dd className="flex-1 text-slate-900 font-medium">
              Jordan Rivera
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500 w-24">Email</dt>
            <dd className="flex-1 text-slate-900">
              jordan.rivera@tuka.in
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500 w-24">Phone</dt>
            <dd className="flex-1 text-slate-900">+91 98765 43210</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500 w-24">Member Since</dt>
            <dd className="flex-1 text-slate-900">September 2023</dd>
          </div>
        </dl>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 sm:p-5 flex flex-col justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-2.5">
            Saree & Fabric Style Preferences
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            We personalize recommendations based on your unique style.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full bg-slate-50 text-xs font-medium text-slate-700">
              Traditional
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-50 text-xs font-medium text-slate-700">
              Minimalist
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-50 text-xs font-medium text-slate-700">
              Ethnic Wear
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-50 text-xs font-medium text-slate-700">
              Modern
            </span>
          </div>
        </div>
        <button
          type="button"
          className="self-start inline-flex items-center px-4 py-2 rounded-lg text-xs font-medium bg-[#811331]/5 text-[#811331] hover:bg-[#811331]/10 transition-colors"
        >
          Update preferences
        </button>
      </div>
    </section>
  );

  const renderContent = () => {
    if (activeTab === "My Orders") return renderOrders();
    if (activeTab === "Wishlist") return renderWishlist();
    if (activeTab === "Cart") return renderCart();
    if (activeTab === "Profile") return renderProfile();
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#811331] text-white flex items-center justify-center text-sm font-semibold shadow-sm">
              UP
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-900">
                User Panel
              </p>
              <p className="text-xs text-slate-500">
                Personal dashboard & activity
              </p>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end text-xs">
            <span className="text-slate-500">Signed in as</span>
            <span className="font-medium text-slate-900">
              jordan.rivera@tuka.in
            </span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-1">
          {renderTabs()}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default UserPanel;






