import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Flame, LogOut, Package, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  children: React.ReactNode;
}

const AdminLayout: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const navLink = (to: string, label: string, icon: React.ReactNode) => {
    const active = location.pathname === to || location.pathname.startsWith(to + '/');
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-amber-100 text-amber-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-100 flex items-center gap-2">
          <Flame size={20} className="text-amber-500" />
          <span className="font-serif font-bold text-gray-900 text-sm leading-tight">
            Blow Me Away<br />
            <span className="text-gray-400 font-sans font-normal">Admin</span>
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navLink('/admin/candles', 'Candles', <Package size={16} />)}
          {navLink('/admin/candles/new', 'Add Candle', <Plus size={16} />)}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
