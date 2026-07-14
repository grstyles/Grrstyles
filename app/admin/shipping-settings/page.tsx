'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { repo } from '@/lib/repositories';

interface ShippingSettings {
  singleProductCharge: string;
  pantCharge: string;
  comboCharge: string;
  shippingCharge: string; // Base charge per order
  freeDelivery: boolean;
  freeShippingAbove: string;
  estimatedDelivery: string;
  shippingMessage: string;
}

const defaultSettings: ShippingSettings = {
  singleProductCharge: '80',
  pantCharge: '60',
  comboCharge: '120',
  shippingCharge: '100',
  freeDelivery: false,
  freeShippingAbove: '999',
  estimatedDelivery: '3-5 days',
  shippingMessage: '',
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

export default function AdminShippingSettingsPage() {
  const dispatch = useDispatch();
  const [settings, setSettings] = useState<ShippingSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load existing shipping settings
  useEffect(() => {
    (async () => {
      const data = await repo.shipping.getSettings();
      setSettings({
        singleProductCharge: String(data.singleProductCharge ?? 80),
        pantCharge: String(data.pantCharge ?? 60),
        comboCharge: String(data.comboCharge ?? 120),
  shippingCharge: String(data.shippingCharge ?? 100),
        freeDelivery: Boolean(data.freeDelivery ?? false),
        freeShippingAbove: String(data.freeShippingAbove ?? 0),
        estimatedDelivery: String(data.estimatedDelivery ?? '3-5 days'),
        shippingMessage: String(data.shippingMessage ?? ''),
      });
    })();
  }, []);

  const handleChange = (field: keyof ShippingSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await repo.shipping.updateSettings({
      singleProductCharge: Number(settings.singleProductCharge),
      pantCharge: Number(settings.pantCharge),
      comboCharge: Number(settings.comboCharge),
   shippingCharge: Number(settings.shippingCharge),
      freeDelivery: settings.freeDelivery,
      freeShippingAbove: Number(settings.freeShippingAbove),
      estimatedDelivery: settings.estimatedDelivery,
      shippingMessage: settings.shippingMessage,
    });
    setSaving(false);
    setSaved(true);
    dispatch(
      addToast({
        message: success ? '✓ Shipping settings saved!' : '⚠️ Failed to save shipping settings',
        type: success ? 'success' : 'error',
      })
    );
  };

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm text-gray-800 placeholder-gray-300 transition-colors";

  return (
    <div className="space-y-8 animate-fadeIn">
      <SectionCard title="Configure Shipping Charges" icon={Settings}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Single Product Delivery Charge (₹)">
            <input
              type="number"
              value={settings.singleProductCharge}
              onChange={(e) => handleChange('singleProductCharge', e.target.value)}
              className={inputClass}
              placeholder="80"
              min="0"
              required
              disabled={settings.freeDelivery}
            />
          </Field>
          <Field label="Pant Charge (₹)">
            <input
              type="number"
              value={settings.pantCharge}
              onChange={(e) => handleChange('pantCharge', e.target.value)}
              className={inputClass}
              placeholder="60"
              min="0"
              required
              disabled={settings.freeDelivery}
            />
          </Field>
          <Field label="Combo Charge (₹)">
            <input
              type="number"
              value={settings.comboCharge}
              onChange={(e) => handleChange('comboCharge', e.target.value)}
              className={inputClass}
              placeholder="120"
              min="0"
              required
              disabled={settings.freeDelivery}
            />
          </Field>
          <Field label="Free Delivery">
            <input
              type="checkbox"
              checked={settings.freeDelivery}
              onChange={(e) => handleChange('freeDelivery', e.target.checked)}
              className="h-4 w-4 text-black border-gray-300 rounded"
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
              required
              disabled={settings.freeDelivery}
            />
          </Field>
          <Field label="Estimated Delivery">
            <select
              value={settings.estimatedDelivery}
              onChange={(e) => handleChange('estimatedDelivery', e.target.value)}
              className={inputClass}
              disabled={settings.freeDelivery}
            >
              <option value="3-5 days">3-5 days</option>
              <option value="5-7 days">5-7 days</option>
              <option value="7-10 days">7-10 days</option>
            </select>
          </Field>
          <Field label="Shipping Message">
            <textarea
              value={settings.shippingMessage}
              onChange={(e) => handleChange('shippingMessage', e.target.value)}
              className={inputClass + " h-24"}
              placeholder="Free delivery for orders above {remaining}"
              required
              disabled={settings.freeDelivery}
            />
          </Field>
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
