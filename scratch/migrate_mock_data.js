const fs = require('fs');

const path = './lib/data/products.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace interface definition
content = content.replace(/ sizes: ProductSize\[\];/g, `  shirtStock?: Record<string, number>;
  pantStock?: Record<string, number>;
  shoeStock?: Record<string, number>;
  overallStock?: number;`);

// Find all products and their sizes blocks
const sizeBlockRegex = /sizes:\s*\[([\s\S]*?)\],/g;
const categoryRegex = /category:\s*'([^']+)'/g;

// Instead of regex replacing the body, since we need to know the category to map properly,
// let's do a more robust string replacement by evaluating or regexing blocks.
let result = '';
let lastIdx = 0;
let productMatch;

// Basic regex to find each product block in productDatabase
const productRegex = /'([^']+)':\s*{([\s\S]*?)(?=\n  '[a-z0-9-]+':\s*{|\n};)/g;

let updatedContent = content.replace(productRegex, (match, key, body) => {
  const catMatch = /category:\s*'([^']+)'/.exec(body);
  const cat = catMatch ? catMatch[1] : '';

  const sizesMatch = /sizes:\s*\[([\s\S]*?)\],/.exec(body);
  
  if (sizesMatch) {
    // extract sizes
    const sizesStr = sizesMatch[1];
    let shirtStock = {};
    let pantStock = {};
    let shoeStock = {};
    let overallStock = 0;

    const sizeItems = [...sizesStr.matchAll(/{ size: '([^']+)', stock: (\d+) }/g)];
    sizeItems.forEach(item => {
      const s = item[1];
      const stock = parseInt(item[2], 10);
      overallStock += stock;
      if (['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'].includes(s)) shirtStock[s] = stock;
      else if (['28', '30', '32', '34', '36', '38', '40', '42'].includes(s)) pantStock[s] = stock;
      else shoeStock[s] = stock;
    });

    let newStockStr = '';
    const formatRecord = (rec) => '{\n' + Object.entries(rec).map(([k,v]) => `        '${k}': ${v}`).join(',\n') + '\n      }';

    if (['Shirts', 'Printed Shirts', 'T-Shirts', 'Formal Shirts', 'Korean Collection', 'Jackets', 'Night Tracks'].includes(cat)) {
      newStockStr = `shirtStock: ${formatRecord(shirtStock)},`;
    } else if (['Baggy Pants', 'Korean Trousers', 'Formal Pant', 'Trousers', 'Denim Jeans'].includes(cat)) {
      newStockStr = `pantStock: ${formatRecord(pantStock)},`;
    } else if (cat === 'Shoes') {
      newStockStr = `shoeStock: ${formatRecord(shoeStock)},`;
    } else if (['Combo Offer', 'Formal Combo'].includes(cat)) {
      newStockStr = `shirtStock: ${formatRecord(shirtStock)},\n      pantStock: ${formatRecord(pantStock)},`;
    } else {
      newStockStr = `overallStock: ${overallStock},`;
    }

    body = body.replace(/sizes:\s*\[([\s\S]*?)\],/, newStockStr);
  }

  return `'${key}': {${body}`;
});

fs.writeFileSync(path, updatedContent);
console.log('Migrated mock data successfully.');
