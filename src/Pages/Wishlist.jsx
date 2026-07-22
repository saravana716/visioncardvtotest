import React, { useState, useEffect } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { getProductsByIds, getCategoryDiscounts, applyCategoryDiscounts } from '../services/firestoreService';
import Navbar from '../Components/Navbar/Navbar';
import Footers from '../Components/Footer/Footers';
import PropCard from '../Components/PropCard/PropCard';
import { FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import rateimg from "../assets/star.png";
import colorimg from "../assets/color.png";
import './Wishlist.css';
import Loader from '../Components/Loader/Loader';

const Wishlist = () => {
    const { wishlistItems, user } = useWishlist();
    const [wishlistProducts, setWishlistProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (wishlistItems.length === 0) {
            setWishlistProducts([]);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        Promise.all([getProductsByIds(wishlistItems), getCategoryDiscounts()])
            .then(([items, categoryDiscounts]) => {
                // Apply category discounts so wishlist cards show / add to cart at
                // the discounted price, consistent with the product page.
                if (!cancelled) setWishlistProducts(applyCategoryDiscounts(items, categoryDiscounts));
            })
            .catch(err => {
                console.error("Error fetching wishlist products:", err);
                if (!cancelled) setWishlistProducts([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [wishlistItems]);

    const cardlist = wishlistProducts.map(p => ({
        id: p.id,
        title: p.name || p.title || p.productName || p.brand || "Visionkart",

        price: p.displayPrice,
        mrpprice: p.discountLabel ? p.originalPrice : null,
        discount: p.discountLabel,
        img: p.photos ? p.photos[0] : (p.mainImage || ''),
        hoverImg: (p.photos && p.photos.length > 1) ? p.photos[1] : null,
        rating: rateimg,
        color: colorimg,
        ratingcount: p.ratingCount || "0",
        colorcount: p.colors ? p.colors.length : "1",
        tryOn: p.category === 'Spectacles' || p.category === 'Sunglasses'
    }));

    if (!user) {
        return (
            <div className="wishlist-page">
                <Navbar />
                <div className="wishlist-hero">
                    <h1>Your Favorites</h1>
                </div>
                <div className="wishlist-container">
                    <div className="wishlist-empty fade-in">
                        <div className="empty-heart-box">
                            <FaHeart />
                        </div>
                        <h2>Sign in to view your wishlist</h2>
                        <p>Saved items are tied to your account.</p>
                        <button className="explore-btn" onClick={() => navigate('/login')}>
                            Sign in
                        </button>
                    </div>
                </div>
                <Footers />
            </div>
        );
    }

    return (
        <div className="wishlist-page">
            <Navbar />

            <div className="wishlist-hero">
                <h1>Your Favorites</h1>
                <p>Saved items waiting for you to make them yours</p>
            </div>

            <div className="wishlist-container">
                {loading ? (
                    <Loader />
                ) : wishlistProducts.length === 0 ? (
                    <div className="wishlist-empty fade-in">
                        <div className="empty-heart-box">
                            <FaHeart />
                        </div>
                        <h2>Your wishlist is empty</h2>
                        <p>Seems like you haven't discovered your favorites yet.</p>
                        <button className="explore-btn" onClick={() => navigate('/products')}>
                            Start Exploring Products
                        </button>
                    </div>
                ) : (
                    <div className="wishlist-content">
                        <div className="wishlist-stats">
                            <span>{wishlistProducts.length} items saved</span>
                        </div>
                        <div className="wishlist-grid">
                            <PropCard cardlist={cardlist} />
                        </div>
                    </div>
                )}
            </div>

            <Footers />
        </div>
    );
};

export default Wishlist;
