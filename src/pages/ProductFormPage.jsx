import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft, Upload } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/api.js";
import { PageHeader, Spinner } from "../components/ui/index.jsx";

const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
      {label}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    description: "",
    category: "",
    brand: "",
    unit: "pcs",
    costPrice: "",
    sellingPrice: "",
    taxRate: "0",
    stock: "0",
    reorderLevel: "10",
    isActive: true,
  });

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  useEffect(() => {
    Promise.all([api.get("/categories"), api.get("/brands")]).then(([c, b]) => {
      setCategories(c.data.data);
      setBrands(b.data.data);
    });
    if (isEdit) {
      api
        .get(`/products/${id}`)
        .then((r) => {
          const p = r.data.data;
          setForm({
            name: p.name || "",
            sku: p.sku || "",
            barcode: p.barcode || "",
            description: p.description || "",
            category: p.category?._id || "",
            brand: p.brand?._id || "",
            unit: p.unit || "pcs",
            costPrice: p.costPrice || "",
            sellingPrice: p.sellingPrice || "",
            taxRate: p.taxRate || "0",
            stock: p.stock || "0",
            reorderLevel: p.reorderLevel || "10",
            isActive: p.isActive !== false,
          });
          if (p.image) setImagePreview(p.image);
        })
        .catch(() => toast.error("Failed to load product"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      let productId = id;
      if (isEdit) {
        const { data } = await api.put(`/products/${id}`, payload);
        productId = data.data._id;
        toast.success("Product updated!");
      } else {
        const { data } = await api.post("/products", payload);
        productId = data.data._id;
        toast.success("Product created!");
      }
      // Upload image if changed
      if (imageFile) {
        try {
          const fd = new FormData();
          fd.append("image", imageFile);
          await api.post(`/products/${productId}/upload`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          // Success toast for image specifically (optional, but good for feedback)
          toast.success("Image uploaded successfully!");
        } catch (uploadErr) {
          // NEW: Specific error for the image part
          console.error("Image upload error:", uploadErr);
          toast.error(
            "Product saved, but image upload failed. Check your Cloudinary keys!",
          );
        }
      }
      
      navigate("/products");
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Product" : "New Product"}
        subtitle={
          isEdit ? "Update product details" : "Add a new product to inventory"
        }
        actions={
          <button
            onClick={() => navigate("/products")}
            className="btn-secondary"
          >
            <ArrowLeft size={16} /> Back
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6 space-y-5">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Product Name *">
              <input
                name="name"
                value={form.name}
                onChange={set}
                required
                className="input"
                placeholder="e.g. iPhone 15 Pro"
              />
            </Field>
            <Field label="Unit">
              <select
                name="unit"
                value={form.unit}
                onChange={set}
                className="input"
              >
                {["pcs", "kg", "g", "l", "ml", "box", "pack", "dozen"].map(
                  (u) => (
                    <option key={u}>{u}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="SKU">
              <input
                name="sku"
                value={form.sku}
                onChange={set}
                className="input"
                placeholder="e.g. IPHN-15-PRO"
              />
            </Field>
            <Field label="Barcode">
              <input
                name="barcode"
                value={form.barcode}
                onChange={set}
                className="input"
                placeholder="e.g. 1234567890123"
              />
            </Field>
            <Field label="Category">
              <select
                name="category"
                value={form.category}
                onChange={set}
                className="input"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Brand">
              <select
                name="brand"
                value={form.brand}
                onChange={set}
                className="input"
              >
                <option value="">Select brand</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea
              name="description"
              value={form.description}
              onChange={set}
              rows={3}
              className="input resize-none"
              placeholder="Product description..."
            />
          </Field>
        </div>

        {/* Pricing */}
        <div className="card p-6 space-y-5">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Pricing & Tax
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Field label="Cost Price *">
              <input
                name="costPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.costPrice}
                onChange={set}
                required
                className="input"
                placeholder="0.00"
              />
            </Field>
            <Field label="Selling Price *">
              <input
                name="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.sellingPrice}
                onChange={set}
                required
                className="input"
                placeholder="0.00"
              />
            </Field>
            <Field label="Tax Rate (%)">
              <input
                name="taxRate"
                type="number"
                min="0"
                max="100"
                value={form.taxRate}
                onChange={set}
                className="input"
                placeholder="0"
              />
            </Field>
          </div>
        </div>

        {/* Stock */}
        <div className="card p-6 space-y-5">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Stock Management
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Opening Stock">
              <input
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={set}
                className="input"
              />
            </Field>
            <Field label="Reorder Level">
              <input
                name="reorderLevel"
                type="number"
                min="0"
                value={form.reorderLevel}
                onChange={set}
                className="input"
              />
            </Field>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={set}
              className="w-4 h-4 rounded text-brand-600"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Active (visible in POS)
            </span>
          </label>
        </div>

        {/* Image */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
            Product Image
          </h3>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Upload size={28} />
                </div>
              )}
            </div>
            <label className="btn-secondary cursor-pointer">
              <Upload size={16} /> Choose Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary px-8">
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save size={16} /> {isEdit ? "Update" : "Create"} Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
