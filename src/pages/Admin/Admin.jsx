// Admin.jsx
import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../components/Firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  LayoutDashboard,
  ShoppingBag,
  List,
  Users,
  Image,
  LogOut,
  Plus,
  Package,
  Activity,
  Bell,
  ChevronRight,
  Gem,
  Search,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Grid2X2,
  Tags,
  Layers,
  Layers3,
  Globe2,
  TicketPercent,
  Star,
  FileText,
  Images,
  Settings,
  Truck,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import AdminAuth from "./AdminAuth";
import MetricCards from "./components/MetricCards";
import ProductsTable from "./components/ProductsTable";
import OrdersTable from "./components/OrdersTable";
import UsersTable from "./components/UsersTable";
import CategoriesOverview from "./components/CategoriesOverview";
import { ProductForm, EditProductForm } from "./components/ProductForms";
import MediaLibrary from "./components/MediaLibrary";
import DashboardOverview from "./components/DashboardOverview";
import ProductEditor from "./components/ProductEditor";
import CatalogManager from "./components/CatalogManager";
import CategorySubcategoryManager from "./components/CategorySubcategoryManager";
import StockManager from "./components/StockManager";
import HomepageManager from "./components/HomepageManager";
import { listenToProducts, removeProduct, sortNewestProducts } from "../../services/productService";

// ─── Sidebar Items ─────────────────────────────────────
const sidebarItems = [
  { name: "Dashboard", icon: LayoutDashboard, desc: "Overview" },
  { name: "Products", icon: Package, desc: "Catalog" },
  { name: "Stock Manager", icon: Layers, desc: "Stock Control" },
  { name: "Orders", icon: ShoppingBag, desc: "Transactions" },
  { name: "Categories", icon: List, desc: "Structure" },
  { name: "Homepage Manager", icon: Image, desc: "Layout & Banners" },
  { name: "Users", icon: Users, desc: "Accounts" },
  { name: "Media", icon: Image, desc: "Assets" },
];

// ─── Metric Cards for admin (no revenue) ────────────────────────────────────
const metricCards = (productCount, userCount, orderCount) => [
  { label: "Active Products", value: productCount, hint: "Across all categories", icon: Package, color: "crimson" },
  { label: "Total Users", value: userCount, hint: "Registered accounts", icon: Users, color: "blue" },
  { label: "Live Orders", value: orderCount, hint: "Orders from database", icon: ShoppingBag, color: "blue" },
  { label: "Pending Tasks", value: "—", hint: "No new alerts", icon: Activity, color: "green" },
];

const sortNewest = (rows) => [...rows].sort((a, b) => {
  const toMillis = (value) => value?.toMillis?.() ?? new Date(value || 0).getTime();
  return toMillis(b.createdAt || b.orderDate || b.date) - toMillis(a.createdAt || a.orderDate || a.date);
});

// ─── Main Admin Component ────────────────────────────────────────────────────
const Admin = () => {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [productsMenuOpen, setProductsMenuOpen] = useState(true);
  const [ordersMenuOpen, setOrdersMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Global search state
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // ─── Auth persistence ───────────────────────────────────────────────────────
  useEffect(() => {
    const storedAdmin = localStorage.getItem("tuka_admin");
    if (storedAdmin) {
      setAdminUser(JSON.parse(storedAdmin));
    }
    const darkPref = localStorage.getItem("tuka_admin_dark");
    if (darkPref === "true") setIsDarkMode(true);
    setLoadingAuth(false);
  }, []);

  // ─── Dark mode body class ───────────────────────────────────────────────────
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("tuka_admin_dark", isDarkMode);
  }, [isDarkMode]);

  const handleAuthSuccess = (user) => {
    setAdminUser(user);
    localStorage.setItem("tuka_admin", JSON.stringify(user));
  };

  const handleLogout = () => {
    setAdminUser(null);
    localStorage.removeItem("tuka_admin");
  };

  const loadProducts = async () => {
    const snap = await getDocs(collection(db, "products"));
    setProducts(sortNewestProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  };

  useEffect(() => {
    if (!adminUser) return undefined;
    const subscribe = (name, setter) => onSnapshot(collection(db, name), (snapshot) => {
      setter(sortNewest(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))));
    }, (error) => console.warn(`Could not listen to ${name}:`, error));
    const stopProducts = listenToProducts(setProducts, (error) => console.warn("Could not listen to products:", error));
    const stopUsers = subscribe("users", setUsers);
    const stopOrders = subscribe("orders", setOrders);
    return () => { stopProducts(); stopUsers(); stopOrders(); };
  }, [adminUser]);

  // ─── Global Search Logic ─────────────────────────────────────────────────
  useEffect(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) { setSearchResults([]); setShowSearchResults(false); return; }
    const matched = products.filter((p) =>
      `${p.name || ""} ${p.sku || ""} ${p.category || ""} ${p.country || ""}`.toLowerCase().includes(q)
    ).slice(0, 8).map((p) => ({ type: "product", label: p.name, sub: p.category || "No category", id: p.id, img: p.images?.[0] }));
    const matchedOrders = orders.filter((o) =>
      `${o.id} ${o.customerName || ""} ${o.email || ""}`.toLowerCase().includes(q)
    ).slice(0, 3).map((o) => ({ type: "order", label: `Order #${o.id.slice(0, 8)}`, sub: o.customerName || o.email || "Customer", id: o.id }));
    const matchedUsers = users.filter((u) =>
      `${u.name || ""} ${u.email || ""}`.toLowerCase().includes(q)
    ).slice(0, 3).map((u) => ({ type: "user", label: u.name || u.email, sub: u.email || "User", id: u.id }));
    setSearchResults([...matched, ...matchedOrders, ...matchedUsers]);
    setShowSearchResults(true);
  }, [globalSearch, products, orders, users]);

  const handleDeleteProduct = async (id) => {
    await removeProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setActiveItem("EditProduct");
  };

  const openProductEditor = () => {
    setActiveItem("AddProduct");
    setIsProductModalOpen(false);
    setIsSidebarOpen(false);
  };

  const currentItem = sidebarItems.find((i) => i.name === activeItem);

  // ─── Header ─────────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-slate-400"}`}>Tuka</span>
          <ChevronRight size={12} className="text-slate-300" />
          <span className="text-xs font-semibold text-[#b13896]">{activeItem}</span>
        </div>
        <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
          {activeItem}
        </h1>
        <p className={`mt-1 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
          {currentItem?.desc} — manage your handloom store
        </p>
      </div>
      <div className="flex items-center gap-3 self-end sm:self-auto">
        <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.6)] animate-pulse" />
          <span className={`text-xs font-medium ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>
            Store: <span className={`font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Live</span>
          </span>
        </div>
        <button
          onClick={openProductEditor}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#b13896] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#b13896]/20 hover:bg-[#962e7f] hover:shadow-[#b13896]/30 transition-all active:scale-95"
        >
          <Plus size={14} />
          <span>Add Product</span>
        </button>
      </div>
    </header>
  );

  // ─── Main Content ────────────────────────────────────────────────────────────
  const renderMainContent = () => {
    const cards = metricCards(products.length, users.length, orders.length);
    switch (activeItem) {
      case "Products": {
        const activeProducts = products.filter((p) => !p.status || p.status === "Published" || p.status === "Active").length;
        const draftProducts = products.filter((p) => p.status === "Draft").length;
        const trashedProducts = products.filter((p) => p.status === "Trash").length;
        const productCards = [
          { label: "Total Products", value: products.length, hint: "All catalogue products", icon: Package, color: "crimson" },
          { label: "Active Products", value: activeProducts, hint: "Published and active", icon: Activity, color: "green" },
          { label: "Draft Products", value: draftProducts, hint: "Not published yet", icon: Package, color: "blue" },
          { label: "Trash", value: trashedProducts, hint: "Archived products", icon: Package, color: "crimson" },
        ];
        return (
          <>
            <MetricCards cards={productCards} />
            <ProductsTable
              products={products}
              onAddProduct={openProductEditor}
              onEditProduct={handleEditClick}
              onDeleteProduct={handleDeleteProduct}
              onRefresh={loadProducts}
            />
          </>
        );
      }
      case "Stock Manager":
      case "StockManager":
        return <StockManager />;
      case "Homepage Manager":
      case "HomepageManager":
        return <HomepageManager />;
      case "Orders":
        return (
          <>
            <MetricCards cards={cards} />
            <OrdersTable orders={orders} />
          </>
        );
      case "Categories":
        return <CategorySubcategoryManager initialTab="Categories" />;
      case "SubCategories":
        return <CategorySubcategoryManager initialTab="Subcategories" />;
      case "Collections":
        return <CatalogManager type="Collections" />;
// case "Countries":
//   return <CatalogManager type="Countries" />;
      case "Attributes":
        return <CatalogManager type="Attributes" />;
      case "Users":
        return (
          <>
            <MetricCards cards={cards} />
            <UsersTable users={users} />
          </>
        );
      case "Media":
        return <MediaLibrary />;
      case "AddProduct":
        return <ProductEditor onCancel={() => setActiveItem("Products")} onSuccess={() => setActiveItem("Products")} />;
      case "EditProduct":
        return <ProductEditor product={editingProduct} onCancel={() => { setEditingProduct(null); setActiveItem("Products"); }} onSuccess={() => { setEditingProduct(null); setActiveItem("Products"); }} />;
      default:
        return <DashboardOverview products={products} users={users} orders={orders} onViewProducts={() => setActiveItem("Products")} isDarkMode={isDarkMode} />;
    }
  };

  // ─── Sidebar ─────────────────────────────────────────────────────────────────
  const SidebarContent = ({ collapsed = false }) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#630a21] via-[#570819] to-[#31040e] text-white">
      {/* Logo / Brand */}
      <div className={`border-b border-white/10 ${collapsed ? "px-3 py-5" : "px-6 py-5"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {collapsed ? (
            <div className="grid h-10 w-10 place-items-center rounded-full border border-[#e8c37b]/70 text-[#e8c37b]">
              <Gem size={21} />
            </div>
          ) : (
            <div className="text-center flex-1">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-[#e8c37b]/70 text-[#e8c37b]"><Gem size={21} /></div>
              <p className="mt-2 font-serif text-[25px] leading-none tracking-wide text-white">TUKA</p>
              <p className="mt-1 text-[8px] tracking-[.18em] text-[#e8c37b]/80">HANDLOOM & HERITAGE</p>
            </div>
          )}
          {!collapsed && (
            <button
              className="lg:hidden p-1.5 text-white/40 hover:text-white transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <nav className={`flex-1 overflow-y-auto py-4 text-[12px] ${collapsed ? "px-2" : "px-3"}`}>
        {/* Dashboard */}
        <button
          onClick={() => setActiveItem("Dashboard")}
          title="Dashboard"
          className={`mb-4 flex w-full items-center rounded-lg font-semibold transition-all ${
            collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
          } ${activeItem === "Dashboard" ? "bg-[#a4143e] text-white" : "text-white/80 hover:bg-white/10"}`}
        >
          <LayoutDashboard size={15} />
          {!collapsed && "Dashboard"}
        </button>

        {!collapsed && <p className="mb-2 px-3 text-[9px] font-medium tracking-wide text-white/50">CATALOG</p>}
        {collapsed && <div className="my-2 border-t border-white/10" />}

        {/* Products */}
        <button
          onClick={() => { setActiveItem("Products"); if (!collapsed) setProductsMenuOpen(!productsMenuOpen); }}
          title="Products"
          className={`flex w-full items-center rounded-lg font-semibold transition-all ${
            collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
          } ${activeItem === "Products" || activeItem === "AddProduct" || activeItem === "EditProduct" ? "bg-[#a4143e] text-white" : "text-white/80 hover:bg-white/10"}`}
        >
          <Package size={15} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Products</span>
              {productsMenuOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </>
          )}
        </button>
        {productsMenuOpen && !collapsed && (
          <div className="ml-3 border-l border-white/15 py-1 pl-2.5 space-y-0.5">
            {[["All Products", Grid2X2, "Products"]].map(([label, Icon, target]) => (
              <button
                key={label}
                onClick={() => setActiveItem(target)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[14px] ${activeItem === target ? "bg-[#84112f] text-white" : "text-white/75 hover:bg-white/10"}`}
              >
                <Icon size={12} />{label}
              </button>
            ))}
          </div>
        )}

        {/* Catalog entries: Stock Manager, Categories, Sub Categories, Collections, Attributes, Media */}
        {[
          ["Stock Manager", Layers, "StockManager"],
          ["Categories", Layers3, "Categories"],
          ["Sub Categories", Layers3, "SubCategories"],
          ["Collections", Layers3, "Collections"],
          ["Attributes", Tags, "Attributes"],
          ["Media", Images, "Media"],
        ].map(([title, Icon, target]) => (
          <div key={title} className="mt-1">
            <button
              onClick={() => setActiveItem(target)}
              title={title}
              className={`flex w-full items-center rounded-lg transition-all ${
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2"
              } ${activeItem === target ? "bg-[#a4143e] text-white font-bold" : "text-white/80 hover:bg-white/10"}`}
            >
              <Icon size={15} />
              {!collapsed && <span className="flex-1 text-left">{title}</span>}
            </button>
          </div>
        ))}

        {!collapsed && (
          <>
            <p className="mb-2 mt-4 px-3 text-[9px] font-medium tracking-wide text-white/50">CONTENT & HOMEPAGE</p>
            {[["Homepage Manager", Images, "HomepageManager"], ["Banners & Media", Images, "Media"]].map(([label, Icon, target]) => (
              <button
                key={label}
                onClick={() => setActiveItem(target)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                  activeItem === target ? "bg-[#a4143e] text-white font-bold" : "text-white/80 hover:bg-white/10"
                }`}
              >
                <Icon size={15} />{label}
              </button>
            ))}
          </>
        )}
        {collapsed && (
          <>
            <div className="my-2 border-t border-white/10" />
            {[["Homepage Manager", Images, "HomepageManager"], ["Banners & Media", Images, "Media"]].map(([label, Icon, target]) => (
              <button
                key={label}
                title={label}
                onClick={() => setActiveItem(target)}
                className={`flex w-full items-center justify-center rounded-lg px-2 py-2.5 transition-all mt-1 ${
                  activeItem === target ? "bg-[#a4143e] text-white" : "text-white/80 hover:bg-white/10"
                }`}
              >
                <Icon size={15} />
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Footer: collapse toggle + profile + logout */}
      <div className={`border-t border-white/10 py-3 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setIsSidebarCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`hidden lg:flex w-full items-center rounded-lg px-2 py-2 text-[12px] text-white/60 hover:bg-white/10 transition-all ${collapsed ? "justify-center" : "gap-3"}`}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /><span>Collapse</span></>}
        </button>

        <button
          title="Profile"
          className={`flex w-full items-center rounded-lg px-2 py-2 text-[12px] text-white/80 hover:bg-white/10 ${collapsed ? "justify-center" : "gap-3 px-3"}`}
        >
          <Users size={15} />
          {!collapsed && "Profile"}
        </button>
        <button
          onClick={handleLogout}
          title="Logout"
          className={`flex w-full items-center rounded-lg px-2 py-2 text-[12px] text-white/80 hover:bg-white/10 ${collapsed ? "justify-center" : "gap-3 px-3"}`}
        >
          <LogOut size={15} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  );

  // ─── Loading State ───────────────────────────────────────────────────────────
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-[3px] border-white/10 border-t-[#b13896] rounded-full"
          />
          <p className="text-xs text-white/30 font-medium tracking-widest uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return <AdminAuth onAuthSuccess={handleAuthSuccess} />;
  }

  const bg = isDarkMode ? "bg-[#0f1117]" : "bg-[#f5f5f7]";
  const topbarBg = isDarkMode ? "bg-[#1a1d27] border-slate-700/60" : "bg-white border-slate-200/80";
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textMuted = isDarkMode ? "text-slate-400" : "text-slate-500";
  const inputBg = isDarkMode ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-within:border-[#9c1237]/60" : "bg-slate-50/50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus-within:border-[#9c1237]/40";
  const resultsBg = isDarkMode ? "bg-[#1e2130] border-slate-700 shadow-2xl" : "bg-white border-slate-200 shadow-xl";
  const resultHover = isDarkMode ? "hover:bg-slate-700/60" : "hover:bg-slate-50";

  return (
    <div className={`min-h-screen ${bg} ${textPrimary} font-sans selection:bg-[#b13896]/10 transition-colors duration-300`}>
      {/* ─── Fixed Sidebar — Desktop ─── */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen z-30 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-16" : "w-60"
        }`}
      >
        <SidebarContent collapsed={isSidebarCollapsed} />
      </aside>

      {/* ─── Mobile Sidebar Overlay ─── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ─── Mobile Sidebar Drawer ─── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden shadow-2xl"
          >
            <SidebarContent collapsed={false} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ─── Main Content (offset on desktop for fixed sidebar) ─── */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? "lg:ml-16" : "lg:ml-60"}`}>

        {/* ─── Desktop Top Bar ─── */}
        <header className={`hidden lg:flex h-[74px] items-center justify-between border-b px-7 xl:px-9 ${topbarBg} sticky top-0 z-20`}>
          <button className={`grid h-9 w-9 place-items-center rounded-lg ${isDarkMode ? "text-slate-300 hover:bg-slate-700" : "text-slate-700 hover:bg-slate-100"}`}>
            <Menu size={21} />
          </button>

          {/* ─── Global Search ─── */}
          <div className="relative flex w-full max-w-[430px] flex-col">
            <label className={`flex items-center gap-3 rounded-xl border px-3.5 py-2 ${inputBg} transition-colors`}>
              <Search size={17} className={textMuted} />
              <input
                className={`w-full bg-transparent text-xs outline-none ${isDarkMode ? "text-white" : "text-slate-700"}`}
                placeholder="Search products, orders, customers…"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                onFocus={() => globalSearch && setShowSearchResults(true)}
              />
              {globalSearch && (
                <button onClick={() => { setGlobalSearch(""); setShowSearchResults(false); }} className={`${textMuted} hover:text-red-500`}>
                  <X size={14} />
                </button>
              )}
              <kbd className={`rounded-md border px-1.5 py-0.5 text-[9px] ${isDarkMode ? "border-slate-700 bg-slate-800 text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}>
                Ctrl K
              </kbd>
            </label>

            {/* Search Dropdown */}
            <AnimatePresence>
              {showSearchResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute top-[calc(100%+8px)] left-0 right-0 z-50 rounded-2xl border overflow-hidden ${resultsBg}`}
                >
                  <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${textMuted} border-b ${isDarkMode ? "border-slate-700" : "border-slate-100"}`}>
                    {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                  </div>
                  {searchResults.map((r) => (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => {
                        setShowSearchResults(false);
                        setGlobalSearch("");
                        if (r.type === "product") setActiveItem("Products");
                        else if (r.type === "order") setActiveItem("Orders");
                        else if (r.type === "user") setActiveItem("Users");
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${resultHover}`}
                    >
                      <div className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg overflow-hidden ${isDarkMode ? "bg-slate-700" : "bg-slate-100"}`}>
                        {r.img
                          ? <img src={r.img} alt="" className="h-full w-full object-cover" />
                          : r.type === "product" ? <Package size={14} className="text-[#b13896]" />
                          : r.type === "order" ? <ShoppingBag size={14} className="text-amber-500" />
                          : <Users size={14} className="text-blue-500" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[13px] font-semibold truncate ${isDarkMode ? "text-white" : "text-slate-800"}`}>{r.label}</p>
                        <p className={`text-[11px] truncate ${textMuted}`}>{r.type} · {r.sub}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
              {showSearchResults && globalSearch && searchResults.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className={`absolute top-[calc(100%+8px)] left-0 right-0 z-50 rounded-2xl border px-4 py-6 text-center ${resultsBg}`}
                >
                  <Search size={24} className={`mx-auto mb-2 ${textMuted}`} />
                  <p className={`text-xs ${textMuted}`}>No results for "<strong>{globalSearch}</strong>"</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4">
            {/* Day / Night Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                isDarkMode ? "bg-slate-700 text-yellow-400 hover:bg-slate-600" : "text-slate-600 hover:bg-slate-100"
              }`}
              title={isDarkMode ? "Switch to Day Mode" : "Switch to Night Mode"}
            >
              <AnimatePresence mode="wait">
                {isDarkMode ? (
                  <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Sun size={20} />
                  </motion.span>
                ) : (
                  <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Moon size={20} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button className={`relative ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
              <Bell size={20} />
              <span className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full bg-[#9c1237] text-[9px] text-white">0</span>
            </button>
            <div className={`h-8 w-px ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`} />
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#631028] text-xs font-bold text-white">
                {(adminUser?.adminId || "A").charAt(0).toUpperCase()}
              </span>
              <div>
                <p className={`text-xs font-semibold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Admin</p>
                <p className={`text-[14px] ${textMuted}`}>{adminUser?.adminId || "Admin Panel"}</p>
              </div>
              <ChevronDown size={15} className={textMuted} />
            </div>
          </div>
        </header>

        {/* ─── Mobile Topbar ─── */}
        <nav className={`lg:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-30 ${isDarkMode ? "bg-slate-900/95 border-slate-800" : "bg-white/90 border-slate-100"} backdrop-blur-lg`}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#0f0a0b] flex items-center justify-center shadow-md">
              <Gem size={13} className="text-white" />
            </div>
            <div>
              <p className={`text-sm font-bold tracking-tight leading-none ${isDarkMode ? "text-white" : "text-slate-900"}`}>Tuka</p>
              <p className={`text-[9px] font-medium tracking-widest uppercase mt-0.5 ${textMuted}`}>{activeItem}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-xl transition-all ${isDarkMode ? "bg-slate-700 text-yellow-400" : "bg-slate-100 text-slate-600"}`}>
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={openProductEditor}
              className="p-2 rounded-xl bg-[#b13896] text-white shadow-md shadow-[#b13896]/20 active:scale-95 transition-transform"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 rounded-xl active:scale-95 transition-transform ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}
            >
              <Menu size={16} />
            </button>
          </div>
        </nav>

        {/* ─── Page Content ─── */}
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 sm:px-8 sm:py-8 lg:px-7 lg:py-6 lg:pb-10 xl:px-9">
          <div className="max-w-[1500px] mx-auto">
            {activeItem !== "AddProduct" && activeItem !== "EditProduct" && renderHeader()}
            <motion.div
              key={activeItem}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {renderMainContent()}
            </motion.div>
          </div>
        </main>

        {/* ─── Mobile Bottom Navigation ─── */}
        <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t shadow-[0_-2px_20px_rgba(0,0,0,0.06)] ${isDarkMode ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-100"} backdrop-blur-lg`}>
          <div className="flex items-center justify-around px-2 py-1.5 max-w-md mx-auto">
            {sidebarItems.slice(0, 5).map((item) => {
              const isActive = item.name === activeItem;
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveItem(item.name)}
                  className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 min-w-[56px] ${isActive ? "text-[#b13896]" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                >
                  <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? "bg-[#b13896]/10" : ""}`}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className={`text-[9px] font-bold tracking-wide ${isActive ? "text-[#b13896]" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                    {item.name === "Dashboard" ? "Home" : item.name}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-tab-indicator"
                      className="w-4 h-0.5 rounded-full bg-[#b13896] mt-0.5"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="h-[env(safe-area-inset-bottom,0px)]" />
        </nav>
      </div>
    </div>
  );
};

export default Admin;
