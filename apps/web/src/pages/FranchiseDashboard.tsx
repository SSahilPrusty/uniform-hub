import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  Plus,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Truck,
  Building,
  Save,
} from "lucide-react";
import { api } from "../services/api";
import { formatINR, formatDateTime } from "../utils/formatters";

export const FranchiseDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stock edit states
  const [editingStock, setEditingStock] = useState<Record<string, number>>({});

  // Add Product form state
  const [newProd, setNewProd] = useState({
    name: "",
    description: "",
    categoryId: "",
    schoolId: "",
    gender: "UNISEX",
    mrp: "",
    sellingPrice: "",
    size: "30",
    stock: "25",
    imageUrl: "",
  });

  useEffect(() => {
    loadData();
    api.get("/products/categories").then((res) => setCategories(res.data.data)).catch(() => {});
    api.get("/schools").then((res) => setSchools(res.data.data)).catch(() => {});
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/portal/franchise/dashboard");
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
      const prodRes = await api.get("/portal/franchise/products");
      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStock = async (variantId: string) => {
    const qty = editingStock[variantId];
    if (qty === undefined) return;
    try {
      await api.put(`/portal/franchise/variants/${variantId}`, { stock: qty });
      alert("Stock quantity updated!");
      loadData();
    } catch (err: any) {
      alert("Failed to update stock: " + err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    const trackingNumber = prompt("Enter Courier Tracking Number (optional):") || `UH-TRK-${Date.now().toString().slice(-6)}`;
    try {
      await api.put(`/portal/franchise/orders/${orderId}/status`, {
        status,
        trackingNumber,
        courierPartner: "Blue Dart Express",
      });
      alert(`Order updated to ${status}`);
      loadData();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: newProd.name,
        description: newProd.description,
        categoryId: newProd.categoryId,
        schoolId: newProd.schoolId || null,
        gender: newProd.gender,
        imageUrl: newProd.imageUrl,
        variants: [
          {
            size: newProd.size,
            mrp: parseFloat(newProd.mrp),
            sellingPrice: parseFloat(newProd.sellingPrice),
            stock: parseInt(newProd.stock, 10),
          },
        ],
      };

      const res = await api.post("/portal/franchise/products", payload);
      if (res.data.success) {
        alert(res.data.message);
        setSearchParams({ tab: "inventory" });
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create product");
    }
  };

  if (isLoading) {
    return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!dashboardData) return <div>Franchise portal data not loaded.</div>;

  return (
    <div className="space-y-6">
      {/* Franchise Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-blue">Authorized Franchise Retailer</span>
          <h1 className="text-xl font-extrabold text-slate-900 font-serif mt-0.5">
            {dashboardData.franchise.businessName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Owner: <strong>{dashboardData.franchise.ownerName}</strong> • GST: {dashboardData.franchise.gstNumber || "Verified"} • Area: {dashboardData.franchise.serviceArea}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 self-stretch md:self-auto overflow-x-auto">
          <button
            onClick={() => setSearchParams({ tab: "overview" })}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "overview" ? "bg-white text-brand-blue shadow-sm" : "hover:text-slate-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSearchParams({ tab: "inventory" })}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "inventory" ? "bg-white text-brand-blue shadow-sm" : "hover:text-slate-900"
            }`}
          >
            Inventory & Stock
          </button>
          <button
            onClick={() => setSearchParams({ tab: "orders" })}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "orders" ? "bg-white text-brand-blue shadow-sm" : "hover:text-slate-900"
            }`}
          >
            Assigned Orders
          </button>
          <button
            onClick={() => setSearchParams({ tab: "add-product" })}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "add-product" ? "bg-white text-brand-blue shadow-sm" : "hover:text-slate-900"
            }`}
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Products</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{dashboardData.metrics.totalProducts}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-amber-500 uppercase">Low Stock Alerts</span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">{dashboardData.metrics.lowStockCount}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-blue-500 uppercase">Orders Received</span>
              <p className="text-2xl font-extrabold text-brand-blue mt-1">{dashboardData.metrics.totalAssignedOrders}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-500 uppercase">Gross Sales (INR)</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatINR(dashboardData.metrics.totalRevenue)}</p>
            </div>
          </div>

          {/* Low Stock Warning Banner */}
          {dashboardData.lowStockVariants.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-2 text-xs">
              <h3 className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Attention Required: Low Inventory Items
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {dashboardData.lowStockVariants.map((v: any) => (
                  <div key={v.id} className="bg-white p-2.5 rounded-xl border border-amber-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900 truncate">{v.product?.name}</p>
                      <span className="text-[10px] text-slate-500">Size: {v.size}</span>
                    </div>
                    <span className="text-xs font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      {v.stock} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inventory Management Tab */}
      {activeTab === "inventory" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 font-serif">Product Inventory & Variant Stock</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b">
                <tr>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Category / School</th>
                  <th className="py-3 px-3">Size Variant</th>
                  <th className="py-3 px-3">Selling Price</th>
                  <th className="py-3 px-3">In-Stock Count</th>
                  <th className="py-3 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {products.flatMap((p) =>
                  (p.variants || []).map((v: any) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900 max-w-[200px] truncate">{p.name}</td>
                      <td className="py-3 px-3 text-slate-500">
                        {p.category?.name} {p.school ? `• ${p.school.name}` : ""}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-brand-blue">{v.size}</td>
                      <td className="py-3 px-3">{formatINR(v.sellingPrice)}</td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          defaultValue={v.stock}
                          onChange={(e) =>
                            setEditingStock({ ...editingStock, [v.id]: parseInt(e.target.value, 10) })
                          }
                          className="w-20 p-1.5 border border-slate-300 rounded-lg text-center font-bold"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleUpdateStock(v.id)}
                          className="px-3 py-1 bg-brand-blue text-white rounded-lg text-[11px] font-bold hover:bg-blue-800 flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" /> Save
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 font-serif">Customer Orders Fulfillment</h2>

          <div className="divide-y divide-slate-100">
            {dashboardData.recentOrders.map((order: any) => (
              <div key={order.id} className="py-4 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-slate-900 font-mono text-sm">#{order.orderNumber}</span>
                    <span className="text-slate-400 ml-2">{formatDateTime(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-blue-100 text-brand-blue">
                      {order.status}
                    </span>
                    <span className="font-extrabold text-slate-900">{formatINR(order.totalAmount)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-[11px] text-slate-600">
                  <p>Customer: <strong>{order.customerName}</strong> ({order.customerPhone})</p>
                  <p>Shipping to: {order.shippingAddressJson ? JSON.parse(order.shippingAddressJson).city : "N/A"}</p>
                </div>

                <div className="flex gap-2">
                  {order.status === "CONFIRMED" && (
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, "PROCESSING")}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold"
                    >
                      Start Packaging
                    </button>
                  )}
                  {order.status === "PROCESSING" && (
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, "READY_FOR_DISPATCH")}
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-lg font-bold"
                    >
                      Mark Ready for Dispatch
                    </button>
                  )}
                  {order.status === "READY_FOR_DISPATCH" && (
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, "SHIPPED")}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-1"
                    >
                      <Truck className="w-3.5 h-3.5" /> Handover to Courier (Ship)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Product Tab */}
      {activeTab === "add-product" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl">
          <h2 className="text-base font-bold text-slate-900 font-serif">Submit Uniform Product Listing</h2>
          <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
            <div>
              <label className="font-bold block mb-1">Product Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. DPS Official Oxford White Shirt"
                value={newProd.name}
                onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Uniform Category *</label>
                <select
                  required
                  value={newProd.categoryId}
                  onChange={(e) => setNewProd({ ...newProd, categoryId: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">School Association</label>
                <select
                  value={newProd.schoolId}
                  onChange={(e) => setNewProd({ ...newProd, schoolId: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-white"
                >
                  <option value="">General Marketplace (No School)</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="font-bold block mb-1">Initial Size</label>
                <input
                  type="text"
                  required
                  value={newProd.size}
                  onChange={(e) => setNewProd({ ...newProd, size: e.target.value })}
                  className="w-full p-2 border rounded-xl text-center"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">MRP (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="550"
                  value={newProd.mrp}
                  onChange={(e) => setNewProd({ ...newProd, mrp: e.target.value })}
                  className="w-full p-2 border rounded-xl text-center"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="475"
                  value={newProd.sellingPrice}
                  onChange={(e) => setNewProd({ ...newProd, sellingPrice: e.target.value })}
                  className="w-full p-2 border rounded-xl text-center"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Stock Qty</label>
                <input
                  type="number"
                  required
                  value={newProd.stock}
                  onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })}
                  className="w-full p-2 border rounded-xl text-center"
                />
              </div>
            </div>

            <div>
              <label className="font-bold block mb-1">Product Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={newProd.imageUrl}
                onChange={(e) => setNewProd({ ...newProd, imageUrl: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Garment Description *</label>
              <textarea
                required
                rows={3}
                placeholder="Fabric composition, collar specifications, pockets..."
                value={newProd.description}
                onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl shadow-md"
            >
              Submit Product for Admin Approval
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
