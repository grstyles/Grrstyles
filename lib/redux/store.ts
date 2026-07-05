import { configureStore } from '@reduxjs/toolkit';
import cartSlice from './slices/cartSlice';
import wishlistSlice from './slices/wishlistSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    cart: cartSlice,
    wishlist: wishlistSlice,
    ui: uiSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
