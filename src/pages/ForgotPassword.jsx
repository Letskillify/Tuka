import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../components/useAuth";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw,
  KeyRound
} from "lucide-react";
import { motion } from "framer-motion";

const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const MAGENTA = "#b13896";

const ForgotPassword = () => {
  const { sendOtp, verifyOtp, setAccountPassword } = useAuth();
  const navigate = useNavigate();

  // Step 1: Request OTP -> Step 2: Enter OTP -> Step 3: Set New Password -> Step 4: Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 6-Digit OTP Array
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

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);
    if (/^\d{6}$/.test(pastedData)) {
      setOtpDigits(pastedData.split(""));
      otpInputRefs[5].current?.focus();
    }
  };

  // Step 1: Send Reset OTP
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
      setSuccessMsg(`Reset code sent to ${email.trim()}`);
      setTimeout(() => otpInputRefs[0].current?.focus(), 300);
    } catch (err) {
      setError(err.message || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
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
      setSuccessMsg("Code verified successfully! Enter your new password below.");
    } catch (err) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleSetNewPassword = async (e) => {
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
      setStep(4);
      setSuccessMsg("Password reset completed successfully! You can now log in.");
    } catch (err) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex selection:bg-[#b13896] selection:text-white bg-[#161114]">
      
      {/* Left Visual Panel */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden items-center justify-center p-12 bg-[#161114] border-r border-white/10">
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 40% 30%, ${MAGENTA} 0%, transparent 65%)`,
            filter: 'blur(50px)'
          }}
        />
        <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(177,56,150,0.5), transparent)' }} />
        
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 max-w-lg text-center"
        >
          <Link to="/" className="inline-block mb-10 group">
            <img src="/img/Tuka-Logo.svg" alt="Tuka" className="h-11 brightness-0 invert transition-transform group-hover:scale-105 duration-300" />
          </Link>

          <div className="w-20 h-20 mx-auto rounded-full bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center text-[#b13896] mb-8 shadow-2xl">
            <KeyRound size={36} strokeWidth={1.2} />
          </div>

          <h2 className="text-3xl lg:text-4xl font-serif text-white font-light mb-4">
            Account Recovery
          </h2>
          <p className="text-white/60 text-xs tracking-[0.2em] uppercase leading-relaxed font-sans max-w-sm mx-auto">
            Secure, 6-digit OTP verified password reset for your House of Tuka account.
          </p>
        </motion.div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md space-y-8">
          
          <div className="flex items-center justify-between">
            <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60 hover:text-white transition-colors">
              <ArrowLeft size={16} /> Back to Login
            </Link>
            <div className="text-[11px] uppercase tracking-widest text-[#b13896] font-bold">
              Step {step} of 3
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-serif text-white font-light">
              {step === 1 && "Forgot Password?"}
              {step === 2 && "Enter Verification Code"}
              {step === 3 && "Reset Password"}
              {step === 4 && "Password Reset Complete"}
            </h1>
            <p className="text-white/50 text-xs mt-2 font-sans">
              {step === 1 && "Enter your registered email address to receive a 6-digit OTP code."}
              {step === 2 && `We have sent a 6-digit code to ${email}.`}
              {step === 3 && "Create a new strong password for your Tuka account."}
              {step === 4 && "Your password has been successfully updated. You may now sign in."}
            </p>
          </div>

          {/* Feedback Banners */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-300 text-xs">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Step 1: Send OTP */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:border-[#b13896] outline-none text-xs text-white placeholder:text-white/30 backdrop-blur-md"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Send Verification OTP <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* Step 2: Enter OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-2 text-center">
                  6-Digit OTP Code
                </label>
                <div className="flex items-center justify-between gap-2 my-4">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpInputRefs[idx]}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-14 text-center text-xl font-bold font-mono bg-white/5 border border-white/10 rounded-xl focus:border-[#b13896] text-white outline-none"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-white/50">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="hover:text-white underline cursor-pointer"
                >
                  Change Email
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={() => handleSendOtp()}
                  className="hover:text-[#b13896] disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend OTP"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Verify Code <ShieldCheck size={16} /></>}
              </button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleSetNewPassword} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:border-[#b13896] outline-none text-xs text-white placeholder:text-white/30 backdrop-blur-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:border-[#b13896] outline-none text-xs text-white placeholder:text-white/30 backdrop-blur-md"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Save New Password"}
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center space-y-6 pt-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 size={36} />
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-4 rounded-2xl bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-wider shadow-lg cursor-pointer"
              >
                Proceed to Login
              </button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default ForgotPassword;
