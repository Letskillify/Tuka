import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ChevronRight, Plus, Trash, FolderPlus } from "lucide-react";
import { createProduct, updateProduct } from "../../../services/productService";
import { uploadToCloudinary } from "../../../config/cloudinary";
import ProductMediaPicker from "./ProductMediaPicker";
import { useCatalogData } from "./useCatalogData";

const ProductEditor = ({ product, onCancel, onSuccess }) => {
  const { categories, subCategories, brands, attributes: catalogAttributes, addCategory, addSubCategory, addAttribute, getSubcategoriesForCategory } = useCatalogData();
  const [showAddCatInput, setShowAddCatInput] = useState(false);
  const [newCatVal, setNewCatVal] = useState("");
  const [showAddSubCatInput, setShowAddSubCatInput] = useState(false);
  const [newSubCatVal, setNewSubCatVal] = useState("");

  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [customAttrInput, setCustomAttrInput] = useState("");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      brand: "Tuka",
      category: "",
      subCategory: "",
      material: "",
      original_price: 0,
      price: 0,
      stock: 0,
      description: "",
      care_instructions: "",
      tags: "",
      status: "Published",
      visibility: "Public",
      featuredProduct: false
    }
  });

  const selectedCategory = watch("category", "");

  const [saving, setSaving] = useState(false);
  const [media, setMedia] = useState([]);
  const [notice, setNotice] = useState("");

  // Size pricing variants state: [{ size: "S", original_price: 1500, price: 1200, stock: 10, discount: 20 }]
  const [variants, setVariants] = useState([]);
  const [newSize, setNewSize] = useState("");
  const [newOrigPrice, setNewOrigPrice] = useState("");
  const [newSelPrice, setNewSelPrice] = useState("");
  const [newStock, setNewStock] = useState("");

  // Load product if editing
  useEffect(() => {
    if (product) {
      reset({
        name: product.name || "",
        brand: product.brand || "Tuka",
        category: product.category || "",
        subCategory: product.subCategory || "",
        material: product.material || "",
        original_price: product.original_price || 0,
        price: product.price || 0,
        stock: product.stock || 0,
        description: product.description || "",
        care_instructions: product.care_instructions || "",
        tags: product.tags ? product.tags.join(", ") : "",
        status: product.status || "Published",
        visibility: product.visibility || "Public",
        featuredProduct: !!product.featuredProduct
      });
      setMedia((product.images || []).map((url, i) => ({
        id: `saved-${i}-${url}`,
        url,
        source: "cloudinary"
      })));
      setVariants(product.sizeVariants || []);
      setSelectedAttributes(product.attributes || []);
    } else {
      reset({
        name: "",
        brand: "Tuka",
        category: "",
        subCategory: "",
        material: "",
        original_price: 0,
        price: 0,
        stock: 0,
        description: "",
        care_instructions: "",
        tags: "",
        status: "Published",
        visibility: "Public",
        featuredProduct: false
      });
      setMedia([]);
      setVariants([]);
      setSelectedAttributes([]);
    }
  }, [product, reset]);

  const toggleAttribute = (attrName) => {
    setSelectedAttributes((prev) =>
      prev.includes(attrName) ? prev.filter((a) => a !== attrName) : [...prev, attrName]
    );
  };

  const handleAddCustomAttribute = async () => {
    const val = customAttrInput.trim();
    if (!val) return;
    if (!selectedAttributes.includes(val)) {
      setSelectedAttributes((prev) => [...prev, val]);
    }
    await addAttribute(val);
    setCustomAttrInput("");
  };

  const addVariant = () => {
    if (!newSize.trim() || !newSelPrice) {
      alert("Size name and Selling Price are required.");
      return;
    }
    const valOrig = Number(newOrigPrice) || 0;
    const valSel = Number(newSelPrice) || 0;
    const discount = valOrig ? Math.round(((valOrig - valSel) / valOrig) * 100) : 0;

    const newVar = {
      size: newSize.trim().toUpperCase(),
      original_price: valOrig,
      price: valSel,
      discount: discount,
      stock: Number(newStock) || 0
    };

    setVariants([...variants, newVar]);
    setNewSize("");
    setNewOrigPrice("");
    setNewSelPrice("");
    setNewStock("");
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const submit = async (values, intent = "Published") => {
    setNotice("");
    if (!values.name?.trim()) {
      setNotice("Product Name is required.");
      return;
    }
    if (!values.category) {
      setNotice("Please select a Product Category.");
      return;
    }

    setSaving(true);
    try {
      // 1. Upload new media files to Cloudinary
      const results = await Promise.allSettled(
        media.map((item) => (item.file ? uploadToCloudinary(item.file) : item.url))
      );
      const imageUrls = results
        .filter((res) => res.status === "fulfilled")
        .map((res) => res.value);

      // 2. Parse basic fields
      const orig = Number(values.original_price) || 0;
      const sel = Number(values.price) || 0;
      const disc = orig ? Math.round(((orig - sel) / orig) * 100) : 0;

      const payload = {
        name: values.name.trim(),
        brand: values.brand,
        category: values.category,
        subCategory: values.subCategory || "",
        material: values.material || "",
        original_price: orig,
        price: sel,
        discount: disc,
        stock: Number(values.stock || 0),
        description: values.description || "",
        care_instructions: values.care_instructions || "",
        tags: values.tags ? values.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        attributes: selectedAttributes,
        sizeVariants: variants,
        images: imageUrls,
        image: imageUrls[0] || "",
        stock_status: (Number(values.stock || 0) <= 0 && variants.length === 0) ? "Out of Stock" : "In Stock",
        status: intent,
        visibility: values.visibility || "Public",
        featuredProduct: !!values.featuredProduct,
      };

      // Auto-sync new category and subcategory to Firestore
      if (values.category) {
        await addCategory(values.category);
      }
      if (values.subCategory) {
        await addSubCategory(values.subCategory, values.category);
      }

      if (product?.id) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(payload, { status: intent, visibility: payload.visibility, images: imageUrls });
      }

      onSuccess();
    } catch (err) {
      setNotice(err?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit((values) => submit(values, watch("status") || "Published"))} className="pb-12 text-slate-800">
      {/* Top Header Panel */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{product ? "Edit Handloom Product" : "Add New Handloom Product"}</h1>
          <p className="mt-1 text-[13px] text-slate-400">
            Dashboard <ChevronRight className="inline mx-1" size={12} /> Products <ChevronRight className="inline mx-1" size={12} /> {product ? "Edit Product" : "New Entry"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-650 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit((values) => submit(values, "Draft"))}
            className="rounded-xl border border-[#b13896]/30 bg-white px-4 py-2 text-sm font-semibold text-[#b13896] hover:bg-[#b13896]/5 transition-colors"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#b13896] hover:bg-[#962e7f] text-white px-5 py-2 text-sm font-semibold transition-colors shadow-md shadow-[#b13896]/20"
          >
            <Plus size={14} />
            {saving ? "Saving..." : product ? "Save Changes" : "Publish Product"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_320px]">
        {/* Main Forms Section - Left */}
        <div className="space-y-6">
          {/* Section 1: Basic Information */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 border-b pb-2">Basic Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-widest block">Product Name *</span>
                <input
                  type="text"
                  placeholder="e.g. Dhaniakhali Traditional Saree"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[14px] outline-none focus:border-[#b13896] transition-colors"
                  {...register("name", { required: true })}
                />
                {errors.name && <span className="text-xs text-red-500 mt-1 block">Name is required</span>}
              </label>

              <label className="block">
                <span className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-widest block">Brand</span>
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[14px] bg-white outline-none focus:border-[#b13896] transition-colors"
                  {...register("brand")}
                >
                  {brands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Dropdown & Quick Add */}
              <div className="block">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Category *</span>
                  <button
                    type="button"
                    onClick={() => setShowAddCatInput(!showAddCatInput)}
                    className="text-[11px] text-[#b13896] font-bold hover:underline flex items-center gap-1"
                  >
                    + Add New
                  </button>
                </div>
                {showAddCatInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New Category Name"
                      value={newCatVal}
                      onChange={(e) => setNewCatVal(e.target.value)}
                      className="w-full rounded-xl border border-[#b13896] px-3 py-2 text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (newCatVal.trim()) {
                          await addCategory(newCatVal);
                          setValue("category", newCatVal.trim());
                          setNewCatVal("");
                          setShowAddCatInput(false);
                        }
                      }}
                      className="px-3 py-2 bg-[#b13896] text-white text-xs font-bold rounded-xl"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <select
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[14px] bg-white outline-none focus:border-[#b13896] transition-colors"
                    {...register("category", { required: true })}
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
                {errors.category && <span className="text-xs text-red-500 mt-1 block">Category is required</span>}
              </div>

              {/* Sub-Category Field & Datalist */}
              <div className="block">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Sub Category</span>
                  <button
                    type="button"
                    onClick={() => setShowAddSubCatInput(!showAddSubCatInput)}
                    className="text-[11px] text-[#b13896] font-bold hover:underline flex items-center gap-1"
                  >
                    + Add New
                  </button>
                </div>
                {showAddSubCatInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New Sub-category Name"
                      value={newSubCatVal}
                      onChange={(e) => setNewSubCatVal(e.target.value)}
                      className="w-full rounded-xl border border-[#b13896] px-3 py-2 text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (newSubCatVal.trim()) {
                          await addSubCategory(newSubCatVal, watch("category"));
                          setValue("subCategory", newSubCatVal.trim());
                          setNewSubCatVal("");
                          setShowAddSubCatInput(false);
                        }
                      }}
                      className="px-3 py-2 bg-[#b13896] text-white text-xs font-bold rounded-xl"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <select
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[14px] outline-none focus:border-[#b13896] transition-colors bg-white"
                    {...register("subCategory")}
                  >
                    <option value="">Select Sub-category (e.g. Saree Weave)</option>
                    {getSubcategoriesForCategory(selectedCategory).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              </div>

              <label className="block">
                <span className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-widest block">Material / Fabric Yarn</span>
                <input
                  type="text"
                  placeholder="e.g. 100s Combed Cotton, Tussar Silk, Flax Linen"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[14px] outline-none focus:border-[#b13896] transition-colors"
                  {...register("material")}
                />
              </label>
            </div>
          </section>

          {/* Section 2: Pricing & Sizing */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-800 border-b pb-2">Pricing & Size Options</h2>

            {/* Standard Pricing */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#b13896] uppercase tracking-wider">Standard Base Rates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="block">
                  <span className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider block">Original Price (MRP ₹)</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[14px] outline-none focus:border-[#b13896] transition-colors"
                    {...register("original_price")}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider block">Selling Price (₹)</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[14px] outline-none focus:border-[#b13896] transition-colors"
                    {...register("price")}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider block">Stock Quantity</span>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[14px] outline-none focus:border-[#b13896] transition-colors"
                    {...register("stock")}
                  />
                </label>
              </div>
            </div>

            {/* Dynamic Sizing Grid */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <h3 className="text-xs font-bold text-[#b13896] uppercase tracking-wider">Sizing Variants (Different Sizes, Different Prices)</h3>
                <span className="text-[11px] text-slate-400">Complete this section only if sizes have distinct rates (e.g. Bangles/Sarees with custom cuts)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <label className="block">
                  <span className="mb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Size Target</span>
                  <input
                    type="text"
                    placeholder="e.g. M, XL"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#b13896]"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Original MRP</span>
                  <input
                    type="number"
                    placeholder="MRP"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#b13896]"
                    value={newOrigPrice}
                    onChange={(e) => setNewOrigPrice(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Selling Price</span>
                  <input
                    type="number"
                    placeholder="Sale"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#b13896]"
                    value={newSelPrice}
                    onChange={(e) => setNewSelPrice(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Stock</span>
                  <input
                    type="number"
                    placeholder="Qty"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#b13896]"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="w-full py-2 rounded-lg bg-[#b13896] hover:bg-[#962e7f] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  + Add Variant
                </button>
              </div>

              {variants.length > 0 && (
                <div className="overflow-hidden border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-3">Size</th>
                        <th className="p-3">Original Price</th>
                        <th className="p-3">Selling Price</th>
                        <th className="p-3">Discount</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3 text-right">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {variants.map((v, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-bold text-[#b13896]">{v.size}</td>
                          <td className="p-3">₹{v.original_price}</td>
                          <td className="p-3 font-semibold">₹{v.price}</td>
                          <td className="p-3 text-emerald-600 font-bold">{v.discount}% Off</td>
                          <td className="p-3">{v.stock} pcs</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeVariant(idx)}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              Discard
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Media Upload */}
          <ProductMediaPicker value={media} onChange={setMedia} />

          {/* Section 4: Description & Details */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 border-b pb-2">Description & Care Info</h2>
            <label className="block">
              <span className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-widest block">Product Description</span>
              <textarea
                rows="4"
                placeholder="Integrate yarn thickness, loop density, Phulia weavers references, custom styling notes..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[14px] outline-none focus:border-[#b13896] transition-colors"
                {...register("description")}
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-widest block">Care Instructions</span>
                <input
                  type="text"
                  placeholder="e.g. Dry Clean Only, wash separately with cold water"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[14px] outline-none focus:border-[#b13896] transition-colors"
                  {...register("care_instructions")}
                />
              </label>

              <label className="block">
                <span className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-widest block">Search tags / Classifiers</span>
                <input
                  type="text"
                  placeholder="e.g. jamdani, phulia, red, blouse (comma-separated)"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[14px] outline-none focus:border-[#b13896] transition-colors"
                  {...register("tags")}
                />
              </label>
            </div>
          </section>
        </div>

        {/* Sidebar Controls - Right */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Publish Panel</h2>
            <label className="block">
              <span className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-widest block">Store Status</span>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:border-[#b13896] outline-none"
                {...register("status")}
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-widest block">Visibility</span>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:border-[#b13896] outline-none"
                {...register("visibility")}
              >
                <option value="Public">Public (Storefront)</option>
                <option value="Private">Private (Hidden)</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-650 cursor-pointer py-2 border-t mt-3">
              <input
                type="checkbox"
                {...register("featuredProduct")}
                className="w-4 h-4 rounded text-[#b13896] border-slate-200 focus:ring-[#b13896] accent-[#b13896]"
              />
              <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Featured on Home</span>
            </label>
          </section>

          {/* Product Attributes & Badges Section */}
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Product Attributes & Badges</h2>
              <span className="text-[10px] font-bold text-[#b13896] bg-rose-50 px-2 py-0.5 rounded-full">
                {selectedAttributes.length} selected
              </span>
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              Select one or multiple attributes (Deal, Hot, Sale, Trending, etc.) to showcase badges on storefront cards:
            </p>

            <div className="flex flex-wrap gap-2">
              {catalogAttributes.map((attr) => {
                const isSelected = selectedAttributes.includes(attr);
                return (
                  <button
                    type="button"
                    key={attr}
                    onClick={() => toggleAttribute(attr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? "bg-[#b13896] text-white border-[#b13896] shadow-sm shadow-[#b13896]/30"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {attr}
                  </button>
                );
              })}
            </div>

            {/* Custom Attribute Adder */}
            <div className="pt-2 flex gap-2">
              <input
                type="text"
                placeholder="Add custom tag (e.g. Festival Special)"
                value={customAttrInput}
                onChange={(e) => setCustomAttrInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomAttribute();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#b13896]"
              />
              <button
                type="button"
                onClick={handleAddCustomAttribute}
                className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#b13896] transition-colors"
              >
                Add Tag
              </button>
            </div>
          </section>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-[13px] leading-relaxed text-amber-800 shadow-sm border-dashed">
            💡 <strong>Pro-Tip:</strong> Size variations override standard prices when dynamic items are browsed. The primary image is the first card added under Media.
          </div>

          {notice && (
            <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-700 border border-red-200/50">
              ⚠️ {notice}
            </div>
          )}
        </aside>
      </div>
    </form>
  );
};

export default ProductEditor;
