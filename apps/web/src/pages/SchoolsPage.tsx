import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, MapPin, Building, PlusCircle, CheckCircle, X } from "lucide-react";
import { api } from "../services/api";
import { SchoolCard } from "../components/SchoolCard";
import { INDIAN_STATES } from "@uniform-hub/shared";

export const SchoolsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  // Request form state
  const [formData, setFormData] = useState({
    schoolName: "",
    city: "",
    state: "Delhi",
    requesterName: "",
    requesterRole: "Parent",
    requesterEmail: "",
    requesterPhone: "",
    uniformDescription: "",
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const search = searchParams.get("search") || "";
  const selectedState = searchParams.get("state") || "";
  const selectedCity = searchParams.get("city") || "";

  useEffect(() => {
    fetchSchools();
  }, [searchParams]);

  const fetchSchools = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      const res = await api.get(`/schools?${params.toString()}`);
      if (res.data.success) {
        setSchools(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load schools:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    try {
      const res = await api.post("/schools/requests", formData);
      if (res.data.success) {
        setSubmitSuccess(true);
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || "Failed to submit request.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Directory Header Banner */}
      <div className="bg-gradient-to-r from-brand-navy to-blue-950 text-white p-8 rounded-3xl shadow-xl space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Official Directories</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-serif">
          Find Your School & Approved Uniforms
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Select your institution to access authorized uniform patterns, house color sports kits, and approved accessories.
        </p>

        {/* Filter Controls Bar */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-12 gap-3 max-w-4xl">
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              placeholder="Search by school name, city, or board..."
              value={search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedState}
              onChange={(e) => updateFilter("state", e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none"
            >
              <option value="">All States</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <button
              onClick={() => setRequestModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Request School</span>
            </button>
          </div>
        </div>
      </div>

      {/* Schools Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : schools.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mx-auto">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">School Not Listed Yet?</h3>
          <p className="text-xs text-slate-500">
            We are constantly onboarding CBSE, ICSE, and state schools across India. Tell us your school and we will coordinate uniform approvals.
          </p>
          <button
            onClick={() => setRequestModalOpen(true)}
            className="px-5 py-2.5 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors shadow-md"
          >
            Submit Request to Add School
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school) => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </div>
      )}

      {/* Request Unlisted School Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Request Your School Onboarding</h3>
              <button
                onClick={() => { setRequestModalOpen(false); setSubmitSuccess(false); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="font-bold text-slate-900 text-sm">Request Submitted!</h4>
                <p className="text-xs text-slate-600">
                  Our catalog team will verify with the school administration and authorize approved uniform partners.
                </p>
                <button
                  onClick={() => { setRequestModalOpen(false); setSubmitSuccess(false); }}
                  className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-xl mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-3 text-xs">
                {submitError && (
                  <p className="text-red-600 font-semibold bg-red-50 p-2 rounded-lg">{submitError}</p>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">School Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Army Public School, Dhaula Kuan"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. New Delhi"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">State *</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none bg-white"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sunita Rao"
                      value={formData.requesterName}
                      onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Role *</label>
                    <select
                      value={formData.requesterRole}
                      onChange={(e) => setFormData({ ...formData, requesterRole: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none bg-white"
                    >
                      <option value="Parent">Parent</option>
                      <option value="Student">Student</option>
                      <option value="School Principal / Admin">School Principal / Admin</option>
                      <option value="Uniform Retailer">Uniform Retailer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@email.com"
                      value={formData.requesterEmail}
                      onChange={(e) => setFormData({ ...formData, requesterEmail: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      value={formData.requesterPhone}
                      onChange={(e) => setFormData({ ...formData, requesterPhone: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Uniform Colors & Details *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe shirts, skirts/pants, blazers, house t-shirts, badge colors..."
                    value={formData.uniformDescription}
                    onChange={(e) => setFormData({ ...formData, uniformDescription: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-brand-blue hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-colors"
                  >
                    Submit School Onboarding Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
