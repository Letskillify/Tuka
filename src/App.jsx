import "./App.css";
import React, { Component, Suspense, lazy } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import AuthProvider from "./components/AuthProvider";
import { StoreProvider } from "./hooks/useStore";
import ScrollToTop from "./components/ScrollToTop";
import FloatingWhatsApp from "./components/FloatingWhatsApp";

// Resilient dynamic chunk loader that auto-recovers from stale deployment chunk hashes
const lazyRetry = (importFn) =>
  lazy(async () => {
    const hasAlreadyReloaded = sessionStorage.getItem("tuka_chunk_reload") === "true";
    try {
      const module = await importFn();
      sessionStorage.removeItem("tuka_chunk_reload");
      return module;
    } catch (err) {
      const msg = err?.message || String(err);
      const isChunkError =
        msg.includes("dynamically imported module") ||
        msg.includes("Importing a module script failed") ||
        msg.includes("failed to fetch") ||
        msg.includes("Loading chunk");

      if (isChunkError && !hasAlreadyReloaded) {
        sessionStorage.setItem("tuka_chunk_reload", "true");
        window.location.reload();
        return new Promise(() => {}); // hold execution while reload occurs
      }
      throw err;
    }
  });

// Error boundary to gracefully catch any unhandled chunk load failures and prevent black screen
class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    const msg = error?.message || String(error);
    const isChunkError =
      msg.includes("dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("failed to fetch") ||
      msg.includes("Loading chunk");

    if (isChunkError) {
      const hasReloaded = sessionStorage.getItem("tuka_chunk_reload") === "true";
      if (!hasReloaded) {
        sessionStorage.setItem("tuka_chunk_reload", "true");
        window.location.reload();
      }
    }
  }

  handleManualReload = () => {
    sessionStorage.removeItem("tuka_chunk_reload");
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-[#FDFAF5]">
          <div className="w-12 h-12 rounded-2xl bg-[#b13896]/10 text-[#b13896] flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-xl font-serif font-bold text-[#161114] mb-2">New Update Ready</h2>
          <p className="text-xs text-slate-500 max-w-sm mb-6">
            A fresh update has been deployed. Click below to load the latest pages.
          </p>
          <button
            onClick={this.handleManualReload}
            className="px-6 py-3 bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const RouteFallback = () => (
  <div className="min-h-[70vh] w-full flex flex-col items-center justify-center gap-3 bg-[#FDFAF5]">
    <div className="w-9 h-9 border-2 border-[#b13896] border-t-transparent rounded-full animate-spin" />
    <span className="text-[10px] uppercase tracking-[0.25em] text-[#b13896] font-bold">
      Loading...
    </span>
  </div>
);

const Home = lazyRetry(() => import("./components/Homepage/Home"));
const Admin = lazyRetry(() => import("./pages/Admin/Admin"));
const SuperAdmin = lazyRetry(() => import("./pages/SuperAdmin/SuperAdmin"));
const Login = lazyRetry(() => import("./components/Login"));
const Signup = lazyRetry(() => import("./components/Signup"));
const ForgotPassword = lazyRetry(() => import("./pages/ForgotPassword"));
const Cart = lazyRetry(() => import("./layouts/Cart"));
const Wishlist = lazyRetry(() => import("./components/Wishlist"));
const ProductDetail = lazyRetry(() => import("./layouts/ProductDetail"));
const QuickView = lazyRetry(() => import("./components/QuickView"));
const Checkout = lazyRetry(() => import("./pages/Checkout"));
const OrderSuccess = lazyRetry(() => import("./pages/OrderSuccess"));
const OrderFailed = lazyRetry(() => import("./pages/OrderFailed"));
const GuestTrack = lazyRetry(() => import("./pages/GuestTrack"));
const OrderDetails = lazyRetry(() => import("./pages/OrderDetails"));
const Account = lazyRetry(() => import("./pages/Account"));
const About = lazyRetry(() => import("./pages/About"));
const Contact = lazyRetry(() => import("./pages/Contact"));
const Shop = lazyRetry(() => import("./pages/Shop"));
const PrivacyPolicy = lazyRetry(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazyRetry(() => import("./pages/TermsAndConditions"));
const ReturnPolicy = lazyRetry(() => import("./pages/ReturnPolicy"));
const NotFound = lazyRetry(() => import("./pages/NotFound"));

const AppRoutes = () => {
  const location = useLocation();
  const hideChrome =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/super") ||
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/forgot-password";

  return (
    <>
      <ScrollToTop />
      {!hideChrome && <Header />}
      <ChunkErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/super" element={<SuperAdmin />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/order-failed" element={<OrderFailed />} />
            <Route path="/track-guest" element={<GuestTrack />} />
            <Route path="/order-details" element={<OrderDetails />} />
            <Route path="/orders" element={<OrderDetails />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/account" element={<Account />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/product/:id/quickview" element={<QuickView />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/return-policy" element={<ReturnPolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ChunkErrorBoundary>
      {!hideChrome && <FloatingWhatsApp />}
      {!hideChrome && <Footer />}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <StoreProvider>
          <AppRoutes />
        </StoreProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
