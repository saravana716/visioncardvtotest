import React from 'react';
import './MegaMenu.css';
import brandPlaceholder from '../../assets/brand.png';
import frame1 from '../../assets/Frames/1.png';
import frame2 from '../../assets/Frames/2.png';
import frame3 from '../../assets/Frames/3.png';
import frame4 from '../../assets/Frames/4.png';
import frame5 from '../../assets/Frames/5.png';
import { useNavigate } from 'react-router-dom';

import contactBrand from '../../assets/brands/contact.jpeg';

const MegaMenu = ({ category: categoryObj, onClose }) => {
    const navigate = useNavigate();
    const categoryName = categoryObj?.name || '';

    if (!categoryName) return null;

    // Helper to format camelCase keys to Readable Titles (e.g., lensType -> Lens Type)
    const formatTitle = (key) => {
        const result = key.replace(/([A-Z])/g, " $1");
        return result.charAt(0).toUpperCase() + result.slice(1).trim();
    };

    // FORCED DYNAMIC: Identify all array fields in the category document
    const dynamicColumns = {};
    const keysToIgnore = ['id', 'name', 'photos', 'thumbnails', 'brands', 'subcategories', 'createdAt', 'image', 'icon', 'description', 'imageUrl', 'bannerImage', 'brand', 'frameShape', 'frameMaterial', 'shape', 'material'];

    // 1. Check if the category object has any arrays (including aggregated ones from products)
    Object.keys(categoryObj || {}).forEach(key => {
        if (!keysToIgnore.includes(key) && Array.isArray(categoryObj[key]) && categoryObj[key].length > 0) {
            dynamicColumns[key] = categoryObj[key];
        }
    });

    const handleItemClick = (type, value) => {
        let paramName = type;
        if (paramName === 'style') paramName = 'frameStyle';
        if (paramName === 'shape') paramName = 'frameShape';
        if (paramName === 'lensType') paramName = 'lensType';
        if (paramName === 'frameType') paramName = 'frameStyle';
        if (paramName === 'brand') paramName = 'brand';
        
        navigate(`/products?category=${categoryName}&${paramName}=${value}`);
        onClose();
    };

    const isContactLenses = categoryName === 'Contact Lenses';

    return (
        <div className="mega-menu" onMouseLeave={onClose}>
            <div className="mega-menu-content">
                {/* Column: Dynamic Subcategories (if exists) */}
                {categoryObj?.subcategories && categoryObj.subcategories.length > 0 && (
                    <div className="menu-column">
                        <h3>Explore</h3>
                        <ul>
                            {categoryObj.subcategories.map((item, index) => (
                                <li key={index} onClick={() => handleItemClick('subcategory', item.name || item)}>{item.name || item}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* DYNAMIC COLUMNS: Automatically render any array from Inventory or DB */}
                {Object.keys(dynamicColumns).map((key) => {
                    // Skip brand if it's the special brand grid, or render as list
                    if (key === 'brand' && !isContactLenses) {
                        return (
                            <div className="menu-column" key={key}>
                                <h3>Shop By Brand</h3>
                                <ul>
                                    {dynamicColumns[key].map((item, index) => (
                                        <li key={index} onClick={() => handleItemClick('brand', item)}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        );
                    }

                    return (
                        <div className="menu-column" key={key}>
                            <h3>{formatTitle(key)}</h3>
                            <ul>
                                {dynamicColumns[key].map((item, index) => (
                                    <li key={index} onClick={() => handleItemClick(key, item)}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    );
                })}

                {/* Special Case: Contact Lens Brands Grid */}
                {isContactLenses && categoryObj?.brands && (
                    <div className="menu-column brand-column">
                        <h3>Our Brands</h3>
                        <div className="brand-grid">
                            {categoryObj.brands.map((brandImg, index) => (
                                <div key={index} className="brand-item" style={{width: '200px', height: '100px'}}>
                                    <img src={brandImg} alt="Brand" loading="lazy" decoding="async" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Trending Styles Showcase */}
                {!isContactLenses && (
                    <div className="menu-column promo-column">
                        <h3 style={{marginBottom: '15px'}}>Trending Styles</h3>
                        <div className="frames-dropdown-grid">
                            {[frame1, frame2, frame3, frame4, frame5, frame1].map((img, i) => (
                                <div key={i} className="frame-dropdown-item" onClick={() => { navigate(`/products?category=${categoryName}`); onClose(); }}>
                                    <img src={img} alt={`Frame ${i + 1}`} loading="lazy" decoding="async" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MegaMenu;
