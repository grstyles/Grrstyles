'use client';

import React, { useState, useEffect } from 'react';
import { GripVertical, Plus, Trash2, Save, X, Edit, Upload } from 'lucide-react';
import { repo } from '@/lib/repositories';
import { CategoryCarouselItem } from '@/lib/repositories/categoryCarouselRepository';

export default function CategoryCarouselTab() {
  const [categories, setCategories] = useState<CategoryCarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex === dropIndex) return;

    const newCategories = [...categories];
    const [draggedItem] = newCategories.splice(dragIndex, 1);
    newCategories.splice(dropIndex, 0, draggedItem);

    // Update priorities
    const updated = newCategories.map((item, idx) => ({ ...item, priority: idx }));
    setCategories(updated);

    try {
      await repo.categoryCarousel.updateOrder(updated.map(i => ({ id: i.id, priority: i.priority })));
    } catch (err) {
      console.error('Failed to update order', err);
    }
  };

  const toggleEnabled = async (id: string, currentEnabled: boolean) => {
    const newCategories = categories.map(c => c.id === id ? { ...c, enabled: !currentEnabled } : c);
    setCategories(newCategories);
    await repo.categoryCarousel.update(id, { enabled: !currentEnabled });
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    await repo.categoryCarousel.delete(id);
    setCategories(categories.filter(c => c.id !== id));
  };

  const startEdit = (cat?: CategoryCarouselItem) => {
    if (cat) {
      setEditingId(cat.id);
      setEditForm(cat);
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
    if (!editForm.title || !editForm.slug) {
      alert('Title and slug are required.');
      return;
    }

    const payload = {
      ...editForm,
      image_url: editForm.image_url?.trim() ? editForm.image_url : '/images/category-placeholder.png'
    };

    try {
      if (editingId === 'new') {
        const newItem = await repo.categoryCarousel.create(payload as Omit<CategoryCarouselItem, 'id'>);
        setCategories([...categories, newItem]);
      } else {
        const updatedItem = await repo.categoryCarousel.update(editingId!, payload);
        setCategories(categories.map(c => c.id === editingId ? updatedItem : c));
      }
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save category. Check console for details.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // NOTE: Our IStorageRepository expects bucket names typed but accepts strings if cast
      const url = await repo.storage.uploadImage(file, 'category-images' as any);
      if (!url) {
         // Fallback if RLS or bucket is missing
         console.warn('Storage upload failed, fallback to local path');
         alert('Supabase Storage failed (missing bucket or permissions). Using placeholder.');
         setEditForm({ ...editForm, image_url: '/images/categories/category-placeholder.png' });
         return;
      }
      setEditForm({ ...editForm, image_url: url });
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading categories...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Category Carousel</h2>
          <p className="text-sm text-gray-500">Manage the premium category circles on the homepage.</p>
        </div>
        <button 
          onClick={() => startEdit()}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="space-y-3">
        {categories.map((cat, idx) => (
          <div 
            key={cat.id} 
            className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, idx)}
          >
            <div className="cursor-grab text-gray-400 hover:text-black">
              <GripVertical size={20} />
            </div>

            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border" style={{ backgroundColor: cat.bg_color }}>
              <img src={cat.image_url} alt={cat.title} className="w-full h-full object-cover mix-blend-multiply" />
            </div>

            <div className="flex-1 font-medium text-gray-900">{cat.title} <span className="text-xs text-gray-400 font-normal ml-2">/{cat.slug}</span></div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={cat.enabled}
                  onChange={() => toggleEnabled(cat.id, cat.enabled)}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
              </label>

              <button onClick={() => startEdit(cat)} className="p-2 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100">
                <Edit size={16} />
              </button>
              <button onClick={() => deleteCategory(cat.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingId === 'new' ? 'New Category' : 'Edit Category'}</h3>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-black"><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2"
                  value={editForm.title}
                  onChange={e => setEditForm({...editForm, title: e.target.value, slug: editingId==='new'?e.target.value.toLowerCase().replace(/ /g,'-'):editForm.slug})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2"
                  value={editForm.slug || ''}
                  onChange={e => setEditForm({...editForm, slug: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Redirect Link (Optional)</label>
                <input 
                  type="text" 
                  placeholder="/shop?category=..."
                  className="w-full border rounded-lg p-2"
                  value={editForm.redirect_link || ''}
                  onChange={e => setEditForm({...editForm, redirect_link: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">If left blank, will navigate to /shop?category=[slug]</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    className="h-10 w-16 p-1 border rounded-lg cursor-pointer"
                    value={editForm.bg_color}
                    onChange={e => setEditForm({...editForm, bg_color: e.target.value})}
                  />
                  <input 
                    type="text" 
                    className="flex-1 border rounded-lg p-2"
                    value={editForm.bg_color}
                    onChange={e => setEditForm({...editForm, bg_color: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <div className="flex flex-col gap-2">
                  <input 
                    type="text" 
                    className="w-full border rounded-lg p-2"
                    placeholder="Image URL"
                    value={editForm.image_url}
                    onChange={e => setEditForm({...editForm, image_url: e.target.value})}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">OR</span>
                    <label className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-gray-200 w-max">
                      <Upload size={14} /> {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploadingImage} />
                    </label>
                    <button 
                      onClick={() => setEditForm({...editForm, image_url: ''})}
                      className="ml-2 flex items-center gap-2 text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-red-100 w-max"
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
                  className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                  checked={editForm.featured || false}
                  onChange={e => setEditForm({...editForm, featured: e.target.checked})}
                />
                <label htmlFor="featured-toggle" className="text-sm font-medium text-gray-700">
                  Featured (Highlight this category)
                </label>
              </div>
              
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => setEditingId(null)} className="px-4 py-2 text-gray-600 hover:text-black font-medium">Cancel</button>
              <button onClick={saveEdit} className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 flex items-center gap-2">
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
