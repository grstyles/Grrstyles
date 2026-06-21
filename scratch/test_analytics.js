const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = '';
let supabaseKey = '';

const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = value;
    }
  });
}

if (supabaseUrl.endsWith('/rest/v1/')) {
  supabaseUrl = supabaseUrl.slice(0, -9);
} else if (supabaseUrl.endsWith('/rest/v1')) {
  supabaseUrl = supabaseUrl.slice(0, -8);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGetFullAnalytics() {
  try {
    console.log('Fetching live tables...');
    const [
      { data: productsData, error: productsError },
      { data: ordersData, error: ordersError },
      { count: couponCount, error: couponError },
    ] = await Promise.all([
      supabase.from('products').select('id, name, sizes, category, sku'),
      supabase.from('orders').select('id, order_number, customer_name, total_amount, status, created_at, items'),
      supabase.from('coupons').select('*', { count: 'exact', head: true }).eq('active', true),
    ]);

    if (productsError) throw productsError;
    if (ordersError) throw ordersError;
    if (couponError) throw couponError;

    const products = productsData || [];
    const orders = ordersData || [];

    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalCoupons = couponCount || 0;

    const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
    const validOrders = orders.filter(
      (o) => o.status !== 'Cancelled' && o.status !== 'Returned'
    );
    const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const avgOrderValue =
      validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

    const couponsUsed = 0;

    // 1. Map of products for lookup
    const productMap = {};
    for (const p of products) {
      productMap[p.id] = {
        sku: p.sku || '',
        category: p.category || 'Other',
      };
    }

    // 2. Top selling products
    const productSales = {};
    for (const order of validOrders) {
      for (const item of order.items || []) {
        const key = item.productId;
        if (!key) continue;
        if (!productSales[key]) {
          const dbProd = productMap[key];
          productSales[key] = {
            name: item.productName || 'Unknown Product',
            sku: dbProd?.sku || `GR-${key.slice(0, 6).toUpperCase()}`,
            sales: 0,
            revenue: 0,
          };
        }
        productSales[key].sales += item.quantity || 0;
        productSales[key].revenue += (item.price || 0) * (item.quantity || 0);
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 3. Top categories
    const categoryRevenue = {};
    for (const order of validOrders) {
      for (const item of order.items || []) {
        const key = item.productId;
        const dbProd = productMap[key];
        const cat = dbProd?.category || 'Other';
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (item.price || 0) * (item.quantity || 0);
      }
    }
    const totalCategoryRevenue = Object.values(categoryRevenue).reduce((a, b) => a + b, 0) || 1;
    const topCategories = Object.entries(categoryRevenue)
      .map(([name, revenue]) => ({
        name,
        value: Math.round((revenue / totalCategoryRevenue) * 100),
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    // 4. Recent orders
    const recentOrders = orders.slice(0, 6).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      totalAmount: Number(o.total_amount || 0),
      status: o.status,
      date: new Date(o.created_at).toISOString().split('T')[0],
    }));

    // 5. Low stock products
    const lowStockProducts = [];
    for (const p of products) {
      const sizesArray = p.sizes || [];
      for (const s of sizesArray) {
        if (s.stock >= 0 && s.stock <= 5) {
          lowStockProducts.push({
            productId: p.id,
            name: p.name,
            size: s.size,
            stock: s.stock,
          });
        }
      }
    }
    lowStockProducts.sort((a, b) => a.stock - b.stock);
    const lowStockCount = lowStockProducts.length;

    // 6. Monthly performance
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};
    for (const order of validOrders) {
      const d = new Date(order.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { revenue: 0, orders: 0 };
      }
      monthlyMap[key].revenue += Number(order.total_amount || 0);
      monthlyMap[key].orders += 1;
    }
    const monthlyPerformance = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, data]) => {
        const monthIdx = parseInt(key.split('-')[1], 10);
        return {
          month: monthNames[monthIdx],
          revenue: data.revenue,
          orders: data.orders,
        };
      });

    // 7. Order status breakdown
    const statusLabels = [
      'Pending',
      'Confirmed',
      'Packed',
      'Shipped',
      'Delivered',
      'Cancelled',
      'Returned',
    ];
    const orderStatusBreakdown = statusLabels.map((label) => ({
      label,
      count: orders.filter((o) => o.status === label).length,
    }));

    const result = {
      totalProducts,
      totalOrders,
      totalRevenue,
      totalCoupons,
      lowStockCount,
      pendingOrders,
      avgOrderValue,
      couponsUsed,
      topProducts,
      topCategories,
      recentOrders,
      lowStockProducts: lowStockProducts.slice(0, 10),
      monthlyPerformance,
      orderStatusBreakdown,
    };

    console.log('Resulting analytics structure:', JSON.stringify(result, null, 2));

  } catch (e) {
    console.error('Test failed:', e);
  }
}

testGetFullAnalytics();
