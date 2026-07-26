const { matchCategory, normalizeCategory, normalizeCollection } = require('../lib/utils/categoryImageMap');

const sampleProducts = [
  { id: '1', name: 'Korean Oversized Shirt', category: 'Korean Collection', collection: '' },
  { id: '2', name: 'Traditional Kurta Set', category: 'Shirts', collection: 'Traditional Collection' },
  { id: '3', name: 'Korean Street Trouser', category: 'Korean Trousers', collection: 'Korean Collection' },
  { id: '4', name: 'Silk Festival Wear', category: 'Traditional Collection', collection: 'Festival Collection' },
];

console.log('--- Testing Normalization ---');
console.log('normalizeCategory("Korean Collection"):', normalizeCategory('Korean Collection'));
console.log('normalizeCollection("Korean Collection"):', normalizeCollection('Korean Collection'));
console.log('normalizeCategory("Traditional Collection"):', normalizeCategory('Traditional Collection'));
console.log('normalizeCollection("Traditional Collection"):', normalizeCollection('Traditional Collection'));

console.log('\n--- Testing Korean Collection Matches ---');
sampleProducts.forEach(p => {
  console.log(`Product "${p.name}":`, matchCategory(p, 'korean-collections'));
});

console.log('\n--- Testing Traditional Collection Matches ---');
sampleProducts.forEach(p => {
  console.log(`Product "${p.name}":`, matchCategory(p, 'traditional-collections'));
});
