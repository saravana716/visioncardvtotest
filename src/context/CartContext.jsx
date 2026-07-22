import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth } from '../firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import { addToCart, getCartItems, removeFromCart, clearUserCart, getProductById, updateCartItemQuantity } from '../services/firestoreService';
import { toast } from 'react-hot-toast';
import { isProductUnavailable } from '../utils/availability';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartOpen, setCartOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('cart');
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!isMounted.current) return;
      setUser(currentUser);
      if (currentUser) {
        fetchCartItems(currentUser.uid);
      } else {
        setCartItems([]);
        setLoading(false);
      }
    });
    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, []);

  const fetchCartItems = async (userId) => {
    setLoading(true);
    const items = await getCartItems(userId);
    if (!isMounted.current) return;
    setCartItems(items);
    setLoading(false);
  };

  const addItemToCart = async (productData) => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return false;
    }

    // Central availability gate — EVERY add-to-cart path (product page,
    // QuickView, PropCard) funnels through here. Re-check the product's current
    // status/stock so an admin-Discontinued / Out-of-Stock product can't be
    // added from any surface. A transient read error does not block the sale.
    let itemToAdd = productData;
    if (productData?.productId) {
      try {
        const freshProduct = await getProductById(productData.productId);
        if (freshProduct && isProductUnavailable(freshProduct)) {
          toast.error("This product is currently unavailable.");
          return false;
        }
        // Stamp the authoritative category when the caller didn't supply one.
        // The cart/checkout GST rate keys off item.category (Sunglasses 18% vs
        // 12%), and the card / QuickView add-to-cart paths omit it — without
        // this, sunglasses added from those surfaces were taxed at 12%.
        if (freshProduct && (itemToAdd.category == null || itemToAdd.category === '')) {
          itemToAdd = { ...itemToAdd, category: freshProduct.category || '' };
        }
      } catch (err) {
        console.error("Availability check failed:", err);
      }
    }

    // Every cart line carries a quantity (default 1). Legacy docs without the
    // field are treated as qty 1 everywhere via `item.quantity || 1`.
    const toPersist = { quantity: 1, ...itemToAdd };
    const result = await addToCart(user.uid, toPersist);
    if (result.success) {
      setCartItems(prev => [...prev, { id: result.id, userId: user.uid, ...toPersist }]);
      toast.success("Added to cart successfully!");
      return true;
    } else {
      toast.error("Failed to add to cart");
      return false;
    }
  };

  const updateItemQuantity = async (cartItemId, newQuantity) => {
    const qty = Math.max(1, Math.min(99, Math.floor(Number(newQuantity) || 1)));
    // Capture only THIS item's prior quantity so a failure rolls back just this
    // line, not the whole array (which would resurrect a concurrently-removed
    // item or clobber an in-flight change to a different line).
    const prevQty = cartItems.find(it => it.id === cartItemId)?.quantity;
    // Optimistic update so the stepper feels instant.
    setCartItems(prev => prev.map(it => (it.id === cartItemId ? { ...it, quantity: qty } : it)));
    const result = await updateCartItemQuantity(cartItemId, qty);
    if (!result.success) {
      toast.error("Failed to update quantity");
      // Revert only this line, and only if it still exists in the cart.
      setCartItems(prev => prev.map(it => (it.id === cartItemId ? { ...it, quantity: prevQty ?? 1 } : it)));
    }
  };

  const removeItemFromCart = async (cartItemId) => {
    const result = await removeFromCart(cartItemId);
    if (result.success) {
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));
      toast.success("Removed from cart");
    } else {
      toast.error("Failed to remove item");
    }
  };

  const clearCart = async () => {
    if (!user) {
      setCartItems([]);
      return { success: true };
    }
    const result = await clearUserCart(user.uid);
    if (result.success) {
      setCartItems([]);
    } else {
      toast.error("Failed to clear cart on the server");
    }
    return result;
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      loading,
      user,
      addItemToCart,
      removeItemFromCart,
      updateItemQuantity,
      clearCart,
      cartOpen,
      setCartOpen,
      drawerTab,
      setDrawerTab,
      // Total units across all lines (sum of quantities), so the navbar/cart
      // badge reflects how many items the customer is actually buying.
      cartCount: cartItems.reduce((n, it) => n + (Number(it.quantity) || 1), 0)
    }}>
      {children}
    </CartContext.Provider>
  );
};
