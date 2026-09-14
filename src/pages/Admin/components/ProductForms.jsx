import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { db } from "../../../components/Firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";

import { uploadToCloudinary } from "../../../config/cloudinary";
import CloudinaryImageLibrary from "./CloudinaryImageLibrary";
import { useCatalogData } from "./useCatalogData";

export const ProductForm = ({ onSuccess }) => {
  const { categories, subCategories, brands, attributes: catalogAttributes, addCategory, addSubCategory, addAttribute } = useCatalogData();
  const [showAddCatInput, setShowAddCatInput] = useState(false);
  const [newCatVal, setNewCatVal] = useState("");
  const [showAddSubCatInput, setShowAddSubCatInput] = useState(false);
  const [newSubCatVal, setNewSubCatVal] = useState("");

  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [customAttrInput, setCustomAttrInput] = useState("");

  const { register, handleSubmit, reset, setValue, watch, formState } = useForm({
    defaultValues: {
      name: "",
      category: "",
      subCategory: "",
      description: "",
      brand: "Tuka",
      original_price: 0,
      price: 0,
      material: "",
      care_instructions: "",
      stock: 0,
      tags: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedCloudinaryImages, setSelectedCloudinaryImages] = useState([]);
  
  const selectedCategory = watch("category", "");
  
  // Size Variants State: [{ size: "M", original_price: 1500, price: 1200, stock: 10 }]
  const [variants, setVariants] = useState([]);
  const [newSize, setNewSize] = useState("");
  const [newOrigPrice, setNewOrigPrice] = useState("");
  const [newSelPrice, setNewSelPrice] = useState("");
  const [newStock, setNewStock] = useState("");

  const addVariant = () => {
    if (!newSize.trim() || !newSelPrice) {
      alert("Size name and Selling Price are required to add a variant.");
      return;
    }
    const valOrig = Number(newOrigPrice) || 0;
    const valSel = Number(newSelPrice) || 0;
    const discount = valOrig ? Math.round(((valOrig - valSel) / valOrig) * 100) : 0;
    
    const variantRec = {
      size: newSize.trim().toUpperCase(),
      original_price: valOrig,
      price: valSel,
      discount: discount,
      stock: Number(newStock) || 0
    };

    setVariants([...variants, variantRec]);
    setNewSize("");
    setNewOrigPrice("");
    setNewSelPrice("");
    setNewStock("");
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const onSubmit = async (values) => {
    setError("");
    setLoading(true);
    try {
      // Auto-sync category & subcategory to Firestore
      if (values.category) {
        await addCategory(values.category);
      }
      if (values.subCategory) {
        await addSubCategory(values.subCategory, values.category);
      }

      const files = values.images?.[0] ? Array.from(values.images) : [];
      const uploadUrls = [...selectedCloudinaryImages];
      for (const file of files) {
        const url = await uploadToCloudinary(file);
        uploadUrls.push(url);
      }

      const valOrig = Number(values.original_price) || 0;
      const valSel = Number(values.price) || 0;
      const discount = valOrig ? Math.round(((valOrig - valSel) / valOrig) * 100) : 0;

      const docData = {
        name: values.name,
        category: values.category,
        subCategory: values.subCategory || "",
        description: values.description || "",
        brand: values.brand || "Tuka",
        original_price: valOrig,
        price: valSel,
        discount: discount,
        material: values.material || "",
        care_instructions: values.care_instructions || "",
        stock: Number(values.stock) || 0,
        stock_status: (Number(values.stock) || 0) <= 0 && variants.length === 0 ? "Out of Stock" : "In Stock",
        tags: values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        attributes: selectedAttributes,
        sizeVariants: variants,
        images: uploadUrls,
        image: uploadUrls[0] || "",
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "products"), docData);
      reset();
      setSelectedCloudinaryImages([]);
      setVariants([]);
      setSelectedAttributes([]);
      if (onSuccess) onSuccess();
    } catch (e) {
      setError("Upload failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Product Name *</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] focus:ring-1 focus:ring-[#b13896] outline-none transition-all text-sm"
            placeholder="e.g. Begampuri Jamdani Cotton"
            {...register("name", { required: true })}
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Category *</label>
            <button
              type="button"
              onClick={() => setShowAddCatInput(!showAddCatInput)}
              className="text-[11px] text-[#b13896] font-bold hover:underline"
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] focus:ring-1 focus:ring-[#b13896] outline-none transition-all text-sm appearance-none bg-white"
              {...register("category", { required: true })}
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Sub-category</label>
            <button
              type="button"
              onClick={() => setShowAddSubCatInput(!showAddSubCatInput)}
              className="text-[11px] text-[#b13896] font-bold hover:underline"
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] focus:ring-1 focus:ring-[#b13896] outline-none transition-all text-sm appearance-none bg-white"
              {...register("subCategory")}
            >
              <option value="">Select Sub-category (e.g. Saree Weave)</option>
              {getSubcategoriesForCategory(selectedCategory).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Brand</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] focus:ring-1 focus:ring-[#b13896] outline-none transition-all text-sm bg-white"
            {...register("brand")}
          >
            {brands.map(br => (
              <option key={br} value={br}>{br}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Material / Fabric</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] focus:ring-1 focus:ring-[#b13896] outline-none transition-all text-sm"
            placeholder={selectedCategory === "Jewellary" ? "e.g. Gold Plated, Silver, Kundan" : "e.g. 100% Organic Phulia Khadi"}
            {...register("material")}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</label>
        <textarea
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] focus:ring-1 focus:ring-[#b13896] outline-none transition-all text-sm min-h-[80px]"
          placeholder="Describe the weave, style, and history..."
          rows={3}
          {...register("description")}
        />
      </div>

      {/* Pricing and Stock fields (flat fallback) */}
      <section className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Standard Pricing (Flat Rate)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Original Price (₹)</label>
            <input
              type="number"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] text-sm bg-white outline-none"
              placeholder="0.00"
              {...register("original_price")}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Selling Price (₹)</label>
            <input
              type="number"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] text-sm bg-white outline-none"
              placeholder="0.00"
              {...register("price")}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stock Qty (Flat)</label>
            <input
              type="number"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] text-sm bg-white outline-none"
              placeholder="0"
              {...register("stock")}
            />
          </div>
        </div>
      </section>

      {/* Clothes Size Pricing Manager */}
      <section className={`bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-4 ${selectedCategory === "Jewellary" ? "hidden" : ""}`}>
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Size & Dynamic Pricing (Optional)</h4>
          <span className="text-[10px] text-gray-500 font-medium">For sizing variants (e.g. Blouses/Sarees with custom cuts)</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Size</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#b13896]"
              placeholder="e.g. S, M, L, L-40"
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Original Price (₹)</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#b13896]"
              placeholder="MRP"
              value={newOrigPrice}
              onChange={(e) => setNewOrigPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Selling Price (₹)</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#b13896]"
              placeholder="Sale Price"
              value={newSelPrice}
              onChange={(e) => setNewSelPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Stock</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#b13896]"
              placeholder="Stock"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="w-full py-2 bg-[#b13896] hover:bg-[#962e7f] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            + Size Variant
          </button>
        </div>

        {variants.length > 0 && (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase select-none">
                <tr>
                  <th className="p-3">Size</th>
                  <th className="p-3">Original Price</th>
                  <th className="p-3">Selling Price</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {variants.map((v, index) => (
                  <tr key={index} className="bg-white text-slate-700">
                    <td className="p-3 font-semibold text-[#b13896]">{v.size}</td>
                    <td className="p-3">₹{v.original_price}</td>
                    <td className="p-3 font-bold">₹{v.price}</td>
                    <td className="p-3 text-emerald-600 font-bold">{v.discount}% Off</td>
                    <td className="p-3">{v.stock}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Tags</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] focus:ring-1 focus:ring-[#b13896] outline-none transition-all text-sm"
            placeholder="e.g. handloom, cotton, festive, jamdani (comma-separated)"
            {...register("tags")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Care Instructions</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] focus:ring-1 focus:ring-[#b13896] outline-none transition-all text-sm"
            placeholder={selectedCategory === "Jewellary" ? "e.g. Keep away from water and perfume" : "e.g. Dry Clean for cotton & silks, mild hand wash"}
            {...register("care_instructions")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Product Images</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="file"
              multiple
              accept="image/*"
              className="w-full px-4 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-[#b13896] transition-colors text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#b13896]/10 file:text-[#b13896] cursor-pointer"
              {...register("images")}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#b13896] text-[#b13896] text-sm font-semibold hover:bg-[#b13896]/5 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Choose from Cloudinary
          </button>
        </div>

        {selectedCloudinaryImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedCloudinaryImages.map((url, index) => (
              <div key={index} className="relative group">
                <img src={url} alt="Selected" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                <button
                  type="button"
                  onClick={() => setSelectedCloudinaryImages(prev => prev.filter((_, i) => i !== index))}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showLibrary && (
        <CloudinaryImageLibrary
          onSelect={(url) => {
            setSelectedCloudinaryImages(prev => [...prev, url]);
            setShowLibrary(false);
          }}
          onClose={() => setShowLibrary(false)}
        />
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {formState.isSubmitted && !loading && !error && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 animate-in fade-in slide-in-from-right-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Product Created Successfully
          </span>
        )}
        {error && (
          <span className="text-xs font-bold text-red-600">
            Error: {error}
          </span>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-2.5 rounded-xl bg-[#b13896] text-white text-sm font-bold shadow-lg shadow-[#b13896]/20 hover:bg-[#962e7f] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:translate-y-0 cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Uploading...
            </span>
          ) : "Publish Product"}
        </button>
      </div>
    </form>
  );
};

export const EditProductForm = ({ product, onSuccess }) => {
  const { categories, getSubcategoriesForCategory, brands } = useCatalogData();
  const { register, handleSubmit, reset, watch, formState } = useForm({
    defaultValues: {
      name: product?.name || "",
      category: product?.category || "",
      subCategory: product?.subCategory || "",
      description: product?.description || "",
      brand: product?.brand || "Tuka",
      original_price: product?.original_price || 0,
      price: product?.price || 0,
      material: product?.material || "",
      care_instructions: product?.care_instructions || "",
      stock: product?.stock || 0,
      tags: product?.tags ? product.tags.join(", ") : "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedCloudinaryImages, setSelectedCloudinaryImages] = useState(product?.images || []);
  const [variants, setVariants] = useState(product?.sizeVariants || []);
  
  const selectedCategory = watch("category", product?.category || "");

  const [newSize, setNewSize] = useState("");
  const [newOrigPrice, setNewOrigPrice] = useState("");
  const [newSelPrice, setNewSelPrice] = useState("");
  const [newStock, setNewStock] = useState("");

  useEffect(() => {
    if (product) {
      reset({
        name: product.name || "",
        category: product.category || "",
        subCategory: product.subCategory || "",
        description: product.description || "",
        brand: product.brand || "Tuka",
        original_price: product.original_price || 0,
        price: product.price || 0,
        material: product.material || "",
        care_instructions: product.care_instructions || "",
        stock: product.stock || 0,
        tags: product.tags ? product.tags.join(", ") : "",
      });
      setSelectedCloudinaryImages(product.images || []);
      setVariants(product.sizeVariants || []);
    }
  }, [product, reset]);

  const addVariant = () => {
    if (!newSize.trim() || !newSelPrice) {
      alert("Size name and Selling Price are required to add a variant.");
      return;
    }
    const valOrig = Number(newOrigPrice) || 0;
    const valSel = Number(newSelPrice) || 0;
    const discount = valOrig ? Math.round(((valOrig - valSel) / valOrig) * 100) : 0;

    const variantRec = {
      size: newSize.trim().toUpperCase(),
      original_price: valOrig,
      price: valSel,
      discount: discount,
      stock: Number(newStock) || 0
    };

    setVariants([...variants, variantRec]);
    setNewSize("");
    setNewOrigPrice("");
    setNewSelPrice("");
    setNewStock("");
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const onSubmit = async (values) => {
    if (!product?.id) return;
    setError("");
    setLoading(true);
    try {
      let uploadUrls = [...selectedCloudinaryImages];
      const files = values.images?.[0] ? Array.from(values.images) : [];
      if (files.length > 0) {
        for (const file of files) {
          const url = await uploadToCloudinary(file);
          uploadUrls.push(url);
        }
      }

      const valOrig = Number(values.original_price) || 0;
      const valSel = Number(values.price) || 0;
      const discount = valOrig ? Math.round(((valOrig - valSel) / valOrig) * 100) : 0;

      const updateData = {
        name: values.name,
        category: values.category,
        subCategory: values.subCategory || "",
        description: values.description || "",
        brand: values.brand || "Tuka",
        original_price: valOrig,
        price: valSel,
        discount: discount,
        material: values.material || "",
        care_instructions: values.care_instructions || "",
        stock: Number(values.stock) || 0,
        stock_status: (Number(values.stock) || 0) <= 0 && variants.length === 0 ? "Out of Stock" : "In Stock",
        tags: values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        sizeVariants: variants,
        images: uploadUrls,
        image: uploadUrls[0] || product.image || "",
      };

      await updateDoc(doc(db, "products", product.id), updateData);
      if (onSuccess) {
        onSuccess();
      }
    } catch (e) {
      setError("Update failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Product Name</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] focus:ring-1 focus:ring-[#b13896] outline-none transition-all text-sm"
            placeholder="e.g. Begampuri Jamdani Cotton"
            {...register("name", { required: true })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Category</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] focus:ring-1 focus:ring-[#b13896] outline-none transition-all text-sm appearance-none bg-white"
            {...register("category", { required: true })}
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Sub-category</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] focus:ring-1 focus:ring-[#b13896] outline-none transition-all text-sm appearance-none bg-white"
            {...register("subCategory")}
          >
            <option value="">Select Sub-category (e.g. Saree Weave)</option>
            {getSubcategoriesForCategory(selectedCategory).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Brand</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] focus:ring-1 focus:ring-[#b13896] outline-none transition-all text-sm bg-white"
            {...register("brand")}
          >
            {DEFAULT_BRANDS.map(br => (
              <option key={br} value={br}>{br}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Material / Fabric</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] focus:ring-1 focus:ring-[#b13896] outline-none transition-all text-sm"
            placeholder={selectedCategory === "Jewellary" ? "e.g. Gold Plated, Silver, Kundan" : "e.g. 100% Organic Phulia Khadi"}
            {...register("material")}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</label>
        <textarea
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] focus:ring-1 focus:ring-[#b13896] outline-none transition-all text-sm min-h-[80px]"
          placeholder="Describe the weave, style, and history..."
          rows={3}
          {...register("description")}
        />
      </div>

      {/* Pricing and Stock fields (flat fallback) */}
      <section className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Standard Pricing (Flat Rate)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Original Price (₹)</label>
            <input
              type="number"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] text-sm bg-white outline-none"
              placeholder="0.00"
              {...register("original_price")}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Selling Price (₹)</label>
            <input
              type="number"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] text-sm bg-white outline-none"
              placeholder="0.00"
              {...register("price")}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stock Qty (Flat)</label>
            <input
              type="number"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] text-sm bg-white outline-none"
              placeholder="0"
              {...register("stock")}
            />
          </div>
        </div>
      </section>

      {/* Clothes Size Pricing Manager */}
      <section className={`bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-4 ${selectedCategory === "Jewellary" ? "hidden" : ""}`}>
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Size & Dynamic Pricing (Optional)</h4>
          <span className="text-[10px] text-gray-500 font-medium">For sizing variants (e.g. Blouses/Sarees with custom cuts)</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Size</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#b13896]"
              placeholder="e.g. S, M, L, L-40"
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Original Price (₹)</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#b13896]"
              placeholder="MRP"
              value={newOrigPrice}
              onChange={(e) => setNewOrigPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Selling Price (₹)</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#b13896]"
              placeholder="Sale Price"
              value={newSelPrice}
              onChange={(e) => setNewSelPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Stock</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#b13896]"
              placeholder="Stock"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="w-full py-2 bg-[#b13896] hover:bg-[#962e7f] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            + Size Variant
          </button>
        </div>

        {variants.length > 0 && (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase select-none">
                <tr>
                  <th className="p-3">Size</th>
                  <th className="p-3">Original Price</th>
                  <th className="p-3">Selling Price</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {variants.map((v, index) => (
                  <tr key={index} className="bg-white text-slate-700">
                    <td className="p-3 font-semibold text-[#b13896]">{v.size}</td>
                    <td className="p-3">₹{v.original_price}</td>
                    <td className="p-3 font-bold">₹{v.price}</td>
                    <td className="p-3 text-emerald-600 font-bold">{v.discount}% Off</td>
                    <td className="p-3">{v.stock}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Tags</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] focus:ring-1 focus:ring-[#b13896] outline-none transition-all text-sm"
            placeholder="e.g. handloom, cotton, festive, jamdani (comma-separated)"
            {...register("tags")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Care Instructions</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#b13896] focus:ring-1 focus:ring-[#b13896] outline-none transition-all text-sm"
            placeholder={selectedCategory === "Jewellary" ? "e.g. Keep away from water and perfume" : "e.g. Dry Clean for cotton & silks, mild hand wash"}
            {...register("care_instructions")}
          />
        </div>
      </div>

      <div className="space-y-2 col-span-full">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Update Images (Optional)</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="file"
              multiple
              accept="image/*"
              className="w-full px-4 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-[#b13896] transition-colors text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#b13896]/10 file:text-[#b13896] cursor-pointer"
              {...register("images")}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#b13896] text-[#b13896] text-sm font-semibold hover:bg-[#b13896]/5 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Choose from Cloudinary
          </button>
        </div>

        {selectedCloudinaryImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedCloudinaryImages.map((url, index) => (
              <div key={index} className="relative group">
                <img src={url} alt="Selected" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                <button
                  type="button"
                  onClick={() => setSelectedCloudinaryImages(prev => prev.filter((_, i) => i !== index))}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showLibrary && (
        <CloudinaryImageLibrary
          onSelect={(url) => {
            setSelectedCloudinaryImages(prev => [...prev, url]);
            setShowLibrary(false);
          }}
          onClose={() => setShowLibrary(false)}
        />
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {error && (
          <span className="text-xs font-bold text-red-600">
            {error}
          </span>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-2.5 rounded-xl bg-[#b13896] text-white text-sm font-bold shadow-lg shadow-[#b13896]/20 hover:bg-[#962e7f] transition-all disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Saving Changes..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
};
