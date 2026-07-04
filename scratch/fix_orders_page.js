const fs = require('fs');
const filePath = './app/orders/page.tsx';

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix interface
  content = content.replace(
    /size\?: string;\s*color\?: string;/g,
    'size?: string; shirtSize?: string; pantSize?: string; shoeSize?: string; color?: string;'
  );

  // Fix display
  content = content.replace(
    /<span className="mr-2">Size: \{item\.size\}<\/span>/g,
    `{item.size && <span className="mr-2">Size: {item.size}</span>}
     {item.shirtSize && <span className="mr-2">Shirt: {item.shirtSize}</span>}
     {item.pantSize && <span className="mr-2">Pant: {item.pantSize}</span>}
     {item.shoeSize && <span className="mr-2">Shoe: {item.shoeSize}</span>}`
  );

  fs.writeFileSync(filePath, content);
  console.log('Fixed app/orders/page.tsx');
}
