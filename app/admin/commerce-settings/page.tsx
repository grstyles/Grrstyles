'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Upload, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { repo } from '@/lib/repositories';

interface StoreSettings {
  taxPercent: string;
  freeShippingAbove: string;
  shippingCharge: string;
}

const defaultSettings: StoreSettings = {
  taxPercent: '18',
  freeShippingAbove: '999',
  shippingCharge: '100',
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
      const data = await repo.shipping.getSettings();
      setSettings({
        taxPercent: String(data.taxPercent ?? 0),
        freeShippingAbove: String(data.freeShippingAbove ?? 0),
        shippingCharge: String(data.shippingCharge ?? 0),
      });
    })();
  }, []);

  const handleChange = (field: keyof StoreSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await repo.shipping.updateSettings({
      shippingCharge: Number(settings.shippingCharge),
      freeShippingAbove: Number(settings.freeShippingAbove),
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
          <Field label="Shipping Charge (₹)">
            <input
              type="number"
              value={settings.shippingCharge}
              onChange={(e) => handleChange('shippingCharge', e.target.value)}
              className={inputClass}
              placeholder="100"
              min="0"
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
