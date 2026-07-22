import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth } from '../firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import { getWishlist, toggleWishlist as toggleWishlistService, removeFromWishlist as removeFromWishlistService } from '../services/firestoreService';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [user, setUser] = useState(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!isMounted.current) return;
            setUser(currentUser);
            if (currentUser) {
                const items = await getWishlist(currentUser.uid);
                if (!isMounted.current) return;
                setWishlistItems(items);
            } else {
                setWishlistItems([]);
            }
        });
        return () => {
            isMounted.current = false;
            unsubscribe();
        };
    }, []);

    const toggleWishlist = async (productId) => {
        if (!user) {
            toast.error("Please login to add favorites");
            return;
        }

        const result = await toggleWishlistService(user.uid, productId);
        if (result.success) {
            if (result.action === 'added') {
                setWishlistItems(prev => [...prev, productId]);
                toast.success("Added to Wishlist", {
                    icon: '❤️',
                    style: { borderRadius: '10px', background: '#333', color: '#fff' }
                });
            } else {
                setWishlistItems(prev => prev.filter(id => id !== productId));
                toast.success("Removed from Wishlist");
            }
        }
    };

    // Remove stale IDs (products deleted from DB) from wishlist. Returns the
    // count of successful / failed Firestore removals so callers can decide
    // whether to surface a follow-up sync.
    const cleanupStaleIds = async (staleIds) => {
        if (!user || !staleIds || staleIds.length === 0) {
            return { succeeded: 0, failed: 0 };
        }
        setWishlistItems(prev => prev.filter(id => !staleIds.includes(id)));
        let succeeded = 0;
        let failed = 0;
        for (const id of staleIds) {
            try {
                const res = await removeFromWishlistService(user.uid, id);
                if (res?.success === false) {
                    console.error("Wishlist cleanup failed for", id, res?.error);
                    failed += 1;
                } else {
                    succeeded += 1;
                }
            } catch (e) {
                console.error("Wishlist cleanup failed for", id, e);
                failed += 1;
            }
        }
        return { succeeded, failed };
    };

    const isInWishlist = (productId) => wishlistItems.includes(productId);

    return (
        <WishlistContext.Provider value={{ wishlistItems, user, toggleWishlist, isInWishlist, cleanupStaleIds }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => useContext(WishlistContext);
