import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  ShieldCheck,
  Scissors,
  LogOut,
  Menu,
  X,
  FileCheck,
  Building,
  Image as ImageIcon,
  DollarSign,
  ClipboardList,
  Home,
  User,
} from "lucide-react";
import { useAuth } from "../stores/authContext";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const DashboardLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout, switchDemoUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const getNavItems = (): NavItem[] => {
    if (!user) return [];

    switch (user.role) {
      case "SUPER_ADMIN":
        return [
          { label: "Platform Overview", href: "/super-admin/dashboard", icon: LayoutDashboard },
          { label: "Product Images & Media", href: "/super-admin/product-images", icon: ImageIcon },
          { label: "User Governance", href: "/super-admin/dashboard?tab=users", icon: Users },
          { label: "Financial Settings", href: "/super-admin/dashboard?tab=financials", icon: DollarSign },
          { label: "System Audit Logs", href: "/super-admin/dashboard?tab=audit", icon: ClipboardList },
        ];
      case "ADMIN":
        return [
          { label: "Operations Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
          { label: "Approvals & Verifications", href: "/admin/dashboard?tab=approvals", icon: FileCheck },
          { label: "Schools Directory", href: "/admin/dashboard?tab=schools", icon: Building },
          { label: "Orders Fulfillment", href: "/admin/dashboard?tab=orders", icon: ShoppingCart },
          { label: "Customers", href: "/admin/dashboard?tab=customers", icon: Users },
        ];
      case "SCHOOL_ADMIN":
        return [
          { label: "School Dashboard", href: "/school/dashboard", icon: LayoutDashboard },
          { label: "Uniform Catalog", href: "/school/dashboard?tab=catalog", icon: Package },
          { label: "Submit New Uniform", href: "/school/dashboard?tab=submit", icon: FileCheck },
        ];
      case "FRANCHISE_ADMIN":
        return [
          { label: "Franchise Dashboard", href: "/franchise/dashboard", icon: LayoutDashboard },
          { label: "Inventory & Stock", href: "/franchise/dashboard?tab=inventory", icon: Package },
          { label: "Assigned Orders", href: "/franchise/dashboard?tab=orders", icon: ShoppingCart },
          { label: "Add Uniform Product", href: "/franchise/dashboard?tab=add-product", icon: FileCheck },
        ];
      case "TAILOR":
        return [
          { label: "Tailor Workbench", href: "/tailor/dashboard", icon: Scissors },
          { label: "Alteration Jobs", href: "/tailor/dashboard?tab=jobs", icon: ClipboardList },
        ];
      default: // CUSTOMER
        return [
          { label: "Customer Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
          { label: "My Orders & Tracking", href: "/customer/dashboard?tab=orders", icon: ShoppingCart },
          { label: "Custom Measurements", href: "/customer/dashboard?tab=measurements", icon: Scissors },
          { label: "Saved Addresses", href: "/customer/dashboard?tab=addresses", icon: Home },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-brand-navy text-slate-300 flex-col justify-between p-4 shadow-xl z-20">
        <div className="space-y-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 px-2">
            <div className="w-9 h-9 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-white font-serif">
                UNIFORM <span className="text-blue-400">HUB</span>
              </span>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold -mt-0.5">
                {user?.role.replace("_", " ")}
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname + location.search === item.href || location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-brand-blue text-white shadow-md"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Area & Quick Role Switcher */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          {/* Rapid Demo Switcher */}
          <div className="bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60">
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Demo Portal Switcher:
            </label>
            <select
              value={user?.role}
              onChange={(e) => {
                switchDemoUser(e.target.value);
                const roleRoutes: Record<string, string> = {
                  SUPER_ADMIN: "/super-admin/dashboard",
                  ADMIN: "/admin/dashboard",
                  SCHOOL_ADMIN: "/school/dashboard",
                  FRANCHISE_ADMIN: "/franchise/dashboard",
                  TAILOR: "/tailor/dashboard",
                  CUSTOMER: "/customer/dashboard",
                };
                navigate(roleRoutes[e.target.value]);
              }}
              className="w-full bg-slate-900 border border-slate-700 text-white text-[11px] font-semibold rounded-lg px-2 py-1.5 focus:outline-none"
            >
              <option value="CUSTOMER">Customer (Parent)</option>
              <option value="SCHOOL_ADMIN">School Admin (DPS)</option>
              <option value="FRANCHISE_ADMIN">Franchise (National Uniforms)</option>
              <option value="TAILOR">Tailor (Master Ramesh)</option>
              <option value="ADMIN">Admin Desk</option>
              <option value="SUPER_ADMIN">Super Admin Security</option>
            </select>
          </div>

          <div className="flex items-center justify-between px-2 pt-1">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <Link
            to="/"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Public Store</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-base font-bold text-slate-800">
              {navItems.find((n) => location.pathname === n.href)?.label || "Uniform Hub Portal"}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-brand-blue bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Visit Marketplace</span>
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-blue text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {user?.name.charAt(0)}
              </div>
              <span className="text-xs font-bold text-slate-800 hidden md:inline">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Modal */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileSidebarOpen(false)}>
            <div className="w-64 bg-brand-navy h-full p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between text-white pb-3 border-b border-slate-800">
                <span className="font-bold text-sm">Navigation</span>
                <button onClick={() => setMobileSidebarOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-lg"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Dynamic Body Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
