const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'product', '[slug]', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace isComboOffer definition
content = content.replace(
  "const isComboOffer = product?.category === 'Combo Offer';",
  `const shirtSizes = product?.sizes?.filter((s: any) => s.type === 'shirt' && s.stock > 0) || [];
  const pantSizes = product?.sizes?.filter((s: any) => s.type === 'pant' && s.stock > 0) || [];
  const genericSizes = product?.sizes?.filter((s: any) => (!s.type || (s.type !== 'shirt' && s.type !== 'pant')) && s.stock > 0) || [];

  const hasShirt = shirtSizes.length > 0;
  const hasPant = pantSizes.length > 0;
  const hasGeneric = !hasShirt && !hasPant && genericSizes.length > 0;`
);

// 2. Replace validation in handleAddToCart
const oldValidationAdd = `    if (isComboOffer) {
      if (!selectedShirtSize || !selectedPantSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select both Shirt and Pant sizes", type: "error" }));
        return;
      }
    } else {
    const sizeRequired = product?.sizes && product.sizes.length > 0 && !(product.sizes.length === 1 && product.sizes[0].size.toLowerCase() === 'one size');
    if (sizeRequired && !selectedSize) {
      setSizeWarning(true);
      dispatch(addToast({ message: "Please select a size first", type: "error" }));
      return;
    }
    }`;
const newValidation = `    if (hasShirt && hasPant) {
      if (!selectedShirtSize || !selectedPantSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select both Shirt and Pant sizes", type: "error" }));
        return;
      }
    } else if (hasShirt) {
      if (!selectedShirtSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select a Shirt size", type: "error" }));
        return;
      }
    } else if (hasPant) {
      if (!selectedPantSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select a Pant size", type: "error" }));
        return;
      }
    } else if (hasGeneric) {
      if (!selectedSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select a size", type: "error" }));
        return;
      }
    }`;
content = content.replace(oldValidationAdd, newValidation);

// 3. Replace validation in handleBuyNow
content = content.replace(oldValidationAdd, newValidation);

// 4. Update addToCart payload size logic
content = content.replace(
  "size: isComboOffer ? `Shirt: ${selectedShirtSize} / Pant: ${selectedPantSize}` : (selectedSize || undefined),",
  "size: (hasShirt && hasPant) ? `Shirt: ${selectedShirtSize} / Pant: ${selectedPantSize}` : (hasShirt ? selectedShirtSize : (hasPant ? selectedPantSize : selectedSize)) || undefined,"
);
// Fix handleBuyNow size logic which was broken previously
content = content.replace(
  "size: selectedSize || undefined,",
  "size: (hasShirt && hasPant) ? `Shirt: ${selectedShirtSize} / Pant: ${selectedPantSize}` : (hasShirt ? selectedShirtSize : (hasPant ? selectedPantSize : selectedSize)) || undefined,"
);


// 5. Update UI logic
content = content.replace(
  "{isComboOffer ? 'Sizes' : 'Size'}",
  "{(hasShirt && hasPant) ? 'Sizes' : 'Size'}"
);

// We need to rewrite the size rendering block
const oldUIRenderStart = `{isComboOffer ? (
                <div className="space-y-4">`;
const oldUIRenderFull = `{isComboOffer ? (
                <div className="space-y-4">
                  {/* Shirt Sizes */}
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Shirt Size</span>
                    <div className={\`flex flex-wrap gap-2 p-1.5 rounded-xl border transition-all \${sizeWarning && !selectedShirtSize ? 'border-red-500 bg-red-50/20 shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse' : 'border-transparent'}\`}>
                      {product.sizes?.filter((s: any) => s.type === 'shirt').map((sizeObj: any) => {
                        const size = sizeObj.size;
                        const isSelected = selectedShirtSize === size;
                        const isOutOfStock = sizeObj.stock === 0;
                        return (
                          <button
                            key={'shirt-'+size}
                            disabled={isOutOfStock}
                            onClick={() => { setSelectedShirtSize(size); setSizeWarning(false); }}
                            className={\`w-14 h-14 border text-sm font-medium rounded-xl transition-all flex items-center justify-center relative \${isSelected ? 'border-black bg-black text-white shadow-md' : isOutOfStock ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50' : 'border-gray-200 bg-white text-[#1a1a1a] hover:border-black'}\`}
                          >
                            {size}
                            {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-[80%] h-[1px] bg-red-400/40 rotate-45" /></div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Pant Sizes */}
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Pant Size</span>
                    <div className={\`flex flex-wrap gap-2 p-1.5 rounded-xl border transition-all \${sizeWarning && !selectedPantSize ? 'border-red-500 bg-red-50/20 shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse' : 'border-transparent'}\`}>
                      {product.sizes?.filter((s: any) => s.type === 'pant').map((sizeObj: any) => {
                        const size = sizeObj.size;
                        const isSelected = selectedPantSize === size;
                        const isOutOfStock = sizeObj.stock === 0;
                        return (
                          <button
                            key={'pant-'+size}
                            disabled={isOutOfStock}
                            onClick={() => { setSelectedPantSize(size); setSizeWarning(false); }}
                            className={\`w-14 h-14 border text-sm font-medium rounded-xl transition-all flex items-center justify-center relative \${isSelected ? 'border-black bg-black text-white shadow-md' : isOutOfStock ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50' : 'border-gray-200 bg-white text-[#1a1a1a] hover:border-black'}\`}
                          >
                            {size}
                            {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-[80%] h-[1px] bg-red-400/40 rotate-45" /></div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={\`flex flex-wrap gap-2 p-1.5 rounded-xl border transition-all \${sizeWarning ? 'border-red-500 bg-red-50/20 shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse' : 'border-transparent'}\`}>
                  {product.sizes && product.sizes.length > 0 ? (
                    product.sizes.map((sizeObj: any) => {
                      const size = sizeObj.size;
                      const isSelected = selectedSize === size;
                      const isOutOfStock = sizeObj.stock === 0;
                      return (
                        <button
                          key={size}
                          disabled={isOutOfStock}
                          onClick={() => { setSelectedSize(size); setSizeWarning(false); }}
                          className={\`w-14 h-14 border text-sm font-medium rounded-xl transition-all flex items-center justify-center relative \${isSelected ? 'border-black bg-black text-white shadow-md' : isOutOfStock ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50' : 'border-gray-200 bg-white text-[#1a1a1a] hover:border-black'}\`}
                        >
                          {size}
                          {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-[80%] h-[1px] bg-red-400/40 rotate-45" /></div>}
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-400">No sizes available</p>
                  )}
                </div>
              )}`;

const newUIRender = `<div className="space-y-4">
                  {hasShirt && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{hasPant ? 'Shirt Size' : 'Select Size'}</span>
                      <div className={\`flex flex-wrap gap-2 p-1.5 rounded-xl border transition-all \${sizeWarning && !selectedShirtSize ? 'border-red-500 bg-red-50/20 shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse' : 'border-transparent'}\`}>
                        {shirtSizes.map((sizeObj: any) => {
                          const size = sizeObj.size;
                          const isSelected = selectedShirtSize === size;
                          const isOutOfStock = sizeObj.stock === 0;
                          return (
                            <button
                              key={'shirt-'+size}
                              disabled={isOutOfStock}
                              onClick={() => { setSelectedShirtSize(size); setSizeWarning(false); }}
                              className={\`w-14 h-14 border text-sm font-medium rounded-xl transition-all flex items-center justify-center relative \${isSelected ? 'border-black bg-black text-white shadow-md' : isOutOfStock ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50' : 'border-gray-200 bg-white text-[#1a1a1a] hover:border-black'}\`}
                            >
                              {size}
                              {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-[80%] h-[1px] bg-red-400/40 rotate-45" /></div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {hasPant && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{hasShirt ? 'Pant Size' : 'Select Size'}</span>
                      <div className={\`flex flex-wrap gap-2 p-1.5 rounded-xl border transition-all \${sizeWarning && !selectedPantSize ? 'border-red-500 bg-red-50/20 shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse' : 'border-transparent'}\`}>
                        {pantSizes.map((sizeObj: any) => {
                          const size = sizeObj.size;
                          const isSelected = selectedPantSize === size;
                          const isOutOfStock = sizeObj.stock === 0;
                          return (
                            <button
                              key={'pant-'+size}
                              disabled={isOutOfStock}
                              onClick={() => { setSelectedPantSize(size); setSizeWarning(false); }}
                              className={\`w-14 h-14 border text-sm font-medium rounded-xl transition-all flex items-center justify-center relative \${isSelected ? 'border-black bg-black text-white shadow-md' : isOutOfStock ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50' : 'border-gray-200 bg-white text-[#1a1a1a] hover:border-black'}\`}
                            >
                              {size}
                              {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-[80%] h-[1px] bg-red-400/40 rotate-45" /></div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {hasGeneric && (
                    <div>
                      <div className={\`flex flex-wrap gap-2 p-1.5 rounded-xl border transition-all \${sizeWarning && !selectedSize ? 'border-red-500 bg-red-50/20 shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse' : 'border-transparent'}\`}>
                        {genericSizes.map((sizeObj: any) => {
                          const size = sizeObj.size;
                          const isSelected = selectedSize === size;
                          const isOutOfStock = sizeObj.stock === 0;
                          return (
                            <button
                              key={size}
                              disabled={isOutOfStock}
                              onClick={() => { setSelectedSize(size); setSizeWarning(false); }}
                              className={\`w-14 h-14 border text-sm font-medium rounded-xl transition-all flex items-center justify-center relative \${isSelected ? 'border-black bg-black text-white shadow-md' : isOutOfStock ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50' : 'border-gray-200 bg-white text-[#1a1a1a] hover:border-black'}\`}
                            >
                              {size}
                              {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-[80%] h-[1px] bg-red-400/40 rotate-45" /></div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {(!hasShirt && !hasPant && !hasGeneric) && (
                    <p className="text-sm text-gray-400">No sizes available</p>
                  )}
                </div>`;
                
content = content.replace(oldUIRenderFull, newUIRender);

// Because I used replace without regex, it should replace the exact string
fs.writeFileSync(filePath, content);
console.log('Successfully patched product slug page');
