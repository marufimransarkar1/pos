import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Printer,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import toast from "react-hot-toast";
import api from "../lib/api.js";
import {
  PageHeader,
  Table,
  Pagination,
  SearchInput,
  ConfirmDialog,
} from "../components/ui/index.jsx";
import { useSettingsStore } from "../store/index.js";
import ProductPriceTag from "../components/ProductPriceTag.jsx";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [printJob, setPrintJob] = useState(null); // { product, quantity }
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [printProductData, setPrintProductData] = useState(null);
  const [printQuantity, setPrintQuantity] = useState(1);
  const printRef = useRef();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const sym = settings?.currencySymbol || "$";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/products?page=${page}&search=${search}&limit=15`,
      );
      setProducts(data.data);
      setPages(data.pages);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    // Inject print styles into document head
    const style = document.createElement("style");
    style.textContent = `
    @media print {
      @page {
        margin: 0.3in;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
  `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${deleteId}`);
      toast.success("Product deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
    setDeleteId(null);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `PriceTag-${printJob?.product?.name || "product"}`,
    onAfterPrint: () => setPrintJob(null),
  });

  // Trigger print when a print job is set
  useEffect(() => {
    if (printJob) {
      handlePrint();
    }
  }, [printJob, handlePrint]);

  const stockBadge = (p) => {
    if (p.stock <= 0) return <span className="badge-red">Out of Stock</span>;
    if (p.stock <= p.reorderLevel)
      return (
        <span className="badge-yellow">
          <AlertTriangle size={10} className="mr-1" />
          {p.stock}
        </span>
      );
    return <span className="badge-green">{p.stock}</span>;
  };

  const columns = [
    {
      key: "image",
      label: "",
      render: (_, p) => (
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0">
          {p.image ? (
            <img
              src={p.image}
              alt={p.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package size={18} className="m-auto mt-2.5 text-slate-300" />
          )}
        </div>
      ),
    },
    {
      key: "name",
      label: "Product",
      render: (v, p) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{v}</p>
          <p className="text-xs text-slate-400">{p.barcode || p.sku || "—"}</p>
        </div>
      ),
    },
    { key: "category", label: "Category", render: (v) => v?.name || "—" },
    {
      key: "costPrice",
      label: "Cost",
      render: (v) => `${sym}${Number(v).toFixed(2)}`,
    },
    {
      key: "sellingPrice",
      label: "Price",
      render: (v) => (
        <span className="font-semibold text-brand-600">
          {sym}
          {Number(v).toFixed(2)}
        </span>
      ),
    },
    { key: "stock", label: "Stock", render: (_, p) => stockBadge(p) },
    {
      key: "_id",
      label: "Actions",
      render: (_, p) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/products/${p._id}/edit`)}
            className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-600"
            title="Edit product"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={() => {
              setPrintProductData(p);
              setPrintQuantity(1);
              setShowQuantityDialog(true);
            }}
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"
            title="Print price tag"
          >
            <Printer size={15} />
          </button>
          <button
            onClick={() => setDeleteId(p._id)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
            title="Delete product"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle={`${total} products in inventory`}
        actions={
          <button
            onClick={() => navigate("/products/new")}
            className="btn-primary"
          >
            <Plus size={16} /> Add Product
          </button>
        }
      />

      <div className="card">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search products by name, SKU, barcode..."
          />
        </div>
        <Table
          columns={columns}
          data={products}
          loading={loading}
          emptyMessage="No products found"
        />
        <div className="px-4 pb-4">
          <Pagination
            page={page}
            pages={pages}
            total={total}
            onPage={setPage}
          />
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />

      {/* Quantity Dialog for printing multiple tags */}
      {showQuantityDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-80 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Print Price Tags</h3>
            <p className="text-sm text-slate-500 mb-4">
              How many tags for{" "}
              <span className="font-medium">{printProductData?.name}</span>?
            </p>
            <input
              type="number"
              min="1"
              max="100"
              value={printQuantity}
              onChange={(e) =>
                setPrintQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="input w-full mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowQuantityDialog(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (printQuantity > 0) {
                    setPrintJob({
                      product: printProductData,
                      quantity: printQuantity,
                    });
                    setShowQuantityDialog(false);
                  }
                }}
                className="btn-primary"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden container for printing multiple tags */}

      <div style={{ display: "none" }}>
        {printJob && (
          <div ref={printRef}>
            {Array.from({ length: printJob.quantity }).map((_, idx) => (
              <ProductPriceTag
                key={idx}
                product={printJob.product}
                settings={settings}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
