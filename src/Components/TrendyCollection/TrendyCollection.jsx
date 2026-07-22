import { useState, useEffect } from 'react'
import "./TrendyCollection.css"
import PropCard from '../PropCard/PropCard'
import rateimg from "../../assets/star.png"
import colorimg from "../../assets/color.png"
import { getTrendyProducts, getCategoryDiscounts, applyCategoryDiscounts } from '../../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../Skeleton/Skeleton';

const TrendyCollection = ({ title = "Premium Optical Frames", categoryName = null }) => {
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTrending = async () => {
            const [products, discounts] = await Promise.all([
                getTrendyProducts(categoryName),
                getCategoryDiscounts()
            ]);
            
            const discountedProducts = applyCategoryDiscounts(products, discounts);
            setTrendingProducts(discountedProducts.slice(0, 10));
            setLoading(false);
        };
        fetchTrending();
    }, [categoryName]);

    const cardlist = trendingProducts.map(p => ({
        id: p.id,
        brand: p.brand || "Visionkart",
        title: p.name || p.title || p.productName || p.brand || "Visionkart",
        price: p.displayPrice,
        // Strikethrough MRP only when there is an actual discount — otherwise
        // the card shows "₹X ₹X̶" (same value struck through) on full-price items.
        mrpprice: p.discountLabel ? p.originalPrice : null,
        discount: p.discountLabel,
        img: p.photos ? p.photos[0] : (p.mainImage || ''),
        hoverImg: (p.photos && p.photos.length > 1) ? p.photos[1] : null,
        rating: rateimg,
        color: colorimg,
        ratingcount: p.ratingCount || "0",
        colorcount: p.colors ? p.colors.length : "1"
    }));

    const handleShopNow = () => {
        if (categoryName) {
            navigate(`/products?category=${categoryName}`);
        } else {
            navigate('/products');
        }
    };

    if (loading) {
        return (
            <div className="trendy-collection-section">
                <div className="section-title-wrapper">
                    <h2 className="premium-title">{title}</h2>
                </div>
                <div className="products-grid">
                    {[1, 2, 3, 4].map(idx => <Skeleton key={idx} type="product" />)}
                </div>
            </div>
        );
    }

    return (
        <div className='trendymain'>
            <div className='trendymaintitle'>
                <h2>{title}</h2>
                <span 
                    className="shop-now-link"
                    onClick={handleShopNow}
                >
                    Shop Now
                </span>
            </div>

            {trendingProducts.length > 0 ? (
                <div className='trendy'>
                    <PropCard cardlist={cardlist}/>
                </div>
            ) : (
                <div style={{textAlign: 'center', padding: '30px', color: '#666'}}>
                    No products found in this category.
                </div>
            )}
        </div>
    );
};

export default TrendyCollection