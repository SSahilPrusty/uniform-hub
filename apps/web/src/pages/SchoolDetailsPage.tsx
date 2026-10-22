import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { GraduationCap, MapPin, Phone, Mail, ShieldCheck, ArrowLeft, Filter } from "lucide-react";
import { api } from "../services/api";
import { ProductCard } from "../components/ProductCard";

export const SchoolDetailsPage: React.FC = () => {
  const { schoolSlug } = useParams<{ schoolSlug: string }>();
  const [school, setSchool] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (schoolSlug) {
      setIsLoading(true);
      api.get(`/schools/${schoolSlug}`).then((res) => {
        if (res.data.success) {
          setSchool(res.data.data);
        }
      }).finally(() => setIsLoading(false));
    }
  }, [schoolSlug]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-slate-800">School Not Found</h2>
        <Link to="/schools" className="text-brand-blue font-bold text-sm hover:underline">
          Return to School Directory
        </Link>
      </div>
    );
  }

  // Filter products by selected category
  const filteredProducts = selectedCategory
    ? school.products.filter((p: any) => p.category?.slug === selectedCategory)
    : school.products;

  // Extract unique categories for this school
  const schoolCategories: any[] = [];
  const seenCatIds = new Set();
  for (const p of school.products || []) {
    if (p.category && !seenCatIds.has(p.category.id)) {
      seenCatIds.add(p.category.id);
      schoolCategories.push(p.category);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back button */}
      <Link
        to="/schools"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-blue"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Schools</span>
      </Link>

      {/* School Hero Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center p-2 flex-shrink-0 shadow-sm">
            {school.logo ? (
              <img src={school.logo} alt={school.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <GraduationCap className="w-10 h-10 text-brand-blue" />
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-serif">
                {school.name}
              </h1>
              {school.isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" /> Official Uniform Partner
                </span>
              )}
            </div>

            <p className="flex items-center gap-1.5 text-xs text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{school.address}, {school.city}, {school.state} - {school.pincode}</span>
            </p>

            {school.code && (
              <p className="text-xs text-slate-500">
                School Affiliation Code: <span className="font-semibold text-slate-800">{school.code}</span>
              </p>
            )}

            {school.description && (
              <p className="text-xs text-slate-600 max-w-2xl pt-1 leading-relaxed">
                {school.description}
              </p>
            )}
          </div>
        </div>

        {/* Contact info pill */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5 self-stretch md:self-auto min-w-[220px]">
          <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">Institution Contact</span>
          {school.contactPhone && (
            <p className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-brand-blue" />
              <span>{school.contactPhone}</span>
            </p>
          )}
          {school.contactEmail && (
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-brand-blue" />
              <span className="truncate">{school.contactEmail}</span>
            </p>
          )}
        </div>
      </div>

      {/* Category Pills Filter */}
      {schoolCategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          <span className="font-bold text-slate-700 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              selectedCategory === ""
                ? "bg-brand-blue text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All Approved Items ({school.products?.length || 0})
          </button>
          {schoolCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                selectedCategory === cat.slug
                  ? "bg-brand-blue text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Approved Products Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 font-serif">
          Official Approved Uniform Products ({filteredProducts.length})
        </h2>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
            No uniforms currently available under this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
