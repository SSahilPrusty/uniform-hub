import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Mail, Phone, MapPin, ShieldCheck, Truck, RefreshCw } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-navy text-slate-300 pt-12 pb-8 border-t border-slate-800">
      {/* Brand Value Pillars */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 border-b border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div className="p-3 bg-brand-blue/20 text-brand-blue-light rounded-lg">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Official School Verification</h4>
              <p className="text-xs text-slate-400">100% genuine school patterns, fabrics, and approved badges</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-lg">
              <Truck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Pan-India Direct Delivery</h4>
              <p className="text-xs text-slate-400">Fast shipping with doorstep delivery and real-time tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <RefreshCw className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Hassle-Free Size Exchanges</h4>
              <p className="text-xs text-slate-400">Easy replacement policy and dedicated tailor alteration network</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Brand Information */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white font-serif">
              UNIFORM <span className="text-blue-400">HUB</span>
            </span>
          </div>

          <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
            Uniform Hub is India's premier multi-vendor school uniform marketplace. We connect parents, students, schools, authorized franchises, and master tailors for a seamless, official uniform shopping experience.
          </p>

          <div className="space-y-2 text-xs text-slate-400 pt-2">
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>National Operations Hub, Central Business District, New Delhi - 110001</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>Toll Free Support: 1800-123-UHUB (+91 11 4911 5500)</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>care@uniformhub.in</span>
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h5 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Shop Uniforms</h5>
          <ul className="space-y-2 text-xs">
            <li><Link to="/schools" className="hover:text-white transition-colors">School Directory</Link></li>
            <li><Link to="/products?category=school-uniforms" className="hover:text-white transition-colors">Official School Uniforms</Link></li>
            <li><Link to="/products?category=shirts" className="hover:text-white transition-colors">Formal Shirts & Tops</Link></li>
            <li><Link to="/products?category=trousers" className="hover:text-white transition-colors">Trousers & Shorts</Link></li>
            <li><Link to="/products?category=skirts" className="hover:text-white transition-colors">Pleated Skirts & Tunics</Link></li>
            <li><Link to="/products?category=blazers" className="hover:text-white transition-colors">Winter Blazers & Sweaters</Link></li>
            <li><Link to="/products?category=shoes" className="hover:text-white transition-colors">School Shoes & PT Canvas</Link></li>
          </ul>
        </div>

        {/* Portals */}
        <div>
          <h5 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Stakeholder Portals</h5>
          <ul className="space-y-2 text-xs">
            <li><Link to="/login" className="hover:text-white transition-colors">Customer Portal</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">School Administration Portal</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Franchise & Retailer Portal</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Tailor Alteration Partner Portal</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Uniform Hub Admin Desk</Link></li>
            <li><Link to="/super-admin/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">Super Admin Security Panel</Link></li>
          </ul>
        </div>

        {/* Customer Care & Policies */}
        <div>
          <h5 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Customer Care & Policies</h5>
          <ul className="space-y-2 text-xs">
            <li><Link to="/orders/track" className="hover:text-white transition-colors text-blue-400 font-medium">Track Your Order</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">About Uniform Hub</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
            <li><Link to="/returns" className="hover:text-white transition-colors">Return & Refund Policy</Link></li>
          </ul>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>© 2026 UNIFORM HUB. All rights reserved. "Your School. Your Uniform. One Hub."</p>
        <p className="text-[11px]">Designed & Engineered for School Uniform Excellence in India.</p>
      </div>
    </footer>
  );
};
