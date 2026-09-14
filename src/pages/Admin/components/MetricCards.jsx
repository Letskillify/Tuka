import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const colorMap = {
  crimson: {
    icon: "bg-[#b13896]/10 text-[#b13896]",
    glow: "shadow-[#b13896]/10",
    accent: "from-[#b13896]/5 to-transparent",
    bar: "bg-[#b13896]",
  },
  blue: {
    icon: "bg-blue-50 text-blue-600",
    glow: "shadow-blue-100",
    accent: "from-blue-50/60 to-transparent",
    bar: "bg-blue-500",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-600",
    glow: "shadow-emerald-100",
    accent: "from-emerald-50/60 to-transparent",
    bar: "bg-emerald-500",
  },
};

const MetricCards = ({ cards }) => (
  <section className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-6">
    {cards.map((card, index) => {
      const Icon = card.icon;
      const colors = colorMap[card.color] || colorMap.crimson;
      return (
        <motion.article
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08, duration: 0.4 }}
          className={`relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg ${colors.glow} transition-all duration-300 p-6 group cursor-default`}
        >
          {/* Gradient accent top-left */}
          <div className={`absolute inset-0 bg-gradient-to-br ${colors.accent} pointer-events-none`} />

          {/* Bottom accent bar */}
          <div className={`absolute bottom-0 left-0 h-0.5 w-0 ${colors.bar} group-hover:w-full transition-all duration-700 ease-out`} />

          <div className="relative flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[14px] font-bold tracking-widest text-slate-400 uppercase">
                {card.label}
              </p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {card.value}
              </p>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={11} className="text-emerald-500" />
                <p className="text-xs font-medium text-slate-400">{card.hint || card.trend}</p>
              </div>
            </div>

            {Icon && (
              <div className={`p-3 rounded-2xl ${colors.icon} transition-all duration-300 flex-shrink-0`}>
                <Icon size={22} strokeWidth={2} />
              </div>
            )}
          </div>
        </motion.article>
      );
    })}
  </section>
);

export default MetricCards;
