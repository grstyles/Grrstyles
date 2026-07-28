'use client';

import React, { useState, useEffect } from 'react';
import { repo, MockCoupon } from '@/lib/repositories';
import { Tag, Plus, X, Percent, CheckCircle2, AlertCircle, Trash2, Edit2, Info, ShieldCheck, Sparkles } from 'lucide-react';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { useDispatch } from 'react-redux';

export default function AdminCouponsPage() {
  const dispatch = useDispatch();
  const [coupons, setCoupons] = useState<MockCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCouponCode, setEditingCouponCode] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState('');
  const [maximumDiscount, setMaximumDiscount] = useState('');
  const [minimumPurchase, setMinimumPurchase] = useState('');
  const [maxCartValue, setMaxCartValue] = useState('');
  const [description, setDescription] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [usagePerUser, setUsagePerUser] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [excludeSaleProducts, setExcludeSaleProducts] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await repo.coupons.getAll();
      setCoupons(data);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const resetForm = () => {
    setCode('');
    setName('');
    setDiscountType('fixed');
    setDiscountValue('');
    setMaximumDiscount('');
    setMinimumPurchase('');
    setMaxCartValue('');
    setDescription('');
    setUsageLimit('');
    setUsagePerUser('1');
    setStartDate('');
    setExpiryDate('');
    setFirstOrderOnly(false);
    setExcludeSaleProducts(false);
    setIsActive(true);
    setEditingCouponCode(null);
    setFormOpen(false);
  };

  const handleEditClick = (c: MockCoupon) => {
    setEditingCouponCode(c.code);
    setCode(c.code);
    setName(c.name || c.description || '');
    setDiscountType((c.discountType === 'percentage') ? 'percentage' : 'fixed');
    setDiscountValue(c.discountValue ? String(c.discountValue) : '');
    setMaximumDiscount(c.maximumDiscount ? String(c.maximumDiscount) : '');
    setMinimumPurchase((c.minimumPurchase ?? c.minOrderValue) ? String(c.minimumPurchase ?? c.minOrderValue) : '');
    setMaxCartValue(c.maxCartValue ? String(c.maxCartValue) : '');
    setDescription(c.description || '');
    setUsageLimit(c.usageLimit ? String(c.usageLimit) : '');
    setUsagePerUser(c.usagePerUser ? String(c.usagePerUser) : '1');
    
    setStartDate(c.startDate ? new Date(c.startDate).toISOString().slice(0, 16) : '');
    const exp = c.expiryDate || c.endDate;
    setExpiryDate(exp ? new Date(exp).toISOString().slice(0, 16) : '');
    
    setFirstOrderOnly(Boolean(c.firstOrderOnly));
    setExcludeSaleProducts(Boolean(c.excludeSaleProducts));
    setIsActive(c.isActive !== false);
    setFormOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = code.toUpperCase().trim();
    if (!cleanCode) {
      dispatch(addToast({ message: 'Coupon Code is required.', type: 'error' }));
      return;
    }

    const dVal = parseFloat(discountValue);
    if (isNaN(dVal) || dVal <= 0) {
      dispatch(addToast({ message: 'Please enter a valid positive discount value.', type: 'error' }));
      return;
    }

    if (discountType === 'percentage' && dVal > 100) {
      dispatch(addToast({ message: 'Percentage discount cannot exceed 100%.', type: 'error' }));
      return;
    }

    const minCart = minimumPurchase ? parseFloat(minimumPurchase) : 0;
    const maxCart = maxCartValue ? parseFloat(maxCartValue) : null;

    if (maxCart !== null && minCart > 0 && maxCart < minCart) {
      dispatch(addToast({ message: 'Maximum Cart Value cannot be less than Minimum Cart Value.', type: 'error' }));
      return;
    }

    const couponData: Omit<MockCoupon, 'usageCount'> = {
      code: cleanCode,
      name: name.trim() || cleanCode,
      discountType,
      discountValue: dVal,
      maximumDiscount: (discountType === 'percentage' && maximumDiscount) ? parseFloat(maximumDiscount) : null,
      minimumPurchase: minCart,
      minOrderValue: minCart,
      maxCartValue: maxCart,
      description: description.trim() || `${dVal}${discountType === 'percentage' ? '%' : '₹'} storewide discount`,
      isActive,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      endDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      usagePerUser: usagePerUser ? parseInt(usagePerUser) : 1,
      firstOrderOnly,
      excludeSaleProducts,
    };

    try {
      if (editingCouponCode) {
        // If editing existing coupon
        const updated = await repo.coupons.create(couponData);
        if (!updated) throw new Error('Failed to update coupon.');
        
        setCoupons((prev) => prev.map((c) => (c.code === editingCouponCode ? updated : c)));
        dispatch(addToast({ message: `✓ Coupon "${cleanCode}" updated successfully!`, type: 'success' }));
      } else {
        // Check if code exists
        const exists = coupons.some((c) => c.code === cleanCode);
        if (exists) {
          dispatch(addToast({ message: `Coupon code "${cleanCode}" already exists.`, type: 'error' }));
          return;
        }

        const created = await repo.coupons.create(couponData);
        if (!created) throw new Error('Failed to create coupon.');

        setCoupons((prev) => [created, ...prev]);
        dispatch(addToast({ message: `✓ Coupon "${created.code}" created successfully!`, type: 'success' }));
      }
      resetForm();
    } catch (error: any) {
      const msg = error?.message || 'Error saving coupon.';
      dispatch(addToast({ message: msg, type: 'error' }));
    }
  };

  const handleToggleStatus = async (couponCode: string, currentActive: boolean) => {
    const success = await repo.coupons.toggle(couponCode, !currentActive);
    if (success) {
      setCoupons((prev) =>
        prev.map((c) => (c.code === couponCode ? { ...c, isActive: !currentActive } : c))
      );
      dispatch(addToast({ message: `Coupon "${couponCode}" ${!currentActive ? 'activated' : 'paused'}.`, type: 'info' }));
    }
  };

  const handleDeleteCoupon = async (couponCode: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${couponCode}"?`)) return;
    const success = await repo.coupons.delete(couponCode);
    if (success) {
      setCoupons((prev) => prev.filter((c) => c.code !== couponCode));
      dispatch(addToast({ message: `Coupon "${couponCode}" deleted.`, type: 'info' }));
    }
  };

  const formatCartRange = (c: MockCoupon) => {
    const minVal = Number(c.minimumPurchase ?? c.minOrderValue ?? 0);
    const maxVal = c.maxCartValue != null ? Number(c.maxCartValue) : null;

    if (minVal > 0 && maxVal !== null && maxVal > 0) {
      return `₹${minVal.toLocaleString('en-IN')} - ₹${maxVal.toLocaleString('en-IN')}`;
    }
    if (minVal > 0) {
      return `Min ₹${minVal.toLocaleString('en-IN')}`;
    }
    if (maxVal !== null && maxVal > 0) {
      return `Max ₹${maxVal.toLocaleString('en-IN')}`;
    }
    return 'Any Cart Amount';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-light tracking-tight text-gray-900 uppercase">Coupons Engine</h1>
            <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">Storewide</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Manage fixed & percentage storewide discount rules with optional cart value conditions.
          </p>
        </div>
        <button
          id="admin-create-coupon-btn"
          onClick={() => {
            if (formOpen) resetForm();
            else setFormOpen(true);
          }}
          className="flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-5 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
        >
          {formOpen ? <X size={14} /> : <Plus size={14} />}
          {formOpen ? 'Cancel' : 'Create New Coupon'}
        </button>
      </div>

      {/* Create / Edit Coupon Form */}
      {formOpen && (
        <form onSubmit={handleSaveCoupon} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              {editingCouponCode ? `Edit Coupon: ${editingCouponCode}` : 'Create Dual Coupon Rule'}
            </h3>
            <span className="text-xs text-gray-400">Applies to Entire Cart Subtotal</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Coupon Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Coupon Code *</label>
              <input
                id="coupon-code-input"
                type="text"
                required
                disabled={!!editingCouponCode}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. FLAT100 or SUMMER20"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm uppercase font-mono font-bold placeholder-gray-300 disabled:bg-gray-50"
              />
            </div>

            {/* Coupon Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Coupon Name / Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Festival Special Offer"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
              />
            </div>

            {/* Discount Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Discount Type *</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm font-semibold bg-gray-50/50"
              >
                <option value="fixed">Fixed Amount (₹ OFF)</option>
                <option value="percentage">Percentage (% OFF)</option>
              </select>
            </div>

            {/* Discount Value */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                {discountType === 'percentage' ? <Percent size={12} /> : '₹'}
                {discountType === 'percentage' ? 'Discount Percentage (1–100%) *' : 'Discount Amount (₹) *'}
              </label>
              <input
                id="coupon-discount-input"
                type="number"
                required
                min={0.01}
                step="any"
                max={discountType === 'percentage' ? 100 : 100000}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percentage' ? '20' : '100'}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm font-bold"
              />
            </div>

            {/* Maximum Discount Amount Cap (Only for Percentage) */}
            {discountType === 'percentage' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Maximum Discount Amount (Optional Cap ₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={maximumDiscount}
                  onChange={(e) => setMaximumDiscount(e.target.value)}
                  placeholder="e.g. 500 (Caps 20% at ₹500)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
                />
              </div>
            )}

            {/* Minimum Cart Value */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Minimum Cart Value (Optional ₹)
              </label>
              <input
                type="number"
                min={0}
                value={minimumPurchase}
                onChange={(e) => setMinimumPurchase(e.target.value)}
                placeholder="e.g. 1000 (Empty = Any Cart Amount)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
              />
            </div>

            {/* Maximum Cart Value */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Maximum Cart Value (Optional ₹)
              </label>
              <input
                type="number"
                min={0}
                value={maxCartValue}
                onChange={(e) => setMaxCartValue(e.target.value)}
                placeholder="e.g. 5000 (Empty = Any Cart Amount)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
              />
            </div>

            {/* Total Usage Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total Usage Limit (Optional)</label>
              <input
                type="number"
                min={1}
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="e.g. 500 total uses"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
              />
            </div>

            {/* Usage Per User */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Usage Limit Per User</label>
              <input
                type="number"
                min={1}
                value={usagePerUser}
                onChange={(e) => setUsagePerUser(e.target.value)}
                placeholder="1"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Start Date (Optional)</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-xs"
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Expiry Date (Optional)</label>
              <input
                type="datetime-local"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-xs"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Public Description *</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Get ₹100 OFF on all orders above ₹1,000"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={firstOrderOnly}
                  onChange={(e) => setFirstOrderOnly(e.target.checked)}
                  className="w-4 h-4 accent-black rounded cursor-pointer"
                />
                First Order Only
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={excludeSaleProducts}
                  onChange={(e) => setExcludeSaleProducts(e.target.checked)}
                  className="w-4 h-4 accent-black rounded cursor-pointer"
                />
                Exclude Sale Products
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-black rounded cursor-pointer"
                />
                Active Status
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 border border-gray-200 hover:border-black text-black rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
              >
                {editingCouponCode ? 'Update Coupon' : 'Save Coupon'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Coupons Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Promotional Discount Rules</h3>
            <p className="text-[11px] text-gray-400">All coupons apply to the entire cart subtotal</p>
          </div>
          <span className="text-xs font-mono font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-600">
            {coupons.length} coupons configured
          </span>
        </div>

        {coupons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  <th className="p-4 pl-6">Coupon Code & Name</th>
                  <th className="p-4">Discount Value</th>
                  <th className="p-4">Cart Value Range</th>
                  <th className="p-4">Usage</th>
                  <th className="p-4">Expiry</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {coupons.map((c) => {
                  const dType = (c.discountType === 'percentage') ? 'percentage' : 'fixed';
                  const dVal = c.discountValue;
                  const maxCap = c.maximumDiscount;
                  const formattedDiscount = dType === 'percentage'
                    ? `${dVal}% OFF${maxCap ? ` (Max ₹${maxCap})` : ''}`
                    : `₹${dVal} OFF`;

                  return (
                    <tr key={c.code} className="hover:bg-gray-50/40 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-start gap-2.5">
                          <span className="bg-black text-white border border-black px-2.5 py-1 rounded-lg font-bold font-mono text-gray-100 tracking-wider text-[11px] shrink-0 shadow-2xs">
                            {c.code}
                          </span>
                          <div>
                            <div className="font-semibold text-gray-900">{c.name || c.description || c.code}</div>
                            <div className="text-[10px] text-gray-400 line-clamp-1">{c.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-gray-900 text-sm">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs">
                          {formattedDiscount}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-gray-700">
                        {formatCartRange(c)}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-gray-800">{c.usageCount || 0} uses</span>
                        {c.usageLimit ? (
                          <span className="text-gray-400 text-[11px] block">limit: {c.usageLimit}</span>
                        ) : (
                          <span className="text-gray-400 text-[10px] block">No limit</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-600">
                        {(c.expiryDate || c.endDate) ? (
                          <span className="font-mono text-[11px]">
                            {new Date(c.expiryDate || c.endDate!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="p-4">
                        {c.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-green-200">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-red-200">
                            <AlertCircle size={12} /> Paused
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(c)}
                            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                            title="Edit coupon"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(c.code, c.isActive !== false)}
                            className={`px-2.5 py-1 border text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                              c.isActive !== false
                                ? 'border-gray-200 text-gray-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'border-green-300 text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {c.isActive !== false ? 'Pause' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(c.code)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete coupon"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Tag size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No storewide coupons defined yet.</p>
            <p className="text-xs text-gray-400 mt-1">Click "Create New Coupon" to set up your first rule.</p>
          </div>
        )}
      </div>
    </div>
  );
}
