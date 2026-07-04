const fs = require('fs');
const path = './app/product/[slug]/page.tsx';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Replace AddToCart validation
  const oldAddToCart = `    if (hasShirt && hasPant) {
      if (!selectedShirtSize || !selectedPantSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select both Shirt and Pant sizes", type: "error" }));
        return;
      }
    } else if (hasShirt) {
      if (!selectedShirtSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select a Shirt size", type: "error" }));
        return;
      }
    } else if (hasPant) {
      if (!selectedPantSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select a Pant size", type: "error" }));
        return;
      }
    } else if (hasGeneric) {`;

  const newAddToCart = `    if (hasShirt && hasPant) {
      if (!selectedShirtSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select shirt size.", type: "error" }));
        return;
      }
      if (!selectedPantSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select pant size.", type: "error" }));
        return;
      }
    } else if (hasShirt) {
      if (!selectedShirtSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select shirt size.", type: "error" }));
        return;
      }
    } else if (hasPant) {
      if (!selectedPantSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select pant size.", type: "error" }));
        return;
      }
    } else if (hasGeneric) {`;

  content = content.replace(oldAddToCart, newAddToCart);
  // It appears twice: once in handleAddToCart and once in handleBuyNow
  content = content.replace(oldAddToCart, newAddToCart);

  fs.writeFileSync(path, content);
  console.log('Fixed validation in product page');
}
