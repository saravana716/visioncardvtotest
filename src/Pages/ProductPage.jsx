import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../Components/Navbar/Navbar';
import OurBrands from '../Components/Ourbrands/OurBrands';
import Footers from '../Components/Footer/Footers';
import PropCard from '../Components/PropCard/PropCard';
import { getProducts, getCategoryByName, getCategoryDiscounts, getCategoryFilters, applyCategoryDiscounts } from '../services/firestoreService';
import { IoIosSearch } from "react-icons/io";
import rateimg from '../assets/star.png';
import colorimg from '../assets/color.png';
import Loader from '../Components/Loader/Loader';
import './ProductPage.css';

import bannerSpectacles from '../assets/categoryimage/1.png';
import bannerSunglasses from '../assets/categoryimage/2.png';
import bannerReading from '../assets/categoryimage/3.png';
import bannerComputer from '../assets/categoryimage/4.png';
import bannerKids from '../assets/categoryimage/5.png';
import bannerContact from '../assets/categoryimage/6.png';
import productBanner from '../assets/productbanner.png';
import { PLACEHOLDER_IMG } from '../utils/placeholderImage';

const categoryImages = {
    'Spectacles': bannerComputer,
    'Sunglasses': bannerSunglasses,
    'Reading Glasses': bannerSpectacles,
    'Computer Glasses': bannerContact,
    'Kids Collection': bannerKids,
    'Kids Collections': bannerKids,
    'Contact Lenses': bannerReading
};

const ProductPage = () => {
    const [searchParams] = useSearchParams();
    const category = searchParams.get('category');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showSortModal, setShowSortModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('latest');
    const [openFilters, setOpenFilters] = useState({
        gender: true,
        frameStyle: true,
        frameShape: true,
        frameMaterial: true,
        frameColor: true,
        frameSize: true,
        lensType: true,
        brand: true,
        priceRange: true
    });

    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categoryConfig, setCategoryConfig] = useState(null);
    const [selectedFilters, setSelectedFilters] = useState({
        gender: [],
        frameStyle: [],
        frameShape: [],
        lensType: [],
        frameMaterial: [],
        frameColor: [],
        frameSize: [],
        brand: [],
        priceRange: []
    });
    const [dynamicFilters, setDynamicFilters] = useState(null);

    const navigate = useNavigate();

    // Sync URL params to State on load/change
    useEffect(() => {
        const getParams = (key) => {
            const all = searchParams.getAll(key);
            const single = searchParams.get(key);
            if (all.length > 0) return all;
            if (single) return [single];
            return [];
        };

        setSelectedFilters({
            gender: getParams('gender'),
            frameStyle: getParams('frameStyle'),
            frameShape: getParams('frameShape'),
            lensType: getParams('lensType'),
            frameMaterial: getParams('frameMaterial'),
            frameColor: getParams('frameColor'),
            frameSize: getParams('frameSize'),
            brand: getParams('brand'),
            priceRange: getParams('priceRange')
        });

        const sortParam = searchParams.get('sort');
        if (sortParam) setSortBy(sortParam);
    }, [searchParams]);

    useEffect(() => {
        const fetchCategoryData = async () => {
            const [config, filters] = await Promise.all([
                category ? getCategoryByName(category) : Promise.resolve(null),
                getCategoryFilters(category)
            ]);
            setCategoryConfig(config);
            setDynamicFilters(filters);
        };
        fetchCategoryData();
    }, [category]);

    useEffect(() => {
        const fetchProductsData = async () => {
            setLoading(true);
            const activeFilters = {};
            Object.keys(selectedFilters).forEach(key => {
                if (selectedFilters[key].length > 0) {
                    activeFilters[key] = selectedFilters[key];
                }
            });
            const sub = searchParams.get('subcategory');
            if (sub) activeFilters.subcategory = sub;

            const [data, categoryDiscounts] = await Promise.all([
                getProducts(category, activeFilters, sortBy),
                getCategoryDiscounts()
            ]);

            let mappedData = applyCategoryDiscounts(data, categoryDiscounts);

            // Text search from the navbar / search overlay lands here as ?search=…
            // Filter client-side by name/brand/category so results are actually
            // narrowed — previously the param was ignored and the full catalog
            // was shown for every search.
            const searchTerm = (searchParams.get('search') || '').trim().toLowerCase();
            if (searchTerm) {
                mappedData = mappedData.filter((p) =>
                    (p.name || '').toLowerCase().includes(searchTerm) ||
                    (p.model || '').toLowerCase().includes(searchTerm) ||
                    (p.title || '').toLowerCase().includes(searchTerm) ||
                    (p.brand || '').toLowerCase().includes(searchTerm) ||
                    (p.category || '').toLowerCase().includes(searchTerm)
                );
            }

            setFilteredProducts(mappedData);
            setTimeout(() => setLoading(false), 500);
            window.scrollTo(0, 0);
        };
        fetchProductsData();
    }, [category, selectedFilters, searchParams, sortBy]);

    const handleFilterChange = (type, value) => {
        const newParams = new URLSearchParams(searchParams);
        const currentVals = newParams.getAll(type);
        if (currentVals.includes(value)) {
            const updated = currentVals.filter(v => v !== value);
            newParams.delete(type);
            updated.forEach(v => newParams.append(type, v));
        } else {
            newParams.append(type, value);
        }
        navigate(`/products?${newParams.toString()}`);
    };

    const resetFilters = () => {
        navigate(`/products?category=${category || ''}`);
    };

    const handleSortChange = (val) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('sort', val);
        navigate(`/products?${newParams.toString()}`);
        setShowSortModal(false);
    };

    const toggleFilter = (filter) => {
        setOpenFilters({ ...openFilters, [filter]: !openFilters[filter] });
    };

    const currentFilters = {
        gender: dynamicFilters?.gender || categoryConfig?.gender || [],
        style: dynamicFilters?.frameType || categoryConfig?.style || categoryConfig?.frameType || [],
        shape: dynamicFilters?.frameShape || categoryConfig?.shape || categoryConfig?.frameShape || [],
        lensType: dynamicFilters?.lensType || categoryConfig?.lensType || [],
        material: dynamicFilters?.frameMaterial || categoryConfig?.material || categoryConfig?.frameMaterial || [],
        color: dynamicFilters?.frameColor || categoryConfig?.color || [],
        size: dynamicFilters?.frameSize || categoryConfig?.size || [],
        brand: dynamicFilters?.brand || []
    };

    const cardlist = filteredProducts.map(p => {
        return {
            id: p.id,
            brand: p.brand,
            title: p.name || p.model || p.brand,
            price: p.displayPrice,
            // Strikethrough MRP only when there is an actual discount.
            mrpprice: p.discountLabel ? p.originalPrice : null,
            discount: p.discountLabel,
            img: (p.photos && p.photos.length > 0) ? p.photos[0] : (p.mainImage || PLACEHOLDER_IMG),
            hoverImg: (p.photos && p.photos.length > 1) ? p.photos[1] : null,
            rating: rateimg,
            color: colorimg,
            ratingcount: p.ratingCount || "0",
            colorcount: p.colors ? p.colors.length : "1"
        };
    });

    const displayCategory = category || "All Products";
    const bannerInfo = category === "Sunglasses" ? {
        title: "Stay Protected in Style",
        subtitle: "with Premium Sunglasses",
        desc: "High-quality polarized lenses for ultimate clarity and UV protection."
    } : category === "Computer Glasses" ? {
        title: "Digital Comfort for",
        subtitle: "Screen Heavy Days",
        desc: "Advanced blue cut lenses to reduce digital eye strain and fatigue."
    } : (category === "Kids Collection" || category === "Kids Collections") ? {
        title: "Fun & Durable",
        subtitle: "Eyewear for Little Ones",
        desc: "Specialized frames designed for children's active lifestyles and comfort."
    } : {
        title: "Finish Spectacles for",
        subtitle: "everyday vision",
        desc: "Comfortable, modern spectacles for clean, all-day vision."
    };

    return (
        <div className="product-page-container">
            <Navbar />
            
            {/* Banner Section */}
            <div className="product-banner-wrapper">
                <img 
                    className="product-banner" 
                    src={categoryImages[category] || categoryConfig?.imageUrl || categoryConfig?.image || categoryConfig?.bannerImage || productBanner}
                    alt={`${category} Banner`}
                />
            </div>

            <div className="product-listing-section">
                <div className="listing-header scroll-reveal">
                    <h3>{displayCategory}</h3>
                    <p>{cardlist.length} results found</p>
                </div>

                <div className="main-content">
                    {/* Filter Overlay for Mobile */}
                    {(showMobileFilters || showSortModal) && (
                        <div className="filter-overlay" onClick={() => { setShowMobileFilters(false); setShowSortModal(false); }}></div>
                    )}
                    
                    {/* Sidebar Filters */}
                    <aside className={`sidebar-filters ${showMobileFilters ? 'show' : ''}`}>
                        <div className="filter-header">
                            <div className="filter-header-top">
                                <h4>Filters</h4>
                                <button className="reset-link" onClick={resetFilters}>Reset</button>
                            </div>
                            <button className="close-mobile-filters" onClick={() => setShowMobileFilters(false)}>✕</button>
                        </div>

                        <div className="filter-scroll-area">
                            {/* Gender Filter */}
                            {currentFilters.gender.length > 0 && (
                                <div className="filter-group">
                                    <div className="filter-title" onClick={() => toggleFilter('gender')}>
                                        <span>Gender</span>
                                        <span className={`arrow ${openFilters.gender ? 'open' : ''}`}>▾</span>
                                    </div>
                                    {openFilters.gender && (
                                        <div className="filter-options">
                                            {currentFilters.gender.map((opt, i) => (
                                                <label key={i}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedFilters.gender.includes(opt)}
                                                        onChange={() => handleFilterChange('gender', opt)}
                                                    /> {opt}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Frame Type Filter */}
                            {currentFilters.style.length > 0 && (
                                <div className="filter-group">
                                    <div className="filter-title" onClick={() => toggleFilter('frameStyle')}>
                                        <span>Frame Type</span>
                                        <span className={`arrow ${openFilters.frameStyle ? 'open' : ''}`}>▾</span>
                                    </div>
                                    {openFilters.frameStyle && (
                                        <div className="filter-options">
                                            {currentFilters.style.map((opt, i) => (
                                                <label key={i}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedFilters.frameStyle.includes(opt)}
                                                        onChange={() => handleFilterChange('frameStyle', opt)}
                                                    /> {opt}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Shape Filter */}
                            {currentFilters.shape.length > 0 && (
                                <div className="filter-group">
                                    <div className="filter-title" onClick={() => toggleFilter('frameShape')}>
                                        <span>Frame Shape</span>
                                        <span className={`arrow ${openFilters.frameShape ? 'open' : ''}`}>▾</span>
                                    </div>
                                    {openFilters.frameShape && (
                                        <div className="filter-options">
                                            {currentFilters.shape.map((opt, i) => (
                                                <label key={i}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedFilters.frameShape.includes(opt)}
                                                        onChange={() => handleFilterChange('frameShape', opt)}
                                                    /> {opt}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Lens Type Filter */}
                            {currentFilters.lensType.length > 0 && (
                                <div className="filter-group">
                                    <div className="filter-title" onClick={() => toggleFilter('lensType')}>
                                        <span>Lens Type</span>
                                        <span className={`arrow ${openFilters.lensType ? 'open' : ''}`}>▾</span>
                                    </div>
                                    {openFilters.lensType && (
                                        <div className="filter-options">
                                            {currentFilters.lensType.map((opt, i) => (
                                                <label key={i}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedFilters.lensType.includes(opt)}
                                                        onChange={() => handleFilterChange('lensType', opt)}
                                                    /> {opt}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Frame Material */}
                            {currentFilters.material.length > 0 && (
                                <div className="filter-group">
                                    <div className="filter-title" onClick={() => toggleFilter('frameMaterial')}>
                                        <span>Frame Material</span>
                                        <span className={`arrow ${openFilters.frameMaterial ? 'open' : ''}`}>▾</span>
                                    </div>
                                    {openFilters.frameMaterial && (
                                        <div className="filter-options">
                                            {currentFilters.material.map((opt, i) => (
                                                <label key={i}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedFilters.frameMaterial.includes(opt)}
                                                        onChange={() => handleFilterChange('frameMaterial', opt)}
                                                    /> {opt}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}



                            {/* Frame Size */}
                            {currentFilters.size.length > 0 && (
                                <div className="filter-group">
                                    <div className="filter-title" onClick={() => toggleFilter('frameSize')}>
                                        <span>Frame Size</span>
                                        <span className={`arrow ${openFilters.frameSize ? 'open' : ''}`}>▾</span>
                                    </div>
                                    {openFilters.frameSize && (
                                        <div className="filter-options">
                                            {currentFilters.size.map((opt, i) => (
                                                <label key={i}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedFilters.frameSize.includes(opt)}
                                                        onChange={() => handleFilterChange('frameSize', opt)}
                                                    /> {opt}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Brand Filter */}
                            {currentFilters.brand.length > 0 && (
                                <div className="filter-group">
                                    <div className="filter-title" onClick={() => toggleFilter('brand')}>
                                        <span>Brand</span>
                                        <span className={`arrow ${openFilters.brand ? 'open' : ''}`}>▾</span>
                                    </div>
                                    {openFilters.brand && (
                                        <div className="filter-options">
                                            {currentFilters.brand.map((opt, i) => (
                                                <label key={i}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedFilters.brand.includes(opt)}
                                                        onChange={() => handleFilterChange('brand', opt)}
                                                    /> {opt}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Frame Color Filter */}
                            {currentFilters.color.length > 0 && (
                                <div className="filter-group">
                                    <div className="filter-title" onClick={() => toggleFilter('frameColor')}>
                                        <span>Frame Color</span>
                                        <span className={`arrow ${openFilters.frameColor ? 'open' : ''}`}>▾</span>
                                    </div>
                                    {openFilters.frameColor && (
                                        <div className="filter-options">
                                            {currentFilters.color.map((opt, i) => (
                                                <label key={i}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedFilters.frameColor.includes(opt)}
                                                        onChange={() => handleFilterChange('frameColor', opt)}
                                                    /> {opt}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Price Range */}
                            {/* <div className="filter-group">
                                <div className="filter-title" onClick={() => toggleFilter('priceRange')}>
                                    <span>Price Range</span>
                                    <span className={`arrow ${openFilters.priceRange ? 'open' : ''}`}>▾</span>
                                </div>
                                {openFilters.priceRange && (
                                    <div className="filter-options">
                                        {[
                                            { label: 'Under ₹500', val: 'under500' },
                                            { label: '₹500 - ₹1000', val: '500-1000' },
                                            { label: '₹1000 - ₹2000', val: '1000-2000' },
                                            { label: 'Over ₹2000', val: 'over2000' }
                                        ].map((range, i) => (
                                            <label key={i}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedFilters.priceRange.includes(range.val)}
                                                    onChange={() => handleFilterChange('priceRange', range.val)}
                                                /> {range.label}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div> */}
                        </div>

                        {/* Desktop Sidebar Footer */}
                        <div className="sidebar-footer-desktop">
                            <button className="reset-btn-desktop" onClick={resetFilters}>Reset</button>
                            <button className="apply-btn-desktop" onClick={() => window.scrollTo(0, 0)}>Apply Filters</button>
                        </div>

                        {/* <div className="filter-footer-mobile">
                            <button className="reset-mobile-btn">Reset</button>
                            <button className="apply-mobile-btn" onClick={() => setShowMobileFilters(false)}>Apply</button>
                        </div> */}
                    </aside>

                    {/* Sort Modal for Mobile */}
                    <div className={`sort-modal-mobile ${showSortModal ? 'show' : ''}`}>
                        <div className="sort-modal-header">
                            <h4>Sort By Options</h4>
                            <button className="close-sort-modal" onClick={() => setShowSortModal(false)}>✕</button>
                        </div>
                        <div className="sort-options-list">
                            <label><input type="radio" name="sort" checked={sortBy === 'latest'} onChange={() => handleSortChange('latest')} /> Popularity</label>
                            <label><input type="radio" name="sort" checked={sortBy === 'new'} onChange={() => handleSortChange('new')} /> New Arrivals</label>
                            <label><input type="radio" name="sort" checked={sortBy === 'highToLow'} onChange={() => handleSortChange('highToLow')} /> Price: High to Low</label>
                            <label><input type="radio" name="sort" checked={sortBy === 'lowToHigh'} onChange={() => handleSortChange('lowToHigh')} /> Price: Low to High</label>
                            <label><input type="radio" name="sort" checked={sortBy === 'rating'} onChange={() => handleSortChange('rating')} /> Customer Ratings</label>
                        </div>
                        <div className="sort-modal-footer">
                            <button className="sort-cancel-btn" onClick={() => setShowSortModal(false)}>Cancel</button>
                            <button className="sort-apply-btn" onClick={() => setShowSortModal(false)}>Apply</button>
                        </div>
                    </div>

                    {/* Product Grid Area */}
                    <div className="product-grid-area">
                        <div className="grid-controls">
                            <div className="mobile-controls">
                                <button className="mobile-sort-toggle" onClick={() => setShowSortModal(true)}>
                                    Sort ▾
                                </button>
                                <button className="mobile-filter-toggle" onClick={() => setShowMobileFilters(true)}>
                                    Filter ▾
                                </button>
                            </div>
                            <select 
                                className="sort-dropdown-desktop" 
                                value={sortBy} 
                                onChange={(e) => handleSortChange(e.target.value)}
                            >
                                <option value="latest">Sorting: Latest</option>
                                <option value="lowToHigh">Price: Low to High</option>
                                <option value="highToLow">Price: High to Low</option>
                            </select>
                        </div>
                        <div className="product-grid">
                            {loading ? (
                                <Loader />
                            ) : cardlist.length > 0 ? (
                                <PropCard cardlist={cardlist} />
                            ) : (
                                <div className="no-products-found">
                                    <div className="no-products-content">
                                        <div className="no-products-icon">
                                            <IoIosSearch size={60} />
                                        </div>
                                        <h3>No products found</h3>
                                        <p>We couldn't find any products matching your current filters. Try adjusting them or clearing all filters to see more results.</p>
                                        <button className="clear-all-btn" onClick={() => navigate(`/products?category=${category || ''}`)}>
                                            Clear All Filters
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <OurBrands />
            <Footers />
        </div>
    );
};

export default ProductPage;
