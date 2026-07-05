const fs = require('fs');
const path = './app/product/[slug]/page.tsx';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // 1. Add selectedColor state explicitly instead of deriving it from activeImageIndex
  const stateHooksRegex = /const \[activeImageIndex, setActiveImageIndex\] = useState\(0\);\n  const \[selectedSize, setSelectedSize\] = useState<string \| null>\(null\);/g;
  
  content = content.replace(stateHooksRegex, `const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColorState, setSelectedColorState] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);`);

  // 2. Initialize selectedColorState when product loads
  const loadDataEndRegex = /setApplicableCoupons\(valid\);\n        }/g;
  content = content.replace(loadDataEndRegex, `setApplicableCoupons(valid);
          if (data.colors && data.colors.length > 0) {
            setSelectedColorState(data.colors[0]);
          } else if (data.imageColors && data.imageColors.length > 0) {
            setSelectedColorState(data.imageColors[0].color_name);
          }
        }`);

  // 3. Remove derived selectedColor and replace with selectedColorState
  // Original: const selectedColor = visibleImages[activeImageIndex]?.color || '';
  const derivedColorRegex = /const selectedColor = visibleImages\[activeImageIndex\]\?\.color \|\| '';/g;
  content = content.replace(derivedColorRegex, `const selectedColor = selectedColorState || visibleImages[activeImageIndex]?.color || '';`);

  // 4. Update handleColorSelect
  const handleColorSelectRegex = /const handleColorSelect = \(colorName: string\) => \{\n    const firstIndex = visibleImages\.findIndex\(\(img: any\) => img\.color === colorName\);\n    if \(firstIndex !== -1\) \{\n      setActiveImageIndex\(firstIndex\);\n    \}\n  \};/g;
  
  content = content.replace(handleColorSelectRegex, `const handleColorSelect = (colorName: string) => {
    setSelectedColorState(colorName);
    const firstIndex = visibleImages.findIndex((img: any) => img.color === colorName);
    if (firstIndex !== -1) {
      setActiveImageIndex(firstIndex);
    }
  };`);

  fs.writeFileSync(path, content);
  console.log('Fixed color sync in product page');
}
