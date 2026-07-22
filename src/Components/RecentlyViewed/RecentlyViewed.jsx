import React, { useState, useEffect } from 'react';
import { getProductById, getCategoryDiscounts, applyCategoryDiscounts } from '../../services/firestoreService';
import PropCard from '../PropCard/PropCard';
import Skeleton from '../Skeleton/Skeleton';
import rateimg from "../../assets/star.png";
import colorimg from "../../assets/color.png";
import './RecentlyViewed.css';

const RecentlyViewed = ({ excludeId }) => {
    const [viewedProducts, setViewedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchViewedProducts = async () => {
            setLoading(true);
            try {
                const viewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                const filteredIds = viewedIds.filter(id => id !== excludeId);
                
                if (filteredIds.length === 0) {
                    setViewedProducts([]);
                    setLoading(false);
                    return;
                }

                const productsToFetch = filteredIds.slice(0, 4);
                const productPromises = productsToFetch.map(id => getProductById(id));
                const [fetchedProducts, discounts] = await Promise.all([
                    Promise.all(productPromises),
                    getCategoryDiscounts()
                ]);

                const validProducts = fetchedProducts.filter(p => p !== null && p !== undefined);
                const discountedProducts = applyCategoryDiscounts(validProducts, discounts);
                
                // Sort them back into the original order
                const mappedProducts = discountedProducts
                    .sort((a, b) => productsToFetch.indexOf(a.id) - productsToFetch.indexOf(b.id));
                
                setViewedProducts(mappedProducts.map(p => ({
                    id: p.id,
                    brand: p.brand || "Visionkart",
                    img: p.photos ? p.photos[0] : (p.mainImage || ''),
                    hoverImg: (p.photos && p.photos.length > 1) ? p.photos[1] : null,
                    title: p.name || p.title || p.productName || p.brand || "Visionkart",
                    price: p.displayPrice,
                    // Strikethrough MRP only when there is an actual discount.
                    mrpprice: p.discountLabel ? p.originalPrice : null,
                    discount: p.discountLabel,
                    ratingcount: p.ratingCount || "0",
                    rating: rateimg,
                    color: colorimg,
                    colorcount: p.colors ? p.colors.length : "1"
                })));
            } catch (error) {
                console.error("Error fetching recently viewed products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchViewedProducts();
    }, [excludeId]);

    if (viewedProducts.length === 0 && !loading) return null;

    if (loading) {
        return (
            <div className="recently-viewed-section">
                <div className="section-title-wrapper">
                    <h2 className="premium-title">Recently Viewed</h2>
                </div>
                <div className="products-grid">
                    {[1, 2, 3, 4].map(idx => <Skeleton key={idx} type="product" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="recently-viewed-section fade-in">
            <div className="section-header">
                <h2>Recently Viewed</h2>
            </div>
            <div className="products-grid-viewed">
                <PropCard cardlist={viewedProducts} />
            </div>
        </div>
    );
};

export default RecentlyViewed;
