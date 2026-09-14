import React from "react";
import { Users, Mail, Phone, MapPin, Calendar, CheckCircle2 } from "lucide-react";

const UsersTable = ({ users }) => (
  <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    {/* Header */}
    <div className="px-6 py-5 sm:px-8 border-b border-slate-100 flex items-center justify-between">
      <div>
        <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2.5">
          <span className="p-1.5 bg-[#b13896]/10 rounded-lg">
            <Users size={15} className="text-[#b13896]" />
          </span>
          Users
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-1 ml-0.5">
          {users.length} registered account{users.length !== 1 ? "s" : ""}
        </p>
      </div>
      <span className="px-3 py-1.5 rounded-full bg-[#b13896]/8 border border-[#b13896]/15 text-[14px] font-bold text-[#b13896] uppercase tracking-wider">
        {users.length} Total
      </span>
    </div>

    {/* Desktop Table */}
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.12em] border-b border-slate-50 bg-slate-50/60">
            <th className="px-8 py-4">User</th>
            <th className="px-5 py-4">Contact</th>
            <th className="px-5 py-4">Address</th>
            <th className="px-5 py-4">Joined</th>
            <th className="px-8 py-4 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50/60 transition-colors group">
              <td className="px-8 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#b13896]/20 to-[#b13896]/10 flex items-center justify-center text-[#b13896] font-bold text-sm border border-[#b13896]/20 flex-shrink-0">
                    {(user.displayName || user.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">
                      {user.displayName || user.name || "Anonymous User"}
                    </p>
                    <p className="text-[14px] text-slate-400 font-mono mt-0.5">
                      {user.id.substring(0, 10)}…
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 space-y-1">
                <div className="flex items-center gap-1.5 text-[12px] text-slate-600 font-medium">
                  <Mail size={11} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate max-w-[160px]">{user.email || "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[14px] text-slate-400 font-medium">
                  <Phone size={11} className="text-slate-400 flex-shrink-0" />
                  {user.phone || "—"}
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-start gap-1.5 text-[12px] text-slate-600 font-medium max-w-[180px]">
                  <MapPin size={11} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{user.address || "No address provided"}</span>
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
                  <Calendar size={11} className="text-slate-400" />
                  {user.createdAt
                    ? new Date(user.createdAt.toDate?.() || user.createdAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </div>
              </td>
              <td className="px-8 py-4 text-right">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[14px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 size={10} />
                  Active
                </span>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="px-8 py-16 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-300">
                  <Users size={28} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">No users found</h3>
                <p className="text-xs text-slate-400">When customers register, they will appear here.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Mobile Cards */}
    <div className="lg:hidden divide-y divide-slate-100">
      {users.map((user) => (
        <div key={user.id} className="p-5 space-y-3 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#b13896]/20 to-[#b13896]/10 flex items-center justify-center text-[#b13896] font-bold border border-[#b13896]/20">
                {(user.displayName || user.name || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{user.displayName || user.name || "Anonymous"}</p>
                <p className="text-[14px] font-medium text-slate-400 mt-0.5">{user.email}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[14px] font-bold text-emerald-600 uppercase border border-emerald-100">
              Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-2.5 rounded-xl">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
              <p className="text-xs font-semibold text-slate-700">{user.phone || "—"}</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Joined</p>
              <p className="text-xs font-semibold text-slate-700">
                {user.createdAt
                  ? new Date(user.createdAt.toDate?.() || user.createdAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>

          {user.address && (
            <div className="bg-slate-50 p-2.5 rounded-xl flex gap-2">
              <MapPin size={13} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-[14px] font-medium text-slate-600 line-clamp-2">{user.address}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  </section>
);

export default UsersTable;
