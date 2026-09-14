import React from "react";
import { ShoppingBag } from "lucide-react";
import { statusBadgeClasses } from "./AdminUtils";

const OrdersTable = ({ orders }) => (
  <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full">
    {/* Header */}
    <div className="px-6 py-5 sm:px-8 border-b border-slate-100 flex items-center justify-between">
      <div>
        <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2.5">
          <span className="p-1.5 bg-[#b13896]/10 rounded-lg">
            <ShoppingBag size={15} className="text-[#b13896]" />
          </span>
          Recent Orders
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-1 ml-0.5">
          Latest customer transactions
        </p>
      </div>
      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[14px] font-bold text-emerald-600 uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live
      </span>
    </div>

    {/* Desktop Table */}
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.12em] border-b border-slate-50 bg-slate-50/60">
            <th className="px-8 py-4">Order ID</th>
            <th className="px-5 py-4">Customer</th>
            <th className="px-5 py-4">Amount</th>
            <th className="px-8 py-4 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {orders.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-8 py-4">
                <span className="text-[13px] font-bold text-slate-900 font-mono">#{row.orderId || row.id}</span>
              </td>
              <td className="px-5 py-4">
                <p className="text-[13px] font-semibold text-slate-700">{row.customer || row.customerName || row.shippingAddress?.name || "Customer"}</p>
              </td>
              <td className="px-5 py-4">
                <p className="text-[13px] font-bold text-slate-900">₹{Number(row.total || 0).toLocaleString()}</p>
              </td>
              <td className="px-8 py-4 text-right">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[14px] font-bold uppercase tracking-wide border ${statusBadgeClasses(row.status || "Pending")}`}>
                  {row.status || "Pending"}
                </span>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={4} className="px-8 py-16 text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                  <ShoppingBag size={22} className="text-slate-300" />
                </div>
                <p className="text-xs font-bold text-slate-500 mb-0.5">No orders yet</p>
                <p className="text-[14px] text-slate-400">Customer purchases will appear here.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Mobile Cards */}
    <div className="lg:hidden divide-y divide-slate-100">
      {orders.map((row) => (
        <div key={row.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-slate-900 font-mono">#{row.orderId || row.id}</p>
            <p className="text-xs font-medium text-slate-500">{row.customer || row.customerName || row.shippingAddress?.name || "Customer"}</p>
            <p className="text-sm font-bold text-[#b13896] pt-1">₹{Number(row.total || 0).toLocaleString()}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[14px] font-bold uppercase tracking-wide border ${statusBadgeClasses(row.status)}`}>
            {row.status || "Pending"}
          </span>
        </div>
      ))}
    </div>
  </section>
);

export default OrdersTable;
