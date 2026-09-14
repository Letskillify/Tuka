import React, { useMemo } from "react";
import { ArrowRight, ArrowUpRight, Box, Clock3, Gem, Globe2, PackageCheck, ShoppingBag, UsersRound } from "lucide-react";
import { Chart as ChartJS, ArcElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip } from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

ChartJS.register(ArcElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip);

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const timestampDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const change = (current, previous) => previous ? `${(((current - previous) / previous) * 100).toFixed(1)}%` : current ? "100%" : "0.0%";

// ─── Single stat card ─────────────────────────────────────────────────────────
const Stat = ({ label, value, note, icon: Icon, tint, isDark }) => (
  <article className={`rounded-2xl border p-5 shadow-[0_3px_14px_rgba(37,17,24,.035)] transition-all duration-300 ${isDark ? "bg-slate-800 border-slate-700/60" : "bg-white border-slate-100"}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-[14px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
        <p className={`mt-2 text-[25px] font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>{value}</p>
      </div>
      <span className={`grid h-11 w-11 place-items-center rounded-full ${tint}`}>
        <Icon size={20} strokeWidth={1.8} />
      </span>
    </div>
    <p className={`mt-3 flex items-center gap-1 text-[14px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
      <ArrowUpRight size={12} className="text-emerald-500" />
      <strong className="text-emerald-600">{note}</strong>
    </p>
  </article>
);

const DashboardOverview = ({ products, users, orders, onViewProducts, isDarkMode = false }) => {
  const data = useMemo(() => {
    const now = new Date(); now.setHours(23, 59, 59, 999);
    const start = new Date(now); start.setDate(now.getDate() - 13); start.setHours(0, 0, 0, 0);
    const labels = Array.from({ length: 14 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date; });
    const currentCounts = Array(14).fill(0);
    let currentOrders = 0;
    orders.forEach((order) => {
      const date = timestampDate(order.createdAt || order.orderDate || order.date);
      if (!date) return;
      if (date >= start && date <= now) {
        const index = Math.floor((date - start) / 86400000);
        if (index >= 0 && index < 14) currentCounts[index] += 1;
        currentOrders += 1;
      }
    });
    const categoryTotals = products.reduce((acc, product) => {
      const name = product.category || "Uncategorized";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
    const countryTotals = products.reduce((acc, product) => {
      const name = product.country || "Unknown";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
    return {
      labels: labels.map((date) => date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })),
      currentCounts,
      currentOrders,
      categoryTotals,
      countryTotals,
    };
  }, [orders, products]);

  const inStock = products.filter((p) => Number(p.stock || 0) > 0).length;
  const lowStock = products.filter((p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 10).length;
  const categoryNames = Object.keys(data.categoryTotals);
  const countryNames = Object.keys(data.countryTotals);

  const cardBg = isDarkMode ? "bg-slate-800 border-slate-700/60" : "bg-white border-slate-100";
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textMuted = isDarkMode ? "text-slate-400" : "text-slate-500";
  const divider = isDarkMode ? "border-slate-700" : "border-slate-100";
  const tableHead = isDarkMode ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-400";
  const tableRow = isDarkMode ? "hover:bg-slate-700/40 divide-slate-700/40" : "hover:bg-slate-50 divide-slate-50";

  // Orders over 14 days chart (count, not revenue)
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: "Orders this period",
        data: data.currentCounts,
        borderColor: "#9c1237",
        backgroundColor: "rgba(156,18,55,.10)",
        fill: true,
        tension: 0.42,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2.5,
      },
    ],
  };

  const doughnutData = {
    labels: categoryNames.length ? categoryNames : ["No categories"],
    datasets: [{
      data: categoryNames.length ? Object.values(data.categoryTotals) : [1],
      backgroundColor: categoryNames.length
        ? ["#9c1237", "#f5bf62", "#67b999", "#9588e5", "#ef8ba4", "#7b91c8"]
        : ["#e9edf2"],
      borderWidth: 0,
      hoverOffset: 3,
    }],
  };

  const activities = [
    { icon: ShoppingBag, text: `${orders.length} order${orders.length === 1 ? "" : "s"} in the database`, time: "Live", tone: "bg-amber-50 text-amber-600" },
    { icon: PackageCheck, text: `${products.length} products in catalogue`, time: "Live", tone: "bg-rose-50 text-[#9c1237]" },
    { icon: UsersRound, text: `${users.length} registered customers`, time: "Live", tone: "bg-emerald-50 text-emerald-600" },
    { icon: Globe2, text: `${countryNames.filter((c) => c !== "Unknown").length} countries of origin`, time: "Live", tone: "bg-blue-50 text-blue-600" },
  ];

  return (
    <div className="space-y-5">
      {/* ─── Stat Cards (no revenue) ─── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total Orders" value={data.currentOrders.toLocaleString("en-IN")} note="Live database count" icon={ShoppingBag} tint="bg-rose-50 text-[#a6173c]" isDark={isDarkMode} />
        <Stat label="Total Products" value={products.length.toLocaleString("en-IN")} note={`${inStock} in stock`} icon={Box} tint="bg-amber-50 text-amber-600" isDark={isDarkMode} />
        <Stat label="Total Customers" value={users.length.toLocaleString("en-IN")} note="Registered accounts" icon={UsersRound} tint="bg-violet-50 text-violet-600" isDark={isDarkMode} />
        <Stat label="Low Stock Items" value={lowStock} note={`${inStock} total in stock`} icon={PackageCheck} tint="bg-emerald-50 text-emerald-600" isDark={isDarkMode} />
      </section>

      {/* ─── Charts Row ─── */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_286px]">
        {/* Orders overview chart */}
        <article className={`rounded-2xl border p-5 shadow-[0_3px_14px_rgba(37,17,24,.035)] sm:p-6 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-[15px] font-bold ${textPrimary}`}>Orders Overview</h2>
              <p className={`mt-1 text-[14px] ${textMuted}`}>Order count over the last 14 days</p>
            </div>
          </div>
          <div className="mt-5 h-56">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: "index" },
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} orders` } },
                },
                scales: {
                  x: { grid: { display: false }, ticks: { maxTicksLimit: 7, font: { size: 10 }, color: isDarkMode ? "#64748b" : "#8a94a3" } },
                  y: {
                    beginAtZero: true,
                    border: { display: false },
                    grid: { color: isDarkMode ? "#1e293b" : "#eef1f4" },
                    ticks: { stepSize: 1, font: { size: 10 }, color: isDarkMode ? "#64748b" : "#8a94a3" },
                  },
                },
              }}
            />
          </div>
        </article>

        {/* Top Categories */}
        <article className={`rounded-2xl border p-5 shadow-[0_3px_14px_rgba(37,17,24,.035)] sm:p-6 ${cardBg}`}>
          <h2 className={`text-[15px] font-bold ${textPrimary}`}>Top Categories</h2>
          <div className="mt-4 h-32">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "62%",
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} products` } },
                },
              }}
            />
          </div>
          <div className="mt-5 space-y-2.5 text-[14px]">
            {categoryNames.length
              ? categoryNames.slice(0, 5).map((name, index) => (
                  <div className="flex justify-between" key={name}>
                    <span className={`flex items-center gap-2 ${textMuted}`}>
                      <i className="h-2 w-2 rounded-full" style={{ backgroundColor: doughnutData.datasets[0].backgroundColor[index] }} />
                      {name}
                    </span>
                    <b className={textPrimary}>{data.categoryTotals[name]}</b>
                  </div>
                ))
              : <p className={`text-center ${textMuted}`}>Categories will appear here.</p>}
          </div>
          <button onClick={onViewProducts} className={`mt-5 flex w-full items-center justify-between border-t pt-4 text-[14px] font-semibold ${divider} ${textPrimary}`}>
            View all products <ArrowRight size={14} />
          </button>
        </article>
      </section>

      {/* ─── Countries & Recent Products ─── */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_286px]">
        {/* Recent Products table */}
        <article className={`overflow-hidden rounded-2xl border shadow-[0_3px_14px_rgba(37,17,24,.035)] ${cardBg}`}>
          <div className={`flex items-center justify-between border-b px-5 py-5 sm:px-6 ${divider}`}>
            <div>
              <h2 className={`text-[15px] font-bold ${textPrimary}`}>Recent Products</h2>
              <p className={`mt-1 text-[14px] ${textMuted}`}>Latest live additions to your catalogue</p>
            </div>
            <button onClick={onViewProducts} className="text-[14px] font-semibold text-[#9c1237]">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead className={`text-[14px] uppercase tracking-[.12em] ${tableHead}`}>
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${tableRow}`}>
                {products.slice(0, 5).map((p) => (
                  <tr key={p.id} className={`text-[12px] transition-colors ${isDarkMode ? "hover:bg-slate-700/40" : "hover:bg-slate-50"}`}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-rose-50 text-[#9c1237]">
                          {p.images?.[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : <Gem size={15} />}
                        </span>
                        <span className={`max-w-[140px] truncate font-semibold ${textPrimary}`}>{p.name}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 ${textMuted}`}>{p.category || "Uncategorized"}</td>
                    <td className="px-4 py-3">
                      {p.country
                        ? <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[12px] font-semibold text-blue-600">🌍 {p.country}</span>
                        : <span className={textMuted}>—</span>}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${textPrimary}`}>{money(p.price)}</td>
                    <td className={`px-4 py-3 font-semibold ${Number(p.stock || 0) ? "text-emerald-600" : "text-rose-500"}`}>{p.stock || 0}</td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan="5" className={`px-6 py-11 text-center text-[12px] ${textMuted}`}>Your newest catalogue additions will appear here.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        {/* Recent Activity + Countries breakdown */}
        <div className="space-y-5">
          <article className={`rounded-2xl border p-5 shadow-[0_3px_14px_rgba(37,17,24,.035)] sm:p-6 ${cardBg}`}>
            <h2 className={`text-[15px] font-bold ${textPrimary}`}>Recent Activity</h2>
            <div className="mt-4 space-y-4">
              {activities.map(({ icon: Icon, text, time, tone }) => (
                <div className="flex gap-3" key={text}>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone}`}>
                    <Icon size={14} />
                  </span>
                  <div>
                    <p className={`text-[14px] leading-5 ${textPrimary}`}>{text}</p>
                    <p className={`text-[14px] ${textMuted}`}>{time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className={`mt-5 flex w-full items-center justify-between border-t pt-4 text-[14px] font-semibold ${divider} ${textPrimary}`}>
              Live updates enabled <Clock3 size={14} />
            </button>
          </article>

          {/* Countries of origin mini-card */}
          {countryNames.filter((c) => c !== "Unknown").length > 0 && (
            <article className={`rounded-2xl border p-5 shadow-[0_3px_14px_rgba(37,17,24,.035)] ${cardBg}`}>
              <h2 className={`text-[15px] font-bold ${textPrimary} flex items-center gap-2`}>
                <Globe2 size={16} className="text-blue-500" /> Product Origins
              </h2>
              <div className="mt-3 space-y-2">
                {countryNames.filter((c) => c !== "Unknown").slice(0, 5).map((country) => (
                  <div key={country} className="flex items-center justify-between">
                    <span className={`text-[13px] ${textMuted} flex items-center gap-1.5`}>🌍 {country}</span>
                    <span className={`text-[13px] font-bold ${textPrimary}`}>{data.countryTotals[country]}</span>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardOverview;
