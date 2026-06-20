import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/providers/mockStore';

export interface Coupon {
  code: string;
  discountPercent: number;
  description: string;
  isActive: boolean;
}

export const couponService = {
  /**
   * Validate a coupon code. Returns coupon if valid and active, else null.
   * In mock mode: uses the shared mockStore so newly created admin coupons work.
   */
  async validateCoupon(code: string): Promise<Coupon | null> {
    if (!isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 80));
      const result = mockStore.applyCoupon(code);
      if (!result.valid) return null;
      const coupon = mockStore.getCouponByCode(code);
      if (!coupon || !coupon.isActive) return null;
      return {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        description: coupon.description,
        isActive: coupon.isActive,
      };
    }

    try {
      const cleanCode = code.toUpperCase().trim();
      const { data, error } = await supabase!
        .from('coupons')
        .select('*')
        .eq('code', cleanCode)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) return this.getLocalCoupon(code);
      return {
        code: data.code,
        discountPercent: Number(data.discount_percent),
        description: data.description || '',
        isActive: !!data.is_active,
      };
    } catch (e) {
      return this.getLocalCoupon(code);
    }
  },

  /** Fallback: check mockStore directly without incrementing usage */
  getLocalCoupon(code: string): Coupon | null {
    const coupon = mockStore.getCouponByCode(code);
    if (!coupon || !coupon.isActive) return null;
    return {
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      description: coupon.description,
      isActive: coupon.isActive,
    };
  },

  async getAvailableCoupons(): Promise<Coupon[]> {
    if (!isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return mockStore.getCoupons()
        .filter((c) => c.isActive)
        .map((c) => ({
          code: c.code,
          discountPercent: c.discountPercent,
          description: c.description,
          isActive: c.isActive,
        }));
    }

    try {
      const { data, error } = await supabase!
        .from('coupons')
        .select('*')
        .eq('is_active', true);

      if (error || !data || data.length === 0) {
        return mockStore.getCoupons().filter((c) => c.isActive).map((c) => ({
          code: c.code,
          discountPercent: c.discountPercent,
          description: c.description,
          isActive: c.isActive,
        }));
      }

      return data.map((d: any) => ({
        code: d.code,
        discountPercent: Number(d.discount_percent),
        description: d.description || '',
        isActive: !!d.is_active,
      }));
    } catch (e) {
      return mockStore.getCoupons().filter((c) => c.isActive).map((c) => ({
        code: c.code,
        discountPercent: c.discountPercent,
        description: c.description,
        isActive: c.isActive,
      }));
    }
  },
};
