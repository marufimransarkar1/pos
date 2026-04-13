import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';

export default function SimpleSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    appName: 'POS System',
    adminEmail: '',
    adminPassword: '',
  });

  const handleFinish = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // We only send the essential "Sign Up" data
      await api.post('/setup/run', form);
      toast.success('Admin account created!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-brand-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Initialize System</h1>
          <p className="text-slate-500">Create your master admin account to begin.</p>
        </div>

        <form onSubmit={handleFinish} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Store/App Name</label>
            <input 
              className="input w-full" 
              value={form.appName} 
              onChange={e => setForm({...form, appName: e.target.value})}
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Admin Email</label>
            <input 
              type="email" 
              className="input w-full" 
              placeholder="admin@example.com"
              value={form.adminEmail} 
              onChange={e => setForm({...form, adminEmail: e.target.value})}
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Admin Password</label>
            <input 
              type="password" 
              className="input w-full" 
              placeholder="••••••••"
              value={form.adminPassword} 
              onChange={e => setForm({...form, adminPassword: e.target.value})}
              required 
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4">
            {loading ? <Loader className="animate-spin mx-auto" /> : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}