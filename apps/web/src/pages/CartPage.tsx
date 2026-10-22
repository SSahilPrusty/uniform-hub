import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag, ArrowRight, Tag, Truck, ShieldCheck } from "lucide-react";
import { useCart } from "../stores/cartContext";
import { formatINR } from "../utils/formatters";

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeItem, applyCoupon, isLoading } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const navigate = useNavigate();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponMsg(null);
    if (!couponInput.trim()) return;

    const res = await applyCoupon(couponInput.trim());
    if (res.success) {
      setCouponMsg({ text: res.message || "Coupon applied!" });
    } else {
      setCouponMsg({ text: res.error || "Failed to apply coupon", isError: true });
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 font-serif">Your Cart is Empty</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Find the approved uniform for your school or shop standard uniform staples.
        </p>
        <div className="pt-2">
          <Link
            to="/schools"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors shadow-md"
          >
            <span>Find Your School</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const freeDeliveryThreshold = 1499;
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - cart.subtotal);
  const freeDeliveryProgress = Math.min(100, Math.round((cart.subtotal / freeDeliveryThreshold) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
        Shopping Cart ({cart.items.reduce((s, i) => s + i.quantity, 0)} Items)
      </h1>

      {/* Free Delivery Banner Progress */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-slate-700">
            <Truck className="w-4 h-4 text-brand-blue" />
            {remainingForFreeDelivery === 0 ? (
              <span className="text-emerald-700 font-bold">🎉 Congratulations! You have unlocked FREE Pan-India Delivery!</span>
            ) : (
              <span>Add <strong>{formatINR(remainingForFreeDelivery)}</strong> more to unlock <strong>FREE Delivery</strong></span>
            )}
          </span>
          <span className="text-slate-500">{freeDeliveryProgress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${remainingForFreeDelivery === 0 ? "bg-emerald-500" : "bg-brand-blue"}`}
            style={{ width: `${freeDeliveryProgress}%` }}
          />
        </div>
      </div>

      {/* Main Cart Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cart Items Table */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            {cart.items.map((item) => (
              <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <img
                  src={item.product.images[0]?.url || "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=200&q=80"}
                  alt={item.product.name}
                  className="w-20 h-24 object-cover rounded-xl bg-slate-100 flex-shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <Link
                    to={`/products/${item.product.slug}`}
                    className="text-sm font-bold text-slate-900 hover:text-brand-blue transition-colors line-clamp-1"
                  >
                    {item.product.name}
                  </Link>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Size: <strong className="text-slate-800">{item.variant.size}</strong></span>
                    {item.variant.color && <span>Color: <strong>{item.variant.color}</strong></span>}
                    <span>Unit: {formatINR(item.variant.sellingPrice)}</span>
                  </div>

                  {item.measurement && (
                    <span className="inline-block text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md">
                      ✂ Tailored Fit for {item.measurement.studentName}
                    </span>
                  )}
                </div>

                {/* Quantity & Price */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-sm font-extrabold text-slate-900 min-w-[70px] text-right">
                    {formatINR(item.variant.sellingPrice * item.quantity)}
                  </span>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Order Summary Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-900 text-base">Order Summary</h3>

          {/* Coupon Input */}
          <form onSubmit={handleApplyCoupon} className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-blue" />
              Apply Promo Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. FIRST10, UNIFORM100"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="flex-1 text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue uppercase font-mono font-bold"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
              >
                Apply
              </button>
            </div>
            {couponMsg && (
              <p className={`text-xs font-medium ${couponMsg.isError ? "text-red-600" : "text-emerald-600"}`}>
                {couponMsg.text}
              </p>
            )}
            <p className="text-[10px] text-slate-400">Available demo codes: FIRST10, UNIFORM100</p>
          </form>

          {/* Price Calculation */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatINR(cart.subtotal)}</span>
            </div>

            {cart.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon Discount ({cart.couponCode})</span>
                <span>-{formatINR(cart.discount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Estimated Delivery Fee</span>
              <span>
                {cart.deliveryFee === 0 ? (
                  <span className="text-emerald-600 font-bold">FREE</span>
                ) : (
                  formatINR(cart.deliveryFee)
                )}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>GST / Apparel Taxes (5%)</span>
              <span className="font-semibold text-slate-900">{formatINR(cart.taxAmount)}</span>
            </div>

            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-200">
              <span>Total Payable</span>
              <span className="text-brand-blue">{formatINR(cart.total)}</span>
            </div>
          </div>

          {/* Checkout CTA */}
          <button
            onClick={() => navigate("/checkout")}
            className="w-full py-3.5 px-6 rounded-2xl bg-brand-blue hover:bg-blue-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure 256-bit encrypted checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
};
