import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { PageHeader, Table, Pagination, SearchInput, ConfirmDialog } from '../components/ui/index.jsx';
import { useSettingsStore } from '../store/index.js';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const sym = settings?.currencySymbol || '$';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products?page=${page}&search=${search}&limit=15`);
      setProducts(data.data);
      setPages(data.pages);
      setTotal(data.total);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${deleteId}`);
      toast.success('Product deleted');
      load();
    } catch { toast.error('Delete failed'); }
    setDeleteId(null);
  };

  const stockBadge = (p) => {
    if (p.stock <= 0) return <span className="badge-red">Out of Stock</span>;
    if (p.stock <= p.reorderLevel) return <span className="badge-yellow"><AlertTriangle size={10} className="mr-1" />{p.stock}</span>;
    return <span className="badge-green">{p.stock}</span>;
  };

  const columns = [
    {
      key: 'image', label: '', render: (_, p) => (
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0">
          {p.image
            ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
            : <Package size={18} className="m-auto mt-2.5 text-slate-300" />}
        </div>
      )
    },
    { key: 'name', label: 'Product', render: (v, p) => (
      <div>
        <p className="font-medium text-slate-900 dark:text-white">{v}</p>
        <p className="text-xs text-slate-400">{p.barcode || p.sku || '—'}</p>
      </div>
    )},
    { key: 'category', label: 'Category', render: (v) => v?.name || '—' },
    { key: 'costPrice', label: 'Cost', render: (v) => `${sym}${Number(v).toFixed(2)}` },
    { key: 'sellingPrice', label: 'Price', render: (v) => <span className="font-semibold text-brand-600">{sym}{Number(v).toFixed(2)}</span> },
    { key: 'stock', label: 'Stock', render: (_, p) => stockBadge(p) },
    { key: '_id', label: 'Actions', render: (_, p) => (
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(`/products/${p._id}/edit`)} className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-600">
          <Edit size={15} />
        </button>
        <button onClick={() => setDeleteId(p._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
          <Trash2 size={15} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle={`${total} products in inventory`}
        actions={
          <button onClick={() => navigate('/products/new')} className="btn-primary">
            <Plus size={16} /> Add Product
          </button>
        }
      />

      <div className="card">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <SearchInput value={search} onChange={setSearch} placeholder="Search products by name, SKU, barcode..." />
        </div>
        <Table columns={columns} data={products} loading={loading} emptyMessage="No products found" />
        <div className="px-4 pb-4">
          <Pagination page={page} pages={pages} total={total} onPage={setPage} />
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />
    </div>
  );
}
