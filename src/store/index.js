import { create } from 'zustand';
import api from '../lib/api.js';

// ─── Settings Store ────────────────────────────────────────────────────────
// store/index.js (or wherever the store lives)

export const useSettingsStore = create((set, get) => ({
  settings: null,
  isLoading: true,           
  darkMode: localStorage.getItem('darkMode') === 'true',

  fetchSettings: async () => {
    try {
      const { data } = await api.get('/settings');
      set({ settings: data.data, isLoading: false });
    } catch {
      set({ isLoading: false });   // still finish loading even on error
    }
  },

  updateSettings: (newSettings) => {
    set({ settings: newSettings });
  },

  // ... rest unchanged
  
  toggleDarkMode: () => {
    const next = !get().darkMode;
    localStorage.setItem('darkMode', next);
    document.documentElement.classList.toggle('dark', next);
    set({ darkMode: next });
  },

  initDarkMode: () => {
    const stored = localStorage.getItem('darkMode') === 'true';
    document.documentElement.classList.toggle('dark', stored);
  },
}));

// export const useSettingsStore = create((set, get) => ({
//   settings: null,
//   darkMode: localStorage.getItem('darkMode') === 'true',

//   fetchSettings: async () => {
//     try {
//       const { data } = await api.get('/settings');
//       set({ settings: data.data });
//     } catch {}
//   },

//   // ADD THIS ACTION
//   updateSettings: (newSettings) => {
//     set({ settings: newSettings });
//   },

// }));

// ─── POS Cart Store ────────────────────────────────────────────────────────
export const usePOSStore = create((set, get) => ({
  cart: [],
  customer: null,
  discount: 0,
  paymentMethod: 'cash',
  amountPaid: 0,

  addToCart: (product) => {
    const cart = get().cart;
    const existing = cart.find((i) => i._id === product._id);
    if (existing) {
      set({ cart: cart.map((i) => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      set({ cart: [...cart, { ...product, quantity: 1, itemDiscount: 0 }] });
    }
  },

  removeFromCart: (id) => set({ cart: get().cart.filter((i) => i._id !== id) }),

  updateQuantity: (id, qty) => {
    if (qty <= 0) { get().removeFromCart(id); return; }
    set({ cart: get().cart.map((i) => i._id === id ? { ...i, quantity: qty } : i) });
  },

  updateItemDiscount: (id, discount) =>
    set({ cart: get().cart.map((i) => i._id === id ? { ...i, itemDiscount: discount } : i) }),

  setCustomer: (customer) => set({ customer }),
  setDiscount: (discount) => set({ discount }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setAmountPaid: (amount) => set({ amountPaid: amount }),

  clearCart: () => set({ cart: [], customer: null, discount: 0, paymentMethod: 'cash', amountPaid: 0 }),

  getSubtotal: () => get().cart.reduce((sum, i) => sum + i.sellingPrice * i.quantity - (i.itemDiscount || 0), 0),
  getTax: () => get().cart.reduce((sum, i) => sum + (i.sellingPrice * i.quantity * ((i.taxRate || 0) / 100)), 0),
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const tax = get().getTax();
    return subtotal + tax - get().discount;
  },
}));
