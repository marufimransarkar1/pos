import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Tag, Award, BarChart3,
  TrendingUp, ShoppingBag, Users, Truck, DollarSign, FileBarChart,
  Settings, LogOut, Menu, X, Sun, Moon, ChevronDown, Boxes, UserCog
} from 'lucide-react';
import useAuthStore from '../../store/authStore.js';
import { useSettingsStore } from '../../store/index.js';

const navItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'POS', to: '/pos', icon: ShoppingCart },
  { type: 'section', label: 'Inventory' },
  { label: 'Products', to: '/products', icon: Package },
  { label: 'Categories', to: '/categories', icon: Tag },
  { label: 'Brands', to: '/brands', icon: Award },
  { label: 'Stock', to: '/stock', icon: Boxes },
  { type: 'section', label: 'Transactions' },
  { label: 'Sales', to: '/sales', icon: TrendingUp },
  { label: 'Purchases', to: '/purchases', icon: ShoppingBag },
  { label: 'Expenses', to: '/expenses', icon: DollarSign },
  { type: 'section', label: 'People' },
  { label: 'Customers', to: '/customers', icon: Users },
  { label: 'Suppliers', to: '/suppliers', icon: Truck },
  { type: 'section', label: 'Admin' },
  { label: 'Reports', to: '/reports', icon: FileBarChart, roles: ['admin', 'manager'] },
  { label: 'Users', to: '/users', icon: UserCog, roles: ['admin'] },
  { label: 'Settings', to: '/settings', icon: Settings, roles: ['admin'] },
];

const NavItem = ({ item, collapsed, onClick }) => {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
        ${isActive
          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
        }`
      }
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode, settings } = useSettingsStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const filteredNav = navItems.filter(item =>
    !item.roles || !user || item.roles.includes(user.role)
  );

  const Sidebar = ({ mobile = false }) => (
    <aside className={`
      flex flex-col h-full bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700
      ${mobile ? 'w-72' : collapsed ? 'w-16' : 'w-64'}
      transition-all duration-200
    `}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100 dark:border-slate-700 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white truncate">
              {settings?.appName || 'POS System'}
            </span>
          </div>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 ml-auto"
          >
            <Menu size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredNav.map((item, i) => {
          if (item.type === 'section') {
            return !collapsed ? (
              <p key={i} className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 pt-4 pb-1">
                {item.label}
              </p>
            ) : <div key={i} className="my-2 border-t border-slate-100 dark:border-slate-700" />;
          }
          return (
            <NavItem
              key={item.to}
              item={item}
              collapsed={collapsed}
              onClick={() => mobile && setSidebarOpen(false)}
            />
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut size={16} />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center px-4 gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-700">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">{user?.name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
