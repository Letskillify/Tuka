// SuperAdmin.jsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../../components/Firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  getDoc,
  addDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
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
  Settings,
  Plus,
  Package,
  ShieldCheck,
  Activity,
  Database
} from "lucide-react";
import SuperAdminAuth from "./SuperAdminAuth";
import { ProductForm } from "../Admin/components/ProductForms";
import MetricCards from "../Admin/components/MetricCards";
import ProductsTable from "../Admin/components/ProductsTable";
import OrdersTable from "../Admin/components/OrdersTable";
import UsersTable from "../Admin/components/UsersTable";
import AdminsTable from "./components/AdminsTable";
import MediaLibrary from "../Admin/components/MediaLibrary";

const sidebarItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Products", icon: Package },
  { name: "Orders", icon: ShoppingBag },
  { name: "Categories", icon: List },
  { name: "Inventory", icon: Database },
  { name: "Users", icon: Users },
  { name: "Admins", icon: ShieldCheck },
  { name: "Media", icon: Image },
  { name: "Settings", icon: Settings },
];

const metricCards = (productCount, userCount, adminCount) => [
  { label: "Total Products", value: productCount, trend: "In catalog", icon: Package },
  { label: "Total Users", value: userCount, trend: "Registered", icon: Users },
  { label: "Total Admins", value: adminCount, trend: "Active team", icon: ShieldCheck },
  { label: "Revenue", value: "₹0", trend: "Total platform", icon: Activity },
];

const orderRows = [];

const SuperAdmin = () => {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [newAdminId, setNewAdminId] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [superAdminUser, setSuperAdminUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadProducts = async () => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setProducts(list);
  };

  const loadUsers = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
    } catch (error) {
      console.log("Note: Users collection may not exist yet or error fetching users");
    }
  };

  const loadAdminsList = async () => {
    try {
      const q = query(collection(db, "admins"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ firestoreId: d.id, ...d.data() }));
      setAdminsList(list);
    } catch (error) {
      console.log("Note: admins collection may not exist yet");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "superadmins", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().role === "superadmin") {
            setSuperAdminUser(user);
          } else {
            await signOut(auth);
            setSuperAdminUser(null);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setSuperAdminUser(null);
        }
      } else {
        setSuperAdminUser(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (superAdminUser) {
      loadProducts();
      loadUsers();
      loadAdminsList();
    }
  }, [superAdminUser]);

  const handleDeleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminId || !newAdminPass) return;
    try {
      await addDoc(collection(db, "admins"), {
        adminId: newAdminId,
        password: newAdminPass,
        createdAt: new Date().toISOString()
      });
      setIsAdminModalOpen(false);
      setNewAdminId("");
      setNewAdminPass("");
      loadAdminsList();
    } catch (error) {
      console.error("Error creating admin:", error);
    }
  };

  const renderContentHeader = () => (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Super Admin Panel
        </h1>
        <p className="mt-1 text-sm font-medium tracking-wide text-[#811331] uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#811331] animate-pulse" />
          {activeItem}
        </p>
      </div>
      <div className="flex items-center gap-3 self-end sm:self-auto">
        <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-white shadow-sm border border-slate-100">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-slate-600">
            System status: <span className="font-semibold text-slate-900">Online</span>
          </span>
        </div>
        <button
          onClick={() => setIsProductModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#811331] text-white rounded-full text-xs font-semibold shadow-lg shadow-[#811331]/20 hover:bg-[#650f27] transition-all active:scale-95"
        >
          <Plus size={14} />
          <span>Add Product</span>
        </button>
      </div>
    </header>
  );

  const renderMainContent = () => {
    const cards = metricCards(products.length, users.length, adminsList.length);
    switch (activeItem) {
      case "Products":
        return (
          <>
            <MetricCards cards={cards} />
            <ProductsTable 
              products={products} 
              onAddProduct={() => setIsProductModalOpen(true)}
              onDeleteProduct={handleDeleteProduct}
              onRefresh={loadProducts}
            />
          </>
        );
      case "Orders":
        return (
          <>
            <MetricCards cards={cards} />
            <OrdersTable orders={orderRows} />
          </>
        );
      case "Users":
        return (
          <>
            <MetricCards cards={cards} />
            <UsersTable users={users} />
          </>
        );
      case "Admins":
        return (
          <>
            <MetricCards cards={cards} />
            <AdminsTable 
              adminsList={adminsList} 
              onAddAdmin={() => setIsAdminModalOpen(true)}
              onLoadAdmins={loadAdminsList}
            />
          </>
        );
      case "Media":
        return (
          <MediaLibrary />
        );
      default:
        return (
          <>
            <MetricCards cards={cards} />
            <div className="grid gap-6 lg:grid-cols-2">
              <ProductsTable 
                products={products} 
                onAddProduct={() => setIsProductModalOpen(true)}
                onDeleteProduct={handleDeleteProduct}
                onRefresh={loadProducts}
              />
              <OrdersTable orders={orderRows} />
            </div>
          </>
        );
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white/90 backdrop-blur-md border-r border-slate-100">
      <div className="px-6 py-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#811331] text-white flex items-center justify-center text-sm font-bold shadow-xl shadow-[#811331]/20">
              SA
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900">
                Super Admin
              </p>
              <p className="text-[14px] font-medium text-slate-400 uppercase tracking-widest">Control Center</p>
            </div>
          </div>
          <button 
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = item.name === activeItem;
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => {
                setActiveItem(item.name);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-[#811331] text-white shadow-lg shadow-[#811331]/20"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-slate-400 group-hover:text-[#811331]"} />
              <span className="flex-1 text-left">{item.name}</span>
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active-sa"
                  className="h-1.5 w-1.5 rounded-full bg-white" 
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-6 border-t border-slate-100 space-y-4">
        <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mb-1">Session</p>
          <p className="text-xs font-semibold text-slate-700 truncate" title={superAdminUser?.email}>
            {superAdminUser?.email}
          </p>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all border border-red-100"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#811331]/10 border-t-[#811331] rounded-full"
        />
      </div>
    );
  }

  if (!superAdminUser) {
    return <SuperAdminAuth onAuthSuccess={(user) => setSuperAdminUser(user)} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans selection:bg-[#811331]/10">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden shadow-2xl"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Navbar */}
        <nav className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#811331] text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-[#811331]/20">
              SA
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">Super Admin</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100 transition-all active:scale-95"
          >
            <Menu size={20} />
          </button>
        </nav>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="max-w-7xl mx-auto">
            {renderContentHeader()}
            <motion.div
              key={activeItem}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderMainContent()}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Modals with Premium Animations */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProductModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full relative z-10 max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Add New Product
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Super admins can upload products directly to the catalog.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-8">
                <ProductForm
                  onSuccess={async () => {
                    setIsProductModalOpen(false);
                    await loadProducts();
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdminModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdminModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full relative z-10 overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Add New Admin
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Create credentials for the admin panel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="px-8 py-8">
                <form onSubmit={handleCreateAdmin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Admin ID</label>
                    <input
                      type="text"
                      required
                      value={newAdminId}
                      onChange={(e) => setNewAdminId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#811331] focus:ring-4 focus:ring-[#811331]/5 transition-all"
                      placeholder="e.g. admin_01"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                    <input
                      type="text"
                      required
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#811331] focus:ring-4 focus:ring-[#811331]/5 transition-all"
                      placeholder="Enter password"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-[#811331] hover:bg-[#650f27] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#811331]/20 transition-all active:scale-[0.98]"
                  >
                    Create Admin Account
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdmin;

