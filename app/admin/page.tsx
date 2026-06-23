'use client';

import React, { useState, useEffect } from 'react';
import { repo, FullAnalytics, InventoryEntry } from '@/lib/repositories';
import { config } from '@/lib/config';
import {
  ShoppingBag, ClipboardList, DollarSign, Tag,
  ArrowRight, TrendingUp, AlertTriangle, Package,
  CheckCircle2, Clock, Truck, XCircle, BarChart3,
  ListOrdered
} from 'lucide-react';
import Link from 'next/link';

const STATUS_ICONS: Record<string, React.ElementType> = {
  Pending: Clock,
  Confirmed: CheckCircle2,
  Packed: Package,
  Shipped: Truck,
  Delivered: CheckCircle2,
  Cancelled: XCircle,
  Returned: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  Pending: 'text-purple-500 bg-purple-50',
  Confirmed: 'text-blue-500 bg-blue-50',
  Packed: 'text-indigo-500 bg-indigo-50',
  Shipped: 'text-amber-500 bg-amber-50',
  Delivered: 'text-green-500 bg-green-50',
  Cancelled: 'text-red-400 bg-red-50',
  Returned: 'text-orange-500 bg-orange-50',
};

const formatDashboardPrice = (val: number) => {
  return '₹' + Math.round(val).toLocaleString('en-IN');
};

const EmptyChartState = () => (
  <div className="relative h-48 w-full border-b border-l border-gray-200 mt-4 flex items-center justify-center">
    <div className="absolute left-0 right-0 border-t border-gray-50 top-1/4" />
    <div className="absolute left-0 right-0 border-t border-gray-50 top-2/4" />
    <div className="absolute left-0 right-0 border-t border-gray-50 top-3/4" />
    <span className="relative z-10 text-[10px] text-gray-400 font-light bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm uppercase tracking-wider text-center max-w-[280px]">
      Analytics will appear when products and orders are available.
    </span>
  </div>
);

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<FullAnalytics | null>(null);
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [performanceTab, setPerformanceTab] = useState<'revenue' | 'orders'>('revenue');

  useEffect(() => {
    async function loadStats() {
      try {
        const [statsData, invData] = await Promise.all([
          repo.analytics.getFullAnalytics(),
          repo.products.getInventory()
        ]);
        setAnalytics(statsData);
        setInventory(invData);
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 uppercase tracking-widest">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const hasData = (analytics?.totalProducts ?? 0) > 0 || (analytics?.totalOrders ?? 0) > 0;

  const statCards = [
    {
      name: 'Total Products',
      value: analytics?.totalProducts ?? 0,
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-600',
      href: '/admin/products',
      change: (analytics?.totalProducts ?? 0) === 0 ? '0 Products' : 'Live catalog count',
    },
    {
      name: 'Total Orders',
      value: analytics?.totalOrders ?? 0,
      icon: ClipboardList,
      color: 'bg-green-50 text-green-600',
      href: '/admin/orders',
      change: (analytics?.totalOrders ?? 0) === 0 ? '0 Orders' : `${analytics?.pendingOrders ?? 0} pending`,
    },
    {
      name: 'Total Revenue',
      value: formatDashboardPrice(analytics?.totalRevenue ?? 0),
      icon: DollarSign,
      color: 'bg-amber-50 text-amber-600',
      href: '/admin/analytics',
      change: `AOV ${formatDashboardPrice(analytics?.avgOrderValue ?? 0)}`,
    },
    {
      name: 'Active Coupons',
      value: analytics?.totalCoupons ?? 0,
      icon: Tag,
      color: 'bg-purple-50 text-purple-600',
      href: '/admin/coupons',
      change: hasData ? `${analytics?.couponsUsed ?? 0} total uses` : '0 Active',
    },
    {
      name: 'Low Stock Items',
      value: analytics?.lowStockCount ?? 0,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-500',
      href: '/admin/inventory',
      change: 'Needs attention',
      highlight: (analytics?.lowStockCount ?? 0) > 0,
    },
  ];

  const recentActivity = [
    ...(analytics?.recentOrders.slice(0, 3).map((o) => ({
      text: `Order ${o.orderNumber} from ${o.customerName} — ${formatDashboardPrice(o.totalAmount)}`,
      time: o.date,
      type: 'info' as const,
    })) || []),
    ...(analytics?.lowStockProducts.slice(0, 2).map((p) => ({
      text: `Stock low alert: ${p.name} (${p.size} → ${p.stock} unit${p.stock === 1 ? '' : 's'})`,
      time: 'Live',
      type: 'warning' as const,
    })) || []),
  ];

  const activeStatusCount = (analytics?.orderStatusBreakdown || []).filter(item => item.count > 0).length;

  // Monthly Performance Chart Variables
  const monthlyData = analytics?.monthlyPerformance || [];
  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue), 1);
  const maxOrders = Math.max(...monthlyData.map((d) => d.orders), 1);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900 uppercase">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Welcome back. Here&apos;s what&apos;s happening at GR Styles.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-white border border-gray-100 px-4 py-2 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          {config.demoMode ? 'DEMO MODE ACTIVE' : 'LIVE MODE'}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.name}
            href={card.href}
            className={`bg-white border rounded-2xl p-5 space-y-3 hover:shadow-md transition-all duration-200 group ${
              card.highlight ? 'border-red-100 bg-red-50/10' : 'border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">{card.name}</span>
              <div className={`p-2 rounded-xl ${card.color}`}>
                <card.icon size={15} />
              </div>
            </div>
            <div>
              <span className={`text-2xl font-bold tracking-tight ${card.highlight ? 'text-red-500' : 'text-gray-900'}`}>
                {card.value}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-light">{card.change}</span>
              <ArrowRight size={12} className="text-gray-300 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {/* Monthly Performance Chart & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Performance Chart Widget */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={14} className="text-gray-400" />
              Monthly Performance
            </h3>
            {hasData && monthlyData.length > 0 && (
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setPerformanceTab('revenue')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                    performanceTab === 'revenue' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setPerformanceTab('orders')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                    performanceTab === 'orders' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Orders
                </button>
              </div>
            )}
          </div>

          {hasData && monthlyData.length > 0 ? (
            <div className="flex items-end gap-3 h-48 pt-4">
              {monthlyData.map((d, i) => {
                const val = performanceTab === 'revenue' ? d.revenue : d.orders;
                const maxVal = performanceTab === 'revenue' ? maxRevenue : maxOrders;
                const heightPct = (val / maxVal) * 100;
                const isLast = i === monthlyData.length - 1;
                return (
                  <div key={`${d.month}-${i}`} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center justify-end" style={{ height: '160px' }}>
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          isLast ? 'bg-black' : 'bg-gray-200 hover:bg-gray-700'
                        }`}
                        style={{ height: `${heightPct}%`, minHeight: '8px' }}
                        title={performanceTab === 'revenue' ? formatDashboardPrice(d.revenue) : `${d.orders} orders`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">{d.month}</span>
                    <span className="text-[9px] font-bold text-gray-600 hidden sm:block">
                      {performanceTab === 'revenue' ? formatDashboardPrice(d.revenue) : `${d.orders}`}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyChartState />
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <ClipboardList size={14} className="text-gray-400" />
            Order Status Breakdown
          </h3>
          <div className="space-y-3">
            {activeStatusCount > 0 ? (
              (analytics?.orderStatusBreakdown || [])
                .filter((item) => item.count > 0)
                .map((item) => {
                  const Icon = STATUS_ICONS[item.label] || Clock;
                  const color = STATUS_COLORS[item.label] || 'text-gray-500 bg-gray-50';
                  return (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${color}`}>
                          <Icon size={12} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{item.count}</span>
                    </div>
                  );
                })
            ) : (
              (analytics?.orderStatusBreakdown || []).map((item) => {
                const Icon = STATUS_ICONS[item.label] || Clock;
                const color = STATUS_COLORS[item.label] || 'text-gray-500 bg-gray-50';
                return (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${color}`}>
                        <Icon size={12} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">0</span>
                  </div>
                );
              })
            )}
          </div>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-black transition-colors uppercase tracking-wider pt-2 border-t border-gray-100"
          >
            View all orders <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {/* Sales by Category Chart & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={14} className="text-gray-400" />
            Sales by Category
          </h3>
          <div className="space-y-4">
            {hasData && analytics?.topCategories && analytics.topCategories.length > 0 ? (
              analytics.topCategories.map((cat) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-700 uppercase tracking-wide">{cat.name}</span>
                    <span className="text-gray-400 font-mono">{cat.value}% · {formatDashboardPrice(cat.revenue)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-900 rounded-full transition-all duration-700"
                      style={{ width: `${cat.value}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyChartState />
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Package size={14} className="text-gray-400" />
            Top Selling Products
          </h3>
          <div className="space-y-3">
            {hasData && analytics?.topProducts && analytics.topProducts.length > 0 ? (
              analytics.topProducts.map((product, i) => (
                <div key={product.sku} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{product.name}</p>
                    <p className="text-[10px] font-mono text-gray-400">{product.sku}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-gray-900">{formatDashboardPrice(product.revenue)}</p>
                    <p className="text-[10px] text-gray-400">{product.sales} sold</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-gray-100 rounded-xl">
                <Package size={24} className="text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">No products available.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Overview */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <ListOrdered size={14} className="text-gray-400" />
            Inventory Overview
          </h3>
          <div className="space-y-3">
            {inventory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                      <th className="p-3 pl-5">Product</th>
                      <th className="p-3">Sizes</th>
                      <th className="p-3 text-right pr-5">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inventory.slice(0, 5).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="p-3 pl-5">
                          <div>
                            <p className="font-bold text-gray-800 uppercase text-[11px]">{item.name}</p>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase">{item.category}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {item.sizeStock.map((ss) => (
                              <span key={ss.size} className="text-[9px] bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md font-mono font-semibold">
                                {ss.size}:{ss.stock}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-right pr-5">
                          <span className="font-bold text-xs text-gray-900">
                            {item.sizeStock.reduce((acc, ss) => acc + ss.stock, 0)} Units
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-gray-100 rounded-xl">
                <Package size={24} className="text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">No inventory data available.</p>
              </div>
            )}
          </div>
          <Link
            href="/admin/inventory"
            className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-black transition-colors uppercase tracking-wider pt-2 border-t border-gray-100"
          >
            Manage inventory <ArrowRight size={11} />
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={14} className="text-gray-400" />
            Recent Activity
          </h3>
          <div className="space-y-3 divide-y divide-gray-50">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3 pt-3 first:pt-0">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    activity.type === 'info' ? 'bg-blue-400' : 'bg-amber-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 font-light leading-relaxed">{activity.text}</p>
                    <p className="text-[10px] text-gray-300 font-mono mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-gray-100 rounded-xl">
                <p className="text-xs text-gray-400">No activity yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white border border-red-50 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={14} />
            Low Stock Alerts
          </h3>
          <div className="space-y-2.5">
            {analytics?.lowStockProducts && analytics.lowStockProducts.length > 0 ? (
              analytics.lowStockProducts.slice(0, 5).map((item, i) => (
                <div key={`${item.productId}-${item.size}-${i}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{item.name}</p>
                    <p className="text-[10px] text-gray-400">Size: {item.size}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    item.stock === 1 ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
                  }`}>
                    {item.stock} left
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-4">
                {(analytics?.totalProducts ?? 0) === 0 ? 'No products available.' : 'All products are well stocked.'}
              </p>
            )}
          </div>
          <Link
            href="/admin/inventory"
            className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-600 transition-colors uppercase tracking-wider"
          >
            Manage Inventory <ArrowRight size={11} />
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Actions</h3>
          <div className="flex flex-col gap-2 pt-1">
            <Link
              href="/admin/products"
              id="dashboard-add-product"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-black hover:bg-gray-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider text-center transition-colors"
            >
              <Package size={13} />
              Add New Product
            </Link>
            <Link
              href="/admin/coupons"
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 hover:border-black text-black rounded-xl text-xs font-semibold uppercase tracking-wider text-center transition-colors"
            >
              <Tag size={13} />
              Create Coupon
            </Link>
            <Link
              href="/admin/analytics"
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 hover:border-black text-black rounded-xl text-xs font-semibold uppercase tracking-wider text-center transition-colors"
            >
              <TrendingUp size={13} />
              View Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
