const fs = require('fs');

function replaceInFile(filePath, regexPairs) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  for (const [pattern, replacement] of regexPairs) {
    content = content.replace(pattern, replacement);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated:', filePath);
  }
}

// 1. QuickViewModal
replaceInFile('./components/ui/QuickViewModal.tsx', [
  [/size: selectedSize \|\| undefined,/g, 'shirtSize: selectedShirtSize || undefined, pantSize: selectedPantSize || undefined, shoeSize: selectedShoeSize || undefined,']
]);

// 2. Admin Orders Page
replaceInFile('./app/admin/orders/[orderId]/page.tsx', [
  [/size\?: string;\s*color\?: string;/g, 'size?: string; shirtSize?: string; pantSize?: string; shoeSize?: string; color?: string;'],
  [/<span className="mr-2">Size: \{item\.size\}<\/span>/g, '{item.size && <span className="mr-2">Size: {item.size}</span>} {item.shirtSize && <span className="mr-2">Shirt: {item.shirtSize}</span>} {item.pantSize && <span className="mr-2">Pant: {item.pantSize}</span>} {item.shoeSize && <span className="mr-2">Shoe: {item.shoeSize}</span>}']
]);

// 3. Auth Callback
replaceInFile('./app/auth/callback/page.tsx', [
  [/const \{ data, error \} = await supabase/g, 'const { data, error }: any = await supabase'],
  [/if \(err instanceof Error\)/g, 'if (err instanceof Error || typeof err === "object")']
]);

// 4. Products DB (lib/data/products.ts)
replaceInFile('./lib/data/products.ts', [
  [/sizes:\s*\[\s*\{\s*size:\s*'[A-Z0-9]+',\s*stock:\s*\d+,\s*type:\s*'[^']+'\s*\}\s*\]/g, '']
]);

