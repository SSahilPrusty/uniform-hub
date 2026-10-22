import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  CheckCircle,
  Building,
  Package,
  ArrowLeft,
  RefreshCw,
  Edit2,
} from "lucide-react";
import { api } from "../services/api";

export const SuperAdminImagesPage: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSchool, setFilterSchool] = useState("");

  // Upload Form Modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const [targetProductId, setTargetProductId] = useState("");
  const [targetSchoolId, setTargetSchoolId] = useState("");
  const [altText, setAltText] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [sortOrder, setSortOrder] = useState("0");
  const [isUploading, setIsUploading] = useState(false);

  // Edit Modal
  const [editingImage, setEditingImage] = useState<any>(null);

  useEffect(() => {
    loadMetadata();
    loadImages();
  }, [filterCategory, filterSchool]);

  const loadMetadata = async () => {
    try {
      const [prodRes, schoolRes, catRes] = await Promise.all([
        api.get("/products?limit=100"),
        api.get("/schools"),
        api.get("/products/categories"),
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (schoolRes.data.success) setSchools(schoolRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  };

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set("categoryId", filterCategory);
      if (filterSchool) params.set("schoolId", filterSchool);
      if (search) params.set("search", search);

      const res = await api.get(`/super-admin/product-images?${params.toString()}`);
      if (res.data.success) {
        setImages(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !targetProductId) {
      alert("Please select both an image file and a target uniform product.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("productId", targetProductId);
      if (targetSchoolId) formData.append("schoolId", targetSchoolId);
      formData.append("altText", altText);
      formData.append("isPrimary", String(isPrimary));
      formData.append("sortOrder", sortOrder);

      const res = await api.post("/super-admin/product-images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        alert("Product image uploaded and assigned in database successfully!");
        setUploadModalOpen(false);
        setSelectedFile(null);
        setUploadPreview("");
        setAltText("");
        setIsPrimary(false);
        loadImages();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetPrimary = async (img: any) => {
    try {
      await api.put(`/super-admin/product-images/${img.id}`, { isPrimary: true });
      loadImages();
    } catch (err: any) {
      alert("Failed to update primary image: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently remove this product image from the database and storage?")) {
      try {
        await api.delete(`/super-admin/product-images/${id}`);
        loadImages();
      } catch (err: any) {
        alert("Failed to delete image: " + err.message);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingImage) return;
    try {
      await api.put(`/super-admin/product-images/${editingImage.id}`, {
        altText: editingImage.altText,
        productId: editingImage.productId,
        schoolId: editingImage.schoolId || null,
        isPrimary: editingImage.isPrimary,
        sortOrder: editingImage.sortOrder,
      });
      setEditingImage(null);
      loadImages();
    } catch (err: any) {
      alert("Failed to update image details: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/super-admin/dashboard" className="text-slate-400 hover:text-slate-600">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
              Mandatory Master Control
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-serif mt-1">
            Product Images & Media Database Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload genuine photography, assign images to school catalogs, reorder galleries, and set primary thumbnails.
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="px-4 py-2.5 bg-brand-blue hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all self-start md:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload & Assign Product Image</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
        <div className="sm:col-span-5 relative">
          <input
            type="text"
            placeholder="Search by product title or alternative text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="sm:col-span-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Uniform Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={filterSchool}
            onChange={(e) => setFilterSchool(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Partner Schools</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-1">
          <button
            onClick={loadImages}
            className="w-full h-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Images Grid */}
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" /></div>
      ) : images.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-3">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <p>No product images found matching the filter criteria.</p>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 bg-brand-blue text-white rounded-xl font-bold"
          >
            Upload First Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((img) => (
            <div
              key={img.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Image Preview & Badges */}
                <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
                  <img src={img.url} alt={img.altText || ""} className="w-full h-full object-cover" />

                  {img.isPrimary && (
                    <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-white" /> Primary Image
                    </span>
                  )}

                  <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded">
                    Sort: {img.sortOrder}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 space-y-1.5 text-xs">
                  <h4 className="font-bold text-slate-900 truncate" title={img.product?.name}>
                    {img.product?.name || "Unassigned"}
                  </h4>

                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{img.school?.name || "General Marketplace"}</span>
                  </p>

                  <p className="text-[11px] text-slate-400 italic truncate" title={img.altText}>
                    Alt: "{img.altText || "No description provided"}"
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                {!img.isPrimary ? (
                  <button
                    onClick={() => handleSetPrimary(img)}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <Star className="w-3.5 h-3.5" /> Set Primary
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">Default Thumbnail</span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingImage({ ...img })}
                    className="p-1.5 text-slate-600 hover:text-brand-blue rounded-lg hover:bg-slate-200 transition-colors"
                    title="Edit Metadata & Reassign"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(img.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Image Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <h3 className="font-bold text-slate-900 text-base">Upload & Assign Product Photography</h3>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              {/* File input */}
              <div>
                <label className="font-bold block mb-1">Select Image File (JPG, PNG, WEBP) *</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleFileChange}
                  className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-brand-blue hover:file:bg-blue-100"
                />
              </div>

              {uploadPreview && (
                <div className="w-32 h-40 rounded-xl overflow-hidden border border-slate-200 mx-auto">
                  <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Product Target */}
              <div>
                <label className="font-bold block mb-1">Assign to Uniform Product *</label>
                <select
                  required
                  value={targetProductId}
                  onChange={(e) => setTargetProductId(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white font-medium"
                >
                  <option value="">Select Target Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.school ? p.school.name : "Marketplace"})
                    </option>
                  ))}
                </select>
              </div>

              {/* School Target */}
              <div>
                <label className="font-bold block mb-1">Assign to Specific School Catalog (Optional)</label>
                <select
                  value={targetSchoolId}
                  onChange={(e) => setTargetSchoolId(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white font-medium"
                >
                  <option value="">Automatic (Inherit from Product)</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Alternative Text (SEO / Accessibility)</label>
                <input
                  type="text"
                  placeholder="e.g. Oxford Classic White Shirt Front Collar View"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full p-2 border rounded-xl text-center font-bold"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                      className="rounded text-brand-blue"
                    />
                    <span>Set as Primary Thumbnail</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-2.5 bg-brand-blue text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Save Image Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-base">Edit Image Metadata & Assignment</h3>

            <div className="w-24 h-32 rounded-xl overflow-hidden border border-slate-200 mx-auto">
              <img src={editingImage.url} alt="" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Assigned Uniform Product</label>
                <select
                  value={editingImage.productId}
                  onChange={(e) => setEditingImage({ ...editingImage, productId: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">School Association</label>
                <select
                  value={editingImage.schoolId || ""}
                  onChange={(e) => setEditingImage({ ...editingImage, schoolId: e.target.value || null })}
                  className="w-full p-2.5 border rounded-xl bg-white"
                >
                  <option value="">General Marketplace</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Alternative Text</label>
                <input
                  type="text"
                  value={editingImage.altText || ""}
                  onChange={(e) => setEditingImage({ ...editingImage, altText: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={editingImage.sortOrder}
                    onChange={(e) => setEditingImage({ ...editingImage, sortOrder: parseInt(e.target.value, 10) })}
                    className="w-full p-2 border rounded-xl text-center font-bold"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={editingImage.isPrimary}
                      onChange={(e) => setEditingImage({ ...editingImage, isPrimary: e.target.checked })}
                      className="rounded text-brand-blue"
                    />
                    <span>Primary Thumbnail</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingImage(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 py-2.5 bg-brand-blue text-white font-bold rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
