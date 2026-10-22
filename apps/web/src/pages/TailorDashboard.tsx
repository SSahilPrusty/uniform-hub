import React, { useState, useEffect } from "react";
import {
  Scissors,
  CheckCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Ruler,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  Phone,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Eye,
} from "lucide-react";
import { api } from "../services/api";
import { formatINR, formatDateTime } from "../utils/formatters";

interface AssignedOrder {
  assignmentId: string;
  assignmentStatus: string;
  assignmentMethod: string;
  assignedAt: string;
  acceptedAt?: string | null;
  expectedCompletionDate?: string | null;
  orderId: string;
  orderNumber: string;
  orderReceivedDate: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    id: string;
    productName: string;
    size: string;
    color?: string | null;
    price: number;
    quantity: number;
    productImageUrl?: string | null;
    measurement?: {
      studentName: string;
      gender: string;
      chest?: number;
      waist?: number;
      shoulder?: number;
      sleeveLength?: number;
      shirtLength?: number;
      trouserLength?: number;
      hip?: number;
      skirtLength?: number;
      notes?: string;
    } | null;
  }>;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  productionStatus: string;
  priority: string;
  notes?: string | null;
}

export const TailorDashboard: React.FC = () => {
  const [tailorData, setTailorData] = useState<any>(null);
  const [assignedOrders, setAssignedOrders] = useState<AssignedOrder[]>([]);
  const [metrics, setMetrics] = useState({
    activeCount: 0,
    completedCount: 0,
    awaitingAcceptance: 0,
    capacity: 10,
    availableSlots: 10,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "COMPLETED" | "ALL">("ACTIVE");

  // Rejection modal
  const [rejectingOrder, setRejectingOrder] = useState<AssignedOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Status update modal
  const [updatingOrder, setUpdatingOrder] = useState<AssignedOrder | null>(null);
  const [newStatusSelection, setNewStatusSelection] = useState("IN_PROGRESS");
  const [statusNotes, setStatusNotes] = useState("");
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Success alert
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTailorWorkspace();
  }, []);

  const loadTailorWorkspace = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/assignment/tailor/my-orders");
      if (res.data.success) {
        setTailorData(res.data.data.tailor);
        setAssignedOrders(res.data.data.orders);
        setMetrics(res.data.data.metrics);
      }
    } catch (err) {
      console.error("Error loading tailor workspace:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (orderId: string) => {
    try {
      const res = await api.post(`/assignment/tailor/${orderId}/accept`);
      if (res.data.success) {
        setAlertSuccess("Order assignment accepted! Scheduled in your active tailoring queue.");
        setTimeout(() => setAlertSuccess(null), 4000);
        loadTailorWorkspace();
      }
    } catch (err: any) {
      alert("Accept error: " + (err.response?.data?.error || err.message));
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingOrder) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 3) {
      alert("A valid rejection reason (at least 3 characters) is required.");
      return;
    }
    setIsSubmittingReject(true);

    try {
      const res = await api.post(`/assignment/tailor/${rejectingOrder.orderId}/reject`, {
        reason: rejectionReason.trim(),
      });
      if (res.data.success) {
        setAlertSuccess(
          `Order #${rejectingOrder.orderNumber} rejected and returned to Operations Admin reassignment queue.`
        );
        setTimeout(() => setAlertSuccess(null), 5000);
        setRejectingOrder(null);
        setRejectionReason("");
        loadTailorWorkspace();
      }
    } catch (err: any) {
      alert("Rejection error: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleStatusChangeSubmit = async () => {
    if (!updatingOrder) return;
    setIsSubmittingStatus(true);

    try {
      const res = await api.put(`/assignment/orders/${updatingOrder.orderId}/production-status`, {
        newStatus: newStatusSelection,
        notes: statusNotes || undefined,
      });

      if (res.data.success) {
        setAlertSuccess(`Production status updated to ${newStatusSelection.replace(/_/g, " ")}`);
        setTimeout(() => setAlertSuccess(null), 4000);
        setUpdatingOrder(null);
        setStatusNotes("");
        loadTailorWorkspace();
      }
    } catch (err: any) {
      alert("Status update error: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const filteredOrders = assignedOrders.filter((order) => {
    if (activeTab === "ACTIVE") {
      return !["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"].includes(
        order.productionStatus
      );
    }
    if (activeTab === "COMPLETED") {
      return ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED"].includes(order.productionStatus);
    }
    return true;
  });

  if (isLoading && !tailorData) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-brand-blue animate-spin" />
        <span className="text-xs text-slate-500 font-semibold">Loading Tailor Workbench...</span>
      </div>
    );
  }

  const isPendingApproval = tailorData?.approvalStatus === "PENDING";
  const isRejected = tailorData?.approvalStatus === "REJECTED";

  return (
    <div className="space-y-6">
      {/* Alert banner */}
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

      {/* Pending Approval Notice */}
      {isPendingApproval && (
        <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-3xl text-xs space-y-2 text-amber-900 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 font-black text-sm text-amber-800 uppercase tracking-wider">
            <Clock className="w-5 h-5 text-amber-600 animate-spin" />
            <span>Tailoring Partner Application Under Review</span>
          </div>
          <p className="leading-relaxed">
            Your registration as <strong>{tailorData.shopName}</strong> has been received and is currently under review by Uniform Hub Operations. Once an Operational Administrator approves your application, you will be authorized and eligible to receive customer uniform order assignments.
          </p>
        </div>
      )}

      {/* Rejected Notice */}
      {isRejected && (
        <div className="p-5 bg-rose-50 border-2 border-rose-300 rounded-3xl text-xs space-y-2 text-rose-900 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 font-black text-sm text-rose-800 uppercase tracking-wider">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Application Not Approved</span>
          </div>
          <p className="leading-relaxed">
            Your tailoring partner registration was not approved.
            {tailorData.rejectionReason && (
              <span className="block mt-1 font-semibold text-rose-700">
                Reason: "{tailorData.rejectionReason}"
              </span>
            )}
          </p>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            <Scissors className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 font-serif">
                {tailorData?.shopName || "Master Tailoring Studio"}
              </h1>
              {tailorData?.isVerified && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Accredited Tailor
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Master Tailor: <strong>{tailorData?.tailorName}</strong> • {tailorData?.city}, {tailorData?.state}
            </p>
            {tailorData?.specializations && (
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                Specialization: {tailorData.specializations}
              </p>
            )}
          </div>
        </div>

        {/* Workload KPI indicators */}
        <div className="flex items-center gap-3 text-xs font-bold">
          <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-200 min-w-[100px]">
            <span className="text-slate-400 block text-[10px] uppercase">Active Orders</span>
            <span className="text-xl text-brand-blue font-black">{metrics.activeCount}</span>
            <span className="text-[9px] text-slate-400 block">/ {metrics.capacity} capacity</span>
          </div>

          <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-200 min-w-[100px]">
            <span className="text-slate-400 block text-[10px] uppercase">New Pending</span>
            <span className="text-xl text-amber-600 font-black">{metrics.awaitingAcceptance}</span>
            <span className="text-[9px] text-amber-600 block">Requires Accept</span>
          </div>

          <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-200 min-w-[100px]">
            <span className="text-slate-400 block text-[10px] uppercase">Completed</span>
            <span className="text-xl text-emerald-600 font-black">{metrics.completedCount}</span>
            <span className="text-[9px] text-emerald-600 block">Finished Orders</span>
          </div>
        </div>
      </div>

      {/* Assigned Orders Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 font-serif">
              My Assigned Orders
            </h2>
            <p className="text-xs text-slate-500">
              Only orders assigned strictly to your tailoring workbench are visible here.
            </p>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-1.5 p-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm">
            <button
              onClick={() => setActiveTab("ACTIVE")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === "ACTIVE" ? "bg-brand-blue text-white shadow-sm" : "hover:text-slate-900"
              }`}
            >
              Active Work ({metrics.activeCount})
            </button>
            <button
              onClick={() => setActiveTab("COMPLETED")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === "COMPLETED" ? "bg-brand-blue text-white shadow-sm" : "hover:text-slate-900"
              }`}
            >
              Completed ({metrics.completedCount})
            </button>
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === "ALL" ? "bg-brand-blue text-white shadow-sm" : "hover:text-slate-900"
              }`}
            >
              All Orders ({assignedOrders.length})
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400 shadow-sm">
            <Scissors className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-600">No {activeTab.toLowerCase()} assigned orders.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              New customer orders assigned by Operations Admin will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order) => {
              const isAwaitingAcceptance = order.assignmentStatus === "ASSIGNED";
              const isOverdue =
                order.expectedCompletionDate &&
                new Date(order.expectedCompletionDate) < new Date() &&
                !["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED"].includes(order.productionStatus);

              return (
                <div
                  key={order.orderId}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all text-xs"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 font-mono text-sm">
                        #{order.orderNumber}
                      </span>
                      {order.priority === "URGENT" && (
                        <span className="px-2 py-0.5 bg-rose-500 text-white rounded text-[9px] font-black uppercase">
                          Urgent Priority
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        Received: {formatDateTime(order.orderReceivedDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-blue-100 text-brand-blue rounded-full font-bold text-[10px] uppercase">
                        Production: {order.productionStatus.replace(/_/g, " ")}
                      </span>
                      {isAwaitingAcceptance && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] uppercase animate-pulse">
                          ⚠️ Action Required: Accept / Reject
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer & Deadline */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Customer Name</span>
                      <strong className="text-slate-900">{order.customerName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Customer Phone</span>
                      <span className="text-slate-700">{order.customerPhone || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Target Completion</span>
                      <span className={isOverdue ? "text-rose-600 font-bold" : "text-slate-800 font-bold"}>
                        {order.expectedCompletionDate
                          ? new Date(order.expectedCompletionDate).toLocaleDateString()
                          : "5 Business Days"}
                        {isOverdue && " (Overdue)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Payment Status</span>
                      <span className="text-emerald-700 font-bold">{order.paymentStatus}</span>
                    </div>
                  </div>

                  {/* Ordered Items & Customer Selected Sizes */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs">
                      Garments & Customer-Selected Sizes:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {order.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs">{it.productName}</span>
                            <span className="px-2.5 py-1 bg-brand-blue text-white rounded-lg font-black text-xs">
                              Size: {it.size}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Quantity: <strong className="text-slate-800">{it.quantity}</strong>
                          </p>

                          {/* Bespoke measurements */}
                          {it.measurement && (
                            <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1.5 text-[10px]">
                              <span className="font-bold text-purple-900 flex items-center gap-1">
                                <Ruler className="w-3.5 h-3.5 text-purple-700" />
                                Measurements for: {it.measurement.studentName} ({it.measurement.gender})
                              </span>
                              <div className="grid grid-cols-3 gap-1 font-medium text-slate-700">
                                {it.measurement.chest && <div>Chest: <strong>{it.measurement.chest}"</strong></div>}
                                {it.measurement.waist && <div>Waist: <strong>{it.measurement.waist}"</strong></div>}
                                {it.measurement.shoulder && <div>Shoulder: <strong>{it.measurement.shoulder}"</strong></div>}
                                {it.measurement.sleeveLength && <div>Sleeve: <strong>{it.measurement.sleeveLength}"</strong></div>}
                                {it.measurement.shirtLength && <div>Shirt Len: <strong>{it.measurement.shirtLength}"</strong></div>}
                                {it.measurement.trouserLength && <div>Trouser: <strong>{it.measurement.trouserLength}"</strong></div>}
                              </div>
                              {it.measurement.notes && (
                                <p className="italic text-purple-800">Note: {it.measurement.notes}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special instructions */}
                  {order.notes && (
                    <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                      <strong>Customer Special Instructions:</strong> {order.notes}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100">
                    {isAwaitingAcceptance ? (
                      <>
                        <button
                          onClick={() => {
                            setRejectingOrder(order);
                            setRejectionReason("");
                          }}
                          className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl font-bold text-xs transition-colors"
                        >
                          Reject Assignment
                        </button>
                        <button
                          onClick={() => handleAccept(order.orderId)}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Order</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        {order.productionStatus === "ACCEPTED" && (
                          <button
                            onClick={() => {
                              setUpdatingOrder(order);
                              setNewStatusSelection("IN_PROGRESS");
                            }}
                            className="px-4 py-2 bg-brand-blue hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-colors"
                          >
                            Start Work (Cutting & Stitching)
                          </button>
                        )}

                        {order.productionStatus === "IN_PROGRESS" && (
                          <button
                            onClick={() => {
                              setUpdatingOrder(order);
                              setNewStatusSelection("QUALITY_CHECK");
                            }}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-colors"
                          >
                            Submit to Quality Check
                          </button>
                        )}

                        {order.productionStatus === "QUALITY_CHECK" && (
                          <button
                            onClick={() => {
                              setUpdatingOrder(order);
                              setNewStatusSelection("READY_FOR_DISPATCH");
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors"
                          >
                            Mark Ready for Dispatch
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setUpdatingOrder(order);
                            setNewStatusSelection(order.productionStatus);
                          }}
                          className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors"
                        >
                          Update Production Progress
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: REJECT ASSIGNMENT WITH MANDATORY REASON */}
      {/* ========================================================================= */}
      {rejectingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 font-serif">
                Reject Order Assignment
              </h3>
              <p className="text-slate-500">
                Rejecting Order <strong>#{rejectingOrder.orderNumber}</strong> will immediately return it to the Operations Admin reassignment queue.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                Reason for Rejection * <span className="text-slate-400 font-normal">(Required)</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Fabric shortage, machine breakdown, specialized embroidery required..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRejectingOrder(null)}
                className="w-1/2 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingReject || !rejectionReason.trim()}
                onClick={handleRejectConfirm}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingReject ? (
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
      {/* MODAL: UPDATE PRODUCTION STATUS */}
      {/* ========================================================================= */}
      {updatingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-extrabold text-slate-900 font-serif">
              Update Production Status: #{updatingOrder.orderNumber}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Pipeline Stage</label>
                <select
                  value={newStatusSelection}
                  onChange={(e) => setNewStatusSelection(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold"
                >
                  <option value="ACCEPTED">Accepted by Tailor</option>
                  <option value="IN_PROGRESS">In Progress (Cutting / Stitching)</option>
                  <option value="QUALITY_CHECK">Quality Check / Inspection</option>
                  <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Workbench Notes (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Sizing adjustments made, bar tack reinforcement completed..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setUpdatingOrder(null)}
                  className="w-1/2 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmittingStatus}
                  onClick={handleStatusChangeSubmit}
                  className="w-1/2 py-2.5 bg-brand-blue hover:bg-blue-800 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingStatus ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Progress</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
