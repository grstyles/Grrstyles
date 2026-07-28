import { getAdminClient, getClient, isSupabaseConfigured } from '@/lib/supabase';
import {
  ICustomerRepository,
  CustomerSummary,
  CustomerDetail,
  CustomerAddressItem,
  CustomerWishlistItem,
  CustomerActivityItem,
  MockOrder,
} from './interfaces';

export class SupabaseCustomerRepository implements ICustomerRepository {
  private getDb() {
    if (typeof window !== 'undefined') {
      const client = getClient();
      if (client) return client;
    }
    const admin = getAdminClient();
    if (admin) return admin;
    const client = getClient();
    if (client) return client;
    throw new Error('Supabase client is not available');
  }

  /**
   * Auto-repair missing profiles for registered Auth users.
   */
  private async autoSyncMissingProfiles(authUsers: any[], profiles: any[]): Promise<any[]> {
    const db = this.getDb();
    const existingProfileIds = new Set((profiles || []).map((p) => p.id));
    const missingUsers = (authUsers || []).filter((u) => u.id && !existingProfileIds.has(u.id));

    if (missingUsers.length === 0) return profiles || [];

    const newProfileRows = missingUsers.map((u) => {
      const meta = u.user_metadata || u.raw_user_meta_data || {};
      const fullName = meta.full_name || meta.name || u.email?.split('@')[0] || 'User';
      const role = meta.role === 'admin' ? 'admin' : 'customer';
      return {
        id: u.id,
        email: u.email || '',
        full_name: fullName,
        role: role,
        avatar_url: meta.avatar_url || '',
        created_at: u.created_at || new Date().toISOString(),
      };
    });

    try {
      const { data: upserted, error } = await db
        .from('profiles')
        .upsert(newProfileRows, { onConflict: 'id' })
        .select('*');

      if (!error && upserted) {
        console.log(`[CustomerRepo] Auto-repaired ${upserted.length} missing user profiles`);
        const combined = [...(profiles || [])];
        for (const row of upserted) {
          if (!combined.some((p) => p.id === row.id)) {
            combined.push(row);
          }
        }
        return combined;
      }
    } catch (err) {
      console.warn('[CustomerRepo] Failed to auto-sync missing profiles:', err);
    }

    return profiles || [];
  }

  async getAllCustomers(): Promise<CustomerSummary[]> {
    if (!isSupabaseConfigured()) return [];
    const db = this.getDb();

    // 1. Fetch Auth Users (if admin client available)
    let authUsers: any[] = [];
    try {
      const adminClient = getAdminClient();
      if (adminClient?.auth?.admin) {
        const { data: authData, error: authErr } = await adminClient.auth.admin.listUsers();
        if (!authErr && authData?.users) {
          authUsers = authData.users;
        }
      }
    } catch (e) {
      console.warn('[CustomerRepo] Admin listUsers fallback:', e);
    }

    // 2. Fetch Profiles
    let { data: profiles, error: profileErr } = await db
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileErr) {
      console.error('[CustomerRepo] Error fetching profiles:', profileErr.message);
      profiles = [];
    }

    // Auto-repair missing profiles
    profiles = await this.autoSyncMissingProfiles(authUsers, profiles || []);

    // 3. Fetch Orders
    const { data: orders, error: orderErr } = await db
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (orderErr) {
      console.error('[CustomerRepo] Error fetching orders:', orderErr.message);
    }

    const allOrders = orders || [];

    // 4. Fetch User Addresses to extract phones
    const { data: addresses } = await db.from('user_addresses').select('*');
    const addressMap: Record<string, string> = {};
    if (addresses) {
      for (const addr of addresses) {
        if (addr.user_id && addr.phone && !addressMap[addr.user_id]) {
          addressMap[addr.user_id] = addr.phone;
        }
      }
    }

    const customersMap = new Map<string, CustomerSummary>();

    // Map registered users/profiles
    for (const p of profiles || []) {
      const userAuth = authUsers.find((u) => u.id === p.id);
      const userEmail = (p.email || userAuth?.email || '').toLowerCase().trim();

      // Find user orders
      const userOrders = allOrders.filter(
        (o) =>
          o.user_id === p.id ||
          (o.customer_email && o.customer_email.toLowerCase().trim() === userEmail)
      );

      const validOrders = userOrders.filter((o) => o.status !== 'Cancelled');
      const totalSpent = validOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      const totalOrders = userOrders.length;

      let lastOrderDate: string | null = null;
      if (userOrders.length > 0) {
        lastOrderDate = new Date(userOrders[0].created_at).toISOString().split('T')[0];
      }

      // Phone lookup hierarchy
      const phone =
        addressMap[p.id] ||
        userAuth?.user_metadata?.phone ||
        userOrders.find((o) => o.customer_phone)?.customer_phone ||
        userOrders.find((o) => o.shipping_address?.phone)?.shipping_address?.phone ||
        '';

      const regDate = p.created_at || userAuth?.created_at || new Date().toISOString();
      const formattedRegDate = new Date(regDate).toISOString().split('T')[0];

      const daysSinceReg = Math.floor((Date.now() - new Date(regDate).getTime()) / (1000 * 60 * 60 * 24));
      const isActive = totalOrders > 0 || daysSinceReg <= 90;

      const accountStatus: 'Registered' | 'Admin' = p.role === 'admin' ? 'Admin' : 'Registered';

      const customer: CustomerSummary = {
        id: p.id,
        name: p.full_name || userAuth?.user_metadata?.full_name || userEmail.split('@')[0] || 'Customer',
        email: userEmail,
        phone,
        avatar: p.avatar_url || userAuth?.user_metadata?.avatar_url || '',
        registrationDate: formattedRegDate,
        totalOrders,
        totalSpent,
        lastOrderDate,
        status: isActive ? 'Active' : 'Inactive',
        accountStatus,
      };

      customersMap.set(p.id, customer);
      if (userEmail) {
        customersMap.set(userEmail, customer);
      }
    }

    // Process Guest / Order-only customers who are not in profiles
    for (const order of allOrders) {
      const orderEmail = (order.customer_email || '').toLowerCase().trim();
      const orderUserId = order.user_id;

      if (orderUserId && customersMap.has(orderUserId)) continue;
      if (orderEmail && customersMap.has(orderEmail)) continue;

      // Group guest orders with same email
      const guestEmail = orderEmail || `guest_${order.id}`;
      const guestOrders = allOrders.filter(
        (o) => (o.customer_email || '').toLowerCase().trim() === guestEmail
      );

      const validOrders = guestOrders.filter((o) => o.status !== 'Cancelled');
      const totalSpent = validOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      const totalOrders = guestOrders.length;
      const lastOrderDate = new Date(guestOrders[0].created_at).toISOString().split('T')[0];
      const regDate = new Date(guestOrders[guestOrders.length - 1].created_at).toISOString().split('T')[0];

      const guestCustomer: CustomerSummary = {
        id: `guest_${order.id.slice(0, 8)}`,
        name: order.customer_name || guestEmail.split('@')[0] || 'Guest Customer',
        email: guestEmail,
        phone: order.customer_phone || order.shipping_address?.phone || '',
        avatar: '',
        registrationDate: regDate,
        totalOrders,
        totalSpent,
        lastOrderDate,
        status: 'Active',
        accountStatus: 'Guest',
      };

      customersMap.set(guestCustomer.id, guestCustomer);
      if (guestEmail) {
        customersMap.set(guestEmail, guestCustomer);
      }
    }

    // Return unique values list
    const uniqueCustomers = Array.from(new Set(customersMap.values()));
    return uniqueCustomers.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
  }

  async getCustomerById(idOrEmail: string): Promise<CustomerDetail | null> {
    if (!isSupabaseConfigured() || !idOrEmail) return null;
    const db = this.getDb();

    const allCustomers = await this.getAllCustomers();
    const summary = allCustomers.find(
      (c) => c.id === idOrEmail || c.email.toLowerCase() === idOrEmail.toLowerCase()
    );

    if (!summary) return null;

    // 1. Fetch Orders for this customer
    let { data: orderRows } = await db
      .from('orders')
      .select('*, order_items(*)')
      .or(`user_id.eq.${summary.id},customer_email.ilike.${summary.email}`)
      .order('created_at', { ascending: false });

    const orders: MockOrder[] = (orderRows || []).map((d: any) => {
      const items = (d.order_items || []).map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: Number(item.price),
      }));

      return {
        id: d.id,
        orderNumber: d.order_number,
        customerName: d.customer_name,
        email: d.customer_email || summary.email,
        phone: d.customer_phone || summary.phone,
        itemsCount: items.reduce((s: number, i: any) => s + i.quantity, 0),
        totalAmount: Number(d.total_amount),
        discountAmount: Number(d.discount_amount || 0),
        couponCode: d.coupon_code || undefined,
        status: d.status as MockOrder['status'],
        paymentStatus: d.payment_status as MockOrder['paymentStatus'],
        paymentMethod: d.payment_method || 'Prepaid',
        date: new Date(d.created_at).toISOString().split('T')[0],
        shippingAddress: d.shipping_address,
        items,
      };
    });

    // 2. Fetch Addresses
    const addresses: CustomerAddressItem[] = [];
    if (summary.accountStatus !== 'Guest') {
      const { data: dbAddrs } = await db
        .from('user_addresses')
        .select('*')
        .eq('user_id', summary.id)
        .order('is_default', { ascending: false });

      if (dbAddrs && dbAddrs.length > 0) {
        dbAddrs.forEach((a) => {
          addresses.push({
            id: a.id,
            fullName: a.full_name || summary.name,
            phone: a.phone || summary.phone,
            email: a.email || summary.email,
            addressLine1: a.address_line_1,
            addressLine2: a.address_line_2 || '',
            city: a.city,
            state: a.state,
            pincode: a.pincode,
            country: a.country || 'India',
            isDefault: a.is_default || false,
          });
        });
      }
    }

    // Fallback order shipping addresses if no saved addresses found
    if (addresses.length === 0 && orders.length > 0) {
      orders.forEach((o, idx) => {
        if (o.shippingAddress) {
          const sa = o.shippingAddress;
          addresses.push({
            id: `order_addr_${o.id}`,
            fullName: sa.fullName || sa.name || summary.name,
            phone: sa.phone || summary.phone,
            email: sa.email || summary.email,
            addressLine1: sa.addressLine1 || sa.address || '',
            addressLine2: sa.addressLine2 || '',
            city: sa.city || '',
            state: sa.state || '',
            pincode: sa.pincode || sa.zip || '',
            country: sa.country || 'India',
            isDefault: idx === 0,
          });
        }
      });
    }

    // 3. Fetch Wishlist Items
    const wishlist: CustomerWishlistItem[] = [];
    if (summary.accountStatus !== 'Guest') {
      const { data: wishRows } = await db
        .from('wishlist')
        .select('*, products(id, name, slug, selling_price, images)')
        .eq('user_id', summary.id);

      if (wishRows) {
        wishRows.forEach((w: any) => {
          const p = w.products;
          if (p) {
            let img = '';
            if (Array.isArray(p.images) && p.images.length > 0) img = p.images[0];
            wishlist.push({
              id: w.id,
              productId: p.id,
              productName: p.name,
              slug: p.slug,
              price: Number(p.selling_price || 0),
              image: img,
              addedAt: new Date(w.created_at || Date.now()).toISOString().split('T')[0],
            });
          }
        });
      }
    }

    // 4. Build Activity Timeline
    const activity: CustomerActivityItem[] = [];

    activity.push({
      id: `act_reg_${summary.id}`,
      type: 'registered',
      description:
        summary.accountStatus === 'Guest'
          ? 'First interaction recorded (Guest order)'
          : 'User registered on GR STYLES',
      timestamp: summary.registrationDate,
    });

    orders.forEach((o) => {
      activity.push({
        id: `act_order_${o.id}`,
        type: 'order_placed',
        description: `Placed order #${o.orderNumber} for ₹${o.totalAmount.toLocaleString('en-IN')}`,
        timestamp: o.date,
      });
    });

    addresses.forEach((a) => {
      activity.push({
        id: `act_addr_${a.id}`,
        type: 'address_added',
        description: `Added address in ${a.city}, ${a.state}`,
        timestamp: summary.registrationDate,
      });
    });

    wishlist.forEach((w) => {
      activity.push({
        id: `act_wish_${w.id}`,
        type: 'wishlist_added',
        description: `Saved product "${w.productName}" to Wishlist`,
        timestamp: w.addedAt,
      });
    });

    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const avgOrderValue =
      summary.totalOrders > 0 ? Math.round(summary.totalSpent / summary.totalOrders) : 0;

    return {
      ...summary,
      avgOrderValue,
      orders,
      addresses,
      wishlist,
      activity,
    };
  }
}

export const customerRepository = new SupabaseCustomerRepository();
