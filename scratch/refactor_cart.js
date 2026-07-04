const fs = require('fs');

function refactorCartFile(path) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');

  // Replace uniqueKey generation
  content = content.replace(
    /const uniqueKey = `\$\{item\.id\}-\$\{item\.size \|\| ''\}-\$\{item\.color \|\| ''\}`;/g,
    "const uniqueKey = `${item.id}-${item.size || ''}-${item.shirtSize || ''}-${item.pantSize || ''}-${item.shoeSize || ''}-${item.color || ''}`;"
  );

  // Replace item payload variables in actions
  content = content.replace(
    /size: item\.size,/g,
    `size: item.size, shirtSize: item.shirtSize, pantSize: item.pantSize, shoeSize: item.shoeSize,`
  );

  // Replace size display in JSX
  const oldSizeDisplay = /\{item\.size && \(\s*<span>Size: <strong className="[^"]+">\{item\.size\}<\/strong><\/span>\s*\)\}/g;
  const newSizeDisplay = `{item.size && <span>Size: <strong className="text-gray-800">{item.size}</strong></span>}
                          {item.shirtSize && <span>Shirt: <strong className="text-gray-800">{item.shirtSize}</strong></span>}
                          {item.pantSize && <span>Pant: <strong className="text-gray-800">{item.pantSize}</strong></span>}
                          {item.shoeSize && <span>Shoe: <strong className="text-gray-800">{item.shoeSize}</strong></span>}`;
  
  content = content.replace(oldSizeDisplay, newSizeDisplay);

  fs.writeFileSync(path, content);
  console.log('Refactored cart rendering in:', path);
}

refactorCartFile('./app/cart/page.tsx');
refactorCartFile('./components/home/CartSidebar.tsx');
