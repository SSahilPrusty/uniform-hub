import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string }[];
  };
  variant: {
    id: string;
    size: string;
    color?: string | null;
    sellingPrice: number;
    mrp: number;
    stock: number;
  };
  measurement?: {
    studentName: string;
  } | null;
}

export interface CartData {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  taxAmount: number;
  total: number;
  couponCode?: string | null;
}

interface CartContextType {
  cart: CartData | null;
  itemsCount: number;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, variantId: string, quantity?: number, measurementId?: string | null) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const refreshCart = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/cart");
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (
    productId: string,
    variantId: string,
    quantity = 1,
    measurementId?: string | null
  ) => {
    try {
      const res = await api.post("/cart/items", {
        productId,
        variantId,
        quantity,
        customMeasurementId: measurementId,
      });

      if (res.data.success) {
        setCart(res.data.data);
        setIsDrawerOpen(true);
        return { success: true };
      }
      return { success: false, error: res.data.error || "Failed to add to cart" };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || "Could not add to cart. Stock limit reached.",
      };
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const res = await api.put(`/cart/items/${itemId}`, { quantity });
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Unable to update quantity.");
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const res = await api.delete(`/cart/items/${itemId}`);
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (err: any) {
      console.error("Failed to delete cart item:", err);
    }
  };

  const applyCoupon = async (code: string) => {
    try {
      if (!cart) return { success: false, error: "Cart not ready" };
      const res = await api.post("/cart/coupon", { cartId: cart.id, code });
      if (res.data.success) {
        setCart(res.data.data);
        return { success: true, message: res.data.message };
      }
      return { success: false, error: res.data.error };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || "Invalid coupon" };
    }
  };

  const itemsCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemsCount,
        isLoading,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        applyCoupon,
        isDrawerOpen,
        setIsDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
