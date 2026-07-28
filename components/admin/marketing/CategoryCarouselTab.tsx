'use client';

import React, { useState, useEffect } from 'react';
import { GripVertical, Plus, Trash2, Save, X, Edit, Upload, Loader2 } from 'lucide-react';
import { repo } from '@/lib/repositories';
import { CategoryCarouselItem } from '@/lib/repositories/categoryCarouselRepository';
import { supabaseAuth } from '@/lib/supabase';
import { useDispatch } from 'react-redux';
import { addToast } from '@/lib/redux/slices/uiSlice';

export default function CategoryCarouselTab() {
  const dispatch = useDispatch();
  const [categories, setCategories] = useState<CategoryCarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CategoryCarouselItem>>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await repo.categoryCarousel.getAll();
      setCategories(data);
    } catch (err: any) {
      console.error('[CategoryCarouselTab] Failed to load categories:', err);
      dispatch(addToast({ message: 'Failed to load categories', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (isNaN(dragIndex) || dragIndex === dropIndex) return;

    const newCategories = [...categories];
    const [draggedItem] = newCategories.splice(dragIndex, 1);
    newCategories.splice(dropIndex, 0, draggedItem);

    // Update priorities
    const updated = newCategories.map((item, idx) => ({ ...item, priority: idx }));
    setCategories(updated);

    try {
      await repo.categoryCarousel.updateOrder(updated.map(i => ({ id: i.id, priority: i.priority })));
      dispatch(addToast({ message: 'Category order updated', type: 'success' }));
    } catch (err: any) {
      console.error('[CategoryCarouselTab] Failed to update order:', err);
      dispatch(addToast({ message: 'Failed to save new order', type: 'error' }));
    }
  };

  const toggleEnabled = async (id: string, currentEnabled: boolean) => {
    const nextState = !currentEnabled;
    setCategories(prev => prev.map(c => c.id === id ? { ...c, enabled: nextState } : c));
    try {
      await repo.categoryCarousel.update(id, { enabled: nextState });
      dispatch(addToast({ 
        message: `Category ${nextState ? 'enabled' : 'disabled'}`, 
        type: 'success' 
      }));
    } catch (err: any) {
      console.error('[CategoryCarouselTab] Failed to toggle category:', err);
      dispatch(addToast({ message: 'Failed to toggle category state', type: 'error' }));
      // Revert state on error
      setCategories(prev => prev.map(c => c.id === id ? { ...c, enabled: currentEnabled } : c));
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await repo.categoryCarousel.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      dispatch(addToast({ message: 'Category deleted successfully', type: 'success' }));
    } catch (err: any) {
      console.error('[CategoryCarouselTab] Failed to delete category:', err);
      dispatch(addToast({ message: 'Failed to delete category', type: 'error' }));
    }
  };

  const startEdit = (cat?: CategoryCarouselItem) => {
    if (cat) {
      setEditingId(cat.id);
      setEditForm({ ...cat });
    } else {
      setEditingId('new');
      setEditForm({
        title: '',
        slug: '',
        image_url: '',
        bg_color: '#f5f0eb',
        enabled: true,
        featured: false,
        priority: categories.length
      });
    }
  };

  const saveEdit = async () => {
    if (!editForm.title?.trim() || !editForm.slug?.trim()) {
      dispatch(addToast({ message: 'Title and slug are required.', type: 'error' }));
      return;
    }

    setIsSaving(true);
    try {
      const { id: _id, ...cleanEditForm } = editForm as any;
      const payload = {
        ...cleanEditForm,
        title: editForm.title.trim(),
        slug: editForm.slug.trim(),
        image_url: editForm.image_url?.trim() ? editForm.image_url.trim() : '/images/category-placeholder.png'
      };

      if (editingId === 'new') {
        const newItem = await repo.categoryCarousel.create(payload);
        if (newItem && newItem.id) {
          setCategories(prev => [...prev, newItem]);
        }
      } else if (editingId) {
        const updatedItem = await repo.categoryCarousel.update(editingId, payload);
        if (updatedItem && updatedItem.id) {
          setCategories(prev => prev.map(c => c.id === editingId ? updatedItem : c));
        }
      }
      setEditingId(null);
      dispatch(addToast({ message: 'Category saved successfully', type: 'success' }));
    } catch (err: any) {
      console.error('[CategoryCarouselTab] Error saving category:', err);
      dispatch(addToast({ message: err?.message || 'Failed to save category', type: 'error' }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { data: { session } } = await supabaseAuth!.auth.getSession();
      if (!session) {
        dispatch(addToast({ message: "Please login again.", type: 'error' }));
        return;
      }

      const url = await repo.storage.uploadImage(file, 'category-images' as any);
      if (!url) {
         console.warn('Storage upload failed, fallback to local path');
         dispatch(addToast({ message: 'Supabase Storage upload failed. Using default image path.', type: 'error' }));
         setEditForm(prev => ({ ...prev, image_url: '/images/category-placeholder.png' }));
         return;
      }
      setEditForm(prev => ({ ...prev, image_url: url }));
      dispatch(addToast({ message: 'Image uploaded successfully', type: 'success' }));
    } catch (err: any) {
      console.error('[CategoryCarouselTab] Upload error:', err);
      dispatch(addToast({ message: err.message || 'Storage upload failed', type: 'error' }));
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500 gap-3">
        <Loader2 className="animate-spin" size={20} />
        <span>Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Category Carousel</h2>
          <p className="text-sm text-gray-500">Manage the premium category circles on the homepage.</p>
        </div>
        <button 
          onClick={() => startEdit()}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="space-y-3">
        {categories.map((cat, idx) => (
          <div 
            key={cat.id} 
            className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 transition-all"
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, idx)}
          >
            <div className="cursor-grab text-gray-400 hover:text-black" title="Drag to reorder">
              <GripVertical size={20} />
            </div>

            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border" style={{ backgroundColor: cat.bg_color }}>
              <img src={cat.image_url} alt={cat.title} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 font-medium text-gray-900">
              {cat.title} 
              <span className="text-xs text-gray-400 font-normal ml-2">/{cat.slug}</span>
              {cat.featured && (
                <span className="ml-2 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-amber-100 text-amber-800 rounded-full">
                  Featured
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer" title={cat.enabled ? "Active (Click to disable)" : "Disabled (Click to enable)"}>
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={cat.enabled}
                  onChange={() => toggleEnabled(cat.id, cat.enabled)}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
              </label>

              <button 
                onClick={() => startEdit(cat)} 
                className="p-2 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100 transition-colors"
                title="Edit category"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => deleteCategory(cat.id)} 
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                title="Delete category"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{editingId === 'new' ? 'New Category' : 'Edit Category'}</h3>
              <button onClick={() => !isSaving && setEditingId(null)} className="text-gray-400 hover:text-black" disabled={isSaving}>
                <X size={20}/>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-black focus:outline-none"
                  value={editForm.title || ''}
                  onChange={e => setEditForm({
                    ...editForm, 
                    title: e.target.value, 
                    slug: editingId === 'new' ? e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : (editForm.slug || '')
                  })}
                  disabled={isSaving}
                  placeholder="e.g. Oversized T-Shirts"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL) *</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-black focus:outline-none"
                  value={editForm.slug || ''}
                  onChange={e => setEditForm({...editForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')})}
                  disabled={isSaving}
                  placeholder="e.g. oversized-t-shirts"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Redirect Link (Optional)</label>
                <input 
                  type="text" 
                  placeholder="/collections/oversized-t-shirts"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-black focus:outline-none"
                  value={editForm.redirect_link || ''}
                  onChange={e => setEditForm({...editForm, redirect_link: e.target.value})}
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500 mt-1">If left blank, defaults to /collections/[slug]</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    className="h-10 w-16 p-1 border rounded-lg cursor-pointer"
                    value={editForm.bg_color || '#f5f0eb'}
                    onChange={e => setEditForm({...editForm, bg_color: e.target.value})}
                    disabled={isSaving}
                  />
                  <input 
                    type="text" 
                    className="flex-1 border rounded-lg p-2 focus:ring-2 focus:ring-black focus:outline-none"
                    value={editForm.bg_color || '#f5f0eb'}
                    onChange={e => setEditForm({...editForm, bg_color: e.target.value})}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <div className="flex flex-col gap-2">
                  <input 
                    type="text" 
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-black focus:outline-none"
                    placeholder="Image URL (e.g. /images/category-placeholder.png)"
                    value={editForm.image_url || ''}
                    onChange={e => setEditForm({...editForm, image_url: e.target.value})}
                    disabled={isSaving}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">OR</span>
                    <label className={`flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-gray-200 transition-colors w-max ${uploadingImage || isSaving ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploadingImage || isSaving} />
                    </label>
                    <button 
                      type="button"
                      onClick={() => setEditForm({...editForm, image_url: ''})}
                      className="ml-2 flex items-center gap-2 text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-red-100 transition-colors w-max"
                      disabled={isSaving}
                    >
                      <Trash2 size={14} /> Clear Image
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="featured-toggle"
                  className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black cursor-pointer"
                  checked={editForm.featured || false}
                  onChange={e => setEditForm({...editForm, featured: e.target.checked})}
                  disabled={isSaving}
                />
                <label htmlFor="featured-toggle" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Featured (Highlight this category)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setEditingId(null)} 
                className="px-4 py-2 text-gray-600 hover:text-black font-medium transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={saveEdit} 
                className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
