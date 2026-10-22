import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, GraduationCap } from "lucide-react";
import { formatINR } from "../utils/formatters";
import { useCart } from "../stores/cartContext";

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    gender?: string;
    school?: { name: string; slug: string } | null;
    category?: { name: string; slug: string } | null;
    images?: { url: string; altText?: string | null }[];
    variants?: {
      id: string;
      size: string;
      mrp: number;
      sellingPrice: number;
      stock: number;
    }[];
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const primaryVariant = product.variants?.[0];
  const primaryImage = product.images?.[0]?.url || "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80";

  const mrp = primaryVariant?.mrp || 0;
  const sellingPrice = primaryVariant?.sellingPrice || 0;
  const discountPercent = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (primaryVariant) {
      await addToCart(product.id, primaryVariant.id, 1);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Product Image & Badges */}
        <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
          <Link to={`/products/${product.slug}`}>
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </Link>

          {/* School Badge */}
          {product.school ? (
            <div className="absolute top-2.5 left-2.5 bg-brand-navy/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <GraduationCap className="w-3 h-3 text-amber-400" />
              <span className="max-w-[140px] truncate">{product.school.name}</span>
            </div>
          ) : (
            <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-sm">
              Standard Marketplace
            </div>
          )}

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-2.5 right-2.5 bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
              {discountPercent}% OFF
            </div>
          )}

          {/* Available Sizes Overlay */}
          {product.variants && product.variants.length > 0 && (
            <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm p-1.5 rounded-lg">
              <span className="text-[10px] text-slate-300 mr-1 self-center">Sizes:</span>
              {product.variants.slice(0, 5).map((v) => (
                <span
                  key={v.id}
                  className="text-[10px] bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded"
                >
                  {v.size}
                </span>
              ))}
              {product.variants.length > 5 && (
                <span className="text-[10px] text-white self-center">+{product.variants.length - 5}</span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {product.category && (
            <span className="text-[11px] font-semibold tracking-wider text-brand-blue uppercase">
              {product.category.name}
            </span>
          )}

          <Link to={`/products/${product.slug}`} className="block mt-1">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-blue transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Pricing */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base font-extrabold text-slate-900">
              {formatINR(sellingPrice)}
            </span>
            {mrp > sellingPrice && (
              <span className="text-xs text-slate-400 line-through">
                {formatINR(mrp)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0">
        <button
          onClick={handleQuickAdd}
          disabled={!primaryVariant || primaryVariant.stock <= 0}
          className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-brand-blue text-slate-700 hover:text-white border border-slate-200 hover:border-transparent text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{primaryVariant && primaryVariant.stock > 0 ? "Quick Add" : "Out of Stock"}</span>
        </button>
      </div>
    </div>
  );
};
