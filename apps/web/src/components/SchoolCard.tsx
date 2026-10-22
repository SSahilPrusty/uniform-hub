import React from "react";
import { Link } from "react-router-dom";
import { MapPin, ShieldCheck, ArrowRight, GraduationCap } from "lucide-react";

export interface SchoolCardProps {
  school: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    city: string;
    state: string;
    isVerified: boolean;
    _count?: { products: number };
  };
}

export const SchoolCard: React.FC<SchoolCardProps> = ({ school }) => {
  return (
    <div className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
            {school.logo ? (
              <img
                src={school.logo}
                alt={school.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <GraduationCap className="w-7 h-7 text-brand-blue" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-blue transition-colors line-clamp-1">
                {school.name}
              </h3>
              {school.isVerified && (
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              )}
            </div>

            <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{school.city}, {school.state}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="bg-blue-50 text-brand-blue px-2 py-0.5 rounded-full font-bold">
            {school._count?.products || 0} Official Uniforms
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Verified Catalog
          </span>
        </div>
      </div>

      <div className="mt-4">
        <Link
          to={`/schools/${school.slug}`}
          className="w-full py-2 px-3 rounded-xl bg-slate-50 group-hover:bg-brand-blue text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-transparent text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
        >
          <span>View Uniform Catalog</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
