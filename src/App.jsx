import "./App.css";
import { Suspense, lazy } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import AuthProvider from "./components/AuthProvider";
import { StoreProvider } from "./hooks/useStore";
import ScrollToTop from "./components/ScrollToTop";
import FloatingWhatsApp from "./components/FloatingWhatsApp";

const Home = lazy(() => import("./components/Homepage/Home"));
const Admin = lazy(() => import("./pages/Admin/Admin"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin/SuperAdmin"));
const Login = lazy(() => import("./components/Login"));
const Signup = lazy(() => import("./components/Signup"));
const Cart = lazy(() => import("./layouts/Cart"));
const Wishlist = lazy(() => import("./components/Wishlist"));
const ProductDetail = lazy(() => import("./layouts/ProductDetail"));
const QuickView = lazy(() => import("./components/QuickView"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const OrderFailed = lazy(() => import("./pages/OrderFailed"));
const GuestTrack = lazy(() => import("./pages/GuestTrack"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const Account = lazy(() => import("./pages/Account"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Shop = lazy(() => import("./pages/Shop"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const ReturnPolicy = lazy(() => import("./pages/ReturnPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AppRoutes = () => {
  const location = useLocation();
  const hideChrome =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/super") ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  return (
    <>
      <ScrollToTop />
      {!hideChrome && <Header />}
      <Suspense fallback={<div className="h-screen w-full bg-[#161114]" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/super" element={<SuperAdmin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
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
