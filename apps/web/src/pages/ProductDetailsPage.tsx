import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  ShieldCheck,
  Truck,
  RefreshCw,
  Ruler,
  Scissors,
  Check,
  ShoppingCart,
  Zap,
  ArrowLeft,
  Store,
} from "lucide-react";
import { api } from "../services/api";
import { useCart } from "../stores/cartContext";
import { useAuth } from "../stores/authContext";
import { formatINR } from "../utils/formatters";
import { SizeChartModal } from "../components/SizeChartModal";

export const ProductDetailsPage: React.FC = () => {
  const { productSlug } = useParams<{ productSlug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState<boolean>(false);
  const [customMeasurements, setCustomMeasurements] = useState<any[]>([]);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"fabric" | "care" | "vendor">("fabric");
  const [isAdding, setIsAdding] = useState<boolean>(false);

  useEffect(() => {
    if (productSlug) {
      api.get(`/products/${productSlug}`).then((res) => {
        if (res.data.success) {
          const prod = res.data.data;
          setProduct(prod);
          if (prod.variants && prod.variants.length > 0) {
            setSelectedVariant(prod.variants[0]);
          }
          if (prod.images && prod.images.length > 0) {
            setSelectedImage(prod.images[0].url);
          }
        }
      });
    }

    // If user is logged in, fetch their saved measurements
    if (user) {
      api.get("/measurements").then((res) => {
        if (res.data.success) {
          setCustomMeasurements(res.data.data);
        }
      }).catch(() => {});
    }
  }, [productSlug, user]);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const mrp = selectedVariant?.mrp || 0;
  const sellingPrice = selectedVariant?.sellingPrice || 0;
  const discountPercent = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const isOutOfStock = !selectedVariant || selectedVariant.stock <= 0;

  const handleAddToCart = async () => {
    if (!selectedVariant || isOutOfStock) return;
    setIsAdding(true);
    await addToCart(product.id, selectedVariant.id, quantity, selectedMeasurementId || null);
    setIsAdding(false);
  };

  const handleBuyNow = async () => {
    if (!selectedVariant || isOutOfStock) return;
    await addToCart(product.id, selectedVariant.id, quantity, selectedMeasurementId || null);
    navigate("/checkout");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-brand-blue">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-brand-blue">Products</Link>
        <span>/</span>
        {product.school && (
          <>
            <Link to={`/schools/${product.school.slug}`} className="hover:text-brand-blue">
              {product.school.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-[4/5] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative">
            <img
              src={selectedImage || product.images?.[0]?.url || "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 right-4 bg-amber-500 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-md">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.url)}
                  className={`w-16 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === img.url ? "border-brand-blue shadow-md scale-105" : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Controls */}
        <div className="lg:col-span-6 space-y-6">
          {/* School & Category Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {product.school ? (
              <Link
                to={`/schools/${product.school.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-navy text-white text-xs font-bold rounded-full hover:bg-slate-800 transition-colors shadow-sm"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>{product.school.name}</span>
              </Link>
            ) : (
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                Standard School Wear
              </span>
            )}

            {product.category && (
              <span className="px-3 py-1 bg-blue-50 text-brand-blue text-xs font-bold rounded-full border border-blue-100">
                {product.category.name}
              </span>
            )}

            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full uppercase">
              {product.gender}
            </span>
          </div>

          {/* Product Title & Short Description */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif leading-tight">
              {product.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Pricing Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-slate-900 font-sans">
              {formatINR(sellingPrice)}
            </span>
            {mrp > sellingPrice && (
              <>
                <span className="text-base text-slate-400 line-through">
                  {formatINR(mrp)}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Save {formatINR(mrp - sellingPrice)}
                </span>
              </>
            )}
            <span className="text-[11px] text-slate-400 ml-auto">(Inclusive of all taxes)</span>
          </div>

          {/* Size Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Select Size: <span className="text-brand-blue font-extrabold">{selectedVariant?.size}</span>
              </span>
              <button
                onClick={() => setIsSizeChartOpen(true)}
                className="text-xs font-semibold text-brand-blue hover:underline flex items-center gap-1"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>View Size Guide</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {product.variants?.map((v: any) => {
                const isSelected = selectedVariant?.id === v.id;
                const isStockEmpty = v.stock <= 0;
                return (
                  <button
                    key={v.id}
                    disabled={isStockEmpty}
                    onClick={() => setSelectedVariant(v)}
                    className={`min-w-[48px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? "bg-brand-blue text-white border-brand-blue shadow-md scale-105"
                        : isStockEmpty
                        ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through"
                        : "bg-white text-slate-700 border-slate-300 hover:border-brand-blue"
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Availability */}
          <div className="text-xs">
            {isOutOfStock ? (
              <span className="text-red-600 font-bold">Currently Out of Stock</span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                In Stock ({selectedVariant.stock} units available for dispatch)
              </span>
            )}
          </div>

          {/* Custom Tailor Alteration Option (If Supported) */}
          {product.allowTailoring && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-bold text-amber-900">Bespoke Tailor Alteration Available</h4>
              </div>
              <p className="text-[11px] text-amber-800/80">
                Need customized sleeve, hem, or waist adjustments? Select your saved student profile or enter measurements.
              </p>

              {customMeasurements.length > 0 ? (
                <select
                  value={selectedMeasurementId}
                  onChange={(e) => setSelectedMeasurementId(e.target.value)}
                  className="w-full text-xs bg-white border border-amber-300 rounded-xl p-2 text-slate-800 font-medium focus:outline-none"
                >
                  <option value="">No custom tailoring (Standard Size)</option>
                  {customMeasurements.map((m) => (
                    <option key={m.id} value={m.id}>
                      ✂ Custom Fit for {m.studentName} ({m.gender})
                    </option>
                  ))}
                </select>
              ) : (
                <Link
                  to="/customer/dashboard?tab=measurements"
                  className="text-xs font-bold text-brand-blue hover:underline inline-block"
                >
                  + Add student measurements in your profile
                </Link>
              )}
            </div>
          )}

          {/* Quantity Controls & Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  -
                </button>
                <span className="px-4 text-xs font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(selectedVariant?.stock || 10, quantity + 1))}
                  className="px-3.5 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
                className="py-3 px-6 rounded-2xl bg-white hover:bg-slate-50 text-brand-blue border-2 border-brand-blue text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isAdding ? "Adding..." : "Add to Cart"}</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="py-3 px-6 rounded-2xl bg-brand-blue hover:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>

          {/* Delivery & Trust Badges */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Ships within 24-48 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>7-Day Easy Size Exchange</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Fabric, Care, Vendor Information */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab("fabric")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "fabric" ? "border-brand-blue text-brand-blue" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Fabric & Specifications
          </button>
          <button
            onClick={() => setActiveTab("care")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "care" ? "border-brand-blue text-brand-blue" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Washing & Care Instructions
          </button>
          <button
            onClick={() => setActiveTab("vendor")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "vendor" ? "border-brand-blue text-brand-blue" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Authorized Vendor Details
          </button>
        </div>

        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          {activeTab === "fabric" && (
            <div className="space-y-3">
              <p>{product.fabricDetails || "Specially woven poly-viscose breathable blend engineered for high strength, pill-resistance, and all-day classroom comfort."}</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
                <li>Non-shrink, colorfast dyeing compliant with school uniform codes.</li>
                <li>Bar-tack stitching at stress areas for enhanced tear resistance.</li>
              </ul>
            </div>
          )}

          {activeTab === "care" && (
            <div className="space-y-2">
              <p>{product.careInstructions || "Gentle cycle machine wash warm. Do not bleach. Line dry in shade to preserve crisp vibrancy."}</p>
            </div>
          )}

          {activeTab === "vendor" && (
            <div className="space-y-2">
              <p className="font-semibold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-brand-blue" />
                {product.franchise?.businessName || "National Uniforms & Apparel NCR (Authorized Uniform Hub Franchise)"}
              </p>
              <p className="text-xs text-slate-500">
                GST Verified Partner • Manufactured in compliance with official uniform technical specifications.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Size Chart Modal */}
      <SizeChartModal
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
        categoryName={product.category?.name}
      />
    </div>
  );
};
