'use client';
// Force Turbopack Cache Invalidation: 2026-07-25-v2

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { repo } from '@/lib/repositories';
import { NavigationHeroImage } from '@/lib/repositories/interfaces';
import { Upload, Trash2, Save, RefreshCw, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { useDispatch } from 'react-redux';

const TARGET_PAGES = [
  { key: 'new-in', name: 'New In', defaultImage: '/images/image1.jpeg', description: 'Hero banner displayed at top of the New In page' },
  { key: 'mens', name: 'Mens', defaultImage: '/images/banners/banner-1.jpg', description: 'Main hero image displayed on the Mens page' },
  { key: 'collections', name: 'Collections', defaultImage: '/images/banners/banner-2.jpg', description: 'Header background banner for the Collections page' },
  { key: 'sale', name: 'Sale', defaultImage: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?q=80&w=2000&auto=format&fit=crop', description: 'Hero campaign background image for the Sale page' },
];

export default function AdminNavigationMenuPage() {
  const dispatch = useDispatch();
  const [selectedPageKey, setSelectedPageKey] = useState<string>('new-in');
  const [pagesData, setPagesData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Pending changes per page
  const [previewImage, setPreviewImage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const items = await repo.navigation.getAll();
      const map: Record<string, string> = {};
      items.forEach((item) => {
        map[item.pageKey] = item.imageUrl;
      });
      
      // Fallback defaults
      TARGET_PAGES.forEach((tp) => {
        if (!map[tp.key]) {
          map[tp.key] = tp.defaultImage;
        }
      });
      
      setPagesData(map);
      setPreviewImage(map[selectedPageKey] || TARGET_PAGES[0].defaultImage);
    } catch (err) {
      console.error('Failed to load navigation hero images:', err);
      dispatch(addToast({ message: 'Error loading navigation hero images', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When selected page changes, sync preview image & reset file selection
  useEffect(() => {
    const currentUrl = pagesData[selectedPageKey] || TARGET_PAGES.find(p => p.key === selectedPageKey)?.defaultImage || '';
    setPreviewImage(currentUrl);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedPageKey, pagesData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      let finalUrl = previewImage;

      // If a new file was uploaded, upload to Supabase Storage
      if (selectedFile) {
        setUploading(true);
        const uploadedUrl = await repo.storage.uploadImage(selectedFile, 'navigation-images');
        if (!uploadedUrl) {
          throw new Error('Failed to upload image to Supabase Storage');
        }
        finalUrl = uploadedUrl;
        setUploading(false);
      }

      // Save image URL to Supabase DB table
      const updated = await repo.navigation.updateHeroImage(selectedPageKey, finalUrl);
      
      if (updated) {
        setPagesData((prev) => ({ ...prev, [selectedPageKey]: finalUrl }));
        setSelectedFile(null);
        dispatch(
          addToast({
            message: `Hero image for ${TARGET_PAGES.find((p) => p.key === selectedPageKey)?.name} updated successfully!`,
            type: 'success',
          })
        );
      } else {
        throw new Error('Failed to save to database');
      }
    } catch (err: any) {
      console.warn('Error saving hero image:', err);
      dispatch(addToast({ message: err.message || 'Failed to save changes', type: 'error' }));
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    const targetPage = TARGET_PAGES.find((p) => p.key === selectedPageKey);
    const defaultUrl = targetPage?.defaultImage || '';

    setSaving(true);
    try {
      await repo.navigation.deleteHeroImage(selectedPageKey);
      setPagesData((prev) => ({ ...prev, [selectedPageKey]: defaultUrl }));
      setPreviewImage(defaultUrl);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      dispatch(
        addToast({
          message: `Hero image reset to default for ${targetPage?.name}`,
          type: 'info',
        })
      );
    } catch (err) {
      console.error('Error resetting image:', err);
      dispatch(addToast({ message: 'Failed to delete hero image', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const selectedPageObj = TARGET_PAGES.find((p) => p.key === selectedPageKey);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">Loading Navigation Pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Navigation Menu Hero Images</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Manage and upload high-resolution hero/banner images for main navigation pages.
        </p>
      </div>

      {/* Pages Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TARGET_PAGES.map((page) => {
          const isSelected = selectedPageKey === page.key;
          const currentUrl = pagesData[page.key];
          return (
            <button
              key={page.key}
              onClick={() => setSelectedPageKey(page.key)}
              className={`flex flex-col p-4 rounded-2xl border text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-black text-white border-black shadow-md scale-[1.02]'
                  : 'bg-white text-gray-800 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="font-serif font-bold text-sm tracking-wide">{page.name}</span>
                {isSelected ? (
                  <CheckCircle2 size={16} className="text-white" />
                ) : (
                  <span className="text-[10px] text-gray-400 uppercase font-mono">Page</span>
                )}
              </div>
              <p className={`text-[10px] line-clamp-1 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                {page.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Options Panel for Selected Page */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-100 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold uppercase">
                {selectedPageKey}
              </span>
              <h2 className="font-serif font-bold text-xl text-gray-900">{selectedPageObj?.name} Page Hero Image</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">{selectedPageObj?.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDeleteImage}
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
              Delete Image
            </button>

            <button
              onClick={handleSaveChanges}
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-black text-white text-xs font-semibold uppercase tracking-wider hover:bg-gray-800 transition-all duration-200 shadow-sm disabled:opacity-50"
            >
              {saving || uploading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* 1. Current Hero Image Preview */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
            Current Hero Image Preview
          </label>
          <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 group">
            {previewImage ? (
              <Image
                src={previewImage}
                alt={`${selectedPageObj?.name} Hero Banner`}
                fill
                className="object-cover object-center"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                <ImageIcon size={36} />
                <span className="text-xs">No image set</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 text-white flex items-center justify-between pointer-events-none">
              <span className="text-xs font-mono bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                {selectedPageObj?.name} Hero Banner
              </span>
              {selectedFile && (
                <span className="text-[10px] font-semibold bg-[#D4AF37] text-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Unsaved Preview
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Upload New / Replace Image Controls */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
            Upload New Hero Image / Replace Existing Image
          </label>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileSelect}
            className="hidden"
            id="hero-image-file-input"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 hover:border-black rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 hover:bg-gray-50 flex flex-col items-center justify-center space-y-3"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
              <Upload size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                {selectedFile ? selectedFile.name : 'Click to Upload or Replace Hero Image'}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Supports JPG, PNG, WebP (Max file size: 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* Actions Summary */}
        <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Images are automatically uploaded to Supabase Storage and stored in the database.</span>
          </div>

          <button
            onClick={handleSaveChanges}
            disabled={saving || uploading}
            className="px-5 py-2 bg-black text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
