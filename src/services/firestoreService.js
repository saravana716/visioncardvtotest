import { collection, getDocs, getDoc, doc, query, where, addDoc, deleteDoc, setDoc, updateDoc, serverTimestamp, writeBatch, orderBy, runTransaction, documentId } from 'firebase/firestore';
import { db, storage } from '../firebase.config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { parsePriceToInt } from '../utils/price';

/** Customer-facing site settings the admin edits (logo, contact, social links). */
export const getSiteSettings = async () => {
  try {
    const snap = await getDoc(doc(db, 'siteSettings', 'general'));
    return snap.exists() ? snap.data() : {};
  } catch (error) {
    console.error("Error fetching site settings: ", error);
    return {};
  }
};

export const getCategories = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching categories: ", error);
    return [];
  }
};

export const getProducts = async (categoryName = null, filters = {}, sortBy = 'latest') => {
  try {
    let q = query(collection(db, 'products'));
    
    if (categoryName) {
      q = query(q, where('category', '==', categoryName));
    }

    // Apply additional filters dynamically
    Object.keys(filters).forEach(key => {
      let val = filters[key];
      let dbKey = key;

      // MAP FRONTEND KEYS TO DATABASE KEYS
      if (dbKey === 'frameStyle') dbKey = 'frameType';
      if (dbKey === 'subcategory' && categoryName === 'Contact Lenses') {
        dbKey = 'contactLensSubcategory';
      }

      if (val) {
        if (dbKey === 'priceRange' && Array.isArray(val) && val.length > 0) {
            // Price filtering is best handled by creating a compound condition or local filtering
            // Note: Firestore doesn't support multiple range inequalities on different values well.
        } else if (Array.isArray(val) && val.length > 0) {
          q = query(q, where(dbKey, 'in', val));
        } else if (typeof val === 'string') {
          q = query(q, where(dbKey, '==', val));
        }
      }
    });

    const querySnapshot = await getDocs(q);
    let products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // In-memory sort to avoid requiring composite indexes
    products.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt instanceof Date ? a.createdAt : new Date(0));
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt instanceof Date ? b.createdAt : new Date(0));
        return dateB - dateA;
    });

    // Post-process Price Range Filter (since Firestore inequality limits)
    if (filters.priceRange && Array.isArray(filters.priceRange) && filters.priceRange.length > 0) {
        products = products.filter(p => {
            const price = parsePriceToInt(p.price);
            return filters.priceRange.some(range => {
                if (range === 'under500') return price < 500;
                if (range === '500-1000') return price >= 500 && price <= 1000;
                if (range === '1000-2000') return price > 1000 && price <= 2000;
                if (range === 'over2000') return price > 2000;
                return true;
            });
        });
    }

    // Apply Sorting. 'latest'/'new' keep the createdAt-desc order established
    // above (there is no separate popularity metric, so "Popularity"/"New
    // Arrivals" both mean most-recent). Only price and rating re-sort here.
    if (sortBy === 'lowToHigh') {
        products.sort((a, b) => parsePriceToInt(a.price) - parsePriceToInt(b.price));
    } else if (sortBy === 'highToLow') {
        products.sort((a, b) => parsePriceToInt(b.price) - parsePriceToInt(a.price));
    } else if (sortBy === 'rating') {
        // Products don't store an aggregate rating (it's derived from the reviews
        // subcollection), so rank by the available ratingCount signal. Ties (very
        // common, since most counts are 0) fall back to createdAt-desc explicitly
        // rather than relying on a stable sort.
        const toDate = (o) =>
            o.createdAt?.toDate ? o.createdAt.toDate() : (o.createdAt instanceof Date ? o.createdAt : new Date(0));
        products.sort((a, b) => {
            const diff = (Number(b.ratingCount) || 0) - (Number(a.ratingCount) || 0);
            return diff !== 0 ? diff : toDate(b) - toDate(a);
        });
    }

    return products;
  } catch (error) {
    console.error("Error fetching products: ", error);
    return [];
  }
};

export const getTrendyProducts = async (categoryName = null, limitCount = 8) => {
  try {
    let q = query(collection(db, 'products'));
    
    if (categoryName && typeof categoryName === 'string') {
      q = query(q, where('category', '==', categoryName));
    }

    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort in JS to avoid index requirement
    products.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt instanceof Date ? a.createdAt : new Date(0));
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt instanceof Date ? b.createdAt : new Date(0));
        return dateB - dateA;
    });

    return products.slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching trendy products: ", error);
    return [];
  }
};

// Fetch a set of products by id in chunks of 30 (Firestore `in` cap),
// returning them in the same order as the input. Missing ids are dropped.
// Use this instead of getProducts().filter() when you already know the ids.
export const getProductsByIds = async (ids) => {
  if (!ids || ids.length === 0) return [];
  const unique = [...new Set(ids.filter(Boolean))];
  const chunks = [];
  for (let i = 0; i < unique.length; i += 30) {
    chunks.push(unique.slice(i, i + 30));
  }
  const found = new Map();
  await Promise.all(chunks.map(async (chunk) => {
    try {
      const q = query(collection(db, 'products'), where(documentId(), 'in', chunk));
      const snap = await getDocs(q);
      snap.docs.forEach(d => found.set(d.id, { id: d.id, ...d.data() }));
    } catch (e) {
      console.error("Error fetching products by ids: ", e);
    }
  }));
  return ids.map(id => found.get(id)).filter(Boolean);
};

export const getProductById = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, 'products', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching product by ID: ", error);
    return null;
  }
};

export const updateProductStock = async (productId, newStock) => {
  try {
    const productRef = doc(db, 'products', productId);
    await setDoc(productRef, { stock: newStock }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error updating product stock: ", error);
    return { success: false, error };
  }
};

export const decrementStock = async (productId, quantity) => {
  try {
    const productRef = doc(db, 'products', productId);
    const updatedStock = await runTransaction(db, async (tx) => {
      const snap = await tx.get(productRef);
      if (!snap.exists()) throw new Error("Product not found");
      const currentStock = snap.data().stock || 0;
      const next = Math.max(0, currentStock - quantity);
      tx.update(productRef, { stock: next });
      return next;
    });
    return { success: true, updatedStock };
  } catch (error) {
    console.error("Error decrementing stock: ", error);
    return { success: false, error };
  }
};

export const getCategoryByName = async (name) => {
  try {
    const q = query(collection(db, 'categories'), where('name', '==', name));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching category by name: ", error);
    return null;
  }
};

/**
 * Aggregates unique filter values from products in a specific category.
 * This powers the Self-Populating MegaMenu.
 */
export const getCategoryFilters = async (categoryName) => {
  try {
    let q = query(collection(db, 'products'));
    if (categoryName) {
      q = query(q, where('category', '==', categoryName));
    }
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => doc.data());

    const filters = {
      gender: new Set(),
      frameType: new Set(),
      frameShape: new Set(),
      frameMaterial: new Set(),
      lensType: new Set(),
      brand: new Set(),
      frameColor: new Set(),
      frameSize: new Set()
    };

    products.forEach(p => {
      if (p.gender) filters.gender.add(p.gender);
      if (p.frameType) filters.frameType.add(p.frameType);
      if (p.frameShape) filters.frameShape.add(p.frameShape);
      if (p.frameMaterial) filters.frameMaterial.add(p.frameMaterial);
      if (p.lensType) filters.lensType.add(p.lensType);
      if (p.brand) filters.brand.add(p.brand);
      if (p.frameColor) filters.frameColor.add(p.frameColor);
      if (p.frameSize) filters.frameSize.add(p.frameSize);
    });

    return {
      gender: Array.from(filters.gender).sort(),
      frameType: Array.from(filters.frameType).sort(),
      frameShape: Array.from(filters.frameShape).sort(),
      frameMaterial: Array.from(filters.frameMaterial).sort(),
      lensType: Array.from(filters.lensType).sort(),
      brand: Array.from(filters.brand).sort(),
      frameColor: Array.from(filters.frameColor).sort(),
      frameSize: Array.from(filters.frameSize).sort()
    };
  } catch (error) {
    console.error("Error aggregating category filters: ", error);
    return null;
  }
};
export const getLensEnhancements = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'lensEnhancements'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.error("Error fetching lens enhancements: ", error);
    return [];
  }
};

export const getCategoryDiscounts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'categoryDiscounts'));
    const discounts = {};
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.categoryName) {
        discounts[data.categoryName] = data.discountPercent;
      }
    });
    return discounts;
  } catch (error) {
    console.error("Error fetching category discounts: ", error);
    return {};
  }
};

/**
 * Applies global category discounts to a list of products.
 * When both a category discount and a manual offerPrice apply to a product,
 * the lower of the two selling prices wins (best deal for the customer),
 * rather than the category discount unconditionally overriding the manual offer.
 */
export const applyCategoryDiscounts = (products, categoryDiscounts) => {
  if (!products) return [];
  const discounts = categoryDiscounts || {};
  
  return products.map(p => {
    const basePrice = parsePriceToInt(p.price);
    const discountPercent = discounts[p.category] || 0;

    // Compute both candidate sale prices...
    const categoryPrice = discountPercent > 0
      ? Math.round(basePrice - (basePrice * (discountPercent / 100)))
      : null;
    const manualOffer = parsePriceToInt(p.offerPrice);
    const manualPrice = (manualOffer > 0 && manualOffer < basePrice) ? manualOffer : null;

    // ...and give the customer the lower of the two. Previously a category
    // discount always won, even when the admin's manual offerPrice was cheaper
    // (e.g. base ₹1000, 50%-off offer ₹500, 10% category discount → showed ₹900
    // instead of ₹500).
    let sellingPrice = basePrice;
    let discountLabel = null;
    let hasCategoryDiscount = false;

    if (categoryPrice != null && (manualPrice == null || categoryPrice <= manualPrice)) {
      sellingPrice = categoryPrice;
      discountLabel = `${discountPercent}% OFF`;
      hasCategoryDiscount = true;
    } else if (manualPrice != null) {
      sellingPrice = manualPrice;
      discountLabel = `${Math.round(((basePrice - manualPrice) / basePrice) * 100)}% OFF`;
    }

    return {
      ...p,
      sellingPrice,
      displayPrice: `₹${sellingPrice}`,
      originalPrice: basePrice > 0 ? `₹${basePrice}` : '₹0',
      discountLabel,
      hasCategoryDiscount
    };
  });
};

export const addToCart = async (userId, cartData) => {
  try {
    const cartRef = collection(db, 'carts');
    const docRef = await addDoc(cartRef, {
      userId,
      ...cartData,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error("Error adding to cart: ", error);
    return { success: false, error };
  }
};

export const getCartItems = async (userId) => {
  try {
    const q = query(collection(db, 'carts'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const rawCartItems = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const validCartItems = [];
    const invalidCartItemIds = [];

    // Verify each product exists
    await Promise.all(rawCartItems.map(async (item) => {
      if (item.productId) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          validCartItems.push(item);
        } else {
          invalidCartItemIds.push(item.id);
        }
      } else {
        // Keeps old legacy cart items without productId just in case
        validCartItems.push(item);
      }
    }));

    // Clean up invalid cart items asynchronously
    if (invalidCartItemIds.length > 0) {
      const batch = writeBatch(db);
      invalidCartItemIds.forEach(id => {
        batch.delete(doc(db, 'carts', id));
      });
      batch.commit().catch(e => console.error("Error cleaning up invalid cart items: ", e));
    }

    return validCartItems;
  } catch (error) {
    console.error("Error fetching cart items: ", error);
    return [];
  }
};

export const removeFromCart = async (cartItemId) => {
  try {
    await deleteDoc(doc(db, 'carts', cartItemId));
    return { success: true };
  } catch (error) {
    console.error("Error removing from cart: ", error);
    return { success: false, error };
  }
};

export const updateCartItemQuantity = async (cartItemId, quantity) => {
  try {
    // Clamp to a sane range so a bad caller can't persist 0/negative/huge qty.
    const qty = Math.max(1, Math.min(99, Math.floor(Number(quantity) || 1)));
    await updateDoc(doc(db, 'carts', cartItemId), { quantity: qty });
    return { success: true, quantity: qty };
  } catch (error) {
    console.error("Error updating cart quantity: ", error);
    return { success: false, error };
  }
};

export const placeOrder = async (userId, orderData) => {
  try {
    // Generate Custom Order ID: VK-DDMMYY-XXX
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${dd}${mm}${yy}`; // e.g. 230526

    // Allocate the per-day sequence and write the order in a single transaction.
    // Previously the sequence came from counting today's orders (getDocs) and
    // then setDoc(customOrderId, ...) — a non-atomic read-then-write. Two
    // checkouts on the same day could read the same count, compute the same id,
    // and the second setDoc would OVERWRITE the first customer's order. The
    // counter doc serializes concurrent allocations so every order gets a
    // unique id, and the existence guard makes an overwrite impossible.
    const counterRef = doc(db, 'counters', `orders-${datePrefix}`);
    const customOrderId = await runTransaction(db, async (tx) => {
      // All reads must precede all writes inside a Firestore transaction.
      const counterSnap = await tx.get(counterRef);
      // Coerce the stored seq to a number: if the counter doc is corrupted or
      // manually edited to a string, `'10' + 1` would concatenate ("101") and
      // corrupt the sequence. Number(...) || 0 keeps it strictly numeric.
      const prevSeq = counterSnap.exists() ? Number(counterSnap.data().seq) || 0 : 0;
      const nextSeq = prevSeq + 1;
      const id = `VK-${datePrefix}-${String(nextSeq).padStart(3, '0')}`;
      const orderRef = doc(db, 'orders', id);
      const orderSnap = await tx.get(orderRef);
      if (orderSnap.exists()) {
        // Should be unreachable given the counter, but never clobber an order.
        throw new Error(`Order id collision: ${id}`);
      }

      tx.set(counterRef, { seq: nextSeq, updatedAt: serverTimestamp() }, { merge: true });
      tx.set(orderRef, {
        userId,
        status: 'Ordered', // default; overridden by orderData.status when caller specifies one (e.g. 'Awaiting Payment' for CCAvenue)
        ...orderData,
        orderIdPrefix: datePrefix, // retained for backward-compatible querying of today's orders
        createdAt: serverTimestamp()
      });
      return id;
    });

    return { id: customOrderId, success: true };
  } catch (error) {
    console.error("Error placing order: ", error);
    return { success: false, error };
  }
};

export const clearUserCart = async (userId) => {
  try {
    const q = query(collection(db, 'carts'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error clearing cart: ", error);
    return { success: false, error };
  }
};

export const getUserOrders = async (userId) => {
  try {
    const q = query(
      collection(db, 'orders'), 
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in JS to avoid requiring a composite index
    return orders.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching user orders: ", error);
    return [];
  }
};

// Delete an order owned by the requesting user. Used to roll back a
// partially-created order document when a downstream step (payment
// gateway, stock decrement) fails after the order was written, so we
// don't leave a stranded record. Ownership is checked before delete.
export const deleteOrderById = async (orderId, requestingUserId) => {
  if (!requestingUserId) {
    return { success: false, error: new Error("Sign in required.") };
  }
  try {
    const orderRef = doc(db, 'orders', orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return { success: true };
    if (snap.data().userId !== requestingUserId) {
      return { success: false, error: new Error("Not the owner.") };
    }
    await deleteDoc(orderRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting order: ", error);
    return { success: false, error };
  }
};

// Returns the order document only if it exists AND its userId matches the
// requesting user. A missing requestingUserId is treated as "denied" so the
// API is safe by default — callers must explicitly authenticate first.
// Firestore Security Rules should still be the real boundary, but this
// closes the easy URL-share leak before the request even goes out.
export const getOrderById = async (orderId, requestingUserId) => {
  if (!requestingUserId) {
    return null;
  }
  try {
    const docSnap = await getDoc(doc(db, 'orders', orderId));
    if (!docSnap.exists()) return null;
    const data = { id: docSnap.id, ...docSnap.data() };
    if (data.userId !== requestingUserId) {
      return null;
    }
    return data;
  } catch (error) {
    console.error("Error fetching order by ID: ", error);
    return null;
  }
};

export const toggleWishlist = async (userId, productId) => {
  try {
    const q = query(
      collection(db, 'wishlist'),
      where('userId', '==', userId),
      where('productId', '==', productId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Remove if exists
      const docId = querySnapshot.docs[0].id;
      await deleteDoc(doc(db, 'wishlist', docId));
      return { action: 'removed', success: true };
    } else {
      // Add if doesn't exist
      await addDoc(collection(db, 'wishlist'), {
        userId,
        productId,
        createdAt: serverTimestamp()
      });
      return { action: 'added', success: true };
    }
  } catch (error) {
    console.error("Error toggling wishlist: ", error);
    return { success: false, error };
  }
};

export const getWishlist = async (userId) => {
  try {
    const q = query(collection(db, 'wishlist'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data().productId);
  } catch (error) {
    console.error("Error fetching wishlist: ", error);
    return [];
  }
};

export const removeFromWishlist = async (userId, productId) => {
  try {
    const q = query(
      collection(db, 'wishlist'),
      where('userId', '==', userId),
      where('productId', '==', productId)
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error removing from wishlist: ", error);
    return { success: false, error };
  }
};

export const addProductReview = async (productId, reviewData) => {
  try {
    const reviewRef = collection(db, 'products', productId, 'reviews');
    await addDoc(reviewRef, {
      ...reviewData,
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding review: ", error);
    return { success: false, error };
  }
};

export const getProductReviews = async (productId) => {
  try {
    const reviewRef = collection(db, 'products', productId, 'reviews');
    const q = query(reviewRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching reviews: ", error);
    return [];
  }
};

export const updateUserProfile = async (userId, data) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, data, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error updating profile: ", error);
    return { success: false, error };
  }
};

export const addUserAddress = async (userId, addressData) => {
  try {
    const addressesRef = collection(db, 'users', userId, 'addresses');
    const docRef = await addDoc(addressesRef, {
      ...addressData,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error("Error adding address: ", error);
    return { success: false, error };
  }
};

export const getUserAddresses = async (userId) => {
  try {
    const addressesRef = collection(db, 'users', userId, 'addresses');
    const q = query(addressesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching addresses: ", error);
    return [];
  }
};

export const updateUserAddress = async (userId, addressId, data) => {
  try {
    const addressRef = doc(db, 'users', userId, 'addresses', addressId);
    await setDoc(addressRef, data, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error updating address: ", error);
    return { success: false, error };
  }
};

export const deleteUserAddress = async (userId, addressId) => {
  try {
    const addressRef = doc(db, 'users', userId, 'addresses', addressId);
    await deleteDoc(addressRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting address: ", error);
    return { success: false, error };
  }
};

export const getCoupon = async (code) => {
  try {
    const q = query(collection(db, 'coupons'), where('code', '==', code.toUpperCase()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching coupon: ", error);
    return null;
  }
};

// Strip any path separators or non-printable chars from a user-supplied
// filename before using it in a Storage object path.
const sanitizeFilename = (name) => {
  const base = String(name || 'upload').split(/[\\/]/).pop();
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
  return safe.slice(0, 100) || 'upload';
};

export const uploadPrescription = async (file, userId) => {
  if (!userId) {
    return { success: false, error: new Error("Sign in is required to upload a prescription.") };
  }
  try {
    const safeName = sanitizeFilename(file?.name);
    // userId is the raw Firebase UID so the `prescriptions/{uid}/...` Storage
    // rule can match request.auth.uid exactly. Do NOT sanitize the uid.
    const fileRef = ref(storage, `prescriptions/${userId}/${Date.now()}_${safeName}`);
    const snapshot = await uploadBytes(fileRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return { url, success: true };
  } catch (error) {
    console.error("Error uploading prescription: ", error);
    return { success: false, error };
  }
};
