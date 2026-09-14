import React, { useState, useEffect } from "react";
import { Layers, ChevronRight, FolderPlus } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../components/Firebase";

const DEFAULT_CATEGORY_METAS = [
  { name: "Handloom Saree", group: "Core Weaves", icon: "🪷", accent: "bg-rose-50 border-rose-100", badge: "bg-rose-100 text-rose-700" },
  { name: "Designer Blouse", group: "Apparel", icon: "🌸", accent: "bg-blue-50 border-blue-100", badge: "bg-blue-100 text-blue-700" },
  { name: "Saree", group: "Traditional", icon: "✦", accent: "bg-amber-50 border-amber-100", badge: "bg-amber-100 text-amber-700" },
  { name: "Boutique Collection", group: "Luxury", icon: "✨", accent: "bg-emerald-50 border-emerald-100", badge: "bg-emerald-100 text-emerald-700" },
  { name: "Kurtis", group: "Casual Wear", icon: "🛍", accent: "bg-purple-50 border-purple-100", badge: "bg-purple-100 text-purple-700" },
];

const CategoriesOverview = () => {
  const [categories, setCategories] = useState([]);
  const [productCounts, setProductCounts] = useState({});

  useEffect(() => {
    // 1. Listen to Firestore Categories
    const unsubCat = onSnapshot(collection(db, "categories"), (snap) => {
      const dbCats = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const catNames = new Set(dbCats.map((c) => c.name));
      
      const merged = [...DEFAULT_CATEGORY_METAS];
      dbCats.forEach((c) => {
        if (c.name && !merged.some((m) => m.name.toLowerCase() === c.name.toLowerCase())) {
          merged.push({
            name: c.name,
            group: c.group || "Custom Group",
            icon: "🪷",
            accent: "bg-[#b13896]/5 border-[#b13896]/15",
            badge: "bg-[#b13896]/10 text-[#b13896]"
          });
        }
      });
      setCategories(merged);
    });

    // 2. Listen to Firestore Products for live category counts
    const unsubProd = onSnapshot(collection(db, "products"), (snap) => {
      const counts = {};
      snap.docs.forEach((doc) => {
        const cat = doc.data().category || "Uncategorized";
        counts[cat] = (counts[cat] || 0) + 1;
      });
      setProductCounts(counts);
    });

    return () => {
      unsubCat();
      unsubProd();
    };
  }, []);

  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2.5">
            <span className="p-1.5 bg-[#b13896]/10 rounded-lg">
              <Layers size={15} className="text-[#b13896]" />
            </span>
            Categories Overview
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1 ml-0.5">
            Real-time structure and live inventory counts from Firestore
          </p>
        </div>
        <span className="text-[14px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-full">
          {categories.length} Categories
        </span>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const count = productCounts[cat.name] || 0;
          return (
            <div
              key={cat.name}
              className={`group relative rounded-2xl border ${cat.accent} p-5 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden`}
            >
              {/* Subtle floating accent */}
              <div className="absolute -top-4 -right-4 text-5xl opacity-10 group-hover:opacity-20 transition-opacity select-none">
                {cat.icon}
              </div>

              <div className="flex justify-between items-start mb-4">
                <span className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${cat.badge}`}>
                  {cat.group}
                </span>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-[#b13896] transition-colors" />
              </div>

              <div className="text-2xl mb-2">{cat.icon}</div>
              <p className="text-base font-bold text-slate-900">{cat.name}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{count} active products</p>

              {/* Bottom highlight bar */}
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#b13896] group-hover:w-full transition-all duration-500 rounded-b-2xl" />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CategoriesOverview;
