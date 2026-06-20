'use client';

import React, { useState, useEffect } from 'react';
import { repo, FullAnalytics } from '@/lib/repositories';
import { config } from '@/lib/config';
import { formatPrice } from '@/lib/utils/helpers';
import {
  BarChart3, TrendingUp, ShoppingBag,
  DollarSign, Package, ArrowUp, ArrowDown, Tag
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<FullAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'revenue' | 'orders'>('revenue');

  useEffect(() => {
    async function load() {
      try {
        const data = await repo.analytics.getFullAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const revenueData = analytics.monthlyPerformance.length > 0
    ? analytics.monthlyPerformance
    : [{ month: 'Current', revenue: analytics.totalRevenue, orders: analytics.totalOrders }];

  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1);
  const maxOrders = Math.max(...revenueData.map((d) => d.orders), 1);

  const kpiCards = [
    {
      label: 'Total Revenue',
      value: formatPrice(analytics.totalRevenue),
      change: `${analytics.totalOrders} orders`,
      up: true,
      icon: DollarSign,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Total Orders',
      value: String(analytics.totalOrders),
      change: `${analytics.pendingOrders} pending`,
      up: true,
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Avg Order Value',
      value: formatPrice(analytics.avgOrderValue),
      change: `${analytics.totalProducts} products`,
      up: true,
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Coupons Used',
      value: String(analytics.couponsUsed),
      change: `${analytics.totalCoupons} active`,
      up: true,
      icon: Tag,
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900 uppercase">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">Store performance overview · Live from MockStore</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl">
          <span className={`w-2 h-2 rounded-full animate-pulse ${config.demoMode ? 'bg-amber-400' : 'bg-green-400'}`} />
          {config.demoMode ? 'DEMO DATA' : 'LIVE DATA'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</span>
              <div className={`p-2 rounded-xl ${card.color}`}>
                <card.icon size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <div className="flex items-center gap-1">
              {card.up ? (
                <ArrowUp size={11} className="text-green-500" />
              ) : (
                <ArrowDown size={11} className="text-red-500" />
              )}
              <span className={`text-[10px] font-semibold ${card.up ? 'text-green-500' : 'text-red-500'}`}>
                {card.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 size={15} className="text-gray-400" />
            Monthly Performance
          </h3>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'revenue' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'orders' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'
              }`}
            >
              Orders
            </button>
          </div>
        </div>

        <div className="flex items-end gap-3 h-48 pt-4">
          {revenueData.map((d, i) => {
            const val = activeTab === 'revenue' ? d.revenue : d.orders;
            const maxVal = activeTab === 'revenue' ? maxRevenue : maxOrders;
            const heightPct = (val / maxVal) * 100;
            const isLast = i === revenueData.length - 1;
            return (
              <div key={`${d.month}-${i}`} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end" style={{ height: '160px' }}>
                  <div
                    className={`w-full rounded-t-xl transition-all duration-500 ${
                      isLast ? 'bg-black' : 'bg-gray-200 hover:bg-gray-700'
                    }`}
                    style={{ height: `${heightPct}%`, minHeight: '8px' }}
                    title={activeTab === 'revenue' ? formatPrice(d.revenue) : `${d.orders} orders`}
                  />
                </div>
                <span className="text-[10px] font-mono text-gray-400">{d.month}</span>
                <span className="text-[9px] font-bold text-gray-600 hidden sm:block">
                  {activeTab === 'revenue' ? formatPrice(d.revenue) : `${d.orders}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={15} className="text-gray-400" />
            Sales by Category
          </h3>
          <div className="space-y-4">
            {analytics.topCategories.length > 0 ? analytics.topCategories.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700 uppercase tracking-wide">{cat.name}</span>
                  <span className="text-gray-400 font-mono">{cat.value}% · {formatPrice(cat.revenue)}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-900 rounded-full transition-all duration-700"
                    style={{ width: `${cat.value}%` }}
                  />
                </div>
              </div>
            )) : (
              <p className="text-xs text-gray-400">No category sales data yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <Package size={15} className="text-gray-400" />
            Top Selling Products
          </h3>
          <div className="space-y-3">
            {analytics.topProducts.length > 0 ? analytics.topProducts.map((product, i) => (
              <div key={product.sku} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{product.name}</p>
                  <p className="text-[10px] font-mono text-gray-400">{product.sku}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-gray-900">{formatPrice(product.revenue)}</p>
                  <p className="text-[10px] text-gray-400">{product.sales} sold</p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-gray-400">No product sales data yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Recent Orders</h3>
          <div className="space-y-3">
            {analytics.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-xs font-semibold text-gray-800">{order.orderNumber}</p>
                  <p className="text-[10px] text-gray-400">{order.customerName} · {order.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold">{formatPrice(order.totalAmount)}</p>
                  <p className="text-[10px] text-gray-400">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Low Stock Products</h3>
          <div className="space-y-3">
            {analytics.lowStockProducts.slice(0, 8).map((item, i) => (
              <div key={`${item.productId}-${item.size}-${i}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-xs font-semibold text-gray-800">{item.name}</p>
                  <p className="text-[10px] text-gray-400">Size: {item.size}</p>
                </div>
                <span className="text-xs font-bold text-amber-600">{item.stock} left</span>
              </div>
            ))}
            {analytics.lowStockProducts.length === 0 && (
              <p className="text-xs text-gray-400">No low stock items.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
