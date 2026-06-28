const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'checkout', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove the unmount effect that clears directCheckoutItem
const unmountEffect = `  useEffect(() => {
    return () => {
      // Clear direct checkout item on unmount to not affect later visits
      dispatch(setDirectCheckoutItem(null));
    };
  }, [dispatch]);`;

content = content.replace(unmountEffect, '');

fs.writeFileSync(filePath, content);
console.log('Successfully patched checkout page');
