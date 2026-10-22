import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Search,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Users,
  Award,
  ChevronRight,
  Scissors,
} from "lucide-react";
import { api } from "../services/api";
import { ProductCard } from "../components/ProductCard";
import { SchoolCard } from "../components/SchoolCard";

export const HomePage: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [schoolSearch, setSchoolSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Load initial home data
    api.get("/schools?limit=4").then((res) => setSchools(res.data.data.slice(0, 4))).catch(() => {});
    api.get("/products?featured=true&limit=8").then((res) => setFeaturedProducts(res.data.data)).catch(() => {});
    api.get("/products/categories").then((res) => setCategories(res.data.data.slice(0, 8))).catch(() => {});
  }, []);

  const handleSchoolSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (schoolSearch.trim()) {
      navigate(`/schools?search=${encodeURIComponent(schoolSearch.trim())}`);
    } else {
      navigate("/schools");
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-navy via-slate-900 to-blue-950 text-white py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
        {/* Subtle Decorative Background Circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-blue/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-400 text-xs font-semibold shadow-inner">
              <Sparkles className="w-4 h-4" />
              <span>India's Trusted School Uniform Marketplace</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight font-serif">
              Find the Right Uniform for <span className="text-blue-400">Every School Day.</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Discover official school-specific uniforms, everyday essentials, bespoke tailor alterations, and authorized suppliers—all in one hub.
            </p>

            {/* School Search Box in Hero */}
            <form
              onSubmit={handleSchoolSearchSubmit}
              className="bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl max-w-xl mx-auto lg:mx-0 border border-white/20 flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Enter School Name or City (e.g. DPS, St. Xavier's, Delhi)..."
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-slate-900 text-xs sm:text-sm rounded-xl focus:outline-none placeholder-slate-400 bg-transparent font-medium"
                />
              </div>
              <button
                type="submit"
                className="py-3 px-6 bg-brand-blue hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                <span>Find Your School</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick stats pills */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% School Approved
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-400" /> Pan-India Fast Delivery
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-blue-400" /> Custom Tailoring Available
              </span>
            </div>
          </div>

          {/* Hero Right Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-gradient-to-tr from-white/10 to-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-white/20 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=700&q=80"
                alt="Students in School Uniform"
                className="w-full h-72 sm:h-80 object-cover rounded-2xl shadow-lg"
              />

              {/* Floating verified badge */}
              <div className="absolute -bottom-4 -left-4 bg-white text-slate-900 p-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-bold">Official School Patterns</h4>
                  <p className="text-[11px] text-slate-500">Fabric & Color-Tone Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 font-serif">Uniform Categories</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Explore by garment type and everyday educational essentials</p>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-brand-blue hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group bg-white p-4 rounded-2xl border border-slate-200 text-center hover:border-brand-blue hover:shadow-lg transition-all flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-brand-blue group-hover:text-white text-brand-blue flex items-center justify-center transition-colors">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-brand-blue transition-colors line-clamp-1">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Partner Schools Discovery Section */}
      <section className="bg-slate-100/70 py-12 px-4 sm:px-6 border-y border-slate-200">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">Official Partnerships</span>
              <h2 className="text-2xl font-extrabold text-slate-900 font-serif mt-0.5">Featured Partner Schools</h2>
              <p className="text-xs sm:text-sm text-slate-500">Find official approved uniforms specifically approved by your institution</p>
            </div>
            <Link
              to="/schools"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors shadow-sm self-start"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Browse All Schools</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {schools.map((school) => (
              <SchoolCard key={school.id} school={school} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 font-serif">Popular Uniform Essentials</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">High-durability, wrinkle-resistant fabrics made for Indian academic days</p>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-brand-blue hover:text-blue-800 flex items-center gap-1"
          >
            <span>Explore Catalog</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* How Uniform Hub Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center space-y-10">
          <div className="max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">Simple 3-Step Process</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
              How Uniform Hub Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              No more running between crowded uniform stores during school reopening rush.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-14 h-14 bg-blue-50 text-brand-blue font-extrabold text-xl rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Find Your School</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Select your school by name, city, or board to unlock its official, approved uniform patterns.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 font-extrabold text-xl rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Select Sizes or Bespoke Fit</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pick standard sizes using our comprehensive Indian size charts or request tailor alterations.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 font-extrabold text-xl rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Direct Doorstep Delivery</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enjoy fast pan-India shipping with real-time tracking and hassle-free size replacement guarantees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stakeholder Benefits Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-900 to-brand-navy text-white p-6 rounded-2xl space-y-3">
            <Users className="w-8 h-8 text-blue-400" />
            <h3 className="font-bold text-base">For Parents & Students</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Order official uniforms without stress. Guaranteed school compliance, durable poly-viscose and cotton fabrics, and home delivery.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl space-y-3">
            <Award className="w-8 h-8 text-amber-400" />
            <h3 className="font-bold text-base">For Schools & Principals</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Maintain uniform standardization. Manage official catalogs, approve authorized vendors, and eliminate counterfeit apparel.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-2xl space-y-3">
            <Scissors className="w-8 h-8 text-emerald-400" />
            <h3 className="font-bold text-base">For Retailers & Tailors</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Expand your reach beyond physical retail counters. Manage digital inventory, fulfill orders, and receive custom alteration jobs.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
