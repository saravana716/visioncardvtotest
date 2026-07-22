import React, { useState, useEffect } from 'react'
import Navbar from '../Components/Navbar/Navbar'
import Slider from '../Components/Slider/Slider'
import Discover from '../Components/Discover/Discover'
import TrendyCollection from '../Components/TrendyCollection/TrendyCollection'
import ContactLens from '../Components/Contact/ContactLens'
import LensCollection from '../Components/LensCollection/LensCollection'
import BookAppointment from '../Components/BookAppointment/BookAppointment'
import UserSlider from '../Components/Userslider/UserSlider'
import OurBrands from '../Components/Ourbrands/OurBrands'
import Footers from '../Components/Footer/Footers';
import RecentlyViewed from '../Components/RecentlyViewed/RecentlyViewed';
import MobileCategories from '../Components/MobileCategories/MobileCategories'
import NewsLetter from '../Components/NewsLetter/NewsLetter';
import { getCategories } from '../services/firestoreService'
import Loader from '../Components/Loader/Loader'

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      const cats = await getCategories();
      setCategories(cats);
      // Small delay for smooth transition
      setTimeout(() => setLoading(false), 500);
    };
    fetchHomeData();
  }, []);

  useEffect(() => {
    if (loading) return;

    // Intersection Observer for Scroll Animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [loading]);

  return (
    <div className='reveal-in'>
      <Navbar/>
      <Slider/>
      <MobileCategories />
      <Discover/>
      
      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="scroll-reveal"><RecentlyViewed /></div>
          {/* Dynamically render category sections */}
          {categories.slice(0, 1).map(cat => (
            <div key={cat.id} className="scroll-reveal">
              <TrendyCollection title={`Premium ${cat.name}`} categoryName={cat.name}/>
            </div>
          ))}
          
          <div className="scroll-reveal"><ContactLens/></div>
          
          {categories.slice(1, 2).map(cat => (
            <div key={cat.id} className="scroll-reveal">
              <TrendyCollection title={`Latest ${cat.name}`} categoryName={cat.name}/>
            </div>
          ))}
          
          <div className="scroll-reveal"><BookAppointment/></div>
          <div className="scroll-reveal"><LensCollection/></div>
          
          {categories.slice(2).map((cat, index) => (
            <React.Fragment key={cat.id}>
              <div className="scroll-reveal">
                <TrendyCollection title={cat.name} categoryName={cat.name}/>
              </div>
              {index === 0 && <div className="scroll-reveal"><UserSlider/></div>} 
            </React.Fragment>
          ))}
          
          {/* Ensure UserSlider is shown even if there are fewer than 3 dynamic categories after slice */}
          {categories.length < 3 && <div className="scroll-reveal"><UserSlider/></div>}
          <div className="scroll-reveal"><TrendyCollection /></div>
          <div className="scroll-reveal"><NewsLetter /></div>
        </>
      )}

      <OurBrands/>
      <Footers/>
    </div>
  )
}

export default Home