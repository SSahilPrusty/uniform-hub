import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Truck,
  Package,
  Building,
  Store,
  Scissors,
  Check,
  X,
  Search,
  ExternalLink,
  Copy,
  ChevronRight,
  RefreshCw,
  Eye,
  Send,
  MapPin,
  Calendar,
  User,
  Phone,
  FileText,
  AlertCircle,
  Filter,
} from "lucide-react";
import { api } from "../../services/api";
import { formatINR, formatDateTime } from "../../utils/formatters";

type QueueTab =
  | "READY_FOR_DISPATCH"
  | "AWAITING_FRANCHISE_ASSIGNMENT"
  | "ASSIGNED_TO_FRANCHISE"
  | "DISPATCHED"
  | "DELIVERED"
  | "ISSUES";

interface DispatchOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  totalAmount: number;
  paymentStatus: string;
  productionStatus: string;
  createdAt: string;
  tailorCompletedAt?: string | null;
  tailorCompletionNotes?: string | null;
  isVerifiedByAdmin: boolean;
  verifiedAt?: string | null;
  correctionReason?: string | null;
  franchiseAssignedAt?: string | null;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
  courierPartner?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippingNotes?: string | null;
  shippingAddress: {
    recipientName?: string;
    streetAddress?: string;
    apartment?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    pincode?: string;
    district?: string;
  } | null;
  items: Array<{
    id: string;
    productName: string;
    size: string;
    color?: string | null;
    price: number;
    quantity: number;
    schoolName?: string | null;
    customMeasurements?: any;
  }>;
  tailor?: {
    id: string;
    tailorName: string;
    shopName: string;
    phone: string;
    city: string;
  } | null;
  franchise?: {
    id: string;
    businessName: string;
    city: string;
    contactNumber?: string | null;
  } | null;
  productionHistory?: Array<{
    id: string;
    oldStatus?: string | null;
    newStatus: string;
    notes?: string | null;
    createdAt: string;
    user?: { name: string; role: string } | null;
  }>;
}

interface EligibleFranchise {
  id: string;
  businessName: string;
  city: string;
  state: string;
  contactNumber?: string | null;
  activeOrdersCount: number;
  isApproved: boolean;
  user?: { name: string; email: string };
}

export const ReadyForDispatch: React.FC = () => {
  const [activeTab, setActiveTab] = useState<QueueTab>("READY_FOR_DISPATCH");
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [metrics, setMetrics] = useState({
    totalCompleted: 0,
    awaitingVerification: 0,
    awaitingFranchiseAssignment: 0,
    assignedToFranchise: 0,
    dispatched: 0,
    delivered: 0,
    issues: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<DispatchOrder | null>(null);
  const [verifyingOrder, setVerifyingOrder] = useState<DispatchOrder | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [correctingOrder, setCorrectingOrder] = useState<DispatchOrder | null>(null);
  const [correctionReason, setCorrectionReason] = useState("");
  const [isReturning, setIsReturning] = useState(false);

  const [assigningOrder, setAssigningOrder] = useState<DispatchOrder | null>(null);
  const [eligibleFranchises, setEligibleFranchises] = useState<EligibleFranchise[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const [deliveringOrder, setDeliveringOrder] = useState<DispatchOrder | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isDelivering, setIsDelivering] = useState(false);

  // Flash message
  const [flashMsg, setFlashMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/dispatch/admin/orders`, {
        params: {
          tab: activeTab,
          search: searchQuery || undefined,
        },
      });
      if (res.data.success) {
        setOrders(res.data.data.orders);
        setMetrics(res.data.data.metrics);
      }
    } catch (err: any) {
      console.error("Error loading dispatch orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setFlashMsg({ text, type });
    setTimeout(() => setFlashMsg(null), 5000);
  };

  const handleCopyTracking = (trackingNum: string) => {
    navigator.clipboard.writeText(trackingNum);
    setCopiedId(trackingNum);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Open Assign Franchise Modal
  const openAssignFranchiseModal = async (order: DispatchOrder) => {
    setAssigningOrder(order);
    setSelectedFranchiseId("");
    setAssignmentNotes("");
    try {
      const res = await api.get("/dispatch/admin/eligible-franchises");
      if (res.data.success) {
        setEligibleFranchises(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch eligible franchises", err);
    }
  };

  // Handle Verify Completed Order
  const handleVerifySubmit = async () => {
    if (!verifyingOrder) return;
    setIsVerifying(true);
    try {
      const res = await api.post(`/dispatch/admin/verify-order/${verifyingOrder.id}`, {
        notes: verificationNotes.trim() || undefined,
      });
      if (res.data.success) {
        showNotification(`Order #${verifyingOrder.orderNumber} successfully verified! Moved to Awaiting Franchise Assignment.`);
        setVerifyingOrder(null);
        setVerificationNotes("");
        loadOrders();
      }
    } catch (err: any) {
      showNotification(err.response?.data?.error || err.message, "error");
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Return for Correction
  const handleReturnSubmit = async () => {
    if (!correctingOrder) return;
    if (!correctionReason.trim() || correctionReason.trim().length < 5) {
      alert("A detailed correction reason (at least 5 characters) is mandatory.");
      return;
    }
    setIsReturning(true);
    try {
      const res = await api.post(`/dispatch/admin/return-correction/${correctingOrder.id}`, {
        reason: correctionReason.trim(),
      });
      if (res.data.success) {
        showNotification(
          `Order #${correctingOrder.orderNumber} returned to tailor for correction. Reason delivered to tailor workbench.`
        );
        setCorrectingOrder(null);
        setCorrectionReason("");
        loadOrders();
      }
    } catch (err: any) {
      showNotification(err.response?.data?.error || err.message, "error");
    } finally {
      setIsReturning(false);
    }
  };

  // Handle Assign to Franchise
  const handleAssignFranchiseSubmit = async () => {
    if (!assigningOrder || !selectedFranchiseId) {
      alert("Please select a registered franchise partner.");
      return;
    }
    setIsAssigning(true);
    try {
      const res = await api.post("/dispatch/admin/assign-franchise", {
        orderId: assigningOrder.id,
        franchiseId: selectedFranchiseId,
        notes: assignmentNotes.trim() || undefined,
      });
      if (res.data.success) {
        showNotification(
          `Order #${assigningOrder.orderNumber} assigned to franchise partner! Order transferred to Franchise portal.`
        );
        setAssigningOrder(null);
        loadOrders();
      }
    } catch (err: any) {
      showNotification(err.response?.data?.error || err.message, "error");
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle Confirm Delivery
  const handleConfirmDeliverySubmit = async () => {
    if (!deliveringOrder) return;
    setIsDelivering(true);
    try {
      const res = await api.post(`/dispatch/admin/confirm-delivery/${deliveringOrder.id}`, {
        deliveryNotes: deliveryNotes.trim() || undefined,
      });
      if (res.data.success) {
        showNotification(`Order #${deliveringOrder.orderNumber} delivery confirmed successfully!`);
        setDeliveringOrder(null);
        setDeliveryNotes("");
        loadOrders();
      }
    } catch (err: any) {
      showNotification(err.response?.data?.error || err.message, "error");
    } finally {
      setIsDelivering(false);
    }
  };

  // Filtered in-memory search
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      (o.customerPhone && o.customerPhone.includes(q)) ||
      (o.courierPartner && o.courierPartner.toLowerCase().includes(q)) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
      (o.tailor?.tailorName && o.tailor.tailorName.toLowerCase().includes(q)) ||
      (o.franchise?.businessName && o.franchise.businessName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Flash Alert */}
      {flashMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-md transition-all ${
            flashMsg.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          <span>{flashMsg.text}</span>
          <button onClick={() => setFlashMsg(null)} className="p-1 hover:bg-white/20 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-blue">
            Fulfillment & Delivery Operations
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 font-serif mt-0.5">
            Ready for Dispatch & Fulfillment Command Desk
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Operational verification of completed uniforms, franchise assignment, packaging, and real-time live dispatch tracking.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queues</span>
        </button>
      </div>

      {/* 6 KPI Metric Counters (STEP 8) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Completed */}
        <div
          onClick={() => setActiveTab("READY_FOR_DISPATCH")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "READY_FOR_DISPATCH"
              ? "bg-blue-50 border-brand-blue shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Awaiting Verification</span>
            <Clock className="w-3.5 h-3.5 text-brand-blue" />
          </div>
          <p className="text-2xl font-black text-brand-blue mt-1">
            {metrics.awaitingVerification}
          </p>
          <span className="text-[10px] text-slate-400">Completed by Tailors</span>
        </div>

        {/* Awaiting Franchise */}
        <div
          onClick={() => setActiveTab("AWAITING_FRANCHISE_ASSIGNMENT")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "AWAITING_FRANCHISE_ASSIGNMENT"
              ? "bg-amber-50 border-amber-400 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Awaiting Franchise</span>
            <Building className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {metrics.awaitingFranchiseAssignment}
          </p>
          <span className="text-[10px] text-slate-400">Verified by Admin</span>
        </div>

        {/* Assigned to Franchise */}
        <div
          onClick={() => setActiveTab("ASSIGNED_TO_FRANCHISE")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "ASSIGNED_TO_FRANCHISE"
              ? "bg-purple-50 border-purple-400 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Assigned to Franchise</span>
            <Store className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-600 mt-1">
            {metrics.assignedToFranchise}
          </p>
          <span className="text-[10px] text-slate-400">Preparing Packaging</span>
        </div>

        {/* Dispatched */}
        <div
          onClick={() => setActiveTab("DISPATCHED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "DISPATCHED"
              ? "bg-indigo-50 border-indigo-400 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>In Transit</span>
            <Truck className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-1">
            {metrics.dispatched}
          </p>
          <span className="text-[10px] text-slate-400">Active Live Tracking</span>
        </div>

        {/* Delivered */}
        <div
          onClick={() => setActiveTab("DELIVERED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "DELIVERED"
              ? "bg-emerald-50 border-emerald-400 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Delivered</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {metrics.delivered}
          </p>
          <span className="text-[10px] text-slate-400">Successful Delivery</span>
        </div>

        {/* Issues */}
        <div
          onClick={() => setActiveTab("ISSUES")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "ISSUES"
              ? "bg-rose-50 border-rose-400 shadow-sm"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Dispatch Issues</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {metrics.issues}
          </p>
          <span className="text-[10px] text-slate-400">Returned for Correction</span>
        </div>
      </div>

      {/* 6 Tab Controls (STEP 4 & 8) */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-1 overflow-x-auto text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab("READY_FOR_DISPATCH")}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "READY_FOR_DISPATCH"
                ? "bg-brand-blue text-white shadow-sm"
                : "hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Ready for Dispatch ({metrics.awaitingVerification})</span>
          </button>

          <button
            onClick={() => setActiveTab("AWAITING_FRANCHISE_ASSIGNMENT")}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "AWAITING_FRANCHISE_ASSIGNMENT"
                ? "bg-brand-blue text-white shadow-sm"
                : "hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Awaiting Franchise ({metrics.awaitingFranchiseAssignment})</span>
          </button>

          <button
            onClick={() => setActiveTab("ASSIGNED_TO_FRANCHISE")}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "ASSIGNED_TO_FRANCHISE"
                ? "bg-brand-blue text-white shadow-sm"
                : "hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Assigned to Franchise ({metrics.assignedToFranchise})</span>
          </button>

          <button
            onClick={() => setActiveTab("DISPATCHED")}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "DISPATCHED"
                ? "bg-brand-blue text-white shadow-sm"
                : "hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Dispatched Orders ({metrics.dispatched})</span>
          </button>

          <button
            onClick={() => setActiveTab("DELIVERED")}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "DELIVERED"
                ? "bg-brand-blue text-white shadow-sm"
                : "hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Delivered Orders ({metrics.delivered})</span>
          </button>

          <button
            onClick={() => setActiveTab("ISSUES")}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "ISSUES"
                ? "bg-brand-blue text-white shadow-sm"
                : "hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Dispatch Issues ({metrics.issues})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px] max-w-sm w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order #, customer, courier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
        </div>
      </div>

      {/* Main Order List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-brand-blue animate-spin" />
          <span className="text-xs text-slate-500 font-semibold">Loading fulfillment queue...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400 shadow-sm space-y-2">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700 text-sm">No orders in this queue</p>
          <p className="text-slate-400 max-w-md mx-auto">
            {activeTab === "READY_FOR_DISPATCH"
              ? "Orders completed by registered tailors will appear here automatically for Operational Admin verification."
              : activeTab === "AWAITING_FRANCHISE_ASSIGNMENT"
              ? "Verified orders awaiting assignment to a franchise partner will be listed here."
              : activeTab === "ASSIGNED_TO_FRANCHISE"
              ? "Orders assigned to franchise partners will appear here while packages are being prepared."
              : activeTab === "DISPATCHED"
              ? "Orders handed over to couriers with active live tracking numbers will be displayed here."
              : activeTab === "DELIVERED"
              ? "Orders that have reached customers and completed delivery lifecycle will be archived here."
              : "Orders returned for alteration or with dispatch discrepancies will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((order) => {
            const hasTracking = Boolean(order.trackingNumber);
            const address = order.shippingAddress;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all text-xs"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-black text-slate-900">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        order.productionStatus === "COMPLETED_BY_TAILOR"
                          ? "bg-blue-100 text-brand-blue"
                          : order.productionStatus === "AWAITING_FRANCHISE_ASSIGNMENT"
                          ? "bg-amber-100 text-amber-800"
                          : order.productionStatus === "ASSIGNED_TO_FRANCHISE"
                          ? "bg-purple-100 text-purple-800"
                          : order.productionStatus === "PACKAGE_PREPARED"
                          ? "bg-indigo-100 text-indigo-800"
                          : order.productionStatus === "DISPATCHED"
                          ? "bg-sky-100 text-sky-800"
                          : order.productionStatus === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {order.productionStatus.replace(/_/g, " ")}
                    </span>
                    {order.isVerifiedByAdmin && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Admin Verified
                      </span>
                    )}
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    Order Date: <span className="font-semibold text-slate-700">{formatDateTime(order.createdAt)}</span>
                  </div>
                </div>

                {/* Primary Info Grid (Step 4 Items 1-6) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  {/* Customer Info */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">1 & 2. Customer</span>
                    <strong className="text-slate-900 text-sm block">{order.customerName}</strong>
                    <span className="text-slate-600 block">{order.customerPhone || "N/A"}</span>
                    <span className="text-slate-400 text-[10px] truncate block">{order.customerEmail}</span>
                  </div>

                  {/* Assigned Tailor Info (Step 4 Item 4 & 5) */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">4 & 5. Assigned Tailor</span>
                    {order.tailor ? (
                      <>
                        <strong className="text-slate-900 block">{order.tailor.tailorName}</strong>
                        <span className="text-slate-600 block">{order.tailor.shopName} ({order.tailor.city})</span>
                        {order.tailorCompletedAt && (
                          <span className="text-emerald-700 font-semibold block text-[11px]">
                            Completed: {formatDateTime(order.tailorCompletedAt)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400 italic">No tailor assigned</span>
                    )}
                  </div>

                  {/* Franchise Partner */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Franchise Dispatch Hub</span>
                    {order.franchise ? (
                      <>
                        <strong className="text-slate-900 block">{order.franchise.businessName}</strong>
                        <span className="text-slate-600 block">{order.franchise.city}</span>
                        {order.franchiseAssignedAt && (
                          <span className="text-purple-700 font-semibold block text-[11px]">
                            Assigned: {formatDateTime(order.franchiseAssignedAt)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400 italic">Awaiting Franchise</span>
                    )}
                  </div>

                  {/* Courier / Tracking */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Live Tracking</span>
                    {order.trackingNumber ? (
                      <div className="space-y-1">
                        <strong className="text-slate-900 block">{order.courierPartner || "Express Courier"}</strong>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-brand-blue font-bold">
                          <span>{order.trackingNumber}</span>
                          <button
                            onClick={() => handleCopyTracking(order.trackingNumber!)}
                            title="Copy Tracking ID"
                            className="p-1 hover:bg-slate-200 rounded text-slate-500"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {copiedId === order.trackingNumber && (
                            <span className="text-[9px] text-emerald-600 font-sans">Copied!</span>
                          )}
                        </div>
                        {order.trackingUrl && (
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-brand-blue underline flex items-center gap-1 font-semibold"
                          >
                            <span>Open Tracking URL</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Not yet dispatched</span>
                    )}
                  </div>
                </div>

                {/* Step 4 Item 6: Tailor Notes if provided */}
                {order.tailorCompletionNotes && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-[11px] text-blue-900 space-y-0.5">
                    <strong className="block font-bold">6. Tailor Completion Notes:</strong>
                    <p className="italic">"{order.tailorCompletionNotes}"</p>
                  </div>
                )}

                {/* Returned for Correction Reason (if any) */}
                {order.correctionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-[11px] text-rose-900 space-y-0.5">
                    <strong className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Returned for Correction Reason:
                    </strong>
                    <p>{order.correctionReason}</p>
                  </div>
                )}

                {/* Step 4 Item 3: Products and Sizes */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    3. Products, Customer-Selected Sizes & Quantities:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                      >
                        <div className="truncate mr-2">
                          <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                          <span className="text-[10px] text-slate-400">Qty: {item.quantity}</span>
                        </div>
                        <span className="px-2.5 py-1 bg-brand-blue text-white font-extrabold rounded-lg text-xs flex-shrink-0">
                          Size: {item.size}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Snapshot Address Preview */}
                {address && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-slate-800">Delivery Snapshot: </strong>
                      <span>
                        {[
                          address.recipientName,
                          address.streetAddress || address.addressLine1,
                          address.apartment || address.addressLine2,
                          address.city,
                          address.state,
                          address.postalCode || address.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Toolbar (Step 4 Actions 1-4 & Delivery) */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedOrderDetails(order)}
                    className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Full Details</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Action 3: Return for Correction */}
                    {!order.isVerifiedByAdmin &&
                      ["COMPLETED_BY_TAILOR", "READY_FOR_DISPATCH"].includes(order.productionStatus) && (
                        <button
                          onClick={() => {
                            setCorrectingOrder(order);
                            setCorrectionReason("");
                          }}
                          className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Return for Correction</span>
                        </button>
                      )}

                    {/* Action 2: Verify Completed Order */}
                    {!order.isVerifiedByAdmin &&
                      ["COMPLETED_BY_TAILOR", "READY_FOR_DISPATCH"].includes(order.productionStatus) && (
                        <button
                          onClick={() => {
                            setVerifyingOrder(order);
                            setVerificationNotes("");
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Verify Completed Order</span>
                        </button>
                      )}

                    {/* Action 4: Assign to Franchise */}
                    {order.isVerifiedByAdmin && !order.franchise && (
                      <button
                        onClick={() => openAssignFranchiseModal(order)}
                        className="px-4 py-2 bg-brand-blue hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Assign to Franchise</span>
                      </button>
                    )}

                    {/* Reassign / Change Franchise */}
                    {order.franchise && !["DISPATCHED", "DELIVERED"].includes(order.productionStatus) && (
                      <button
                        onClick={() => openAssignFranchiseModal(order)}
                        className="px-3.5 py-2 border border-purple-300 text-purple-700 hover:bg-purple-50 font-bold rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <Building className="w-3.5 h-3.5" />
                        <span>Change Franchise</span>
                      </button>
                    )}

                    {/* Confirm Delivery if dispatched */}
                    {order.productionStatus === "DISPATCHED" && (
                      <button
                        onClick={() => {
                          setDeliveringOrder(order);
                          setDeliveryNotes("");
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Confirm Delivered</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW FULL ORDER DETAILS (Step 4 Action 1) */}
      {/* ========================================================================= */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-blue">Operational Order Audit</span>
                <h3 className="text-lg font-black text-slate-900 font-serif">
                  Order #{selectedOrderDetails.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Delivery Snapshot */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-blue" />
                <span>Customer Delivery Address Snapshot</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Recipient Name</span>
                  <strong>{selectedOrderDetails.shippingAddress?.recipientName || selectedOrderDetails.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Contact Phone</span>
                  <strong>{selectedOrderDetails.shippingAddress?.phone || selectedOrderDetails.customerPhone || "N/A"}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">Street / Flat / Premises</span>
                  <span>
                    {[
                      selectedOrderDetails.shippingAddress?.streetAddress || selectedOrderDetails.shippingAddress?.addressLine1,
                      selectedOrderDetails.shippingAddress?.apartment || selectedOrderDetails.shippingAddress?.addressLine2,
                    ]
                      .filter(Boolean)
                      .join(", ") || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">City & District</span>
                  <span>
                    {[
                      selectedOrderDetails.shippingAddress?.city,
                      selectedOrderDetails.shippingAddress?.district,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">State & PIN Code</span>
                  <span>
                    {selectedOrderDetails.shippingAddress?.state} -{" "}
                    {selectedOrderDetails.shippingAddress?.postalCode || selectedOrderDetails.shippingAddress?.pincode}
                  </span>
                </div>
              </div>
            </div>

            {/* Products & Sizes */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900 text-xs">Garments & Size Specifications</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {selectedOrderDetails.items.map((it) => (
                  <div key={it.id} className="p-3 bg-white flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{it.productName}</p>
                      <p className="text-[10px] text-slate-400">Qty: {it.quantity} • Unit Price: {formatINR(it.price)}</p>
                      {it.customMeasurements && (
                        <p className="text-[10px] text-purple-700 font-semibold mt-1">
                          Custom tailored specifications recorded
                        </p>
                      )}
                    </div>
                    <span className="px-3 py-1 bg-brand-blue text-white rounded-lg font-black text-xs">
                      Size: {it.size}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tailor & Verification Details */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tailor Completion</span>
                <strong>{selectedOrderDetails.tailor?.tailorName || "Unassigned"}</strong>
                <p className="text-slate-500">{selectedOrderDetails.tailor?.shopName}</p>
                {selectedOrderDetails.tailorCompletedAt && (
                  <p className="text-emerald-700 font-semibold mt-1">
                    Completed: {formatDateTime(selectedOrderDetails.tailorCompletedAt)}
                  </p>
                )}
                {selectedOrderDetails.tailorCompletionNotes && (
                  <p className="italic text-slate-600 mt-1">"{selectedOrderDetails.tailorCompletionNotes}"</p>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Admin Verification</span>
                <p className={selectedOrderDetails.isVerifiedByAdmin ? "text-emerald-700 font-bold" : "text-amber-600 font-bold"}>
                  {selectedOrderDetails.isVerifiedByAdmin ? "✓ Operational Verification Passed" : "Pending Verification"}
                </p>
                {selectedOrderDetails.verifiedAt && (
                  <p className="text-slate-500 mt-1">Verified: {formatDateTime(selectedOrderDetails.verifiedAt)}</p>
                )}
                {selectedOrderDetails.franchise && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Franchise</span>
                    <strong className="text-purple-900">{selectedOrderDetails.franchise.businessName}</strong>
                    <p className="text-slate-500">{selectedOrderDetails.franchise.city}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Live Dispatch Tracking Information */}
            {selectedOrderDetails.trackingNumber && (
              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-sky-800 uppercase block">Courier Tracking Record</span>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{selectedOrderDetails.courierPartner || "Express Courier"}</strong>
                    <p className="font-mono text-xs text-sky-900 font-bold">
                      Waybill / Tracking #: {selectedOrderDetails.trackingNumber}
                    </p>
                    {selectedOrderDetails.dispatchedAt && (
                      <p className="text-slate-500 text-[10px]">
                        Dispatched: {formatDateTime(selectedOrderDetails.dispatchedAt)}
                      </p>
                    )}
                  </div>
                  {selectedOrderDetails.trackingUrl && (
                    <a
                      href={selectedOrderDetails.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-brand-blue text-white rounded-xl font-bold flex items-center gap-1 shadow-sm"
                    >
                      <span>Track Shipment</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-colors"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VERIFY COMPLETED ORDER (Step 4 Action 2) */}
      {/* ========================================================================= */}
      {verifyingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 font-serif">
                Verify Completed Order #{verifyingOrder.orderNumber}
              </h3>
              <p className="text-slate-500">
                Confirming tailoring quality, sizing correctness, and stitch finishing.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Operational Verification Effect:
              </p>
              <p>
                Confirms tailoring has been properly completed. Moves order to <strong>"Awaiting Franchise Assignment"</strong> queue. Records your administrator ID and verification timestamp.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Verification Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dimensions verified against school uniform guide, seams and embroidery approved."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyingOrder(null)}
                  className="w-1/2 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={handleVerifySubmit}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Verify</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RETURN FOR CORRECTION (Step 4 Action 3) */}
      {/* ========================================================================= */}
      {correctingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 font-serif">
                Return Order #{correctingOrder.orderNumber} for Correction
              </h3>
              <p className="text-slate-500">
                Returns the order back to assigned tailor <strong>{correctingOrder.tailor?.tailorName || "Tailor"}</strong> with your mandatory reason.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mandatory Return Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Hemline length is 2 inches shorter than customer selected 36, please re-alter and iron before re-submitting."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">
                  Minimum 5 characters. The tailor will see this exact message on their workbench.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectingOrder(null)}
                  className="w-1/2 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isReturning || !correctionReason.trim() || correctionReason.trim().length < 5}
                  onClick={handleReturnSubmit}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isReturning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Returning...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Return to Tailor</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ASSIGN TO FRANCHISE (Step 4 Action 4 & Step 5) */}
      {/* ========================================================================= */}
      {assigningOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 font-serif">
                Assign Order #{assigningOrder.orderNumber} to Franchise
              </h3>
              <p className="text-slate-500">
                Customer: <strong>{assigningOrder.customerName}</strong> • {assigningOrder.items.length} garment(s)
              </p>
            </div>

            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl text-[11px] text-purple-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                Step 5 Workflow Integration:
              </p>
              <p>
                Records franchise ID, assignment timestamp, and admin ID. Status changes to <strong>"Assigned to Franchise"</strong>. The order will immediately disappear from "Ready for Dispatch" and appear automatically in the selected franchise's portal for packaging and dispatch.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Select Approved Franchise Partner <span className="text-purple-600">*</span>
                </label>
                {eligibleFranchises.length === 0 ? (
                  <p className="text-rose-600 text-xs py-2">
                    No approved franchise partners currently found in database.
                  </p>
                ) : (
                  <select
                    value={selectedFranchiseId}
                    onChange={(e) => setSelectedFranchiseId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold"
                  >
                    <option value="">-- Choose Franchise Partner --</option>
                    {eligibleFranchises.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.businessName} - {f.city}, {f.state} (Active Orders: {f.activeOrdersCount})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Dispatch Instructions / Hub Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. High priority uniform kit, package in moisture-resistant box with school seal."
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningOrder(null)}
                  className="w-1/2 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isAssigning || !selectedFranchiseId}
                  onClick={handleAssignFranchiseSubmit}
                  className="w-1/2 py-2.5 bg-brand-blue hover:bg-blue-800 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isAssigning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Assigning...</span>
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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CONFIRM DELIVERY */}
      {/* ========================================================================= */}
      {deliveringOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 font-serif">
                Confirm Order #{deliveringOrder.orderNumber} Delivery
              </h3>
              <p className="text-slate-500">
                Courier: <strong>{deliveringOrder.courierPartner}</strong> • Tracking #{deliveringOrder.trackingNumber}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Delivery Confirmation Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Courier delivery confirmed by OTP / customer signature received."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeliveringOrder(null)}
                  className="w-1/2 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDelivering}
                  onClick={handleConfirmDeliverySubmit}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDelivering ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Delivered</span>
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
