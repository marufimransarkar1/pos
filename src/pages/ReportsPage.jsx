import { useState, useEffect } from 'react';
import { FileBarChart, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { PageHeader, StatCard, Spinner } from '../components/ui/index.jsx';
import { useSettingsStore } from '../store/index.js';

export default function ReportsPage() {
  const [salesData, setSalesData] = useState([]);
  const [profitData, setProfitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('day');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const { settings } = useSettingsStore();
  const sym = settings?.currencySymbol || '$';

  const load = async () => {
    setLoading(true);
    try {
      const [sales, profit] = await Promise.all([
        api.get(`/reports/sales?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`),
        api.get(`/reports/profit?startDate=${startDate}&endDate=${endDate}`),
      ]);
      setSalesData(sales.data.data);
      setProfitData(profit.data.data);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [startDate, endDate, groupBy]);

  const fmt = (n) => `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Business performance analytics" />

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Group By</label>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="input">
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
        <button onClick={load} className="btn-primary">Apply</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Profit summary */}
          {profitData && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Revenue" value={fmt(profitData.revenue)} icon={TrendingUp} color="blue" />
              <StatCard label="Cost of Goods" value={fmt(profitData.cogs)} icon={ShoppingBag} color="orange" />
              <StatCard label="Gross Profit" value={fmt(profitData.grossProfit)} icon={DollarSign} color="green" />
              <StatCard label="Expenses" value={fmt(profitData.totalExpenses)} icon={FileBarChart} color="red" />
              <StatCard label="Net Profit" value={fmt(profitData.netProfit)} icon={DollarSign} color={profitData.netProfit >= 0 ? 'green' : 'red'} />
            </div>
          )}

          {/* Sales chart */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Sales Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGradR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${sym}${v}`} />
                <Tooltip formatter={v => [fmt(v)]} />
                <Legend />
                <Area type="monotone" dataKey="sales" name="Revenue" stroke="#0284c7" strokeWidth={2} fill="url(#salesGradR)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders vs Revenue */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Orders Count</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="orders" name="Orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Table */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Detailed Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left py-2 px-4 text-slate-500 font-medium">Period</th>
                    <th className="text-right py-2 px-4 text-slate-500 font-medium">Orders</th>
                    <th className="text-right py-2 px-4 text-slate-500 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {salesData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="py-2 px-4 font-mono text-slate-700 dark:text-slate-300">{row._id}</td>
                      <td className="text-right py-2 px-4">{row.orders}</td>
                      <td className="text-right py-2 px-4 font-semibold text-brand-600">{fmt(row.sales)}</td>
                    </tr>
                  ))}
                  {salesData.length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-slate-400">No data for selected period</td></tr>
                  )}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 dark:border-slate-600">
                  <tr>
                    <td className="py-2 px-4 font-bold">Total</td>
                    <td className="text-right py-2 px-4 font-bold">{salesData.reduce((s, r) => s + r.orders, 0)}</td>
                    <td className="text-right py-2 px-4 font-bold text-brand-600">{fmt(salesData.reduce((s, r) => s + r.sales, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
