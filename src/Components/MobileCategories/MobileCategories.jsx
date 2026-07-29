import { useState, useEffect } from 'react';
import './MobileCategories.css';
import { getCategories } from '../../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import { 
  FaGlasses, 
  FaSun, 
  FaLaptop, 
  FaBookOpen, 
  FaEye, 
  FaBaby, 
  FaChevronRight 
} from 'react-icons/fa';

const MobileCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCats = async () => {
      const data = await getCategories();
      if (data.length > 0) {
        setCategories(data);
      } else {
        const fallbackNames = ['Spectacles', 'Sunglasses', 'Contact Lenses', 'Computer Glasses', 'Kids Collection', 'Reading Glasses'];
        setCategories(fallbackNames.map(name => ({ id: name, name })));
      }
      setLoading(false);
    };
    fetchCats();
  }, []);

  const getCategoryTheme = (name) => {
    switch (name) {
      case 'Contact Lenses':
        return { icon: <FaEye />, color: '#00d2fc', bg: 'rgba(0, 210, 252, 0.1)' };
      case 'Kids Collection':
      case 'Kids Eyewear':
        return { icon: <FaBaby />, color: '#ff9f43', bg: 'rgba(255, 159, 67, 0.1)' };
      case 'Computer Glasses':
        return { icon: <FaLaptop />, color: '#1dd1a1', bg: 'rgba(29, 209, 161, 0.1)' };
      case 'Sunglasses':
        return { icon: <FaSun />, color: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.1)' };
      case 'Reading Glasses':
        return { icon: <FaBookOpen />, color: '#a55eea', bg: 'rgba(165, 94, 234, 0.1)' };
      case 'Spectacles':
      default:
        return { icon: <FaGlasses />, color: '#ff0075', bg: 'rgba(255, 0, 117, 0.1)' };
    }
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  if (loading) return null;

  return (
    <div className="mobile-categories">
      <div className="mobile-categories-header">
        <h3 className="section-title">Shop by Category</h3>
        <p className="section-subtitle">Choose from our handpicked collections</p>
      </div>
      <div className="mobile-categories-list">
        {categories.map((category) => {
          const theme = getCategoryTheme(category.name);
          return (
            <div 
              key={category.id || category.name} 
              className="mobile-category-row"
              onClick={() => handleCategoryClick(category.name)}
            >
              <div className="category-left">
                <div className="category-icon-wrapper" style={{ backgroundColor: theme.bg, color: theme.color }}>
                  {theme.icon}
                </div>
                <span className="category-name">{category.name}</span>
              </div>
              <div className="category-right">
                <FaChevronRight className="chevron-icon" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileCategories;
