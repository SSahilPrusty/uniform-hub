import React from "react";
import { GraduationCap, ShieldCheck, Truck, Users, Award, Heart } from "lucide-react";

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="w-14 h-14 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <GraduationCap className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">Our Mission & Story</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-serif leading-tight">
          Transforming School Uniform Shopping Across India
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          "Your School. Your Uniform. One Hub." — Born out of the frustration every parent faces during school reopening season.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-6 text-slate-700 leading-relaxed text-sm">
        <h2 className="text-xl font-bold text-slate-900 font-serif">The Problem We Solved</h2>
        <p>
          Every academic year, millions of Indian parents stand in serpentine queues outside single monopolized retail counters, often returning empty-handed due to missing sizes, inconsistent color shades, or substandard fabrics.
        </p>
        <p>
          <strong>Uniform Hub</strong> was engineered as an open, transparent, and multi-vendor ecosystem. We partner directly with schools to codify their exact design patterns, Pantone color codes, and fabric specifications, then authorize verified franchises and master tailors to fulfill orders online with guaranteed doorstep delivery.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
            <ShieldCheck className="w-6 h-6 text-brand-blue" />
            <h3 className="font-bold text-slate-900 text-sm">100% School Compliance</h3>
            <p className="text-xs text-slate-600">Every design is formally verified and sanctioned by institution heads.</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
            <Award className="w-6 h-6 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">Industrial Grade Fabrics</h3>
            <p className="text-xs text-slate-600">Poly-viscose and combed cotton crafted for active playground wear.</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
            <Heart className="w-6 h-6 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Supporting Local Tailors</h3>
            <p className="text-xs text-slate-600">Directly integrating master tailors into the digital economy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
