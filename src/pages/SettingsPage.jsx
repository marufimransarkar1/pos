import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { PageHeader, Spinner } from '../components/ui/index.jsx';
import { useSettingsStore } from '../store/index.js';

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
    {children}
    {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { fetchSettings } = useSettingsStore();
  const [form, setForm] = useState({
    appName: '', businessName: '', address: '', phone: '', email: '',
    currency: 'USD', currencySymbol: '$', taxRate: 0, taxName: 'VAT',
    invoicePrefix: 'INV', receiptFooter: '', loyaltyPointsPerUnit: 1,
  });

  useEffect(() => {
    api.get('/settings').then(r => {
      const s = r.data.data;
      setForm({
        appName: s.appName || '',
        businessName: s.businessName || '',
        address: s.address || '',
        phone: s.phone || '',
        email: s.email || '',
        currency: s.currency || 'USD',
        currencySymbol: s.currencySymbol || '$',
        taxRate: s.taxRate || 0,
        taxName: s.taxName || 'VAT',
        invoicePrefix: s.invoicePrefix || 'INV',
        receiptFooter: s.receiptFooter || '',
        loyaltyPointsPerUnit: s.loyaltyPointsPerUnit || 1,
      });
    }).catch(() => toast.error('Failed to load settings')).finally(() => setLoading(false));
  }, []);

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', form);
      toast.success('Settings saved!');
      fetchSettings();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Settings" subtitle="Configure your business and system settings" />

      {/* Business Info */}
      <div className="card p-6 space-y-5">
        <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Business Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="App Name">
            <input name="appName" value={form.appName} onChange={set} className="input" placeholder="POS System" />
          </Field>
          <Field label="Business Name">
            <input name="businessName" value={form.businessName} onChange={set} className="input" placeholder="My Store LLC" />
          </Field>
          <Field label="Phone">
            <input name="phone" value={form.phone} onChange={set} className="input" placeholder="+1 234 567 8900" />
          </Field>
          <Field label="Email">
            <input name="email" type="email" value={form.email} onChange={set} className="input" placeholder="store@example.com" />
          </Field>
        </div>
        <Field label="Address">
          <textarea name="address" value={form.address} onChange={set} rows={2} className="input resize-none" placeholder="Business address..." />
        </Field>
      </div>

      {/* Currency & Tax */}
      <div className="card p-6 space-y-5">
        <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Currency & Tax</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Field label="Currency Code">
            <select name="currency" value={form.currency} onChange={set} className="input">
              {['USD', 'EUR', 'GBP', 'BDT', 'INR', 'AED', 'SAR', 'PKR', 'JPY', 'CNY'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Currency Symbol">
            <input name="currencySymbol" value={form.currencySymbol} onChange={set} className="input" placeholder="$" />
          </Field>
          <Field label="Tax Rate (%)">
            <input name="taxRate" type="number" min="0" max="100" value={form.taxRate} onChange={set} className="input" />
          </Field>
          <Field label="Tax Name">
            <input name="taxName" value={form.taxName} onChange={set} className="input" placeholder="VAT" />
          </Field>
          <Field label="Invoice Prefix">
            <input name="invoicePrefix" value={form.invoicePrefix} onChange={set} className="input" placeholder="INV" />
          </Field>
          <Field label="Loyalty Points / Unit Spent">
            <input name="loyaltyPointsPerUnit" type="number" min="0" value={form.loyaltyPointsPerUnit} onChange={set} className="input" />
          </Field>
        </div>
      </div>

      {/* Receipt */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Receipt & Invoice</h3>
        <Field label="Receipt Footer Text" hint="Shown at the bottom of every receipt">
          <textarea name="receiptFooter" value={form.receiptFooter} onChange={set} rows={3} className="input resize-none"
            placeholder="Thank you for your purchase! Come back soon." />
        </Field>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-3 text-base">
          {saving
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><Save size={18} /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
