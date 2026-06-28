const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\fe24546d-d625-4a85-8fcf-5ab6ae65a8cf';

(async () => {
  console.log('Starting puppeteer test...');
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: "new",
      executablePath: 'C:\\\\Users\\\\hp\\\\.cache\\\\puppeteer\\\\chrome\\\\win64-151.0.7918.0\\\\chrome-win64\\\\chrome.exe',
      defaultViewport: { width: 1280, height: 800 } 
    });
    const page = await browser.newPage();
    
    // Enable console and network logging
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('requestfailed', request => {
      console.log('NETWORK ERROR:', request.url(), request.failure().errorText);
    });

    console.log('Navigating to homepage to clear storage and find a product...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Clear cart via localStorage
    await page.evaluate(() => {
      localStorage.clear();
      // Optional: If there's a specific persist key
      localStorage.removeItem('persist:root');
    });

    // Go to a known category to find a product reliably
    await page.goto('http://localhost:3000/men', { waitUntil: 'networkidle2' });

    // Find the first product link
    const productUrl = await page.evaluate(() => {
      const link = document.querySelector('a[href^="/product/"]');
      return link ? link.href : null;
    });

    if (!productUrl) {
      throw new Error("Could not find a product link on the page.");
    }
    
    console.log('Navigating to product:', productUrl);
    await page.goto(productUrl, { waitUntil: 'networkidle2' });

    // Wait for product data to render
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take product page screenshot
    const productScreenshot = path.join(brainDir, 'product-page.png');
    await page.screenshot({ path: productScreenshot });
    console.log('Saved product-page.png');

    // Need to select a size to avoid "Please select a size first" error
    console.log('Looking for size options...');
    const sizeSelected = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40'];
      
      for (const btn of allButtons) {
         // Some buttons have extra child elements for out-of-stock strikethrough, so we use firstChild nodeValue or robust trim
         // Just matching exact string 'S', 'M', etc. is fine if it matches.
         const text = btn.innerText.trim();
         if (sizes.includes(text) && !btn.disabled && !btn.className.includes('opacity-50')) {
             btn.click();
             return true;
         }
      }
      return false;
    });
    console.log('Size selected:', sizeSelected);

    // Wait a moment for state to update
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find and click Buy Now
    console.log('Looking for Buy Now button...');
    const clickedBuyNow = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const buyNowBtn = buttons.find(b => b.innerText.toUpperCase().includes('BUY NOW'));
      if (buyNowBtn) {
        buyNowBtn.click();
        return true;
      }
      return false;
    });

    if (!clickedBuyNow) {
      throw new Error("Could not find 'Buy Now' button on product page.");
    }

    console.log('Buy Now clicked. Waiting for navigation...');
    
    // Take a screenshot right after clicking buy now
    await new Promise(resolve => setTimeout(resolve, 500));
    const afterBuyNowScreenshot = path.join(brainDir, 'after-buy-now.png');
    await page.screenshot({ path: afterBuyNowScreenshot });
    console.log('Saved after-buy-now.png');

    // Wait for the URL to change
    await page.waitForNavigation({ timeout: 10000, waitUntil: 'networkidle2' }).catch(e => {
        console.log('Navigation timeout or already happened:', e.message);
    });
    
    // wait a bit for dom
    await new Promise(resolve => setTimeout(resolve, 1000));

    const currentUrl = page.url();
    console.log('Current URL after Buy Now:', currentUrl);

    // Check cart badge count
    const cartBadge = await page.evaluate(() => {
      // Look for the cart icon badge. It might have a specific class.
      // Usually it's an absolute positioned span inside the cart link
      const cartLink = document.querySelector('a[href="/cart"]');
      if (cartLink) {
        const badge = cartLink.querySelector('span');
        return badge ? badge.innerText.trim() : '0';
      }
      return '0';
    });
    console.log('Cart Badge Count:', cartBadge);

    // Capture checkout page title / heading
    const pageHeading = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const h2 = document.querySelector('h2');
      return (h1 ? h1.innerText : '') || (h2 ? h2.innerText : 'Unknown Title');
    });
    console.log('Checkout Page Title/Heading:', pageHeading);

    // Capture product shown in checkout
    const checkoutProducts = await page.evaluate(() => {
      // Typically products are listed in some summary div
      // We can grab text from h3 or divs that look like titles
      const possibleTitles = Array.from(document.querySelectorAll('h3, .text-sm.font-medium, .line-clamp-1'));
      return possibleTitles.map(el => el.innerText.trim()).filter(t => t.length > 0);
    });
    console.log('Products shown in checkout:', checkoutProducts);

    // Take checkout screenshot
    const checkoutScreenshot = path.join(brainDir, 'checkout.png');
    await page.screenshot({ path: checkoutScreenshot });
    console.log('Saved checkout.png');

    if (!currentUrl.includes('/checkout')) {
      console.log('RESULT: FAIL - Did not navigate to checkout.');
    } else {
      console.log('RESULT: PASS - Reached checkout page successfully.');
    }

  } catch (error) {
    console.error('TEST FAILED WITH ERROR:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log('Test complete.');
  }
})();
