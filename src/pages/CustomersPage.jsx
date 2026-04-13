import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { PageHeader, Table, Pagination, SearchInput, Modal, ConfirmDialog } from '../components/ui/index.jsx';

function EntityPage({ title, endpoint, columns: colDefs, formFields, defaultForm }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`${endpoint}?page=${page}&search=${search}&limit=15`);
      setItems(data.data); setPages(data.pages || 1); setTotal(data.total || data.data?.length || 0);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [endpoint, page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const openCreate = () => { setEditing(null); setForm(defaultForm); setShowModal(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...defaultForm, ...item }); setShowModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) { await api.put(`${endpoint}/${editing._id}`, form); toast.success('Updated!'); }
      else { await api.post(endpoint, form); toast.success('Created!'); }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`${endpoint}/${deleteId}`); toast.success('Deleted!'); load(); }
    catch { toast.error('Delete failed'); }
    setDeleteId(null);
  };

  const allColumns = [
    ...colDefs,
    { key: '_id', label: 'Actions', render: (_, item) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-600"><Edit size={15} /></button>
        <button onClick={() => setDeleteId(item._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={15} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={`${total} ${title.toLowerCase()}`}
        actions={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add</button>}
      />
      <div className="card">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <SearchInput value={search} onChange={setSearch} placeholder={`Search ${title.toLowerCase()}...`} />
        </div>
        <Table columns={allColumns} data={items} loading={loading} />
        <div className="px-4 pb-4"><Pagination page={page} pages={pages} total={total} onPage={setPage} /></div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? `Edit` : `New`} size="md">
        <div className="space-y-4">
          {formFields.map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
              {f.type === 'textarea'
                ? <textarea value={form[f.name] || ''} onChange={e => setForm(fm => ({...fm, [f.name]: e.target.value}))} rows={3} className="input resize-none" placeholder={f.placeholder} />
                : <input type={f.type || 'text'} value={form[f.name] || ''} onChange={e => setForm(fm => ({...fm, [f.name]: e.target.value}))} className="input" placeholder={f.placeholder} />
              }
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Confirm Delete" message="Are you sure?" />
    </div>
  );
}

export function CustomersPage() {
  return (
    <EntityPage
      title="Customers"
      endpoint="/customers"
      defaultForm={{ name: '', email: '', phone: '', address: '' }}
      columns={[
        { key: 'name', label: 'Name', render: v => <span className="font-medium text-slate-900 dark:text-white">{v}</span> },
        { key: 'phone', label: 'Phone', render: v => v || '—' },
        { key: 'email', label: 'Email', render: v => v || '—' },
        { key: 'loyaltyPoints', label: 'Points', render: v => <span className="badge-blue">{v || 0} pts</span> },
        { key: 'totalPurchase', label: 'Total Spent', render: v => `$${Number(v || 0).toFixed(2)}` },
      ]}
      formFields={[
        { name: 'name', label: 'Full Name *', placeholder: 'John Doe' },
        { name: 'phone', label: 'Phone', placeholder: '+1 234 567 8900' },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com' },
        { name: 'address', label: 'Address', type: 'textarea', placeholder: 'Street address...' },
      ]}
    />
  );
}

export function SuppliersPage() {
  return (
    <EntityPage
      title="Suppliers"
      endpoint="/suppliers"
      defaultForm={{ name: '', email: '', phone: '', company: '', address: '' }}
      columns={[
        { key: 'name', label: 'Name', render: v => <span className="font-medium text-slate-900 dark:text-white">{v}</span> },
        { key: 'company', label: 'Company', render: v => v || '—' },
        { key: 'phone', label: 'Phone', render: v => v || '—' },
        { key: 'email', label: 'Email', render: v => v || '—' },
      ]}
      formFields={[
        { name: 'name', label: 'Contact Name *', placeholder: 'Jane Smith' },
        { name: 'company', label: 'Company', placeholder: 'Acme Corp' },
        { name: 'phone', label: 'Phone', placeholder: '+1 234 567 8900' },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'jane@acme.com' },
        { name: 'address', label: 'Address', type: 'textarea', placeholder: 'Business address...' },
      ]}
    />
  );
}

export default CustomersPage;
