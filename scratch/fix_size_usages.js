const fs = require('fs');

function replaceSizeUsage(filePath, regexPairs) {
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

// 1. Checkout Page
replaceSizeUsage('./app/checkout/page.tsx', [
  [
    /size: item\.size \|\| 'One Size',/g,
    `size: item.size || '', shirtSize: item.shirtSize || '', pantSize: item.pantSize || '', shoeSize: item.shoeSize || '',`
  ],
  [
    /const uniqueKey = `\$\{item\.id\}-\$\{item\.size \|\| ''\}-\$\{item\.color \|\| ''\}`;/g,
    "const uniqueKey = `${item.id}-${item.size || ''}-${item.shirtSize || ''}-${item.pantSize || ''}-${item.shoeSize || ''}-${item.color || ''}`;"
  ],
  [
    /\{item\.size \? `\| Size: \$\{item\.size\}` : ''\}/g,
    `{item.size ? \`| Size: \${item.size}\` : ''} {item.shirtSize ? \`| Shirt: \${item.shirtSize}\` : ''} {item.pantSize ? \`| Pant: \${item.pantSize}\` : ''} {item.shoeSize ? \`| Shoe: \${item.shoeSize}\` : ''}`
  ]
]);

// 2. Orders Page (Client)
replaceSizeUsage('./app/orders/page.tsx', [
  [
    /<span className="mr-2">Size: \{item\.size\}<\/span>/g,
    `{item.size && <span className="mr-2">Size: {item.size}</span>}
     {item.shirtSize && <span className="mr-2">Shirt: {item.shirtSize}</span>}
     {item.pantSize && <span className="mr-2">Pant: {item.pantSize}</span>}
     {item.shoeSize && <span className="mr-2">Shoe: {item.shoeSize}</span>}`
  ]
]);

// 3. Admin Orders Page
replaceSizeUsage('./app/admin/orders/[orderId]/page.tsx', [
  [
    /<p className="font-semibold mt-0\.5">\{item\.size\}<\/p>/g,
    `<p className="font-semibold mt-0.5">{item.size || ''} {item.shirtSize ? \`Shirt: \${item.shirtSize}\` : ''} {item.pantSize ? \`Pant: \${item.pantSize}\` : ''} {item.shoeSize ? \`Shoe: \${item.shoeSize}\` : ''}</p>`
  ]
]);

// 4. Cart Sidebar (It might have skipped due to not matching the exact regex)
replaceSizeUsage('./components/home/CartSidebar.tsx', [
  [
    /\{item\.size && \(\s*<span>Size: <strong className="[^"]+">\{item\.size\}<\/strong><\/span>\s*\)\}/g,
    `{item.size && <span>Size: <strong className="text-gray-800">{item.size}</strong></span>}
     {item.shirtSize && <span>Shirt: <strong className="text-gray-800">{item.shirtSize}</strong></span>}
     {item.pantSize && <span>Pant: <strong className="text-gray-800">{item.pantSize}</strong></span>}
     {item.shoeSize && <span>Shoe: <strong className="text-gray-800">{item.shoeSize}</strong></span>}`
  ]
]);

// 5. Providers (Redux Cart Sync logic)
replaceSizeUsage('./app/providers.tsx', [
  [
    /db\.size === localItem\.size/g,
    `db.size === localItem.size && db.shirtSize === localItem.shirtSize && db.pantSize === localItem.pantSize && db.shoeSize === localItem.shoeSize`
  ],
  [
    /p\.size === item\.size/g,
    `p.size === item.size && p.shirtSize === item.shirtSize && p.pantSize === item.pantSize && p.shoeSize === item.shoeSize`
  ],
  [
    /item\.size === prevItem\.size/g,
    `item.size === prevItem.size && item.shirtSize === prevItem.shirtSize && item.pantSize === prevItem.pantSize && item.shoeSize === prevItem.shoeSize`
  ],
  [
    /prevItem\.size\);/g,
    `prevItem.size, prevItem.shirtSize, prevItem.pantSize, prevItem.shoeSize);`
  ]
]);
