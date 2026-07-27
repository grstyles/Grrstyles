'use client';

import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Search,
  Edit2,
  Copy,
  Trash2,
  Power,
  Download,
  Gift,
  Users,
  SlidersHorizontal,
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { ScratchCard, ScratchCardSettings, UserScratchCard, ScratchDashboardStats } from '@/lib/repositories';

// 1-Click Quick Presets for simplicity
const PRESETS = [
  {
    name: 'Flat ₹100 Off',
    title: 'Welcome Shopping Offer',
    subtitle: 'Scratch & Save ₹100',
    reward_type: 'flat_discount',
    reward_value: 100,
    coupon_code: 'SAVE100',
    winning_probability: 1.0,
    bg_color: '#1e1b4b',
    border_color: '#f59e0b',
    scratch_overlay_type: 'charcoal',
  },
  {
    name: 'Flat ₹250 Off',
    title: 'Festive Special Reward',
    subtitle: 'Flat ₹250 Discount',
    reward_type: 'flat_discount',
    reward_value: 250,
    coupon_code: 'FESTIVE250',
    winning_probability: 1.0,
    bg_color: '#064e3b',
    border_color: '#10b981',
    scratch_overlay_type: 'gold',
  },
  {
    name: '20% OFF Coupon',
    title: 'Mega Discount Mystery',
    subtitle: 'Get 20% OFF Everything',
    reward_type: 'percentage_discount',
    reward_value: 20,
    coupon_code: 'MEGA20',
    winning_probability: 0.8,
    bg_color: '#881337',
    border_color: '#f43f5e',
    scratch_overlay_type: 'silver',
  },
  {
    name: 'Free Shipping',
    title: 'Free Express Shipping',
    subtitle: 'No Delivery Charges',
    reward_type: 'free_shipping',
    reward_value: 0,
    coupon_code: 'FREESHIP',
    winning_probability: 1.0,
    bg_color: '#1e293b',
    border_color: '#38bdf8',
    scratch_overlay_type: 'charcoal',
  },
];

export default function ScratchCardsTab() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<ScratchCard[]>([]);
  const [stats, setStats] = useState<ScratchDashboardStats | null>(null);
  const [settings, setSettings] = useState<ScratchCardSettings>({
    global_enabled: true,
    min_order_amount: 1000,
    award_trigger: 'on_every_eligible_order',
    allow_multiple_per_customer: true,
    cards_per_order: 1,
    specific_user_ids: [],
  });

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingCard, setEditingCard] = useState<ScratchCard | null>(null);
  const [winners, setWinners] = useState<UserScratchCard[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'cards' | 'winners'>('cards');
  const [searchQuery, setSearchQuery] = useState('');

  // Simple Assign Form
  const [assignForm, setAssignForm] = useState({ userEmail: '', cardId: '' });

  // Simple Card Form
  const [cardForm, setCardForm] = useState<Partial<ScratchCard>>({
    title: 'Scratch & Win Reward',
    subtitle: 'Scratch to reveal your discount',
    description: 'Applicable on next order',
    bg_color: '#1e1b4b',
    border_color: '#f59e0b',
    text_color: '#ffffff',
    scratch_overlay_type: 'charcoal',
    reward_type: 'flat_discount',
    reward_value: 150,
    coupon_code: 'WIN150',
    winning_probability: 1.0,
    max_global_claims: 500,
    max_claims_per_user: 1,
    is_active: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scratch-cards');
      const data = await res.json();
      if (data.success) {
        setCards(data.cards || []);
        setStats(data.stats || null);
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load scratch cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWinners = async () => {
    try {
      const res = await fetch('/api/scratch-cards/user');
      const data = await res.json();
      if (data.success && data.cards) {
        setWinners(data.cards.filter((c: UserScratchCard) => c.is_claimed));
      }
    } catch (err) {
      console.error('Failed to load winners:', err);
    }
  };

  useEffect(() => {
    loadData();
    loadWinners();
  }, []);

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/scratch-cards/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setShowSettingsModal(false);
      }
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  const handleSaveCard = async () => {
    try {
      const action = editingCard ? 'update' : 'create';
      const res = await fetch('/api/scratch-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          cardId: editingCard?.id,
          cardData: cardForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCardModal(false);
        setEditingCard(null);
        loadData();
      }
    } catch (err) {
      console.error('Error saving scratch card:', err);
    }
  };

  const handleToggleCardActive = async (id: string, currentActive: boolean) => {
    try {
      await fetch('/api/scratch-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', cardId: id, is_active: !currentActive }),
      });
      loadData();
    } catch (err) {
      console.error('Error toggling card:', err);
    }
  };

  const handleDuplicateCard = async (id: string) => {
    try {
      await fetch('/api/scratch-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate', cardId: id }),
      });
      loadData();
    } catch (err) {
      console.error('Error duplicating card:', err);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Delete this scratch card?')) return;
    try {
      await fetch('/api/scratch-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', cardId: id }),
      });
      loadData();
    } catch (err) {
      console.error('Error deleting card:', err);
    }
  };

  const handleAssignCard = async () => {
    if (!assignForm.userEmail || !assignForm.cardId) {
      alert('Please select a user email and a scratch card.');
      return;
    }
    try {
      const res = await fetch('/api/scratch-cards/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Scratch card sent to ${assignForm.userEmail}!`);
        setShowAssignModal(false);
        setAssignForm({ userEmail: '', cardId: '' });
        loadData();
      }
    } catch (err) {
      console.error('Error assigning card:', err);
    }
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setCardForm({
      ...cardForm,
      title: preset.title,
      subtitle: preset.subtitle,
      reward_type: preset.reward_type as any,
      reward_value: preset.reward_value,
      coupon_code: preset.coupon_code,
      winning_probability: preset.winning_probability,
      bg_color: preset.bg_color,
      border_color: preset.border_color,
      scratch_overlay_type: preset.scratch_overlay_type as any,
    });
  };

  const openCreateModal = () => {
    setEditingCard(null);
    applyPreset(PRESETS[0]);
    setShowCardModal(true);
  };

  const openEditModal = (card: ScratchCard) => {
    setEditingCard(card);
    setCardForm(card);
    setShowCardModal(true);
  };

  const filteredCards = cards.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.coupon_code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Ticket className="text-amber-200" size={28} />
            <h2 className="text-2xl font-bold font-serif">Scratch Card Rewards System</h2>
          </div>
          <p className="text-amber-100 text-sm mt-1">
            Automatically give scratch cards to customers when their order subtotal reaches ₹{settings.min_order_amount}.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Minimum Order Limit Pill Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <SlidersHorizontal size={15} /> Min Order: ₹{settings.min_order_amount}
          </button>

          {/* Quick Assign */}
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2 bg-black/40 hover:bg-black/60 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Users size={15} /> Send to Customer
          </button>

          {/* Create Scratch Card Button */}
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-white text-gray-900 hover:bg-amber-50 text-sm font-bold rounded-xl shadow flex items-center gap-2 transition-all"
          >
            <Plus size={18} className="text-amber-600" />
            + Create New Scratch Card
          </button>
        </div>
      </div>

      {/* Simple Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Ticket size={22} />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase">Total Cards</div>
            <div className="text-xl font-bold text-gray-900">{cards.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase">Assigned</div>
            <div className="text-xl font-bold text-blue-600">{stats?.total_assigned || 0}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Gift size={22} />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase">Claimed</div>
            <div className="text-xl font-bold text-emerald-600">{stats?.total_claimed || 0}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Zap size={22} />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase">Claim Rate</div>
            <div className="text-xl font-bold text-purple-600">{stats?.claim_rate || 0}%</div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveSubTab('cards')}
            className={`pb-3 text-sm font-bold transition-all ${
              activeSubTab === 'cards' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Scratch Cards ({cards.length})
          </button>
          <button
            onClick={() => setActiveSubTab('winners')}
            className={`pb-3 text-sm font-bold transition-all ${
              activeSubTab === 'winners' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Winners & Claims ({winners.length})
          </button>
        </div>

        {activeSubTab === 'winners' && (
          <a
            href="/api/scratch-cards/export"
            download
            className="mb-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <Download size={14} /> Download Winner List CSV
          </a>
        )}
      </div>

      {/* CARDS LIST TAB */}
      {activeSubTab === 'cards' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search scratch cards by title or coupon code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading Scratch Cards...</div>
          ) : filteredCards.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Ticket className="mx-auto text-gray-300 mb-2" size={40} />
              <p className="text-gray-500 font-semibold text-sm">No Scratch Cards created yet.</p>
              <button
                onClick={openCreateModal}
                className="mt-3 px-4 py-2 bg-black text-white text-xs font-bold rounded-xl"
              >
                + Create First Scratch Card
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCards.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
                >
                  {/* Card Visual Banner */}
                  <div
                    className="p-5 text-white relative"
                    style={{ backgroundColor: c.bg_color || '#1e1b4b', color: c.text_color || '#ffffff' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/30 backdrop-blur">
                        {c.reward_type === 'percentage_discount' ? `${c.reward_value}% OFF` : `₹${c.reward_value} OFF`}
                      </span>

                      {/* Active Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={c.is_active}
                          onChange={() => handleToggleCardActive(c.id, c.is_active)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-gray-400/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-400"></div>
                      </label>
                    </div>

                    <h3 className="font-bold text-lg leading-tight">{c.title}</h3>
                    <p className="text-xs opacity-80 mt-1">{c.subtitle || 'Scratch to reveal'}</p>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold">
                      <span>Code: <span className="font-mono text-amber-300">{c.coupon_code || 'AUTO'}</span></span>
                      <span>Chance: {Math.round((c.winning_probability || 1) * 100)}%</span>
                    </div>
                  </div>

                  {/* Quick Card Details */}
                  <div className="p-4 text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Claims Given:</span>
                      <span className="font-bold text-gray-800">{c.current_global_claims || 0} / {c.max_global_claims || 'Unlimited'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`font-bold ${c.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openEditModal(c)}
                      className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 rounded-lg font-bold text-xs flex-1 flex items-center justify-center gap-1"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDuplicateCard(c.id)}
                      className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 rounded-lg font-bold text-xs"
                      title="Duplicate"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteCard(c.id)}
                      className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-red-50 text-red-600 rounded-lg font-bold text-xs"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WINNERS TAB */}
      {activeSubTab === 'winners' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 font-bold text-gray-900">
            Scratch Card Winners History ({winners.length})
          </div>

          {winners.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No scratch cards claimed yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 font-bold text-gray-400 uppercase">
                  <tr>
                    <th className="p-3">Customer Email</th>
                    <th className="p-3">Card Name</th>
                    <th className="p-3">Reward Won</th>
                    <th className="p-3">Coupon Code</th>
                    <th className="p-3">Date Claimed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {winners.map((w) => (
                    <tr key={w.id}>
                      <td className="p-3 font-semibold text-gray-900">{w.user_email || w.user_id}</td>
                      <td className="p-3 font-bold text-black">{w.card_title}</td>
                      <td className="p-3 font-bold text-emerald-600">
                        {w.reward_type === 'percentage_discount' ? `${w.reward_value}% OFF` : `₹${w.reward_value} OFF`}
                      </td>
                      <td className="p-3 font-mono font-bold">{w.coupon_code || 'N/A'}</td>
                      <td className="p-3 text-gray-400">{w.claimed_at ? new Date(w.claimed_at).toLocaleDateString() : 'Recent'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SIMPLE CREATE / EDIT MODAL WITH 1-CLICK PRESETS */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Ticket className="text-amber-500" size={20} />
                {editingCard ? 'Edit Scratch Card' : 'Create Scratch Card'}
              </h3>
              <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* 1-Click Quick Presets */}
              {!editingCard && (
                <div>
                  <span className="font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    ⚡ Quick 1-Click Presets:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="p-2.5 border border-amber-200 bg-amber-50/50 hover:bg-amber-100 rounded-xl text-left transition-colors"
                      >
                        <span className="font-bold text-amber-900 block">{preset.name}</span>
                        <span className="text-[10px] text-amber-700">{preset.coupon_code}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Card Title *</label>
                  <input
                    type="text"
                    required
                    value={cardForm.title || ''}
                    onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="e.g. Festival Lucky Reward"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Reward Type</label>
                    <select
                      value={cardForm.reward_type}
                      onChange={(e: any) => setCardForm({ ...cardForm, reward_type: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl p-2.5 font-bold focus:outline-none"
                    >
                      <option value="flat_discount">Flat Discount Amount (₹)</option>
                      <option value="percentage_discount">Percentage Discount (%)</option>
                      <option value="free_shipping">Free Shipping</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Discount Amount / %</label>
                    <input
                      type="number"
                      value={cardForm.reward_value || 0}
                      onChange={(e) => setCardForm({ ...cardForm, reward_value: Number(e.target.value) })}
                      className="w-full border border-gray-200 rounded-xl p-2.5 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Coupon Code *</label>
                    <input
                      type="text"
                      required
                      value={cardForm.coupon_code || ''}
                      onChange={(e) => setCardForm({ ...cardForm, coupon_code: e.target.value.toUpperCase() })}
                      className="w-full border border-gray-200 rounded-xl p-2.5 font-mono font-bold text-sm uppercase focus:outline-none"
                      placeholder="e.g. SAVE250"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Winning Chance (%)</label>
                    <select
                      value={cardForm.winning_probability}
                      onChange={(e) => setCardForm({ ...cardForm, winning_probability: Number(e.target.value) })}
                      className="w-full border border-gray-200 rounded-xl p-2.5 font-bold focus:outline-none"
                    >
                      <option value={1.0}>100% Guaranteed Win</option>
                      <option value={0.8}>80% Chance</option>
                      <option value={0.5}>50% Chance</option>
                      <option value={0.25}>25% Chance</option>
                    </select>
                  </div>
                </div>

                {/* Color Theme Selector */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Card Color Theme</label>
                  <div className="flex gap-3">
                    {[
                      { name: 'Indigo', bg: '#1e1b4b', border: '#f59e0b', overlay: 'charcoal' },
                      { name: 'Emerald', bg: '#064e3b', border: '#10b981', overlay: 'gold' },
                      { name: 'Rose', bg: '#881337', border: '#f43f5e', overlay: 'silver' },
                      { name: 'Slate', bg: '#0f172a', border: '#38bdf8', overlay: 'charcoal' },
                    ].map((theme, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setCardForm({
                            ...cardForm,
                            bg_color: theme.bg,
                            border_color: theme.border,
                            scratch_overlay_type: theme.overlay as any,
                          })
                        }
                        className={`flex-1 p-2 rounded-xl border text-center font-bold text-[11px] transition-all ${
                          cardForm.bg_color === theme.bg ? 'ring-2 ring-black border-transparent' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: theme.bg, color: '#ffffff' }}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCardModal(false)}
                className="px-4 py-2 font-bold border border-gray-200 rounded-xl text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCard}
                className="px-5 py-2 font-bold bg-black text-white rounded-xl hover:bg-gray-800"
              >
                Save Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MINIMUM ORDER AMOUNT SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-amber-500" />
                Minimum Order Requirement
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  value={settings.min_order_amount}
                  onChange={(e) => setSettings({ ...settings, min_order_amount: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl p-3 text-base font-bold focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="1000"
                />
                <p className="text-gray-400 mt-1">
                  Customers get a scratch card automatically when their completed order is ₹{settings.min_order_amount} or higher.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <div className="font-bold text-gray-900 text-xs">Enable Scratch Cards Globally</div>
                  <div className="text-[10px] text-gray-400">Turn on or off post-checkout rewards</div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.global_enabled}
                    onChange={(e) => setSettings({ ...settings, global_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 text-xs font-bold">
              <button onClick={() => setShowSettingsModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl">
                Cancel
              </button>
              <button onClick={handleSaveSettings} className="px-5 py-2 bg-black text-white rounded-xl hover:bg-gray-800">
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN TO USER MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Users size={18} className="text-blue-500" />
                Send Scratch Card to Customer
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Customer Email *</label>
                <input
                  type="email"
                  required
                  value={assignForm.userEmail}
                  onChange={(e) => setAssignForm({ ...assignForm, userEmail: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 font-medium text-sm focus:outline-none"
                  placeholder="customer@email.com"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Select Scratch Card *</label>
                <select
                  value={assignForm.cardId}
                  onChange={(e) => setAssignForm({ ...assignForm, cardId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 font-bold text-xs focus:outline-none"
                >
                  <option value="">-- Choose Scratch Card --</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.reward_type === 'percentage_discount' ? `${c.reward_value}% OFF` : `₹${c.reward_value} OFF`})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 text-xs font-bold">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl">
                Cancel
              </button>
              <button onClick={handleAssignCard} className="px-5 py-2 bg-black text-white rounded-xl hover:bg-gray-800">
                Send Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
