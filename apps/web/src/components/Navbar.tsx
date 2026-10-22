import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  GraduationCap,
  Menu,
  X,
  Phone,
  ShieldCheck,
  ChevronDown,
  LogOut,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "../stores/authContext";
import { useCart } from "../stores/cartContext";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { itemsCount, setIsDrawerOpen } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getDashboardRoute = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "SUPER_ADMIN":
        return "/super-admin/dashboard";
      case "ADMIN":
        return "/admin/dashboard";
      case "SCHOOL_ADMIN":
        return "/school/dashboard";
      case "FRANCHISE_ADMIN":
        return "/franchise/dashboard";
      case "TAILOR":
        return "/tailor/dashboard";
      default:
        return "/customer/dashboard";
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      {/* Top Banner */}
      <div className="bg-brand-navy text-white text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1 font-medium text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% School-Approved Uniforms & Authorized Retailers
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-300">Free delivery on orders above ₹1,499</span>
          </div>

          <div className="flex items-center space-x-4 text-slate-300">
            <Link to="/orders/track" className="hover:text-white transition-colors">
              Track Order
            </Link>
            <span className="text-slate-500">•</span>
            <a href="tel:18001239876" className="flex items-center gap-1 hover:text-white transition-colors">
              <Phone className="w-3 h-3" /> 1800-123-UHUB
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold tracking-tight text-brand-navy font-serif">
              UNIFORM <span className="text-brand-blue">HUB</span>
            </span>
            <p className="text-[10px] tracking-wider text-slate-500 font-semibold uppercase -mt-1">
              Your School. Your Uniform. One Hub.
            </p>
          </div>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4 relative">
          <input
            type="text"
            placeholder="Search school name, shirts, blazers, skirts, shoes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-24 py-2 text-sm border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent bg-slate-50 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <button
            type="submit"
            className="absolute right-1 top-1 bottom-1 px-4 text-xs font-semibold bg-brand-blue hover:bg-blue-800 text-white rounded-full transition-colors"
          >
            Search
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Find Your School Button */}
          <Link
            to="/schools"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-brand-blue border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Find Your School</span>
          </Link>

          {/* Account Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-brand-blue">
                  {user.name.charAt(0)}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-500">Signed in as</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 uppercase">
                      {user.role.replace("_", " ")}
                    </span>
                  </div>

                  <Link
                    to={getDashboardRoute()}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-blue font-medium"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                    <span>My Portal Dashboard</span>
                  </Link>

                  {user.role === "CUSTOMER" && (
                    <Link
                      to="/customer/dashboard?tab=orders"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <ShoppingCart className="w-4 h-4 text-slate-400" />
                      <span>My Orders</span>
                    </Link>
                  )}

                  <button
                    onClick={logout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-brand-blue text-sm font-medium text-slate-700 hover:text-brand-blue transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}

          {/* Cart Icon */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="relative p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="View Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5 text-slate-800" />
            {itemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                {itemsCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Secondary Category Navigation Bar */}
      <div className="hidden md:block bg-slate-50 border-t border-slate-200 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center space-x-6 py-2 text-xs font-semibold text-slate-600 overflow-x-auto whitespace-nowrap">
          <Link to="/products" className="hover:text-brand-blue transition-colors">
            All Products
          </Link>
          <Link to="/schools" className="hover:text-brand-blue transition-colors text-brand-blue font-bold">
            🎒 Shop By School
          </Link>
          <Link to="/products?category=school-uniforms" className="hover:text-brand-blue transition-colors">
            School Uniforms
          </Link>
          <Link to="/products?category=shirts" className="hover:text-brand-blue transition-colors">
            Shirts
          </Link>
          <Link to="/products?category=trousers" className="hover:text-brand-blue transition-colors">
            Trousers
          </Link>
          <Link to="/products?category=skirts" className="hover:text-brand-blue transition-colors">
            Skirts
          </Link>
          <Link to="/products?category=blazers" className="hover:text-brand-blue transition-colors">
            Blazers
          </Link>
          <Link to="/products?category=sports-uniforms" className="hover:text-brand-blue transition-colors">
            Sports & PT
          </Link>
          <Link to="/products?category=shoes" className="hover:text-brand-blue transition-colors">
            Shoes & Socks
          </Link>
          <Link to="/products?category=school-bags" className="hover:text-brand-blue transition-colors">
            Bags & Accessories
          </Link>
          <Link to="/about" className="hover:text-brand-blue transition-colors ml-auto text-slate-500">
            About Us
          </Link>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 p-4 space-y-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search schools, shirts, shoes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link
              to="/schools"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg bg-blue-50 text-brand-blue font-semibold text-xs text-center border border-blue-200"
            >
              🎒 Find Your School
            </Link>
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg bg-slate-100 text-slate-800 font-semibold text-xs text-center border border-slate-200"
            >
              Browse All Products
            </Link>
          </div>

          <div className="border-t border-slate-100 pt-2 space-y-1 text-sm font-medium text-slate-700">
            <Link to="/products?category=school-uniforms" onClick={() => setMobileMenuOpen(false)} className="block py-1.5">
              School Uniforms
            </Link>
            <Link to="/products?category=shirts" onClick={() => setMobileMenuOpen(false)} className="block py-1.5">
              Shirts & Trousers
            </Link>
            <Link to="/products?category=blazers" onClick={() => setMobileMenuOpen(false)} className="block py-1.5">
              Blazers & Sweaters
            </Link>
            <Link to="/orders/track" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-blue-600 font-semibold">
              Track My Order
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
