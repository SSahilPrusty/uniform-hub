import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, User, Mail, Lock, Phone } from "lucide-react";
import { useAuth } from "../stores/authContext";

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "CUSTOMER",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    const res = await register(formData);
    setIsLoading(false);

    if (res.success) {
      navigate("/");
    } else {
      setErrorMsg(res.error || "Failed to register.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-blue text-white flex items-center justify-center mx-auto shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-serif">Create Uniform Hub Account</h2>
          <p className="text-xs text-slate-500">Join India's official school uniform marketplace</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Account Type / Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
            >
              <option value="CUSTOMER">Customer / Parent</option>
              <option value="SCHOOL_ADMIN">School Representative</option>
              <option value="FRANCHISE_ADMIN">Franchise Uniform Supplier</option>
              <option value="TAILOR">Alteration & Tailoring Partner</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Rahul Verma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="name@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Mobile Number</label>
            <div className="relative">
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Password *</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-8 pr-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Confirm *</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-8 pr-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          {formData.role === "TAILOR" && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Tailor Partner Application Details
              </div>
              <p className="text-[10px] text-amber-700 leading-relaxed">
                New tailor registrations are submitted for Operational Admin review. Once approved, you will be eligible for customer order assignments.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Shop / Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Master Stitchers"
                  value={(formData as any).shopName || ""}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value } as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Specialization</label>
                  <input
                    type="text"
                    placeholder="Blazers, Trousers, Shirts"
                    value={(formData as any).specializations || ""}
                    onChange={(e) => setFormData({ ...formData, specializations: e.target.value } as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Experience / Skills</label>
                  <input
                    type="text"
                    placeholder="e.g. 10 years bespoke fitting"
                    value={(formData as any).experience || ""}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value } as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Workshop Address & City</label>
                <input
                  type="text"
                  placeholder="e.g. 24 Commercial St, Bengaluru"
                  value={(formData as any).address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value } as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-brand-blue hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? "Creating Account..." : "Register Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Already have an account? </span>
          <Link to="/login" className="text-brand-blue font-bold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
