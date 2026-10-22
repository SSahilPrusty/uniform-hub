import React from "react";

export const PrivacyPolicyPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
    <div className="border-b pb-4">
      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase">Editable Legal Draft</span>
      <h1 className="text-3xl font-extrabold text-slate-900 font-serif mt-2">Privacy Policy</h1>
      <p className="text-xs text-slate-500">Last Updated: October 2026 • Uniform Hub Marketplace</p>
    </div>
    <div className="prose text-xs text-slate-700 space-y-4 leading-relaxed bg-white p-8 rounded-3xl border border-slate-200">
      <p>UNIFORM HUB respects the privacy of students, parents, schools, and partners. This policy describes our collection, protection, and handling of user information.</p>
      <h3 className="font-bold text-slate-900 text-sm">1. Information We Collect</h3>
      <p>We collect student and parent names, contact numbers, delivery addresses, and custom student sizing measurements exclusively for uniform manufacturing and order fulfillment.</p>
      <h3 className="font-bold text-slate-900 text-sm">2. Protection of Student Measurements</h3>
      <p>Student body measurements are stored under strict role-based access control and are shared only with the specifically assigned alteration partner or tailor.</p>
      <h3 className="font-bold text-slate-900 text-sm">3. Payment Information</h3>
      <p>All online payments are processed through PCI-DSS compliant certified banking partners. Uniform Hub never stores sensitive raw credit card numbers or banking passwords.</p>
    </div>
  </div>
);

export const TermsPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
    <div className="border-b pb-4">
      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase">Editable Legal Draft</span>
      <h1 className="text-3xl font-extrabold text-slate-900 font-serif mt-2">Terms and Conditions</h1>
      <p className="text-xs text-slate-500">Uniform Hub Commercial Platform Terms</p>
    </div>
    <div className="prose text-xs text-slate-700 space-y-4 leading-relaxed bg-white p-8 rounded-3xl border border-slate-200">
      <p>By accessing or purchasing through Uniform Hub, you agree to these platform guidelines, verified school uniform standards, and purchase agreements.</p>
      <h3 className="font-bold text-slate-900 text-sm">1. Official School Uniform Authenticity</h3>
      <p>Uniform items tagged under specific schools strictly follow approved color shades, logos, and crest embroidery specifications provided by partnering educational boards.</p>
      <h3 className="font-bold text-slate-900 text-sm">2. Pricing & Currency</h3>
      <p>All prices are listed in Indian Rupees (INR) and are inclusive of standard apparel GST taxes unless explicitly noted.</p>
    </div>
  </div>
);

export const ShippingPolicyPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
    <div className="border-b pb-4">
      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase">Policy Information</span>
      <h1 className="text-3xl font-extrabold text-slate-900 font-serif mt-2">Shipping & Delivery Policy</h1>
      <p className="text-xs text-slate-500">Pan-India Express Logistics</p>
    </div>
    <div className="prose text-xs text-slate-700 space-y-4 leading-relaxed bg-white p-8 rounded-3xl border border-slate-200">
      <p>We deliver to over 19,000 pincodes across India via premier logistics couriers including Blue Dart, Delhivery, and India Post.</p>
      <ul className="list-disc list-inside space-y-1">
        <li><strong>Standard Shipping:</strong> ₹70 flat fee for orders under ₹1,499.</li>
        <li><strong>Free Shipping:</strong> Automatically applied to all uniform orders of ₹1,499 or more.</li>
        <li><strong>Dispatch Timelines:</strong> Standard uniform items ship within 24 to 48 hours. Custom tailored uniforms require 3-5 days for master craftsmanship.</li>
      </ul>
    </div>
  </div>
);

export const ReturnPolicyPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
    <div className="border-b pb-4">
      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase">Policy Information</span>
      <h1 className="text-3xl font-extrabold text-slate-900 font-serif mt-2">Return & Exchange Policy</h1>
      <p className="text-xs text-slate-500">Hassle-Free Size Guarantee</p>
    </div>
    <div className="prose text-xs text-slate-700 space-y-4 leading-relaxed bg-white p-8 rounded-3xl border border-slate-200">
      <p>We understand that school children grow quickly. If a uniform does not fit your child perfectly, you can request an easy exchange or return within <strong>7 days</strong> of delivery.</p>
      <ul className="list-disc list-inside space-y-1">
        <li>Garments must be unworn, unwashed, and with intact original brand tags.</li>
        <li>Doorstep reverse pickup is arranged directly by our authorized franchise network.</li>
        <li>Refunds are credited to the original payment source within 3-5 business days following return quality inspection.</li>
      </ul>
    </div>
  </div>
);
