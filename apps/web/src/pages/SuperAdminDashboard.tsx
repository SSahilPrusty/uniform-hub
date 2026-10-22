import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  ShieldAlert,
  Users,
  DollarSign,
  ClipboardList,
  Image as ImageIcon,
  CheckCircle,
  Save,
  Search,
  ExternalLink,
} from "lucide-react";
import { api } from "../services/api";
import { formatINR, formatDateTime } from "../utils/formatters";

export const SuperAdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // User search
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "overview") {
        const res = await api.get("/super-admin/overview");
        if (res.data.success) setOverview(res.data.data);
      } else if (activeTab === "users") {
        const res = await api.get(`/super-admin/users?search=${encodeURIComponent(userSearch)}`);
        if (res.data.success) setUsers(res.data.data);
      } else if (activeTab === "financials") {
        const res = await api.get("/super-admin/financial-settings");
        if (res.data.success) setSettings(res.data.data);
      } else if (activeTab === "audit") {
        const res = await api.get("/super-admin/audit-logs");
        if (res.data.success) setAuditLogs(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/super-admin/users/${userId}/role`, { role: newRole });
      alert("Role updated successfully.");
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      await api.put(`/super-admin/settings/${key}`, { value });
      alert(`Setting '${key}' updated.`);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (isLoading && !overview && users.length === 0) {
    return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-navy text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Governance & Root Administration</span>
          <h1 className="text-2xl font-extrabold font-serif mt-1">Super Admin Security Panel</h1>
          <p className="text-xs text-slate-300 mt-0.5">Role permissions, transparent financial splits, and audit compliance</p>
        </div>

        {/* Link to Mandatory Product Images Page */}
        <Link
          to="/super-admin/product-images"
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-colors"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Product Images & Media Studio</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 overflow-x-auto shadow-sm">
        <button
          onClick={() => setSearchParams({ tab: "overview" })}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "overview" ? "bg-brand-blue text-white shadow-sm" : "hover:text-slate-900"
          }`}
        >
          Platform Financial Overview
        </button>
        <button
          onClick={() => setSearchParams({ tab: "users" })}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "users" ? "bg-brand-blue text-white shadow-sm" : "hover:text-slate-900"
          }`}
        >
          User Roles Governance
        </button>
        <button
          onClick={() => setSearchParams({ tab: "financials" })}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "financials" ? "bg-brand-blue text-white shadow-sm" : "hover:text-slate-900"
          }`}
        >
          Commission & Tax Settings
        </button>
        <button
          onClick={() => setSearchParams({ tab: "audit" })}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "audit" ? "bg-brand-blue text-white shadow-sm" : "hover:text-slate-900"
          }`}
        >
          Platform Audit Trail
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && overview && (
        <div className="space-y-6">
          {/* Transparent Financial Separation */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Platform Financial Split (Gross Sales vs Revenue)
            </h2>
            <p className="text-xs text-slate-500">
              Clear mathematical separation between Gross Merchandise Value (GMV), customer discounts, platform fees, and vendor payouts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Gross Merchandise Value</span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">{formatINR(overview.financials.grossOrderValue)}</p>
                <span className="text-[10px] text-slate-400">Total customer orders placed</span>
              </div>

              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-700 uppercase">Platform Commission (Earned)</span>
                <p className="text-xl font-extrabold text-emerald-800 mt-1">{formatINR(overview.financials.platformCommissionEarned)}</p>
                <span className="text-[10px] text-emerald-600">{overview.financials.commissionPercent}% platform cut</span>
              </div>

              <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200">
                <span className="text-[11px] font-bold text-blue-700 uppercase">Vendor Payouts (Payable)</span>
                <p className="text-xl font-extrabold text-brand-blue mt-1">{formatINR(overview.financials.vendorPayoutsPayable)}</p>
                <span className="text-[10px] text-blue-600">Disbursable to franchises & tailors</span>
              </div>

              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
                <span className="text-[11px] font-bold text-amber-700 uppercase">Customer Discounts Given</span>
                <p className="text-xl font-extrabold text-amber-800 mt-1">{formatINR(overview.financials.totalDiscounts)}</p>
                <span className="text-[10px] text-amber-600">Via coupon vouchers</span>
              </div>
            </div>
          </div>

          {/* User Distribution by Role */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 font-serif">Platform Registered Users by Role</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {overview.usersByRole.map((u: any) => (
                <div key={u.role} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">{u.role.replace("_", " ")}</span>
                  <span className="text-xl font-extrabold text-slate-900 mt-1 block">{u.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 font-serif">Manage User Access & Roles</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="text-xs p-2 border border-slate-300 rounded-xl focus:outline-none"
              />
              <button
                onClick={loadData}
                className="px-3 py-1.5 bg-brand-blue text-white rounded-xl text-xs font-bold"
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b">
                <tr>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Current Role</th>
                  <th className="py-3 px-3">Assign New Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-3 text-slate-500">{u.email}</td>
                    <td className="py-3 px-3">{u.phone || "—"}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-brand-blue">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        defaultValue={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="p-1 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                      >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="SCHOOL_ADMIN">SCHOOL_ADMIN</option>
                        <option value="FRANCHISE_ADMIN">FRANCHISE_ADMIN</option>
                        <option value="TAILOR">TAILOR</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Financial Settings Tab */}
      {activeTab === "financials" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 max-w-2xl">
          <h2 className="text-base font-bold text-slate-900 font-serif">Platform Financial & Commission Rules</h2>
          <div className="space-y-4 text-xs">
            {settings.map((s) => (
              <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 font-mono">{s.key}</span>
                  <p className="text-[11px] text-slate-500">{s.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue={s.value}
                    id={`input-${s.key}`}
                    className="w-28 p-1.5 border border-slate-300 rounded-lg text-center font-bold font-mono bg-white"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById(`input-${s.key}`) as HTMLInputElement;
                      if (input) handleUpdateSetting(s.key, input.value);
                    }}
                    className="px-3 py-1.5 bg-brand-blue text-white rounded-lg font-bold hover:bg-blue-800 transition-colors flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 font-serif">System Audit Trail ({auditLogs.length} Events)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b">
                <tr>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Actor / Admin</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Entity Type</th>
                  <th className="py-3 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{formatDateTime(log.createdAt)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{log.userName || "System"}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-brand-blue">{log.action}</td>
                    <td className="py-2.5 px-3">{log.entityType}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-[280px] truncate">{log.details || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
