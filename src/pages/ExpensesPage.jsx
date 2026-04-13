import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { PageHeader, Table, Pagination, Modal } from '../components/ui/index.jsx';
import { useSettingsStore } from '../store/index.js';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', amount: '', date: new Date().toISOString().split('T')[0], note: '' });
  const { settings } = useSettingsStore();
  const sym = settings?.currencySymbol || '$';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [exp, cats] = await Promise.all([api.get(`/expenses?page=${page}&limit=15`), api.get('/expenses/categories')]);
      setExpenses(exp.data.data); setPages(exp.data.pages || 1); setTotal(exp.data.total || 0);
      setCategories(cats.data.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async () => {
    if (!form.title || !form.amount) { toast.error('Title and amount are required'); return; }
    setSaving(true);
    try {
      await api.post('/expenses', form);
      toast.success('Expense added!');
      setShowModal(false);
      setForm({ title: '', category: '', amount: '', date: new Date().toISOString().split('T')[0], note: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const totalAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const columns = [
    { key: 'title', label: 'Title', render: v => <span className="font-medium text-slate-900 dark:text-white">{v}</span> },
    { key: 'category', label: 'Category', render: v => v?.name || '—' },
    { key: 'amount', label: 'Amount', render: v => <span className="font-semibold text-red-600">{sym}{Number(v).toFixed(2)}</span> },
    { key: 'date', label: 'Date', render: v => new Date(v).toLocaleDateString() },
    { key: 'note', label: 'Note', render: v => <span className="text-slate-400 text-xs truncate max-w-xs">{v || '—'}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" subtitle={`Total: ${sym}${totalAmount.toFixed(2)}`}
        actions={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> Add Expense</button>}
      />
      <div className="card">
        <Table columns={columns} data={expenses} loading={loading} />
        <div className="px-4 pb-4"><Pagination page={page} pages={pages} total={total} onPage={setPage} /></div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Expense" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title *</label>
            <input name="title" value={form.title} onChange={set} className="input" placeholder="e.g. Office supplies" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
            <select name="category" value={form.category} onChange={set} className="input">
              <option value="">Select category</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Amount ({sym}) *</label>
              <input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={set} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
              <input name="date" type="date" value={form.date} onChange={set} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Note</label>
            <textarea name="note" value={form.note} onChange={set} rows={2} className="input resize-none" placeholder="Optional note..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Add Expense'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
