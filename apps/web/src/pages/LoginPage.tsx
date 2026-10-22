import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GraduationCap, Lock, Mail, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";
import { useAuth } from "../stores/authContext";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const redirectUrl = searchParams.get("redirect") || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      navigate(redirectUrl);
    } else {
      setErrorMsg(res.error || "Invalid email or password.");
    }
  };

  const handleQuickDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-blue text-white flex items-center justify-center mx-auto shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-serif">Sign In to Uniform Hub</h2>
          <p className="text-xs text-slate-500">Access your orders, school catalog, or partner portal</p>
        </div>

        {/* Demo Fast Login Pills */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
            <KeyRound className="w-3.5 h-3.5 text-brand-blue" />
            <span>1-Click Demo Accounts for Testing:</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-semibold">
            <button
              type="button"
              onClick={() => handleQuickDemoFill("parent.rahul@uniformhub.in", "Customer@123")}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-brand-blue text-slate-700 text-left transition-colors truncate"
            >
              👨‍👩‍👧 Customer / Parent
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill("dps.principal@uniformhub.in", "School@123")}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-brand-blue text-slate-700 text-left transition-colors truncate"
            >
              🏫 School Admin (DPS)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill("franchise.delhi@uniformhub.in", "Franchise@123")}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-brand-blue text-slate-700 text-left transition-colors truncate"
            >
              🏪 Franchise Retailer
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill("master.tailor@uniformhub.in", "Tailor@123")}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-brand-blue text-slate-700 text-left transition-colors truncate"
            >
              ✂ Tailor Partner
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill("admin@uniformhub.in", "Admin@123")}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-brand-blue text-slate-700 text-left transition-colors truncate"
            >
              🛡 Operations Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill("superadmin@uniformhub.in", "SuperAdmin@123")}
              className="p-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 font-bold text-left transition-colors truncate"
            >
              ⭐ Super Admin
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-brand-blue hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? "Signing in..." : "Sign In to Hub"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>New to Uniform Hub? </span>
          <Link to="/register" className="text-brand-blue font-bold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};
