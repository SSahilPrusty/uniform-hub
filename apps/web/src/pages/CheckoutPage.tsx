import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle,
  Truck,
  CreditCard,
  MapPin,
  Plus,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../stores/authContext";
import { useCart } from "../stores/cartContext";
import { formatINR } from "../utils/formatters";
import { INDIAN_STATES } from "@uniform-hub/shared";

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    district: "",
    state: "Delhi",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"TEST_GATEWAY" | "COD">("TEST_GATEWAY");
  const [customerNotes, setCustomerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Payment simulation state
  const [paymentSimulationModal, setPaymentSimulationModal] = useState<{
    orderId: string;
    orderNumber: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=/checkout");
      return;
    }

    // Load saved customer addresses
    api.get("/auth/addresses").then((res) => {
      if (res.data.success) {
        setAddresses(res.data.data);
        if (res.data.data.length > 0) {
          const def = res.data.data.find((a: any) => a.isDefault) || res.data.data[0];
          setSelectedAddressId(def.id);
        } else {
          setIsNewAddress(true);
        }
      }
    });
  }, [user]);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
        <Link to="/products" className="text-xs font-bold text-brand-blue hover:underline">
          Return to Products
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const payload: any = {
        paymentMethod,
        customerNotes,
      };

      if (isNewAddress) {
        payload.newAddress = newAddress;
      } else {
        payload.addressId = selectedAddressId;
      }

      const res = await api.post("/checkout", payload);
      if (res.data.success) {
        const order = res.data.data.order;
        await refreshCart();

        if (paymentMethod === "COD") {
          // COD directly placed
          navigate(`/orders/${order.id}/track`);
        } else {
          // Open simulated payment modal
          setPaymentSimulationModal({
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: order.totalAmount,
          });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to place order. Please review your address or cart.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulatePaymentConfirmation = async () => {
    if (!paymentSimulationModal) return;
    try {
      const res = await api.post("/checkout/verify-payment", {
        orderId: paymentSimulationModal.orderId,
        transactionRef: `PAY_TEST_${Date.now()}`,
        mockSuccess: true,
      });

      if (res.data.success) {
        navigate(`/orders/${paymentSimulationModal.orderId}/track`);
      }
    } catch (err: any) {
      alert("Simulated payment verification failed: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">Checkout</h1>
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Secure Checkout
        </span>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Addresses & Payment */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Delivery Address */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-blue" />
                1. Delivery Address
              </h2>
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsNewAddress(!isNewAddress)}
                  className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isNewAddress ? "Use Saved Address" : "Add New Address"}</span>
                </button>
              )}
            </div>

            {/* Saved Addresses List */}
            {!isNewAddress && addresses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      selectedAddressId === addr.id
                        ? "border-brand-blue bg-blue-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{addr.name}</span>
                        <input
                          type="radio"
                          name="addressRadio"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="text-brand-blue"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {addr.addressLine1}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ""}
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold mt-2">📞 {addr.phone}</span>
                  </label>
                ))}
              </div>
            )}

            {/* New Address Form */}
            {(isNewAddress || addresses.length === 0) && (
              <div className="space-y-3 pt-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Recipient Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Verma"
                      value={newAddress.name}
                      onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Flat, House no., Building, Apartment *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 402, Green Glen Heights"
                    value={newAddress.addressLine1}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Area, Street, Sector, Village</label>
                  <input
                    type="text"
                    placeholder="e.g. Outer Ring Road, Bellandur"
                    value={newAddress.addressLine2}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. New Delhi"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">State *</label>
                    <select
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none bg-white"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="6 digits"
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Payment Method */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-blue" />
              2. Payment Method
            </h2>

            <div className="space-y-3">
              <label
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  paymentMethod === "TEST_GATEWAY"
                    ? "border-brand-blue bg-blue-50/50 shadow-sm"
                    : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="paymentOption"
                  checked={paymentMethod === "TEST_GATEWAY"}
                  onChange={() => setPaymentMethod("TEST_GATEWAY")}
                  className="mt-1 text-brand-blue"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Uniform Hub Online Payment (Development Simulator / UPI / Cards)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Safe payment test sandbox. Allows immediate order confirmation simulation without external gateway delays.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  paymentMethod === "COD"
                    ? "border-brand-blue bg-blue-50/50 shadow-sm"
                    : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="paymentOption"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="mt-1 text-brand-blue"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Cash on Delivery (COD)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pay in cash or UPI QR scan upon physical uniform delivery at home or school pickup.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Step 3: Delivery Notes */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2 text-xs">
            <label className="font-bold text-slate-800 block">Delivery or Alteration Instructions (Optional):</label>
            <textarea
              rows={2}
              placeholder="e.g. Leave with building security if unavailable or call before dispatch."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column: Order Review & Placement */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-900 text-sm">Review Uniform Items ({cart.items.length})</h3>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
            {cart.items.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-slate-800 truncate">{item.product.name}</p>
                  <p className="text-[11px] text-slate-500">
                    Size: {item.variant.size} × {item.quantity}
                  </p>
                </div>
                <span className="font-bold text-slate-900">
                  {formatINR(item.variant.sellingPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatINR(cart.subtotal)}</span>
            </div>

            {cart.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount Applied</span>
                <span>-{formatINR(cart.discount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Delivery Charges</span>
              <span>{cart.deliveryFee === 0 ? <strong className="text-emerald-600">FREE</strong> : formatINR(cart.deliveryFee)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Taxes (Apparel GST 5%)</span>
              <span className="font-semibold text-slate-900">{formatINR(cart.taxAmount)}</span>
            </div>

            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-200">
              <span>Grand Total</span>
              <span className="text-brand-blue">{formatINR(cart.total)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-brand-blue hover:bg-blue-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            <span>{isSubmitting ? "Placing Order..." : "Place Uniform Order"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Payment Simulator Modal */}
      {paymentSimulationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="w-7 h-7" />
            </div>

            <h3 className="font-extrabold text-slate-900 text-base">Uniform Hub Payment Simulator</h3>
            <p className="text-xs text-slate-600">
              Order <strong>#{paymentSimulationModal.orderNumber}</strong> has been created with stock reserved. Total: <strong>{formatINR(paymentSimulationModal.amount)}</strong>.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-left space-y-1">
              <p>• <strong>Payment Mode:</strong> Simulated Test Sandbox</p>
              <p>• <strong>Currency:</strong> INR (₹)</p>
              <p>• <strong>Status:</strong> Ready for client signature authorization</p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleSimulatePaymentConfirmation}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Confirm Payment (Simulate Success)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
