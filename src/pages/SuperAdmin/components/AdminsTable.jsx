import React from "react";
import { db } from "../../../components/Firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { ShieldCheck, UserPlus, Trash2, Key, Calendar } from "lucide-react";

const AdminsTable = ({ adminsList, onAddAdmin, onLoadAdmins }) => {
  const handleDeleteAdmin = async (firestoreId) => {
    if (window.confirm("Are you sure you want to delete this admin account?")) {
      await deleteDoc(doc(db, "admins", firestoreId));
      onLoadAdmins();
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-6 sm:px-8 border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#811331]" />
              Admins
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Manage administrative panel access
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onAddAdmin}
              className="flex items-center gap-2 px-4 py-2 bg-[#811331] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#811331]/10 hover:bg-[#650f27] transition-all active:scale-95"
            >
              <UserPlus size={14} />
              <span>Add Admin</span>
            </button>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-[14px] font-bold text-slate-600 uppercase tracking-wider">
              {adminsList.length} Active
            </span>
          </div>
        </div>
      </div>

      {/* Table View - Desktop */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100 bg-slate-50/50">
              <th className="px-8 py-5">Admin ID</th>
              <th className="px-6 py-5">Access Key</th>
              <th className="px-6 py-5">Created On</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {adminsList.map((admin) => (
              <tr key={admin.firestoreId} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      <ShieldCheck size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-900">{admin.adminId}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-slate-600 w-fit">
                    <Key size={12} className="text-slate-400" />
                    {admin.password}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Calendar size={14} className="text-slate-400" />
                    {new Date(admin.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <button
                    type="button"
                    onClick={() => handleDeleteAdmin(admin.firestoreId)}
                    className="p-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
                    title="Revoke Access"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card View - Mobile */}
      <div className="lg:hidden divide-y divide-slate-100">
        {adminsList.map((admin) => (
          <div key={admin.firestoreId} className="p-6 space-y-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#811331]">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{admin.adminId}</p>
                  <p className="text-[14px] font-medium text-slate-400 uppercase tracking-wider">Administrator</p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteAdmin(admin.firestoreId)}
                className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 active:scale-95 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 p-3 rounded-2xl space-y-1">
                <p className="text-[14px] font-bold text-slate-400 uppercase tracking-wider">Access Key</p>
                <p className="text-xs font-mono font-bold text-slate-700 truncate">{admin.password}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl space-y-1">
                <p className="text-[14px] font-bold text-slate-400 uppercase tracking-wider">Created</p>
                <p className="text-xs font-bold text-slate-700">
                  {new Date(admin.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {adminsList.length === 0 && (
        <div className="px-8 py-16 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-300">
            <ShieldCheck size={32} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No admins configured</h3>
          <p className="text-xs text-slate-500 mt-1">Create admin accounts to delegate store management.</p>
        </div>
      )}
    </section>
  );
};

export default AdminsTable;
