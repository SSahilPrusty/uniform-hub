import React, { useState } from "react";
import { X, Ruler, CheckCircle } from "lucide-react";

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName?: string;
}

export const SizeChartModal: React.FC<SizeChartModalProps> = ({ isOpen, onClose, categoryName = "Uniform" }) => {
  const [unit, setUnit] = useState<"inches" | "cm">("inches");

  if (!isOpen) return null;

  const shirtData = [
    { size: "26", age: "5 - 6 Yrs", chestIn: 28, chestCm: 71, lengthIn: 18, lengthCm: 46, shoulderIn: 11.5, shoulderCm: 29 },
    { size: "28", age: "7 - 8 Yrs", chestIn: 30, chestCm: 76, lengthIn: 20, lengthCm: 51, shoulderIn: 12.5, shoulderCm: 32 },
    { size: "30", age: "9 - 10 Yrs", chestIn: 32, chestCm: 81, lengthIn: 22, lengthCm: 56, shoulderIn: 13.5, shoulderCm: 34 },
    { size: "32", age: "11 - 12 Yrs", chestIn: 34, chestCm: 86, lengthIn: 24, lengthCm: 61, shoulderIn: 14.5, shoulderCm: 37 },
    { size: "34", age: "13 - 14 Yrs", chestIn: 36, chestCm: 91, lengthIn: 26, lengthCm: 66, shoulderIn: 15.5, shoulderCm: 39 },
    { size: "36", age: "15 - 16 Yrs", chestIn: 38, chestCm: 97, lengthIn: 27, lengthCm: 69, shoulderIn: 16.5, shoulderCm: 42 },
    { size: "38", age: "17+ Yrs / Adult", chestIn: 40, chestCm: 102, lengthIn: 28, lengthCm: 71, shoulderIn: 17.5, shoulderCm: 44 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-brand-blue rounded-lg">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Standard School Uniform Size Guide</h3>
              <p className="text-xs text-slate-500">Measuring standard for Indian CBSE, ICSE & State Boards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Unit Toggle */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-700">Display measurements in:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setUnit("inches")}
                className={`px-3 py-1 rounded-md font-bold transition-colors ${
                  unit === "inches" ? "bg-brand-blue text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Inches (")
              </button>
              <button
                onClick={() => setUnit("cm")}
                className={`px-3 py-1 rounded-md font-bold transition-colors ${
                  unit === "cm" ? "bg-brand-blue text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>

          {/* Size Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Garment Size</th>
                  <th className="py-2.5 px-3">Typical Class/Age</th>
                  <th className="py-2.5 px-3">Chest ({unit === "inches" ? "in" : "cm"})</th>
                  <th className="py-2.5 px-3">Length ({unit === "inches" ? "in" : "cm"})</th>
                  <th className="py-2.5 px-3">Shoulder ({unit === "inches" ? "in" : "cm"})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {shirtData.map((row) => (
                  <tr key={row.size} className="hover:bg-blue-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-brand-blue">{row.size}</td>
                    <td className="py-2.5 px-3 text-slate-500">{row.age}</td>
                    <td className="py-2.5 px-3">{unit === "inches" ? `${row.chestIn}"` : `${row.chestCm} cm`}</td>
                    <td className="py-2.5 px-3">{unit === "inches" ? `${row.lengthIn}"` : `${row.lengthCm} cm`}</td>
                    <td className="py-2.5 px-3">{unit === "inches" ? `${row.shoulderIn}"` : `${row.shoulderCm} cm`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Measuring Guidelines */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 text-xs space-y-2">
            <h5 className="font-bold text-amber-900 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-amber-600" />
              Helpful Fitting Tips for School Uniforms:
            </h5>
            <ul className="list-disc list-inside text-amber-900/80 space-y-1">
              <li><strong>Growth Allowance:</strong> Growing children typically increase one uniform size every 8 to 12 months. We recommend picking 1 size larger if your child is near the upper bound.</li>
              <li><strong>Chest Measurement:</strong> Measure around the fullest part of the chest with a measuring tape kept level under the arms.</li>
              <li><strong>Free Alterations:</strong> Authorized Tailor Alteration service is available at checkout for custom hem & sleeve adjustments.</li>
            </ul>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-sm"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
