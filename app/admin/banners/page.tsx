'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { repo, Banner } from '@/lib/repositories';
import { 
  Plus, X, Image as ImageIcon, Link as LinkIcon, 
  Eye, Edit, Trash2, CheckCircle2, AlertCircle, 
  ArrowUpDown, ExternalLink, Sparkles, Layers, Upload
} from 'lucide-react';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { useDispatch } from 'react-redux';

export default function AdminBannersPage() {
  const dispatch = useDispatch();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [buttonText, setButtonText] = useState('Explore Now');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [targetPage, setTargetPage] = useState('home');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // File Upload states & refs
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMobileImage, setUploadingMobileImage] = useState(false);
  const desktopFileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await repo.banners.getAll();
      setBanners(data || []);
    } catch (err) {
      console.error('Error loading banners:', err);
      dispatch(addToast({ message: 'Failed to load banners.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleOpenCreateForm = () => {
    setEditingBannerId(null);
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setMobileImageUrl('');
    setLinkUrl('/collections');
    setButtonText('Shop Now');
    setDisplayOrder((banners.length + 1).toString());
    setTargetPage('home');
    setIsActive(true);
    setFormOpen(true);
  };

  const handleOpenEditForm = (banner: Banner) => {
    setEditingBannerId(banner.id);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || '');
    setImageUrl(banner.image_url || '');
    setMobileImageUrl(banner.mobile_image_url || '');
    setLinkUrl(banner.link_url || '');
    setButtonText(banner.button_text || 'Explore Now');
    setDisplayOrder((banner.display_order ?? 1).toString());
    setTargetPage(banner.target_page || 'home');
    setIsActive(banner.is_active ?? true);
    setFormOpen(true);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'desktop' | 'mobile'
  ) => {
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

    if (target === 'desktop') setUploadingImage(true);
    else setUploadingMobileImage(true);

    try {
      const uploadedUrl = await repo.storage.uploadImage(file, 'banners');
      if (uploadedUrl) {
        if (target === 'desktop') {
          setImageUrl(uploadedUrl);
        } else {
          setMobileImageUrl(uploadedUrl);
        }
        dispatch(
          addToast({
            message: `✓ ${target === 'desktop' ? 'Desktop' : 'Mobile'} banner image uploaded!`,
            type: 'success',
          })
        );
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (err: any) {
      dispatch(addToast({ message: err.message || 'Image upload failed', type: 'error' }));
    } finally {
      if (target === 'desktop') setUploadingImage(false);
      else setUploadingMobileImage(false);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !imageUrl.trim()) {
      dispatch(addToast({ message: 'Title and Image URL/file are required.', type: 'error' }));
      return;
    }

    setSubmitting(true);
    const cleanTargetPage = targetPage.replace(/^\//, '');
    const bannerPayload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      image_url: imageUrl.trim(),
      mobile_image_url: mobileImageUrl.trim() || null,
      link_url: linkUrl.trim() || null,
      button_text: buttonText.trim() || null,
      display_order: parseInt(displayOrder) || 1,
      target_page: cleanTargetPage,
      is_active: isActive,
    };

    try {
      // Also update navigation hero image for target page to keep both stores 100% in sync
      if (cleanTargetPage && repo.navigation?.updateHeroImage) {
        await repo.navigation.updateHeroImage(cleanTargetPage, imageUrl.trim()).catch(() => {});
      }

      let savedBanner: Banner | null = null;
      if (editingBannerId) {
        savedBanner = await repo.banners.update(editingBannerId, bannerPayload);
      } else {
        savedBanner = await repo.banners.create(bannerPayload);
      }

      // Re-fetch all banners to guarantee state & cards preview match persistent storage
      const refreshed = await repo.banners.getAll();
      setBanners(refreshed);

      if (savedBanner) {
        dispatch(addToast({ message: `✓ Banner "${savedBanner.title}" saved successfully!`, type: 'success' }));
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('gr_banner_updated'));
        window.dispatchEvent(new Event('storage'));
      }
      setFormOpen(false);
    } catch (error: any) {
      console.error('Error saving banner:', error);
      dispatch(addToast({ message: error?.message || 'Error saving banner.', type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (banner: Banner) => {
    try {
      const newStatus = !banner.is_active;
      const updated = await repo.banners.update(banner.id, { is_active: newStatus });
      if (updated) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, is_active: newStatus } : b))
        );
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('gr_banner_updated'));
          window.dispatchEvent(new Event('storage'));
        }
        dispatch(
          addToast({
            message: `Banner ${newStatus ? 'activated' : 'deactivated'}.`,
            type: 'info',
          })
        );
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to update banner status.', type: 'error' }));
    }
  };

  const handleDeleteBanner = async (banner: Banner) => {
    if (!confirm(`Are you sure you want to delete banner "${banner.title}"?`)) return;

    try {
      const success = await repo.banners.delete(banner.id);
      if (success) {
        setBanners((prev) => prev.filter((b) => b.id !== banner.id));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('gr_banner_updated'));
          window.dispatchEvent(new Event('storage'));
        }
        dispatch(addToast({ message: `Banner "${banner.title}" deleted.`, type: 'info' }));
      }
    } catch (err) {
      dispatch(addToast({ message: 'Failed to delete banner.', type: 'error' }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 font-mono tracking-widest uppercase">Loading Banners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-light tracking-tight text-gray-900 uppercase">Banners & Campaigns</h1>
            <span className="bg-black text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
              {banners.filter((b) => b.is_active).length} Active
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Manage promotional hero banners, upload campaign images, order priorities, and target pages.
          </p>
        </div>

        <button
          id="admin-create-banner-btn"
          onClick={() => (formOpen ? setFormOpen(false) : handleOpenCreateForm())}
          className="flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-sm active:scale-95"
        >
          {formOpen ? <X size={14} /> : <Plus size={14} />}
          {formOpen ? 'Cancel' : 'Create Banner'}
        </button>
      </div>

      {/* Create / Edit Form Drawer */}
      {formOpen && (
        <form
          onSubmit={handleSaveBanner}
          className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">
                {editingBannerId ? 'Edit Campaign Banner' : 'Create New Campaign Banner'}
              </h3>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">* Required fields</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Banner Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. SUMMER LUXURY COLLECTION 2026"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm font-medium"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Subtitle / Tagline
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Crafted for modern elegance & supreme comfort."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
              />
            </div>

            {/* Desktop Image Upload & URL */}
            <div className="space-y-1.5 md:col-span-2 bg-gray-50/50 p-4 rounded-xl border border-gray-200/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-black" /> Desktop Banner Image *
                </label>
                <span className="text-[10px] text-gray-400">JPG, PNG, WebP (Max 5MB)</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste Image URL or click Upload File..."
                  className="flex-1 px-4 py-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-black text-sm font-mono"
                />

                <input
                  ref={desktopFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(e) => handleFileUpload(e, 'desktop')}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => desktopFileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 shrink-0"
                >
                  {uploadingImage ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Upload File</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Image Upload & URL */}
            <div className="space-y-1.5 md:col-span-2 bg-gray-50/50 p-4 rounded-xl border border-gray-200/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-gray-600" /> Mobile Banner Image (Optional)
                </label>
                <span className="text-[10px] text-gray-400">Optimized for mobile portrait view</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <input
                  type="text"
                  value={mobileImageUrl}
                  onChange={(e) => setMobileImageUrl(e.target.value)}
                  placeholder="Paste Mobile Image URL or upload file..."
                  className="flex-1 px-4 py-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-black text-sm font-mono"
                />

                <input
                  ref={mobileFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(e) => handleFileUpload(e, 'mobile')}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={uploadingMobileImage}
                  onClick={() => mobileFileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 border border-gray-300 hover:border-black bg-white text-gray-800 px-5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 shrink-0"
                >
                  {uploadingMobileImage ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Upload Mobile Image</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Target Page / Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Target Page / Location
              </label>
              <select
                value={targetPage}
                onChange={(e) => setTargetPage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm font-medium"
              >
                <option value="home">Home Page Hero</option>
                <option value="new-in">New In Page</option>
                <option value="men">Men's Category Page</option>
                <option value="collections">Collections Page</option>
                <option value="sale">Sale & Clearance Page</option>
              </select>
            </div>

            {/* Link URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <LinkIcon size={12} /> Destination Link URL
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="e.g. /collections or /product/stone-shaped-wide-leg-jeans"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm font-mono"
              />
            </div>

            {/* Button Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                CTA Button Text
              </label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="Shop Collection"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
              />
            </div>

            {/* Display Order */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpDown size={12} /> Display Priority / Order
              </label>
              <input
                type="number"
                min="1"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                placeholder="1"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm font-mono"
              />
            </div>

          </div>

          {/* Image Live Preview */}
          {imageUrl && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Preview</p>
              <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner">
                <Image
                  src={imageUrl}
                  alt="Banner preview"
                  fill
                  unoptimized
                  className="object-cover"
                  onError={() => {}}
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-6 text-white">
                  {subtitle && <p className="text-[10px] text-amber-300 font-mono tracking-widest uppercase mb-1">{subtitle}</p>}
                  <h4 className="text-2xl font-serif font-bold">{title || 'Banner Title'}</h4>
                  {buttonText && (
                    <div className="mt-3">
                      <span className="inline-block px-4 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
                        {buttonText}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <span>Publish as Active Banner</span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-5 py-2.5 border border-gray-200 hover:border-black text-gray-700 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingImage || uploadingMobileImage}
                className="px-6 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>{editingBannerId ? 'Update Banner' : 'Publish Banner'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Banners Grid / List */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-gray-500" />
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">All Active & Saved Banners</h3>
          </div>
          <span className="text-xs text-gray-400 font-mono">{banners.length} Total</span>
        </div>

        {banners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {banners.map((b) => (
              <div
                key={b.id}
                className={`group border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                  b.is_active ? 'border-gray-200 bg-white hover:border-black hover:shadow-md' : 'border-gray-100 bg-gray-50 opacity-75'
                }`}
              >
                {/* Banner Image Preview Card */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                  <Image
                    src={b.image_url || '/images/image1.jpeg'}
                    alt={b.title}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  {/* Status & Priority Badge */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="bg-black/70 backdrop-blur-md text-white text-[9px] font-mono px-2.5 py-1 rounded-full border border-white/10 uppercase">
                      Order #{b.display_order ?? 1}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase backdrop-blur-md ${
                        b.is_active
                          ? 'bg-green-500/90 text-white'
                          : 'bg-red-500/80 text-white'
                      }`}
                    >
                      {b.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Title overlay */}
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <p className="text-[10px] text-amber-400 tracking-widest uppercase font-mono truncate">
                      {b.target_page || 'Home'} Page
                    </p>
                    <h4 className="text-base font-serif font-bold line-clamp-1">{b.title}</h4>
                  </div>
                </div>

                {/* Banner Content Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
                  {b.subtitle && (
                    <p className="text-gray-500 line-clamp-2 text-[11px] leading-relaxed">
                      {b.subtitle}
                    </p>
                  )}

                  <div className="space-y-1.5 text-[11px] text-gray-500 font-mono pt-2 border-t border-gray-100">
                    {b.link_url && (
                      <div className="flex items-center gap-1.5 truncate">
                        <LinkIcon size={12} className="text-gray-400 shrink-0" />
                        <span className="truncate">{b.link_url}</span>
                      </div>
                    )}
                    {b.button_text && (
                      <div className="flex items-center gap-1.5">
                        <ExternalLink size={12} className="text-gray-400 shrink-0" />
                        <span>Button: "{b.button_text}"</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleStatus(b)}
                      className={`px-3 py-1.5 border text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
                        b.is_active
                          ? 'border-gray-200 text-gray-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50'
                          : 'border-green-300 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {b.is_active ? 'Pause' : 'Activate'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditForm(b)}
                        className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Banner"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(b)}
                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Banner"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <ImageIcon size={32} className="text-gray-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-gray-700">No Banners Found</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Create your first promotional banner to display campaign graphics, discounts, and hero carousel sliders across your shop.
            </p>
            <button
              onClick={handleOpenCreateForm}
              className="mt-4 px-5 py-2.5 bg-black text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-gray-800 transition-colors"
            >
              Create Banner
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
