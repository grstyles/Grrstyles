import { Product } from '@/lib/data/products';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mapDbProduct } from './productService';
import { mockStore } from '@/lib/providers/mockStore';

export interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCoupons: number;
}

export interface AdminOrder {
  id: string;
  customerName: string;
  email: string;
  itemsCount: number;
  totalAmount: number;
  status: 'Pending' | 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  paymentStatus?: string;
  orderNumber: string;
  phone?: string;
  address?: any;
}

export interface InventoryItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  sizeStock: { size: string; stock: number }[];
}

const mockOrders: AdminOrder[] = [
  { id: 'ORD-2026-108', orderNumber: 'GR-2026-100108', customerName: 'Rahul Kumar', email: 'rahul.k@gmail.com', itemsCount: 2, totalAmount: 2798, status: 'Pending', date: '2026-06-19', phone: '+91 9876500108' },
  { id: 'ORD-2026-107', orderNumber: 'GR-2026-100107', customerName: 'Arjun Sharma', email: 'arjun.s@gmail.com', itemsCount: 1, totalAmount: 1499, status: 'Confirmed', date: '2026-06-19', phone: '+91 9876500107' },
  { id: 'ORD-2026-106', orderNumber: 'GR-2026-100106', customerName: 'Vikram Singh', email: 'vikram.s@gmail.com', itemsCount: 3, totalAmount: 4497, status: 'Packed', date: '2026-06-18', phone: '+91 9876500106' },
  { id: 'ORD-2026-105', orderNumber: 'GR-2026-100105', customerName: 'Sanjay Patel', email: 'sanjay.p@gmail.com', itemsCount: 2, totalAmount: 3398, status: 'Shipped', date: '2026-06-18', phone: '+91 9876500105' },
  { id: 'ORD-2026-104', orderNumber: 'GR-2026-100104', customerName: 'Nikhil Mehta', email: 'nikhil.m@gmail.com', itemsCount: 1, totalAmount: 1199, status: 'Delivered', date: '2026-06-17', phone: '+91 9876500104' },
  { id: 'ORD-2026-103', orderNumber: 'GR-2026-100103', customerName: 'Rohan Verma', email: 'rohan.v@gmail.com', itemsCount: 3, totalAmount: 5697, status: 'Delivered', date: '2026-06-17', phone: '+91 9876500103' },
  { id: 'ORD-2026-102', orderNumber: 'GR-2026-100102', customerName: 'Deepak Nair', email: 'deepak.n@gmail.com', itemsCount: 1, totalAmount: 1999, status: 'Cancelled', date: '2026-06-16', phone: '+91 9876500102' },
  { id: 'ORD-2026-101', orderNumber: 'GR-2026-100101', customerName: 'Aakash Gupta', email: 'aakash.g@gmail.com', itemsCount: 2, totalAmount: 3298, status: 'Returned', date: '2026-06-15', phone: '+91 9876500101' },
];

export const adminService = {
  async getDashboardStats(): Promise<AdminStats> {
    const products = mockStore.getProducts();
    if (!isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        totalProducts: products.length,
        totalOrders: 142,
        totalRevenue: 284500,
        totalCoupons: 3,
      };
    }

    try {
      // 1. Total Products
      const { count: prodCount } = await supabase!
        .from('products')
        .select('*', { count: 'exact', head: true });

      // 2. Total Orders
      const { count: orderCount } = await supabase!
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // 3. Active Coupons
      const { count: couponCount } = await supabase!
        .from('coupons')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // 4. Total Revenue
      const { data: revenueData } = await supabase!
        .from('orders')
        .select('total_amount')
        .neq('status', 'Cancelled');

      const rev = (revenueData || []).reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

      return {
        totalProducts: prodCount || 0,
        totalOrders: orderCount || 0,
        totalRevenue: rev || 0,
        totalCoupons: couponCount || 0,
      };
    } catch (e) {
      return {
        totalProducts: products.length,
        totalOrders: 142,
        totalRevenue: 284500,
        totalCoupons: 3,
      };
    }
  },

  async getOrders(): Promise<AdminOrder[]> {
    if (!isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return mockOrders;
    }

    try {
      const { data, error } = await supabase!
        .from('orders')
        .select(`
          *,
          order_items (quantity)
        `)
        .order('created_at', { ascending: false });

      if (error || !data) throw error;

      return data.map((d: any) => {
        const itemsCount = (d.order_items || []).reduce((sum: number, it: any) => sum + (it.quantity || 0), 0);
        return {
          id: d.id,
          orderNumber: d.order_number,
          customerName: d.customer_name,
          email: d.email,
          phone: d.phone,
          address: d.shipping_address,
          itemsCount,
          totalAmount: Number(d.total_amount),
          status: d.status as any,
          paymentStatus: d.payment_status,
          date: new Date(d.created_at).toISOString().split('T')[0],
        };
      });
    } catch (e) {
      return mockOrders;
    }
  },

  async updateOrderStatus(orderId: string, status: AdminOrder['status']): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const order = mockOrders.find((o) => o.id === orderId);
      if (order) {
        order.status = status;
        return true;
      }
      return false;
    }

    try {
      // Map legacy statuses if any
      const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
      const { error } = await supabase!
        .from('orders')
        .update({ status: normalizedStatus })
        .eq('id', orderId);

      return !error;
    } catch (e) {
      return false;
    }
  },

  async getInventory(): Promise<InventoryItem[]> {
    const products = mockStore.getProducts();
    if (!isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return products.map((p) => {
        const sizesArray = p.sizes || [];
        const sizeStock = sizesArray.map((s) => ({
          size: s.size,
          stock: s.stock,
        }));
        return {
          id: p.id,
          name: p.name || p.title || '',
          slug: p.slug,
          category: p.category,
          sizeStock,
        };
      });
    }

    try {
      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .order('category', { ascending: true });

      if (error || !data) throw error;

      return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        category: d.category,
        sizeStock: d.sizes || [],
      }));
    } catch (e) {
      return products.map((p) => {
        const sizesArray = p.sizes || [];
        const sizeStock = sizesArray.map((s) => ({
          size: s.size,
          stock: s.stock,
        }));
        return {
          id: p.id,
          name: p.name || p.title || '',
          slug: p.slug,
          category: p.category,
          sizeStock,
        };
      });
    }
  },

  async updateInventoryStock(productId: string, size: string, newStock: number): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      console.log(`Simulated Inventory update: Product ${productId}, Size ${size}, Stock ${newStock}`);
      return true;
    }

    try {
      // 1. Fetch current product sizes array
      const { data, error: fetchError } = await supabase!
        .from('products')
        .select('sizes')
        .eq('id', productId)
        .single();

      if (fetchError || !data) return false;

      const currentSizes = data.sizes || [];
      const updatedSizes = currentSizes.map((s: any) => 
        s.size === size ? { ...s, stock: Math.max(0, newStock) } : s
      );

      // If size is not present, add it
      if (!currentSizes.some((s: any) => s.size === size)) {
        updatedSizes.push({ size, stock: Math.max(0, newStock) });
      }

      // 2. Write updated sizes array back
      const { error: updateError } = await supabase!
        .from('products')
        .update({ sizes: updatedSizes })
        .eq('id', productId);

      return !updateError;
    } catch (e) {
      return false;
    }
  },
};

