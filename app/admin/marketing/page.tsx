'use client';

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Home, 
  Gift, 
  Ticket, 
  Tag, 
  MessageSquare, 
  Share2,
  ListOrdered,
  Layout
} from 'lucide-react';
import CategoryCarouselTab from '@/components/admin/marketing/CategoryCarouselTab';

const TABS = [
  { id: 'homepage', label: 'Homepage Builder', icon: Home },
  { id: 'category-carousel', label: 'Category Carousel', icon: Layout },
  { id: 'rewards', label: 'Rewards Engine', icon: Gift },
  { id: 'scratchcards', label: 'Scratch Cards', icon: Ticket },
  { id: 'offers', label: 'Offers & Clearance', icon: Tag },
  { id: 'popups', label: 'Popups & Announcements', icon: MessageSquare },
  { id: 'referrals', label: 'Referrals & Giveaways', icon: Share2 }
];

export default function MarketingPanel() {
  const [activeTab, setActiveTab] = useState('homepage');

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-serif font-bold text-gray-900 flex items-center gap-3">
          <Megaphone className="text-black" />
          Marketing & Engagement
        </h1>
        <p className="text-gray-500 mt-2">Manage homepage layout, rewards, sales, and campaigns.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 overflow-x-auto scrollbar-none">
          <nav className="flex items-center p-2 gap-2 min-w-max">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-black text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6 md:p-8 min-h-[500px]">
          {activeTab === 'homepage' && <HomepageBuilderTab />}
          {activeTab === 'category-carousel' && <CategoryCarouselTab />}
          {activeTab === 'rewards' && <RewardsTab />}
          {activeTab === 'scratchcards' && <ScratchCardsTab />}
          {activeTab === 'offers' && <OffersTab />}
          {activeTab === 'popups' && <PopupsTab />}
          {activeTab === 'referrals' && <ReferralsTab />}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------
// HOMEPAGE BUILDER TAB
// --------------------------------------------------------
function HomepageBuilderTab() {
  const [sections, setSections] = useState([
    { id: 'hero', name: 'Hero Banner', enabled: true },
    { id: 'categories', name: 'Category Circles', enabled: true },
    { id: 'mens', name: 'Men Collection', enabled: true },
    { id: 'trending', name: 'Trending Collection', enabled: true },
    { id: 'clearance', name: 'Clearance Sale', enabled: true },
    { id: 'new', name: 'New Arrivals', enabled: true },
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('gr_homepage_order');
    if (saved) {
      try { setSections(JSON.parse(saved)); } catch(e) {}
    }
  }, []);

  const saveOrder = (newSections: any[]) => {
    setSections(newSections);
    localStorage.setItem('gr_homepage_order', JSON.stringify(newSections));
    window.dispatchEvent(new Event('storage'));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newArr = [...sections];
    [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    saveOrder(newArr);
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newArr = [...sections];
    [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
    saveOrder(newArr);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold">Homepage Section Order</h2>
        <p className="text-sm text-gray-500">Drag to reorder sections. The order instantly reflects on the storefront.</p>
      </div>

      <div className="space-y-3">
        {sections.map((sec, idx) => (
          <div key={sec.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                className="text-gray-400 hover:text-black disabled:opacity-30"
              >
                ▲
              </button>
              <button 
                onClick={() => moveDown(idx)}
                disabled={idx === sections.length - 1}
                className="text-gray-400 hover:text-black disabled:opacity-30"
              >
                ▼
              </button>
            </div>
            
            <ListOrdered size={20} className="text-gray-400" />
            
            <div className="flex-1 font-medium">{sec.name}</div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={sec.enabled}
                onChange={() => {
                  const n = [...sections];
                  n[idx].enabled = !n[idx].enabled;
                  saveOrder(n);
                }}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>
        ))}
      </div>

      <button className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">
        Save Homepage Layout
      </button>
    </div>
  );
}

// --------------------------------------------------------
// REWARDS TAB
// --------------------------------------------------------
function RewardsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Auto-Rewards Rules</h2>
      <p className="text-gray-500">Trigger rewards automatically when cart reaches thresholds.</p>
      
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
        <p className="text-sm text-gray-500 italic mb-4">Example Configuration</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <input type="number" placeholder="Min Purchase (e.g. 5000)" className="border p-2 rounded-lg" defaultValue="5000" />
          <select className="border p-2 rounded-lg">
            <option>Free Gift</option>
            <option>Coupon</option>
            <option>Cashback</option>
          </select>
          <input type="text" placeholder="Reward Value (e.g. Wallet)" className="border p-2 rounded-lg" defaultValue="Premium Wallet" />
        </div>
        <button className="bg-black text-white px-4 py-2 rounded-lg text-sm">Add Rule</button>
      </div>
    </div>
  );
}

// --------------------------------------------------------
// SCRATCH CARDS TAB
// --------------------------------------------------------
function ScratchCardsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Scratch Card Manager</h2>
      <p className="text-gray-500">Configure post-checkout scratch card probabilities.</p>
      <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm">
        To add new scratch cards, define the Title, Reward Image, Probability (%), and Stock limits.
      </div>
    </div>
  );
}

// --------------------------------------------------------
// OFFERS & CLEARANCE TAB
// --------------------------------------------------------
function OffersTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Clearance & Flash Sales</h2>
      <p className="text-gray-500">Manage countdown timers and bulk discounts.</p>
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        <label className="block">
          <span className="text-sm text-gray-600 block mb-1">Start Date</span>
          <input type="datetime-local" className="w-full border p-2 rounded-lg" />
        </label>
        <label className="block">
          <span className="text-sm text-gray-600 block mb-1">End Date</span>
          <input type="datetime-local" className="w-full border p-2 rounded-lg" />
        </label>
      </div>
    </div>
  );
}

// --------------------------------------------------------
// POPUPS & ANNOUNCEMENTS
// --------------------------------------------------------
function PopupsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Popups & Announcements</h2>
      <p className="text-gray-500">Manage scrolling announcement bar and exit-intent popups.</p>
      <textarea 
        className="w-full border border-gray-200 rounded-xl p-4 min-h-[100px]" 
        placeholder="Announcement Bar Text..."
        defaultValue="FESTIVE SALE IS LIVE! GET FLAT 50% OFF ON WINTER COLLECTION • USE CODE: WINTER50"
      />
    </div>
  );
}

// --------------------------------------------------------
// REFERRALS & GIVEAWAYS
// --------------------------------------------------------
function ReferralsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Referral Campaign</h2>
      <p className="text-gray-500">Configure invite-a-friend rewards and giveaways.</p>
    </div>
  );
}
