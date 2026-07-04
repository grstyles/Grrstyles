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

fix('./lib/repositories/supabaseProvider.ts', [
  [/\.map\(p =>/g, '.map((p: any) =>'],
  [/\.map\(\(p\) =>/g, '.map((p: any) =>'],
  [/\.map\(o =>/g, '.map((o: any) =>'],
  [/\.map\(\(o\) =>/g, '.map((o: any) =>'],
  [/reduce\(\(sum, o\) =>/g, 'reduce((sum: number, o: any) =>'],
]);

fix('./lib/repositories/categoryCarouselRepository.ts', [
  [/\.map\(\(c\) =>/g, '.map((c: any) =>'],
  [/\.map\(c =>/g, '.map((c: any) =>'],
]);

fix('./services/adminService.ts', [
  [/reduce\(\(sum, o\) =>/g, 'reduce((sum: number, o: any) =>'],
]);

