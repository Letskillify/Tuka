import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Edit2, Trash2, Package, Plus, RefreshCw, Search, SlidersHorizontal, MoreVertical } from "lucide-react";
import { statusBadgeClasses } from "./AdminUtils";
import CSVUpload from "./CSVUpload";

const ProductsTable = ({ products, onAddProduct, onEditProduct, onDeleteProduct, onRefresh }) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesSearch = `${product.name || ""} ${product.sku || ""} ${product.subCategory || ""}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (category === "All Categories" || product.category === category);
  }), [products, search, category]);
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];
  return <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    {/* Header */}
    <div className="px-6 py-5 sm:px-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2.5">
          <span className="p-1.5 bg-[#b13896]/10 rounded-lg">
            <Package size={15} className="text-[#b13896]" />
          </span>
          Products
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-1 ml-0.5">
          {products.length} item{products.length !== 1 ? "s" : ""} in inventory
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <CSVUpload onComplete={onRefresh} />
        <button
          type="button"
          onClick={onRefresh}
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-100 transition-all font-semibold"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
        <button
          type="button"
          onClick={onAddProduct}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#b13896] text-white rounded-xl text-[12px] font-bold shadow-md shadow-[#b13896]/20 hover:bg-[#962e7f] transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={13} />
          New Product
        </button>
      </div>
    </div>

    <div className="mx-5 mb-4 flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:mx-8 sm:flex-row sm:items-center">
      <label className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-400"><Search size={15}/><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs text-slate-700 outline-none" placeholder="Search products..." /></label>
      <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none"><option>All Categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
      <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"><SlidersHorizontal size={14}/>Filter</button>
      {(search || category !== "All Categories") && <button onClick={() => { setSearch(""); setCategory("All Categories"); }} className="px-2 text-xs font-semibold text-[#b13896]">Reset</button>}
    </div>
    {/* Desktop Table */}
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.12em] border-b border-slate-50 bg-slate-50/60">
            <th className="px-8 py-4">Product</th>
            <th className="px-5 py-4">SKU</th>
            <th className="px-5 py-4">Category</th>
            <th className="px-5 py-4">Sub Category</th>
            <th className="px-5 py-4">Price</th>
            <th className="px-5 py-4">Stock</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Date</th>
            <th className="px-8 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {filteredProducts.map((row, idx) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.03 }}
              className="hover:bg-slate-50/60 transition-colors group"
            >
              <td className="px-8 py-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                    {row.images?.[0] ? (
                      <img src={row.images[0]} alt={row.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package size={18} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900 line-clamp-1 max-w-[180px]">{row.name}</p>
                    <p className="text-[14px] text-slate-400 font-mono mt-0.5">{row.id.substring(0, 10)}…</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-[14px] font-medium text-slate-500">{row.sku || row.productCode || row.id.slice(0, 10)}</td>
              <td className="px-5 py-4">
                <span className="text-[14px] font-semibold text-slate-655 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {row.category || "Uncategorized"}
                </span>
              </td>
              <td className="px-5 py-4">
                {row.subCategory ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-50 px-2.5 py-1 text-[12px] font-bold text-[#b13896]">
                    ✨ {row.subCategory}
                  </span>
                ) : (
                  <span className="text-slate-400 text-[13px]">—</span>
                )}
              </td>
              <td className="px-5 py-4">
                <p className="text-[13px] font-bold text-slate-900">₹{Number(row.price || 0).toLocaleString()}</p>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${row.stock > 10 ? "bg-emerald-500" : row.stock > 0 ? "bg-amber-500" : "bg-red-500"}`} />
                  <span className="text-[13px] font-semibold text-slate-700">{row.stock || 0}</span>
                </div>
              </td>
              <td className="px-5 py-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[14px] font-bold uppercase tracking-wide border ${statusBadgeClasses(row.stock_status || "In Stock")}`}>
                  {row.stock_status || "In Stock"}
                </span>
              </td>
              <td className="px-5 py-4 text-[14px] text-slate-500">{row.createdAt?.toDate ? row.createdAt.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
              <td className="px-8 py-4">
                <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEditProduct && (
                    <button
                      type="button"
                      onClick={() => onEditProduct(row)}
                      className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-[#b13896] bg-slate-100 transition-all cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteProduct(row.id)}
                    className="p-2 rounded-xl text-red-500 hover:text-white hover:bg-red-500 bg-red-50 transition-all cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Mobile Cards */}
    <div className="lg:hidden divide-y divide-slate-50">
      {filteredProducts.map((row) => (
        <div key={row.id} className="p-5 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
              {row.images?.[0] ? (
                <img src={row.images[0]} alt={row.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Package size={22} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{row.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[14px] font-bold text-slate-400 uppercase">{row.category}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-sm font-bold text-[#b13896]">₹{Number(row.price || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEditProduct && (
              <button
                onClick={() => onEditProduct(row)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Edit2 size={13} /> Edit
              </button>
            )}
            <button
              onClick={() => onDeleteProduct(row.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* Empty State */}
    {filteredProducts.length === 0 && (
      <div className="px-8 py-20 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-100">
          <Package size={30} className="text-slate-300" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">No products yet</h3>
        <p className="text-xs text-slate-400 max-w-[200px] mx-auto">
          Your inventory is empty. Add your first handloom collection item.
        </p>
        <button
          onClick={onAddProduct}
          className="mt-6 px-6 py-2.5 bg-[#b13896] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#b13896]/20 hover:bg-[#962e7f] transition-all cursor-pointer"
        >
          Add Your First Product
        </button>
      </div>
    )}
    <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-[14px] text-slate-500"><span>Showing {filteredProducts.length} of {products.length} products</span><span className="rounded-md border border-slate-200 px-3 py-1.5">Page 1</span></div>
  </section>;
};

export default ProductsTable;
