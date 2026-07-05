const fs = require('fs');

function fix(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let orig = content;
  
  for (let [p, r] of replacements) {
    content = content.replace(p, r);
  }
  
  if (content !== orig) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed', filePath);
  }
}

// 1. app/admin/orders/[orderId]/page.tsx
fix('./app/admin/orders/[orderId]/page.tsx', [
  [/\{order\.alternate_phone && ` \/ \$\{order\.alternate_phone\}`\}/g, ''],
  [/size\?: string;\s*color\?: string;/g, 'size?: string; shirtSize?: string; pantSize?: string; shoeSize?: string; color?: string;'],
  [/<span className="mr-2">Size: \{item\.size\}<\/span>/g, '{item.size && <span className="mr-2">Size: {item.size}</span>} {item.shirtSize && <span className="mr-2">Shirt: {item.shirtSize}</span>} {item.pantSize && <span className="mr-2">Pant: {item.pantSize}</span>} {item.shoeSize && <span className="mr-2">Shoe: {item.shoeSize}</span>}']
]);

// 2. app/api/orders/create/route.ts
fix('./app/api/orders/create/route.ts', [
  [/\.select\('sizes'\)/g, ".select('shirt_stock, pant_stock, shoe_stock, overall_stock')"]
]);

// 3. app/collections/page.tsx & app/new-in/NewInClient.tsx
fix('./app/collections/page.tsx', [
  [/s => /g, '(s: any) => '],
]);
fix('./app/new-in/NewInClient.tsx', [
  [/s => /g, '(s: any) => '],
]);

// 4. app/orders/page.tsx
fix('./app/orders/page.tsx', [
  [/size\?: string;\s*color\?: string;/g, 'size?: string; shirtSize?: string; pantSize?: string; shoeSize?: string; color?: string;'],
  [/<span className="mr-2">Size: \{item\.size\}<\/span>/g, '{item.size && <span className="mr-2">Size: {item.size}</span>} {item.shirtSize && <span className="mr-2">Shirt: {item.shirtSize}</span>} {item.pantSize && <span className="mr-2">Pant: {item.pantSize}</span>} {item.shoeSize && <span className="mr-2">Shoe: {item.shoeSize}</span>}']
]);

// 5. lib/data/products.ts
fix('./lib/data/products.ts', [
  [/sizes:\s*\[\s*\{\s*size:\s*'[A-Z0-9]+',\s*stock:\s*\d+,\s*type:\s*'[^']+'\s*\}\s*\]/g, '']
]);

// 6. lib/repositories/supabaseProvider.ts
fix('./lib/repositories/supabaseProvider.ts', [
  [/o =>/g, '(o: any) =>'],
  [/\(o\) =>/g, '(o: any) =>'],
  [/p =>/g, '(p: any) =>'],
  [/\(p\) =>/g, '(p: any) =>'],
]);

// 7. services/productService.ts
fix('./services/productService.ts', [
  [/p =>/g, '(p: any) =>'],
  [/\(p\) =>/g, '(p: any) =>'],
]);

// 8. services/searchService.ts
fix('./services/searchService.ts', [
  [/p =>/g, '(p: any) =>'],
]);

// 9. lib/repositories/categoryCarouselRepository.ts
fix('./lib/repositories/categoryCarouselRepository.ts', [
  [/c =>/g, '(c: any) =>'],
  [/\(c\) =>/g, '(c: any) =>'],
]);
