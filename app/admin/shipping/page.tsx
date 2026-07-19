'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Truck, IndianRupee, AlertCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addToast } from '@/lib/redux/slices/uiSlice';

interface ShippingSettings {
  shippingCharge: string;
  freeShippingAbove: string;
  freeDelivery: boolean;
}

const defaultSettings: ShippingSettings = {
  shippingCharge: '100',
  freeShippingAbove: '999',
  freeDelivery: false,
};

export default function AdminShippingSettingsPage() {
  const dispatch = useDispatch();
  const [settings, setSettings] = useState<ShippingSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Production version - Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/shipping');

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        console.log('✅ Loaded shipping settings:', data);

        setSettings({
          shippingCharge: String(data.shipping_charge ?? 100),
          freeShippingAbove: String(data.free_shipping_above ?? 999),
          freeDelivery: Boolean(data.free_delivery ?? false),
        });

        setError(null);
      } catch (err: any) {
        console.error('❌ Failed to load shipping settings:', err);
        setError('Failed to load shipping settings');
        dispatch(
          addToast({
            message: 'Failed to load shipping settings',
            type: 'error',
          })
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [dispatch]);

  const handleChange = (field: keyof ShippingSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        shippingCharge: Number(settings.shippingCharge),
        freeShippingAbove: Number(settings.freeShippingAbove),
        freeDelivery: settings.freeDelivery,
      };

      console.log('📤 Saving shipping settings via API:', payload);

      const res = await fetch('/api/admin/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setSaved(true);
        dispatch(
          addToast({
            message: '✓ Shipping settings saved successfully!',
            type: 'success',
          })
        );
        // Re-fetch to ensure UI is in sync with database
        const refreshRes = await fetch('/api/admin/shipping');
        if (refreshRes.ok) {
          const freshData = await refreshRes.json();
          setSettings({
            shippingCharge: String(freshData.shipping_charge ?? 100),
            freeShippingAbove: String(freshData.free_shipping_above ?? 999),
            freeDelivery: Boolean(freshData.free_delivery ?? false),
          });
        }
      } else {
        const msg = json.error || 'Failed to save settings';
        console.error('❌ Save failed:', json);
        setError(msg);
        dispatch(
          addToast({
            message: `⚠️ ${msg}`,
            type: 'error',
          })
        );
      }
    } catch (error: any) {
      console.error('❌ Error saving settings:', error);
      setError(error?.message || 'An unknown error occurred');
      dispatch(
        addToast({
          message: `⚠️ Error: ${error?.message || 'Unknown error'}`,
          type: 'error',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-800 placeholder-gray-400 transition-all duration-200 bg-white";

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading shipping settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 font-medium">Error</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light text-gray-900">Shipping Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Configure shipping rules and charges for your store</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {saved && (
            <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
              <CheckCircle2 size={16} />
              Saved
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm w-full sm:w-auto"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-700">Shipping Rules</h3>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Shipping Charge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <IndianRupee size={16} className="text-gray-400" />
                Shipping Charge
              </label>
              <p className="text-xs text-gray-400">Base shipping fee applied to eligible orders</p>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 font-medium">₹</span>
                </div>
                <input
                  type="number"
                  value={settings.shippingCharge}
                  onChange={(e) => handleChange('shippingCharge', e.target.value)}
                  className={`${inputClass} pl-8 ${settings.freeDelivery ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}`}
                  placeholder="Enter shipping charge"
                  min="0"
                  step="1"
                  disabled={settings.freeDelivery}
                />
              </div>
              {settings.freeDelivery && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  Disabled when Free Delivery is enabled
                </p>
              )}
            </div>

            {/* Free Shipping Above */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Truck size={16} className="text-gray-400" />
                Free Shipping Above
              </label>
              <p className="text-xs text-gray-400">Orders subtotal equal to or above this amount get free shipping</p>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 font-medium">₹</span>
                </div>
                <input
                  type="number"
                  value={settings.freeShippingAbove}
                  onChange={(e) => handleChange('freeShippingAbove', e.target.value)}
                  className={`${inputClass} pl-8 ${settings.freeDelivery ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}`}
                  placeholder="Enter threshold amount"
                  min="0"
                  step="1"
                  disabled={settings.freeDelivery}
                />
              </div>
              {!settings.freeDelivery && Number(settings.freeShippingAbove) > 0 && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 size={12} />
                  Orders above ₹{Number(settings.freeShippingAbove).toLocaleString()} will get free shipping
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100"></div>

          {/* Free Delivery Toggle */}
          <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Truck size={16} className="text-gray-400" />
                  Free Delivery
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  When enabled, shipping is free for all orders regardless of order value
                </p>
              </div>
              
              {/* Custom Toggle Switch */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.freeDelivery}
                  onClick={() => handleChange('freeDelivery', !settings.freeDelivery)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 ${
                    settings.freeDelivery ? 'bg-black' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                      settings.freeDelivery ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium min-w-[45px] ${settings.freeDelivery ? 'text-green-600' : 'text-gray-500'}`}>
                  {settings.freeDelivery ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Status Message */}
            {settings.freeDelivery ? (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-700">Free delivery is enabled. All orders will have ₹0 shipping.</span>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  Free delivery is disabled. Shipping charges will apply based on the rules above.
                </span>
              </div>
            )}
          </div>

          {/* Settings Summary */}
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 p-5">
            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Settings size={14} />
              Current Configuration
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg border border-gray-100">
                <span className="block text-xs text-gray-400 mb-1">Shipping Charge</span>
                <span className="text-base font-semibold text-gray-800">
                  {settings.freeDelivery ? '₹0 (Free)' : `₹${settings.shippingCharge}`}
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-100">
                <span className="block text-xs text-gray-400 mb-1">Free Shipping Threshold</span>
                <span className="text-base font-semibold text-gray-800">
                  {settings.freeDelivery ? '—' : `₹${Number(settings.freeShippingAbove).toLocaleString()}`}
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-100">
                <span className="block text-xs text-gray-400 mb-1">Free Delivery</span>
                <span className={`text-base font-semibold ${settings.freeDelivery ? 'text-green-600' : 'text-gray-500'}`}>
                  {settings.freeDelivery ? '✅ Enabled' : '❌ Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}