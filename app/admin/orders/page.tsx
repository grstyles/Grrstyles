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
      {/* Rest of your existing JSX stays exactly the same */}
      {/* ... all your existing UI code ... */}
    </div>
  );
}