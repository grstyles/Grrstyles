import { supabase } from '@/lib/supabase';

export interface Coupon {
  code: string;
  discountPercent: number;
  description: string;
  isActive: boolean;
}

export const couponService = {
  /**
   * Validate a coupon code. Returns coupon if valid and active, else null.
   */
  async validateCoupon(code: string): Promise<Coupon | null> {
    const cleanCode = code.toUpperCase().trim();
    const { data, error } = await supabase!
      .from('coupons')
      .select('*')
      .eq('code', cleanCode)
      .eq('active', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      code: data.code,
      discountPercent: Number(data.discount || 0),
      description: data.description || '',
      isActive: !!data.active,
    };
  },

  async getAvailableCoupons(): Promise<Coupon[]> {
    const { data, error } = await supabase!
      .from('coupons')
      .select('*')
      .eq('active', true);

    if (error) throw error;
    if (!data) return [];

    return data.map((d: any) => ({
      code: d.code,
      discountPercent: Number(d.discount || 0),
      description: d.description || '',
      isActive: !!d.active,
    }));
  },
};
