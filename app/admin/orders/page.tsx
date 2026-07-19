'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { repo, MockOrder, MockOrderItem } from '@/lib/repositories';
import { ClipboardList, RefreshCw, Search, User as UserIcon, Package } from 'lucide-react';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { useDispatch } from 'react-redux';
import { formatPrice } from '@/lib/utils/helpers';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';

const STATUS_OPTIONS: MockOrder['status'][] = [
  'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned',
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, requireAuth } = useAuth(); // Add this
  const [authChecked, setAuthChecked] = useState(false); // Add this
  const [isAdmin, setIsAdmin] = useState(false); // Add this
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Add this useEffect for authentication
  useEffect(() => {
    requireAuth(
      () => {
        setAuthChecked(true);
      },
      () => {
        router.push('/login');
      }
    );
  }, [requireAuth, router]);

  // Add this useEffect to check admin status
  useEffect(() => {
    if (!authChecked || !user) return;

    const checkAdmin = async () => {
      try {
        const adminStatus = await repo.users.isAdmin(user.id);
        if (!adminStatus) {
          dispatch(addToast({ message: 'Access denied. Admin only.', type: 'error' }));
          router.push('/profile');
          return;
        }
        setIsAdmin(true);
      } catch (error) {
        console.error('Admin check failed:', error);
        router.push('/profile');
      }
    };

    checkAdmin();
  }, [authChecked, user, router, dispatch]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await repo.orders.getAll();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadOrders();
    }
  }, [isAdmin]);

  // Rest of your existing code...
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === 'All' || o.status === filterStatus;
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch = !term ||
      o.id.toLowerCase().includes(term) ||
      o.customerName.toLowerCase().includes(term) ||
      o.email.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const statusCounts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  // Show loading while checking auth
  if (!authChecked || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900 uppercase">Orders</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and track customer orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadOrders} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Order ID, Customer, or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black bg-white"
        >
          <option value="All">All Statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status} ({statusCounts[status] || 0})
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4 font-mono font-medium text-gray-900">{order.orderNumber || order.id.slice(0, 8)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                          <UserIcon size={14} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{order.customerName}</p>
                          <p className="text-[10px] text-gray-400">{order.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">{new Date(order.date).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-gray-900">{formatPrice(order.totalAmount)}</td>
                    <td className="p-4"><OrderStatusBadge status={order.status} /></td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="px-4 py-2 text-xs font-bold text-black border border-gray-200 rounded-lg hover:border-black transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    <Package size={24} className="mx-auto mb-2 opacity-20" />
                    <p>No orders found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}