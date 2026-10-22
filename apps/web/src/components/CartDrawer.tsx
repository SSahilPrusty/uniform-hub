import React from "react";
import { Link } from "react-router-dom";
import { X, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "../stores/cartContext";
import { formatINR } from "../utils/formatters";

export const CartDrawer: React.FC = () => {
  const { cart, isDrawerOpen, setIsDrawerOpen, updateQuantity, removeItem } = useCart();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-blue" />
              <h3 className="font-bold text-slate-900 text-base">Your Uniform Cart</h3>
              <span className="text-xs bg-blue-100 text-brand-blue px-2 py-0.5 rounded-full font-bold">
                {cart?.items.length || 0}
              </span>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!cart || cart.items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-semibold text-slate-800">Your cart is empty</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Find your school's official uniform or browse everyday essential apparel.
                </p>
                <Link
                  to="/schools"
                  onClick={() => setIsDrawerOpen(false)}
                  className="inline-block mt-2 px-4 py-2 bg-brand-blue text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors"
                >
                  Find My School Uniform
                </Link>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm"
                >
                  <img
                    src={item.product.images[0]?.url || "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=150&q=80"}
                    alt={item.product.name}
                    className="w-16 h-20 object-cover rounded-lg bg-slate-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{item.product.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Size: <span className="font-semibold text-slate-800">{item.variant.size}</span>
                      {item.variant.color && <span> | {item.variant.color}</span>}
                    </p>

                    {item.measurement && (
                      <span className="inline-block mt-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                        ✂ Tailored for {item.measurement.studentName}
                      </span>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-slate-900">
                        {formatINR(item.variant.sellingPrice * item.quantity)}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center border border-slate-200 rounded-md">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-semibold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {cart && cart.items.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatINR(cart.subtotal)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount Applied</span>
                    <span>-{formatINR(cart.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span>{cart.deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : formatINR(cart.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-brand-blue">{formatINR(cart.total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/cart"
                  onClick={() => setIsDrawerOpen(false)}
                  className="py-2.5 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold text-center hover:bg-slate-100 transition-colors"
                >
                  View Full Cart
                </Link>
                <Link
                  to="/checkout"
                  onClick={() => setIsDrawerOpen(false)}
                  className="py-2.5 px-3 rounded-lg bg-brand-blue text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 hover:bg-blue-800 shadow-md hover:shadow-lg transition-all"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
