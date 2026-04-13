import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle, Boxes } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { PageHeader, Table, Pagination, SearchInput, Modal } from '../components/ui/index.jsx';

export default function StockPage() {
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ productId: '', type: 'increase', quantity: 1, reason: '' });
  const [tab, setTab] = useState('stock');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, search, limit: 15 });
      if (filter === 'low') params.set('status', 'low_stock');
      if (filter === 'out') params.set('status', 'out_of_stock');
      const { data } = await api.get(`/products?${params}`);
      setProducts(data.data); setPages(data.pages || 1); setTotal(data.total || 0);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [page, search, filter]);

  const loadAdjustments = useCallback(async () => {
    try {
      const { data } = await api.get('/stock/adjustments');
      setAdjustments(data.data);
    } catch {}
  }, []);

  useEffect(() => { if (tab === 'stock') loadProducts(); else loadAdjustments(); }, [tab, loadProducts, loadAdjustments]);
  useEffect(() => { setPage(1); }, [search, filter]);

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleAdjust = async () => {
    if (!form.productId || !form.quantity) { toast.error('Select product and quantity'); return; }
    setSaving(true);
    try {
      await api.post('/stock/adjust', { ...form, quantity: Number(form.quantity) });
      toast.success('Stock adjusted!');
      setShowModal(false);
      setForm({ productId: '', type: 'increase', quantity: 1, reason: '' });
      loadProducts(); loadAdjustments();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const stockBadge = (p) => {
    if (p.stock <= 0) return <span className="badge-red">Out of Stock</span>;
    if (p.stock <= p.reorderLevel) return <span className="badge-yellow"><AlertTriangle size={10} className="inline mr-1" />{p.stock}</span>;
    return <span className="badge-green">{p.stock}</span>;
  };

  const productColumns = [
    { key: 'name', label: 'Product', render: (v, p) => (
      <div>
        <p className="font-medium text-slate-900 dark:text-white">{v}</p>
        <p className="text-xs text-slate-400">{p.sku || p.barcode || '—'}</p>
      </div>
    )},
    { key: 'category', label: 'Category', render: v => v?.name || '—' },
    { key: 'stock', label: 'Current Stock', render: (_, p) => stockBadge(p) },
    { key: 'reorderLevel', label: 'Reorder At', render: v => <span className="text-slate-500">{v}</span> },
    { key: 'unit', label: 'Unit' },
    { key: '_id', label: 'Adjust', render: (_, p) => (
      <button
        onClick={() => { setForm(f => ({ ...f, productId: p._id })); setShowModal(true); }}
        className="btn-secondary text-xs py-1"
      >
        <Boxes size={13} /> Adjust
      </button>
    )},
  ];

  const adjColumns = [
    { key: 'product', label: 'Product', render: v => v?.name || '—' },
    { key: 'type', label: 'Type', render: v => (
      <span className={`badge ${v === 'increase' ? 'badge-green' : 'badge-red'} capitalize`}>{v}</span>
    )},
    { key: 'quantity', label: 'Qty', render: (v, row) => (
      <span className={row.type === 'increase' ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
        {row.type === 'increase' ? '+' : '-'}{v}
      </span>
    )},
    { key: 'previousStock', label: 'Before' },
    { key: 'newStock', label: 'After' },
    { key: 'reason', label: 'Reason', render: v => <span className="text-slate-500 text-xs">{v || '—'}</span> },
    { key: 'createdBy', label: 'By', render: v => v?.name || '—' },
    { key: 'createdAt', label: 'Date', render: v => new Date(v).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Management"
        subtitle={`${total} products`}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> Adjust Stock
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2">
        {['stock', 'adjustments'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize
              ${tab === t ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <div className="card">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-3">
            <div className="flex-1 min-w-48">
              <SearchInput value={search} onChange={setSearch} placeholder="Search products..." />
            </div>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'low', label: '⚠️ Low Stock' },
                { value: 'out', label: '🔴 Out of Stock' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all
                    ${filter === f.value ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <Table columns={productColumns} data={products} loading={loading} />
          <div className="px-4 pb-4"><Pagination page={page} pages={pages} total={total} onPage={setPage} /></div>
        </div>
      )}

      {tab === 'adjustments' && (
        <div className="card">
          <Table columns={adjColumns} data={adjustments} loading={loading} emptyMessage="No stock adjustments yet" />
        </div>
      )}

      {/* Adjustment Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Adjust Stock" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Product *</label>
            <select name="productId" value={form.productId} onChange={set} className="input">
              <option value="">Select a product</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
              <select name="type" value={form.type} onChange={set} className="input">
                <option value="increase">Increase ↑</option>
                <option value="decrease">Decrease ↓</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Quantity *</label>
              <input name="quantity" type="number" min="1" value={form.quantity} onChange={set} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Reason</label>
            <input name="reason" value={form.reason} onChange={set} className="input" placeholder="e.g. Damaged goods, New shipment..." />
          </div>

          <div className={`rounded-xl p-3 text-sm font-medium text-center ${form.type === 'increase' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
            {form.type === 'increase' ? '↑ Will add stock' : '↓ Will reduce stock'} by {form.quantity || 0} units
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleAdjust} disabled={saving} className={`flex-1 btn ${form.type === 'increase' ? 'btn-success' : 'btn-danger'}`}>
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Confirm Adjustment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
