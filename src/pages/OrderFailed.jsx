import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import Breadcrumb from "../components/Breadcrumb";

const OrderFailed = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const errorMessage = location.state?.error || "Transaction cancelled or failed due to a bank/network issue.";

    return (
        <div className="min-h-screen bg-[#FDFAF5] font-sans text-[#161114]">
            {/* Breadcrumb Header */}
            <Breadcrumb
                title="Acquisition Unsuccessful"
                subtitle="Your request could not be completed"
                bgImage="https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=1600"
                links={[{ name: 'Home', href: '/' }, { name: 'Payment Failed', href: '#', active: true }]}
                badgeText="HOUSE OF TUKA"
            />

            <div className="max-w-[700px] mx-auto px-6 py-20 pb-32 mt-[-40px] relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[32px] p-8 md:p-12 shadow-xl border border-rose-100 text-center space-y-6"
                >
                    <div className="w-24 h-24 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
                        <XCircle size={48} className="text-rose-500" strokeWidth={1.5} />
                    </div>

                    <h2 className="text-3xl font-serif text-[#161114]">Payment Denied</h2>

                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 max-w-md mx-auto">
                        <p className="text-xs text-rose-700 font-bold uppercase tracking-wider mb-1">Error Information</p>
                        <p className="text-sm font-semibold text-rose-900">{errorMessage}</p>
                    </div>

                    <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                        Your cart items have been saved. Please verify your payment details and connection, then try placing the order again. Your balance, if deducted incorrectly, will be auto-refunded by your bank in 3-5 days.
                    </p>

                    <div className="pt-8 flex flex-col md:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/checkout')}
                            className="px-8 py-3.5 bg-[#b13896] hover:bg-[#972d7f] text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <RefreshCw size={16} /> Retry Checkout
                        </button>
                        <Link
                            to="/cart"
                            className="px-8 py-3.5 bg-[#F8F4EF] border border-[#e5d5df] hover:border-[#b13896] text-[#b13896] rounded-full font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <ShoppingCart size={16} /> View Cart
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default OrderFailed;
