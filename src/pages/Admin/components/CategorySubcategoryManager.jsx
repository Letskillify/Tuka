import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Search,
  Edit3,
  Trash2,
  Tag,
  FolderPlus,
  RefreshCw,
  X,
  CheckCircle2,
  ChevronRight,
  Filter,
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../components/Firebase";
import { useCatalogData } from "./useCatalogData";

const CategorySubcategoryManager = ({ initialTab = "Overview" }) => {
  const {
    categories,
    categoryObjects,
    subCategories,
    subCategoryObjects,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
  } = useCatalogData();

  const [activeTab, setActiveTab] = useState(initialTab); // "Overview", "Categories", "Subcategories"
  const [productCounts, setProductCounts] = useState({});
  const [subProductCounts, setSubProductCounts] = useState({});
  const [search, setSearch] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState("All");

  // Selection states for multi-delete
  const [selectedCatNames, setSelectedCatNames] = useState([]);
  const [selectedSubNames, setSelectedSubNames] = useState([]);

  // Form states for Category
  const [catName, setCatName] = useState("");
  const [catGroup, setCatGroup] = useState("Core Weaves");
  const [catDesc, setCatDesc] = useState("");
  const [editingCat, setEditingCat] = useState(null);

  // Form states for Subcategory
  const [subName, setSubName] = useState("");
  const [subParentCat, setSubParentCat] = useState("Saree");
  const [subDesc, setSubDesc] = useState("");
  const [editingSub, setEditingSub] = useState(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Listen to product counts per category & subcategory
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      const counts = {};
      const subCounts = {};
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const cat = data.category || "Uncategorized";
        const sub = data.subCategory || "General";
        counts[cat] = (counts[cat] || 0) + 1;
        subCounts[sub] = (subCounts[sub] || 0) + 1;
      });
      setProductCounts(counts);
      setSubProductCounts(subCounts);
    });
    return () => unsub();
  }, []);

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      if (editingCat) {
        if (editingCat.id) {
          await updateCategory(editingCat.id, {
            name: catName.trim(),
            group: catGroup.trim(),
            description: catDesc.trim(),
          });
          setMessage("Category updated successfully!");
        } else {
          setMessage("Default categories cannot be renamed directly. Create a new custom category.");
        }
      } else {
        await addCategory(catName.trim(), catDesc.trim(), catGroup.trim());
        setMessage("New category added successfully!");
      }
      setCatName("");
      setCatDesc("");
      setEditingCat(null);
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSubCategory = async (e) => {
    e.preventDefault();
    if (!subName.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      if (editingSub) {
        if (editingSub.id) {
          await updateSubCategory(editingSub.id, {
            name: subName.trim(),
            category: subParentCat,
            description: subDesc.trim(),
          });
          setMessage("Subcategory updated successfully!");
        } else {
          setMessage("Updated existing subcategory!");
          await addSubCategory(subName.trim(), subParentCat, subDesc.trim());
        }
      } else {
        await addSubCategory(subName.trim(), subParentCat, subDesc.trim());
        setMessage("Subcategory added successfully!");
      }
      setSubName("");
      setSubDesc("");
      setEditingSub(null);
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCat = async (catObj) => {
    if (!window.confirm(`Delete Category "${catObj.name}"?`)) return;
    if (!catObj.id) {
      alert("System default category cannot be deleted.");
      return;
    }
    await deleteCategory(catObj.id);
    setMessage(`Deleted category "${catObj.name}"`);
  };

  const handleDeleteSub = async (subObj) => {
    if (!window.confirm(`Delete Subcategory "${subObj.name}"?`)) return;
    if (!subObj.id) {
      alert("System default subcategory cannot be deleted directly.");
      return;
    }
    await deleteSubCategory(subObj.id);
    setMessage(`Deleted subcategory "${subObj.name}"`);
  };

  // ── Multi-select handlers for Categories ──
  const toggleSelectCat = (name) => {
    setSelectedCatNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const toggleSelectAllCats = () => {
    if (selectedCatNames.length === categoryObjects.length && categoryObjects.length > 0) {
      setSelectedCatNames([]);
    } else {
      setSelectedCatNames(categoryObjects.map((c) => c.name));
    }
  };

  const handleBulkDeleteCategories = async () => {
    if (selectedCatNames.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedCatNames.length} selected category(ies)?`)) return;

    setSaving(true);
    let deletedCount = 0;
    let defaultCount = 0;

    for (const name of selectedCatNames) {
      const catObj = categoryObjects.find((c) => c.name === name);
      if (catObj && catObj.id) {
        await deleteCategory(catObj.id);
        deletedCount++;
      } else {
        defaultCount++;
      }
    }

    setSelectedCatNames([]);
    setSaving(false);

    if (defaultCount > 0) {
      setMessage(`Deleted ${deletedCount} custom category(ies). (${defaultCount} system default category(ies) cannot be deleted)`);
    } else {
      setMessage(`Successfully deleted ${deletedCount} selected category(ies)!`);
    }
  };

  // ── Multi-select handlers for Subcategories ──
  const toggleSelectSub = (name) => {
    setSelectedSubNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const toggleSelectAllSubs = () => {
    if (selectedSubNames.length === filteredSubcategories.length && filteredSubcategories.length > 0) {
      setSelectedSubNames([]);
    } else {
      setSelectedSubNames(filteredSubcategories.map((s) => s.name));
    }
  };

  const handleBulkDeleteSubCategories = async () => {
    if (selectedSubNames.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedSubNames.length} selected subcategory(ies)?`)) return;

    setSaving(true);
    let deletedCount = 0;
    let defaultCount = 0;

    for (const name of selectedSubNames) {
      const subObj = subCategoryObjects.find((s) => s.name === name);
      if (subObj && subObj.id) {
        await deleteSubCategory(subObj.id);
        deletedCount++;
      } else {
        defaultCount++;
      }
    }

    setSelectedSubNames([]);
    setSaving(false);

    if (defaultCount > 0) {
      setMessage(`Deleted ${deletedCount} custom subcategory(ies). (${defaultCount} system default subcategory(ies) cannot be deleted)`);
    } else {
      setMessage(`Successfully deleted ${deletedCount} selected subcategory(ies)!`);
    }
  };

  // Subcategories filtered by category and search
  const filteredSubcategories = subCategoryObjects.filter((s) => {
    const matchesCat =
      selectedCatFilter === "All" ||
      s.category?.toLowerCase() === selectedCatFilter.toLowerCase() ||
      (!s.category && selectedCatFilter === "Saree");
    const matchesSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      (s.category && s.category.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* ── Top Header Navigation Tabs ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-[#b13896]/10 rounded-xl text-[#b13896]">
            <Layers size={18} />
          </span>
          <div>
            <h1 className="text-base font-bold text-slate-900">Category & Subcategory Manager</h1>
            <p className="text-xs text-slate-400 font-medium">
              Manage product categories, saree weaves, and subcategories live in Firestore
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl">
          {[
            { id: "Overview", label: "Overview" },
            { id: "Categories", label: `Categories (${categories.length})` },
            { id: "Subcategories", label: `Subcategories (${subCategoryObjects.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === tab.id
                  ? "bg-[#b13896] text-white shadow-md shadow-[#b13896]/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl">
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle2 size={16} className="text-emerald-600" />
            {message}
          </span>
          <button onClick={() => setMessage("")} className="text-emerald-500 hover:text-emerald-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === "Overview" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Categories</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{categories.length}</p>
              </div>
              <span className="p-3 bg-rose-50 text-[#b13896] rounded-2xl">
                <FolderPlus size={22} />
              </span>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saree Subcategories</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{subCategoryObjects.length}</p>
              </div>
              <span className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Tag size={22} />
              </span>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Saree Weaves</p>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">18+ Weaves</p>
              </div>
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Layers size={22} />
              </span>
            </div>
          </div>

          {/* Saree Subcategories Showcase Grid */}
          <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Tag size={16} className="text-[#b13896]" />
                  Featured Saree Subcategories & Weaves
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dhaniakhali Saree, Begumpuri Saree, Shantipuri Saree, Hindshree Saree and traditional Bengal weaves
                </p>
              </div>
              <button
                onClick={() => setActiveTab("Subcategories")}
                className="text-xs font-bold text-[#b13896] hover:underline flex items-center gap-1"
              >
                View All Subcategories <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {subCategoryObjects.slice(0, 12).map((sub) => {
                const count = subProductCounts[sub.name] || 0;
                return (
                  <div
                    key={sub.name}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#b13896]/30 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#b13896]/10 text-[#b13896]">
                        {sub.category || "Saree"}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-600">
                        {count} items
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{sub.name}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{sub.description || "Handloom traditional saree weave"}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ── TAB 2: CATEGORIES MANAGER ── */}
      {(activeTab === "Categories" || activeTab === "Overview") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={categoryObjects.length > 0 && selectedCatNames.length === categoryObjects.length}
                    onChange={toggleSelectAllCats}
                    className="w-4 h-4 rounded text-[#b13896] border-slate-300 focus:ring-[#b13896] cursor-pointer"
                  />
                  Select All ({selectedCatNames.length}/{categoryObjects.length})
                </label>
              </div>

              <div className="flex items-center gap-2">
                {selectedCatNames.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkDeleteCategories}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                    Delete Selected ({selectedCatNames.length})
                  </button>
                )}
                <span className="text-xs text-slate-400 font-semibold">{categories.length} total categories</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryObjects.map((cat) => {
                const count = productCounts[cat.name] || 0;
                const subCount = subCategoryObjects.filter(
                  (s) => s.category?.toLowerCase() === cat.name?.toLowerCase()
                ).length;
                const isSelected = selectedCatNames.includes(cat.name);

                return (
                  <div
                    key={cat.name}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${isSelected
                        ? "border-[#b13896] bg-rose-50/20 shadow-sm"
                        : "border-slate-100 bg-white hover:border-[#b13896]/40 hover:shadow-sm"
                      }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectCat(cat.name)}
                            className="w-4 h-4 rounded text-[#b13896] border-slate-300 focus:ring-[#b13896] cursor-pointer"
                          />
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {cat.group || "Category"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingCat(cat);
                              setCatName(cat.name || "");
                              setCatGroup(cat.group || "Core Weaves");
                              setCatDesc(cat.description || "");
                            }}
                            className="p-1 text-slate-400 hover:text-[#b13896] rounded hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit3 size={13} />
                          </button>
                          {cat.id && (
                            <button
                              onClick={() => handleDeleteCat(cat)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{cat.name}</p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{cat.description || "—"}</p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center text-xs text-slate-500 font-medium">
                      <span>{subCount} subcategories</span>
                      <span className="font-bold text-[#b13896]">{count} products</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add / Edit Category Form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editingCat ? `Edit Category` : `Add New Category`}
            </h2>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Saree, Silk Collection"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#b13896]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Group / Classification
                </label>
                <select
                  value={catGroup}
                  onChange={(e) => setCatGroup(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-[#b13896]"
                >
                  <option value="Core Weaves">Core Weaves</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Short description of this category..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#b13896]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-[#b13896] hover:bg-[#962e7f] text-white text-xs font-bold rounded-xl shadow-md shadow-[#b13896]/20 transition-all cursor-pointer"
                >
                  {saving ? "Saving..." : editingCat ? "Update Category" : "+ Add Category"}
                </button>
                {editingCat && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCat(null);
                      setCatName("");
                      setCatDesc("");
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 3: SUBCATEGORIES MANAGER ── */}
      {(activeTab === "Subcategories" || activeTab === "Overview") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subcategories Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Subcategories List</h2>
                <p className="text-xs text-slate-400">All saree subcategories mapped under parent categories</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                {selectedSubNames.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkDeleteSubCategories}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 size={13} />
                    Delete Selected ({selectedSubNames.length})
                  </button>
                )}

                <div className="relative flex-1 sm:w-48">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search subcategory..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#b13896]"
                  />
                </div>

                <select
                  value={selectedCatFilter}
                  onChange={(e) => setSelectedCatFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-[#b13896]"
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        checked={filteredSubcategories.length > 0 && selectedSubNames.length === filteredSubcategories.length}
                        onChange={toggleSelectAllSubs}
                        className="w-4 h-4 rounded text-[#b13896] border-slate-300 focus:ring-[#b13896] cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Subcategory Name</th>
                    <th className="p-3">Parent Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Live Products</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubcategories.map((sub) => {
                    const count = subProductCounts[sub.name] || 0;
                    const isSelected = selectedSubNames.includes(sub.name);

                    return (
                      <tr
                        key={sub.name}
                        className={`transition-colors ${isSelected ? "bg-rose-50/30" : "hover:bg-slate-50/50"
                          }`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectSub(sub.name)}
                            className="w-4 h-4 rounded text-[#b13896] border-slate-300 focus:ring-[#b13896] cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                          <Tag size={13} className="text-[#b13896]" />
                          {sub.name}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-[#b13896] font-semibold text-[11px]">
                            {sub.category || "Saree"}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 max-w-[200px] truncate">
                          {sub.description || "—"}
                        </td>
                        <td className="p-3 font-bold text-slate-700">{count} items</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingSub(sub);
                                setSubName(sub.name || "");
                                setSubParentCat(sub.category || "Saree");
                                setSubDesc(sub.description || "");
                              }}
                              className="p-1.5 text-slate-400 hover:text-[#b13896] rounded-lg hover:bg-slate-100"
                              title="Edit"
                            >
                              <Edit3 size={13} />
                            </button>
                            {sub.id && (
                              <button
                                onClick={() => handleDeleteSub(sub)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredSubcategories.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No subcategories found matching search filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add / Edit Subcategory Form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-fit">
            <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editingSub ? `Edit Subcategory` : `Add Subcategory (e.g. Saree Weave)`}
            </h2>

            <form onSubmit={handleSaveSubCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Subcategory Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dhaniakhali Saree, Begumpuri Saree"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#b13896]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Parent Category *
                </label>
                <select
                  value={subParentCat}
                  onChange={(e) => setSubParentCat(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-[#b13896]"
                  required
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Description / Weave Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Details about weave, region, or craft (e.g. Bengal handloom Dhaniakhali fine borders)..."
                  value={subDesc}
                  onChange={(e) => setSubDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#b13896]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-[#b13896] hover:bg-[#962e7f] text-white text-xs font-bold rounded-xl shadow-md shadow-[#b13896]/20 transition-all cursor-pointer"
                >
                  {saving ? "Saving..." : editingSub ? "Update Subcategory" : "+ Add Subcategory"}
                </button>
                {editingSub && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSub(null);
                      setSubName("");
                      setSubDesc("");
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySubcategoryManager;
