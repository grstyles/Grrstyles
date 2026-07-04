const fs = require('fs');

function refactorFile(path) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');

  // 1. Add state variables for separated sizes
  content = content.replace(
    /const \[selectedSize, setSelectedSize\] = useState<string>\(""\);/,
    `const [selectedShirtSize, setSelectedShirtSize] = useState<string>("");
  const [selectedPantSize, setSelectedPantSize] = useState<string>("");
  const [selectedShoeSize, setSelectedShoeSize] = useState<string>("");`
  );

  // 2. Update sizeRequired check
  const sizeRequiredReplacement = `const hasShirtStock = Object.keys(product.shirtStock || {}).length > 0;
    const hasPantStock = Object.keys(product.pantStock || {}).length > 0;
    const hasShoeStock = Object.keys(product.shoeStock || {}).length > 0;
    
    let sizeMissing = false;
    if (hasShirtStock && !selectedShirtSize) sizeMissing = true;
    if (hasPantStock && !selectedPantSize) sizeMissing = true;
    if (hasShoeStock && !selectedShoeSize) sizeMissing = true;

    if (sizeMissing) {
      setSizeError(true);
      dispatch(addToast({ message: "Please select all required sizes", type: "error" }));
      return;
    }`;

  content = content.replace(
    /const sizeRequired =[\s\S]*?return;\n    \}/g,
    sizeRequiredReplacement
  );

  // 3. Update addToCart / setDirectCheckoutItem payload
  content = content.replace(
    /size: selectedSize \|\| undefined,/,
    `shirtSize: selectedShirtSize || undefined,
          pantSize: selectedPantSize || undefined,
          shoeSize: selectedShoeSize || undefined,`
  );

  // 4. Update the Size selector rendering
  const sizeSelectorRegex = /\{\/\* Size selector \*\/\}\s*\{product\.sizes\?\.length > 0 && \([\s\S]*?\}\)\}\s*<\/div>\s*<\/div>\s*\)\}/;

  const newSizeSelector = `{/* Size selectors */}
              {Object.keys(product.shirtStock || {}).length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#1a1a1a]">
                      Shirt Size
                      {sizeError && !selectedShirtSize && <span className="text-red-500 text-[10px] ml-2">* Required</span>}
                    </span>
                  </div>
                  <div className={\`flex flex-wrap gap-1.5 p-1 rounded-xl transition-all border \${
                    sizeError && !selectedShirtSize ? 'border-red-500 bg-red-50/30' : 'border-transparent'
                  }\`}>
                    {Object.entries(product.shirtStock || {}).map(([sizeName, stock]) => {
                      const isOutOfStock = stock === 0;
                      const isSelected = selectedShirtSize === sizeName;
                      return (
                        <button
                          key={sizeName}
                          disabled={isOutOfStock}
                          onClick={() => { setSelectedShirtSize(sizeName); setSizeError(false); }}
                          className={\`w-9 h-9 border rounded-xl text-xs font-medium transition-all flex items-center justify-center relative \${
                            isSelected ? "border-black bg-black text-white scale-105" : isOutOfStock ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50" : "border-gray-200 hover:border-black text-gray-700 bg-white"
                          }\`}
                        >
                          {sizeName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {Object.keys(product.pantStock || {}).length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#1a1a1a]">
                      Pant Size
                      {sizeError && !selectedPantSize && <span className="text-red-500 text-[10px] ml-2">* Required</span>}
                    </span>
                  </div>
                  <div className={\`flex flex-wrap gap-1.5 p-1 rounded-xl transition-all border \${
                    sizeError && !selectedPantSize ? 'border-red-500 bg-red-50/30' : 'border-transparent'
                  }\`}>
                    {Object.entries(product.pantStock || {}).map(([sizeName, stock]) => {
                      const isOutOfStock = stock === 0;
                      const isSelected = selectedPantSize === sizeName;
                      return (
                        <button
                          key={sizeName}
                          disabled={isOutOfStock}
                          onClick={() => { setSelectedPantSize(sizeName); setSizeError(false); }}
                          className={\`w-9 h-9 border rounded-xl text-xs font-medium transition-all flex items-center justify-center relative \${
                            isSelected ? "border-black bg-black text-white scale-105" : isOutOfStock ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50" : "border-gray-200 hover:border-black text-gray-700 bg-white"
                          }\`}
                        >
                          {sizeName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {Object.keys(product.shoeStock || {}).length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#1a1a1a]">
                      Shoe Size
                      {sizeError && !selectedShoeSize && <span className="text-red-500 text-[10px] ml-2">* Required</span>}
                    </span>
                  </div>
                  <div className={\`flex flex-wrap gap-1.5 p-1 rounded-xl transition-all border \${
                    sizeError && !selectedShoeSize ? 'border-red-500 bg-red-50/30' : 'border-transparent'
                  }\`}>
                    {Object.entries(product.shoeStock || {}).map(([sizeName, stock]) => {
                      const isOutOfStock = stock === 0;
                      const isSelected = selectedShoeSize === sizeName;
                      return (
                        <button
                          key={sizeName}
                          disabled={isOutOfStock}
                          onClick={() => { setSelectedShoeSize(sizeName); setSizeError(false); }}
                          className={\`w-9 h-9 border rounded-xl text-xs font-medium transition-all flex items-center justify-center relative \${
                            isSelected ? "border-black bg-black text-white scale-105" : isOutOfStock ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50" : "border-gray-200 hover:border-black text-gray-700 bg-white"
                          }\`}
                        >
                          {sizeName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}`;

  content = content.replace(sizeSelectorRegex, newSizeSelector);

  fs.writeFileSync(path, content);
  console.log('Refactored:', path);
}

refactorFile('./components/ui/QuickViewModal.tsx');
refactorFile('./app/product/[slug]/page.tsx');
