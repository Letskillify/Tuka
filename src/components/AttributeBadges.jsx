import React from "react";
import { Sparkles, Flame, Tag, TrendingUp, Gem, Crown, Award } from "lucide-react";

export const getAttributeStyle = (attrName) => {
  const norm = (attrName || "").trim().toLowerCase();

  if (norm.includes("hot") || norm.includes("flame")) {
    return {
      bg: "linear-gradient(135deg, #FF4500 0%, #b13896 100%)",
      color: "#FFFFFF",
      icon: <Flame size={11} className="animate-pulse text-amber-200" />,
      border: "1px solid rgba(255,255,255,0.3)",
      shadow: "0 4px 12px rgba(255, 69, 0, 0.35)",
    };
  }
  if (norm.includes("deal") || norm.includes("offer")) {
    return {
      bg: "linear-gradient(135deg, #D4AF37 0%, #aa7c11 100%)",
      color: "#FFFFFF",
      icon: <Sparkles size={11} className="text-amber-100" />,
      border: "1px solid rgba(255, 235, 170, 0.4)",
      shadow: "0 4px 12px rgba(212, 175, 55, 0.35)",
    };
  }
  if (norm.includes("sale") || norm.includes("discount")) {
    return {
      bg: "linear-gradient(135deg, #059669 0%, #047857 100%)",
      color: "#FFFFFF",
      icon: <Tag size={11} className="text-emerald-100" />,
      border: "1px solid rgba(255,255,255,0.3)",
      shadow: "0 4px 12px rgba(5, 150, 105, 0.35)",
    };
  }
  if (norm.includes("trending")) {
    return {
      bg: "linear-gradient(135deg, #7C3AED 0%, #b13896 100%)",
      color: "#FFFFFF",
      icon: <TrendingUp size={11} className="text-violet-200" />,
      border: "1px solid rgba(255,255,255,0.3)",
      shadow: "0 4px 12px rgba(124, 58, 237, 0.35)",
    };
  }
  if (norm.includes("bestseller") || norm.includes("best seller")) {
    return {
      bg: "linear-gradient(135deg, #161114 0%, #3d1c31 100%)",
      color: "#FDE68A",
      icon: <Crown size={11} className="text-amber-400" />,
      border: "1px solid rgba(212, 175, 55, 0.5)",
      shadow: "0 4px 12px rgba(22, 17, 20, 0.4)",
    };
  }
  if (norm.includes("exclusive") || norm.includes("signature")) {
    return {
      bg: "linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)",
      color: "#FFFFFF",
      icon: <Gem size={11} className="text-indigo-200" />,
      border: "1px solid rgba(255,255,255,0.3)",
      shadow: "0 4px 12px rgba(30, 27, 75, 0.35)",
    };
  }
  if (norm.includes("new") || norm.includes("arrival")) {
    return {
      bg: "linear-gradient(135deg, #DB2777 0%, #b13896 100%)",
      color: "#FFFFFF",
      icon: <Sparkles size={11} className="text-pink-100" />,
      border: "1px solid rgba(255,255,255,0.3)",
      shadow: "0 4px 12px rgba(219, 39, 119, 0.35)",
    };
  }

  // Default Luxury Glassmorphism Badge
  return {
    bg: "rgba(22, 17, 20, 0.85)",
    color: "#FFFFFF",
    icon: <Award size={11} className="text-[#b13896]" />,
    border: "1px solid rgba(255,255,255,0.2)",
    shadow: "0 4px 10px rgba(0,0,0,0.25)",
  };
};

const AttributeBadges = ({ attributes = [], className = "" }) => {
  if (!attributes || attributes.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {attributes.map((attr, idx) => {
        const style = getAttributeStyle(attr);
        return (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-[0.18em] backdrop-blur-md transition-transform hover:scale-105"
            style={{
              background: style.bg,
              color: style.color,
              border: style.border,
              boxShadow: style.shadow,
            }}
          >
            {style.icon}
            {attr}
          </span>
        );
      })}
    </div>
  );
};

export default AttributeBadges;
