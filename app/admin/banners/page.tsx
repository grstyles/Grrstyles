'use client';

import React, { useState, useEffect, useRef } from 'react';
import { repo } from '@/lib/repositories';
import { Banner } from '@/lib/repositories/interfaces';
import { Plus, X, Trash2, Upload, MoveUp, MoveDown, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { useDispatch } from 'react-redux';

export default function AdminBannersPage() {
  const dispatch = useDispatch();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

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
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await repo.banners.getAll();
      setBanners(data || []);
      if (!isCreating && data && data.length > 0) {
         setCurrentIndex(prev => Math.min(prev, data.length - 1));
      } else if (data && data.length === 0) {
         setIsCreating(true);
      }
    } catch (e) {
      console.error('Failed to load banners:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // Sync form with current banner
  useEffect(() => {
    if (isCreating) {
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
    } else if (banners.length > 0 && banners[currentIndex]) {
      const b = banners[currentIndex];
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
    }
  }, [currentIndex, isCreating, banners]);

  // Swipe Support
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleNext = () => {
    if (banners.length > 1 && !isCreating) {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }
  };

  const handlePrev = () => {
    if (banners.length > 1 && !isCreating) {
      setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === 0 || touchEnd === 0) return;
    if (touchStart - touchEnd > 50) handleNext();
    if (touchEnd - touchStart > 50) handlePrev();
    setTouchStart(0);
    setTouchEnd(0);
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
      setIsCreating(false);
      loadBanners();
    } catch (err) {
      console.error(err);
      dispatch(addToast({ message: 'Failed to save banner.', type: 'error' }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await repo.banners.delete(id);
      dispatch(addToast({ message: 'Banner deleted successfully!', type: 'success' }));
      if (banners.length <= 1) {
         setIsCreating(true);
      } else if (currentIndex >= banners.length - 1) {
         setCurrentIndex(banners.length - 2);
      }
      loadBanners();
    } catch (e) {
      dispatch(addToast({ message: 'Failed to delete banner', type: 'error' }));
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
      
      loadBanners(); 
      setCurrentIndex(targetIndex);
    } catch (err) {
      dispatch(addToast({ message: 'Failed to reorder banners.', type: 'error' }));
      loadBanners(); 
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
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Plus size={16} /> Add Banner
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Carousel Preview */}
        <div className="space-y-4">
          <div 
            className="relative w-full aspect-[16/9] bg-gray-100 rounded-2xl overflow-hidden group select-none shadow-sm border border-gray-200"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {isCreating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                ) : (
                  <>
                    <Upload size={32} className="mb-3 opacity-50" />
                    <p className="font-medium text-gray-500">New Banner Preview</p>
                    <p className="text-xs text-gray-400 mt-1">Upload a desktop image to see preview</p>
                  </>
                )}
              </div>
            ) : banners.length > 0 ? (
              <>
                <img src={banners[currentIndex].image_url} alt={banners[currentIndex].title} className="w-full h-full object-cover" draggable={false} />
                
                {/* Banner Content Overlay */}
                <div className="absolute inset-0 bg-black/20 flex flex-col justify-center items-center text-center p-4">
                  <h2 className="text-2xl font-serif font-bold text-white uppercase tracking-wider shadow-black drop-shadow-md">{banners[currentIndex].title}</h2>
                  {banners[currentIndex].subtitle && <p className="text-sm text-white/90 drop-shadow-md mt-2 tracking-widest">{banners[currentIndex].subtitle}</p>}
                </div>

                {!banners[currentIndex].is_active && (
                  <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                    Inactive
                  </div>
                )}
                {banners[currentIndex].target_page && banners[currentIndex].target_page !== '' && (
                  <div className="absolute top-4 left-4 bg-white text-black px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {banners[currentIndex].target_page === '/shop' ? 'Shop Page' : banners[currentIndex].target_page}
                  </div>
                )}
                
                {/* Arrows */}
                {banners.length > 1 && (
                  <>
                    <button 
                      onClick={handlePrev} 
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={handleNext} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Counter */}
                {banners.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full font-mono text-[10px] backdrop-blur-md font-bold tracking-widest">
                    {String(currentIndex + 1).padStart(2, '0')} / {String(banners.length).padStart(2, '0')}
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                No banners found
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {!isCreating && banners.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {banners.map((b, i) => (
                <button 
                  key={b.id} 
                  onClick={() => setCurrentIndex(i)} 
                  className={`shrink-0 w-24 h-14 rounded-lg overflow-hidden border-2 transition-all relative ${
                    i === currentIndex ? 'border-black opacity-100 shadow-md scale-105' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                  {!b.is_active && <div className="absolute inset-0 bg-white/50 backdrop-grayscale" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Editor Form */}
        <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
              {isCreating ? 'New Banner' : 'Edit Banner'}
            </h3>
            {isCreating && banners.length > 0 && (
              <button type="button" onClick={() => setIsCreating(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Button Text</label>
                <input
                  type="text"
                  value={buttonText} onChange={e => setButtonText(e.target.value)}
                  placeholder="e.g. Shop Now"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Link URL</label>
                <input
                  type="text"
                  value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                  placeholder="e.g. /collections/summer"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Page</label>
              <select
                value={targetPage} onChange={e => setTargetPage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
              >
                <option value="">Home Page</option>
                <option value="/shop">Shop Page</option>
                <option value="men">Men</option>
                <option value="new-in">New In</option>
                <option value="collections">Collections</option>
                <option value="sale">Sale</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Start Date</label>
                <input
                  type="datetime-local"
                  value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">End Date</label>
                <input
                  type="datetime-local"
                  value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-xs"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
              </div>

              {!isCreating && banners.length > 1 && (
                <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-100">
                  <button 
                    type="button"
                    onClick={() => handleMove(currentIndex, 'up')} 
                    disabled={currentIndex === 0}
                    className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-200 rounded disabled:opacity-30 transition-colors"
                    title="Move Up"
                  >
                    <MoveUp size={14} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleMove(currentIndex, 'down')}
                    disabled={currentIndex === banners.length - 1} 
                    className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-200 rounded disabled:opacity-30 transition-colors"
                    title="Move Down"
                  >
                    <MoveDown size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Desktop Image *</label>
                {imageUrl ? (
                  <div className="relative h-28 w-full rounded-xl overflow-hidden border border-gray-200 group">
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
                    className="h-28 w-full border-2 border-dashed border-gray-300 hover:border-black rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-black transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    {uploadingImage ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload size={18} className="mb-2" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Desktop (16:9)</span>
                      </>
                    )}
                  </div>
                )}
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'desktop')} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mobile Image</label>
                {mobileImageUrl ? (
                  <div className="relative h-28 w-24 mx-auto rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={mobileImageUrl} alt="Mobile Preview" className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={() => setMobileImageUrl('')}
                      className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => mobileInputRef.current?.click()}
                    className="h-28 w-24 mx-auto border-2 border-dashed border-gray-300 hover:border-black rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-black transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 text-center px-2"
                  >
                    {uploadingMobile ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload size={18} className="mb-2" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Mobile (3:4)</span>
                      </>
                    )}
                  </div>
                )}
                <input ref={mobileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'mobile')} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {!isCreating && banners.length > 0 ? (
              <button 
                type="button" 
                onClick={() => handleDelete(banners[currentIndex].id)} 
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Delete</span>
              </button>
            ) : (
              <div></div>
            )}
            
            <div className="flex gap-3">
              {isCreating && banners.length > 0 && (
                <button type="button" onClick={() => setIsCreating(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
              )}
              <button type="submit" className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors">
                <Save size={16} /> {isCreating ? 'Create' : 'Update'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
