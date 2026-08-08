import React from 'react';
import './LensCollection.css';

// Import all 7 lens images cleanly
import lens1 from '../../assets/Lens/1.png';
import lens2 from '../../assets/Lens/2.png';
import lens3 from '../../assets/Lens/3.png';
import lens4 from '../../assets/Lens/4.png';
import lens5 from '../../assets/Lens/5.png';
import lens6 from '../../assets/Lens/6.png';
import lens7 from '../../assets/Lens/7.png';

const lensData = [
  { id: 1, image: lens1, name: 'Standard Single Vision' },
  { id: 2, image: lens2, name: 'Blue Cut Lenses' },
  { id: 3, image: lens3, name: 'Anti-Glare Lenses' },
  { id: 4, image: lens4, name: 'Bifocal Lenses' },
  { id: 5, image: lens5, name: 'Progressive Lenses' },
  { id: 6, image: lens6, name: 'Photochromic Lenses' },
  { id: 7, image: lens7, name: 'Premium High-Index' }
];

const LensCollection = () => {
  // Doubling the array for a seamless loop scroll on mobile and desktop
  const displayLenses = [...lensData, ...lensData];

  return (
    <div className="lens-collection-container scroll-reveal">
      <div className="lens-header">
        <h2>Lenses For Your Lifestyle</h2>
        <p>Explore our wide collection of high-quality lenses tailored perfectly for your lifestyle and vision, with zero compromises.</p>
      </div>

      <div className="carousel-viewport">
        <div className="lens-grid carousel-track">
          {displayLenses.map((lens, index) => (
            <div key={`${lens.id}-${index}`} className={`lens-card ${index >= lensData.length ? 'duplicate' : ''}`}>
              <div className="lens-image-wrapper" style={{ width: '100%', height: '280px', padding: 0, margin: 0, overflow: 'hidden' }}>
                <img
                  src={lens.image}
                  alt={lens.name}
                  className="lens-image"
                  loading="lazy"
                  decoding="async"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    display: 'block',
                    transform: 'scale(2.0)'
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LensCollection;
