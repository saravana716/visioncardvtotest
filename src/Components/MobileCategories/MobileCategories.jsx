import './MobileCategories.css';
import { useNavigate } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';

// Import category images
import imgContactLenses from '../../assets/contactlens.png';
import imgSpectacles from '../../assets/spec.png';
import imgSunglasses from '../../assets/sun.png';
import imgComputerGlasses from '../../assets/com.png';
import imgReadingGlasses from '../../assets/read.png';
import imgKidsCollection from '../../assets/kids.png';


const CATEGORY_ITEMS = [
  {
    name: 'Contact Lenses',
    subtitle: 'Daily, Monthly & Color',
    image: imgContactLenses,
    bgGradient: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)',
  },
  {
    name: 'Spectacles',
    subtitle: 'Men - Women - Kids',
    image: imgSpectacles,
    bgGradient: 'linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%)',
  },
  {
    name: 'Sunglasses',
    subtitle: 'UV Protection',
    image: imgSunglasses,
    bgGradient: 'linear-gradient(135deg, #ffedd5 0%, #ffffff 100%)',
  },
  {
    name: 'Computer Glasses',
    subtitle: 'Blue Light Protection',
    image: imgComputerGlasses,
    bgGradient: 'linear-gradient(135deg, #ecfeff 0%, #ffffff 100%)',
  },
  {
    name: 'Reading Glasses',
    subtitle: 'Clear & Comfortable',
    image: imgReadingGlasses,
    bgGradient: 'linear-gradient(135deg, #f5ebe0 0%, #ffffff 100%)',
  },
  {
    name: 'Kids Collection',
    subtitle: 'For Little Ones',
    image: imgKidsCollection,
    bgGradient: 'linear-gradient(135deg, #fce7f3 0%, #ffffff 100%)',
  }
];

const MobileCategories = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="mobile-categories">
      <div className="mobile-categories-header">
        <h3 className="section-title">Shop by Categories</h3>
        <p className="section-subtitle">Handpicked collections for you</p>
      </div>
      <div className="mobile-categories-list">
        {CATEGORY_ITEMS.map((item) => (
          <div 
            key={item.name} 
            className="mobile-category-card"
            style={{ background: item.bgGradient }}
            onClick={() => handleCategoryClick(item.name)}
          >
            <div className="category-text-container">
              <h4 className="category-title">{item.name}</h4>
              <p className="category-subtitle">{item.subtitle}</p>
            </div>
            <div className="category-image-container">
              <img src={item.image} alt={item.name} className="category-image" />
            </div>
            <div className="category-chevron-container">
              <div className="category-chevron-circle">
                <FaChevronRight className="chevron-icon" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileCategories;

