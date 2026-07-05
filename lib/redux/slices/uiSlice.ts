import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface UIState {
  mobileMenuOpen: boolean;
  filterSidebarOpen: boolean;
  toasts: Toast[];
  quickViewProduct: any | null; // holds product for modal
}

const initialState: UIState = {
  mobileMenuOpen: false,
  filterSidebarOpen: false,
  toasts: [],
  quickViewProduct: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    closeMobileMenu: (state) => {
      state.mobileMenuOpen = false;
    },
    toggleFilterSidebar: (state) => {
      state.filterSidebarOpen = !state.filterSidebarOpen;
    },
    closeFilterSidebar: (state) => {
      state.filterSidebarOpen = false;
    },
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = Date.now().toString();
      state.toasts.push({ ...action.payload, id });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    // Quick view actions
    openQuickView: (state, action: PayloadAction<any>) => {
      state.quickViewProduct = action.payload;
    },
    closeQuickView: (state) => {
      state.quickViewProduct = null;
    },
  },
});

export const {
  toggleMobileMenu,
  closeMobileMenu,
  toggleFilterSidebar,
  closeFilterSidebar,
  addToast,
  removeToast,
  openQuickView,
  closeQuickView,
} = uiSlice.actions;
export default uiSlice.reducer;
