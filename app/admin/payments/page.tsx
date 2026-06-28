'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { repo, MockOrder } from '@/lib/repositories';
import { formatPrice } from '@/lib/utils/helpers';
import { Search, Filter, CreditCard, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<MockOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    setLoading(true);
    try {
      const allOrders = await repo.orders.getAll();
      // Only keep orders that have a payment_method or are strictly paid/failed via gateway
      const paymentRecords = allOrders.filter(
        (o) => o.gateway === 'razorpay' || o.paymentMethod === 'razorpay' || o.razorpay_payment_id || o.paymentStatus !== 'Pending'
      );
      setPayments(paymentRecords);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const FILTER_OPTIONS = ['All', 'Paid', 'Pending', 'Failed', 'Refunded'];

  const filteredPayments = payments.filter((p) => {
    if (filterStatus !== 'All' && p.paymentStatus !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (p.orderNumber || p.id).toLowerCase().includes(q) ||
        (p.razorpay_payment_id || '').toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-gray-500 text-sm">Monitor all transaction histories and refunds</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Payment ID, Order ID, Customer, Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
          {FILTER_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl whitespace-nowrap transition-colors border-2 ${
                filterStatus === status ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-600 hover:border-black hover:text-black'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div></div>
        ) : filteredPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  <th className="p-4 pl-6">Payment ID</th>
                  <th className="p-4">Order Ref</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Method / Gateway</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 pr-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredPayments.map((p) => (
                  <tr 
                    key={p.id}
                    onClick={() => router.push(`/admin/payments/${p.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 pl-6 font-mono text-gray-900 font-medium">
                      {p.razorpay_payment_id || 'N/A'}
                    </td>
                    <td className="p-4 font-mono text-gray-600">
                      {p.razorpay_order_id || p.orderNumber || p.id}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{p.customerName}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{p.email}</p>
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {formatPrice(p.totalAmount)}
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold uppercase text-gray-600">
                        {p.gateway || p.paymentMethod || 'Razorpay'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                        p.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' :
                        p.paymentStatus === 'Failed' ? 'bg-red-50 text-red-700 border-red-200' :
                        p.paymentStatus === 'Refunded' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 font-mono text-[10px]">
                      {p.transaction_time ? new Date(p.transaction_time).toLocaleString() : new Date(p.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-black transition-colors ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <CreditCard size={32} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No payments found</p>
          </div>
        )}
      </div>
    </div>
  );
}
