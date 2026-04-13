import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { PageHeader, Table, Modal, ConfirmDialog, EmptyState } from '../components/ui/index.jsx';

function CrudPage({ title, endpoint, icon: Icon }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get(endpoint); setItems(data.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setShowModal(true); };
  const openEdit = (item) => { setEditing(item); setForm({ name: item.name, description: item.description || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
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

  const columns = [
    { key: 'name', label: 'Name', render: (v) => <span className="font-medium text-slate-900 dark:text-white">{v}</span> },
    { key: 'description', label: 'Description', render: (v) => <span className="text-slate-500">{v || '—'}</span> },
    { key: '_id', label: 'Actions', render: (_, item) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-600"><Edit size={15} /></button>
        <button onClick={() => setDeleteId(item._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={15} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={`${items.length} ${title.toLowerCase()}`}
        actions={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add {title.slice(0, -1)}</button>}
      />
      <div className="card">
        {items.length === 0 && !loading
          ? <EmptyState icon={Icon} title={`No ${title} yet`} description={`Add your first ${title.slice(0,-1).toLowerCase()} to get started`}
              action={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add {title.slice(0,-1)}</button>} />
          : <Table columns={columns} data={items} loading={loading} />
        }
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? `Edit ${title.slice(0,-1)}` : `New ${title.slice(0,-1)}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Enter name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="input resize-none" placeholder="Optional description" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title={`Delete ${title.slice(0,-1)}`} message={`Are you sure you want to delete this ${title.slice(0,-1).toLowerCase()}?`} />
    </div>
  );
}

export function CategoriesPage() {
  return <CrudPage title="Categories" endpoint="/categories" icon={Tag} />;
}

export function BrandsPage() {
  return <CrudPage title="Brands" endpoint="/brands" icon={Tag} />;
}

export default CategoriesPage;
