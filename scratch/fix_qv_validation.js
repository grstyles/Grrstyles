const fs = require('fs');
const path = './components/ui/QuickViewModal.tsx';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  const oldAddToCartLogic = `    let sizeMissing = false;
    if (hasShirtStock && !selectedShirtSize) sizeMissing = true;
    if (hasPantStock && !selectedPantSize) sizeMissing = true;
    if (hasShoeStock && !selectedShoeSize) sizeMissing = true;

    if (sizeMissing) {
      setSizeError(true);
      dispatch(addToast({ message: "Please select all required sizes", type: "error" }));
      return;
    }`;

  const newAddToCartLogic = `    if (hasShirtStock && !selectedShirtSize) {
      setSizeError(true);
      dispatch(addToast({ message: "Please select shirt size.", type: "error" }));
      return;
    }
    if (hasPantStock && !selectedPantSize) {
      setSizeError(true);
      dispatch(addToast({ message: "Please select pant size.", type: "error" }));
      return;
    }
    if (hasShoeStock && !selectedShoeSize) {
      setSizeError(true);
      dispatch(addToast({ message: "Please select shoe size.", type: "error" }));
      return;
    }`;

  content = content.replace(oldAddToCartLogic, newAddToCartLogic);
  // Do it again for Buy Now if it exists
  content = content.replace(oldAddToCartLogic, newAddToCartLogic);

  fs.writeFileSync(path, content);
  console.log('Fixed QuickViewModal validation');
}
