const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'hooks', 'useCart.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add setDirectCheckoutItem to import
content = content.replace(
  "import { addToCart } from '@/lib/redux/slices/cartSlice';",
  "import { addToCart, setDirectCheckoutItem } from '@/lib/redux/slices/cartSlice';"
);

// 2. Rewrite handleBuyNow
const oldBuyNow = `  const handleBuyNow = (params: AddToCartParams) => {
    const success = handleAddToCart(params);
    if (success) {
      router.push('/cart');
    }
  };`;

const newBuyNow = `  const handleBuyNow = (params: AddToCartParams) => {
    const { size } = params;

    if (!size) {
      dispatch(addToast({ message: 'Please select a size first', type: 'error' }));
      return false;
    }

    dispatch(
      setDirectCheckoutItem({
        selected: true,
        id: params.id,
        slug: params.slug,
        title: params.title,
        brand: params.brand,
        price: params.price,
        discountedPrice: params.discountedPrice || params.price,
        image: params.image,
        quantity: params.quantity || 1,
        size: params.size,
        color: params.color,
      })
    );

    router.push('/checkout');
    return true;
  };`;

content = content.replace(oldBuyNow, newBuyNow);

fs.writeFileSync(filePath, content);
console.log('Successfully patched useCart handleBuyNow');
