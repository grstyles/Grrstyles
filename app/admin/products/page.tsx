'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, getProductSizes } from '@/lib/data/products';
import { repo, MockCoupon } from '@/lib/repositories';
import {
  Plus, X, Trash2, Tag, ShoppingBag, DollarSign, Upload,
  Star, TrendingUp, Sparkles, Zap, RefreshCw, Search, Check, Edit2, Layers, Package, Truck
} from 'lucide-react';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { useDispatch } from 'react-redux';
import { formatPrice } from '@/lib/utils/helpers';
import { COLLECTIONS } from '@/lib/config';
import Image from 'next/image';

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const PANT_SIZES  = ['28', '30', '32', '34', '36', '38', '40', '42'];
const SHOE_SIZES  = ['6', '7', '8', '9', '10', '11'];

// Helper functions for category classification
function isShirtCat(cat: string): boolean {
  if (!cat) return false;
  const val = cat.toLowerCase().trim();
  return (
    ['shirts', 'printed shirts', 't-shirts', 'formal shirts', 'korean collection', 'jackets', 'night tracks'].includes(val) ||
    val.includes('shirt') || val.includes('t-shirt') || val.includes('tshirt') || val.includes('jacket') || val.includes('top') || val.includes('hoodie') || val.includes('sweatshirt')
  );
}

function isPantCat(cat: string): boolean {
  if (!cat) return false;
  const val = cat.toLowerCase().trim();
  return (
    ['baggy pants', 'korean trousers', 'formal pant', 'trousers', 'denim jeans', 'pants', 'jeans'].includes(val) ||
    val.includes('pant') || val.includes('trouser') || val.includes('jeans') || val.includes('denim') || val.includes('bottom') || val.includes('cargo') || val.includes('chinos') || val.includes('shorts')
  );
}

function isShoeCat(cat: string): boolean {
  if (!cat) return false;
  const val = cat.toLowerCase().trim();
  return (
    ['shoes', 'footwear', 'sneakers'].includes(val) ||
    val.includes('shoe') || val.includes('footwear') || val.includes('sneaker') || val.includes('boot') || val.includes('sandal') || val.includes('slipper')
  );
}

function isComboCat(cat: string, coll: string = '', isDeal: boolean = false, isComboBtn: boolean = false): boolean {
  if (isComboBtn || isDeal) return true;
  const val = (cat || '').toLowerCase().trim();
  const collVal = (coll || '').toLowerCase().trim();
  return (
    val.includes('combo') || collVal.includes('combo') ||
    val === 'combo offers' || val === 'formal combo' || val === 'party combo' || val === 'combo offer'
  );
}

function isAccessoryCat(cat: string): boolean {
  if (!cat) return false;
  const val = cat.toLowerCase().trim();
  return (
    ['accessories', 'accessory'].includes(val) ||
    val.includes('accessor') || val.includes('watch') || val.includes('belt') || val.includes('wallet') || val.includes('cap') || val.includes('sunglass') || val.includes('perfume') || val.includes('sock')
  );
}

function getOrdinalText(index: number): string {
  const ordinals = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  return ordinals[index] || `${index + 1}th`;
}

export default function AdminProductsPage() {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<Product[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  const [dbCategories, setDbCategories] = useState<{ id: string; title: string; enabled: boolean }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [collection, setCollection] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [customCollectionInput, setCustomCollectionInput] = useState('');
  const [brand, setBrand] = useState('GR STYLES');
  const [tagsInput, setTagsInput] = useState('');
  const [color, setColor] = useState('');
  const [mrpPrice, setMrpPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [description, setDescription] = useState('');
  const [label, setLabel] = useState('');
  
  // Primary Array-Based Sizes State (e.g., ["S", "M", "L", "XL"])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sizeStockInputs, setSizeStockInputs] = useState<Record<string, number>>({});
  const [overallStockInput, setOverallStockInput] = useState<number>(0);
  
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [imageColors, setImageColors] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  // Feature toggles
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isDealOfDay, setIsDealOfDay] = useState(false);
  const [isComboOffer, setIsComboOffer] = useState(false);
  const [isCouponApplicable, setIsCouponApplicable] = useState(true);

  // Product Delivery Charge state
  const [deliveryChargeEnabled, setDeliveryChargeEnabled] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState('0');

  // Manual Size Override Tab ('auto' | 'shirts' | 'pants' | 'shoes' | 'combo' | 'overall' | 'all')
  const [sizeTabOverride, setSizeTabOverride] = useState<'auto' | 'shirts' | 'pants' | 'shoes' | 'combo' | 'overall' | 'all'>('auto');

  const [availableCoupons, setAvailableCoupons] = useState<MockCoupon[]>([]);
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);

  const dynamicCollections = Array.from(
    new Set(items.flatMap(p => p.collections || (p.collection ? p.collection.split(',').map(s => s.trim()) : [])).filter(Boolean))
  ) as string[];
  
  const activeDbCategoryTitles = dbCategories.filter(c => c.enabled).map(c => c.title);
  
  const availableWebsiteCollections = Array.from(
    new Set([
      ...COLLECTIONS,
      ...activeDbCategoryTitles,
      ...dynamicCollections,
      ...selectedCollections,
    ])
  ).filter(Boolean);
  const availableCategoryOptions = Array.from(new Set([
    ...activeDbCategoryTitles,
    ...(category ? [category] : [])
  ])).filter(Boolean);

  const filterCategoryOptions = Array.from(new Set([
    ...dbCategories.map(c => c.title),
    ...items.map(p => p.category).filter(Boolean)
  ])).filter(Boolean);

  const handleToggleCouponApplicable = (checked: boolean) => {
    setIsCouponApplicable(checked);
    if (!checked) {
      // Clear coupon selection and reset state when coupon is disabled
      setSelectedCoupons([]);
    }
  };

  const toggleCollectionSelection = (collName: string) => {
    setSelectedCollections((prev) => {
      const exists = prev.includes(collName);
      const updated = exists ? prev.filter(c => c !== collName) : [...prev, collName];
      setCollection(updated.join(', '));
      
      if (collName === 'Deal of the Day') setIsDealOfDay(!exists);
      if (collName === 'New Arrivals') setIsNewArrival(!exists);
      if (collName === 'Best Sellers' || collName === 'Trending Collection') setIsTrending(!exists);
      if (collName === 'Featured Collection') setIsFeatured(!exists);
      if (collName === 'Combo Offers') setIsComboOffer(!exists);

      return updated;
    });
  };

  const handleAddCustomCollection = () => {
    const trimmed = customCollectionInput.trim();
    if (trimmed && !selectedCollections.includes(trimmed)) {
      const updated = [...selectedCollections, trimmed];
      setSelectedCollections(updated);
      setCollection(updated.join(', '));
      setCustomCollectionInput('');
    }
  };

  const loadCategoriesFromDb = async () => {
    setLoadingCategories(true);
    try {
      const cats = await repo.categoryCarousel.getAll();
      const mapped = cats.map(c => ({ id: c.id, title: c.title, enabled: c.enabled }));
      setDbCategories(mapped);
    } catch (err) {
      console.error('Failed to load categories from DB:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadCategoriesFromDb();
    const handleCategoryUpdate = () => {
      loadCategoriesFromDb();
    };
    window.addEventListener('category_carousel_updated', handleCategoryUpdate);
    return () => {
      window.removeEventListener('category_carousel_updated', handleCategoryUpdate);
    };
  }, []);

  const loadProductsAndCoupons = async () => {
    setLoading(true);
    try {
      const [productsData, couponsData] = await Promise.all([
        repo.products.getAll(),
        repo.coupons.getAll()
      ]);
      setItems(productsData);
      
      const now = new Date();
      setAvailableCoupons(couponsData.filter(c => 
        c.isActive && 
        (!c.startDate || new Date(c.startDate) <= now) &&
        (!c.endDate || new Date(c.endDate) > now)
      ));
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductsAndCoupons();
  }, []);

  // Synchronize dynamic primary color from first uploaded image
  useEffect(() => {
    if (imageColors.length > 0 && imageColors[0]) {
      setColor(imageColors[0]);
    }
  }, [imageColors]);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => {
      const isSelected = prev.includes(size);
      if (isSelected) {
        setSizeStockInputs((stockPrev) => {
          const next = { ...stockPrev };
          delete next[size];
          return next;
        });
        return prev.filter((s) => s !== size);
      } else {
        setSizeStockInputs((stockPrev) => ({
          ...stockPrev,
          [size]: stockPrev[size] !== undefined ? stockPrev[size] : 0,
        }));
        return [...prev, size];
      }
    });
  };

  const addPresetSizes = (presetSizes: string[]) => {
    setSelectedSizes((prev) => {
      const combined = Array.from(new Set([...prev, ...presetSizes]));
      setSizeStockInputs((stockPrev) => {
        const next = { ...stockPrev };
        presetSizes.forEach((s) => {
          if (next[s] === undefined) next[s] = 0;
        });
        return next;
      });
      return combined;
    });
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newImages = [...imagesList];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);
    setImagesList(newImages);

    const newColors = [...imageColors];
    const draggedColor = newColors[draggedIndex];
    newColors.splice(draggedIndex, 1);
    newColors.splice(dropIndex, 0, draggedColor);
    setImageColors(newColors);

    setDraggedIndex(null);
  };

  const handleImageColorChange = (index: number, val: string) => {
    setImageColors(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleRemoveImage = (index: number) => {
    setImagesList(prev => prev.filter((_, i) => i !== index));
    setImageColors(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      dispatch(addToast({ message: 'File size must be less than 5MB', type: 'error' }));
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      dispatch(addToast({ message: 'Only JPEG, PNG, and WebP images are allowed', type: 'error' }));
      return;
    }

    setUploading(true);
    try {
      const uploadedUrl = await repo.storage.uploadImage(file, 'product-images');
      if (uploadedUrl) {
        setImagesList((prev) => {
          const newList = [...prev, uploadedUrl];
          setImageColors((colorsPrev) => {
            const newColors = [...colorsPrev];
            if (newColors.length === 0) {
              newColors.push(color || '');
            } else {
              newColors.push('');
            }
            return newColors;
          });
          return newList;
        });
        dispatch(addToast({ message: 'Image uploaded successfully!', type: 'success' }));
      } else {
        dispatch(addToast({ message: 'Image upload failed.', type: 'error' }));
      }
    } catch {
      dispatch(addToast({ message: 'Image upload error.', type: 'error' }));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSku('');
    const defaultCat = activeDbCategoryTitles.length > 0 ? activeDbCategoryTitles[0] : '';
    setCategory(defaultCat);
    setCollection('');
    setSelectedCollections([]);
    setCustomCollectionInput('');
    setBrand('GR STYLES');
    setTagsInput('');
    setColor('');
    setImageColors([]);
    setMrpPrice('');
    setSellingPrice('');
    setDescription('');
    setLabel('');
    setSelectedSizes([]);
    setSizeStockInputs({});
    setOverallStockInput(0);
    setImagesList([]);
    setIsNewArrival(false);
    setIsTrending(false);
    setIsFeatured(false);
    setIsDealOfDay(false);
    setIsComboOffer(false);
    setIsCouponApplicable(true);
    setSizeTabOverride('auto');
    setSelectedCoupons([]);
    setDeliveryChargeEnabled(false);
    setDeliveryCharge('0');
  };

  const populateFormFromProduct = (product: Product) => {
    setEditingId(product.id);
    setName(product.name || product.title);
    setSku(product.sku || '');
    setCategory(product.category);
    setCollection(product.collection || '');
    
    const initialColls: string[] = [];
    if (Array.isArray(product.collections) && product.collections.length > 0) {
      initialColls.push(...product.collections);
    } else if (product.collection) {
      initialColls.push(...product.collection.split(',').map(s => s.trim()).filter(Boolean));
    }
    setSelectedCollections(initialColls);
    setCustomCollectionInput('');

    setBrand(product.brand || 'GR STYLES');
    setTagsInput((product.metadata?.tags || []).join(', '));
    setColor(product.color || '');
    setMrpPrice(String(product.mrpPrice || product.price || ''));
    setSellingPrice(String(product.sellingPrice || product.discountedPrice || ''));
    setDescription(product.description);
    setLabel(product.label || '');
    
    // Load array-based sizes & size-wise stocks
    const sizes = getProductSizes(product);
    setSelectedSizes(sizes);
    const initialStockMap: Record<string, number> = {};
    sizes.forEach((s) => {
      const stockVal = product.shirtStock?.[s] ?? product.pantStock?.[s] ?? product.shoeStock?.[s] ?? 0;
      initialStockMap[s] = Number(stockVal);
    });
    setSizeStockInputs(initialStockMap);
    setOverallStockInput(product.overallStock || 0);

    setImagesList(product.images || []);

    const defaultColors = (product.images || []).map((_, idx) => {
      if ((product as any).imageColors && (product as any).imageColors[idx]) {
        return (product as any).imageColors[idx].color_name;
      }
      return product.color || '';
    });
    setImageColors(defaultColors);

    setIsNewArrival(!!(product.isNew || initialColls.includes('New Arrivals')));
    setIsTrending(!!(product.bestSeller || initialColls.includes('Best Sellers') || initialColls.includes('Trending Collection')));
    setIsFeatured(!!(product.metadata?.featured || initialColls.includes('Featured Collection')));
    
    const isCombo = !!(
      (product as any).isComboOffer ||
      product.metadata?.comboOffer ||
      product.metadata?.dealOfDay ||
      product.category?.toLowerCase().includes('combo') ||
      product.collection?.toLowerCase().includes('combo') ||
      initialColls.includes('Combo Offers')
    );
    setIsComboOffer(isCombo);
    setIsDealOfDay(!!(isCombo || product.metadata?.dealOfDay || initialColls.includes('Deal of the Day')));

    const couponEnabled = product.couponApplicable !== false && 
      (product as any).is_coupon_applicable !== false && 
      (product as any).coupon_applicable !== false;

    setIsCouponApplicable(couponEnabled);
    if (couponEnabled) {
      setSelectedCoupons(product.coupons || []);
    } else {
      setSelectedCoupons([]);
    }

    setDeliveryChargeEnabled(!!(product.deliveryChargeEnabled ?? product.delivery_charge_enabled));
    setDeliveryCharge(String(product.deliveryCharge ?? product.delivery_charge ?? 0));
    setSizeTabOverride('auto');
    setFormOpen(true);
  };

  const buildProductPayload = (id: string): Product => {
    const mrp = parseFloat(mrpPrice);
    const selling = parseFloat(sellingPrice);
    const discount = mrp > 0 ? Math.round(((mrp - selling) / mrp) * 100) : 0;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    let effectiveLabel = label;
    if (isNewArrival && !effectiveLabel) effectiveLabel = 'NEW';

    const uniqueColors = Array.from(new Set(imageColors.filter(Boolean)));

    // Construct size-wise stock objects
    const shirtStock: Record<string, number> = {};
    const pantStock: Record<string, number> = {};
    const shoeStock: Record<string, number> = {};
    let calculatedTotal = 0;

    selectedSizes.forEach((s) => {
      const qty = Math.max(0, Math.floor(Number(sizeStockInputs[s] ?? 0)));
      calculatedTotal += qty;

      if (SHIRT_SIZES.includes(s)) {
        shirtStock[s] = qty;
      }
      if (PANT_SIZES.includes(s)) {
        pantStock[s] = qty;
      }
      if (SHOE_SIZES.includes(s)) {
        shoeStock[s] = qty;
      }
      if (!SHIRT_SIZES.includes(s) && !PANT_SIZES.includes(s) && !SHOE_SIZES.includes(s)) {
        if (isPantCat(category)) pantStock[s] = qty;
        else if (isShoeCat(category)) shoeStock[s] = qty;
        else shirtStock[s] = qty;
      }
    });

    const finalOverallStock = selectedSizes.length > 0 ? calculatedTotal : (overallStockInput || 0);

    // SINGLE SOURCE OF TRUTH FOR COUPON APPLICABLE CHECKBOX
    const effectiveCoupons = isCouponApplicable ? selectedCoupons : [];

    const finalCollections = Array.from(new Set(selectedCollections.filter(Boolean)));
    const finalCollectionStr = finalCollections.join(', ') || collection || (isComboOffer ? 'Combo Offers' : '');

    const hasDealOfDay = isDealOfDay || isComboOffer || finalCollections.some(c => c.toLowerCase().includes('deal'));

    const productPayload: Product = {
      id,
      productId: id,
      sku: sku || `GR-${category.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      name,
      title: name,
      slug,
      category,
      collection: finalCollectionStr,
      collections: finalCollections,
      images: imagesList.length > 0 ? imagesList : ['/placeholder.png'],
      color: color || imageColors[0] || '',
      colors: uniqueColors.length > 0 ? uniqueColors : [color || 'Original'],
      mrpPrice: mrp,
      price: mrp,
      sellingPrice: selling,
      discountedPrice: selling,
      discountPercent: discount,
      label: effectiveLabel,
      description,
      sizes: selectedSizes, // Clean array representation
      shirtStock,
      pantStock,
      shoeStock,
      overallStock: finalOverallStock,
      brand: brand || 'GR STYLES',
      rating: 5.0,
      reviews: 0,
      isNew: isNewArrival,
      bestSeller: isTrending,
      inStock: finalOverallStock > 0,
      stockCount: finalOverallStock,
      metadata: {
        dealOfDay: hasDealOfDay,
        comboOffer: isComboOffer || hasDealOfDay,
        featured: isFeatured,
        tags,
      },
      coupons: effectiveCoupons,
      imageColors: imagesList.map((img, idx) => ({
        image_url: img,
        color_name: imageColors[idx] || color || 'Original',
        display_order: idx
      })),
      deliveryChargeEnabled,
      deliveryCharge: deliveryChargeEnabled ? Math.max(0, Number(deliveryCharge) || 0) : 0,
      delivery_charge_enabled: deliveryChargeEnabled,
      delivery_charge: deliveryChargeEnabled ? Math.max(0, Number(deliveryCharge) || 0) : 0,
      couponApplicable: isCouponApplicable,
      is_coupon_applicable: isCouponApplicable,
      coupon_applicable: isCouponApplicable,
    } as any;

    console.log('[DEBUG Admin Product Payload]', {
      id,
      name,
      isCouponApplicable,
      coupons: effectiveCoupons,
    });

    return productPayload;
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !color || !mrpPrice || !sellingPrice || !description) {
      dispatch(addToast({ message: 'Please fill out all required fields.', type: 'error' }));
      return;
    }

    const mrp = parseFloat(mrpPrice);
    const selling = parseFloat(sellingPrice);

    if (selling > mrp) {
      dispatch(addToast({ message: 'Selling price cannot exceed MRP.', type: 'error' }));
      return;
    }

    if (deliveryChargeEnabled) {
      const chargeNum = Number(deliveryCharge);
      if (isNaN(chargeNum) || chargeNum < 0) {
        dispatch(addToast({ message: 'Delivery Charge cannot be negative.', type: 'error' }));
        return;
      }
    }

    // Verify all subsequent images have colors assigned
    if (imagesList.length > 1) {
      for (let i = 1; i < imagesList.length; i++) {
        if (!imageColors[i] || !imageColors[i].trim()) {
          dispatch(addToast({ message: `Please specify a color name for the ${getOrdinalText(i)} image.`, type: 'error' }));
          return;
        }
      }
    }

    // Size & Stock Validation
    if (selectedSizes.length === 0 && overallStockInput === 0) {
      dispatch(addToast({ message: 'Please select at least one available size and specify stock for this product.', type: 'error' }));
      return;
    }

    if (selectedSizes.length > 0) {
      for (const s of selectedSizes) {
        const val = sizeStockInputs[s];
        if (val === undefined || val === null || isNaN(Number(val)) || Number(val) < 0) {
          dispatch(addToast({ message: `Please enter a valid non-negative stock quantity for size ${s}.`, type: 'error' }));
          return;
        }
        if (!Number.isInteger(Number(val))) {
          dispatch(addToast({ message: `Stock quantity for size ${s} must be a whole number.`, type: 'error' }));
          return;
        }
      }
    }

    const tempId = editingId || `p-${Date.now()}`;
    const productPayload = buildProductPayload(tempId);

    setLoading(true);
    try {
      if (editingId) {
        const updated = await repo.products.update(editingId, productPayload);
        if (updated) {
          setItems((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...updated } : p)));
          dispatch(addToast({ message: `✓ "${name}" updated successfully!`, type: 'success' }));
          resetForm();
          setFormOpen(false);
        } else {
          dispatch(addToast({ message: 'Failed to update product.', type: 'error' }));
        }
      } else {
        const created = await repo.products.create(productPayload);
        if (created) {
          setItems((prev) => [created, ...prev]);
          dispatch(addToast({ message: `✓ "${name}" added to catalog! Visible on website now.`, type: 'success' }));
          resetForm();
          setFormOpen(false);
        } else {
          dispatch(addToast({ message: 'Failed to save product.', type: 'error' }));
        }
      }
    } catch (err: any) {
      dispatch(addToast({ message: err.message || 'Error saving product.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return;
    try {
      const success = await repo.products.delete(productId);
      if (success) {
        setItems((prev) => prev.filter((p) => p.id !== productId));
        dispatch(addToast({ message: `"${productName}" removed from catalog.`, type: 'info' }));
      } else {
        dispatch(addToast({ message: 'Failed to delete product.', type: 'error' }));
      }
    } catch (e: any) {
      dispatch(addToast({ message: e.message || 'Error deleting product.', type: 'error' }));
    }
  };

  const handleToggleLabel = async (product: Product, newLabel: string) => {
    const effectiveLabel = product.label === newLabel ? '' : newLabel;
    const updated = await repo.products.update(product.id, {
      label: effectiveLabel,
      isNew: effectiveLabel === 'NEW',
      bestSeller: effectiveLabel === 'BEST SELLER',
    });
    if (updated) {
      setItems((prev) => prev.map((p) => (p.id === product.id ? { ...p, label: effectiveLabel } : p)));
    }
  };

  // Filtered products
  const filteredProducts = items.filter((p) => {
    const matchesCat = filterCat === 'All' || p.category === filterCat;
    const matchesSearch =
      (p.name || p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Active Size View Flags
  const showCombo = sizeTabOverride === 'combo' || (sizeTabOverride === 'auto' && isComboCat(category, collection, isDealOfDay, isComboOffer));
  const showShirt = sizeTabOverride === 'shirts' || sizeTabOverride === 'combo' || sizeTabOverride === 'all' || (sizeTabOverride === 'auto' && (isShirtCat(category) || showCombo));
  const showPant = sizeTabOverride === 'pants' || sizeTabOverride === 'combo' || sizeTabOverride === 'all' || (sizeTabOverride === 'auto' && (isPantCat(category) || showCombo));
  const showShoe = sizeTabOverride === 'shoes' || sizeTabOverride === 'all' || (sizeTabOverride === 'auto' && isShoeCat(category));
  const showOverall = sizeTabOverride === 'overall' || sizeTabOverride === 'all' || (sizeTabOverride === 'auto' && isAccessoryCat(category));

  return (
    <div className="space-y-6">

      {/* Page Title & Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900 uppercase">Product Catalog</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your store inventory, variant stock by size, categories, and combo offer tags.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadProductsAndCoupons}
            className="p-3 border border-gray-200 rounded-xl hover:border-black transition-all text-gray-600 hover:text-black"
            title="Refresh Products"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button
            id="admin-add-product-btn"
            onClick={() => {
              if (formOpen) {
                setFormOpen(false);
                resetForm();
              } else {
                resetForm();
                setFormOpen(true);
              }
            }}
            className="flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-sm active:scale-95"
          >
            {formOpen ? <X size={14} /> : <Plus size={14} />}
            {formOpen ? 'Cancel' : 'Add New Product'}
          </button>
        </div>
      </div>

      {/* Product Form Drawer */}
      {formOpen && (
        <form
          onSubmit={handleAddProduct}
          className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              {editingId ? 'Edit Product Details' : 'Create New Product'}
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">* Required fields</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Basic Info */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Name / Title *</label>
                <input
                  id="form-product-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Slim Fit Cotton Oxford Shirt"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category *</label>
                  {loadingCategories ? (
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs text-gray-400 flex items-center gap-2">
                      <RefreshCw size={14} className="animate-spin" /> Loading categories...
                    </div>
                  ) : availableCategoryOptions.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      No active categories found. Please create one in <strong>Marketing → Category Carousel</strong>.
                    </div>
                  ) : (
                    <select
                      required
                      value={category}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setCategory(newCat);
                        if (isComboCat(newCat, collection, isDealOfDay, isComboOffer)) {
                          setIsComboOffer(true);
                          setSizeTabOverride('combo');
                        } else if (isPantCat(newCat)) {
                          setSizeTabOverride('pants');
                        } else if (isShirtCat(newCat)) {
                          setSizeTabOverride('shirts');
                        } else if (isShoeCat(newCat)) {
                          setSizeTabOverride('shoes');
                        } else if (isAccessoryCat(newCat)) {
                          setSizeTabOverride('overall');
                        } else {
                          setSizeTabOverride('all');
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm font-medium bg-white"
                    >
                      <option value="" disabled>Select Category</option>
                      {availableCategoryOptions.map((c) => {
                        const dbCat = dbCategories.find(item => item.title === c);
                        const isInactive = dbCat && !dbCat.enabled;
                        return (
                          <option key={c} value={c}>
                            {c} {isInactive ? '(Inactive)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
                <div className="space-y-2 col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Website Collections (Assign to 1 or Multiple)
                    </label>
                    {selectedCollections.length > 0 && (
                      <span className="text-[11px] font-semibold text-black bg-gray-100 px-2 py-0.5 rounded-full">
                        {selectedCollections.length} selected
                      </span>
                    )}
                  </div>
                  
                  {/* Selectable Collection Pills */}
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 bg-gray-50/80 border border-gray-200 rounded-xl">
                    {availableWebsiteCollections.map((c) => {
                      const isSelected = selectedCollections.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCollectionSelection(c)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-black text-white shadow-sm font-semibold'
                              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                          }`}
                        >
                          {isSelected && <Check size={12} className="stroke-[3]" />}
                          {c}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Collection Input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={customCollectionInput}
                      onChange={(e) => setCustomCollectionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomCollection();
                        }
                      }}
                      placeholder="Add custom collection name..."
                      className="flex-1 px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCollection}
                      className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    Primary Color *
                  </label>
                  <input
                    id="form-product-color"
                    type="text"
                    required
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. White"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm placeholder-gray-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Brand</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="GR STYLES"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm placeholder-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <DollarSign size={10} /> MRP *
                  </label>
                  <input
                    id="form-product-mrp"
                    type="number"
                    step="0.01"
                    required
                    value={mrpPrice}
                    onChange={(e) => setMrpPrice(e.target.value)}
                    placeholder="2999"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <DollarSign size={10} /> Sell Price *
                  </label>
                  <input
                    id="form-product-price"
                    type="number"
                    step="0.01"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="1499"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Tag size={10} /> Label
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="NEW / HOT"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm uppercase placeholder-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description *</label>
                <textarea
                  id="form-product-desc"
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed product features, material composition, care instructions..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm placeholder-gray-300 resize-none"
                />
              </div>

              {/* Coupon Settings */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag size={14} className="text-black" /> Coupon Settings
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="form-product-coupon-applicable"
                      checked={isCouponApplicable}
                      onChange={(e) => handleToggleCouponApplicable(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    />
                    <span className="text-xs font-bold text-gray-900">
                      Coupon Applicable (Eligible for Discounts)
                    </span>
                  </label>
                </div>

                {isCouponApplicable ? (
                  <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {availableCoupons.length > 0 ? availableCoupons.map((c, idx) => (
                        <label key={c.code || idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer text-xs select-none hover:border-black transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedCoupons.includes(c.code)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedCoupons(prev => [...prev, c.code]);
                              else setSelectedCoupons(prev => prev.filter(code => code !== c.code));
                            }}
                            className="rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                          />
                          <span className="font-semibold text-gray-800">{c.code}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                          </span>
                        </label>
                      )) : (
                        <p className="text-xs text-gray-400">No active coupons available.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                    ⚠️ Coupon Applicable is <strong>OFF (Unchecked)</strong>. This product will be excluded from all coupons and promotion discounts.
                  </div>
                )}
              </div>

              {/* Feature Toggles */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Feature Toggles</label>
                <div className="flex flex-wrap gap-2">
                  <ToggleBtn
                    active={isCouponApplicable} onClick={() => handleToggleCouponApplicable(!isCouponApplicable)}
                    icon={Tag} label="Coupon Applicable" activeColor="bg-emerald-50 text-emerald-600"
                  />
                  <ToggleBtn
                    active={isNewArrival} onClick={() => setIsNewArrival(!isNewArrival)}
                    icon={Sparkles} label="New Arrival" activeColor="bg-blue-50 text-blue-600"
                  />
                  <ToggleBtn
                    active={isTrending} onClick={() => setIsTrending(!isTrending)}
                    icon={TrendingUp} label="Trending" activeColor="bg-green-50 text-green-600"
                  />
                  <ToggleBtn
                    active={isFeatured} onClick={() => setIsFeatured(!isFeatured)}
                    icon={Star} label="Featured" activeColor="bg-purple-50 text-purple-600"
                  />
                  <ToggleBtn
                    active={isComboOffer}
                    onClick={() => {
                      const next = !isComboOffer;
                      setIsComboOffer(next);
                      setIsDealOfDay(next);
                      if (next) {
                        if (!category || category === 'Shirts') setCategory('Combo Offers');
                        if (!collection) setCollection('Combo Offers');
                        setSizeTabOverride('combo');
                      }
                    }}
                    icon={Zap} label="Combo Offers" activeColor="bg-amber-50 text-amber-600"
                  />
                </div>
              </div>

              {/* Product Delivery Charge Section */}
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck size={14} className="text-black" /> Product Delivery Charge
                </label>
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={deliveryChargeEnabled}
                      onChange={(e) => setDeliveryChargeEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-gray-900">
                      Apply Product Delivery Charge
                    </span>
                  </label>

                  {deliveryChargeEnabled ? (
                    <div className="space-y-1.5 pl-6 border-l-2 border-black ml-1">
                      <label className="text-[11px] font-semibold text-gray-700 block">
                        Delivery Charge (₹)
                      </label>
                      <div className="relative max-w-xs">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={deliveryCharge}
                          onChange={(e) => setDeliveryCharge(e.target.value)}
                          placeholder="0 for Free Delivery"
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-black bg-white"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium pt-0.5">
                        {Number(deliveryCharge) === 0
                          ? '☑ ON + ₹0 → Free Delivery'
                          : `☑ ON + ₹${deliveryCharge || 0} → Delivery Charge = ₹${deliveryCharge || 0}`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 font-medium pl-6">
                      ☐ OFF → Use existing global shipping settings.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Sizes + Images */}
            <div className="space-y-5 bg-gray-50 p-5 rounded-2xl border border-gray-100">
              
              {/* Selectable Sizes Chips Section */}
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={14} className="text-black" /> Select Available Sizes
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Click chips to toggle available sizes ON/OFF. Highlighted black chips are active.
                    </p>
                  </div>

                  {/* Size Mode Switcher Buttons */}
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSizeTabOverride('shirts')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        sizeTabOverride === 'shirts' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      👔 Shirts
                    </button>
                    <button
                      type="button"
                      onClick={() => setSizeTabOverride('pants')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        sizeTabOverride === 'pants' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      👖 Pants
                    </button>
                    <button
                      type="button"
                      onClick={() => setSizeTabOverride('shoes')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        sizeTabOverride === 'shoes' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      👟 Shoes
                    </button>
                    <button
                      type="button"
                      onClick={() => setSizeTabOverride('combo')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        sizeTabOverride === 'combo' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      🎁 Combo
                    </button>
                    <button
                      type="button"
                      onClick={() => setSizeTabOverride('all')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        sizeTabOverride === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ⚡ All Sizes
                    </button>
                  </div>
                </div>

                {/* Quick Selection Presets */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <span className="text-[11px] font-bold text-gray-500 font-mono">
                    {selectedSizes.length} Size{selectedSizes.length === 1 ? '' : 's'} Selected: <span className="text-black font-semibold">{selectedSizes.length > 0 ? selectedSizes.join(', ') : 'None'}</span>
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => addPresetSizes(SHIRT_SIZES)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all active:scale-95"
                    >
                      + Shirt Sizes
                    </button>
                    <button
                      type="button"
                      onClick={() => addPresetSizes(PANT_SIZES)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all active:scale-95"
                    >
                      + Pant Sizes
                    </button>
                    <button
                      type="button"
                      onClick={() => addPresetSizes(SHOE_SIZES)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all active:scale-95"
                    >
                      + Shoe Sizes
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedSizes([]); setSizeStockInputs({}); }}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all active:scale-95"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Selectable Size Chips Grid */}
                <div className="space-y-4 pt-2">
                  
                  {/* Shirt Sizes */}
                  {showShirt && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                        <span>👔 Shirt / Tops Sizes</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {selectedSizes.filter((s) => SHIRT_SIZES.includes(s)).length} Active
                        </span>
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {SHIRT_SIZES.map((size) => {
                          const isSelected = selectedSizes.includes(size);
                          return (
                            <button
                              key={'chip-shirt-' + size}
                              type="button"
                              onClick={() => toggleSize(size)}
                              className={`h-11 rounded-xl text-xs font-bold transition-all duration-200 border flex items-center justify-center gap-1.5 active:scale-95 ${
                                isSelected
                                  ? 'bg-black text-white border-black shadow-md ring-2 ring-black/10 scale-105'
                                  : 'bg-white text-gray-800 border-gray-200 hover:border-black hover:bg-gray-50'
                              }`}
                            >
                              <span>{size}</span>
                              {isSelected && <Check size={12} className="stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pant Sizes */}
                  {showPant && (
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                        <span>👖 Pant / Waist Sizes</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {selectedSizes.filter((s) => PANT_SIZES.includes(s)).length} Active
                        </span>
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {PANT_SIZES.map((size) => {
                          const isSelected = selectedSizes.includes(size);
                          return (
                            <button
                              key={'chip-pant-' + size}
                              type="button"
                              onClick={() => toggleSize(size)}
                              className={`h-11 rounded-xl text-xs font-bold transition-all duration-200 border flex items-center justify-center gap-1.5 active:scale-95 ${
                                isSelected
                                  ? 'bg-black text-white border-black shadow-md ring-2 ring-black/10 scale-105'
                                  : 'bg-white text-gray-800 border-gray-200 hover:border-black hover:bg-gray-50'
                              }`}
                            >
                              <span>{size}</span>
                              {isSelected && <Check size={12} className="stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Shoe Sizes */}
                  {showShoe && (
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                        <span>👟 Shoe UK Sizes</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {selectedSizes.filter((s) => SHOE_SIZES.includes(s)).length} Active
                        </span>
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {SHOE_SIZES.map((size) => {
                          const isSelected = selectedSizes.includes(size);
                          return (
                            <button
                              key={'chip-shoe-' + size}
                              type="button"
                              onClick={() => toggleSize(size)}
                              className={`h-11 rounded-xl text-xs font-bold transition-all duration-200 border flex items-center justify-center gap-1.5 active:scale-95 ${
                                isSelected
                                  ? 'bg-black text-white border-black shadow-md ring-2 ring-black/10 scale-105'
                                  : 'bg-white text-gray-800 border-gray-200 hover:border-black hover:bg-gray-50'
                              }`}
                            >
                              <span>UK {size}</span>
                              {isSelected && <Check size={12} className="stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Overall Stock Fallback */}
                  {showOverall && (
                    <div className="pt-2 border-t border-gray-100">
                      <h4 className="text-xs font-bold text-gray-800 mb-2">📦 Overall Product Inventory</h4>
                      <input
                        type="number"
                        min="0"
                        value={overallStockInput === 0 ? '' : overallStockInput}
                        placeholder="e.g. 50 units"
                        onChange={(e) => setOverallStockInput(parseInt(e.target.value, 10) || 0)}
                        className="w-40 border border-gray-300 rounded-xl text-xs px-4 py-2.5 bg-white focus:border-black focus:ring-1 focus:ring-black focus:outline-none font-mono font-semibold"
                      />
                    </div>
                  )}

                  {/* Dynamic Stock Inputs for Selected Sizes */}
                  {selectedSizes.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Package size={14} className="text-black" /> Size-wise Stock Management
                        </label>
                        <span className="text-xs font-bold text-gray-700 font-mono bg-gray-100 px-2 py-0.5 rounded-md">
                          Total: {Object.values(sizeStockInputs).reduce((a, b) => a + (Number(b) || 0), 0)} units
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Specify the available inventory quantity for each selected size.
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {selectedSizes.map((size) => {
                          const stockVal = sizeStockInputs[size] !== undefined ? sizeStockInputs[size] : 0;
                          return (
                            <div key={`stock-input-${size}`} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-2.5 shadow-2xs hover:border-black focus-within:border-black transition-colors">
                              <span className="text-xs font-bold text-gray-900 font-mono">{size}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-semibold text-gray-400 uppercase">Stock:</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  required
                                  value={stockVal}
                                  onChange={(e) => {
                                    const parsed = parseInt(e.target.value, 10);
                                    const cleanVal = isNaN(parsed) ? 0 : Math.max(0, parsed);
                                    setSizeStockInputs((prev) => ({
                                      ...prev,
                                      [size]: cleanVal,
                                    }));
                                  }}
                                  className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold text-right focus:outline-none focus:border-black focus:bg-white"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Images and Colors */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Product Images & Color Mapping</label>
                
                {imagesList.length > 1 && (
                  <p className="text-[10px] text-gray-400 italic">Drag and drop images to reorder them.</p>
                )}

                {/* Upload Button */}
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Upload size={14} />
                    <span>{uploading ? 'Uploading...' : 'Upload Image File'}</span>
                  </button>
                </div>

                {/* Uploaded Images List */}
                <div className="space-y-3 pt-2">
                  {imagesList.map((img, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, idx)}
                      className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs group cursor-grab active:cursor-grabbing"
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                        <Image src={img} alt={`Product ${idx}`} fill unoptimized className="object-cover" />
                      </div>

                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {idx === 0 ? 'Primary Color (Auto)' : `${getOrdinalText(idx)} Image Color *`}
                        </label>
                        <input
                          type="text"
                          required={idx > 0}
                          value={imageColors[idx] || ''}
                          onChange={(e) => handleImageColorChange(idx, e.target.value)}
                          placeholder="e.g. Black, White, Denim Blue"
                          className="w-full border border-gray-200 rounded-lg text-xs px-3 py-1.5 focus:border-black focus:outline-none font-medium"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Remove Image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                resetForm();
              }}
              className="px-5 py-2.5 border border-gray-200 hover:border-black text-gray-700 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{editingId ? 'Update Product' : 'Save & Publish Product'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Product List Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by title, SKU, category..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black"
              />
            </div>
            
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-black"
            >
              <option value="All">All Categories</option>
              {filterCategoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <span className="text-xs text-gray-400 font-mono">
            Showing {filteredProducts.length} of {items.length} Products
          </span>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-4 pl-6">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Delivery</th>
                  <th className="p-4">Available Sizes</th>
                  <th className="p-4">Status / Label</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const productSizes = getProductSizes(product);
                  const isDeliveryEnabled = !!(product.deliveryChargeEnabled ?? (product as any).delivery_charge_enabled);
                  const customDeliveryCharge = Number(product.deliveryCharge ?? (product as any).delivery_charge ?? 0);

                  return (
                    <tr key={product.id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                            <Image
                              src={product.images?.[0] || '/placeholder.png'}
                              alt={product.name || product.title}
                              fill
                              unoptimized
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 line-clamp-1">{product.name || product.title}</p>
                            <p className="text-[10px] text-gray-400 font-mono">SKU: {product.sku || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-block bg-gray-100 text-gray-700 font-medium px-2.5 py-1 rounded-md text-[11px]">
                          {product.category}
                        </span>
                        {product.collection && (
                          <p className="text-[10px] text-gray-400 mt-0.5">{product.collection}</p>
                        )}
                      </td>
                      <td className="p-4 font-mono font-medium">
                        <div className="text-gray-900">{formatPrice(product.sellingPrice || product.discountedPrice || product.price)}</div>
                        {product.mrpPrice > (product.sellingPrice || 0) && (
                          <div className="text-[10px] text-gray-400 line-through">
                            {formatPrice(product.mrpPrice)}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-mono font-medium">
                        {!isDeliveryEnabled ? (
                          <span className="inline-block bg-gray-100 text-gray-600 font-medium px-2.5 py-1 rounded-md text-[11px]">
                            Global
                          </span>
                        ) : customDeliveryCharge === 0 ? (
                          <span className="inline-block bg-green-50 text-green-700 font-bold px-2.5 py-1 rounded-md text-[11px]">
                            Free
                          </span>
                        ) : (
                          <span className="inline-block bg-amber-50 text-amber-800 font-bold px-2.5 py-1 rounded-md text-[11px]">
                            ₹{customDeliveryCharge}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                          {productSizes.length > 0 ? (
                            productSizes.map((s) => {
                              const stockVal = product.shirtStock?.[s] ?? product.pantStock?.[s] ?? product.shoeStock?.[s] ?? 0;
                              const isZero = Number(stockVal) === 0;
                              return (
                                <span
                                  key={s}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono flex items-center gap-1 ${
                                    isZero ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-black text-white'
                                  }`}
                                  title={`${s}: ${stockVal} units in stock`}
                                >
                                  <span>{s}:</span>
                                  <span>{stockVal}</span>
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-red-500 font-bold text-[10px] uppercase">Out of Stock</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {product.label && (
                            <span className="bg-red-50 text-red-500 border border-red-100 text-[9px] font-bold px-2 py-0.5 rounded-full">
                              {product.label}
                            </span>
                          )}
                          {product.isNew && !product.label && (
                            <span className="bg-blue-50 text-blue-500 text-[9px] font-bold px-2 py-0.5 rounded-full">NEW</span>
                          )}
                          {product.bestSeller && (
                            <span className="bg-amber-50 text-amber-500 text-[9px] font-bold px-2 py-0.5 rounded-full">🔥 TRENDING</span>
                          )}
                          {(product.metadata?.dealOfDay || product.metadata?.comboOffer) && (
                            <span className="bg-purple-50 text-purple-600 text-[9px] font-bold px-2 py-0.5 rounded-full">⚡ COMBO</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleLabel(product, 'NEW')}
                            className={`p-1.5 rounded-lg transition-all text-[10px] ${product.label === 'NEW' || product.isNew ? 'bg-blue-50 text-blue-500' : 'text-gray-300 hover:text-blue-400'}`}
                            title="Toggle New Arrival"
                          >
                            <Sparkles size={13} />
                          </button>
                          <button
                            onClick={() => handleToggleLabel(product, 'BEST SELLER')}
                            className={`p-1.5 rounded-lg transition-all ${product.label === 'BEST SELLER' || product.bestSeller ? 'bg-amber-50 text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
                            title="Toggle Trending"
                          >
                            <TrendingUp size={13} />
                          </button>
                          <button
                            onClick={() => handleToggleLabel(product, 'HOT')}
                            className={`p-1.5 rounded-lg transition-all ${product.label === 'HOT' ? 'bg-red-50 text-red-500' : 'text-gray-300 hover:text-red-400'}`}
                            title="Toggle Hot"
                          >
                            <Star size={13} />
                          </button>
                          <button
                            onClick={() => populateFormFromProduct(product)}
                            className="p-1.5 text-gray-300 hover:text-black hover:bg-gray-50 rounded-lg transition-all"
                            title="Edit Product"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name || product.title || '')}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Product"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <ShoppingBag size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No products match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleBtn({ active, onClick, icon: Icon, label, activeColor }: {
  active: boolean; onClick: () => void; icon: any; label: string; activeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
        active ? `${activeColor} border-transparent shadow-2xs` : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'
      }`}
    >
      <Icon size={12} />
      <span>{label}</span>
      {active && <Check size={10} className="ml-0.5" />}
    </button>
  );
}
