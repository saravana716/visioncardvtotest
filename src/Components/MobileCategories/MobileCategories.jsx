import { useState, useEffect } from 'react';
import './MobileCategories.css';
import { getCategories } from '../../services/firestoreService';
import { useNavigate } from 'react-router-dom';

const MobileCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCats = async () => {
      const data = await getCategories();
      setCategories(data);
      setLoading(false);
    };
    fetchCats();
  }, []);

  const getSubItems = (catName) => {
    const commonGenders = [
      { name: 'Men', img: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=150&q=80', params: 'Men' },
      { name: 'Women', img: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=150&q=80', params: 'Women' },
      { name: 'Unisex', img: 'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?auto=format&fit=crop&w=150&q=80', params: 'Unisex' },
      { name: 'Kids', img: 'https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?auto=format&fit=crop&w=150&q=80', params: 'Kids' }
    ];

    if (catName.includes('Contact')) {
      return [
        { name: 'Lens', img: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=200&q=80', params: 'Lens' },
        { name: 'Color', img: 'https://images.unsplash.com/photo-1525904097878-94fb15835963?w=200&q=80', params: 'Color' },
        { name: 'Solution', img: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=200&q=80', params: 'Solution' },
        { name: 'Accessories', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&q=80', params: 'Accessories' }
      ];
    }
    
    if (catName === 'Reading Glasses' || catName === 'Computer Glasses') {
      return [
        { name: 'ARC', img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=200&q=80', params: 'ARC' },
        { name: 'Blue Cut', img: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=200&q=80', params: 'Blue Cut' },
        { name: 'UV Protect', img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&q=80', params: 'UV' },
        { name: 'Auto Cool', img: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=200&q=80', params: 'Auto' }
      ];
    }
    
    return commonGenders;
  };

  const FALLBACK_SUB_IMG = 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=200&q=80';

  // Which product filter the hardcoded fallback tiles map to, per category, so
  // fallback navigation matches how ProductPage/getProducts actually filters
  // (Contact Lenses filter on subcategory→contactLensSubcategory; lens coatings
  // on lensType; everything else on gender).
  const fallbackParamName = (catName) => {
    if (catName && catName.includes('Contact')) return 'subcategory';
    if (catName === 'Reading Glasses' || catName === 'Computer Glasses') return 'lensType';
    return 'gender';
  };

  // Prefer the admin-defined subcategories; fall back to the hardcoded tiles
  // only for categories that have none.
  const dynamicSections = categories.map(cat => {
    const subs = Array.isArray(cat.subcategories) ? cat.subcategories : [];
    if (subs.length > 0) {
      // Subcategories may be plain strings OR { id, name, imageUrl } objects
      // (the desktop MegaMenu handles both); normalize and drop blanks/nulls.
      const items = subs
        .filter(Boolean)
        .map(sub => {
          const name = typeof sub === 'string' ? sub : (sub.name || '');
          const img = (sub && typeof sub === 'object' && sub.imageUrl) ? sub.imageUrl : FALLBACK_SUB_IMG;
          return { name, img, paramName: 'subcategory', value: name };
        })
        .filter(it => it.name);
      if (items.length > 0) {
        return { title: cat.name, items };
      }
    }
    return {
      title: cat.name,
      items: getSubItems(cat.name).map(it => ({
        name: it.name,
        img: it.img,
        paramName: fallbackParamName(cat.name),
        value: it.params,
      })),
    };
  });

  const handleCategoryClick = (category, paramName, value) => {
    navigate(`/products?category=${encodeURIComponent(category)}&${paramName}=${encodeURIComponent(value)}`);
  };

  return (
    <div className="mobile-categories">
      {dynamicSections.map((section) => (
        <div key={section.title} className="category-section">
          <div className="category-header">
            <h2>{section.title}</h2>
            <span className="view-more">View More</span>
          </div>
          <div className="category-grid">
            {section.items.map((item) => (
              <div
                key={`${item.paramName}-${item.value}`}
                className="category-item"
                onClick={() => handleCategoryClick(section.title, item.paramName, item.value)}
              >
                <div className="image-container">
                  <img src={item.img} alt={item.name} loading="lazy" decoding="async" />
                </div>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileCategories;
