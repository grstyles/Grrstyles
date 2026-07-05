const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'ui', 'QuickViewModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import setDirectCheckoutItem
if (!content.includes('setDirectCheckoutItem')) {
  content = content.replace(
    "import { addToCart } from '@/lib/redux/slices/cartSlice';",
    "import { addToCart, setDirectCheckoutItem } from '@/lib/redux/slices/cartSlice';"
  );
}

// 2. Change handleBuyNow
const oldBuyNow = `    setTimeout(() => {
      dispatch(
        addToCart({
          id: product.id,
          slug: product.slug,
          title: product.title,
          brand: product.brand ?? "",
          price: product.price,
          discountedPrice: price,
          image,
          quantity,
          size: selectedSize || undefined,
          color: selectedColor || undefined,
        })
      );

      dispatch(
        addToast({
          message: \`\${product.title} added to cart! 🛒\`,
          type: "success",
        })
      );

      setIsBuying(false);
      onClose();
      router.push("/cart");
    }, 600);`;

const newBuyNow = `    setTimeout(() => {
      dispatch(
        setDirectCheckoutItem({
          selected: true,
          id: product.id,
          slug: product.slug,
          title: product.title,
          brand: product.brand ?? "",
          price: product.price,
          discountedPrice: price,
          image,
          quantity,
          size: selectedSize || undefined,
          color: selectedColor || undefined,
        })
      );

      setIsBuying(false);
      onClose();
      router.push("/checkout");
    }, 600);`;

if (content.includes('addToCart({') && content.includes('router.push("/cart")')) {
    content = content.replace(oldBuyNow, newBuyNow);
    fs.writeFileSync(filePath, content);
    console.log('Successfully patched QuickViewModal buy now');
} else {
    console.log('Could not find exact block in QuickViewModal');
}
