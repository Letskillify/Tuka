import React, { useState, useEffect } from 'react';
import { db } from '../components/Firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Search, Heart, ShoppingBag, Eye, ChevronRight, Loader2, SlidersHorizontal, X } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../components/useAuth';
import { useStore } from '../hooks/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import QuickView from '../components/QuickView';
import Breadcrumb from '../components/Breadcrumb';
import AttributeBadges from '../components/AttributeBadges';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [cartLoadings, setCartLoadings] = useState({});
  const [wishlistLoadings, setWishlistLoadings] = useState({});
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters State
  const [maxPriceFilter, setMaxPriceFilter] = useState(50000);
  const [minPriceFilter, setMinPriceFilter] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState('All');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const materials = ['All', 'Cotton', 'Silk', 'Khadi', 'Linen', 'Jamdani'];
  const categories = [
    'All', 
    'Handloom Saree', 
    'Designer Blouse', 
    'Boutique Collection', 
    'New Arrivals'
  ];

  // Sync state from URL search parameters
  useEffect(() => {
    const categoryQuery = searchParams.get('category') || searchParams.get('cat');
    const searchQuery = searchParams.get('q') || searchParams.get('search') || searchParams.get('query');
    const sortQuery = searchParams.get('sort') || searchParams.get('sortBy');
    const quickviewId = searchParams.get('quickview');
    const minP = searchParams.get('minPrice');
    const maxP = searchParams.get('maxPrice');
    const stockP = searchParams.get('inStock');
    const matP = searchParams.get('material');

    if (categoryQuery) {
      setSelectedCategory(categoryQuery);
    } else if (!searchParams.has('cat') && !searchParams.has('category')) {
      setSelectedCategory('All');
    }

    if (searchQuery !== null) setSearchTerm(searchQuery);
    if (sortQuery) setSortBy(sortQuery);
    if (minP) setMinPriceFilter(Number(minP));
    if (maxP) setMaxPriceFilter(Number(maxP));
    if (stockP === 'true') setInStockOnly(true);
    if (matP) setSelectedMaterial(matP);

    if (quickviewId && products.length > 0) {
      const p = products.find(prod => String(prod.id) === String(quickviewId));
      if (p) setSelectedProduct(p);
    }
  }, [searchParams, products]);

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    const params = new URLSearchParams(searchParams);
    if (cat && cat !== 'All') params.set('cat', cat);
    else { params.delete('cat'); params.delete('category'); }
    setSearchParams(params, { replace: true });
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
    const params = new URLSearchParams(searchParams);
    if (term) params.set('q', term);
    else { params.delete('q'); params.delete('search'); params.delete('query'); }
    setSearchParams(params, { replace: true });
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    const params = new URLSearchParams(searchParams);
    if (sort && sort !== 'newest') params.set('sort', sort);
    else { params.delete('sort'); params.delete('sortBy'); }
    setSearchParams(params, { replace: true });
  };

  const handlePriceChange = (minVal, maxVal) => {
    setMinPriceFilter(minVal);
    setMaxPriceFilter(maxVal);
    const params = new URLSearchParams(searchParams);
    if (minVal > 0) params.set('minPrice', minVal); else params.delete('minPrice');
    if (maxVal < 50000) params.set('maxPrice', maxVal); else params.delete('maxPrice');
    setSearchParams(params, { replace: true });
  };

  const handleStockToggle = (val) => {
    setInStockOnly(val);
    const params = new URLSearchParams(searchParams);
    if (val) params.set('inStock', 'true'); else params.delete('inStock');
    setSearchParams(params, { replace: true });
  };

  const handleMaterialChange = (mat) => {
    setSelectedMaterial(mat);
    const params = new URLSearchParams(searchParams);
    if (mat && mat !== 'All') params.set('material', mat); else params.delete('material');
    setSearchParams(params, { replace: true });
  };

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSearchTerm('');
    setSortBy('newest');
    setMinPriceFilter(0);
    setMaxPriceFilter(50000);
    setInStockOnly(false);
    setSelectedMaterial('All');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handleQuickViewOpen = (product) => {
    setSelectedProduct(product);
    const params = new URLSearchParams(searchParams);
    if (product) {
      params.set('quickview', product.id);
    } else {
      params.delete('quickview');
    }
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const dbProducts = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setProducts(dbProducts);
        setLoading(false);
      },
      (error) => {
        console.error("Real-time products listen error:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const { addToCart, addToWishlist, isInCart, isInWishlist } = useStore();

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    setCartLoadings(prev => ({ ...prev, [product.id]: true }));
    try {
      const defaultVariant = product.sizeVariants && product.sizeVariants.length > 0 
        ? (product.sizeVariants.find(v => Number(v.stock || 0) > 0) || product.sizeVariants[0])
        : null;

      const productToCart = {
        ...product,
        id: defaultVariant ? `${product.id}_${defaultVariant.size}` : product.id,
        name: defaultVariant ? `${product.name} (${defaultVariant.size})` : product.name,
        price: defaultVariant ? Number(defaultVariant.price) : Number(product.price),
        original_price: defaultVariant ? Number(defaultVariant.original_price) : Number(product.original_price),
        stock: defaultVariant ? Number(defaultVariant.stock) : Number(product.stock),
        selectedSize: defaultVariant ? defaultVariant.size : null
      };

      await addToCart(productToCart);
    } finally {
      setCartLoadings(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const handleAddToWishlist = async (e, product) => {
    e.stopPropagation();
    setWishlistLoadings(prev => ({ ...prev, [product.id]: true }));
    try {
      await addToWishlist(product);
    } finally {
      setWishlistLoadings(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (p.name || '').toLowerCase().includes(term) ||
      (p.subCategory || '').toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term) ||
      (p.tags || []).some(t => String(t).toLowerCase().includes(term));
    
    let matchesCategory = false;
    if (selectedCategory === 'All') {
      matchesCategory = true;
    } else {
      const targetCat = selectedCategory.toLowerCase().replace(/[^a-z0-9]/g, '');
      const prodCat = (p.category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const prodSubCat = (p.subCategory || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const prodName = (p.name || '').toLowerCase();
      const prodDesc = (p.description || '').toLowerCase();
      const prodTags = (p.tags || []).map(t => String(t).toLowerCase());

      matchesCategory = prodCat.includes(targetCat) ||
                        targetCat.includes(prodCat) ||
                        prodSubCat.includes(targetCat) ||
                        targetCat.includes(prodSubCat) ||
                        prodName.includes(selectedCategory.toLowerCase()) ||
                        prodDesc.includes(selectedCategory.toLowerCase()) ||
                        prodTags.some(t => t.includes(selectedCategory.toLowerCase()));
    }

    const itemPrice = Number(p.price || 0);
    const matchesPrice = itemPrice >= minPriceFilter && itemPrice <= maxPriceFilter;
    const matchesStock = !inStockOnly || (Number(p.stock || 0) > 0);

    let matchesMaterial = true;
    if (selectedMaterial !== 'All') {
      const mat = selectedMaterial.toLowerCase();
      const prodMat = (p.material || '').toLowerCase();
      const prodName = (p.name || '').toLowerCase();
      matchesMaterial = prodMat.includes(mat) || prodName.includes(mat);
    }

    return matchesSearch && matchesCategory && matchesPrice && matchesStock && matchesMaterial;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return Number(a.price || 0) - Number(b.price || 0);
    if (sortBy === 'price-high') return Number(b.price || 0) - Number(a.price || 0);
    return 0;
  });

  return (
    <div className="relative min-h-screen bg-[#FDFAF5] font-sans text-[#161114]">
      
      {selectedProduct && <QuickView product={selectedProduct} onClose={() => handleQuickViewOpen(null)} />}

      {/* Shared Hero Header */}
      <Breadcrumb 
        title="Our Collection"
        subtitle="Discover our curated selection of handcrafted Bengal sarees and designer blouses, woven with timeless tradition."
        bgImage="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1600"
        links={[
          { name: 'Home', href: '/?ref=shop#hero' },
          { name: 'Shop', href: '/shop?cat=all#products', active: true }
        ]}
      />

      <div id="products" className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12">
        
        {/* Editorial Filter Header Bar */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-black/5 shadow-sm mb-10 space-y-6">
          
          {/* Categories - Luxury Scrollable Pills */}
          <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-5 py-2.5 rounded-full text-[12px] font-bold tracking-[0.18em] uppercase transition-all duration-300 whitespace-nowrap cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-[#b13896] text-white shadow-lg shadow-[#b13896]/20 scale-105' 
                    : 'bg-[#F8F4EF] text-[#4a3f44] border border-[#e5d5df]/40 hover:border-[#b13896] hover:text-[#b13896] hover:bg-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search + Filter Toggle + Sort + Results Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#e5d5df]/30">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b13896]" size={16} />
              <input 
                type="text" 
                placeholder="Search sarees, khadi, Jamdani, designer blouses…" 
                className="w-full bg-[#F8F4EF] border border-[#e5d5df]/60 rounded-full pl-11 pr-10 py-3 text-[13px] text-[#161114] outline-none focus:border-[#b13896] focus:bg-white transition-all placeholder:text-[#4a3f44]/40"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => handleSearchChange('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4a3f44]/50 hover:text-[#161114] transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-[#b13896]/10 text-[#b13896] rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#b13896] hover:text-white transition-all"
              >
                <SlidersHorizontal size={14} />
                Filters
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#4a3f44]/60">Sort:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="bg-[#F8F4EF] border border-[#e5d5df]/60 rounded-full px-4 py-2.5 text-[12px] text-[#161114] outline-none focus:border-[#b13896] transition-all cursor-pointer appearance-none pr-8 font-bold tracking-wider uppercase"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23b13896' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="newest">Newest Additions</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              <span className="text-[12px] font-bold text-[#b13896] bg-[#b13896]/10 px-3.5 py-1.5 rounded-full hidden sm:inline-block">
                {sortedProducts.length} Pieces
              </span>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {(selectedCategory !== 'All' || searchTerm || selectedMaterial !== 'All' || inStockOnly || minPriceFilter > 0 || maxPriceFilter < 50000) && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#e5d5df]/30">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#4a3f44]/60 mr-1">Active Filters:</span>
              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#b13896]/10 text-[#b13896] text-xs font-bold rounded-full">
                  Category: {selectedCategory}
                  <X size={12} className="cursor-pointer hover:scale-110" onClick={() => handleCategoryChange('All')} />
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#b13896]/10 text-[#b13896] text-xs font-bold rounded-full">
                  Search: "{searchTerm}"
                  <X size={12} className="cursor-pointer hover:scale-110" onClick={() => handleSearchChange('')} />
                </span>
              )}
              {selectedMaterial !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#b13896]/10 text-[#b13896] text-xs font-bold rounded-full">
                  Material: {selectedMaterial}
                  <X size={12} className="cursor-pointer hover:scale-110" onClick={() => handleMaterialChange('All')} />
                </span>
              )}
              {inStockOnly && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#b13896]/10 text-[#b13896] text-xs font-bold rounded-full">
                  In Stock Only
                  <X size={12} className="cursor-pointer hover:scale-110" onClick={() => handleStockToggle(false)} />
                </span>
              )}
              {(minPriceFilter > 0 || maxPriceFilter < 50000) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#b13896]/10 text-[#b13896] text-xs font-bold rounded-full">
                  Price: ₹{minPriceFilter.toLocaleString()} - ₹{maxPriceFilter.toLocaleString()}
                  <X size={12} className="cursor-pointer hover:scale-110" onClick={() => handlePriceChange(0, 50000)} />
                </span>
              )}
              <button 
                onClick={resetAllFilters}
                className="text-[11px] font-bold text-[#b13896] hover:underline ml-2 uppercase tracking-wider"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Main Grid Section: Sidebar (Desktop) + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 bg-white rounded-2xl p-6 border border-black/5 shadow-sm space-y-8 sticky top-28">
            <div className="flex items-center justify-between border-b border-[#e5d5df]/40 pb-4">
              <h3 className="text-sm font-bold text-[#161114] uppercase tracking-widest flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[#b13896]" />
                Filter Collection
              </h3>
              <button onClick={resetAllFilters} className="text-[11px] font-bold text-[#b13896] hover:underline uppercase tracking-wider">
                Reset
              </button>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#161114]">Price Range (₹)</h4>
              <div className="space-y-3">
                <input 
                  type="range"
                  min="0"
                  max="50000"
                  step="500"
                  value={maxPriceFilter}
                  onChange={(e) => handlePriceChange(minPriceFilter, Number(e.target.value))}
                  className="w-full accent-[#b13896] cursor-pointer"
                />
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-[#161114]">
                  <div className="bg-[#F8F4EF] px-3 py-1.5 rounded-lg border border-[#e5d5df]/60 flex-1 text-center">
                    Min: ₹{minPriceFilter.toLocaleString()}
                  </div>
                  <span className="text-[#4a3f44]/40">-</span>
                  <div className="bg-[#F8F4EF] px-3 py-1.5 rounded-lg border border-[#e5d5df]/60 flex-1 text-center">
                    Max: ₹{maxPriceFilter.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Fabric / Material Filter */}
            <div className="space-y-3 border-t border-[#e5d5df]/40 pt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#161114]">Fabric / Yarn</h4>
              <div className="flex flex-wrap gap-2">
                {materials.map((mat) => (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => handleMaterialChange(mat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      selectedMaterial.toLowerCase() === mat.toLowerCase()
                        ? 'bg-[#b13896] text-white shadow-sm'
                        : 'bg-[#F8F4EF] text-[#4a3f44] hover:bg-[#b13896]/10 hover:text-[#b13896]'
                    }`}
                  >
                    {mat}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock Availability */}
            <div className="border-t border-[#e5d5df]/40 pt-6">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-bold uppercase tracking-wider text-[#161114]">In Stock Only</span>
                <input 
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => handleStockToggle(e.target.checked)}
                  className="w-4 h-4 accent-[#b13896] cursor-pointer rounded"
                />
              </label>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="lg:col-span-9">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-[#f7ebf2] rounded-xl mb-3" />
                    <div className="h-3 bg-[#f7ebf2] rounded w-3/4 mb-2" />
                    <div className="h-3 bg-[#f7ebf2] rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {sortedProducts.map((product, index) => {
                  const defaultVariant = product.sizeVariants && product.sizeVariants.length > 0
                    ? (product.sizeVariants.find(v => Number(v.stock || 0) > 0) || product.sizeVariants[0])
                    : null;
                  
                  const price = defaultVariant ? Number(defaultVariant.price) : Number(product.price || 0);
                  const original_price = defaultVariant ? Number(defaultVariant.original_price) : Number(product.original_price || 0);
                  const stock = defaultVariant ? Number(defaultVariant.stock || 0) : Number(product.stock || 0);
                  
                  const isSale = original_price > price;
                  const hasVariants = product.sizeVariants && product.sizeVariants.length > 0;
                  const isItemInCart = isInCart(defaultVariant ? `${product.id}_${defaultVariant.size}` : product.id);

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: (index % 3) * 0.05 }}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/product/${product.id}?ref=shop#product-details`)}
                    >
                      {/* Image */}
                      <div className="aspect-[3/4] overflow-hidden bg-[#f7ebf2] mb-3 relative rounded-xl border border-black/5">
                        <img 
                          src={product.image || product.images?.[0]} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        
                        {/* Badges & Attributes */}
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 max-w-[70%]">
                          <AttributeBadges attributes={product.attributes} />
                          {isSale && (
                            <span className="bg-[#b13896] text-white px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider w-max">
                              -{Math.round(((original_price - price) / original_price) * 100)}%
                            </span>
                          )}
                          {stock <= 0 && (
                            <span className="bg-[#161114] text-white px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider w-max">
                              Sold Out
                            </span>
                          )}
                        </div>

                        {/* Wishlist Button */}
                        <button 
                          onClick={(e) => handleAddToWishlist(e, product)} 
                          disabled={wishlistLoadings[product.id]}
                          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 cursor-pointer ${
                            isInWishlist(product.id) 
                              ? 'bg-[#b13896] text-white' 
                              : 'bg-white/80 backdrop-blur-sm text-[#161114] opacity-0 group-hover:opacity-100 hover:bg-[#b13896] hover:text-white'
                          }`}
                        >
                          {wishlistLoadings[product.id] ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Heart size={14} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                          )}
                        </button>

                        {/* Quick View Button */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleQuickViewOpen(product); }} 
                          className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#161114] opacity-0 group-hover:opacity-100 hover:bg-[#b13896] hover:text-white transition-all z-10 cursor-pointer"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Add to Cart Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
                          <button 
                            onClick={(e) => stock > 0 && handleAddToCart(e, product)}
                            disabled={stock <= 0 || cartLoadings[product.id]}
                            className={`w-full py-2.5 text-[12px] tracking-wider font-bold uppercase flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer ${
                              stock <= 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                              : isItemInCart 
                              ? 'bg-[#b13896] text-white' 
                              : 'bg-[#161114] text-white hover:bg-[#b13896]'
                            }`}
                          >
                            {cartLoadings[product.id] ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <ShoppingBag size={12} />
                            )}
                            {stock <= 0 ? 'Sold Out' : isItemInCart ? 'In Cart' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="space-y-1 px-0.5">
                        <p className="text-[9px] tracking-[0.2em] font-bold uppercase text-[#4a3f44]">{product.brand || "House of Tuka"}</p>
                        <h3 className="font-serif text-[15px] text-[#161114] group-hover:text-[#b13896] transition-colors leading-snug line-clamp-1">{product.name}</h3>
                        <div className="flex items-baseline gap-2 pt-0.5">
                          <span className="text-[14px] font-medium text-[#161114]">₹{Number(price).toLocaleString()}</span>
                          {isSale && (
                            <span className="text-[12px] text-[#4a3f44]/50 line-through">₹{Number(original_price).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-2xl border border-black/5">
                <ShoppingBag size={40} strokeWidth={1} className="mx-auto text-[#b13896]/20 mb-4" />
                <p className="font-serif text-xl text-[#4a3f44]/60 mb-4">No products matching selected criteria</p>
                <button 
                  onClick={resetAllFilters} 
                  className="text-[12px] font-bold text-[#b13896] hover:text-[#161114] transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Slide-over Drawer */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[85%] max-w-md bg-white z-50 p-6 overflow-y-auto space-y-8 flex flex-col justify-between shadow-2xl lg:hidden"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#e5d5df]/40 pb-4">
                  <h3 className="text-sm font-bold text-[#161114] uppercase tracking-widest flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-[#b13896]" />
                    Filter Collection
                  </h3>
                  <button 
                    onClick={() => setIsFilterDrawerOpen(false)}
                    className="p-2 rounded-full border border-[#e5d5df]/60 text-[#161114]"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#161114]">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          selectedCategory.toLowerCase() === cat.toLowerCase()
                            ? 'bg-[#b13896] text-white shadow-sm'
                            : 'bg-[#F8F4EF] text-[#4a3f44]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-4 border-t border-[#e5d5df]/40 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#161114]">Price Range (₹)</h4>
                  <div className="space-y-3">
                    <input 
                      type="range"
                      min="0"
                      max="50000"
                      step="500"
                      value={maxPriceFilter}
                      onChange={(e) => handlePriceChange(minPriceFilter, Number(e.target.value))}
                      className="w-full accent-[#b13896] cursor-pointer"
                    />
                    <div className="flex items-center justify-between gap-3 text-xs font-bold text-[#161114]">
                      <div className="bg-[#F8F4EF] px-3 py-1.5 rounded-lg border border-[#e5d5df]/60 flex-1 text-center">
                        Min: ₹{minPriceFilter.toLocaleString()}
                      </div>
                      <span className="text-[#4a3f44]/40">-</span>
                      <div className="bg-[#F8F4EF] px-3 py-1.5 rounded-lg border border-[#e5d5df]/60 flex-1 text-center">
                        Max: ₹{maxPriceFilter.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fabric / Material Filter */}
                <div className="space-y-3 border-t border-[#e5d5df]/40 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#161114]">Fabric / Yarn</h4>
                  <div className="flex flex-wrap gap-2">
                    {materials.map((mat) => (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => handleMaterialChange(mat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          selectedMaterial.toLowerCase() === mat.toLowerCase()
                            ? 'bg-[#b13896] text-white shadow-sm'
                            : 'bg-[#F8F4EF] text-[#4a3f44]'
                        }`}
                      >
                        {mat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Availability */}
                <div className="border-t border-[#e5d5df]/40 pt-6">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#161114]">In Stock Only</span>
                    <input 
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => handleStockToggle(e.target.checked)}
                      className="w-4 h-4 accent-[#b13896] cursor-pointer rounded"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-[#e5d5df]/40 flex gap-3">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="flex-1 py-3 border border-[#e5d5df] rounded-xl text-xs font-bold uppercase tracking-wider text-[#161114]"
                >
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="flex-1 py-3 bg-[#b13896] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#b13896]/20"
                >
                  Apply Filters
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }` }} />
    </div>
  );
};

export default Shop;