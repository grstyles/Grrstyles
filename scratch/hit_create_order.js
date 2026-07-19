require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  // Fetch a product ID
  const { data: products, error: prodErr } = await supabase.from('products').select('id, name, selling_price').limit(1);
  if (prodErr || !products || products.length === 0) {
    console.error("Failed to fetch products:", prodErr);
    process.exit(1);
  }
  const product = products[0];
  console.log("Using product for test:", product);

  const payload = {
    items: [
      {
        productId: product.id,
        quantity: 1
      }
    ],
    couponCode: null,
    receipt: `rcpt_${Date.now()}`,
    customerName: "Test Customer",
    email: "test@example.com",
    phone: "1234567890",
    shippingAddress: {
      address: "123 Test St",
      city: "Test City",
      state: "TS",
      zip: "12345",
      country: "India"
    }
  };

  try {
    const response = await fetch('http://localhost:3001/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const resData = await response.json();
    console.log("Create Order Response:", resData);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
run();
