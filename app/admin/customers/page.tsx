'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  ArrowUpDown,
  RefreshCw,
  ShoppingBag,
  UserCheck,
  UserX,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { CustomerSummary } from '@/lib/repositories/interfaces';
import { customerService } from '@/services/customerService';
import CustomerDetailModal from '@/components/admin/customers/CustomerDetailModal';
import { getClient } from '@/lib/supabase';

export default function AdminCustomersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Search, Filter, Sort, Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [accountStatusFilter, setAccountStatusFilter] = useState<'all' | 'Registered' | 'Guest' | 'Admin'>('all');
  const [activityStatusFilter, setActivityStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [orderFilter, setOrderFilter] = useState<'all' | 'with_orders' | 'no_orders'>('all');
  const [sortBy, setSortBy] = useState<
    'newest' | 'oldest' | 'spent_desc' | 'spent_asc' | 'orders_desc' | 'orders_asc' | 'name_asc' | 'last_order'
  >('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchCustomers = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (err: any) {
      console.error('[AdminCustomersPage] Error fetching customers:', err);
      setError(err?.message || 'Failed to load customers list.');
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(true);

    // Setup Supabase Realtime subscription for live updates (Requirements 9 & 10)
    const sb = getClient();
    if (!sb) return;

    const channel = sb
      .channel('admin-customers-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          console.log('[Realtime] Profile change detected, refetching customers...');
          fetchCustomers(false);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          console.log('[Realtime] Order change detected, refetching customers...');
          fetchCustomers(false);
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // 1. Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = c.name.toLowerCase().includes(q);
          const matchEmail = c.email.toLowerCase().includes(q);
          const matchPhone = c.phone.toLowerCase().includes(q);
          const matchId = c.id.toLowerCase().includes(q);
          if (!matchName && !matchEmail && !matchPhone && !matchId) return false;
        }

        // 2. Account Status Filter
        if (accountStatusFilter !== 'all' && c.accountStatus !== accountStatusFilter) {
          return false;
        }

        // 3. Activity Status Filter
        if (activityStatusFilter !== 'all' && c.status !== activityStatusFilter) {
          return false;
        }

        // 4. Order Count Filter
        if (orderFilter === 'with_orders' && c.totalOrders === 0) return false;
        if (orderFilter === 'no_orders' && c.totalOrders > 0) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime();
          case 'oldest':
            return new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
          case 'spent_desc':
            return b.totalSpent - a.totalSpent;
          case 'spent_asc':
            return a.totalSpent - b.totalSpent;
          case 'orders_desc':
            return b.totalOrders - a.totalOrders;
          case 'orders_asc':
            return a.totalOrders - b.totalOrders;
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'last_order': {
            const dateA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
            const dateB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
            return dateB - dateA;
          }
          default:
            return 0;
        }
      });
  }, [customers, searchQuery, accountStatusFilter, activityStatusFilter, orderFilter, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, accountStatusFilter, activityStatusFilter, orderFilter, sortBy, pageSize]);

  // Pagination Math
  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = customers.length;
    const registered = customers.filter((c) => c.accountStatus === 'Registered' || c.accountStatus === 'Admin').length;
    const guests = customers.filter((c) => c.accountStatus === 'Guest').length;
    const active = customers.filter((c) => c.status === 'Active').length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    return { total, registered, guests, active, totalRevenue };
  }, [customers]);

  const handleExportCSV = () => {
    customerService.exportCustomersCSV(filteredCustomers);
  };

  return (
    <div className="p-2 md:p-6 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900 uppercase">Customers</h1>
            <span className="text-[10px] bg-black text-white px-2.5 py-0.5 rounded-full font-mono font-bold tracking-widest uppercase">
              LIVE
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage your store customers, order history, and account metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCustomers(true)}
            className="p-2.5 bg-white border border-gray-200 hover:border-black text-gray-700 hover:text-black rounded-xl transition-all shadow-sm flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
            title="Refresh customer list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredCustomers.length === 0}
            className="px-4 py-2.5 bg-black text-white rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2 shadow-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Customers</span>
            <Users size={16} />
          </div>
          <p className="text-2xl font-serif font-bold text-gray-900">{stats.total}</p>
          <p className="text-[10px] text-gray-400">All registered & guest users</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Registered</span>
            <UserCheck size={16} />
          </div>
          <p className="text-2xl font-serif font-bold text-gray-900">{stats.registered}</p>
          <p className="text-[10px] text-gray-400">With Supabase profiles</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Guest Customers</span>
            <UserX size={16} />
          </div>
          <p className="text-2xl font-serif font-bold text-gray-900">{stats.guests}</p>
          <p className="text-[10px] text-gray-400">Order-only checkouts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-blue-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active</span>
            <Sparkles size={16} />
          </div>
          <p className="text-2xl font-serif font-bold text-gray-900">{stats.active}</p>
          <p className="text-[10px] text-gray-400">Recent orders or logins</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-purple-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Customer Spend</span>
            <CreditCard size={16} />
          </div>
          <p className="text-2xl font-serif font-bold text-gray-900">
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-gray-400">Total non-cancelled sales</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name, email, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-black"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filters & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Account Status Filter */}
            <select
              value={accountStatusFilter}
              onChange={(e) => setAccountStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="all">Account: All</option>
              <option value="Registered">Account: Registered</option>
              <option value="Guest">Account: Guest</option>
              <option value="Admin">Account: Admin</option>
            </select>

            {/* Activity Status Filter */}
            <select
              value={activityStatusFilter}
              onChange={(e) => setActivityStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="all">Activity: All</option>
              <option value="Active">Activity: Active</option>
              <option value="Inactive">Activity: Inactive</option>
            </select>

            {/* Order Count Filter */}
            <select
              value={orderFilter}
              onChange={(e) => setOrderFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="all">Orders: All</option>
              <option value="with_orders">Orders: Has Orders</option>
              <option value="no_orders">Orders: No Orders</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="newest">Sort: Newest Registered</option>
              <option value="oldest">Sort: Oldest Registered</option>
              <option value="spent_desc">Sort: Highest Spent</option>
              <option value="spent_asc">Sort: Lowest Spent</option>
              <option value="orders_desc">Sort: Most Orders</option>
              <option value="orders_asc">Sort: Fewest Orders</option>
              <option value="name_asc">Sort: Name (A-Z)</option>
              <option value="last_order">Sort: Last Order Date</option>
            </select>
          </div>
        </div>

        {/* Applied filters bar & count */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
          <span>
            Showing <strong className="text-gray-900">{filteredCustomers.length}</strong> of{' '}
            <strong className="text-gray-900">{customers.length}</strong> customers
          </span>

          {(searchQuery || accountStatusFilter !== 'all' || activityStatusFilter !== 'all' || orderFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setAccountStatusFilter('all');
                setActivityStatusFilter('all');
                setOrderFilter('all');
              }}
              className="text-xs font-bold text-red-500 hover:underline uppercase tracking-wider"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-700">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} />
            <span className="text-xs font-semibold">{error}</span>
          </div>
          <button
            onClick={() => fetchCustomers(true)}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-4">Contact</th>
                <th className="py-4 px-4">Account Status</th>
                <th className="py-4 px-4">Reg Date</th>
                <th className="py-4 px-4 text-center">Orders</th>
                <th className="py-4 px-4 text-right">Total Spent</th>
                <th className="py-4 px-4">Last Order</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-xs">
              {/* Skeleton Loading State */}
              {loading &&
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                        <div className="space-y-1.5">
                          <div className="w-28 h-3.5 bg-gray-200 rounded" />
                          <div className="w-16 h-2.5 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-32 h-3 bg-gray-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-16 h-4 bg-gray-200 rounded-full" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-20 h-3 bg-gray-200 rounded" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-8 h-3 bg-gray-200 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="w-16 h-3 bg-gray-200 rounded ml-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-20 h-3 bg-gray-200 rounded" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-14 h-4 bg-gray-200 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="w-12 h-6 bg-gray-200 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))}

              {/* Empty State */}
              {!loading && paginatedCustomers.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto text-gray-300">
                        <Users size={24} />
                      </div>
                      <p className="text-sm font-bold text-gray-700">No Customers Found</p>
                      <p className="text-xs text-gray-400">
                        {customers.length === 0
                          ? 'No customer accounts or order records exist in Supabase yet.'
                          : 'No customer matches your search or filter criteria.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {!loading &&
                paginatedCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedCustomerId(customer.id)}
                  >
                    {/* Customer Name & ID */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs flex-shrink-0 uppercase font-serif shadow-sm">
                          {customer.avatar ? (
                            <img
                              src={customer.avatar}
                              alt={customer.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            customer.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-black transition-colors">
                            {customer.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">ID: {customer.id.slice(0, 12)}...</p>
                        </div>
                      </div>
                    </td>

                    {/* Email & Phone */}
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-800">{customer.email}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{customer.phone || 'No phone'}</p>
                    </td>

                    {/* Account Status */}
                    <td className="py-4 px-4">
                      {customer.accountStatus === 'Admin' && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
                          Admin
                        </span>
                      )}
                      {customer.accountStatus === 'Registered' && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                          Registered
                        </span>
                      )}
                      {customer.accountStatus === 'Guest' && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                          Guest
                        </span>
                      )}
                    </td>

                    {/* Registration Date */}
                    <td className="py-4 px-4 text-gray-600 font-mono text-[11px]">
                      {customer.registrationDate}
                    </td>

                    {/* Total Orders */}
                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                        {customer.totalOrders}
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td className="py-4 px-4 text-right font-serif font-bold text-gray-900">
                      ₹{customer.totalSpent.toLocaleString('en-IN')}
                    </td>

                    {/* Last Order Date */}
                    <td className="py-4 px-4 text-gray-600 font-mono text-[11px]">
                      {customer.lastOrderDate || '—'}
                    </td>

                    {/* Customer Status */}
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          customer.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            customer.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        />
                        {customer.status}
                      </span>
                    </td>

                    {/* View Action */}
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedCustomerId(customer.id)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-black text-gray-700 hover:text-white rounded-xl font-semibold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 ml-auto"
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!loading && filteredCustomers.length > 0 && (
          <div className="p-4 bg-gray-50/60 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              <span>
                Showing {startIndex + 1}–{Math.min(startIndex + pageSize, totalItems)} of {totalItems}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-black hover:border-black disabled:opacity-40 transition-colors"
                title="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-xs font-bold font-mono px-3">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-black hover:border-black disabled:opacity-40 transition-colors"
                title="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer Modal */}
      {selectedCustomerId && (
        <CustomerDetailModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </div>
  );
}
