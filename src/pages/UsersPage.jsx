import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { PageHeader, Table, Modal, ConfirmDialog } from '../components/ui/index.jsx';

const ROLES = ['admin', 'manager', 'cashier', 'warehouse'];

const roleBadge = (role) => {
  const map = { admin: 'badge-red', manager: 'badge-blue', cashier: 'badge-green', warehouse: 'badge-yellow' };
  return <span className={`badge ${map[role] || 'badge-slate'} capitalize`}>{role}</span>;
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier', isActive: true });

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/users'); setUsers(data.data); }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'cashier', isActive: true });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, isActive: user.isActive });
    setShowModal(true);
  };

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
    if (!editing && !form.password) { toast.error('Password is required for new users'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (editing) { await api.put(`/users/${editing._id}`, payload); toast.success('User updated!'); }
      else { await api.post('/users', payload); toast.success('User created!'); }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/users/${deleteId}`); toast.success('User deleted'); load(); }
    catch { toast.error('Delete failed'); }
    setDeleteId(null);
  };

  const columns = [
    {
      key: 'name', label: 'User', render: (v, u) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {v?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{v}</p>
            <p className="text-xs text-slate-400">{u.email}</p>
          </div>
        </div>
      )
    },
    { key: 'role', label: 'Role', render: (v) => roleBadge(v) },
    {
      key: 'isActive', label: 'Status', render: (v) =>
        <span className={v ? 'badge-green' : 'badge-red'}>{v ? 'Active' : 'Inactive'}</span>
    },
    { key: 'lastLogin', label: 'Last Login', render: (v) => v ? new Date(v).toLocaleDateString() : 'Never' },
    {
      key: '_id', label: 'Actions', render: (_, u) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-600"><Edit size={15} /></button>
          <button onClick={() => setDeleteId(u._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={15} /></button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} system users`}
        actions={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add User</button>}
      />

      <div className="card">
        <Table columns={columns} data={users} loading={loading} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit User' : 'New User'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
            <input name="name" value={form.name} onChange={set} className="input" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email *</label>
            <input name="email" type="email" value={form.email} onChange={set} className="input" placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Password {editing ? '(leave blank to keep unchanged)' : '*'}
            </label>
            <input name="password" type="password" value={form.password} onChange={set} className="input" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
            <select name="role" value={form.role} onChange={set} className="input">
              {ROLES.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={set} className="w-4 h-4 rounded text-brand-600" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Active Account</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save User'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user?"
      />
    </div>
  );
}
