import React, { useState, useEffect } from "react";
import {
  Scissors,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertTriangle,
  X,
  Check,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { api } from "../../services/api";
import { formatDateTime } from "../../utils/formatters";

interface TailorApplicant {
  id: string;
  userId: string;
  name: string;
  shopName: string;
  email: string;
  phone: string;
  registrationDate: string;
  specialization: string;
  skills: string;
  experience: string;
  address: string;
  city: string;
  state: string;
  documentsUrl: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  isVerified: boolean;
  isAvailable: boolean;
  isActive: boolean;
  maxActiveOrders: number;
  activeOrderCount: number;
  completedOrdersCount: number;
}

export const TailorApplications: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [applications, setApplications] = useState<TailorApplicant[]>([]);
  const [summary, setSummary] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [approvingTailor, setApprovingTailor] = useState<TailorApplicant | null>(null);
  const [rejectingTailor, setRejectingTailor] = useState<TailorApplicant | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<TailorApplicant | null>(null);

  useEffect(() => {
    loadApplications();
  }, [activeSubTab]);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/assignment/admin/tailor-applications", {
        params: { status: activeSubTab, search: searchQuery },
      });
      if (res.data.success) {
        setApplications(res.data.data.applications);
        setSummary(res.data.data.summary);
      }
    } catch (err) {
      console.error("Error loading tailor applications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadApplications();
  };

  const handleApprove = async () => {
    if (!approvingTailor) return;
    setIsSubmitting(true);

    try {
      const res = await api.post(`/assignment/admin/tailor-applications/${approvingTailor.id}/approve`);
      if (res.data.success) {
        setAlertSuccess(
          `Tailor "${approvingTailor.name}" approved successfully! They are now eligible for customer order assignments.`
        );
        setTimeout(() => setAlertSuccess(null), 5000);
        setApprovingTailor(null);
        loadApplications();
      }
    } catch (err: any) {
      alert("Approval error: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingTailor) return;
    if (!rejectionReasonInput.trim() || rejectionReasonInput.trim().length < 3) {
      alert("A valid rejection reason (at least 3 characters) is required.");
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await api.post(`/assignment/admin/tailor-applications/${rejectingTailor.id}/reject`, {
        reason: rejectionReasonInput.trim(),
      });
      if (res.data.success) {
        setAlertSuccess(`Application for "${rejectingTailor.name}" rejected.`);
        setTimeout(() => setAlertSuccess(null), 5000);
        setRejectingTailor(null);
        setRejectionReasonInput("");
        loadApplications();
      }
    } catch (err: any) {
      alert("Rejection error: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (tailor: TailorApplicant) => {
    const nextAvailability = !tailor.isAvailable;
    try {
      const res = await api.put(`/assignment/admin/tailor-applications/${tailor.id}/status`, {
        isAvailable: nextAvailability,
      });
      if (res.data.success) {
        setAlertSuccess(
          `Tailor "${tailor.name}" is now marked as ${nextAvailability ? "Available" : "Unavailable"}.`
        );
        setTimeout(() => setAlertSuccess(null), 4000);
        loadApplications();
      }
    } catch (err: any) {
      alert("Status toggle error: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alertSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{alertSuccess}</span>
          </div>
          <button onClick={() => setAlertSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Partner Accreditation & Verification
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 font-serif mt-1">
            Tailor Partner Applications
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review new tailor registrations, verify alteration skills and workshop capacity, and grant portal access.
          </p>
        </div>

        <button
          onClick={() => loadApplications()}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Applications</span>
        </button>
      </div>

      {/* 3 Sub-tabs for Applications */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl text-xs font-bold w-fit">
        <button
          onClick={() => setActiveSubTab("PENDING")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === "PENDING"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Applications</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeSubTab === "PENDING" ? "bg-amber-700 text-white" : "bg-slate-200 text-slate-700"
          }`}>
            {summary.pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("APPROVED")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === "APPROVED"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Approved Tailors</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeSubTab === "APPROVED" ? "bg-emerald-800 text-white" : "bg-slate-200 text-slate-700"
          }`}>
            {summary.approvedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("REJECTED")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeSubTab === "REJECTED"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected Applications</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeSubTab === "REJECTED" ? "bg-rose-800 text-white" : "bg-slate-200 text-slate-700"
          }`}>
            {summary.rejectedCount}
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search applicants by name, shop, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>
        <span className="text-slate-400 text-[11px] pr-2">
          Displaying {applications.length} {activeSubTab.toLowerCase()} tailor accounts
        </span>
      </div>

      {/* Applications Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Applicant ID & Shop</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Specialization & Experience</th>
                <th className="p-4">Workshop Location</th>
                <th className="p-4">Registration Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-brand-blue" />
                      <span>Loading applications database...</span>
                    </div>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    No {activeSubTab.toLowerCase()} tailor applications found.
                  </td>
                </tr>
              ) : (
                applications.map((tailor) => (
                  <tr key={tailor.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Applicant ID & Shop */}
                    <td className="p-4 align-top">
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-brand-blue" />
                        <span>{tailor.name}</span>
                      </div>
                      <div className="font-semibold text-slate-600 text-[11px] mt-0.5">
                        {tailor.shopName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        ID: {tailor.id.slice(0, 8)}...
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="p-4 align-top space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tailor.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tailor.phone}</span>
                      </div>
                    </td>

                    {/* Specialization & Experience */}
                    <td className="p-4 align-top max-w-xs space-y-1">
                      <div>
                        <span className="font-bold text-slate-800">Specialization: </span>
                        <span className="text-slate-600">{tailor.specialization}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800">Experience: </span>
                        <span className="text-slate-600">{tailor.experience}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Skills: {tailor.skills}
                      </div>
                    </td>

                    {/* Workshop Location */}
                    <td className="p-4 align-top">
                      <div className="text-slate-700">{tailor.address}</div>
                      <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {tailor.city}, {tailor.state}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Docs: {tailor.documentsUrl}
                      </div>
                    </td>

                    {/* Registration Date */}
                    <td className="p-4 align-top text-slate-500 text-[11px]">
                      {formatDateTime(tailor.registrationDate)}
                    </td>

                    {/* Status */}
                    <td className="p-4 align-top">
                      {tailor.approvalStatus === "PENDING" && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                        </span>
                      )}
                      {tailor.approvalStatus === "APPROVED" && (
                        <div className="space-y-1">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Approved & Active
                          </span>
                          <div className="text-[10px] text-slate-500">
                            {tailor.isAvailable ? "🟢 Available for orders" : "🔴 Unavailable"}
                          </div>
                        </div>
                      )}
                      {tailor.approvalStatus === "REJECTED" && (
                        <div className="space-y-1">
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" /> Rejected
                          </span>
                          {tailor.rejectionReason && (
                            <p className="text-[10px] text-rose-700 italic max-w-xs">
                              Reason: "{tailor.rejectionReason}"
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-top text-right">
                      {tailor.approvalStatus === "PENDING" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setApprovingTailor(tailor)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] shadow-sm flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectingTailor(tailor);
                              setRejectionReasonInput("");
                            }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-[11px] transition-colors"
                          >
                            <X className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {tailor.approvalStatus === "APPROVED" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(tailor)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] border transition-colors ${
                              tailor.isAvailable
                                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            {tailor.isAvailable ? "Set Unavailable" : "Set Available"}
                          </button>
                          <button
                            onClick={() => setSelectedProfile(tailor)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px]"
                          >
                            View
                          </button>
                        </div>
                      )}

                      {tailor.approvalStatus === "REJECTED" && (
                        <button
                          onClick={() => setApprovingTailor(tailor)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px]"
                        >
                          Reconsider / Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: APPROVE CONFIRMATION */}
      {/* ========================================================================= */}
      {approvingTailor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 font-serif">
                Approve Tailor Application
              </h3>
              <p className="text-xs text-slate-500">
                Grant operational authorization to <strong>{approvingTailor.name}</strong> ({approvingTailor.shopName}).
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1 text-slate-700">
              <p>• Tailor will be moved to <strong>Approved Tailors</strong>.</p>
              <p>• Tailor becomes eligible for customer order assignments.</p>
              <p>• An in-app approval notification will be dispatched to their account.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setApprovingTailor(null)}
                className="w-1/2 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleApprove}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Approval</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REJECT CONFIRMATION WITH MANDATORY REASON */}
      {/* ========================================================================= */}
      {rejectingTailor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 font-serif">
                Reject Tailor Application
              </h3>
              <p className="text-xs text-slate-500">
                Application for <strong>{rejectingTailor.name}</strong> will be moved to Rejected Applications.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-xs text-slate-700 block">
                Rejection Reason * <span className="text-slate-400 font-normal">(Required)</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Specify reason (e.g. Incomplete verification documents, outside service perimeter, capacity unavailable)..."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRejectingTailor(null)}
                className="w-1/2 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting || !rejectionReasonInput.trim()}
                onClick={handleReject}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW TAILOR DOSSIER */}
      {/* ========================================================================= */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-slate-900 font-serif">Tailor Partner Profile</h3>
              <button onClick={() => setSelectedProfile(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{selectedProfile.name}</h4>
                  <p className="text-slate-500">{selectedProfile.shopName}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                  {selectedProfile.approvalStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">Email</span>
                  <span className="font-semibold text-slate-800">{selectedProfile.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Phone</span>
                  <span className="font-semibold text-slate-800">{selectedProfile.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Specialization</span>
                  <span className="font-semibold text-slate-800">{selectedProfile.specialization}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Active Workload</span>
                  <span className="font-semibold text-slate-800">{selectedProfile.activeOrderCount} / {selectedProfile.maxActiveOrders} orders</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Workshop Address</span>
                <span className="text-slate-700">{selectedProfile.address}, {selectedProfile.city}, {selectedProfile.state}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Skills & Experience</span>
                <p className="text-slate-700 mt-0.5">{selectedProfile.skills} • {selectedProfile.experience}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedProfile(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
