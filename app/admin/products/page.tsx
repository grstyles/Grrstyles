'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product } from '@/lib/data/products';
import { repo } from '@/lib/repositories';
import { COLLECTIONS } from '@/lib/config';
import {
  Plus, X, Trash2, Tag, ShoppingBag, DollarSign, Upload,
  Star, TrendingUp, Sparkles, Zap, RefreshCw, Search, Check, Edit2
} from 'lucide-react';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { useDispatch } from 'react-redux';
import { formatPrice } from '@/lib/utils/helpers';
import Image from 'next/image';

const CATEGORIES = [
  'Shirts',
  'Printed Shirts',
  'T-Shirts',
  'Jackets',
  'Night Tracks',
  'Accessories',
  'Formal Pant',
  'Formal Shirts',
  'Trousers',
  'Denim Jeans',
  'Shoes',
];
const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const PANT_SIZES  = ['28', '30', '32', '34', '36', '38'];
const SHOE_SIZES  = ['6', '7', '8', '9', '10', '11'];

function getSizeOptions(cat: string) {
  if (['Trousers', 'Denim Jeans', 'Formal Pant'].includes(cat)) return PANT_SIZES;
  if (cat === 'Shoes') return SHOE_SIZES;
  return SHIRT_SIZES;
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

  // Form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Shirts');
  const [collection, setCollection] = useState('');
  const [brand, setBrand] = useState('GR STYLES');
  const [tagsInput, setTagsInput] = useState('');
  const [color, setColor] = useState('');
  const [mrpPrice, setMrpPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [description, setDescription] = useState('');
  const [label, setLabel] = useState('');
  const [sizesInput, setSizesInput] = useState<{ size: string; stock: number }[]>([]);
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  // Feature toggles
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isDealOfDay, setIsDealOfDay] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await repo.products.getAll();
      setItems(data);
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Sync default sizes when category changes
  useEffect(() => {
    const defaults = getSizeOptions(category).map((s) => ({ size: s, stock: 10 }));
    setSizesInput(defaults);
  }, [category]);

  const handleSizeStockChange = (size: string, val: number) => {
    setSizesInput((prev) =>
      prev.map((item) => (item.size === size ? { ...item, stock: Math.max(0, val) } : item))
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await repo.storage.uploadImage(file, 'products');
      if (url) {
        setImagesList((prev) => [...prev, url]);
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
    setCategory('Shirts');
    setCollection('');
    setBrand('GR STYLES');
    setTagsInput('');
    setColor('');
    setMrpPrice('');
    setSellingPrice('');
    setDescription('');
    setLabel('');
    setImagesList([]);
    setIsNewArrival(false);
    setIsTrending(false);
    setIsFeatured(false);
    setIsDealOfDay(false);
  };

  const populateFormFromProduct = (product: Product) => {
    setEditingId(product.id);
    setName(product.name || product.title);
    setSku(product.sku || '');
    setCategory(product.category);
    setCollection(product.collection || '');
    setBrand(product.brand || 'GR STYLES');
    setTagsInput((product.metadata?.tags || []).join(', '));
    setColor(product.color);
    setMrpPrice(String(product.mrpPrice || product.price || ''));
    setSellingPrice(String(product.sellingPrice || product.discountedPrice || ''));
    setDescription(product.description);
    setLabel(product.label || '');
    setSizesInput(product.sizes?.length ? [...product.sizes] : getSizeOptions(product.category).map((s) => ({ size: s, stock: 10 })));
    setImagesList(product.images || []);
    setIsNewArrival(!!product.isNew);
    setIsTrending(!!product.bestSeller);
    setIsFeatured(!!product.metadata?.featured);
    setIsDealOfDay(!!product.metadata?.dealOfDay);
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

    return {
      id,
      productId: id,
      sku: sku || `GR-${category.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      name,
      title: name,
      slug,
      category,
      collection,
      images: imagesList.length > 0 ? imagesList : ['/placeholder.png'],
      color,
      colors: [color],
      mrpPrice: mrp,
      price: mrp,
      sellingPrice: selling,
      discountedPrice: selling,
      discountPercent: discount,
      label: effectiveLabel,
      description,
      sizes: sizesInput.filter((s) => s.stock > 0),
      brand: brand || 'GR STYLES',
      rating: 5.0,
      reviews: 0,
      isNew: isNewArrival,
      bestSeller: isTrending,
      inStock: sizesInput.some((s) => s.stock > 0),
      stockCount: sizesInput.reduce((sum, s) => sum + s.stock, 0),
      metadata: {
        dealOfDay: isDealOfDay,
        featured: isFeatured,
        tags,
      },
    };
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
      dispatch(addToast({ message: `Label updated to "${effectiveLabel || 'None'}"`, type: 'success' }));
    }
  };

  // Filtering
  const filteredItems = items.filter((p) => {
    const matchesCat = filterCat === 'All' || p.category === filterCat;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.color || '').toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const ToggleBtn = ({
    active, onClick, icon: Icon, label: btnLabel, activeColor
  }: {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
    activeColor: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
        active
          ? `${activeColor} border-transparent`
          : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
      }`}
    >
      <Icon size={11} />
      {btnLabel}
      {active && <Check size={10} />}
    </button>
  );

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900 uppercase">Product Catalog</h1>
          <p className="text-sm text-gray-400 mt-1">{items.length} products · Changes reflect on website immediately.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadProducts}
            className="p-2.5 border border-gray-200 hover:border-black rounded-xl text-gray-500 hover:text-black transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            id="admin-add-product-btn"
            onClick={() => {
              if (formOpen) {
                resetForm();
                setFormOpen(false);
              } else {
                resetForm();
                setFormOpen(true);
              }
            }}
            className="flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
          >
            {formOpen ? <X size={14} /> : <Plus size={14} />}
            {formOpen ? 'Close Form' : 'Add New Product'}
          </button>
        </div>
      </div>

      {/* Add Product Form */}
      {formOpen && (
        <form onSubmit={handleAddProduct} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest border-b border-gray-100 pb-3">
            {editingId ? 'Edit Product Details' : 'New Product Details'}
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: General Details */}
            <div className="space-y-4 lg:col-span-2">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Name *</label>
                <input
                  id="form-product-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. White Baggy Pant"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm placeholder-gray-300"
                />
              </div>

              {/* SKU + Brand */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">SKU</label>
                  <input
                    id="form-product-sku"
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. GR-SH-001"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm placeholder-gray-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Brand</label>
                  <input
                    id="form-product-brand"
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="GR STYLES"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm placeholder-gray-300"
                  />
                </div>
              </div>

              {/* Category + Collection + Color */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Collection</label>
                  <select
                    value={collection}
                    onChange={(e) => setCollection(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
                  >
                    <option value="">None</option>
                    {COLLECTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Color *</label>
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
              </div>

              {/* Prices + Label */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <DollarSign size={10} /> MRP *
                  </label>
                  <input
                    id="form-mrp-price"
                    type="number" required min="0"
                    value={mrpPrice}
                    onChange={(e) => setMrpPrice(e.target.value)}
                    placeholder="1200"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <DollarSign size={10} /> Sell Price *
                  </label>
                  <input
                    id="form-selling-price"
                    type="number" required min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="599"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Tag size={10} /> Label
                  </label>
                  <select
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
                  >
                    <option value="">NONE</option>
                    <option value="NEW">NEW</option>
                    <option value="BEST SELLER">BEST SELLER</option>
                    <option value="HOT">HOT</option>
                    <option value="SALE">SALE</option>
                  </select>
                </div>
              </div>

              {/* Description + Tags */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description *</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the product — fabric, fit, details..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm placeholder-gray-300 resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. casual, summer, slim-fit"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm placeholder-gray-300"
                  />
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Feature Toggles</label>
                <div className="flex flex-wrap gap-2">
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
                    active={isDealOfDay} onClick={() => setIsDealOfDay(!isDealOfDay)}
                    icon={Zap} label="Deal of Day" activeColor="bg-amber-50 text-amber-600"
                  />
                </div>
              </div>
            </div>

            {/* Right: Sizes + Images */}
            <div className="space-y-5 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              {/* Sizes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Sizes & Stock</label>
                <div className="grid grid-cols-2 gap-2">
                  {sizesInput.map((item) => (
                    <div key={item.size} className="flex items-center justify-between bg-white border border-gray-100 px-3 py-2 rounded-xl">
                      <span className="text-xs font-bold text-gray-700 min-w-[28px]">{item.size}</span>
                      <input
                        type="number"
                        value={item.stock}
                        min={0}
                        onChange={(e) => handleSizeStockChange(item.size, parseInt(e.target.value) || 0)}
                        className="w-12 text-center text-xs font-bold border-b border-gray-200 focus:border-black focus:outline-none bg-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Product Images</label>
                <div className="flex gap-2 flex-wrap">
                  {imagesList.map((img, idx) => (
                    <div key={idx} className="relative w-12 h-16 border rounded-lg overflow-hidden bg-white flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`Product ${idx}`} className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => setImagesList((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 text-white rounded-full"
                      >
                        <X size={8} />
                      </button>
                    </div>
                  ))}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-16 border-2 border-dashed border-gray-300 hover:border-black rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-black transition-colors flex-shrink-0"
                  >
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload size={13} />
                        <span className="text-[7px] font-bold mt-1">UPLOAD</span>
                      </>
                    )}
                  </button>
                </div>
                {mrpPrice && sellingPrice && parseFloat(mrpPrice) > 0 && (
                  <div className="text-[10px] text-gray-400 bg-white rounded-xl border border-gray-100 px-3 py-2">
                    Discount: <strong className="text-green-600">{Math.round(((parseFloat(mrpPrice) - parseFloat(sellingPrice)) / parseFloat(mrpPrice)) * 100)}% off</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-5 py-3 border border-gray-200 hover:border-black text-black rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              id="form-submit-product"
              type="submit"
              className="px-7 py-3 bg-black hover:bg-gray-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
            >
              {editingId ? 'Update Product →' : 'Save Product →'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black placeholder-gray-300 font-semibold"
          />
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 flex-wrap">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all ${
                filterCat === cat
                  ? 'bg-black text-white border-black'
                  : 'text-gray-500 border-gray-200 hover:border-gray-400 hover:text-black'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Catalog Listings
          </h3>
          <span className="text-xs text-gray-400">{filteredItems.length} of {items.length} products</span>
        </div>

        {filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  <th className="p-4 pl-6">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">MRP</th>
                  <th className="p-4">Sale Price</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Label / Tags</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredItems.map((product) => {
                  const displayPrice = product.sellingPrice || product.discountedPrice || 0;
                  const originalPrice = product.mrpPrice || product.price || 0;
                  const totalStock = (product.sizes || []).reduce((sum, s) => sum + s.stock, 0);
                  const imageSrc = product.images?.[0] || '/placeholder.png';
                  const isLowStock = totalStock > 0 && totalStock <= 5;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-12 rounded bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                            <Image
                              src={imageSrc}
                              alt={product.name || ''}
                              fill
                              className="object-cover"
                              sizes="40px"
                              unoptimized={imageSrc.startsWith('data:')}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 uppercase max-w-[180px] truncate">{product.name || product.title}</p>
                            <p className="text-[9px] text-gray-400 uppercase font-mono">{product.color}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-500 uppercase font-semibold">{product.category}</td>
                      <td className="p-4 text-gray-400 line-through">{formatPrice(originalPrice)}</td>
                      <td className="p-4 font-bold text-gray-800">{formatPrice(displayPrice)}</td>
                      <td className="p-4">
                        {product.discountPercent > 0 && (
                          <span className="bg-green-50 text-green-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            {product.discountPercent}% OFF
                          </span>
                        )}
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
                        </div>
                      </td>
                      <td className="p-4">
                        {totalStock === 0 ? (
                          <span className="text-red-500 font-bold text-[10px] uppercase">Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="text-amber-500 font-bold">{totalStock} ⚠️</span>
                        ) : (
                          <span className="text-green-600 font-semibold">{totalStock} units</span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick label toggles */}
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
