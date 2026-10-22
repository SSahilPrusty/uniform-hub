import React, { useState, useEffect } from "react";
import {
  Package,
  Truck,
  CheckCircle,
  Copy,
  ExternalLink,
  MapPin,
  Clock,
  Search,
  RefreshCw,
  Send,
  Eye,
  X,
  Check,
  Calendar,
  AlertCircle,
  Edit2,
} from "lucide-react";
import { api } from "../../services/api";
import { formatINR, formatDateTime } from "../../utils/formatters";

interface FranchiseOrder {
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
  franchiseAssignedAt?: string | null;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
  courierPartner?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  packageReference?: string | null;
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
    customMeasurements?: any;
  }>;
}

const COMMON_COURIERS = [
  "Blue Dart Express",
  "Delhivery",
  "DTDC Express",
  "India Post (Speed Post)",
  "Shadowfax",
  "Xpressbees",
  "Ecom Express",
  "FedEx India",
];

export const FranchiseDispatchOrders: React.FC<{ initialTab?: "READY" | "DISPATCHED" }> = ({
  initialTab = "READY",
}) => {
  const [activeTab, setActiveTab] = useState<"READY" | "DISPATCHED">(initialTab);
  const [orders, setOrders] = useState<FranchiseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  // Dispatch Modal
  const [dispatchingOrder, setDispatchingOrder] = useState<FranchiseOrder | null>(null);
  const [courierPartner, setCourierPartner] = useState("Blue Dart Express");
  const [customCourier, setCustomCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [shippingNotes, setShippingNotes] = useState("");
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  // Edit Tracking Modal
  const [editingTrackingOrder, setEditingTrackingOrder] = useState<FranchiseOrder | null>(null);
  const [editCourier, setEditCourier] = useState("");
  const [editTrackingNumber, setEditTrackingNumber] = useState("");
  const [editTrackingUrl, setEditTrackingUrl] = useState("");
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);

  // View Details Modal
  const [viewingOrder, setViewingOrder] = useState<FranchiseOrder | null>(null);

  // Notification
  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadFranchiseOrders();
  }, [activeTab]);

  const loadFranchiseOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/dispatch/franchise/orders`, {
        params: {
          tab: activeTab === "READY" ? "READY_FOR_DISPATCH" : "DISPATCHED",
        },
      });
      if (res.data.success) {
        setOrders(res.data.data.orders);
      }
    } catch (err: any) {
      console.error("Error loading franchise orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedTracking(val);
    setTimeout(() => setCopiedTracking(null), 2500);
  };

  // Step 6 Action 2: Prepare Package
  const handlePreparePackage = async (orderId: string, orderNumber: string) => {
    try {
      const res = await api.post(`/dispatch/franchise/prepare-package/${orderId}`);
      if (res.data.success) {
        showToast(`Order #${orderNumber} marked as Packaging Prepared! Ready for courier dispatch.`);
        loadFranchiseOrders();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message, "error");
    }
  };

  // Step 6 Action 3: Dispatch Order
  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchingOrder) return;

    const finalCourier = courierPartner === "OTHER" ? customCourier.trim() : courierPartner;
    if (!finalCourier) {
      alert("Please select or enter the Courier Partner name.");
      return;
    }
    if (!trackingNumber.trim()) {
      alert("Tracking ID / Waybill Number is required.");
      return;
    }
    if (!dispatchDate) {
      alert("Dispatch Date is required.");
      return;
    }

    setIsSubmittingDispatch(true);
    try {
      const res = await api.post(`/dispatch/franchise/dispatch-order/${dispatchingOrder.id}`, {
        courierPartner: finalCourier,
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim() || undefined,
        dispatchDate,
        shippingNotes: shippingNotes.trim() || undefined,
      });

      if (res.data.success) {
        showToast(
          `Order #${dispatchingOrder.orderNumber} successfully dispatched via ${finalCourier}! Moved to Dispatched Orders.`
        );
        setDispatchingOrder(null);
        setActiveTab("DISPATCHED");
        loadFranchiseOrders();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message, "error");
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  // Update Tracking info for already dispatched order
  const handleUpdateTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrackingOrder) return;

    setIsUpdatingTracking(true);
    try {
      const res = await api.put(`/dispatch/franchise/update-tracking/${editingTrackingOrder.id}`, {
        courierPartner: editCourier.trim(),
        trackingNumber: editTrackingNumber.trim(),
        trackingUrl: editTrackingUrl.trim() || undefined,
      });

      if (res.data.success) {
        showToast(`Tracking details updated for Order #${editingTrackingOrder.orderNumber}`);
        setEditingTrackingOrder(null);
        loadFranchiseOrders();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message, "error");
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  const filtered = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      (o.customerPhone && o.customerPhone.includes(q)) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
      (o.courierPartner && o.courierPartner.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-md transition-all ${
            notification.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/20 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Category Tabs (STEP 6) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-blue">
            Franchise Dispatch Operations
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 font-serif mt-0.5">
            {activeTab === "READY" ? "Orders Ready for Dispatch" : "Dispatched Orders"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === "READY"
              ? "Verified uniform orders assigned to your hub. Inspect customer sizes, prepare packaging, and enter live courier tracking to dispatch."
              : "Dispatched customer shipments with live tracking numbers, courier partner links, and handover timestamps."}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("READY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "READY"
                ? "bg-brand-blue text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Orders Ready for Dispatch</span>
          </button>

          <button
            onClick={() => setActiveTab("DISPATCHED")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "DISPATCHED"
                ? "bg-brand-blue text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Dispatched Orders</span>
          </button>
        </div>
      </div>

      {/* Search & Refresh */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative min-w-[260px] max-w-md w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order #, customer name, phone, tracking #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
        </div>

        <button
          onClick={loadFranchiseOrders}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Main Orders List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-brand-blue animate-spin" />
          <span className="text-xs text-slate-500 font-semibold">Loading orders...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400 shadow-sm space-y-2">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700 text-sm">
            {activeTab === "READY" ? "No orders currently ready for dispatch" : "No dispatched orders recorded"}
          </p>
          <p className="text-slate-400 max-w-md mx-auto">
            {activeTab === "READY"
              ? "When the Operational Admin verifies completed uniform orders and assigns them to your franchise, they will automatically appear here."
              : "Dispatched packages with courier tracking numbers will appear here for reference."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((order) => {
            const address = order.shippingAddress;
            const isPrepared = order.productionStatus === "PACKAGE_PREPARED";

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all text-xs"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-base font-black text-slate-900">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        order.productionStatus === "ASSIGNED_TO_FRANCHISE"
                          ? "bg-purple-100 text-purple-800"
                          : order.productionStatus === "PACKAGE_PREPARED"
                          ? "bg-indigo-100 text-indigo-800"
                          : order.productionStatus === "DISPATCHED"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-emerald-100 text-emerald-800"
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

                  <span className="text-[11px] text-slate-400">
                    Order Received: {formatDateTime(order.createdAt)}
                  </span>
                </div>

                {/* Details Section: Step 6 Items 1-7 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Step 6 Item 3: Full Customer Delivery Address */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <MapPin className="w-4 h-4 text-brand-blue flex-shrink-0" />
                      <span>3. Customer Delivery Address Snapshot</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Recipient Name:</span>
                        <strong>{address?.recipientName || order.customerName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Phone Number:</span>
                        <strong>{address?.phone || order.customerPhone || "N/A"}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">House / Flat / Street:</span>
                        <span>
                          {[
                            address?.streetAddress || address?.addressLine1,
                            address?.apartment || address?.addressLine2,
                          ]
                            .filter(Boolean)
                            .join(", ") || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">City / District:</span>
                        <span>{[address?.city, address?.district].filter(Boolean).join(", ")}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">State & Postal PIN:</span>
                        <span>
                          {address?.state} - {address?.postalCode || address?.pincode}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step 6 Items 4, 5, 6, 7: Products, Sizes, Quantities & Notes */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                      <span>4, 5 & 6. Garments & Customer Sizes</span>
                      <span className="text-slate-400 text-[10px]">{order.items.length} item(s)</span>
                    </div>

                    <div className="divide-y divide-slate-200">
                      {order.items.map((it) => (
                        <div key={it.id} className="py-2 flex items-center justify-between">
                          <div className="truncate mr-2">
                            <p className="font-bold text-slate-800 truncate">{it.productName}</p>
                            <span className="text-[10px] text-slate-500">Quantity: {it.quantity}</span>
                          </div>
                          <span className="px-2.5 py-1 bg-brand-blue text-white rounded-lg font-black text-xs flex-shrink-0">
                            Size: {it.size}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Step 6 Item 7: Tailor Notes */}
                    {order.tailorCompletionNotes && (
                      <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                        <span className="font-bold text-slate-800">Tailor Notes: </span>
                        <span className="italic">"{order.tailorCompletionNotes}"</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tracking info if already dispatched */}
                {order.trackingNumber && (
                  <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-sky-800 uppercase block">
                        Dispatched Courier Record
                      </span>
                      <strong className="text-slate-900 text-sm">{order.courierPartner}</strong>
                      <div className="flex items-center gap-2 font-mono text-xs text-brand-blue font-bold mt-0.5">
                        <span>Waybill / Tracking: {order.trackingNumber}</span>
                        <button
                          onClick={() => handleCopy(order.trackingNumber!)}
                          title="Copy tracking number"
                          className="p-1 hover:bg-sky-200/50 rounded"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {copiedTracking === order.trackingNumber && (
                          <span className="text-[9px] text-emerald-600 font-sans">Copied!</span>
                        )}
                      </div>
                      {order.dispatchedAt && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Dispatched On: {formatDateTime(order.dispatchedAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {order.trackingUrl && (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-brand-blue text-white font-bold rounded-xl flex items-center gap-1 shadow-sm"
                        >
                          <span>Track Shipment</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setEditingTrackingOrder(order);
                          setEditCourier(order.courierPartner || "");
                          setEditTrackingNumber(order.trackingNumber || "");
                          setEditTrackingUrl(order.trackingUrl || "");
                        }}
                        className="px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Tracking</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions Toolbar */}
                <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100">
                  {/* Step 6 Action 1: View Order Details */}
                  <button
                    onClick={() => setViewingOrder(order)}
                    className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Full Details</span>
                  </button>

                  {/* Step 6 Action 2: Prepare Package */}
                  {order.productionStatus === "ASSIGNED_TO_FRANCHISE" && (
                    <button
                      onClick={() => handlePreparePackage(order.id, order.orderNumber)}
                      className="px-4 py-2 border border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Prepare Package</span>
                    </button>
                  )}

                  {/* Step 6 Action 3: Dispatch Order */}
                  {!["DISPATCHED", "DELIVERED"].includes(order.productionStatus) && (
                    <button
                      onClick={() => {
                        setDispatchingOrder(order);
                        setCourierPartner("Blue Dart Express");
                        setCustomCourier("");
                        setTrackingNumber("");
                        setTrackingUrl("");
                        setDispatchDate(new Date().toISOString().slice(0, 10));
                        setShippingNotes("");
                      }}
                      className="px-4 py-2 bg-brand-blue hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Dispatch Order</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DISPATCH ORDER (Step 6 Action 3) */}
      {/* ========================================================================= */}
      {dispatchingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-brand-blue flex items-center justify-center mx-auto">
              <Truck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 font-serif">
                Dispatch Order #{dispatchingOrder.orderNumber}
              </h3>
              <p className="text-slate-500">
                Recipient: <strong>{dispatchingOrder.shippingAddress?.recipientName || dispatchingOrder.customerName}</strong> • {dispatchingOrder.shippingAddress?.city}
              </p>
            </div>

            <form onSubmit={handleDispatchSubmit} className="space-y-3">
              {/* Courier Partner Selection */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Courier Partner <span className="text-rose-600">*</span>
                </label>
                <select
                  value={courierPartner}
                  onChange={(e) => setCourierPartner(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold"
                >
                  {COMMON_COURIERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="OTHER">Other / Local Express Courier...</option>
                </select>
              </div>

              {courierPartner === "OTHER" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Enter Courier Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Speedex Logistics"
                    value={customCourier}
                    onChange={(e) => setCustomCourier(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              )}

              {/* Tracking ID */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tracking ID / Waybill Number <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BD789456123IN"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              {/* Dispatch Date */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Dispatch Date <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              {/* Optional Tracking URL */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tracking URL (Optional - Direct Web Link)
                </label>
                <input
                  type="url"
                  placeholder="https://www.bluedart.com/tracking?track=..."
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
                <span className="text-[10px] text-slate-400">
                  Customers can click "Track Shipment" directly from their portal to open this link.
                </span>
              </div>

              {/* Optional Shipping Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Packaging / Shipping Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Sealed in water-resistant express satchel bag with school verification slip."
                  value={shippingNotes}
                  onChange={(e) => setShippingNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDispatchingOrder(null)}
                  className="w-1/2 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDispatch}
                  className="w-1/2 py-2.5 bg-brand-blue hover:bg-blue-800 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingDispatch ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm Dispatch</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT TRACKING */}
      {/* ========================================================================= */}
      {editingTrackingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-black text-slate-900 font-serif">
              Update Tracking: #{editingTrackingOrder.orderNumber}
            </h3>

            <form onSubmit={handleUpdateTrackingSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Courier Partner *</label>
                <input
                  type="text"
                  required
                  value={editCourier}
                  onChange={(e) => setEditCourier(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tracking Number *</label>
                <input
                  type="text"
                  required
                  value={editTrackingNumber}
                  onChange={(e) => setEditTrackingNumber(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tracking URL (Optional)</label>
                <input
                  type="url"
                  value={editTrackingUrl}
                  onChange={(e) => setEditTrackingUrl(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTrackingOrder(null)}
                  className="w-1/2 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingTracking}
                  className="w-1/2 py-2.5 bg-brand-blue hover:bg-blue-800 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isUpdatingTracking ? "Saving..." : "Update Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW ORDER DETAILS (Step 6 Action 1) */}
      {/* ========================================================================= */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 font-serif">
                Order #{viewingOrder.orderNumber} Details
              </h3>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Address */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <strong className="block text-slate-900">Delivery Address</strong>
              <p className="text-slate-700">
                <strong>Recipient:</strong> {viewingOrder.shippingAddress?.recipientName || viewingOrder.customerName}
              </p>
              <p className="text-slate-700">
                <strong>Phone:</strong> {viewingOrder.shippingAddress?.phone || viewingOrder.customerPhone || "N/A"}
              </p>
              <p className="text-slate-700">
                <strong>Street / Flat:</strong>{" "}
                {[
                  viewingOrder.shippingAddress?.streetAddress || viewingOrder.shippingAddress?.addressLine1,
                  viewingOrder.shippingAddress?.apartment || viewingOrder.shippingAddress?.addressLine2,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="text-slate-700">
                <strong>Location:</strong> {viewingOrder.shippingAddress?.city}, {viewingOrder.shippingAddress?.state} -{" "}
                {viewingOrder.shippingAddress?.postalCode || viewingOrder.shippingAddress?.pincode}
              </p>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <strong className="block text-slate-900">Garment Items & Sizes</strong>
              <div className="divide-y border border-slate-200 rounded-2xl overflow-hidden">
                {viewingOrder.items.map((it) => (
                  <div key={it.id} className="p-3 bg-white flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{it.productName}</p>
                      <p className="text-[10px] text-slate-400">Qty: {it.quantity}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-brand-blue text-white rounded-lg font-black text-xs">
                      Size: {it.size}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingOrder(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl"
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
