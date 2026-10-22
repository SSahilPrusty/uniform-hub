import React, { useState, useEffect } from "react";
import { GraduationCap, ShieldCheck, Plus, Package, FileCheck, CheckCircle, Clock } from "lucide-react";
import { api } from "../services/api";

export const SchoolDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New design submission modal
  const [designModalOpen, setDesignModalOpen] = useState(false);
  const [designForm, setDesignForm] = useState({
    uniformDescription: "",
    referenceImageUrl: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSchoolData();
  }, []);

  const loadSchoolData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/portal/school/dashboard");
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDesignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/portal/school/designs", designForm);
      if (res.data.success) {
        alert(res.data.message);
        setDesignModalOpen(false);
        setDesignForm({ uniformDescription: "", referenceImageUrl: "", notes: "" });
        loadSchoolData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!data) return <div>School portal profile not loaded.</div>;

  return (
    <div className="space-y-6">
      {/* School Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center p-1.5 flex-shrink-0">
            {data.school.logo ? (
              <img src={data.school.logo} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <GraduationCap className="w-8 h-8 text-brand-blue" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900 font-serif">{data.school.name}</h1>
              {data.school.isVerified && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Institution
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Affiliation Code: <strong>{data.school.code}</strong> • {data.school.city}, {data.school.state}
            </p>
            <p className="text-xs text-slate-600 font-medium pt-1">
              Representative: {data.principalName || "School Head / Principal"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setDesignModalOpen(true)}
          className="px-4 py-2.5 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Submit New Uniform Design</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Approved Products</span>
            <p className="text-2xl font-extrabold text-brand-blue mt-1">{data.metrics.approvedProductsCount}</p>
          </div>
          <div className="p-3 bg-blue-50 text-brand-blue rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Design Requests</span>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{data.metrics.pendingRequestsCount}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Approved Products */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 font-serif">Current Approved Uniform Catalog</h2>

        {data.approvedProducts.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No live uniforms mapped to this school yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.approvedProducts.map((p: any) => (
              <div key={p.id} className="border border-slate-200 rounded-2xl p-3 flex gap-3 items-center">
                <img
                  src={p.images[0]?.url || "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=100&q=80"}
                  alt=""
                  className="w-14 h-16 object-cover rounded-xl bg-slate-100 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>
                  <span className="text-[10px] text-brand-blue font-semibold uppercase">{p.category?.name}</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">{p.variants?.length || 0} Size Variants</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Catalog Change Requests */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 font-serif">Recent Uniform Pattern Requests</h2>

        {data.recentRequests.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No past requests recorded.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentRequests.map((req: any) => (
              <div key={req.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{req.uniformDescription}</p>
                  <span className="text-[10px] text-slate-400">Submitted on {new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    req.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800"
                      : req.status === "REJECTED"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Design Modal */}
      {designModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-base">Submit New Uniform Pattern Design</h3>
            <p className="text-slate-500">
              Submit your school's revised uniform patterns, crest embroidery specifications, or house color jerseys.
            </p>

            <form onSubmit={handleDesignSubmit} className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Design & Color Specifications *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Navy blazer with golden buttons and school crest monogram on left pocket..."
                  value={designForm.uniformDescription}
                  onChange={(e) => setDesignForm({ ...designForm, uniformDescription: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Reference Sample Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/sample-uniform.jpg"
                  value={designForm.referenceImageUrl}
                  onChange={(e) => setDesignForm({ ...designForm, referenceImageUrl: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Internal Notes for Admin Desk</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Mandatory for classes 9-12 from upcoming session."
                  value={designForm.notes}
                  onChange={(e) => setDesignForm({ ...designForm, notes: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDesignModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-brand-blue text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit to Admin Desk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
