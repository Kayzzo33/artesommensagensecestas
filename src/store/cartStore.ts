import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // Typically product_id + a unique hash if customized
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  message?: string;
  messageFee?: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  totalWithShipping: (shippingFee: number) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        set((state) => {
          const defaultId = `${newItem.productId}-${newItem.message || ''}`;
          const existingItemIndex = state.items.findIndex(
            (i) => i.id === newItem.id || i.id === defaultId
          );

          if (existingItemIndex >= 0) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += newItem.quantity;
            return { items: updatedItems };
          }
          
          return { items: [...state.items, { ...newItem, id: newItem.id || defaultId }] };
        });
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }));
      },
      clearCart: () => set({ items: [] }),
      subtotal: () => {
        return get().items.reduce((total, item) => {
          return total + (item.price + (item.messageFee || 0)) * item.quantity;
        }, 0);
      },
      totalWithShipping: (shippingFee) => {
        return get().subtotal() + shippingFee;
      },
    }),
    {
      name: 'arte-som-cart', // key in local storage
    }
  )
);
