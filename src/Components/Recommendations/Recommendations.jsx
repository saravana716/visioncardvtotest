import React, { useState, useEffect } from 'react';
import { getProducts, getCategoryDiscounts, applyCategoryDiscounts } from '../../services/firestoreService';
import PropCard from '../PropCard/PropCard';
import Skeleton from '../Skeleton/Skeleton';
import rateimg from "../../assets/star.png";
import colorimg from "../../assets/color.png";
import './Recommendations.css';

const Recommendations = ({ category, currentProductId }) => {
    const [recommended, setRecommended] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            try {
                // Fetch products in the same category, then apply category
                // discounts so cards show (and add to cart at) the same
                // discounted price as the product page — not the raw base price.
                const [productsInCategory, categoryDiscounts] = await Promise.all([
                    getProducts(category),
                    getCategoryDiscounts(),
                ]);
                const priced = applyCategoryDiscounts(productsInCategory, categoryDiscounts);

                const filtered = priced
                    .filter(p => p.id !== currentProductId)
                    .sort(() => 0.5 - Math.random()) // Shuffle for variety
                    .slice(0, 4);
                
                setRecommended(filtered.map(p => ({
                    id: p.id,
                    img: p.photos ? p.photos[0] : (p.mainImage || ''),
                    hoverImg: (p.photos && p.photos.length > 1) ? p.photos[1] : null,
                    title: p.name || p.title || p.productName || p.brand || "Visionkart",

                    price: p.displayPrice,
                    mrpprice: p.discountLabel ? p.originalPrice : null,
                    discount: p.discountLabel,
                    ratingcount: p.ratingCount || "0",
                    rating: rateimg,
                    color: colorimg,
                    colorcount: p.colors ? p.colors.length : "1"
                })));
            } catch (error) {
                console.error("Error fetching recommended products:", error);
            } finally {
                setLoading(false);
            }
        };

        if (category) {
            fetchRecommendations();
        }
    }, [category, currentProductId]);

    if (loading) {
        return (
            <div className="recommendations-section">
                <h2 className="section-title">Recommended For You</h2>
                <div className="products-grid">
                    {[1, 2, 3, 4].map(idx => <Skeleton key={idx} type="product" />)}
                </div>
            </div>
        );
    }

    if (recommended.length === 0) return null;

    return (
        <div className="recommendations-section fade-in">
            <div className="section-header">
                <h2>You Might Also Like</h2>
                <div className="section-line"></div>
            </div>
            <div className="products-grid-recommended">
                <PropCard cardlist={recommended} />
            </div>
        </div>
    );
};

export default Recommendations;
