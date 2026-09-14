import React, { useState, useEffect } from 'react';
import { db, app } from './Firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from './useAuth';
import { Star, Image as ImageIcon, X, Loader2, MessageSquare, Plus, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const storage = getStorage(app);

const ProductReviews = ({ productId }) => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    // Form State
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (!productId) return;

        // Using onSnapshot for live reviews
        const q = query(
            collection(db, "productReviews"),
            where("productId", "==", productId)
            // orderBy requires a composite index with where, so we sort client-side
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const revs = [];
            snap.forEach(doc => {
                revs.push({ id: doc.id, ...doc.data() });
            });
            // Sort client-side: newest first
            revs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setReviews(revs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reviews:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [productId]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return alert("Please log in to submit a review.");
        if (rating < 1 || rating > 5) return alert("Please select a rating.");
        if (!comment.trim()) return alert("Please write a comment.");

        setSubmitting(true);
        let imageUrl = null;

        try {
            if (selectedFile) {
                const storageRef = ref(storage, `reviews/${productId}/${Date.now()}_${selectedFile.name}`);
                const uploadTask = uploadBytesResumable(storageRef, selectedFile);

                await new Promise((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        null,
                        (err) => reject(err),
                        async () => {
                            imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve();
                        }
                    );
                });
            }

            await addDoc(collection(db, "productReviews"), {
                productId,
                userId: user.uid,
                userName: user.displayName || "Verified Buyer",
                userAvatar: user.photoURL || null,
                rating,
                comment: comment.trim(),
                imageUrl: imageUrl,
                createdAt: serverTimestamp()
            });

            setSuccessMsg("Thank you! Your review has been posted.");
            setShowForm(false);
            setRating(5);
            setComment("");
            clearFile();
            setTimeout(() => setSuccessMsg(""), 4000);
        } catch (err) {
            console.error("Review submission error:", err);
            alert("Failed to submit review: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
        : "0.0";

    return (
        <div className="w-full bg-white rounded-[32px] p-6 lg:p-10 shadow-sm border border-slate-100 font-sans mt-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-100 pb-8">
                <div>
                    <h3 className="text-2xl font-serif text-[#161114]">Customer Reviews</h3>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex gap-1 items-center">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={18}
                                    fill={i < Math.round(Number(averageRating)) ? "#D4A853" : "none"}
                                    stroke={i < Math.round(Number(averageRating)) ? "#D4A853" : "#cbd5e1"}
                                />
                            ))}
                        </div>
                        <span className="text-xl font-bold text-slate-800 tracking-tight">{averageRating}</span>
                        <span className="text-sm font-medium text-slate-400">({reviews.length} Review{reviews.length !== 1 ? 's' : ''})</span>
                    </div>
                </div>

                {user ? (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-6 py-3 rounded-full bg-[#161114] hover:bg-[#b13896] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center gap-2 font-sans"
                    >
                        {showForm ? <X size={16} /> : <Plus size={16} />}
                        {showForm ? "Cancel" : "Write a Review"}
                    </button>
                ) : (
                    <div className="px-6 py-3 rounded-full bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest border border-slate-200">
                        Log in to write a review
                    </div>
                )}
            </div>

            <AnimatePresence>
                {successMsg && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-4 overflow-hidden">
                        <div className="px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold flex items-center gap-2">
                            <CheckCircle2 size={18} /> {successMsg}
                        </div>
                    </motion.div>
                )}

                {showForm && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-8 overflow-hidden"
                        onSubmit={handleSubmit}
                    >
                        <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-6">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 block">Rate Your Purchase</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            type="button"
                                            key={star}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setRating(star)}
                                            className="p-1 transition-transform hover:scale-110"
                                        >
                                            <Star
                                                size={28}
                                                fill={(hoverRating || rating) >= star ? "#D4A853" : "none"}
                                                stroke={(hoverRating || rating) >= star ? "#D4A853" : "#cbd5e1"}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 block">Review Details</label>
                                <textarea
                                    required
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Share your experience with the craftsmanship and quality..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#b13896] outline-none text-sm text-slate-800 resize-none h-32"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 block">Upload Photo (Optional)</label>
                                {previewUrl ? (
                                    <div className="relative inline-block mt-2">
                                        <img src={previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
                                        <button type="button" onClick={clearFile} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full sm:w-64 h-24 border-2 border-dashed border-slate-300 rounded-xl hover:border-[#b13896] hover:bg-[#b13896]/5 transition-colors cursor-pointer text-slate-500 hover:text-[#b13896]">
                                        <ImageIcon size={24} className="mb-2" />
                                        <span className="text-xs font-semibold">Click to upload photo</span>
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                )}
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8 py-3.5 rounded-full bg-[#b13896] hover:bg-[#972d7f] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                                >
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                                    {submitting ? 'Submitting...' : 'Post Review'}
                                </button>
                            </div>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="mt-8 space-y-6">
                {loading ? (
                    <div className="py-8 text-center text-slate-400 font-medium text-sm flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" /> Loading reviews...
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <MessageSquare size={36} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">No reviews yet. Be the first to share your experience!</p>
                    </div>
                ) : (
                    reviews.map((rev) => (
                        <div key={rev.id} className="py-6 border-b border-slate-100 last:border-0 flex flex-col sm:flex-row gap-5 items-start">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center">
                                {rev.userAvatar ? (
                                    <img src={rev.userAvatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-lg font-bold text-slate-400 font-serif">
                                        {(rev.userName || "V").charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <div>
                                        <h5 className="font-bold text-slate-900 text-sm">{rev.userName}</h5>
                                        <div className="flex gap-1 mt-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} fill={i < rev.rating ? "#D4A853" : "none"} stroke={i < rev.rating ? "#D4A853" : "#e2e8f0"} />
                                            ))}
                                        </div>
                                    </div>
                                    {rev.createdAt && (
                                        <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                                            {new Date(rev.createdAt.seconds * 1000).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl mt-3 whitespace-pre-wrap">{rev.comment}</p>
                                {rev.imageUrl && (
                                    <div className="mt-4 inline-block overflow-hidden rounded-xl border border-slate-200 cursor-zoom-in hover:shadow-md transition-shadow">
                                        <img src={rev.imageUrl} alt="Review attachment" className="w-32 h-32 object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProductReviews;
