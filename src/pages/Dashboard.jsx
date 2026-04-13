import { useEffect, useState } from 'react';
import { TrendingUp, Package, Users, AlertTriangle, ShoppingCart, DollarSign } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard, Spinner } from '../components/ui/index.jsx';
import api from '../lib/api.js';
import { useSettingsStore } from '../store/index.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettingsStore();
  const sym = settings?.currencySymbol || '$';

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  );

  const fmt = (n) => `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Overview of your business today</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Sales" value={fmt(data?.today?.total)} icon={TrendingUp} color="blue" />
        <StatCard label="Today's Orders" value={data?.today?.count || 0} icon={ShoppingCart} color="green" />
        <StatCard label="Monthly Revenue" value={fmt(data?.month?.total)} icon={DollarSign} color="purple" />
        <StatCard label="Total Products" value={data?.totalProducts || 0} icon={Package} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard label="Low Stock Items" value={data?.lowStockCount || 0} icon={AlertTriangle} color="red" />
        <StatCard label="Total Customers" value={data?.totalCustomers || 0} icon={Users} color="blue" />
        <StatCard label="Monthly Orders" value={data?.month?.count || 0} icon={ShoppingCart} color="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales area chart */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Sales (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.salesChart || []}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${sym}${v}`} />
              <Tooltip formatter={(v) => [fmt(v), 'Sales']} />
              <Area type="monotone" dataKey="total" stroke="#0284c7" strokeWidth={2} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products bar chart */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Top Products This Month</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.topProducts || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${sym}${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v) => [fmt(v), 'Revenue']} />
              <Bar dataKey="totalRevenue" fill="#0284c7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low stock alert table */}
      {data?.lowStockCount > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Low Stock Alert</h3>
            <span className="badge-yellow ml-auto">{data.lowStockCount} items</span>
          </div>
          <p className="text-sm text-slate-500">Some products are running low. Go to <a href="/stock" className="text-brand-600 hover:underline font-medium">Stock Management</a> to review and reorder.</p>
        </div>
      )}
    </div>
  );
}
