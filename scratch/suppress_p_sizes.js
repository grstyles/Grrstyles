const fs = require('fs');

function suppressPSizes(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  content = content.replace(/p\.sizes/g, '((p as any).sizes || [])');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Suppressed p.sizes in:', filePath);
  }
}

suppressPSizes('./app/collections/page.tsx');
suppressPSizes('./app/new-in/NewInClient.tsx');
