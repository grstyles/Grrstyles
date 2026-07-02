'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tag,
  ClipboardList,
  BarChart3,
  Settings,
  CreditCard,
  Menu,
  X,
  ArrowLeft,
  LogOut,
  Shield,
  Megaphone,
} from 'lucide-react';
import { authService, UserProfile } from '@/services/authService';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { useDispatch } from 'react-redux';
import { config } from '@/lib/config';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        router.replace('/login');
        return;
      }
      setUser(currentUser);
      setAuthChecked(true);
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await authService.logout();
    dispatch(addToast({ message: 'Logged out from admin panel.', type: 'info' }));
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: ShoppingBag },
    { name: 'Banners', href: '/admin/banners', icon: LayoutDashboard }, // Assuming LayoutDashboard or another icon for Banners
    { name: 'Inventory', href: '/admin/inventory', icon: Package },
    { name: 'Orders', href: '/admin/orders', icon: ClipboardList },
    { name: 'Coupons', href: '/admin/coupons', icon: Tag },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Marketing', href: '/admin/marketing', icon: Megaphone },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#f9f7f5] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 uppercase tracking-widest">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f7f5] flex flex-col md:flex-row text-gray-800">

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-black" />
          <span className="font-serif font-bold text-sm tracking-wider">GR ADMIN</span>
          <span className="text-[8px] bg-black text-white px-2 py-0.5 rounded font-mono">DEMO</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 text-gray-600 hover:text-black border border-gray-200 hover:border-black rounded-lg transition-colors"
          aria-label="Toggle admin menu"
        >
          {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 md:h-screen ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-black" />
                <h2 className="font-serif font-bold text-base tracking-wider">GR STYLES</h2>
              </div>
              <p className="text-[9px] text-gray-400 tracking-widest uppercase mt-0.5">Admin Panel</p>
            </div>
            <span className="text-[8px] bg-black text-white px-2 py-0.5 rounded font-mono">DEMO</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                  }`}
                >
                  <item.icon size={15} className="flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-6 border-t border-gray-100 space-y-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-black transition-colors uppercase tracking-wider"
          >
            <ArrowLeft size={13} />
            Back to Shop
          </Link>

          {/* User card */}
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate text-gray-900">{user?.fullName || 'Admin User'}</p>
              <p className="text-[9px] text-gray-400 truncate">{user?.email || config.adminEmail}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            id="admin-logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-semibold text-red-400 hover:text-red-600 transition-colors uppercase tracking-wider w-full"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full min-h-screen">
        {children}
      </main>
    </div>
  );
}
