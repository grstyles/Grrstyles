'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Settings, Store, Mail, Phone, Image, Upload,
  Save, CheckCircle2, Globe, MapPin, Clock, X, Banknote
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
  shippingCharge: string;
  freeDelivery: boolean;
  /** Whether COD is shown to customers at checkout */
  codEnabled: boolean;
}

const defaultSettings: StoreSettings = {
  storeName: 'GR STYLES',
  tagline: "Premium Men's Fashion Store",
  supportEmail: 'grstyles955@gmail.com',
  supportPhone: '7386489584',
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
  shippingCharge: '100',
  freeDelivery: false,
  codEnabled: true, // COD on by default
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

export default function AdminSettingsPage() {
  const dispatch = useDispatch();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/shipping')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        setSettings((prev) => ({
          ...prev,
          freeShippingAbove: String(data.freeShippingAbove ?? prev.freeShippingAbove),
          shippingCharge: String(data.shippingCharge ?? prev.shippingCharge),
          freeDelivery: Boolean(data.freeDelivery ?? prev.freeDelivery),
          codEnabled: data.codEnabled !== undefined ? Boolean(data.codEnabled) : prev.codEnabled,
        }));
      })
      .catch((err) => console.warn('[Settings] Failed to load shipping settings:', err));
  }, []);

  const handleChange = (field: keyof StoreSettings, value: string | boolean) => {
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
    // Preserve scroll position
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingCharge: Number(settings.shippingCharge),
          freeShippingAbove: Number(settings.freeShippingAbove),
          freeDelivery: settings.freeDelivery,
          codEnabled: settings.codEnabled,
        }),
      });
      const result = await res.json();
      const success = res.ok && result.success;
      setSaving(false);
      setSaved(true);
      dispatch(
        addToast({
          message: success
            ? '✓ Store settings saved successfully!'
            : `⚠️ Failed to save settings: ${result.error || 'Unknown error'}`,
          type: success ? 'success' : 'error',
        })
      );
    } catch (err: any) {
      setSaving(false);
      dispatch(addToast({ message: `⚠️ Network error: ${err?.message}`, type: 'error' }));
    }
    if (typeof window !== 'undefined') {
      window.scrollTo(0, scrollY);
    }
  };

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

      <div className="space-y-6">

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

        {/* Shipping Settings */}
        <SectionCard title="Shipping Settings" icon={Settings}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Free Shipping Above (₹)">
              <input
                type="number"
                value={settings.freeShippingAbove}
                onChange={(e) => handleChange('freeShippingAbove', e.target.value)}
                className={inputClass}
                placeholder="999"
              />
            </Field>
            <Field label="Shipping Charge (₹)">
              <input
                type="number"
                value={settings.shippingCharge}
                onChange={(e) => handleChange('shippingCharge', e.target.value)}
                className={inputClass}
                placeholder="100"
              />
            </Field>
            <Field label="Free Delivery">
              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.freeDelivery}
                    onChange={(e) => handleChange('freeDelivery', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                  <span className="ml-3 text-sm text-gray-600">
                    {settings.freeDelivery ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* Payment Methods */}
        <SectionCard title="Payment Methods" icon={Banknote}>
          <div className="space-y-5">
            {/* Razorpay (always on) */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Razorpay</p>
                  <p className="text-xs text-gray-400">UPI, Cards, Wallets, Net Banking</p>
                </div>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">Always Active</span>
            </div>

            {/* Cash on Delivery Toggle */}
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              settings.codEnabled ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  settings.codEnabled ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-400'
                }`}>
                  <Banknote size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Cash on Delivery (COD)</p>
                  <p className="text-xs text-gray-400">Customers pay when their order arrives</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="settings-cod-toggle"
                  type="checkbox"
                  checked={settings.codEnabled}
                  onChange={(e) => handleChange('codEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white ${
                  settings.codEnabled
                    ? 'bg-amber-500 after:border-white'
                    : 'bg-gray-200 after:border-gray-300'
                }`} />
                <span className={`ml-3 text-sm font-semibold ${
                  settings.codEnabled ? 'text-amber-700' : 'text-gray-400'
                }`}>
                  {settings.codEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            {!settings.codEnabled && (
              <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                ⚠️ COD is currently <strong>disabled</strong>. Customers will only see Razorpay (UPI &amp; Card) at checkout.
              </p>
            )}
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
              type="button"
              onClick={handleSave}
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
      </div>
    </div>
  );
}