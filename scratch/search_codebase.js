const fs = require('fs');
const path = require('path');

const IGNORED = ['node_modules', '.next', '.git', 'scratch', 'build', 'dist'];
const SEARCH_STRINGS = ['cart_items', '.sizes', 'shirtStock', 'pantStock', 'shoeStock', 'overallStock'];

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (IGNORED.includes(file)) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        for (const str of SEARCH_STRINGS) {
          if (lines[i].includes(str)) {
            console.log(`${fullPath}:${i + 1} - found ${str}`);
          }
        }
      }
    }
  }
}

searchDir('.');
