import React, { useState, useEffect } from 'react';
import './MobileCategories.css';
import { useNavigate } from 'react-router-dom';
import { getCategoryByName } from '../../services/firestoreService';

const SPECTACLES_SUNGLASSES_SECTIONS = [
  {
    title: 'Spectacles',
    categoryName: 'Spectacles',
    items: [
      { name: 'Men', filter: 'gender=Men', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80' },
      { name: 'Women', filter: 'gender=Women', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80' },
      { name: 'Unisex', filter: 'gender=Unisex', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&h=150&fit=crop&q=80' },
      { name: 'Kids', filter: 'gender=Kids', image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=150&h=150&fit=crop&q=80' }
    ]
  },
  {
    title: 'Sunglasses',
    categoryName: 'Sunglasses',
    items: [
      { name: 'Men', filter: 'gender=Men', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=150&h=150&fit=crop&q=80' },
      { name: 'Women', filter: 'gender=Women', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=150&h=150&fit=crop&q=80' },
      { name: 'Unisex', filter: 'gender=Unisex', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80' },
      { name: 'Kids', filter: 'gender=Kids', image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=150&h=150&fit=crop&q=80' }
    ]
  }
];

const MobileCategories = () => {
  const navigate = useNavigate();
  const [contactLensItems, setContactLensItems] = useState([
    { name: 'Color Lens', filter: 'subcategory=Color Lenses', image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=150&h=150&fit=crop&q=80' },
    { name: 'Solution', filter: 'subcategory=Solutions', image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=150&h=150&fit=crop&q=80' },
    { name: 'Accessories', filter: 'subcategory=Accessories', image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=150&h=150&fit=crop&q=80' }
  ]);

  useEffect(() => {
    const fetchImages = async () => {
      const catData = await getCategoryByName('Contact Lenses');
      if (catData && catData.subcategories) {
        setContactLensItems(prev => prev.map(item => {
          const dbSub = catData.subcategories.find(s => {
            const name = (s.name || s).toLowerCase();
            if (item.name === 'Color Lens' && name.includes('color')) return true;
            if (item.name === 'Solution' && name.includes('solution')) return true;
            if (item.name === 'Accessories' && (name.includes('accessories') || name.includes('accessory'))) return true;
            return false;
          });
          return dbSub ? { ...item, image: dbSub.imageUrl || item.image } : item;
        }));
      }
    };
    fetchImages();
  }, []);

  const handleItemClick = (categoryName, filter) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}&${filter}`);
  };

  const handleViewMoreClick = (categoryName) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="mobile-categories">
      {/* 1. Render Spectacles and Sunglasses */}
      {SPECTACLES_SUNGLASSES_SECTIONS.map((section) => (
        <div key={section.title} className="mobile-category-section">
          <div className="mobile-category-section-header">
            <h3 className="section-title">{section.title}</h3>
            <span 
              className="view-more-link" 
              onClick={() => handleViewMoreClick(section.categoryName)}
            >
              View More
            </span>
          </div>
          <div className="mobile-category-items-grid">
            {section.items.map((item) => (
              <div 
                key={item.name} 
                className="mobile-category-item"
                onClick={() => handleItemClick(section.categoryName, item.filter)}
              >
                <div className="mobile-category-item-image-wrapper">
                  <img src={item.image} alt={item.name} className="mobile-category-item-image" />
                </div>
                <span className="mobile-category-item-name">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 2. Render Contact Lenses Section (with dynamic subcategory images) */}
      <div className="mobile-category-section">
        <div className="mobile-category-section-header">
          <h3 className="section-title">Contact Lens</h3>
          <span 
            className="view-more-link" 
            onClick={() => handleViewMoreClick('Contact Lenses')}
          >
            View More
          </span>
        </div>
        <div className="mobile-category-items-grid">
          {contactLensItems.map((item) => (
            <div 
              key={item.name} 
              className="mobile-category-item"
              onClick={() => handleItemClick('Contact Lenses', item.filter)}
            >
              <div className="mobile-category-item-image-wrapper">
                <img src={item.image} alt={item.name} className="mobile-category-item-image" />
              </div>
              <span className="mobile-category-item-name">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileCategories;
