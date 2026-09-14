import React from "react";

export const statusBadgeClasses = (status) => {
  switch (status) {
    case "In Stock":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Low Stock":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "Out of Stock":
      return "bg-rose-50 text-rose-700 border-rose-100";
    case "Paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Pending":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "Shipped":
      return "bg-sky-50 text-sky-700 border-sky-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100";
  }
};
