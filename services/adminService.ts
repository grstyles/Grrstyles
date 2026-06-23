import { Product } from '@/lib/data/products';
import { supabase } from '@/lib/supabase';
import { mapDbProduct } from './productService';

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

export const adminService = {
  async getDashboardStats(): Promise<AdminStats> {
    // 1. Total Products
    const { count: prodCount, error: prodErr } = await supabase!
      .from('products')
      .select('*', { count: 'exact', head: true });
    if (prodErr) throw prodErr;

    // 2. Total Orders
    const { count: orderCount, error: orderErr } = await supabase!
      .from('orders')
      .select('*', { count: 'exact', head: true });
    if (orderErr) throw orderErr;

    // 3. Active Coupons
    const { count: couponCount, error: couponErr } = await supabase!
      .from('coupons')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);
    if (couponErr) throw couponErr;

    // 4. Total Revenue
    const { data: revenueData, error: revenueErr } = await supabase!
      .from('orders')
      .select('total_amount')
      .neq('status', 'Cancelled');
    if (revenueErr) throw revenueErr;

    const rev = (revenueData || []).reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    return {
      totalProducts: prodCount || 0,
      totalOrders: orderCount || 0,
      totalRevenue: rev || 0,
      totalCoupons: couponCount || 0,
    };
  },

  async getOrders(): Promise<AdminOrder[]> {
    const { data, error } = await supabase!
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((d: any) => {
      const itemsCount = (d.items || []).reduce((sum: number, it: any) => sum + (it.quantity || 0), 0);
      return {
        id: d.id,
        orderNumber: d.order_number,
        customerName: d.customer_name,
        email: d.customer_email || '',
        phone: d.customer_phone || '',
        address: d.shipping_address,
        itemsCount,
        totalAmount: Number(d.total_amount),
        status: d.status as any,
        paymentStatus: d.payment_status,
        date: new Date(d.created_at).toISOString().split('T')[0],
      };
    });
  },

  async updateOrderStatus(orderId: string, status: AdminOrder['status']): Promise<boolean> {
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    const { error } = await supabase!
      .from('orders')
      .update({ status: normalizedStatus })
      .eq('id', orderId);

    if (error) throw error;
    return true;
  },

  async getInventory(): Promise<InventoryItem[]> {
    const { data, error } = await supabase!
      .from('products')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      category: d.category,
      sizeStock: d.sizes || [],
    }));
  },

  async updateInventoryStock(productId: string, size: string, newStock: number): Promise<boolean> {
    // 1. Fetch current product sizes array
    const { data, error: fetchError } = await supabase!
      .from('products')
      .select('sizes')
      .eq('id', productId)
      .single();

    if (fetchError) throw fetchError;
    if (!data) throw new Error('Product not found');

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

    if (updateError) throw updateError;
    return true;
  },
};
