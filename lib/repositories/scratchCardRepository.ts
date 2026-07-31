import { getClient, getAdminClient } from '@/lib/supabase';

export interface ScratchCardSettings {
  id?: number;
  global_enabled: boolean;
  min_order_amount: number;
  award_trigger: 'on_every_eligible_order' | 'first_order_only' | 'new_users_only' | 'all_users' | 'specific_users' | 'manual_assignment';
  allow_multiple_per_customer: boolean;
  cards_per_order: number;
  specific_user_ids: string[];
  updated_at?: string;
}

export interface ScratchCard {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  bg_color?: string;
  border_color?: string;
  text_color?: string;
  scratch_overlay_type?: 'charcoal' | 'gold' | 'silver' | 'bronze' | 'custom_color';
  scratch_overlay_color?: string;
  reward_type: 'percentage_discount' | 'flat_discount' | 'coupon' | 'free_shipping' | 'cashback' | 'gift_product' | 'custom_reward';
  reward_value: number;
  coupon_code?: string;
  reward_description?: string;
  winning_probability: number; // 0 to 1.0
  max_global_claims?: number | null;
  max_claims_per_user?: number;
  current_global_claims?: number;
  start_date?: string | null;
  expiry_date?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserScratchCard {
  id: string;
  user_id: string;
  user_email?: string;
  scratch_card_id: string;
  order_id?: string;
  order_number?: string;
  is_scratched: boolean;
  scratched_at?: string | null;
  is_claimed: boolean;
  claimed_at?: string | null;
  reward_type: string;
  reward_value: number;
  coupon_code?: string;
  reward_details?: any;
  assigned_at: string;
  status: 'UNSCRATCHED' | 'SCRATCHED' | 'CLAIMED' | 'EXPIRED';
  // Joined card details for convenience
  card_title?: string;
  card_subtitle?: string;
  card_description?: string;
  bg_color?: string;
  border_color?: string;
  text_color?: string;
  scratch_overlay_type?: string;
  scratch_overlay_color?: string;
  image_url?: string;
  customer_name?: string;
  order_amount?: number;
}

export interface ScratchDashboardStats {
  total_created: number;
  total_assigned: number;
  total_scratched: number;
  total_claimed: number;
  remaining_claims: number;
  claim_rate: number;
  eligible_orders: number;
}

// Fallback in-memory state if tables are not present or client is uninitialized
const memorySettings: ScratchCardSettings = {
  global_enabled: true,
  min_order_amount: 1000,
  award_trigger: 'on_every_eligible_order',
  allow_multiple_per_customer: true,
  cards_per_order: 1,
  specific_user_ids: [],
};

let memoryCards: ScratchCard[] = [
  {
    id: 'sc-default-1',
    title: 'Festive Shopping Surprise',
    subtitle: 'Scratch & Win Discounts',
    description: 'Exclusive reward for orders above minimum cart amount.',
    reward_type: 'flat_discount',
    reward_value: 250,
    coupon_code: 'FESTIVE250',
    reward_description: '₹250 off on next purchase',
    winning_probability: 1.0,
    max_global_claims: 500,
    max_claims_per_user: 2,
    current_global_claims: 12,
    is_active: true,
    bg_color: '#1e1b4b',
    border_color: '#f59e0b',
    text_color: '#ffffff',
    scratch_overlay_type: 'charcoal',
    scratch_overlay_color: '#2c2c2c',
    created_at: new Date().toISOString(),
  },
  {
    id: 'sc-default-2',
    title: 'Mega Cashback Mystery',
    subtitle: 'Guaranteed Cashback Offer',
    description: 'Get up to 20% cashback added to wallet.',
    reward_type: 'percentage_discount',
    reward_value: 20,
    coupon_code: 'MEGA20',
    reward_description: '20% off on all items',
    winning_probability: 0.8,
    max_global_claims: 200,
    max_claims_per_user: 1,
    current_global_claims: 8,
    is_active: true,
    bg_color: '#064e3b',
    border_color: '#10b981',
    text_color: '#ffffff',
    scratch_overlay_type: 'gold',
    scratch_overlay_color: '#d97706',
    created_at: new Date().toISOString(),
  }
];

let memoryUserCards: UserScratchCard[] = [];

export interface IScratchCardRepository {
  getSettings(): Promise<ScratchCardSettings>;
  updateSettings(settings: Partial<ScratchCardSettings>): Promise<ScratchCardSettings>;
  getCards(): Promise<ScratchCard[]>;
  getCardById(id: string): Promise<ScratchCard | null>;
  createCard(card: Omit<ScratchCard, 'id' | 'created_at' | 'updated_at'>): Promise<ScratchCard>;
  updateCard(id: string, updates: Partial<ScratchCard>): Promise<ScratchCard | null>;
  duplicateCard(id: string): Promise<ScratchCard | null>;
  deleteCard(id: string): Promise<boolean>;
  toggleCardActive(id: string, is_active: boolean): Promise<boolean>;
  getUserCards(userId?: string, email?: string): Promise<UserScratchCard[]>;
  getDashboardStats(): Promise<ScratchDashboardStats>;
  getWinnersList(): Promise<UserScratchCard[]>;
  assignCardToUser(userId: string, cardId: string, email?: string, orderId?: string, orderNumber?: string): Promise<UserScratchCard | null>;
  scratchCard(userCardId: string, userId?: string): Promise<{ success: boolean; reward?: any; message?: string }>;
  claimReward(userCardId: string, userId?: string): Promise<{ success: boolean; reward?: any; coupon_code?: string; message: string }>;
  evaluateAndAssignForOrder(orderData: { id?: string; orderNumber?: string; userId?: string; userEmail?: string; totalAmount: number }): Promise<UserScratchCard[]>;
}

export class SupabaseScratchCardRepository implements IScratchCardRepository {
  private getDb() {
    if (typeof window !== 'undefined') {
      return getClient();
    }

    try {
      const admin = getAdminClient();
      if (admin) return admin;
    } catch {}

    try {
      const client = getClient();
      if (client) return client;
    } catch {}

    return null;
  }

  async getSettings(): Promise<ScratchCardSettings> {
    try {
      const db = this.getDb();
      if (!db) return memorySettings;

      const { data, error } = await db
        .from('scratch_card_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error || !data) {
        return memorySettings;
      }

      return {
        id: data.id,
        global_enabled: Boolean(data.global_enabled ?? memorySettings.global_enabled),
        min_order_amount: Number(data.min_order_amount ?? memorySettings.min_order_amount),
        award_trigger: data.award_trigger || memorySettings.award_trigger,
        allow_multiple_per_customer: Boolean(data.allow_multiple_per_customer ?? memorySettings.allow_multiple_per_customer),
        cards_per_order: Number(data.cards_per_order ?? memorySettings.cards_per_order),
        specific_user_ids: Array.isArray(data.specific_user_ids) ? data.specific_user_ids : memorySettings.specific_user_ids,
        updated_at: data.updated_at,
      };
    } catch {
      return memorySettings;
    }
  }

  async updateSettings(settings: Partial<ScratchCardSettings>): Promise<ScratchCardSettings> {
    const updated = {
      ...memorySettings,
      ...settings,
      updated_at: new Date().toISOString(),
    };

    Object.assign(memorySettings, updated);

    try {
      const db = this.getDb();
      if (db) {
        const { data, error } = await db
          .from('scratch_card_settings')
          .upsert({
            id: 1,
            global_enabled: updated.global_enabled,
            min_order_amount: updated.min_order_amount,
            award_trigger: updated.award_trigger,
            allow_multiple_per_customer: updated.allow_multiple_per_customer,
            cards_per_order: updated.cards_per_order,
            specific_user_ids: updated.specific_user_ids,
            updated_at: updated.updated_at,
          })
          .select('*')
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            global_enabled: Boolean(data.global_enabled),
            min_order_amount: Number(data.min_order_amount),
            award_trigger: data.award_trigger,
            allow_multiple_per_customer: Boolean(data.allow_multiple_per_customer),
            cards_per_order: Number(data.cards_per_order),
            specific_user_ids: Array.isArray(data.specific_user_ids) ? data.specific_user_ids : [],
            updated_at: data.updated_at,
          };
        }
      }
    } catch (err) {
      console.warn('Failed to update scratch_card_settings in Supabase, using local fallback:', err);
    }

    return memorySettings;
  }

  async getCards(): Promise<ScratchCard[]> {
    try {
      const db = this.getDb();
      if (!db) return memoryCards;

      const { data, error } = await db
        .from('scratch_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((c: any) => ({
          ...c,
          reward_value: Number(c.reward_value || 0),
          winning_probability: Number(c.winning_probability || 1.0),
          current_global_claims: Number(c.current_global_claims || 0),
          max_global_claims: c.max_global_claims ? Number(c.max_global_claims) : null,
          max_claims_per_user: Number(c.max_claims_per_user || 1),
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch cards failed, returning memory cards:', err);
    }
    return memoryCards;
  }

  async getCardById(id: string): Promise<ScratchCard | null> {
    try {
      const db = this.getDb();
      if (db) {
        const { data, error } = await db
          .from('scratch_cards')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return {
            ...data,
            reward_value: Number(data.reward_value || 0),
            winning_probability: Number(data.winning_probability || 1.0),
            current_global_claims: Number(data.current_global_claims || 0),
          };
        }
      }
    } catch {}
    return memoryCards.find((c) => c.id === id) || null;
  }

  async createCard(cardData: Omit<ScratchCard, 'id' | 'created_at' | 'updated_at'>): Promise<ScratchCard> {
    const newCard: ScratchCard = {
      ...cardData,
      id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      current_global_claims: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryCards.unshift(newCard);

    try {
      const db = this.getDb();
      if (db) {
        const { data, error } = await db
          .from('scratch_cards')
          .insert({
            title: cardData.title,
            subtitle: cardData.subtitle || null,
            description: cardData.description || null,
            image_url: cardData.image_url || null,
            bg_color: cardData.bg_color || '#1f2937',
            border_color: cardData.border_color || '#eab308',
            text_color: cardData.text_color || '#ffffff',
            scratch_overlay_type: cardData.scratch_overlay_type || 'charcoal',
            scratch_overlay_color: cardData.scratch_overlay_color || '#2c2c2c',
            reward_type: cardData.reward_type,
            reward_value: cardData.reward_value,
            coupon_code: cardData.coupon_code || null,
            reward_description: cardData.reward_description || null,
            winning_probability: cardData.winning_probability,
            max_global_claims: cardData.max_global_claims || null,
            max_claims_per_user: cardData.max_claims_per_user || 1,
            start_date: cardData.start_date || null,
            expiry_date: cardData.expiry_date || null,
            is_active: cardData.is_active,
          })
          .select('*')
          .maybeSingle();

        if (!error && data) {
          return {
            ...data,
            reward_value: Number(data.reward_value || 0),
            winning_probability: Number(data.winning_probability || 1.0),
          };
        }
      }
    } catch (err) {
      console.warn('Supabase createCard error:', err);
    }

    return newCard;
  }

  async updateCard(id: string, updates: Partial<ScratchCard>): Promise<ScratchCard | null> {
    const idx = memoryCards.findIndex((c) => c.id === id);
    if (idx !== -1) {
      memoryCards[idx] = { ...memoryCards[idx], ...updates, updated_at: new Date().toISOString() };
    }

    try {
      const db = this.getDb();
      if (db) {
        const { data, error } = await db
          .from('scratch_cards')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*')
          .maybeSingle();

        if (!error && data) {
          return {
            ...data,
            reward_value: Number(data.reward_value || 0),
            winning_probability: Number(data.winning_probability || 1.0),
          };
        }
      }
    } catch (err) {
      console.warn('Supabase updateCard error:', err);
    }

    return idx !== -1 ? memoryCards[idx] : null;
  }

  async duplicateCard(id: string): Promise<ScratchCard | null> {
    const existing = await this.getCardById(id);
    if (!existing) return null;

    const copyData: Omit<ScratchCard, 'id' | 'created_at' | 'updated_at'> = {
      title: `${existing.title} (Copy)`,
      subtitle: existing.subtitle,
      description: existing.description,
      image_url: existing.image_url,
      bg_color: existing.bg_color,
      border_color: existing.border_color,
      text_color: existing.text_color,
      scratch_overlay_type: existing.scratch_overlay_type,
      scratch_overlay_color: existing.scratch_overlay_color,
      reward_type: existing.reward_type,
      reward_value: existing.reward_value,
      coupon_code: existing.coupon_code ? `${existing.coupon_code}_COPY` : undefined,
      reward_description: existing.reward_description,
      winning_probability: existing.winning_probability,
      max_global_claims: existing.max_global_claims,
      max_claims_per_user: existing.max_claims_per_user,
      start_date: existing.start_date,
      expiry_date: existing.expiry_date,
      is_active: existing.is_active,
    };

    return this.createCard(copyData);
  }

  async deleteCard(id: string): Promise<boolean> {
    memoryCards = memoryCards.filter((c) => c.id !== id);
    try {
      const db = this.getDb();
      if (db) {
        await db.from('scratch_cards').delete().eq('id', id);
      }
    } catch {}
    return true;
  }

  async toggleCardActive(id: string, is_active: boolean): Promise<boolean> {
    await this.updateCard(id, { is_active });
    return true;
  }

  async getUserCards(userId?: string, email?: string): Promise<UserScratchCard[]> {
    try {
      const db = this.getDb();
      if (db) {
        let query = db
          .from('user_scratch_cards')
          .select('*, scratch_cards(title, subtitle, description, bg_color, border_color, text_color, scratch_overlay_type, scratch_overlay_color, image_url), orders(customer_name, email, total_amount, order_number)')
          .order('assigned_at', { ascending: false });

        if (userId) {
          query = query.or(`user_id.eq.${userId}${email ? `,user_email.eq.${email}` : ''}`);
        } else if (email) {
          query = query.eq('user_email', email);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            user_id: d.user_id,
            user_email: d.user_email || d.orders?.email,
            scratch_card_id: d.scratch_card_id,
            order_id: d.order_id,
            order_number: d.order_number || d.orders?.order_number,
            is_scratched: d.is_scratched,
            scratched_at: d.scratched_at,
            is_claimed: d.is_claimed,
            claimed_at: d.claimed_at,
            reward_type: d.reward_type || d.scratch_cards?.reward_type || 'flat_discount',
            reward_value: Number(d.reward_value || d.scratch_cards?.reward_value || 0),
            coupon_code: d.coupon_code || d.scratch_cards?.coupon_code,
            reward_details: d.reward_details,
            assigned_at: d.assigned_at,
            status: d.status || (d.is_claimed ? 'CLAIMED' : d.is_scratched ? 'SCRATCHED' : 'UNSCRATCHED'),
            card_title: d.scratch_cards?.title || 'Scratch Card',
            card_subtitle: d.scratch_cards?.subtitle || 'Scratch to reveal',
            card_description: d.scratch_cards?.description,
            bg_color: d.scratch_cards?.bg_color || '#1e1b4b',
            border_color: d.scratch_cards?.border_color || '#f59e0b',
            text_color: d.scratch_cards?.text_color || '#ffffff',
            scratch_overlay_type: d.scratch_cards?.scratch_overlay_type || 'charcoal',
            scratch_overlay_color: d.scratch_cards?.scratch_overlay_color || '#2c2c2c',
            image_url: d.scratch_cards?.image_url,
            customer_name: d.orders?.customer_name || (d.user_email ? d.user_email.split('@')[0] : 'Customer'),
            order_amount: d.orders?.total_amount ? Number(d.orders.total_amount) : 0,
          }));
        }
      }
    } catch (err) {
      console.warn('Supabase getUserCards error:', err);
    }

    if (userId || email) {
      return memoryUserCards.filter((uc) => (userId && uc.user_id === userId) || (email && uc.user_email === email));
    }
    return memoryUserCards;
  }

  async getDashboardStats(): Promise<ScratchDashboardStats> {
    const cards = await this.getCards();
    const userCards = memoryUserCards;

    let totalAssigned = userCards.length;
    let totalScratched = userCards.filter((u) => u.is_scratched).length;
    let totalClaimed = userCards.filter((u) => u.is_claimed).length;

    try {
      const db = this.getDb();
      if (db) {
        const { data: ucData, error } = await db.from('user_scratch_cards').select('is_scratched, is_claimed');
        if (!error && ucData) {
          totalAssigned = ucData.length;
          totalScratched = ucData.filter((u: any) => u.is_scratched).length;
          totalClaimed = ucData.filter((u: any) => u.is_claimed).length;
        }
      }
    } catch {}

    const totalCreated = cards.length;
    const remainingClaims = cards.reduce((sum, c) => {
      if (!c.max_global_claims) return sum + 999;
      return sum + Math.max(0, c.max_global_claims - (c.current_global_claims || 0));
    }, 0);

    const claimRate = totalAssigned > 0 ? Math.round((totalClaimed / totalAssigned) * 100) : 0;

    return {
      total_created: totalCreated,
      total_assigned: totalAssigned,
      total_scratched: totalScratched,
      total_claimed: totalClaimed,
      remaining_claims: remainingClaims,
      claim_rate: claimRate,
      eligible_orders: totalAssigned,
    };
  }

  async getWinnersList(): Promise<UserScratchCard[]> {
    try {
      const db = this.getDb();
      if (db) {
        const { data, error } = await db
          .from('user_scratch_cards')
          .select('*, scratch_cards(title)')
          .eq('is_claimed', true)
          .order('claimed_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            ...d,
            reward_value: Number(d.reward_value || 0),
            card_title: d.scratch_cards?.title || 'Scratch Card',
          }));
        }
      }
    } catch {}
    return memoryUserCards.filter((u) => u.is_claimed);
  }

  async assignCardToUser(userId: string, cardId: string, email?: string, orderId?: string, orderNumber?: string): Promise<UserScratchCard | null> {
    const card = await this.getCardById(cardId);
    if (!card) return null;

    const newAssignment: UserScratchCard = {
      id: `usc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: userId,
      user_email: email || '',
      scratch_card_id: cardId,
      order_id: orderId,
      order_number: orderNumber,
      is_scratched: false,
      is_claimed: false,
      reward_type: card.reward_type,
      reward_value: card.reward_value,
      coupon_code: card.coupon_code,
      reward_details: {
        title: card.title,
        description: card.reward_description || card.description,
        value: card.reward_value,
      },
      assigned_at: new Date().toISOString(),
      status: 'UNSCRATCHED',
      card_title: card.title,
      card_subtitle: card.subtitle,
      card_description: card.description,
      bg_color: card.bg_color,
      border_color: card.border_color,
      text_color: card.text_color,
      scratch_overlay_type: card.scratch_overlay_type,
      scratch_overlay_color: card.scratch_overlay_color,
      image_url: card.image_url,
    };

    memoryUserCards.unshift(newAssignment);

    try {
      const db = this.getDb();
      if (db) {
        const { data, error } = await db
          .from('user_scratch_cards')
          .insert({
            user_id: userId,
            user_email: email || null,
            scratch_card_id: cardId,
            order_id: orderId || null,
            order_number: orderNumber || null,
            reward_type: card.reward_type,
            reward_value: card.reward_value,
            coupon_code: card.coupon_code || null,
            reward_details: newAssignment.reward_details,
            status: 'UNSCRATCHED',
          })
          .select('*')
          .maybeSingle();

        if (!error && data) {
          return {
            ...newAssignment,
            id: data.id,
          };
        }
      }
    } catch (err) {
      console.warn('Supabase assignCardToUser error:', err);
    }

    return newAssignment;
  }

  async scratchCard(userCardId: string, userId?: string): Promise<{ success: boolean; reward?: any; message?: string }> {
    const uc = memoryUserCards.find((u) => u.id === userCardId);
    if (uc) {
      uc.is_scratched = true;
      uc.scratched_at = new Date().toISOString();
      uc.status = uc.is_claimed ? 'CLAIMED' : 'SCRATCHED';
    }

    try {
      const db = this.getDb();
      if (db) {
        await db
          .from('user_scratch_cards')
          .update({
            is_scratched: true,
            scratched_at: new Date().toISOString(),
            status: 'SCRATCHED',
          })
          .eq('id', userCardId);
      }
    } catch (err) {
      console.warn('Supabase scratchCard update error:', err);
    }

    return { success: true, reward: uc?.reward_details };
  }

  async claimReward(userCardId: string, userId?: string): Promise<{ success: boolean; reward?: any; coupon_code?: string; message: string }> {
    const uc = memoryUserCards.find((u) => u.id === userCardId);
    
    // Check if already claimed
    if (uc && uc.is_claimed) {
      return {
        success: true,
        coupon_code: uc.coupon_code,
        reward: uc.reward_details,
        message: 'Reward has already been claimed! Use code at checkout.',
      };
    }

    const now = new Date().toISOString();

    try {
      const db = this.getDb();
      if (db) {
        const { data: dbCard } = await db
          .from('user_scratch_cards')
          .select('*, scratch_cards(*)')
          .eq('id', userCardId)
          .maybeSingle();

        if (dbCard && dbCard.is_claimed) {
          return {
            success: true,
            coupon_code: dbCard.coupon_code,
            reward: dbCard.reward_details,
            message: 'Reward has already been claimed! Use code at checkout.',
          };
        }

        await db
          .from('user_scratch_cards')
          .update({
            is_scratched: true,
            is_claimed: true,
            claimed_at: now,
            status: 'CLAIMED',
          })
          .eq('id', userCardId);
      }
    } catch (err) {
      console.warn('Supabase claimReward error:', err);
    }

    if (uc) {
      uc.is_scratched = true;
      uc.scratched_at = uc.scratched_at || now;
      uc.is_claimed = true;
      uc.claimed_at = now;
      uc.status = 'CLAIMED';
    }

    return {
      success: true,
      coupon_code: uc?.coupon_code || 'SCRATCHWIN2026',
      reward: uc?.reward_details || { value: uc?.reward_value, type: uc?.reward_type },
      message: 'Reward successfully claimed! Applied to your account.',
    };
  }

  async evaluateAndAssignForOrder(orderData: { id?: string; orderNumber?: string; userId?: string; userEmail?: string; totalAmount: number }): Promise<UserScratchCard[]> {
    const settings = await this.getSettings();
    if (!settings.global_enabled) return [];

    // Strictly enforce minimum order amount rule (e.g. ₹1000)
    if (!orderData.totalAmount || Number(orderData.totalAmount) < Number(settings.min_order_amount)) {
      console.log(`[ScratchCards] Order total ₹${orderData.totalAmount} is below min requirement ₹${settings.min_order_amount}. No scratch card awarded.`);
      return [];
    }

    // Check award trigger strategy
    if (settings.award_trigger === 'manual_assignment') {
      console.log('[ScratchCards] Manual assignment strategy is active. Auto-assignment skipped.');
      return [];
    }

    const userId = orderData.userId || orderData.userEmail || 'guest-user';
    const existingCards = await this.getUserCards(userId, orderData.userEmail);

    if (!settings.allow_multiple_per_customer && existingCards.length > 0) {
      console.log('[ScratchCards] Customer already has a scratch card. Multiple cards per customer is disabled.');
      return [];
    }

    if ((settings.award_trigger === 'first_order_only' || settings.award_trigger === 'new_users_only') && existingCards.length > 0) {
      console.log(`[ScratchCards] Award trigger '${settings.award_trigger}' active and customer already received a card.`);
      return [];
    }

    const activeCards = (await this.getCards()).filter((c) => c.is_active);
    if (activeCards.length === 0) return [];

    const countToAssign = Math.max(1, settings.cards_per_order || 1);
    const assignedCards: UserScratchCard[] = [];

    for (let i = 0; i < countToAssign; i++) {
      const random = Math.random();
      const eligibleCards = activeCards.filter((c) => {
        if (c.max_global_claims && (c.current_global_claims || 0) >= c.max_global_claims) return false;
        if (c.winning_probability < random) return false;
        return true;
      });

      const selectedCard = eligibleCards.length > 0 
        ? eligibleCards[Math.floor(Math.random() * eligibleCards.length)] 
        : activeCards[0];

      if (selectedCard) {
        const assigned = await this.assignCardToUser(
          userId,
          selectedCard.id,
          orderData.userEmail,
          orderData.id,
          orderData.orderNumber
        );
        if (assigned) assignedCards.push(assigned);
      }
    }

    return assignedCards;
  }
}
