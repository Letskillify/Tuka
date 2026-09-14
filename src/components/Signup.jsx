import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./useAuth";
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  RefreshCw 
} from "lucide-react";
import { motion } from "framer-motion";

const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const MAGENTA = '#b13896';

const Signup = () => {
  const { sendOtp, verifyOtp, setAccountPassword, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  // Redirect to account if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/account", { replace: true });
    }
  }, [user, navigate]);

  // Auth Modes: 'otp' | 'password'
  const [authMode, setAuthMode] = useState("otp");
  const [step, setStep] = useState(1);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 6-Digit OTP Array State
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(email.trim().toLowerCase());
      setStep(2);
      setCooldown(res.cooldownSeconds || 60);
      setSuccessMsg(`Verification code sent to ${email.trim()}`);
      setTimeout(() => otpInputRefs[0].current?.focus(), 300);
    } catch (err) {
      setError(err.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email.trim().toLowerCase(), code);
      setStep(3);
      setSuccessMsg("Email verified successfully! Please set your password to complete account registration.");
    } catch (err) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePassword = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await setAccountPassword(password);
      setSuccessMsg("Account created successfully!");
      navigate("/account", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to set account password.");
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-Up / Login
  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/account", { replace: true });
    } catch (err) {
      setError(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex selection:bg-[#b13896] selection:text-white bg-[#161114]">
      
      {/* Left Visual Panel */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden items-center justify-center p-12 bg-[#161114] border-r border-white/10">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 40% 30%, ${MAGENTA} 0%, transparent 65%)`, filter: 'blur(50px)' }} />
        <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(177,56,150,0.5), transparent)' }} />
        <div className="absolute bottom-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="relative z-10 max-w-lg">
          <Link to="/" className="inline-block mb-10 group">
            <img src="/img/Tuka-Logo.svg" alt="Tuka" className="h-11 brightness-0 invert transition-transform group-hover:scale-105 duration-300" />
          </Link>

          <h2 className="text-4xl xl:text-5xl font-light text-white mb-6 leading-[1.15] tracking-tight" style={{ fontFamily: SERIF }}>
            Create Your<br />
            <span className="font-semibold text-[#f4cfeb]">Handloom Account</span>
          </h2>

          <p className="text-white/60 text-sm max-w-md leading-relaxed mb-10 font-sans font-light">
            Become a member to save favorite drapes in your wishlist, enjoy fast checkout, and receive exclusive access to award weaver drops.
          </p>

          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-8 font-sans">
            {[
              { title: 'Email OTP Auth', desc: 'Secure verification' },
              { title: 'Express Checkout', desc: 'Pre-saved shipping addresses' },
              { title: 'Order Tracking', desc: 'Real-time dispatch updates' },
              { title: 'Member Previews', desc: 'Early notifications on festive drops' },
            ].map((feat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <ShieldCheck size={14} className="text-[#f4cfeb]" />
                  <span>{feat.title}</span>
                </div>
                <p className="text-[11px] text-white/40">{feat.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-between bg-[#FDFAF5] px-6 sm:px-12 py-8 sm:py-10 relative min-h-screen">
        
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between z-20">
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#161114] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#b13896] transition-all group cursor-pointer" style={{ fontFamily: SANS }}>
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>
          <Link to="/" className="lg:hidden p-2 rounded-xl bg-[#161114]">
            <img src="/img/Tuka-Logo.svg" alt="Tuka" className="h-7 brightness-0 invert" />
          </Link>
        </div>

        {/* Premium Form Container */}
        <div className="w-full max-w-[430px] mx-auto my-auto py-6 relative z-10 font-sans">
          
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            
            {/* Header with accent badge */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-[1.5px] bg-[#b13896]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#7a6b61]">
                  JOIN THE LEGACY
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-light text-[#161114] mb-2 leading-tight" style={{ fontFamily: SERIF }}>
                Sign <span className="italic text-[#b13896] font-normal">Up</span>
              </h1>
              
              <p className="text-xs text-slate-500 font-serif font-light leading-relaxed">
                Become a member of the house of Tuka.
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-sans">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Success Notification */}
            {successMsg && !error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-sans">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* Google Sign-Up Pill Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl border border-[#e6ded8] bg-white hover:bg-[#F8F4EF] text-[#161114] text-xs font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer mb-6"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>SIGN UP WITH GOOGLE</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-[#e6ded8]/70" />
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#a3948b]">OR WITH EMAIL</span>
              <div className="flex-1 h-px bg-[#e6ded8]/70" />
            </div>

            {/* Segmented Tab Pill Selector */}
            <div className="p-1 rounded-2xl bg-[#f5efe9] border border-[#e5d5df]/80 flex gap-1 mb-6">
              <button
                type="button"
                onClick={() => { setAuthMode("otp"); setError(""); setStep(1); }}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  authMode === "otp"
                    ? "bg-white text-[#161114] shadow-sm"
                    : "text-[#7a6b61] hover:text-[#161114]"
                }`}
              >
                EMAIL OTP
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("password"); setError(""); setStep(1); }}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  authMode === "password"
                    ? "bg-white text-[#161114] shadow-sm"
                    : "text-[#7a6b61] hover:text-[#161114]"
                }`}
              >
                PASSWORD
              </button>
            </div>

            {/* STEP 1: Enter Name & Email */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#332b26] ml-1 block">
                    FULL NAME
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a3948b] group-focus-within:text-[#b13896]" size={18} />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#e6ded8] rounded-2xl focus:border-[#b13896] outline-none text-xs text-[#161114] shadow-xs font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#332b26] ml-1 block">
                    EMAIL ADDRESS
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a3948b] group-focus-within:text-[#b13896]" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#e6ded8] rounded-2xl focus:border-[#b13896] outline-none text-xs text-[#161114] shadow-xs font-sans"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-serif font-light leading-relaxed pt-1">
                    We&apos;ll send a 6-digit code to your email. Instant, no password needed.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl text-white font-bold text-xs tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-3 bg-[#161114] hover:bg-[#b13896] shadow-md cursor-pointer mt-6"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>SEND VERIFICATION CODE</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Verify OTP Code */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#332b26] block text-center">
                    VERIFICATION CODE (6-DIGIT)
                  </label>
                  <div className="flex justify-between gap-2">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={otpInputRefs[index]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center font-mono text-xl font-bold bg-white border border-[#e6ded8] rounded-2xl focus:border-[#b13896] outline-none text-[#161114] shadow-xs"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpDigits.join("").length !== 6}
                  className="w-full py-4 rounded-2xl text-white font-bold text-xs tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-3 bg-[#161114] hover:bg-[#b13896] shadow-md disabled:opacity-40 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>VERIFY CODE &amp; CONTINUE</span>
                      <CheckCircle2 size={16} />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1 font-serif">
                  <button type="button" onClick={() => setStep(1)} className="text-slate-500 hover:text-[#161114] underline">
                    Change Email
                  </button>
                  <button
                    type="button"
                    disabled={cooldown > 0 || loading}
                    onClick={handleSendOtp}
                    className="text-[#b13896] font-bold hover:underline disabled:opacity-40 flex items-center gap-1.5 font-sans text-xs"
                  >
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Create Account Password */}
            {step === 3 && (
              <form onSubmit={handleCreatePassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#332b26] ml-1 block">ACCOUNT PASSWORD *</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a3948b] group-focus-within:text-[#b13896]" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-12 pr-12 py-3.5 bg-white border border-[#e6ded8] rounded-2xl focus:border-[#b13896] outline-none text-xs text-[#161114] shadow-xs"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a3948b] hover:text-[#b13896]">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#332b26] ml-1 block">CONFIRM PASSWORD *</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a3948b] group-focus-within:text-[#b13896]" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#e6ded8] rounded-2xl focus:border-[#b13896] outline-none text-xs text-[#161114] shadow-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => navigate("/account")} className="flex-1 py-3.5 border border-[#e6ded8] rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-[#F8F4EF]">
                    Skip
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-2xl bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-2">
                    {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Complete Setup"}
                  </button>
                </div>
              </form>
            )}

            {/* Footer Link Switcher */}
            <div className="mt-8 text-center text-xs font-serif">
              <span className="text-[#86756c]">Have an account? </span>
              <Link to="/login" className="text-[#161114] font-semibold underline hover:text-[#b13896]">
                Sign In
              </Link>
            </div>

          </motion.div>

        </div>

        {/* Footer copyright */}
        <div className="w-full text-center text-[11px] text-slate-400 font-sans z-10">
          © {new Date().getFullYear()} House of Tuka. Authentic Bengal Handlooms.
        </div>

      </div>
    </div>
  );
};

export default Signup;
