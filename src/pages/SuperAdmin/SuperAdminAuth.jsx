import React, { useState } from 'react';
import { auth, db } from "../../components/Firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const SuperAdminAuth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const docRef = doc(db, "superadmins", userCredential.user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().role === 'superadmin') {
          onAuthSuccess(userCredential.user);
        } else {
          await auth.signOut();
          setError("Access denied. You are not authorized as a Super Admin.");
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "superadmins", userCredential.user.uid), {
          email: userCredential.user.email,
          role: "superadmin",
          createdAt: new Date().toISOString()
        });
        onAuthSuccess(userCredential.user);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace("Error (auth/", "").replace(").", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#811331]/10 blur-[100px]" />
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-rose-400/10 blur-[80px]" />
      </div>

      <div className="w-full max-w-md px-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-[#811331] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#811331]/20 mb-6">
                <span className="text-2xl font-serif tracking-widest">SA</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                {isLogin ? 'Super Admin Portal' : 'Create Admin Account'}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {isLogin 
                  ? 'Enter your credentials to access the control center.' 
                  : 'Register a new super administrator to the system.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#811331]/20 focus:border-[#811331] transition-all"
                  placeholder="admin@tuka.com"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#811331]/20 focus:border-[#811331] transition-all"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm text-red-600 font-medium text-center">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#811331] hover:bg-[#650f27] text-white rounded-xl font-medium shadow-md shadow-[#811331]/20 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center mt-2"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>
          </div>
          
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 text-center">
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm font-medium text-slate-500 hover:text-[#811331] transition-colors"
            >
              {isLogin ? "Need a super admin account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} Super Admin Portal. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAuth;
