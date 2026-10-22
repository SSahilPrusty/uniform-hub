import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Search,
  CheckCircle,
  Package,
  Truck,
  Clock,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Copy,
  ExternalLink,
  MapPin,
  Calendar,
  ShieldCheck,
  Building,
  Store,
  Scissors,
} from "lucide-react";
import { api } from "../services/api";
import { formatINR, formatDateTime } from "../utils/formatters";

export const OrderTrackPage: React.FC = () => {
  const { orderId } = useParams<{ orderId?: string }>();
  const [query, setQuery] = useState(orderId || "");
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedTracking, setCopiedTracking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (orderId) {
      performTrack(orderId);
    }
  }, [orderId]);

  const performTrack = async (identifier: string) => {
    if (!identifier.trim()) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      // First try the specialized dispatch tracking endpoint
      const res = await api.get(`/dispatch/track/${encodeURIComponent(identifier.trim())}`);
      if (res.data.success) {
        setTrackingData(res.data.data);
        return;
      }
    } catch (err: any) {
      // Fallback to legacy orders track endpoint
      try {
        const fallbackRes = await api.get(`/orders/track/${encodeURIComponent(identifier.trim())}`);
        if (fallbackRes.data.success) {
          setTrackingData(fallbackRes.data.data);
          return;
        }
      } catch (fallbackErr: any) {
        setTrackingData(null);
        setErrorMsg(err.response?.data?.error || fallbackErr.response?.data?.error || "No order found matching this reference.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/orders/${encodeURIComponent(query.trim())}/track`);
      performTrack(query);
    }
  };

  const handleCopyTracking = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2500);
  };

  const order = trackingData?.order;
  const trackingInfo = trackingData?.trackingInfo;
  const timeline = trackingData?.timeline || [];
  const address = order?.shippingAddress;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-blue">
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </Link>

      <div className="text-center space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-blue">
          Uniform Hub Live Fulfillment
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
          Track Your Uniform Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your Order Number (e.g. UH-2026-90412) or Courier Tracking ID
        </p>

        <form onSubmit={handleSearch} className="max-w-md mx-auto pt-4 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="e.g. UH-2026-90412"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue uppercase"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors shadow-md"
          >
            Track
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl text-center font-medium">
          {errorMsg}
        </div>
      )}

      {order && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Order Reference</span>
              <h3 className="text-xl font-extrabold text-slate-900 font-mono">
                #{order.orderNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Placed on {formatDateTime(order.createdAt)} • Recipient: <strong>{order.customerName}</strong>
              </p>
            </div>

            <div className="flex flex-col sm:items-end text-xs">
              <span className="text-slate-500">Order Total</span>
              <span className="text-lg font-black text-brand-blue">
                {formatINR(order.totalAmount)}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold uppercase mt-0.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Payment: {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* STEP 7: LIVE DISPATCH COURIER DETAILS CARD */}
          {(trackingInfo?.hasTracking || order.trackingNumber) && (
            <div className="bg-sky-50/70 border-2 border-sky-200 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-blue text-white flex items-center justify-center shadow-sm">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-brand-blue tracking-wider">
                      Live Courier Shipment Record
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      {trackingInfo?.courierPartner || order.courierPartner || "Express Logistics Partner"}
                    </h4>
                  </div>
                </div>

                {trackingInfo?.dispatchedAt && (
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
                    Dispatched On: <strong>{formatDateTime(trackingInfo.dispatchedAt)}</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-sky-100">
                {/* 1-Click Copy Tracking ID */}
                <div className="p-3 bg-white border border-sky-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Tracking ID / Waybill Number
                    </span>
                    <span className="font-mono text-sm font-black text-brand-blue">
                      {trackingInfo?.trackingNumber || order.trackingNumber}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyTracking(trackingInfo?.trackingNumber || order.trackingNumber)}
                    className="px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedTracking ? "Copied!" : "Copy"}</span>
                  </button>
                </div>

                {/* Direct Track Shipment Button */}
                <div className="p-3 bg-white border border-sky-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Courier Tracking Portal
                    </span>
                    <span className="text-xs text-slate-600 font-semibold">
                      {(trackingInfo?.trackingUrl || order.trackingUrl)
                        ? "Real-time carrier GPS link available"
                        : "Track via official courier website"}
                    </span>
                  </div>

                  {(trackingInfo?.trackingUrl || order.trackingUrl) ? (
                    <a
                      href={trackingInfo?.trackingUrl || order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-brand-blue hover:bg-blue-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
                    >
                      <span>Track Shipment</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Manual Tracking</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: COMPLETE 9-STAGE STATUS TIMELINE WITH ACTUAL MILESTONE TIMESTAMPS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                9-Stage Uniform Production & Delivery Timeline
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">
                Milestone Timestamps Synchronized
              </span>
            </div>

            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timeline.map((step: any, idx: number) => {
                const isCurrent = step.isCurrent || (step.isCompleted && (!timeline[idx + 1] || !timeline[idx + 1].isCompleted));

                return (
                  <div key={idx} className="relative flex items-start justify-between gap-4">
                    <div
                      className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        step.isCompleted
                          ? "bg-brand-blue border-brand-blue text-white shadow-sm"
                          : "bg-white border-slate-300 text-slate-400"
                      } ${isCurrent ? "ring-4 ring-blue-100" : ""}`}
                    >
                      {step.isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                    </div>

                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <h5
                          className={`text-xs font-bold ${
                            step.isCompleted ? "text-slate-900 font-extrabold" : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </h5>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-blue-100 text-brand-blue text-[9px] font-black uppercase rounded-full animate-pulse">
                            Current Stage
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{step.desc || step.description}</p>
                    </div>

                    {/* Actual Milestone Timestamp */}
                    {step.timestamp && (
                      <div className="text-right text-[11px] text-slate-400 flex-shrink-0 font-mono">
                        <span className="block font-semibold text-slate-700">
                          {formatDateTime(step.timestamp)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Delivery Address Snapshot */}
          {address && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-blue" />
                <span>Delivery Address Snapshot</span>
              </h4>
              <div className="text-slate-600 space-y-0.5">
                <p>
                  <strong>{address.recipientName || order.customerName}</strong> • {address.phone || order.customerPhone}
                </p>
                <p>
                  {[address.streetAddress || address.addressLine1, address.apartment || address.addressLine2]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p>
                  {[address.city, address.district, address.state].filter(Boolean).join(", ")} -{" "}
                  {address.postalCode || address.pincode}
                </p>
              </div>
            </div>
          )}

          {/* Purchased Items List */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Uniform Package Contents
            </h4>
            <div className="divide-y divide-slate-100">
              {order.items.map((item: any) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.productImageUrl || "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=100&q=80"}
                      alt=""
                      className="w-10 h-12 object-cover rounded-lg bg-slate-100"
                    />
                    <div>
                      <p className="font-bold text-slate-800">{item.productName}</p>
                      <p className="text-[11px] text-slate-500">
                        Selected Size: <strong className="text-brand-blue">{item.size}</strong> • Quantity: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-slate-600">
                    {item.price ? formatINR(item.price * item.quantity) : `Qty: ${item.quantity}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
