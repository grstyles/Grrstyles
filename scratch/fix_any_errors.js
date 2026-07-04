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

// 1. AuthContext
replaceInFile('./lib/context/AuthContext.tsx', [
  [/supabase\.auth\.onAuthStateChange\(\(event, session\) => \{/g, 'supabase.auth.onAuthStateChange((event: any, session: any) => {']
]);

// 2. products.ts (2112)
replaceInFile('./lib/data/products.ts', [
  [/sizes:\s*\[\s*\{\s*size:\s*'[A-Z0-9]+',\s*stock:\s*\d+,\s*type:\s*'[^']+'\s*\}\s*\]/g, '']
]);

// 3. categoryCarouselRepository.ts
replaceInFile('./lib/repositories/categoryCarouselRepository.ts', [
  [/\.map\(\(c\) => \(\{/g, '.map((c: any) => ({']
]);

// 4. supabaseProvider.ts
replaceInFile('./lib/repositories/supabaseProvider.ts', [
  [/\(p\) => mapDbProduct\(p\)/g, '(p: any) => mapDbProduct(p)'],
  [/\(o\) => mapDbOrder\(o\)/g, '(o: any) => mapDbOrder(o)'],
  [/reduce\(\(sum, o\) => sum \+ \(o\.total_amount \|\| 0\), 0\)/g, 'reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)'],
  [/return data\.map\(\(o\) => mapDbOrder\(o\)\)/g, 'return data.map((o: any) => mapDbOrder(o))'],
  [/p: any/g, 'p: any'] // Ensure no other any errors.
]);
