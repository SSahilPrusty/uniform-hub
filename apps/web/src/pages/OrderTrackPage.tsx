import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Search, CheckCircle, Package, Truck, Clock, XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { api } from "../services/api";
import { formatINR, formatDateTime } from "../utils/formatters";

export const OrderTrackPage: React.FC = () => {
  const { orderId } = useParams<{ orderId?: string }>();
  const [query, setQuery] = useState(orderId || "");
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
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
      const res = await api.get(`/orders/track/${encodeURIComponent(identifier.trim())}`);
      if (res.data.success) {
        setTrackingData(res.data.data);
      }
    } catch (err: any) {
      setTrackingData(null);
      setErrorMsg(err.response?.data?.error || "No order found matching this reference.");
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-blue">
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </Link>

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
          Track Your Uniform Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your Order Number (e.g. UH-2026-90412) or Tracking Code
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

      {trackingData && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Order Reference</span>
              <h3 className="text-lg font-extrabold text-slate-900 font-mono">
                #{trackingData.order.orderNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Placed on {formatDateTime(trackingData.order.createdAt)} • Recipient: <strong>{trackingData.order.customerName}</strong>
              </p>
            </div>

            <div className="flex flex-col sm:items-end text-xs">
              <span className="text-slate-500">Order Total</span>
              <span className="text-base font-extrabold text-brand-blue">
                {formatINR(trackingData.order.totalAmount)}
              </span>
              {trackingData.order.trackingNumber && (
                <span className="text-[11px] font-mono text-slate-600 mt-1 bg-slate-100 px-2 py-0.5 rounded">
                  Courier: {trackingData.order.courierPartner || "Blue Dart"} ({trackingData.order.trackingNumber})
                </span>
              )}
            </div>
          </div>

          {/* Multi-Step Timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Fulfillment Progress</h4>

            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {trackingData.timeline.map((step: any, idx: number) => (
                <div key={idx} className="relative flex items-start gap-3">
                  <div
                    className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      step.isCompleted
                        ? "bg-brand-blue border-brand-blue text-white shadow-sm"
                        : "bg-white border-slate-300 text-slate-400"
                    }`}
                  >
                    {step.isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                  </div>

                  <div className="space-y-0.5">
                    <h5 className={`text-xs font-bold ${step.isCompleted ? "text-slate-900" : "text-slate-400"}`}>
                      {step.label}
                    </h5>
                    <p className="text-[11px] text-slate-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Uniform Package Contents</h4>
            <div className="divide-y divide-slate-100">
              {trackingData.order.items.map((item: any) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.productImageUrl || "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=100&q=80"}
                      alt=""
                      className="w-10 h-12 object-cover rounded-lg bg-slate-100"
                    />
                    <div>
                      <p className="font-bold text-slate-800">{item.productName}</p>
                      <p className="text-[11px] text-slate-500">Size: {item.size}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-slate-600">Qty: {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
