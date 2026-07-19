'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { repo } from '@/lib/repositories';

interface StoreSettings {
  freeShippingAbove: string;
  shippingCharge: string;
  freeDelivery: boolean;
}

const defaultSettings: StoreSettings = {
  freeShippingAbove: '999',
  shippingCharge: '100',
  freeDelivery: false,
};

const SectionCard = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
      <Icon size={13} className="text-gray-400" />
      {title}
    </h3>
    <div className="border-t border-gray-50 pt-4 space-y-4">{children}</div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

export default function AdminCommerceSettingsPage() {
  const dispatch = useDispatch();
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load current values on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await repo.shipping.getSettings();
        console.log('🔄 Loaded commerce settings:', data);
        setSettings({
          freeShippingAbove: String(data.freeShippingAbove ?? 0),
          shippingCharge: String(data.shippingCharge ?? 0),
          freeDelivery: Boolean(data.freeDelivery ?? false),
        });
      } catch (error) {
        console.error('Error loading settings:', error);
        dispatch(
          addToast({
            message: 'Failed to load settings',
            type: 'error',
          })
        );
      }
    })();
  }, [dispatch]);

  const handleChange = (field: keyof StoreSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // ✅ Only send fields that exist in ShippingSettings
      const success = await repo.shipping.updateSettings({
        shippingCharge: Number(settings.shippingCharge),
        freeShippingAbove: Number(settings.freeShippingAbove),
        freeDelivery: settings.freeDelivery,
      });
      
      setSaving(false);
      setSaved(true);
      
      console.log('✅ Settings saved successfully:', {
        shippingCharge: Number(settings.shippingCharge),
        freeShippingAbove: Number(settings.freeShippingAbove),
        freeDelivery: settings.freeDelivery,
      });
      
      dispatch(
        addToast({
          message: success ? '✓ Settings saved successfully!' : '⚠️ Failed to save settings',
          type: success ? 'success' : 'error',
        })
      );
    } catch (error) {
      setSaving(false);
      console.error('Error saving settings:', error);
      dispatch(
        addToast({
          message: '⚠️ Error saving settings',
          type: 'error',
        })
      );
    }
  };

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm text-gray-800 placeholder-gray-300 transition-colors";

  return (
    <div className="space-y-8 animate-fadeIn">
      <SectionCard title="Shipping Settings" icon={Settings}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Shipping Charge (₹)">
            <input
              type="number"
              value={settings.shippingCharge}
              disabled={settings.freeDelivery}
              onChange={(e) => handleChange('shippingCharge', e.target.value)}
              className={`${inputClass} ${
                settings.freeDelivery
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                  : ""
              }`}
              min="0"
              placeholder="100"
            />
            {settings.freeDelivery && (
              <p className="text-xs text-gray-400 mt-1">
                ⚡ Disabled when Free Delivery is enabled
              </p>
            )}
          </Field>
          
          <Field label="Free Shipping Above (₹)">
            <input
              type="number"
              value={settings.freeShippingAbove}
              disabled={settings.freeDelivery}
              onChange={(e) => handleChange('freeShippingAbove', e.target.value)}
              className={`${inputClass} ${
                settings.freeDelivery
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                  : ""
              }`}
              min="0"
              placeholder="999"
            />
            {settings.freeDelivery && (
              <p className="text-xs text-gray-400 mt-1">
                ⚡ Disabled when Free Delivery is enabled
              </p>
            )}
          </Field>

          {/* Free Delivery Checkbox - Full width */}
          <div className="md:col-span-2">
            <Field label="Free Delivery">
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.freeDelivery}
                    onChange={(e) =>
                      handleChange('freeDelivery', e.target.checked)
                    }
                    className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable Free Delivery for all orders
                  </span>
                </label>
                <p className="text-xs text-gray-500">
                  When enabled, customers will never be charged shipping.
                </p>
                {settings.freeDelivery && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-700">Free Delivery is Enabled</p>
                      <p className="text-xs text-green-600">Shipping will be ₹0 for all orders.</p>
                    </div>
                  </div>
                )}
              </div>
            </Field>
          </div>
        </div>

        {/* Current Settings Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Settings size={14} className="text-gray-400" />
            Current Configuration
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <span className="block text-xs text-gray-500 mb-1">Shipping Charge</span>
              <span className="font-semibold text-gray-800">
                {settings.freeDelivery ? '₹0 (Free)' : `₹${settings.shippingCharge}`}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <span className="block text-xs text-gray-500 mb-1">Free Shipping Above</span>
              <span className="font-semibold text-gray-800">
                {settings.freeDelivery ? '—' : `₹${settings.freeShippingAbove}`}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <span className="block text-xs text-gray-500 mb-1">Free Delivery</span>
              <span className={`font-semibold ${settings.freeDelivery ? 'text-green-600' : 'text-gray-600'}`}>
                {settings.freeDelivery ? '✅ Enabled' : '❌ Disabled'}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end gap-3 sticky bottom-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg px-2 py-2 flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-green-600 text-xs font-semibold px-2">
              <CheckCircle2 size={14} />
              Settings Saved
            </div>
          )}
          <button
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
  );
}