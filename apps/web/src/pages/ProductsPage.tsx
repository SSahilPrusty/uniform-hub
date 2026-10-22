import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, X, SlidersHorizontal, Search, RefreshCw } from "lucide-react";
import { api } from "../services/api";
import { ProductCard } from "../components/ProductCard";

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter states
  const search = searchParams.get("search") || "";
  const selectedCategory = searchParams.get("category") || "";
  const selectedSchool = searchParams.get("school") || "";
  const selectedGender = searchParams.get("gender") || "";
  const selectedSize = searchParams.get("size") || "";
  const sort = searchParams.get("sort") || "newest";

  useEffect(() => {
    // Load filter options
    api.get("/products/categories").then((res) => setCategories(res.data.data)).catch(() => {});
    api.get("/schools").then((res) => setSchools(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      const res = await api.get(`/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(search || selectedCategory || selectedSchool || selectedGender || selectedSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Title & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
            School Uniforms & Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing {products.length} products
          </p>
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-700"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Sort:</span>
            <select
              value={sort}
              onChange={(e) => updateFilter("sort", e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Filter + Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-6">
        {/* Sidebar Filters Desktop */}
        <aside className="hidden lg:block space-y-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-brand-blue" /> Filter Products
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] font-bold text-red-600 hover:underline"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Keyword Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search uniform..."
                value={search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* School Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">School Affiliation</label>
            <select
              value={selectedSchool}
              onChange={(e) => updateFilter("school", e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-700 focus:outline-none"
            >
              <option value="">All Schools & General Marketplace</option>
              <option value="general">Standard Marketplace (No School)</option>
              {schools.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => updateFilter("category", e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-700 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Gender</label>
            <div className="grid grid-cols-3 gap-1">
              {["BOYS", "GIRLS", "UNISEX"].map((g) => (
                <button
                  key={g}
                  onClick={() => updateFilter("gender", selectedGender === g ? "" : g)}
                  className={`py-1.5 text-[11px] font-bold rounded-lg border transition-colors ${
                    selectedGender === g
                      ? "bg-brand-blue text-white border-transparent"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Size Pills */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Size</label>
            <div className="flex flex-wrap gap-1.5">
              {["24", "26", "28", "30", "32", "34", "36", "38", "S", "M", "L"].map((sz) => (
                <button
                  key={sz}
                  onClick={() => updateFilter("size", selectedSize === sz ? "" : sz)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-colors ${
                    selectedSize === sz
                      ? "bg-amber-500 text-white border-transparent"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No uniforms matched your search</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing selected filters or searching for another school name or garment category.
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
