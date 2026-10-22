import React, { useState, useEffect } from "react";
import {
  Scissors,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  User,
  Phone,
  Tag,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  X,
  Check,
  AlertTriangle,
  Users,
} from "lucide-react";
import { api } from "../../services/api";
import { formatINR, formatDateTime } from "../../utils/formatters";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  size: string;
  color?: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  productImageUrl?: string | null;
  customMeasurementId?: string | null;
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
}

interface AssignedTailor {
  id: string;
  tailorName: string;
  shopName: string;
  phone: string;
  city: string;
  specializations?: string;
  maxActiveOrders: number;
  activeOrderCount: number;
}

interface OrderAssignment {
  id: string;
  tailorId: string;
  assignmentMethod: string;
  status: string;
  expectedCompletionDate?: string;
  notes?: string;
  assignedAt: string;
  tailor?: AssignedTailor;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  productionStatus: string;
  priority: string;
  expectedCompletionDate?: string;
  createdAt: string;
  items: OrderItem[];
  currentAssignment?: OrderAssignment | null;
  assignedTailor?: AssignedTailor | null;
}

interface TailorCandidate {
  id: string;
  tailorId?: string;
  userId: string;
  name: string;
  shopName: string;
  email?: string;
  phone: string;
  city: string;
  state?: string;
  specialization?: string;
  specializations?: string;
  skills?: string;
  approvalStatus: string;
  accountStatus?: string;
  availabilityStatus?: string;
  isAvailable: boolean;
  isActive: boolean;
  maxActiveOrders: number;
  activeOrderCount: number;
  capacityAvailable: number;
  isEligible: boolean;
  specializationMatch: boolean;
  estimatedWorkload: string;
}

export const CustomerOrderAssignment: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>({
    totalOrders: 0,
    ordersAwaitingAssignment: 0,
    ordersAssigned: 0,
    ordersInProgress: 0,
    ordersCompleted: 0,
    overdueOrders: 0,
    availableTailors: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Assign Tailor modal state
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [eligibleTailors, setEligibleTailors] = useState<TailorCandidate[]>([]);
  const [isLoadingTailors, setIsLoadingTailors] = useState(false);
  const [tailorLoadError, setTailorLoadError] = useState<string | null>(null);
  const [tailorSearch, setTailorSearch] = useState("");
  const [selectedTailor, setSelectedTailor] = useState<TailorCandidate | null>(null);
  const [assignmentStage, setAssignmentStage] = useState<"select" | "confirm">("select");
  const [completionDateInput, setCompletionDateInput] = useState("");
  const [assignmentPriority, setAssignmentPriority] = useState("NORMAL");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);

  // Reassign modal state
  const [reassigningOrder, setReassigningOrder] = useState<Order | null>(null);
  const [reassignReason, setReassignReason] = useState("");

  // History modal state
  const [historyOrder, setHistoryOrder] = useState<Order | null>(null);
  const [orderHistoryData, setOrderHistoryData] = useState<any>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Success message
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, priorityFilter, page]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 12,
      };
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (priorityFilter !== "ALL") params.priority = priorityFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get("/assignment/admin/orders", { params });
      if (res.data.success) {
        setOrders(res.data.data.orders);
        setStats(res.data.data.stats);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const fetchEligibleTailors = async (orderId: string) => {
    setIsLoadingTailors(true);
    setTailorLoadError(null);
    try {
      const res = await api.get(`/assignment/admin/eligible-tailors/${orderId}`);
      if (res.data.success) {
        setEligibleTailors(res.data.data || []);
      } else {
        setTailorLoadError(res.data.error || "Unable to load tailors.");
      }
    } catch (err: any) {
      console.error("Error loading eligible tailors:", err);
      setTailorLoadError(err.response?.data?.error || "Unable to load tailors. Please try again.");
    } finally {
      setIsLoadingTailors(false);
    }
  };

  const openAssignModal = async (order: Order) => {
    setAssigningOrder(order);
    setSelectedTailor(null);
    setAssignmentStage("select");
    setTailorSearch("");
    setAssignmentPriority(order.priority || "NORMAL");
    setAssignmentNotes("");

    // Default completion date: 5 days from now
    const d = new Date();
    d.setDate(d.getDate() + 5);
    setCompletionDateInput(d.toISOString().slice(0, 10));

    fetchEligibleTailors(order.id);
  };

  const handleConfirmAssignment = async () => {
    if (!assigningOrder || !selectedTailor) return;
    setIsSubmittingAssignment(true);

    try {
      const res = await api.post("/assignment/admin/assign", {
        orderId: assigningOrder.id,
        tailorId: selectedTailor.id,
        expectedCompletionDate: completionDateInput ? new Date(completionDateInput).toISOString() : null,
        priority: assignmentPriority,
        notes: assignmentNotes || undefined,
      });

      if (res.data.success) {
        setAlertSuccess(
          `Order #${assigningOrder.orderNumber} successfully assigned to ${selectedTailor.name} (${selectedTailor.shopName}).`
        );
        setTimeout(() => setAlertSuccess(null), 5000);
        setAssigningOrder(null);
        setSelectedTailor(null);
        loadOrders();
      }
    } catch (err: any) {
      alert("Assignment failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const handleOpenReassignModal = async (order: Order) => {
    setReassigningOrder(order);
    setReassignReason("");
    openAssignModal(order);
  };

  const handleCancelAssignment = async (orderId: string) => {
    const reason = prompt("Please provide reason for cancelling tailor assignment:");
    if (!reason) return;

    try {
      const res = await api.post(`/assignment/admin/cancel/${orderId}`, { reason });
      if (res.data.success) {
        setAlertSuccess("Tailor assignment cancelled. Order returned to Awaiting Assignment queue.");
        setTimeout(() => setAlertSuccess(null), 4000);
        loadOrders();
      }
    } catch (err: any) {
      alert("Failed to cancel assignment: " + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await api.put(`/assignment/orders/${orderId}/production-status`, {
        newStatus,
        notes: "Status updated by Operational Admin",
      });
      if (res.data.success) {
        setAlertSuccess(`Order status updated to ${newStatus.replace(/_/g, " ")}`);
        setTimeout(() => setAlertSuccess(null), 4000);
        loadOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, productionStatus: newStatus });
        }
      }
    } catch (err: any) {
      alert("Failed to update status: " + (err.response?.data?.error || err.message));
    }
  };

  const openHistoryModal = async (order: Order) => {
    setHistoryOrder(order);
    setIsLoadingHistory(true);
    try {
      const res = await api.get(`/assignment/orders/${order.id}/history`);
      if (res.data.success) {
        setOrderHistoryData(res.data.data);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AWAITING_TAILOR_ASSIGNMENT":
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> Awaiting Assignment
          </span>
        );
      case "ASSIGNED":
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
            <Scissors className="w-3 h-3 text-blue-600" /> Assigned to Tailor
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-indigo-600" /> Tailor Accepted
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-purple-600 animate-spin" /> In Progress
          </span>
        );
      case "QUALITY_CHECK":
        return (
          <span className="px-2.5 py-1 bg-teal-100 text-teal-800 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-teal-600" /> Quality Check
          </span>
        );
      case "READY_FOR_DISPATCH":
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-600" /> Ready for Dispatch
          </span>
        );
      case "DISPATCHED":
        return (
          <span className="px-2.5 py-1 bg-cyan-100 text-cyan-800 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-cyan-600" /> Dispatched
          </span>
        );
      case "DELIVERED":
        return (
          <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-700" /> Delivered
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
            <X className="w-3 h-3 text-red-600" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full font-bold text-[10px] uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  const filteredTailorCandidates = eligibleTailors.filter((t) => {
    if (!tailorSearch.trim()) return true;
    const q = tailorSearch.toLowerCase().trim();
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.shopName && t.shopName.toLowerCase().includes(q)) ||
      (t.id && t.id.toLowerCase().includes(q)) ||
      (t.email && t.email.toLowerCase().includes(q)) ||
      (t.city && t.city.toLowerCase().includes(q)) ||
      (t.specialization && t.specialization.toLowerCase().includes(q)) ||
      (t.specializations && t.specializations.toLowerCase().includes(q)) ||
      (t.skills && t.skills.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Success alert banner */}
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
            <span className="w-2.5 h-2.5 rounded-full bg-brand-blue animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-blue">
              Operational Management Desk
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 font-serif mt-1">
            Customer Order Assignment & Tailor Tracking
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Live database order stream, customer-selected size preservation, and intelligent tailor workload allocation.
          </p>
        </div>

        <button
          onClick={() => loadOrders()}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Seven Statistical KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Total Orders</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{stats.totalOrders}</p>
          <span className="text-[9px] text-slate-400 mt-1">All store orders</span>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between">
          <span className="font-bold text-[10px] text-amber-700 uppercase tracking-wider">Pending Assignment</span>
          <p className="text-2xl font-extrabold text-amber-800 mt-2">{stats.ordersAwaitingAssignment}</p>
          <span className="text-[9px] text-amber-600 mt-1">Requires Tailor</span>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-sm flex flex-col justify-between">
          <span className="font-bold text-[10px] text-blue-700 uppercase tracking-wider">Assigned Orders</span>
          <p className="text-2xl font-extrabold text-blue-800 mt-2">{stats.ordersAssigned}</p>
          <span className="text-[9px] text-blue-600 mt-1">Awaiting Tailor Accept</span>
        </div>

        <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 shadow-sm flex flex-col justify-between">
          <span className="font-bold text-[10px] text-indigo-700 uppercase tracking-wider">Accepted by Tailors</span>
          <p className="text-2xl font-extrabold text-indigo-800 mt-2">{orders.filter(o => o.productionStatus === "ACCEPTED").length}</p>
          <span className="text-[9px] text-indigo-600 mt-1">Scheduled in Queue</span>
        </div>

        <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 shadow-sm flex flex-col justify-between">
          <span className="font-bold text-[10px] text-purple-700 uppercase tracking-wider">In Progress</span>
          <p className="text-2xl font-extrabold text-purple-800 mt-2">{stats.ordersInProgress}</p>
          <span className="text-[9px] text-purple-600 mt-1">Cutting & Stitching</span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between">
          <span className="font-bold text-[10px] text-emerald-700 uppercase tracking-wider">Completed</span>
          <p className="text-2xl font-extrabold text-emerald-800 mt-2">{stats.ordersCompleted}</p>
          <span className="text-[9px] text-emerald-600 mt-1">Dispatched / Delivered</span>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-between">
          <span className="font-bold text-[10px] text-rose-700 uppercase tracking-wider">Requires Attention</span>
          <p className="text-2xl font-extrabold text-rose-800 mt-2">{stats.overdueOrders}</p>
          <span className="text-[9px] text-rose-600 mt-1">Overdue / Delayed</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search Order #, Customer, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="p-1.5 border border-slate-300 rounded-xl bg-white font-medium focus:outline-none"
            >
              <option value="ALL">All Orders</option>
              <option value="AWAITING_TAILOR_ASSIGNMENT">Awaiting Assignment</option>
              <option value="ASSIGNED">Assigned to Tailor</option>
              <option value="ACCEPTED">Accepted by Tailor</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="QUALITY_CHECK">Quality Check</option>
              <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
              <option value="DELIVERED">Delivered</option>
              <option value="OVERDUE">⚠️ Overdue Orders</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-600">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="p-1.5 border border-slate-300 rounded-xl bg-white font-medium focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Order Assignment Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Order ID & Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Products & Customer Selected Sizes</th>
                <th className="p-4">Total & Payment</th>
                <th className="p-4">Assigned Tailor</th>
                <th className="p-4">Status & Deadline</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-brand-blue" />
                      <span>Loading real-time order database stream...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    No orders matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const hasCustomMeasurements = order.items.some((i) => !!i.customMeasurementId);
                  const isOverdue =
                    order.expectedCompletionDate &&
                    new Date(order.expectedCompletionDate) < new Date() &&
                    !["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"].includes(
                      order.productionStatus
                    );

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order ID & Date */}
                      <td className="p-4 align-top">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>{order.orderNumber}</span>
                          {order.priority === "URGENT" && (
                            <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded text-[9px] font-black uppercase">
                              Urgent
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {formatDateTime(order.createdAt)}
                        </div>
                        {hasCustomMeasurements && (
                          <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-bold">
                            <Scissors className="w-3 h-3" /> Bespoke Custom
                          </span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="p-4 align-top">
                        <div className="font-bold text-slate-900">{order.customerName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{order.customerPhone || "N/A"}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {order.customerEmail}
                        </div>
                      </td>

                      {/* Products and Individual Customer Selected Sizes */}
                      <td className="p-4 align-top">
                        <div className="space-y-1.5 max-w-xs">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {item.productImageUrl ? (
                                  <img
                                    src={item.productImageUrl}
                                    alt={item.productName}
                                    className="w-7 h-7 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-500 font-bold text-[10px]">
                                    UH
                                  </div>
                                )}
                                <div className="truncate">
                                  <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                                  <p className="text-[10px] text-slate-500">
                                    Qty: <strong className="text-slate-800">{item.quantity}</strong>
                                  </p>
                                </div>
                              </div>

                              {/* Customer selected size badge */}
                              <div className="flex-shrink-0 px-2 py-0.5 bg-brand-blue/10 border border-brand-blue/30 text-brand-blue rounded-md font-bold text-[10px]">
                                Size: {item.size}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Total & Payment */}
                      <td className="p-4 align-top">
                        <div className="font-extrabold text-slate-900">{formatINR(order.totalAmount)}</div>
                        <div className="mt-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.paymentStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">{order.paymentMethod}</div>
                      </td>

                      {/* Assigned Tailor */}
                      <td className="p-4 align-top">
                        {order.assignedTailor ? (
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <Scissors className="w-3.5 h-3.5 text-brand-blue" />
                              <span>{order.assignedTailor.tailorName}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {order.assignedTailor.shopName}
                            </div>
                            <div className="text-[9px] text-slate-400">
                              Workload: {order.assignedTailor.activeOrderCount}/
                              {order.assignedTailor.maxActiveOrders} active
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                            <div>
                              <button
                                onClick={() => openAssignModal(order)}
                                className="px-2.5 py-1 bg-brand-blue hover:bg-blue-800 text-white rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1 transition-colors"
                              >
                                <Scissors className="w-3 h-3" />
                                <span>Assign Tailor</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status & Deadline */}
                      <td className="p-4 align-top space-y-1.5">
                        <div>{getStatusBadge(order.productionStatus)}</div>
                        {order.expectedCompletionDate && (
                          <div
                            className={`text-[10px] font-semibold flex items-center gap-1 ${
                              isOverdue ? "text-rose-600 font-bold" : "text-slate-500"
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            <span>
                              Due: {new Date(order.expectedCompletionDate).toLocaleDateString()}
                            </span>
                            {isOverdue && <span className="text-[9px] uppercase">(Overdue)</span>}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 align-top text-right space-y-1">
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailsOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Details</span>
                          </button>

                          {order.assignedTailor ? (
                            <button
                              onClick={() => handleOpenReassignModal(order)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold transition-colors"
                            >
                              Reassign Tailor
                            </button>
                          ) : (
                            <button
                              onClick={() => openAssignModal(order)}
                              className="px-2.5 py-1 bg-brand-blue hover:bg-blue-800 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors"
                            >
                              Assign Now
                            </button>
                          )}

                          <button
                            onClick={() => openHistoryModal(order)}
                            className="text-[10px] text-slate-400 hover:text-slate-700 underline"
                          >
                            View Audit Log
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing Page {page} of {pagination.totalPages} ({pagination.total} orders total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-slate-300 rounded-lg disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ASSIGN / REASSIGN TAILOR (WITH REAL WORKLOAD & CONFIRMATION SCREEN) */}
      {/* ========================================================================= */}
      {assigningOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {reassigningOrder ? "Reassign Tailoring Partner" : "Order Tailor Assignment"}
                </span>
                <h3 className="text-lg font-extrabold font-serif mt-0.5">
                  Order #{assigningOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Customer: <strong>{assigningOrder.customerName}</strong> ({assigningOrder.customerPhone})
                </p>
              </div>
              <button
                onClick={() => setAssigningOrder(null)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage 1: Select Tailor */}
            {assignmentStage === "select" && (
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="font-bold text-xs text-slate-700 block">
                    1. Search Approved & Available Tailors
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filter by tailor name, workshop, specialization..."
                      value={tailorSearch}
                      onChange={(e) => setTailorSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Candidate list */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {isLoadingTailors ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-brand-blue" />
                      <span className="font-semibold">Loading registered tailors...</span>
                    </div>
                  ) : tailorLoadError ? (
                    <div className="p-6 text-center bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-700 flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                      <span className="font-bold">Unable to load tailors. Please try again.</span>
                      <p className="text-[11px] text-rose-500">{tailorLoadError}</p>
                      <button
                        type="button"
                        onClick={() => assigningOrder && fetchEligibleTailors(assigningOrder.id)}
                        className="mt-2 px-3 py-1.5 bg-rose-600 text-white rounded-xl font-bold text-[11px] hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Retry
                      </button>
                    </div>
                  ) : eligibleTailors.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="w-6 h-6 text-amber-500" />
                      <span className="font-bold text-slate-800 text-center max-w-sm">
                        No eligible approved tailors found. Check the Tailor Applications section and tailor account statuses.
                      </span>
                      <button
                        type="button"
                        onClick={() => assigningOrder && fetchEligibleTailors(assigningOrder.id)}
                        className="mt-2 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-[11px] hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh List
                      </button>
                    </div>
                  ) : filteredTailorCandidates.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                      No approved tailors found matching "{tailorSearch}".
                    </div>
                  ) : (
                    filteredTailorCandidates.map((cand) => {
                      const isSelected = selectedTailor?.id === cand.id;
                      const isAtCapacity = cand.capacityAvailable <= 0;
                      const isCandidateEligible = !isAtCapacity && cand.isAvailable && cand.approvalStatus === "APPROVED";

                      return (
                        <div
                          key={cand.id}
                          onClick={() => {
                            if (isCandidateEligible) {
                              setSelectedTailor(cand);
                            }
                          }}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                            isSelected
                              ? "border-brand-blue bg-blue-50/50 shadow-sm ring-1 ring-brand-blue"
                              : !isCandidateEligible
                              ? "border-slate-200 bg-slate-50/50 opacity-60 cursor-not-allowed"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold text-sm flex-shrink-0">
                              <Scissors className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-slate-900">{cand.name}</span>
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-mono">
                                  ID: {cand.id.slice(0, 8)}...
                                </span>
                                {cand.specializationMatch && (
                                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                                    Specialization Match
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium">
                                {cand.shopName} {cand.city ? `• ${cand.city}` : ""}
                              </p>
                              {(cand.specialization || cand.specializations || cand.skills) && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Skills: {cand.specialization || cand.specializations || cand.skills}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isAtCapacity
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {cand.activeOrderCount}/{cand.maxActiveOrders} Active Orders
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {cand.capacityAvailable > 0
                                ? `${cand.capacityAvailable} slots open`
                                : "At capacity limit"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Date and Priority inputs */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="font-bold text-xs text-slate-700 block mb-1">
                      Expected Completion Date
                    </label>
                    <input
                      type="date"
                      value={completionDateInput}
                      onChange={(e) => setCompletionDateInput(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-xs text-slate-700 block mb-1">
                      Order Priority
                    </label>
                    <select
                      value={assignmentPriority}
                      onChange={(e) => setAssignmentPriority(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl text-xs bg-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent (Express)</option>
                    </select>
                  </div>
                </div>

                {/* Next button */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setAssigningOrder(null)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!selectedTailor}
                    onClick={() => setAssignmentStage("confirm")}
                    className="px-5 py-2 bg-brand-blue hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>Proceed to Confirmation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Stage 2: Final Confirmation Screen */}
            {assignmentStage === "confirm" && selectedTailor && (
              <div className="p-6 space-y-5">
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                  <div className="font-bold text-brand-blue text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Please Confirm Tailor Assignment
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Order Number:</span>
                      <strong className="text-slate-900">{assigningOrder.orderNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Customer:</span>
                      <strong className="text-slate-900">{assigningOrder.customerName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Assigned Tailor:</span>
                      <strong className="text-slate-900">{selectedTailor.name} ({selectedTailor.shopName})</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Target Completion:</span>
                      <strong className="text-slate-900">
                        {completionDateInput ? new Date(completionDateInput).toLocaleDateString() : "5 Business Days"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Items & exact sizes snapshot */}
                <div>
                  <h4 className="font-bold text-xs text-slate-800 mb-2">
                    Uniform Items & Customer-Selected Sizes:
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {assigningOrder.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800">{it.productName}</span>
                          <span className="text-slate-400 text-[11px] ml-2">Qty: {it.quantity}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-brand-blue text-white rounded-md font-bold text-[10px]">
                          Size: {it.size}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-xs text-slate-700 block mb-1">
                    Internal Assignment Notes / Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Rush alteration request, reinforced stitching required..."
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setAssignmentStage("select")}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Back to Selection
                  </button>
                  <button
                    disabled={isSubmittingAssignment}
                    onClick={handleConfirmAssignment}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmittingAssignment ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Confirming & Notifying Tailor...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm Assignment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW COMPLETE ORDER DETAILS & MEASUREMENTS */}
      {/* ========================================================================= */}
      {isDetailsOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-3xl w-full rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Comprehensive Order Dossier
                </span>
                <h3 className="text-xl font-extrabold font-serif mt-0.5">
                  Order #{selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
              {/* Order quick metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <span className="text-slate-400 block text-[10px]">Customer Name</span>
                  <strong className="text-slate-900 text-sm">{selectedOrder.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Contact Phone</span>
                  <strong className="text-slate-900 text-sm">{selectedOrder.customerPhone || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Current Production Status</span>
                  <div className="mt-1">{getStatusBadge(selectedOrder.productionStatus)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Order Total & Payment</span>
                  <strong className="text-slate-900 text-sm">{formatINR(selectedOrder.totalAmount)}</strong>
                  <span className="ml-1 text-[10px] text-emerald-700 font-bold">({selectedOrder.paymentStatus})</span>
                </div>
              </div>

              {/* Items & exact sizes */}
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 mb-3 font-serif">
                  Ordered Products & Exact Selected Sizes
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {item.productImageUrl ? (
                            <img
                              src={item.productImageUrl}
                              alt={item.productName}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                              UH
                            </div>
                          )}
                          <div>
                            <h5 className="font-bold text-slate-900 text-sm">{item.productName}</h5>
                            <p className="text-slate-500 text-xs">
                              Unit Price: {formatINR(item.price)} • Quantity: <strong className="text-slate-900">{item.quantity}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Customer selected size */}
                        <div className="text-right">
                          <span className="px-3 py-1 bg-brand-blue text-white rounded-xl font-extrabold text-xs shadow-sm">
                            Selected Size: {item.size}
                          </span>
                        </div>
                      </div>

                      {/* Custom measurements if submitted */}
                      {item.measurement && (
                        <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                          <div className="flex items-center gap-1.5 text-purple-900 font-bold text-[11px]">
                            <Scissors className="w-3.5 h-3.5 text-purple-700" />
                            <span>Bespoke Custom Measurements for: {item.measurement.studentName} ({item.measurement.gender})</span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px]">
                            {item.measurement.chest && <div>Chest: <strong>{item.measurement.chest}"</strong></div>}
                            {item.measurement.waist && <div>Waist: <strong>{item.measurement.waist}"</strong></div>}
                            {item.measurement.shoulder && <div>Shoulder: <strong>{item.measurement.shoulder}"</strong></div>}
                            {item.measurement.shirtLength && <div>Shirt L: <strong>{item.measurement.shirtLength}"</strong></div>}
                            {item.measurement.trouserLength && <div>Trouser L: <strong>{item.measurement.trouserLength}"</strong></div>}
                            {item.measurement.hip && <div>Hip: <strong>{item.measurement.hip}"</strong></div>}
                          </div>
                          {item.measurement.notes && (
                            <p className="text-[10px] text-purple-800 italic">Notes: {item.measurement.notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Update Controls directly in Modal */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Update Production Status Directly
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "AWAITING_TAILOR_ASSIGNMENT",
                    "ASSIGNED",
                    "ACCEPTED",
                    "IN_PROGRESS",
                    "QUALITY_CHECK",
                    "READY_FOR_DISPATCH",
                    "DISPATCHED",
                    "DELIVERED",
                    "CANCELLED",
                  ].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition-colors ${
                        selectedOrder.productionStatus === st
                          ? "bg-brand-blue text-white shadow-sm"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {st.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="px-5 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-900"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: AUDIT & ASSIGNMENT HISTORY */}
      {/* ========================================================================= */}
      {historyOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Full Audit & Assignment Trail
                </span>
                <h3 className="text-lg font-extrabold font-serif mt-0.5">
                  Order #{historyOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setHistoryOrder(null)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-xs max-h-[70vh] overflow-y-auto space-y-6">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-blue mb-2" />
                  <span>Loading immutable audit records...</span>
                </div>
              ) : (
                <>
                  {/* Production status history */}
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-3">
                      Production Pipeline Transitions
                    </h4>
                    <div className="space-y-2 border-l-2 border-brand-blue pl-4 ml-2">
                      {orderHistoryData?.productionHistory?.map((ph: any, i: number) => (
                        <div key={i} className="relative pb-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-brand-blue absolute -left-[21px] top-1"></div>
                          <div className="font-bold text-slate-900">
                            {ph.newStatus.replace(/_/g, " ")}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatDateTime(ph.createdAt)} • Changed by: {ph.changedBy?.name || "System Automated"}
                          </div>
                          {ph.notes && <p className="text-slate-600 mt-0.5 italic">{ph.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assignment actions */}
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-3">
                      Tailor Assignment Events
                    </h4>
                    <div className="space-y-2">
                      {orderHistoryData?.assignmentHistories?.map((ah: any, i: number) => (
                        <div
                          key={i}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>Action: {ah.action}</span>
                            <span className="text-[10px] text-slate-400">{formatDateTime(ah.createdAt)}</span>
                          </div>
                          {ah.reason && <p className="text-slate-600">Reason: {ah.reason}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setHistoryOrder(null)}
                className="px-5 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-900"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
