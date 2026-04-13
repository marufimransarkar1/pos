import { useState, useEffect, useCallback } from 'react';
import { Eye, RotateCcw, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { PageHeader, Table, Pagination, SearchInput, Modal, ConfirmDialog } from '../components/ui/index.jsx';
import { useSettingsStore } from '../store/index.js';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [viewSale, setViewSale] = useState(null);
  const [refundId, setRefundId] = useState(null);
  const { settings } = useSettingsStore();
  const sym = settings?.currencySymbol || '$';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/sales?page=${page}&search=${search}&limit=15`);
      setSales(data.data); setPages(data.pages); setTotal(data.total);
    } catch { toast.error('Failed to load sales'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const handleRefund = async () => {
    try { await api.post(`/sales/${refundId}/refund`); toast.success('Sale refunded'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Refund failed'); }
    setRefundId(null);
  };

  const statusBadge = (s) => {
    const map = { completed: 'badge-green', refunded: 'badge-red', partial_refund: 'badge-yellow' };
    return <span className={map[s] || 'badge-slate'}>{s?.replace('_', ' ')}</span>;
  };

  const methodBadge = (m) => {
    const map = { cash: 'badge-green', card: 'badge-blue', mobile_banking: 'badge-purple' };
    return <span className={`badge ${map[m] || 'badge-slate'} capitalize`}>{m?.replace('_', ' ')}</span>;
  };

  const columns = [
    { key: 'invoiceNo', label: 'Invoice', render: (v) => <span className="font-mono font-medium text-slate-900 dark:text-white">{v}</span> },
    { key: 'customer', label: 'Customer', render: (v) => v?.name || 'Walk-in' },
    { key: 'total', label: 'Total', render: (v) => <span className="font-semibold text-brand-600">{sym}{Number(v).toFixed(2)}</span> },
    { key: 'paymentMethod', label: 'Payment', render: (v) => methodBadge(v) },
    { key: 'status', label: 'Status', render: (v) => statusBadge(v) },
    { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
    { key: '_id', label: 'Actions', render: (_, s) => (
      <div className="flex gap-2">
        <button onClick={() => api.get(`/sales/${s._id}`).then(r => setViewSale(r.data.data))}
          className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-600"><Eye size={15} /></button>
        {s.status === 'completed' && (
          <button onClick={() => setRefundId(s._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><RotateCcw size={15} /></button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Sales History" subtitle={`${total} total transactions`} />

      <div className="card">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by invoice number..." />
        </div>
        <Table columns={columns} data={sales} loading={loading} />
        <div className="px-4 pb-4">
          <Pagination page={page} pages={pages} total={total} onPage={setPage} />
        </div>
      </div>

      {/* Invoice Detail Modal */}
      <Modal open={!!viewSale} onClose={() => setViewSale(null)} title={`Invoice: ${viewSale?.invoiceNo}`} size="lg">
        {viewSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Customer:</span> <span className="font-medium ml-1">{viewSale.customer?.name || 'Walk-in'}</span></div>
              <div><span className="text-slate-500">Date:</span> <span className="font-medium ml-1">{new Date(viewSale.createdAt).toLocaleString()}</span></div>
              <div><span className="text-slate-500">Payment:</span> <span className="font-medium ml-1 capitalize">{viewSale.paymentMethod?.replace('_', ' ')}</span></div>
              <div><span className="text-slate-500">Cashier:</span> <span className="font-medium ml-1">{viewSale.cashier?.name}</span></div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="text-left pb-2 text-slate-500">Product</th>
                <th className="text-right pb-2 text-slate-500">Qty</th>
                <th className="text-right pb-2 text-slate-500">Price</th>
                <th className="text-right pb-2 text-slate-500">Total</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {viewSale.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2">{item.name}</td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">{sym}{item.unitPrice?.toFixed(2)}</td>
                    <td className="text-right py-2 font-medium">{sym}{item.subtotal?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{sym}{viewSale.subtotal?.toFixed(2)}</span></div>
              {viewSale.discount > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-{sym}{viewSale.discount?.toFixed(2)}</span></div>}
              {viewSale.tax > 0 && <div className="flex justify-between"><span>Tax</span><span>{sym}{viewSale.tax?.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-base pt-1 border-t border-slate-100 dark:border-slate-700">
                <span>Total</span><span className="text-brand-600">{sym}{viewSale.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!refundId} onClose={() => setRefundId(null)} onConfirm={handleRefund}
        title="Refund Sale" message="Are you sure you want to refund this sale? Stock will be restored." />
    </div>
  );
}
