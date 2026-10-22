import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users,
  Building,
  Store,
  Scissors,
  Package,
  ShoppingCart,
  FileCheck,
  Download,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Search,
} from "lucide-react";
import { api } from "../services/api";
import { formatINR, formatDateTime } from "../utils/formatters";
import { CustomerOrderAssignment } from "../components/admin/CustomerOrderAssignment";
import { TailorApplications } from "../components/admin/TailorApplications";

export const AdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const [statsData, setStatsData] = useState<any>(null);
  const [approvalsData, setApprovalsData] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "overview") {
        const res = await api.get("/admin/dashboard");
        if (res.data.success) setStatsData(res.data.data);
      } else if (activeTab === "approvals") {
        const res = await api.get("/admin/approvals");
        if (res.data.success) setApprovalsData(res.data.data);
      } else if (activeTab === "schools") {
        const res = await api.get("/admin/schools");
        if (res.data.success) setSchools(res.data.data);
      } else if (activeTab === "customers") {
        const res = await api.get("/admin/customers");
        if (res.data.success) setCustomers(res.data.data);
      } else if (activeTab === "orders") {
        const res = await api.get("/admin/orders");
        if (res.data.success) setOrders(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveProduct = async (requestId: string, action: "APPROVED" | "REJECTED") => {
    try {
      await api.put(`/admin/approvals/products/${requestId}`, { action });
      alert(`Product ${action.toLowerCase()}!`);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleApproveCatalogRequest = async (requestId: string, action: "APPROVED" | "REJECTED") => {
    try {
      await api.put(`/admin/approvals/catalogs/${requestId}`, { action });
      alert(`School catalog request marked as ${action}!`);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleToggleCustomer = async (userId: string, currentActive: boolean) => {
    try {
      await api.put(`/admin/customers/${userId}/status`, { isActive: !currentActive });
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleToggleSchoolVerify = async (schoolId: string, currentVerified: boolean) => {
    try {
      await api.put(`/admin/schools/${schoolId}/verify`, { isVerified: !currentVerified });
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleExportCsv = () => {
    window.open(`${api.defaults.baseURL}/admin/reports/export?type=orders`, "_blank");
  };

  if (isLoading && !statsData && !approvalsData) {
    return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-blue">Uniform Hub Platform Administration</span>
          <h1 className="text-xl font-extrabold text-slate-900 font-serif mt-0.5">Operations Command Desk</h1>
          <p className="text-xs text-slate-500 mt-1">Real database calculated statistics, catalog approvals, and partner verifications</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Orders CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 overflow-x-auto shadow-sm">
        <button
          onClick={() => setSearchParams({ tab: "overview" })}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "overview" ? "bg-brand-blue text-white shadow-sm" : "hover:text-slate-900"
          }`}
        >
          Overview Stats
        </button>
        <button
          onClick={() => setSearchParams({ tab: "order-assignment" })}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === "order-assignment" ? "bg-brand-blue text-white shadow-sm" : "hover:text-slate-900"
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Customer Order Assignment</span>
        </button>
        <button
          onClick={() => setSearchParams({ tab: "tailor-applications" })}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === "tailor-applications" ? "bg-brand-blue text-white shadow-sm" : "hover:text-slate-900"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Tailor Applications</span>
        </button>
        <button
          onClick={() => setSearchParams({ tab: "approvals" })}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "approvals" ? "bg-brand-blue text-white shadow-sm" : "hover:text-slate-900"
          }`}
        >
          Pending Approvals
        </button>
        <button
          onClick={() => setSearchParams({ tab: "schools" })}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "schools" ? "bg-brand-blue text-white shadow-sm" : "hover:text-slate-900"
          }`}
        >
          School Verifications
        </button>
        <button
          onClick={() => setSearchParams({ tab: "orders" })}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "orders" ? "bg-brand-blue text-white shadow-sm" : "hover:text-slate-900"
          }`}
        >
          Orders Oversight
        </button>
        <button
          onClick={() => setSearchParams({ tab: "customers" })}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === "customers" ? "bg-brand-blue text-white shadow-sm" : "hover:text-slate-900"
          }`}
        >
          Customer Directory
        </button>
      </div>

      {/* Overview Stats Tab */}
      {activeTab === "overview" && statsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Customers</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{statsData.stats.totalCustomers}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Partner Schools</span>
              <p className="text-2xl font-extrabold text-brand-blue mt-1">{statsData.stats.totalSchools}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Franchises</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{statsData.stats.totalFranchises}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Tailor Partners</span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">{statsData.stats.totalTailors}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Catalog Items</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{statsData.stats.totalProducts}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-amber-500 uppercase">Pending Approvals</span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">{statsData.stats.pendingApprovals}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Orders</span>
              <p className="text-2xl font-extrabold text-brand-blue mt-1">{statsData.stats.totalOrders}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-500 uppercase">Gross Revenue (INR)</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatINR(statsData.stats.grossRevenue)}</p>
            </div>
          </div>

          {/* Activity Trail */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-serif">Recent Operational Activities</h3>
            <div className="divide-y divide-slate-100">
              {statsData.recentActivities.map((act: any) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{act.action}</span>
                    <span className="text-slate-500 ml-2">by {act.userName || "System"}</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{formatDateTime(act.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === "approvals" && approvalsData && (
        <div className="space-y-6">
          {/* Product Approval Requests */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Submitted Product Listings ({approvalsData.productRequests.length})
            </h3>
            {approvalsData.productRequests.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No pending product listings.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {approvalsData.productRequests.map((req: any) => (
                  <div key={req.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{req.product?.name}</h4>
                      <p className="text-slate-500 mt-0.5">
                        Category: {req.product?.category?.name} • Submitted by: <strong>{req.submittedBy}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">{req.product?.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.status === "PENDING" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                        {req.status}
                      </span>
                      {req.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApproveProduct(req.id, "APPROVED")}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleApproveProduct(req.id, "REJECTED")}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* School Catalog Onboarding Requests */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-serif">
              School Onboarding & Design Inquiries ({approvalsData.catalogRequests.length})
            </h3>
            <div className="divide-y divide-slate-100">
              {approvalsData.catalogRequests.map((req: any) => (
                <div key={req.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{req.schoolName}</h4>
                    <p className="text-slate-500 mt-0.5">
                      Location: {req.city}, {req.state} • Requested by: <strong>{req.requesterName}</strong> ({req.requesterRole})
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1 italic">"{req.uniformDescription}"</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {req.status}
                    </span>
                    {req.status === "PENDING" && (
                      <button
                        onClick={() => handleApproveCatalogRequest(req.id, "APPROVED")}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg"
                      >
                        Verify & Onboard School
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schools Verification Tab */}
      {activeTab === "schools" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-serif">Partner Schools Directory ({schools.length})</h3>
          <div className="divide-y divide-slate-100">
            {schools.map((school) => (
              <div key={school.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{school.name}</h4>
                  <p className="text-slate-500">{school.city}, {school.state} • Code: {school.code}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${school.isVerified ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                    {school.isVerified ? "Verified" : "Unverified"}
                  </span>
                  <button
                    onClick={() => handleToggleSchoolVerify(school.id, school.isVerified)}
                    className="px-3 py-1 rounded-lg border border-slate-300 font-bold hover:bg-slate-50"
                  >
                    Toggle Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Oversight Tab */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-serif">All Customer Orders ({orders.length})</h3>
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-slate-900">#{order.orderNumber}</span>
                  <p className="text-slate-500 mt-0.5">{order.customerName} ({order.customerEmail}) • Total: {formatINR(order.totalAmount)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-blue-100 text-brand-blue">
                    {order.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${order.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === "customers" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-serif">Customer Directory ({customers.length})</h3>
          <div className="divide-y divide-slate-100">
            {customers.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{c.name}</h4>
                  <p className="text-slate-500">{c.email} • Orders Placed: {c._count?.orders || 0}</p>
                </div>

                <button
                  onClick={() => handleToggleCustomer(c.id, c.isActive)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold border ${
                    c.isActive
                      ? "border-emerald-300 text-emerald-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                      : "border-red-300 text-red-700 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {c.isActive ? "Active (Click to Suspend)" : "Suspended (Click to Reactivate)"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Order Assignment Tab */}
      {activeTab === "order-assignment" && <CustomerOrderAssignment />}

      {/* Tailor Applications Tab */}
      {activeTab === "tailor-applications" && <TailorApplications />}
    </div>
  );
};
