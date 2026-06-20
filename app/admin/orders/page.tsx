'use client';

import React, { useState, useEffect } from 'react';
import { repo } from '@/lib/repositories';
import { MockOrder } from '@/lib/providers/mockStore';
import { ClipboardList, RefreshCw, Search, Eye, X } from 'lucide-react';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { useDispatch } from 'react-redux';
import { formatPrice } from '@/lib/utils/helpers';

const STATUS_OPTIONS: MockOrder['status'][] = [
  'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned',
];

const STATUS_COLORS: Record<MockOrder['status'], string> = {
  Pending:   'bg-purple-50 text-purple-600 border-purple-100',
  Confirmed: 'bg-blue-50 text-blue-600 border-blue-100',
  Packed:    'bg-indigo-50 text-indigo-600 border-indigo-100',
  Shipped:   'bg-cyan-50 text-cyan-600 border-cyan-100',
  Delivered: 'bg-green-50 text-green-600 border-green-100',
  Cancelled: 'bg-red-50 text-red-600 border-red-100',
  Returned:  'bg-orange-50 text-orange-600 border-orange-100',
};

export default function AdminOrdersPage() {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null);

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
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, status: MockOrder['status']) => {
    try {
      const success = await repo.orders.updateStatus(orderId, status);
      if (success) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => prev ? { ...prev, status } : prev);
        }
        dispatch(addToast({ message: `Order status → "${status}"`, type: 'success' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === 'All' || o.status === filterStatus;
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch = !term ||
      o.id.toLowerCase().includes(term) ||
      o.customerName.toLowerCase().includes(term) ||
      o.email.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  // Summary counts
  const statusCounts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900 uppercase">Orders</h1>
          <p className="text-sm text-gray-400 mt-1">{orders.length} total orders · Real-time status management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order / customer..."
              className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black placeholder-gray-300 font-semibold"
            />
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button
            onClick={loadOrders}
            className="p-2.5 border border-gray-200 hover:border-black rounded-xl text-gray-500 hover:text-black transition-colors"
            title="Reload"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Status Filter Pills + Counts */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('All')}
          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all ${filterStatus === 'All' ? 'bg-black text-white border-black' : 'text-gray-500 border-gray-200 hover:border-black hover:text-black'}`}
        >
          All ({orders.length})
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all ${
              filterStatus === s
                ? 'bg-black text-white border-black'
                : 'text-gray-500 border-gray-200 hover:border-black hover:text-black'
            }`}
          >
            {s} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order Registry</h3>
          <span className="text-xs text-gray-400">{filteredOrders.length} orders</span>
        </div>

        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  <th className="p-4 pl-6">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Update / View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="p-4 pl-6">
                      <span className="font-mono font-bold text-gray-800 tracking-wide text-[11px]">{o.id}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-gray-800 uppercase">{o.customerName}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{o.email}</p>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 font-semibold">{o.itemsCount} items</td>
                    <td className="p-4 font-bold text-gray-900">{formatPrice(o.totalAmount)}</td>
                    <td className="p-4 text-gray-400 font-mono">{o.date}</td>
                    <td className="p-4">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        o.paymentStatus === 'Paid' ? 'bg-green-50 text-green-600 border-green-100' :
                        o.paymentStatus === 'Refunded' ? 'bg-orange-50 text-orange-500 border-orange-100' :
                        o.paymentStatus === 'Failed' ? 'bg-red-50 text-red-500 border-red-100' :
                        'bg-gray-50 text-gray-500 border-gray-100'
                      }`}>
                        {o.paymentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex border text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[o.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value as MockOrder['status'])}
                          className="px-2 py-1.5 border border-gray-200 focus:border-black rounded-lg text-[10px] font-bold focus:outline-none"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <ClipboardList size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No orders found.</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{selectedOrder.orderNumber}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{selectedOrder.date}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={15} />
              </button>
            </div>

            {/* Customer */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer</p>
              <p className="text-sm font-bold text-gray-800">{selectedOrder.customerName}</p>
              <p className="text-xs text-gray-500">{selectedOrder.email}</p>
              {selectedOrder.phone && <p className="text-xs text-gray-500">{selectedOrder.phone}</p>}
            </div>

            {/* Items */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Items</p>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 text-xs">
                    <div>
                      <p className="font-semibold text-gray-800">{item.productName}</p>
                      <p className="text-gray-400">Size: {item.size} · Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-bold text-gray-900">{formatPrice(selectedOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-semibold">{selectedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Status</span>
                <span className="font-semibold">{selectedOrder.paymentStatus}</span>
              </div>
              {selectedOrder.couponCode && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Coupon Applied</span>
                  <span className="font-mono font-bold text-green-600">{selectedOrder.couponCode}</span>
                </div>
              )}
            </div>

            {/* Status Update */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(selectedOrder.id, s)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                      selectedOrder.status === s
                        ? 'bg-black text-white border-black'
                        : 'text-gray-500 border-gray-200 hover:border-black hover:text-black'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
