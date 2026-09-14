import React, { useState } from "react";
import Papa from "papaparse";
import { db } from "../../../components/Firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const CSVUpload = ({ onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const downloadSample = () => {
    const csvContent = "name,category,description,original_price,price,stock,material,stones,size_weight,discount,care_instructions,images\n" +
      "Dhaniakhali Handloom Saree,Handloom Saree,A crisp fine 100s count Bengal cotton saree,4500,3800,25,100s Count Combed Cotton,None,Standard 5.5m,15,Hand wash in cold water with mild detergent,https://images.unsplash.com/photo-1610030470298-40e1eaccf77d?auto=format&fit=crop&q=80&w=800";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "product_sample.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setSuccess("");
    setUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const products = results.data;
          let addedCount = 0;

          for (const product of products) {
            const docData = {
              name: product.name || "Untitled Product",
              category: product.category || "Uncategorized",
              description: product.description || "",
              discount: Number(product.discount) || 0,
              care_instructions: product.care_instructions || "",
              images: product.images ? product.images.split(",").map(url => url.trim()) : [],
              image: product.image || (product.images ? product.images.split(",")[0].trim() : ""),
              stones: product.stones || "",
              size_weight: product.size_weight || "",
              original_price: Number(product.original_price) || 0,
              price: Number(product.price) || 0,
              stock: Number(product.stock) || 0,
              rating: Number(product.rating) || 0,
              stock_status: (Number(product.stock) || 0) <= 0 ? "Out of Stock" : (product.stock_status || "In Stock"),
              material: product.material || "",
              createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "products"), docData);
            addedCount++;
          }

          setSuccess(`${addedCount} products uploaded successfully!`);
          if (onComplete) onComplete();
          // Keep modal open briefly to show success, then close
          setTimeout(() => {
            setIsOpen(false);
            setSuccess("");
          }, 2000);
        } catch (err) {
          console.error("CSV Upload Error:", err);
          setError("Failed to upload products. Please check the CSV format.");
        } finally {
          setUploading(false);
        }
      },
      error: (err) => {
        console.error("Papa Parse Error:", err);
        setError("Failed to parse CSV file.");
        setUploading(false);
      },
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#b13896] text-[#b13896] text-xs font-medium hover:bg-[#b13896]/5 transition-all shadow-sm"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Upload CSV
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Bulk Product Upload</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#b13896]/5 text-[#b13896] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <p className="text-sm text-slate-600 mb-8 leading-relaxed">
                Add multiple products at once. Download our sample file to ensure your data is formatted correctly.
              </p>

              <div className="w-full space-y-4">
                <button
                  type="button"
                  onClick={downloadSample}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-600 font-bold text-sm hover:border-[#b13896] hover:text-[#b13896] hover:bg-[#b13896]/5 transition-all flex items-center justify-center gap-2 group"
                >
                  <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Sample CSV
                </button>

                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <label
                    htmlFor="csv-file-input"
                    className={`w-full py-4 px-4 rounded-xl bg-[#b13896] text-white font-bold text-sm shadow-lg shadow-[#b13896]/20 hover:bg-[#962e7f] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Uploading Products...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Browse & Upload CSV
                      </>
                    )}
                  </label>
                </div>
              </div>

              {error && (
                <div className="mt-6 p-3 w-full bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 animate-shake">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mt-6 p-3 w-full bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100">
                  {success}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CSVUpload;
