import { createSlice, PayloadAction, current } from '@reduxjs/toolkit';

export interface CartItem {
  id: string;
  slug: string;
  title: string;
  brand: string;
  price: number;
  discountedPrice: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  selected?: boolean;
  custom_images?: { image_url: string; color_name: string }[];
  sku?: string;
}

export interface Reward {
  id: string;
  type: 'GIFT' | 'COUPON' | 'CASHBACK' | 'SHIPPING';
  title: string;
  threshold: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  discountValue: number;
  discountType: 'percentage' | 'flat';
  appliedPromo: string;
  directCheckoutItem: CartItem | null;
  unlockedRewards: Reward[];
}

const initialState: CartState = {
  items: [],
  total: 0,
  discountValue: 0,
  discountType: 'percentage',
  appliedPromo: '',
  directCheckoutItem: null,
  unlockedRewards: [],
};

const REWARD_TIERS: Reward[] = [
  { id: 'r1', type: 'COUPON', title: '10% Extra Discount Coupon', threshold: 2000 },
  { id: 'r2', type: 'GIFT', title: 'Free GR Premium Socks', threshold: 5000 },
  { id: 'r3', type: 'GIFT', title: 'Premium Gift Box', threshold: 10000 },
];

const calculateRewards = (total: number) => {
  return REWARD_TIERS.filter(r => total >= r.threshold).sort((a, b) => b.threshold - a.threshold);
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      console.log('Redux Action: cart/addToCart');
      console.log('Product data received:', action.payload);
      console.log('Cart state before update:', current(state));

      const existingItem = state.items.find(
        (item) =>
          item.id === action.payload.id &&
          item.size === action.payload.size &&
          item.color === action.payload.color
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push({
          ...action.payload,
          selected: action.payload.selected !== false // default to true
        });
      }

      state.total = state.items.reduce((sum, item) => sum + (item.selected ? item.discountedPrice * item.quantity : 0), 0);
      state.unlockedRewards = calculateRewards(state.total);
      console.log('Cart state after update:', current(state));
    },
    removeFromCart: (state, action: PayloadAction<{ id: string; size?: string; color?: string }>) => {
      console.log('Redux Action: cart/removeFromCart');
      console.log('Remove details received:', action.payload);
      console.log('Cart state before update:', current(state));

      state.items = state.items.filter(
        (item) =>
          !(
            item.id === action.payload.id &&
            item.size === action.payload.size &&
            item.color === action.payload.color
          )
      );

      state.total = state.items.reduce((sum, item) => sum + (item.selected ? item.discountedPrice * item.quantity : 0), 0);
      state.unlockedRewards = calculateRewards(state.total);
      console.log('Cart state after update:', current(state));
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ id: string; size?: string; color?: string; quantity: number }>
    ) => {
      console.log('Redux Action: cart/updateQuantity');
      console.log('Update details received:', action.payload);
      console.log('Cart state before update:', current(state));

      const item = state.items.find(
        (item) =>
          item.id === action.payload.id &&
          item.size === action.payload.size &&
          item.color === action.payload.color
      );

      if (item) {
        item.quantity = action.payload.quantity;
        state.total = state.items.reduce((sum, item) => sum + (item.selected ? item.discountedPrice * item.quantity : 0), 0);
        state.unlockedRewards = calculateRewards(state.total);
      }

      console.log('Cart state after update:', current(state));
    },
    toggleSelectItem: (
      state,
      action: PayloadAction<{ id: string; size?: string; color?: string }>
    ) => {
      const item = state.items.find(
        (item) =>
          item.id === action.payload.id &&
          item.size === action.payload.size &&
          item.color === action.payload.color
      );
      if (item) {
        item.selected = item.selected === false ? true : false;
        state.total = state.items.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0);
      }
    },
    toggleSelectAllItems: (state, action: PayloadAction<{ selected: boolean }>) => {
      state.items.forEach((item) => {
        item.selected = action.payload.selected;
      });
      state.total = state.items.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0);
    },
    clearCart: (state) => {
      console.log('Redux Action: cart/clearCart');
      console.log('Cart state before update:', current(state));

      state.items = [];
      state.total = 0;
      state.discountValue = 0;
      state.discountType = 'percentage';
      state.appliedPromo = '';

      console.log('Cart state after update:', current(state));
    },
    clearSelectedItems: (state) => {
      state.items = state.items.filter((item) => item.selected === false);
      state.total = state.items.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0);
      if (state.items.length === 0) {
        state.discountValue = 0;
        state.discountType = 'percentage';
        state.appliedPromo = '';
      }
    },
    hydrateCart: (state, action: PayloadAction<CartItem[]>) => {
      console.log('Redux Action: cart/hydrateCart');
      console.log('Hydration data received:', action.payload);
      console.log('Cart state before update:', current(state));

      // Make sure hydrated items have a selected property (defaulting to true if not defined)
      state.items = action.payload.map(item => ({
        ...item,
        selected: item.selected !== false
      }));
      state.total = state.items.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0);

      console.log('Cart state after update:', current(state));
    },
    applyPromo: (state, action: PayloadAction<{ code: string; discountValue: number; discountType: 'percentage' | 'flat' }>) => {
      state.discountValue = action.payload.discountValue;
      state.discountType = action.payload.discountType;
      state.appliedPromo = action.payload.code;
    },
    removePromo: (state) => {
      state.discountValue = 0;
      state.discountType = 'percentage';
      state.appliedPromo = '';
    },
    setDirectCheckoutItem: (state, action: PayloadAction<CartItem | null>) => {
      state.directCheckoutItem = action.payload;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  toggleSelectItem,
  toggleSelectAllItems,
  clearCart,
  clearSelectedItems,
  hydrateCart,
  applyPromo,
  removePromo,
  setDirectCheckoutItem,
} = cartSlice.actions;
export default cartSlice.reducer;

