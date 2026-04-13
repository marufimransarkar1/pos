import { useState, useEffect, useCallback } from 'react';
import { Plus, Check, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { PageHeader, Table, Pagination, Modal, ConfirmDialog } from '../components/ui/index.jsx';
import { useSettingsStore } from '../store/index.js';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [receiveId, setReceiveId] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const { settings } = useSettingsStore();
  const sym = settings?.currencySymbol || '$';

  const [form, setForm] = useState({ supplierId: '', items: [{ productId: '', quantity: 1, unitCost: 0 }], tax: 0, shipping: 0, note: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/purchases?page=${page}&limit=15`);
      setPurchases(data.data); setPages(data.pages); setTotal(data.total);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/suppliers?limit=100').then(r => setSuppliers(r.data.data));
    api.get('/products?limit=200').then(r => setProducts(r.data.data));
  }, []);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: 1, unitCost: 0 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const setItem = (i, field, val) => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it) }));

  const subtotal = form.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unitCost)), 0);
  const total2 = subtotal + Number(form.tax) + Number(form.shipping);

  const handleCreate = async () => {
    const validItems = form.items.filter(i => i.productId && i.quantity > 0);
    if (!validItems.length) { toast.error('Add at least one product'); return; }
    setSaving(true);
    try {
      await api.post('/purchases', { ...form, items: validItems });
      toast.success('Purchase order created!');
      setShowCreate(false);
      setForm({ supplierId: '', items: [{ productId: '', quantity: 1, unitCost: 0 }], tax: 0, shipping: 0, note: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleReceive = async () => {
    try { await api.post(`/purchases/${receiveId}/receive`); toast.success('Stock updated!'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setReceiveId(null);
  };

  const columns = [
    { key: 'referenceNo', label: 'Reference', render: v => <span className="font-mono font-medium text-slate-900 dark:text-white">{v}</span> },
    { key: 'supplier', label: 'Supplier', render: v => v?.name || '—' },
    { key: 'total', label: 'Total', render: v => <span className="font-semibold text-brand-600">{sym}{Number(v).toFixed(2)}</span> },
    { key: 'paymentStatus', label: 'Payment', render: v => <span className={`badge ${v === 'paid' ? 'badge-green' : v === 'partial' ? 'badge-yellow' : 'badge-red'}`}>{v}</span> },
    { key: 'status', label: 'Status', render: v => <span className={`badge ${v === 'received' ? 'badge-green' : v === 'cancelled' ? 'badge-red' : 'badge-blue'}`}>{v}</span> },
    { key: 'createdAt', label: 'Date', render: v => new Date(v).toLocaleDateString() },
    { key: '_id', label: 'Actions', render: (_, p) => p.status === 'ordered' && (
      <button onClick={() => setReceiveId(p._id)} className="btn-success py-1 text-xs"><Check size={13} /> Receive</button>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Purchases" subtitle={`${total} purchase orders`}
        actions={<button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16} /> New Purchase</button>}
      />

      <div className="card">
        <Table columns={columns} data={purchases} loading={loading} />
        <div className="px-4 pb-4"><Pagination page={page} pages={pages} total={total} onPage={setPage} /></div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Purchase Order" size="xl">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Supplier</label>
              <select value={form.supplierId} onChange={e => setForm(f => ({...f, supplierId: e.target.value}))} className="input">
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Note</label>
              <input value={form.note} onChange={e => setForm(f => ({...f, note: e.target.value}))} className="input" placeholder="Optional note" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Items</label>
              <button onClick={addItem} className="btn-secondary text-xs py-1"><Plus size={13} /> Add Item</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <select value={item.productId} onChange={e => setItem(i, 'productId', e.target.value)} className="input col-span-5">
                    <option value="">Select product</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                  <input type="number" min="1" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)}
                    className="input col-span-2" placeholder="Qty" />
                  <input type="number" min="0" step="0.01" value={item.unitCost} onChange={e => setItem(i, 'unitCost', e.target.value)}
                    className="input col-span-3" placeholder="Unit cost" />
                  <p className="col-span-1 text-xs font-bold text-brand-600 text-right">{sym}{(item.quantity * item.unitCost).toFixed(0)}</p>
                  <button onClick={() => removeItem(i)} disabled={form.items.length === 1}
                    className="col-span-1 text-red-400 hover:text-red-600 disabled:opacity-30 text-center">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tax ({sym})</label>
              <input type="number" min="0" value={form.tax} onChange={e => setForm(f => ({...f, tax: e.target.value}))} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Shipping ({sym})</label>
              <input type="number" min="0" value={form.shipping} onChange={e => setForm(f => ({...f, shipping: e.target.value}))} className="input" />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 text-sm space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>{sym}{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-slate-200 dark:border-slate-600">
              <span>Total</span><span className="text-brand-600">{sym}{total2.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Purchase Order'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!receiveId} onClose={() => setReceiveId(null)} onConfirm={handleReceive}
        title="Receive Purchase" message="Mark this purchase as received? Stock will be updated automatically." danger={false} />
    </div>
  );
}
