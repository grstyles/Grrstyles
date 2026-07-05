const fs = require('fs');

function suppressSizes(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  content = content.replace(/product\.sizes/g, '((product as any).sizes || [])');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Suppressed sizes in:', filePath);
  }
}

suppressSizes('./app/collections/page.tsx');
suppressSizes('./app/new-in/NewInClient.tsx');
suppressSizes('./components/home/ProductGrid.tsx');
suppressSizes('./components/new-in/PremiumProductCard.tsx');
suppressSizes('./components/ui/QuickViewModal.tsx');
