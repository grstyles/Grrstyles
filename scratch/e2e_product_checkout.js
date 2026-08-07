const puppeteer = require('puppeteer');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log('1. Loading Homepage...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    console.log('2. Navigating to Shop collection...');
    await page.goto('http://localhost:3000/men', { waitUntil: 'networkidle0' });
    
    // Pick the first product link
    const productUrl = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href^="/product/"]'));
      return links.length > 0 ? links[0].href : null;
    });
    
    if (!productUrl) throw new Error('No product found on Shop  page');
    console.log(`3. Navigating to Product: ${productUrl}`);
    await page.goto(productUrl, { waitUntil: 'networkidle0' });
    
    // Select Size
    console.log('4. Selecting Size...');
    await page.evaluate(() => {
      // Find all size buttons
      const sizeBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.match(/^(S|M|L|XL|XXL|28|30|32|34|36|38|40|42)$/) && !b.disabled);
      
      // We might have Shirt Size and Pant Size sections. 
      // Click one letter size (Shirt) and one number size (Pant) if available
      const shirtSize = sizeBtns.find(b => b.innerText.match(/^(S|M|L|XL|XXL)$/));
      const pantSize = sizeBtns.find(b => b.innerText.match(/^(28|30|32|34|36|38|40|42)$/));
      
      if (shirtSize) shirtSize.click();
      if (pantSize) pantSize.click();
    });
    await delay(500);

    // Select Color
    console.log('5. Selecting Color...');
    await page.evaluate(() => {
      // Find color buttons
      const colorBtns = Array.from(document.querySelectorAll('button[class*="w-10 h-10 rounded-full"]'));
      if (colorBtns.length > 0) colorBtns[colorBtns.length - 1].click(); // click the last color
    });
    await delay(500);

    console.log('6. Adding to Cart...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('ADD TO CART'));
      if (btns.length > 0) btns[0].click();
    });
    await delay(1000);

    console.log('7. Verifying Cart...');
    await page.screenshot({ path: 'scratch/cart_before.png' });
    await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle0' });
    await delay(1000);
    await page.screenshot({ path: 'scratch/cart_after.png' });
    const cartItemsText = await page.evaluate(() => {
      return document.body.innerText;
    });
    if (!cartItemsText.includes('Checkout')) {
      throw new Error('Cart seems empty or checkout button missing');
    }

    console.log('8. Proceeding to Checkout...');
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle0' });
    
    // Fill Checkout Form
    console.log('9. Filling Checkout Form...');
    await page.type('input[placeholder="Full Name"]', 'Test User');
    await page.type('input[placeholder="Phone Number"]', '9999999999');
    await page.type('input[placeholder="Email Address"]', 'test@test.com');
    await page.type('input[placeholder="Address Line 1"]', '123 Test St');
    await page.type('input[placeholder="City"]', 'Test City');
    await page.type('input[placeholder="State"]', 'Test State');
    await page.type('input[placeholder="Pincode"]', '123456');

    // Select COD
    await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label')).filter(l => l.innerText.includes('Cash on Delivery'));
      if (labels.length > 0) labels[0].click();
    });
    await delay(500);

    console.log('10. Placing Order...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('Place Order'));
      if (btns.length > 0) btns[0].click();
    });
    
    await delay(3000); // Wait for order processing

    const successUrl = page.url();
    console.log('11. Current URL after order:', successUrl);
    if (!successUrl.includes('order-success')) {
      throw new Error('Failed to reach order success page');
    }

    console.log('E2E TEST PASSED: Product -> Checkout -> Success');

  } catch (error) {
    console.error('E2E TEST FAILED:', error);
  } finally {
    await browser.close();
  }
}

run();
