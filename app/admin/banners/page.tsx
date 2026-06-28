'use client';

import React, { useState, useEffect, useRef } from 'react';
import { repo } from '@/lib/repositories';
import { Banner } from '@/lib/repositories/interfaces';
import { Plus, X, Trash2, Edit2, Upload, MoveUp, MoveDown, Save } from 'lucide-react';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { useDispatch } from 'react-redux';
import Image from 'next/image';

export default function AdminBannersPage() {
  const dispatch = useDispatch();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [targetPage, setTargetPage] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await repo.banners.getAll();
      setBanners(data || []);
    } catch (e) {
      console.error('Failed to load banners:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setMobileImageUrl('');
    setLinkUrl('');
    setTargetPage('');
    setButtonText('');
    setIsActive(true);
    setStartDate('');
    setEndDate('');
    setEditingId(null);
    setFormOpen(false);
  };

  const handleEdit = (b: Banner) => {
    setTitle(b.title || '');
    setSubtitle(b.subtitle || '');
    setImageUrl(b.image_url || '');
    setMobileImageUrl(b.mobile_image_url || '');
    setLinkUrl(b.link_url || '');
    setTargetPage(b.target_page || '');
    setButtonText(b.button_text || '');
    setIsActive(b.is_active !== false);
    setStartDate(b.start_date ? new Date(b.start_date).toISOString().slice(0, 16) : '');
    setEndDate(b.end_date ? new Date(b.end_date).toISOString().slice(0, 16) : '');
    setEditingId(b.id);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await repo.banners.delete(id);
      dispatch(addToast({ message: 'Banner deleted successfully!', type: 'success' }));
      loadBanners();
    } catch (e) {
      dispatch(addToast({ message: 'Failed to delete banner', type: 'error' }));
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'desktop') setUploadingImage(true);
    else setUploadingMobile(true);

    try {
      const url = await repo.storage.uploadImage(file, 'banners');
      if (url) {
        if (type === 'desktop') setImageUrl(url);
        else setMobileImageUrl(url);
      } else {
        dispatch(addToast({ message: 'Failed to upload image.', type: 'error' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(addToast({ message: 'Error uploading image.', type: 'error' }));
    } finally {
      if (type === 'desktop') setUploadingImage(false);
      else setUploadingMobile(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) {
      dispatch(addToast({ message: 'Title and Desktop Image are required.', type: 'error' }));
      return;
    }

    const payload = {
      title,
      subtitle: subtitle || null,
      image_url: imageUrl,
      mobile_image_url: mobileImageUrl || null,
      link_url: linkUrl || null,
      target_page: targetPage || null,
      button_text: buttonText || null,
      is_active: isActive,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      display_order: editingId ? banners.find(b => b.id === editingId)?.display_order || 0 : banners.length,
    };

    try {
      if (editingId) {
        await repo.banners.update(editingId, payload);
        dispatch(addToast({ message: 'Banner updated!', type: 'success' }));
      } else {
        await repo.banners.create(payload);
        dispatch(addToast({ message: 'Banner created!', type: 'success' }));
      }
      loadBanners();
      resetForm();
    } catch (err) {
      console.error(err);
      dispatch(addToast({ message: 'Failed to save banner.', type: 'error' }));
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === banners.length - 1) return;

    const newBanners = [...banners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap display orders
    const currentBanner = newBanners[index];
    const targetBanner = newBanners[targetIndex];
    
    const tempOrder = currentBanner.display_order;
    currentBanner.display_order = targetBanner.display_order;
    targetBanner.display_order = tempOrder;

    // Update in DB sequentially
    try {
      await repo.banners.update(currentBanner.id, { display_order: currentBanner.display_order });
      await repo.banners.update(targetBanner.id, { display_order: targetBanner.display_order });
      
      // Update local state and re-sort
      newBanners.sort((a, b) => a.display_order - b.display_order);
      setBanners(newBanners);
    } catch (err) {
      dispatch(addToast({ message: 'Failed to reorder banners.', type: 'error' }));
      loadBanners(); // Reload original state
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Banners CMS</h1>
          <p className="text-sm text-gray-500 mt-1">Manage homepage and promotional banners.</p>
        </div>
        {!formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Plus size={16} /> Add Banner
          </button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
              {editingId ? 'Edit Banner' : 'New Banner'}
            </h3>
            <button type="button" onClick={resetForm} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Title *</label>
                <input
                  type="text" required
                  value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Summer Collection"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subtitle</label>
                <input
                  type="text"
                  value={subtitle} onChange={e => setSubtitle(e.target.value)}
                  placeholder="e.g. Up to 50% Off"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Button Text</label>
                <input
                  type="text"
                  value={buttonText} onChange={e => setButtonText(e.target.value)}
                  placeholder="e.g. Shop Now"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Link URL</label>
                  <input
                    type="text"
                    value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                    placeholder="e.g. /collections/summer"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Page</label>
                  <select
                    value={targetPage} onChange={e => setTargetPage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
                  >
                    <option value="">Home Page</option>
                    <option value="/shop">Shop Page</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Start Date</label>
                  <input
                    type="datetime-local"
                    value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">End Date</label>
                  <input
                    type="datetime-local"
                    value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (Visible on site)</label>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-6">
              {/* Desktop Image */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Desktop Image *</label>
                {imageUrl ? (
                  <div className="relative h-40 w-full rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={imageUrl} alt="Desktop Preview" className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => imageInputRef.current?.click()}
                    className="h-40 w-full border-2 border-dashed border-gray-300 hover:border-black rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-black transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    {uploadingImage ? (
                      <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload size={24} className="mb-2" />
                        <span className="text-xs font-semibold">Upload Desktop Image (16:9)</span>
                      </>
                    )}
                  </div>
                )}
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'desktop')} />
              </div>

              {/* Mobile Image */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mobile Image (Optional)</label>
                {mobileImageUrl ? (
                  <div className="relative h-40 w-full max-w-[200px] rounded-xl overflow-hidden border border-gray-200 group mx-auto">
                    <img src={mobileImageUrl} alt="Mobile Preview" className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={() => setMobileImageUrl('')}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => mobileInputRef.current?.click()}
                    className="h-40 w-full max-w-[200px] mx-auto border-2 border-dashed border-gray-300 hover:border-black rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-black transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    {uploadingMobile ? (
                      <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload size={20} className="mb-2" />
                        <span className="text-xs font-semibold">Upload Mobile (3:4)</span>
                      </>
                    )}
                  </div>
                )}
                <input ref={mobileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'mobile')} />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors">
              <Save size={16} /> {editingId ? 'Update Banner' : 'Create Banner'}
            </button>
          </div>
        </form>
      )}

      {/* Banner List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner, index) => (
          <div key={banner.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col ${!banner.is_active ? 'opacity-60 grayscale-[0.5]' : 'border-gray-200'}`}>
            {/* Image Preview */}
            <div className="relative h-48 w-full bg-gray-100">
              <img src={banner.image_url} alt={banner.title} className="object-cover w-full h-full" />
              {!banner.is_active && (
                <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                  <span className="bg-black/80 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm">Inactive</span>
                </div>
              )}
              {banner.target_page && banner.target_page !== '' && (
                 <div className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                   {banner.target_page === '/shop' ? 'Shop Page' : banner.target_page}
                 </div>
              )}
            </div>
            
            {/* Details */}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900">{banner.title}</h3>
                  {banner.subtitle && <p className="text-sm text-gray-500">{banner.subtitle}</p>}
                </div>
                <div className="flex flex-col items-center gap-1">
                   <button 
                     onClick={() => handleMove(index, 'up')} 
                     disabled={index === 0}
                     className="p-1 text-gray-400 hover:text-black disabled:opacity-30 transition-colors"
                   >
                     <MoveUp size={16} />
                   </button>
                   <button 
                     onClick={() => handleMove(index, 'down')}
                     disabled={index === banners.length - 1} 
                     className="p-1 text-gray-400 hover:text-black disabled:opacity-30 transition-colors"
                   >
                     <MoveDown size={16} />
                   </button>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {banner.start_date || banner.end_date ? (
                    <span className="flex items-center gap-1">
                      🗓️ 
                      {banner.start_date ? new Date(banner.start_date).toLocaleDateString() : 'Now'} 
                      {' - '} 
                      {banner.end_date ? new Date(banner.end_date).toLocaleDateString() : 'Forever'}
                    </span>
                  ) : (
                    <span>No date restrictions</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(banner)} className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(banner.id)} className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">
            No banners found. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}
