import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  ShoppingCart,
  Scissors,
  Home,
  User,
  Package,
  Plus,
  Trash2,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../stores/authContext";
import { formatINR, formatDateTime } from "../utils/formatters";

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "orders";

  const [orders, setOrders] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New Measurement form modal
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const [measurementForm, setMeasurementForm] = useState({
    studentName: "",
    gender: "BOYS",
    chest: "",
    waist: "",
    shoulder: "",
    sleeveLength: "",
    shirtLength: "",
    trouserLength: "",
    hip: "",
    skirtLength: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "orders") {
        const res = await api.get("/orders");
        if (res.data.success) setOrders(res.data.data);
      } else if (activeTab === "measurements") {
        const res = await api.get("/measurements");
        if (res.data.success) setMeasurements(res.data.data);
      } else if (activeTab === "addresses") {
        const res = await api.get("/auth/addresses");
        if (res.data.success) setAddresses(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/measurements", measurementForm);
      if (res.data.success) {
        setMeasurementModalOpen(false);
        setMeasurementForm({
          studentName: "",
          gender: "BOYS",
          chest: "",
          waist: "",
          shoulder: "",
          sleeveLength: "",
          shirtLength: "",
          trouserLength: "",
          hip: "",
          skirtLength: "",
          notes: "",
        });
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to save measurement");
    }
  };

  const handleDeleteMeasurement = async (id: string) => {
    if (confirm("Delete this student profile?")) {
      await api.delete(`/measurements/${id}`);
      loadData();
    }
  };

  const handleRequestReturn = async (orderId: string) => {
    const reason = prompt("Please enter the reason for return/size exchange:");
    if (!reason) return;
    try {
      const res = await api.post(`/orders/${orderId}/return`, { reason });
      if (res.data.success) {
        alert(res.data.message);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Return could not be processed.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center text-xl font-bold">
            {user?.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 font-serif">Welcome, {user?.name}!</h1>
            <p className="text-xs text-slate-500">{user?.email} • Customer Portal</p>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 self-stretch sm:self-auto overflow-x-auto">
          <button
            onClick={() => setSearchParams({ tab: "orders" })}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "orders" ? "bg-white text-brand-blue shadow-sm" : "hover:text-slate-900"
            }`}
          >
            My Orders
          </button>
          <button
            onClick={() => setSearchParams({ tab: "measurements" })}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "measurements" ? "bg-white text-brand-blue shadow-sm" : "hover:text-slate-900"
            }`}
          >
            Custom Measurements
          </button>
          <button
            onClick={() => setSearchParams({ tab: "addresses" })}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "addresses" ? "bg-white text-brand-blue shadow-sm" : "hover:text-slate-900"
            }`}
          >
            Delivery Addresses
          </button>
        </div>
      </div>

      {/* Tab: Orders */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Order History ({orders.length})</h2>

          {isLoading ? (
            <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" /></div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <p>You haven't placed any uniform orders yet.</p>
              <Link to="/schools" className="inline-block px-4 py-2 bg-brand-blue text-white rounded-xl font-bold">
                Find Your School Uniform
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-900 font-mono">#{order.orderNumber}</span>
                    <span className="text-slate-400 ml-2">Placed on {formatDateTime(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.productionStatus && (
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-purple-100 text-purple-800 uppercase">
                        {order.productionStatus.replace(/_/g, " ")}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-blue-100 text-brand-blue">
                      {order.status}
                    </span>
                    <span className="font-bold text-slate-900">{formatINR(order.totalAmount)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.productImageUrl || "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=100&q=80"}
                          alt=""
                          className="w-10 h-12 object-cover rounded-lg bg-slate-100"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{item.productName}</p>
                          <p className="text-[11px] text-slate-500">Size: {item.size} • Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-800">{formatINR(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <Link
                    to={`/orders/${order.id}/track`}
                    className="text-brand-blue font-bold flex items-center gap-1 hover:underline"
                  >
                    <span>Track Live Status Timeline</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  {order.status === "DELIVERED" && (
                    <button
                      onClick={() => handleRequestReturn(order.id)}
                      className="px-3 py-1 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Request Size Exchange</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Measurements */}
      {activeTab === "measurements" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Custom Student Profiles</h2>
              <p className="text-xs text-slate-500">Saved body measurements for custom tailoring & alterations</p>
            </div>
            <button
              onClick={() => setMeasurementModalOpen(true)}
              className="px-3.5 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Child's Measurements</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {measurements.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-100 text-brand-blue flex items-center justify-center font-bold text-xs">
                      {m.studentName.charAt(0)}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{m.studentName}</h4>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{m.gender}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMeasurement(m.id)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-[11px] text-slate-700 font-medium">
                  <div>Chest: <strong>{m.chest || "—"}"</strong></div>
                  <div>Waist: <strong>{m.waist || "—"}"</strong></div>
                  <div>Shoulder: <strong>{m.shoulder || "—"}"</strong></div>
                  <div>Sleeve: <strong>{m.sleeveLength || "—"}"</strong></div>
                  <div>Shirt Length: <strong>{m.shirtLength || "—"}"</strong></div>
                  <div>Trouser Length: <strong>{m.trouserLength || "—"}"</strong></div>
                </div>

                {m.notes && (
                  <p className="text-[11px] text-slate-500 italic bg-amber-50 p-2 rounded-lg">
                    Note: {m.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Addresses */}
      {activeTab === "addresses" && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Saved Delivery Addresses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{a.name}</span>
                  {a.isDefault && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-slate-600">
                  {a.addressLine1}, {a.addressLine2 && `${a.addressLine2}, `}{a.city}, {a.state} - {a.pincode}
                </p>
                <p className="text-slate-500">📞 {a.phone}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Measurement Modal */}
      {measurementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <h3 className="font-bold text-slate-900 text-base">Add Child's Measurements (Inches)</h3>

            <form onSubmit={handleAddMeasurement} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Student Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Verma"
                    value={measurementForm.studentName}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, studentName: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Gender *</label>
                  <select
                    value={measurementForm.gender}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, gender: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-white"
                  >
                    <option value="BOYS">Boys</option>
                    <option value="GIRLS">Girls</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold block mb-1">Chest (in)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="28.5"
                    value={measurementForm.chest}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, chest: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Waist (in)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="26"
                    value={measurementForm.waist}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, waist: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Shoulder (in)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="13.5"
                    value={measurementForm.shoulder}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, shoulder: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Sleeve (in)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="18"
                    value={measurementForm.sleeveLength}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, sleeveLength: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Shirt Length</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="22"
                    value={measurementForm.shirtLength}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, shirtLength: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Trouser Length</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="32"
                    value={measurementForm.trouserLength}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, trouserLength: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Fitting Notes for Tailor</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Leave extra margin on hems for growth."
                  value={measurementForm.notes}
                  onChange={(e) => setMeasurementForm({ ...measurementForm, notes: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMeasurementModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-blue text-white font-bold rounded-xl"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
