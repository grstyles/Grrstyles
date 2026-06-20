'use client';

import React, { useState, useEffect } from 'react';
import { repo } from '@/lib/repositories';
import { MockCoupon } from '@/lib/providers/mockStore';
import { Tag, Plus, X, Percent, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { useDispatch } from 'react-redux';

export default function AdminCouponsPage() {
  const dispatch = useDispatch();
  const [coupons, setCoupons] = useState<MockCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [description, setDescription] = useState('');

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await repo.coupons.getAll();
      setCoupons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || !discountPercent || !description) {
      dispatch(addToast({ message: 'All fields are required.', type: 'error' }));
      return;
    }

    const discount = parseInt(discountPercent);
    if (isNaN(discount) || discount < 1 || discount > 100) {
      dispatch(addToast({ message: 'Discount must be between 1–100%.', type: 'error' }));
      return;
    }

    const newCoupon = {
      code: code.toUpperCase().trim(),
      discountPercent: discount,
      description,
      isActive: true,
    };

    const created = await repo.coupons.create(newCoupon);
    if (!created) {
      dispatch(addToast({ message: 'Coupon code already exists.', type: 'error' }));
      return;
    }

    setCoupons((prev) => [created, ...prev]);
    setFormOpen(false);
    setCode(''); setDiscountPercent(''); setDescription('');
    dispatch(addToast({ message: `✓ Coupon "${created.code}" created!`, type: 'success' }));
  };

  const handleToggleStatus = async (couponCode: string, currentActive: boolean) => {
    const success = await repo.coupons.toggle(couponCode, !currentActive);
    if (success) {
      setCoupons((prev) =>
        prev.map((c) => (c.code === couponCode ? { ...c, isActive: !currentActive } : c))
      );
      dispatch(addToast({ message: `Coupon ${!currentActive ? 'activated' : 'paused'}.`, type: 'info' }));
    }
  };

  const handleDeleteCoupon = async (couponCode: string) => {
    if (!confirm(`Delete coupon "${couponCode}"?`)) return;
    const success = await repo.coupons.delete(couponCode);
    if (success) {
      setCoupons((prev) => prev.filter((c) => c.code !== couponCode));
      dispatch(addToast({ message: `Coupon "${couponCode}" deleted.`, type: 'info' }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900 uppercase">Coupons</h1>
          <p className="text-sm text-gray-400 mt-1">{coupons.filter(c => c.isActive).length} active coupons</p>
        </div>
        <button
          id="admin-create-coupon-btn"
          onClick={() => setFormOpen(!formOpen)}
          className="flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
        >
          {formOpen ? <X size={14} /> : <Plus size={14} />}
          {formOpen ? 'Cancel' : 'Create Coupon'}
        </button>
      </div>

      {/* Add Coupon Form */}
      {formOpen && (
        <form onSubmit={handleAddCoupon} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest border-b border-gray-100 pb-3">
            New Promo Coupon
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Coupon Code *</label>
              <input
                id="coupon-code-input"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SUMMER30"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm uppercase font-bold placeholder-gray-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Percent size={10} /> Discount %
              </label>
              <input
                id="coupon-discount-input"
                type="number"
                required
                min={1}
                max={100}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="20"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description *</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="20% summer sale"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm placeholder-gray-300"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-5 py-2.5 border border-gray-200 hover:border-black text-black rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
            >
              Save Coupon
            </button>
          </div>
        </form>
      )}

      {/* Coupons Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Promotional Codes</h3>
          <span className="text-xs text-gray-400">{coupons.length} total</span>
        </div>

        {coupons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  <th className="p-4 pl-6">Code</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Usage</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {coupons.map((c) => (
                  <tr key={c.code} className="hover:bg-gray-50/30 transition-colors">
                    <td className="p-4 pl-6">
                      <span className="bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl font-bold font-mono text-gray-800 tracking-wider text-[11px]">
                        {c.code}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-900 text-sm">{c.discountPercent}% off</td>
                    <td className="p-4 text-gray-500 font-light">{c.description}</td>
                    <td className="p-4">
                      <span className="font-semibold text-gray-700">{c.usageCount} uses</span>
                    </td>
                    <td className="p-4">
                      {c.isActive ? (
                        <span className="flex items-center gap-1.5 text-green-600 font-semibold">
                          <CheckCircle2 size={13} /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                          <AlertCircle size={13} /> Paused
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(c.code, c.isActive)}
                          className={`px-3 py-1.5 border text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
                            c.isActive
                              ? 'border-gray-200 text-gray-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'border-green-300 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {c.isActive ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(c.code)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete coupon"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Tag size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No coupons defined yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
