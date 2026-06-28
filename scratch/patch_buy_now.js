const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'product', '[slug]', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import setDirectCheckoutItem
if (!content.includes('setDirectCheckoutItem')) {
  content = content.replace(
    "import { addToCart } from '@/lib/redux/slices/cartSlice';",
    "import { addToCart, setDirectCheckoutItem } from '@/lib/redux/slices/cartSlice';"
  );
}

// 2. Change handleBuyNow dispatch
const handleBuyNowStart = content.indexOf('const handleBuyNow = () => {');
const handleBuyNowEnd = content.indexOf('};', handleBuyNowStart) + 2;

const oldBuyNow = content.substring(handleBuyNowStart, handleBuyNowEnd);

const newBuyNow = oldBuyNow.replace(
  /dispatch\(\s*addToCart\(\{/g,
  "dispatch(\n        setDirectCheckoutItem({\n          selected: true,"
);

// We should also ensure we are not printing "added to cart! 🛒" for Buy Now
const replacedToastBuyNow = newBuyNow.replace(
  /dispatch\(addToast\({ message: `\$\{product\.title\} added to cart! 🛒`, type: "success" }\)\);/g,
  ""
);

content = content.replace(oldBuyNow, replacedToastBuyNow);

fs.writeFileSync(filePath, content);
console.log('Successfully patched product page buy now');
