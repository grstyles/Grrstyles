const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, '..');

const hooks = [
  'useState',
  'useEffect',
  'useMemo',
  'useCallback',
  'useRef',
  'useTransition',
  'useOptimistic',
  'useDeferredValue',
  'useLayoutEffect'
];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === 'dist' || file === 'public' || file === '.git' || file === 'scripts') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let missingHooks = [];
  
  for (const hook of hooks) {
    // Check if hook is used (e.g., useState() or useEffect())
    const hookRegex = new RegExp(`\\b${hook}\\s*\\(`, 'g');
    if (hookRegex.test(content)) {
      // Check if hook is imported
      const importRegex = new RegExp(`import\\s+.*?\\b${hook}\\b.*?from\\s+['"]react['"]`, 's');
      // Also check for `import React, { ... }` or `import * as React`
      const reactImportRegex = new RegExp(`import\\s+(React\\s*,?\\s*\\{([^}]*)\\})?\\s*from\\s+['"]react['"]`, 's');
      
      const match = reactImportRegex.exec(content) || importRegex.exec(content);
      
      if (!match || (match[2] && !match[2].includes(hook) && !importRegex.test(content))) {
          // If it uses React.useState instead of useState, we shouldn't flag it if we just look for `useState(`.
          // Wait, if they do `React.useState(`, the `hookRegex` matches `useState(`.
          // Let's refine hookRegex to make sure it's not preceded by `React.` or `.` 
          const refinedHookRegex = new RegExp(`(?<!\\.)\\b${hook}\\s*\\(`, 'g');
          if (refinedHookRegex.test(content)) {
              missingHooks.push(hook);
          }
      }
    }
  }

  if (missingHooks.length > 0) {
    console.log(`Fixing missing imports in ${filePath}`);
    console.log(`Missing hooks: ${missingHooks.join(', ')}`);
    fixImports(filePath, content, missingHooks);
  }
}

function fixImports(filePath, content, missingHooks) {
  // Check if there is already an import from 'react'
  const reactImportRegex = /^import\s+(?:([^,{]+)\s*,?\s*)?(?:\{([^}]+)\})?\s*from\s+['"]react['"];?/m;
  const match = content.match(reactImportRegex);

  let newContent = content;

  if (match) {
    // There is an existing import from 'react'
    const fullImportStmt = match[0];
    let defaultImport = match[1] ? match[1].trim() : '';
    let namedImportsStr = match[2] ? match[2].trim() : '';
    
    // Parse existing named imports
    let namedImports = namedImportsStr ? namedImportsStr.split(',').map(s => s.trim()).filter(s => s) : [];
    
    // Add missing hooks to named imports
    for (const hook of missingHooks) {
      if (!namedImports.includes(hook)) {
        namedImports.push(hook);
      }
    }
    
    let newNamedImportsStr = namedImports.length > 0 ? `{ ${namedImports.join(', ')} }` : '';
    
    let newImportStmt = 'import ';
    if (defaultImport && newNamedImportsStr) {
      newImportStmt += `${defaultImport}, ${newNamedImportsStr}`;
    } else if (defaultImport) {
      newImportStmt += defaultImport;
    } else {
      newImportStmt += newNamedImportsStr;
    }
    newImportStmt += " from 'react';";
    
    newContent = newContent.replace(fullImportStmt, newImportStmt);
  } else {
    // No import from 'react' at all, we must add one.
    // Insert it after 'use client' if it exists, otherwise at the top.
    const useClientRegex = /^(['"]use client['"];?)/m;
    const newImportStmt = `import { ${missingHooks.join(', ')} } from 'react';\n`;
    
    if (useClientRegex.test(newContent)) {
      newContent = newContent.replace(useClientRegex, `$1\n${newImportStmt}`);
    } else {
      newContent = newImportStmt + newContent;
    }
  }

  fs.writeFileSync(filePath, newContent, 'utf-8');
}

console.log("Scanning project for missing React hook imports...");
scanDir(projectDir);
console.log("Done.");
