'use client';

import React, { useState, useRef } from 'react';
import {
  Settings, Store, Mail, Phone, Image, Upload,
  Save, CheckCircle2, Globe, MapPin, Clock, X
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addToast } from '@/lib/redux/slices/uiSlice';

interface StoreSettings {
  storeName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  website: string;
  supportHours: string;
  logoUrl: string;
  bannerUrl: string;
  currency: string;
  taxPercent: string;
  freeShippingAbove: string;
}

const defaultSettings: StoreSettings = {
  storeName: 'GR STYLES',
  tagline: "Premium Men's Fashion Store",
  supportEmail: 'grstyles955@gmail.com',
  supportPhone: '+91 95534 22743',
  address: 'Afia Plaza, Masab Tank',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500028',
  website: 'https://grstyles.com',
  supportHours: 'Mon–Sat, 9am–7pm IST',
  logoUrl: '',
  bannerUrl: '',
  currency: 'INR (₹)',
  taxPercent: '18',
  freeShippingAbove: '999',
};

export default function AdminSettingsPage() {
  const dispatch = useDispatch();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof StoreSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (type === 'logo') {
        setLogoPreview(dataUrl);
        setSettings((prev) => ({ ...prev, logoUrl: dataUrl }));
      } else {
        setBannerPreview(dataUrl);
        setSettings((prev) => ({ ...prev, bannerUrl: dataUrl }));
      }
      dispatch(addToast({ message: `${type === 'logo' ? 'Logo' : 'Banner'} uploaded (demo mode).`, type: 'success' }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSaving(false);
    setSaved(true);
    dispatch(addToast({ message: '✓ Store settings saved successfully!', type: 'success' }));
    // Save to localStorage for demo persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('gr_styles_store_settings', JSON.stringify(settings));
    }
  };

  const SectionCard = ({ title, icon: Icon, children }: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
  }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
        <Icon size={13} className="text-gray-400" />
        {title}
      </h3>
      <div className="border-t border-gray-50 pt-4 space-y-4">
        {children}
      </div>
    </div>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm text-gray-800 placeholder-gray-300 transition-colors";

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900 uppercase">Store Settings</h1>
          <p className="text-sm text-gray-400 mt-1">Configure your store details and preferences.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          DEMO MODE
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Store Information */}
        <SectionCard title="Store Information" icon={Store}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Store Name *">
              <input
                id="settings-store-name"
                type="text"
                required
                value={settings.storeName}
                onChange={(e) => handleChange('storeName', e.target.value)}
                className={inputClass}
                placeholder="GR STYLES"
              />
            </Field>
            <Field label="Tagline">
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className={inputClass}
                placeholder="Men's Fashion Store"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Website">
              <div className="relative">
                <input
                  type="url"
                  value={settings.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="https://grstyles.com"
                />
                <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              </div>
            </Field>
            <Field label="Currency">
              <select
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className={inputClass}
              >
                <option>INR (₹)</option>
                <option>USD ($)</option>
                <option>EUR (€)</option>
              </select>
            </Field>
          </div>
        </SectionCard>

        {/* Contact */}
        <SectionCard title="Support Contact" icon={Mail}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Support Email *">
              <div className="relative">
                <input
                  id="settings-support-email"
                  type="email"
                  required
                  value={settings.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="support@grstyles.com"
                />
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              </div>
            </Field>
            <Field label="Phone Number">
              <div className="relative">
                <input
                  id="settings-phone"
                  type="tel"
                  value={settings.supportPhone}
                  onChange={(e) => handleChange('supportPhone', e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="+91 98765 43210"
                />
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              </div>
            </Field>
            <Field label="Support Hours">
              <div className="relative">
                <input
                  type="text"
                  value={settings.supportHours}
                  onChange={(e) => handleChange('supportHours', e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="Mon–Sat, 10am–7pm"
                />
                <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* Address */}
        <SectionCard title="Store Address" icon={MapPin}>
          <Field label="Street Address">
            <input
              type="text"
              value={settings.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className={inputClass}
              placeholder="12, Fashion Street"
            />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="City">
              <input
                type="text"
                value={settings.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className={inputClass}
                placeholder="Bengaluru"
              />
            </Field>
            <Field label="State">
              <input
                type="text"
                value={settings.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className={inputClass}
                placeholder="Karnataka"
              />
            </Field>
            <Field label="PIN Code">
              <input
                type="text"
                value={settings.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
                className={inputClass}
                placeholder="560001"
              />
            </Field>
          </div>
        </SectionCard>

        {/* Commerce Settings */}
        <SectionCard title="Commerce Settings" icon={Settings}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="GST / Tax (%)">
              <input
                type="number"
                value={settings.taxPercent}
                onChange={(e) => handleChange('taxPercent', e.target.value)}
                className={inputClass}
                placeholder="18"
                min="0"
                max="100"
              />
            </Field>
            <Field label="Free Shipping Above (₹)">
              <input
                type="number"
                value={settings.freeShippingAbove}
                onChange={(e) => handleChange('freeShippingAbove', e.target.value)}
                className={inputClass}
                placeholder="999"
                min="0"
              />
            </Field>
          </div>
        </SectionCard>

        {/* Logo Upload */}
        <SectionCard title="Store Logo" icon={Image}>
          <div className="flex items-center gap-6 flex-wrap">
            {/* Preview */}
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
              {logoPreview ? (
                <div className="relative w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoPreview} alt="Store logo preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setLogoPreview(null); setSettings(prev => ({ ...prev, logoUrl: '' })); }}
                    className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm"
                  >
                    <X size={10} className="text-gray-600" />
                  </button>
                </div>
              ) : (
                <Image size={24} className="text-gray-300" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Upload your store logo. Recommended: 200×200px PNG</p>
              <button
                type="button"
                id="settings-logo-upload"
                onClick={() => logoInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 hover:border-black rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors text-gray-600 hover:text-black"
              >
                <Upload size={13} />
                Upload Logo
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'logo')}
              />
            </div>
          </div>
        </SectionCard>

        {/* Banner Upload */}
        <SectionCard title="Store Banner" icon={Image}>
          <div className="space-y-4">
            {/* Banner Preview */}
            <div className="w-full h-36 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 relative">
              {bannerPreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bannerPreview} alt="Store banner preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setBannerPreview(null); setSettings(prev => ({ ...prev, bannerUrl: '' })); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm"
                  >
                    <X size={12} className="text-gray-600" />
                  </button>
                </>
              ) : (
                <div className="text-center space-y-2">
                  <Image size={28} className="text-gray-200 mx-auto" />
                  <p className="text-xs text-gray-300">No banner uploaded</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="settings-banner-upload"
                onClick={() => bannerInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 hover:border-black rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors text-gray-600 hover:text-black"
              >
                <Upload size={13} />
                Upload Banner
              </button>
              <p className="text-xs text-gray-400">Recommended: 1200×400px JPG or PNG</p>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'banner')}
              />
            </div>
          </div>
        </SectionCard>

        {/* Save Button */}
        <div className="flex justify-end gap-3 sticky bottom-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg px-2 py-2 flex items-center gap-3">
            {saved && (
              <div className="flex items-center gap-1.5 text-green-600 text-xs font-semibold px-2">
                <CheckCircle2 size={14} />
                Settings Saved
              </div>
            )}
            <button
              id="settings-save-btn"
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={13} />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
