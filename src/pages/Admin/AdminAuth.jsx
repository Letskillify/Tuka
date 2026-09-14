import React, { useState } from 'react';
import { db } from "../../components/Firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Gem, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const AdminAuth = ({ onAuthSuccess }) => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const q = query(
        collection(db, "admins"),
        where("adminId", "==", adminId),
        where("password", "==", password)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const adminData = { firestoreId: snap.docs[0].id, ...snap.docs[0].data() };
        onAuthSuccess(adminData);
      } else {
        setError("Invalid Admin ID or Password. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during authentication. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0f0a0b] font-sans overflow-hidden">
      {/* ─── Left Panel (decorative, hidden on mobile) ─── */}
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center p-12 overflow-hidden">
        {/* Layered glow */}
        <div className="absolute inset-0 bg-[#b13896]/8" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#b13896]/15 blur-[120px]" />
        <div className="absolute top-[20%] left-[10%] w-[200px] h-[200px] rounded-full bg-white/[0.02] blur-[60px]" />

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        <div className="relative z-10 text-center space-y-6 max-w-sm">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-[#b13896] flex items-center justify-center shadow-xl shadow-[#b13896]/40">
              <Gem size={22} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-lg tracking-tight">Tuka</p>
              <p className="text-white/30 text-xs font-medium tracking-widest uppercase">Handloom & Heritage</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
            Manage your<br />
            <span className="text-[#d861bc]">handloom collections.</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed">
            The Tuka Admin Console gives you complete control over your catalog, orders, and customers.
          </p>

          {/* Feature dots */}
          <div className="space-y-3 text-left pt-4">
            {["Manage products & pricing variants", "View & track customer orders", "Monitor users & analytics"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#b13896] flex-shrink-0" />
                <p className="text-white/50 text-xs font-medium">{f}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right Panel (Login Form) ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Subtle glow top-right */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#b13896]/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm relative z-10"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-[#b13896] flex items-center justify-center shadow-lg shadow-[#b13896]/40">
              <Gem size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base tracking-tight">Tuka</p>
              <p className="text-white/30 text-[14px] font-medium tracking-widest uppercase">Admin Console</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-white/40">Sign in to access the admin panel.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Admin ID */}
            <div className="space-y-2">
              <label className="block text-[14px] font-bold text-white/40 uppercase tracking-[0.12em]">
                Admin ID
              </label>
              <input
                type="text"
                required
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/5 border border-white/8 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#b13896]/60 focus:border-transparent transition-all"
                placeholder="e.g. admin_01"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-[14px] font-bold text-white/40 uppercase tracking-[0.12em]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 pr-12 bg-white/5 border border-white/8 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#b13896]/60 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400 font-medium">{error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#b13896] hover:bg-[#962e7f] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#b13896]/30 hover:shadow-[#b13896]/40 transition-all active:scale-[0.98] disabled:opacity-60 flex justify-center items-center gap-2 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating…</span>
                </>
              ) : (
                "Sign In to Console"
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-[14px] text-white/20">
            © {new Date().getFullYear()} Tuka. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAuth;
