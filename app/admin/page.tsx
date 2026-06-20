'use client';

import React, { useState, useEffect } from 'react';
import { repo, FullAnalytics } from '@/lib/repositories';
import { config } from '@/lib/config';
import { formatPrice } from '@/lib/utils/helpers';
import {
  ShoppingBag, ClipboardList, DollarSign, Tag,
  ArrowRight, TrendingUp, AlertTriangle, Package,
  CheckCircle2, Clock, Truck, XCircle
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

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<FullAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await repo.analytics.getFullAnalytics();
        setAnalytics(data);
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

  const statCards = [
    {
      name: 'Total Products',
      value: analytics?.totalProducts ?? 0,
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-600',
      href: '/admin/products',
      change: 'Live catalog count',
    },
    {
      name: 'Total Orders',
      value: analytics?.totalOrders ?? 0,
      icon: ClipboardList,
      color: 'bg-green-50 text-green-600',
      href: '/admin/orders',
      change: `${analytics?.pendingOrders ?? 0} pending`,
    },
    {
      name: 'Total Revenue',
      value: formatPrice(analytics?.totalRevenue ?? 0),
      icon: DollarSign,
      color: 'bg-amber-50 text-amber-600',
      href: '/admin/analytics',
      change: `AOV ${formatPrice(analytics?.avgOrderValue ?? 0)}`,
    },
    {
      name: 'Active Coupons',
      value: analytics?.totalCoupons ?? 0,
      icon: Tag,
      color: 'bg-purple-50 text-purple-600',
      href: '/admin/coupons',
      change: `${analytics?.couponsUsed ?? 0} total uses`,
    },
    {
      name: 'Low Stock Items',
      value: analytics?.lowStockCount ?? 0,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-500',
      href: '/admin/inventory',
      change: 'Needs attention',
      highlight: true,
    },
  ];

  const recentActivity = [
    ...(analytics?.recentOrders.slice(0, 3).map((o) => ({
      text: `Order ${o.orderNumber} from ${o.customerName} — ${formatPrice(o.totalAmount)}`,
      time: o.date,
      type: 'info' as const,
    })) || []),
    ...(analytics?.lowStockProducts.slice(0, 2).map((p) => ({
      text: `Stock low alert: ${p.name} (${p.size} → ${p.stock} unit${p.stock === 1 ? '' : 's'})`,
      time: 'Live',
      type: 'warning' as const,
    })) || []),
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.name}
            href={card.href}
            className={`bg-white border rounded-2xl p-5 space-y-3 hover:shadow-md transition-all duration-200 group ${
              card.highlight ? 'border-red-100' : 'border-gray-100'
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <ClipboardList size={14} className="text-gray-400" />
            Order Status Breakdown
          </h3>
          <div className="space-y-3">
            {(analytics?.orderStatusBreakdown || [])
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
              })}
          </div>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-black transition-colors uppercase tracking-wider pt-2 border-t border-gray-100"
          >
            View all orders <ArrowRight size={11} />
          </Link>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={14} className="text-gray-400" />
            Recent Activity
          </h3>
          <div className="space-y-3 divide-y divide-gray-50">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3 pt-3 first:pt-0">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    (activity.type as string) === 'success' ? 'bg-green-400' :
                    activity.type === 'warning' ? 'bg-amber-400' :
                    'bg-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 font-light leading-relaxed">{activity.text}</p>
                    <p className="text-[10px] text-gray-300 font-mono mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">No recent activity yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

        <div className="bg-white border border-red-50 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={14} />
            Low Stock Alerts
          </h3>
          <div className="space-y-2.5">
            {(analytics?.lowStockProducts || []).slice(0, 5).map((item, i) => (
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
            ))}
            {(analytics?.lowStockProducts.length || 0) === 0 && (
              <p className="text-xs text-gray-400">All products are well stocked.</p>
            )}
          </div>
          <Link
            href="/admin/inventory"
            className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-600 transition-colors uppercase tracking-wider"
          >
            Manage Inventory <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}
