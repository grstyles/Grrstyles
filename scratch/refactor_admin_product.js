const fs = require('fs');
const path = './app/admin/products/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update CATEGORIES
content = content.replace(/const CATEGORIES = \[[\s\S]*?\];/, `const CATEGORIES = [
  'Shirts',
  'Printed Shirts',
  'T-Shirts',
  'Formal Shirts',
  'Combo Offers',
  'Korean Collection',
  'Baggy Pants',
  'Korean Trousers',
  'Shoes',
  'Traditional Collection',
  'Festival Collection',
  'Trending Collection',
  'Jackets',
  'Night Tracks',
  'Accessories',
  'Formal Combo',
  'Formal Pant',
  'Trousers',
  'Denim Jeans',
  'Festival Offers',
  'Weekend Offers'
];`);

// 2. Remove sizesInput state, add new ones
content = content.replace(
  /const \[sizesInput, setSizesInput\] = useState<[^>]+>\(\[\]\);/,
  `const [shirtStockInput, setShirtStockInput] = useState<Record<string, number>>({});
  const [pantStockInput, setPantStockInput] = useState<Record<string, number>>({});
  const [shoeStockInput, setShoeStockInput] = useState<Record<string, number>>({});
  const [overallStockInput, setOverallStockInput] = useState<number>(0);`
);

// 3. Remove useEffect for default sizes
content = content.replace(
  /\/\/ Initialize default sizes \(always both Shirt and Pant\)[\s\S]*?useEffect\(\(\) => \{[\s\S]*?\}, \[editingId\]\);/m,
  ``
);

// 4. Remove handleSizeStockChange
content = content.replace(
  /const handleSizeStockChange = \([\s\S]*?\}\);/m,
  ``
);

// 5. Update resetForm
content = content.replace(
  /setLabel\(''\);[\s\S]*?setImagesList\(\[\]\);/,
  `setLabel('');
    setShirtStockInput({});
    setPantStockInput({});
    setShoeStockInput({});
    setOverallStockInput(0);
    setImagesList([]);`
);

// 6. Update populateFormFromProduct
content = content.replace(
  /const defaults = \[[\s\S]*?setSizesInput\(defaults\);\n    \}/,
  `setShirtStockInput(product.shirtStock || {});
    setPantStockInput(product.pantStock || {});
    setShoeStockInput(product.shoeStock || {});
    setOverallStockInput(product.overallStock || 0);`
);

// 7. Update buildProductPayload
content = content.replace(
  /sizes: sizesInput\.filter\(\(s\) => s\.stock > 0\),/,
  `shirtStock: shirtStockInput,
      pantStock: pantStockInput,
      shoeStock: shoeStockInput,
      overallStock: overallStockInput,`
);

content = content.replace(
  /inStock: sizesInput\.some\(\(s\) => s\.stock > 0\),[\s\S]*?stockCount: sizesInput\.reduce\(\(sum, s\) => sum \+ s\.stock, 0\),/,
  `inStock: true, // recalculated in service
      stockCount: 0, // recalculated in service`
);

// 8. Update Validation
content = content.replace(
  /const tempId = editingId \|\| `p-\$\{Date\.now\(\)\}`;/,
  `// Validation
    const isCombo = category === 'Combo Offers' || category === 'Formal Combo';
    const isShirt = ['Shirts', 'Printed Shirts', 'T-Shirts', 'Formal Shirts', 'Korean Collection', 'Jackets', 'Night Tracks'].includes(category);
    const isPant = ['Baggy Pants', 'Korean Trousers', 'Formal Pant', 'Trousers', 'Denim Jeans'].includes(category);
    const isShoe = category === 'Shoes';

    const hasShirtStock = Object.values(shirtStockInput).some(v => v > 0);
    const hasPantStock = Object.values(pantStockInput).some(v => v > 0);
    const hasShoeStock = Object.values(shoeStockInput).some(v => v > 0);
    
    if (isCombo && (!hasShirtStock || !hasPantStock)) {
      dispatch(addToast({ message: 'Combo requires both Shirt and Pant inventory.', type: 'error' }));
      return;
    }
    if (isShirt && !isCombo && !hasShirtStock) {
      dispatch(addToast({ message: 'Shirt categories require Shirt inventory.', type: 'error' }));
      return;
    }
    if (isPant && !isCombo && !hasPantStock) {
      dispatch(addToast({ message: 'Pant categories require Pant inventory.', type: 'error' }));
      return;
    }
    if (isShoe && !hasShoeStock) {
      dispatch(addToast({ message: 'Shoe categories require Shoe inventory.', type: 'error' }));
      return;
    }

    const tempId = editingId || \`p-\${Date.now()}\`;`
);

// 9. Update UI rendering
const uiReplacement = `
              {/* Sizes */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Sizes & Stock</label>
                
                <div className="mt-4 space-y-6">
                  {/* Accessories */}
                  {['Accessories'].includes(category) && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">Overall Stock</h4>
                      <input
                        type="number"
                        min="0"
                        value={overallStockInput === 0 ? '' : overallStockInput}
                        placeholder="0"
                        onChange={(e) => setOverallStockInput(parseInt(e.target.value, 10) || 0)}
                        className="w-32 border border-gray-300 rounded text-xs px-3 py-2 focus:border-black focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Shirts */}
                  {(['Shirts', 'Printed Shirts', 'T-Shirts', 'Formal Shirts', 'Korean Collection', 'Jackets', 'Night Tracks', 'Combo Offers', 'Formal Combo'].includes(category)) && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">Shirt Sizes <span className="text-[10px] text-gray-400 font-normal">(Enter quantity)</span></h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {SHIRT_SIZES.map((size) => (
                          <div key={'shirt-'+size} className="flex items-center gap-3">
                            <span className="text-xs font-semibold w-8">{size}</span>
                            <input
                              type="number"
                              min="0"
                              value={shirtStockInput[size] || ''}
                              placeholder="0"
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setShirtStockInput(prev => ({ ...prev, [size]: val }));
                              }}
                              className="w-20 border border-gray-300 rounded text-xs px-2 py-1 focus:border-black focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pants */}
                  {(['Baggy Pants', 'Korean Trousers', 'Formal Pant', 'Trousers', 'Denim Jeans', 'Combo Offers', 'Formal Combo'].includes(category)) && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">Pant Sizes <span className="text-[10px] text-gray-400 font-normal">(Enter quantity)</span></h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {PANT_SIZES.map((size) => (
                          <div key={'pant-'+size} className="flex items-center gap-3">
                            <span className="text-xs font-semibold w-8">{size}</span>
                            <input
                              type="number"
                              min="0"
                              value={pantStockInput[size] || ''}
                              placeholder="0"
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setPantStockInput(prev => ({ ...prev, [size]: val }));
                              }}
                              className="w-20 border border-gray-300 rounded text-xs px-2 py-1 focus:border-black focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shoes */}
                  {category === 'Shoes' && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">Shoe Sizes <span className="text-[10px] text-gray-400 font-normal">(Enter quantity)</span></h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {SHOE_SIZES.map((size) => (
                          <div key={'shoe-'+size} className="flex items-center gap-3">
                            <span className="text-xs font-semibold w-8">{size}</span>
                            <input
                              type="number"
                              min="0"
                              value={shoeStockInput[size] || ''}
                              placeholder="0"
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setShoeStockInput(prev => ({ ...prev, [size]: val }));
                              }}
                              className="w-20 border border-gray-300 rounded text-xs px-2 py-1 focus:border-black focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>`;

content = content.replace(
  /<div>\s*<label className="text-xs font-bold text-gray-500 uppercase">Sizes & Stock<\/label>[\s\S]*?<\/div>\s*<\/div>\s*\{?\/\* Images and Colors \*\/\}/,
  uiReplacement + "\n              {/* Images and Colors */}"
);

// 10. Update table catalog stock display
content = content.replace(
  /const totalStock = \(product\.sizes \|\| \[\]\)\.reduce\(\(sum, s\) => sum \+ s\.stock, 0\);/,
  `const totalStock = product.stockCount || 0;`
);

fs.writeFileSync(path, content);
console.log('Admin page refactored.');
