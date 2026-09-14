import React, { useState, useEffect } from "react";
import {
  PackageCheck,
  Search,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Layers,
  Sliders,
  Filter,
} from "lucide-react";
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../components/Firebase";

const StockManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All"); // "All", "InStock", "LowStock", "OutOfStock"
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Track modified stock values per product
  const [stockEdits, setStockEdits] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [saveSuccessId, setSaveSuccessId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Listen to Firestore products in real-time
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "products"),
      (snap) => {
        const list = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setProducts(list);
        setLoading(false);
      },
      (err) => {
        console.error("Stock manager snapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Handle local state edit for base stock or variant stock
  const handleBaseStockChange = (productId, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setStockEdits((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        stock: num,
        stock_status: num <= 0 ? "Out of Stock" : "In Stock",
      },
    }));
  };

  const handleStatusChange = (productId, statusVal) => {
    setStockEdits((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        stock_status: statusVal,
      },
    }));
  };

  const handleVariantStockChange = (productId, variantIndex, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setStockEdits((prev) => {
      const prodEdit = prev[productId] || {};
      const productObj = products.find((p) => p.id === productId);
      const currentVariants = prodEdit.sizeVariants || (productObj?.sizeVariants ? [...productObj.sizeVariants] : []);

      const updatedVariants = currentVariants.map((v, idx) => {
        if (idx === variantIndex) {
          return { ...v, stock: num };
        }
        return v;
      });

      // Total stock calculation across variants
      const totalVarStock = updatedVariants.reduce((sum, v) => sum + Number(v.stock || 0), 0);

      return {
        ...prev,
        [productId]: {
          ...prodEdit,
          sizeVariants: updatedVariants,
          stock: totalVarStock > 0 ? totalVarStock : prodEdit.stock ?? productObj?.stock ?? 0,
          stock_status: totalVarStock <= 0 && (prodEdit.stock ?? productObj?.stock ?? 0) <= 0 ? "Out of Stock" : "In Stock",
        },
      };
    });
  };

  const saveProductStock = async (product) => {
    const edits = stockEdits[product.id];
    if (!edits) return;
    setSavingId(product.id);
    setErrorMessage("");
    try {
      const newStock = edits.stock !== undefined ? edits.stock : Number(product.stock || 0);
      const newStatus = edits.stock_status || (newStock <= 0 ? "Out of Stock" : "In Stock");
      const newSizeVariants = edits.sizeVariants || product.sizeVariants || [];

      const updatePayload = {
        stock: newStock,
        stock_status: newStatus,
        sizeVariants: newSizeVariants,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "products", product.id), updatePayload);

      setSaveSuccessId(product.id);
      setTimeout(() => setSaveSuccessId(null), 2500);

      // Clear edit buffer for this product
      setStockEdits((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    } catch (err) {
      setErrorMessage(`Failed to save stock: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  // Unique categories list
  const categoriesList = ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  // Filtering products
  const filteredProducts = products.filter((p) => {
    const currentEdit = stockEdits[p.id];
    const totalStock = currentEdit?.stock !== undefined ? currentEdit.stock : Number(p.stock || 0);

    const matchesSearch =
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.subCategory || "").toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;

    let matchesStatus = true;
    if (filterStatus === "InStock") matchesStatus = totalStock > 5;
    if (filterStatus === "LowStock") matchesStatus = totalStock > 0 && totalStock <= 5;
    if (filterStatus === "OutOfStock") matchesStatus = totalStock <= 0;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Metrics
  const inStockCount = products.filter((p) => Number(p.stock || 0) > 5).length;
  const lowStockCount = products.filter((p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 5).length;
  const outOfStockCount = products.filter((p) => Number(p.stock || 0) <= 0).length;

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-[#b13896]/10 rounded-xl text-[#b13896]">
            <PackageCheck size={22} />
          </span>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Inventory & Stock Manager</h1>
            <p className="text-xs text-slate-400 font-medium">
              Update product stock quantities, size variant stocks, and stock status in real-time
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full">
          {products.length} Products Tracked
        </span>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* ── Stock Metric Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Products</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{products.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">In Stock</p>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{inStockCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Low Stock (≤5)</p>
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{lowStockCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Out of Stock</p>
            <XCircle size={18} className="text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{outOfStockCount}</p>
        </div>
      </div>

      {/* ── Controls & Filters Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search product by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#b13896]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: "All", label: "All" },
              { id: "InStock", label: "In Stock" },
              { id: "LowStock", label: "Low Stock" },
              { id: "OutOfStock", label: "Out of Stock" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilterStatus(btn.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === btn.id
                    ? "bg-white text-[#b13896] shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-[#b13896]"
          >
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Products Stock Table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Product Details</th>
                <th className="p-4">Category / Subcategory</th>
                <th className="p-4">Base Flat Stock</th>
                <th className="p-4">Size Variants Stock (Dynamic)</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                const edits = stockEdits[product.id] || {};
                const currentBaseStock = edits.stock !== undefined ? edits.stock : Number(product.stock || 0);
                const currentStatus = edits.stock_status || (currentBaseStock <= 0 ? "Out of Stock" : "In Stock");
                const currentVariants = edits.sizeVariants || product.sizeVariants || [];
                const hasEdits = Boolean(stockEdits[product.id]);
                const isSaving = savingId === product.id;
                const isSuccess = saveSuccessId === product.id;

                return (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Product Name & Image */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0] || product.image || "/img/placeholder.jpeg"}
                          alt={product.name}
                          className="w-12 h-14 object-cover rounded-xl border border-slate-200 bg-slate-50 flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-sm line-clamp-1">{product.name}</p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            Price: ₹{Number(product.price || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category & Subcategory */}
                    <td className="p-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-50 text-[#b13896] font-bold text-[11px]">
                        {product.category || "Uncategorized"}
                      </span>
                      {product.subCategory && (
                        <p className="text-[11px] font-semibold text-slate-500 mt-1">
                          ✨ {product.subCategory}
                        </p>
                      )}
                    </td>

                    {/* Base Flat Stock Input */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={currentBaseStock}
                          onChange={(e) => handleBaseStockChange(product.id, e.target.value)}
                          className="w-20 px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-xs outline-none focus:border-[#b13896] bg-white"
                        />
                        <span className="text-slate-400 text-[11px]">pcs</span>
                      </div>
                    </td>

                    {/* Sizing Variants Stock Inputs */}
                    <td className="p-4 max-w-[280px]">
                      {currentVariants.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {currentVariants.map((v, vIdx) => (
                            <div
                              key={vIdx}
                              className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 p-1.5 rounded-lg text-[11px]"
                            >
                              <span className="font-bold text-[#b13896]">{v.size}:</span>
                              <input
                                type="number"
                                min="0"
                                value={v.stock !== undefined ? v.stock : 0}
                                onChange={(e) => handleVariantStockChange(product.id, vIdx, e.target.value)}
                                className="w-12 px-1.5 py-0.5 rounded border border-slate-200 font-bold text-xs bg-white outline-none focus:border-[#b13896]"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">No size variants</span>
                      )}
                    </td>

                    {/* Stock Status Selector */}
                    <td className="p-4">
                      <select
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(product.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs outline-none border ${
                          currentStatus === "In Stock"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : currentStatus === "Out of Stock"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        <option value="In Stock">In Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </td>

                    {/* Action Save Button */}
                    <td className="p-4 text-right">
                      {isSuccess ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
                          <CheckCircle2 size={14} /> Saved!
                        </span>
                      ) : (
                        <button
                          onClick={() => saveProductStock(product)}
                          disabled={!hasEdits || isSaving}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                            hasEdits
                              ? "bg-[#b13896] text-white hover:bg-[#962e7f] shadow-md shadow-[#b13896]/20 cursor-pointer"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          <Save size={13} />
                          {isSaving ? "Saving..." : "Save Stock"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    No products found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockManager;
