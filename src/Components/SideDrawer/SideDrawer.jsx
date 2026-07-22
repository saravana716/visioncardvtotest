import React, { useEffect, useState } from 'react';
import { IoCloseOutline, IoCartOutline, IoTimeOutline, IoHeartOutline, IoTrashOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getProductById } from '../../services/firestoreService';
import './SideDrawer.css';

const SideDrawer = ({ isOpen, onClose, initialTab = 'cart' }) => {
    const { cartItems, cartCount, removeItemFromCart } = useCart();
    const { wishlistItems, cleanupStaleIds, toggleWishlist } = useWishlist();
    const [recentProducts, setRecentProducts] = useState([]);
    const [wishlistProducts, setWishlistProducts] = useState([]);
    const [activeTab, setActiveTab] = useState(initialTab); // 'cart', 'recent', 'wishlist'
    const navigate = useNavigate();

    useEffect(() => {
        const appContainer = document.querySelector('.App');
        if (isOpen) {
            setActiveTab(initialTab);
            fetchRecentProducts();
            fetchWishlistProducts();
            
            // Save current scroll position
            const scrollY = window.scrollY;
            document.body.dataset.scrollY = scrollY;
            document.body.style.top = `-${scrollY}px`;
            
            document.documentElement.classList.add('no-scroll');
            document.body.classList.add('no-scroll');
            if (appContainer) appContainer.classList.add('no-scroll');
        } else {
            // Restore scroll position
            const scrollY = document.body.dataset.scrollY;
            
            document.documentElement.classList.remove('no-scroll');
            document.body.classList.remove('no-scroll');
            if (appContainer) appContainer.classList.remove('no-scroll');
            
            document.body.style.top = '';
            delete document.body.dataset.scrollY;
            
            window.scrollTo(0, parseInt(scrollY || '0'));
        }
        return () => {
            document.documentElement.classList.remove('no-scroll');
            document.body.classList.remove('no-scroll');
            if (appContainer) appContainer.classList.remove('no-scroll');
            document.body.style.top = '';
        };
    }, [isOpen]);

    const fetchRecentProducts = async () => {
        const viewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        if (viewedIds.length > 0) {
            const products = await Promise.all(
                viewedIds.slice(0, 4).map(id => getProductById(id))
            );
            setRecentProducts(products.filter(p => p !== null));
        }
    };

    const fetchWishlistProducts = async () => {
        if (wishlistItems && wishlistItems.length > 0) {
            const results = await Promise.all(
                wishlistItems.map(id => getProductById(id).then(p => ({ id, product: p })))
            );
            const valid = results.filter(r => r.product !== null).map(r => r.product);
            const staleIds = results.filter(r => r.product === null).map(r => r.id);
            setWishlistProducts(valid);
            // Auto-cleanup stale IDs silently so count stays in sync
            if (staleIds.length > 0) {
                cleanupStaleIds(staleIds);
            }
        } else {
            setWishlistProducts([]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`side-drawer-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
            <div className={`side-drawer-content ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="drawer-header">
                    <div className="drawer-tabs">
                        <button 
                            className={`tab-btn ${activeTab === 'cart' ? 'active' : ''}`}
                            onClick={() => setActiveTab('cart')}
                        >
                            <IoCartOutline /> Cart ({cartCount})
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
                            onClick={() => setActiveTab('wishlist')}
                        >
                            <IoHeartOutline /> Wishlist ({wishlistItems.length})
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
                            onClick={() => setActiveTab('recent')}
                        >
                            <IoTimeOutline /> Recent
                        </button>
                    </div>
                    <button className="drawer-close-btn" onClick={onClose}>
                        <IoCloseOutline />
                    </button>
                </div>

                <div className="drawer-body">
                    {activeTab === 'cart' && (
                        <div className="drawer-section fade-in">
                            {cartItems.length === 0 ? (
                                <div className="empty-state">
                                    <IoCartOutline className="empty-icon" />
                                    <p>Your cart is empty</p>
                                    <button className="shop-btn" onClick={() => { navigate('/products'); onClose(); }}>Shop Now</button>
                                </div>
                            ) : (
                                <div className="drawer-list">
                                    {cartItems.map((item, idx) => (
                                        <div key={idx} className="drawer-item" onClick={() => { navigate(`/product/${item.productId}`); onClose(); }}>
                                            <div className="item-img">
                                                <img src={item.productImage} alt={item.productName} loading="lazy" decoding="async" />
                                            </div>
                                            <div className="item-info">
                                                <h4>{item.productName}</h4>
                                                <p>{item.totalPrice}{(Number(item.quantity) || 1) > 1 ? ` × ${Number(item.quantity)}` : ''}</p>
                                            </div>
                                            <button 
                                                className="remove-item-btn" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeItemFromCart(item.id);
                                                }}
                                            >
                                                <IoTrashOutline />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="drawer-footer">
                                        <button className="checkout-btn" onClick={() => { navigate('/cart'); onClose(); }}>Checkout Now</button>
                                        <button className="continue-btn" onClick={onClose}>Continue Shopping</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'wishlist' && (
                        <div className="drawer-section fade-in">
                            {wishlistProducts.length === 0 ? (
                                <div className="empty-state">
                                    <IoHeartOutline className="empty-icon" />
                                    <p>Your wishlist is empty</p>
                                    <button className="shop-btn" onClick={() => { navigate('/products'); onClose(); }}>Browse Products</button>
                                </div>
                            ) : (
                                <div className="drawer-list">
                                    {wishlistProducts.map((p) => (
                                        <div key={p.id} className="drawer-item" onClick={() => { navigate(`/product/${p.id}`); onClose(); }}>
                                            <div className="item-img">
                                                <img src={p.photos?.[0] || p.mainImage} alt={p.name} loading="lazy" decoding="async" />
                                            </div>
                                            <div className="item-info">
                                                <h4>{p.name || p.brand}</h4>
                                                <p>₹{p.price}</p>
                                            </div>
                                            <button 
                                                className="remove-item-btn" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleWishlist(p.id);
                                                    fetchWishlistProducts(); // Refresh local list after toggling
                                                }}
                                            >
                                                <IoTrashOutline />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="drawer-footer">
                                        <button className="checkout-btn" onClick={() => { navigate('/wishlist'); onClose(); }}>View All Wishlist</button>
                                        <button className="continue-btn" onClick={onClose}>Continue Shopping</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'recent' && (
                        <div className="drawer-section fade-in">
                            {recentProducts.length === 0 ? (
                                <div className="empty-state">
                                    <IoTimeOutline className="empty-icon" />
                                    <p>No recently viewed items</p>
                                    <button className="shop-btn" onClick={() => { navigate('/products'); onClose(); }}>Browse Products</button>
                                </div>
                            ) : (
                                <div className="drawer-list">
                                    {recentProducts.map((p) => (
                                        <div key={p.id} className="drawer-item" onClick={() => { navigate(`/product/${p.id}`); onClose(); }}>
                                            <div className="item-img">
                                                <img src={p.photos?.[0] || p.mainImage} alt={p.name} loading="lazy" decoding="async" />
                                            </div>
                                            <div className="item-info">
                                                <h4>{p.name || p.brand}</h4>
                                                <p>₹{p.price}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="drawer-footer">
                                        <button className="continue-btn" onClick={onClose}>Continue Shopping</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SideDrawer;
