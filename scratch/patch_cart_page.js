const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'cart', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add setDirectCheckoutItem to import if not present
if (!content.includes('setDirectCheckoutItem')) {
  content = content.replace(
    "removeFromCart, updateQuantity, applyPromo, removePromo, toggleSelectItem, toggleSelectAllItems }",
    "removeFromCart, updateQuantity, applyPromo, removePromo, toggleSelectItem, toggleSelectAllItems, setDirectCheckoutItem }"
  );
}

// Add useEffect to clear directCheckoutItem on mount
if (!content.includes('dispatch(setDirectCheckoutItem(null))')) {
  const useEffectImport = content.includes("import { useState, useEffect } from 'react';") 
    ? "" 
    : content.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';");
  
  if (useEffectImport) {
    content = useEffectImport;
  }

  const hookTarget = 'export default function CartPage() {\n  const dispatch = useDispatch();';
  const hookInjection = `export default function CartPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Clear any Buy Now items when visiting the normal cart
    dispatch(setDirectCheckoutItem(null));
  }, [dispatch]);
`;
  content = content.replace(hookTarget, hookInjection);
}

fs.writeFileSync(filePath, content);
console.log('Successfully patched cart page');
