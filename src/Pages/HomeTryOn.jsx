import React, { useEffect } from 'react';
import Navbar from '../Components/Navbar/Navbar';
import Footers from '../Components/Footer/Footers';
import OurBrands from '../Components/Ourbrands/OurBrands';
import { useNavigate } from 'react-router-dom';
import rateimg from '../assets/star.png';
import { MdVerified, MdCleanHands, MdGroups } from "react-icons/md";
import { GiMicroscope } from "react-icons/gi";
import { IoReceiptOutline } from "react-icons/io5";
import './HomeTryOn.css';

const HomeTryOn = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const reviews = [
        { id: 1, user: 'Anwar H.', date: 'Dec 12, 2025', text: 'good very good', stars: 4 },
        { id: 2, user: 'Anwar H.', date: 'Dec 12, 2025', text: 'good very good', stars: 5 },
        { id: 3, user: 'Anwar H.', date: 'Dec 12, 2025', text: 'good very good', stars: 4 },
    ];

    const benefits = [
        { icon: <MdVerified />, title: 'Certified & Trained Optometrists' },
        { icon: <GiMicroscope />, title: 'Advanced Eye Testing Equipment' },
        { icon: <MdCleanHands />, title: 'Safe & Hygienic Process' },
        { icon: <IoReceiptOutline />, title: 'Accurate Prescription' },
        { icon: <MdGroups />, title: 'Ideal for All Age Groups' },
    ];

    return (
        <div className="home-tryon-page">
            <Navbar />
            
            <div className="breadcrumbs-nav">
                <div className="container">
                    <span>Home</span> &gt; <span>Home Try-On</span>
                </div>
            </div>

            <main className="tryon-content">
                <div className="container main-grid">
                    <div className="image-section">
                        <img src="https://images.unsplash.com/photo-1576091160550-217359f42f8c?w=800" alt="Home Eye Care" />
                    </div>

                    <div className="info-section">
                        <h1>Visionkart Eye Care at Home. Zero Hassle.</h1>
                        <p className="description">
                            Visionkart brings accurate, safe, and convenient eye testing right to your home — no clinic visits, no waiting time. Get your eyes tested by certified optometrists. Accurate eye check-ups with advanced equipment. Comfortable, safe, and convenient care at your doorstep.
                        </p>
                        
                        <div className="price-tag">
                            <span className="current">₹99</span> <del>₹500</del>
                        </div>

                        <h2>Why Choose Eye Test at Home</h2>
                        <ul className="benefits-list">
                            {benefits.map((b, idx) => (
                                <li key={idx}>
                                    <span className="benefit-icon">{b.icon}</span>
                                    <span className="benefit-text">{b.title}</span>
                                </li>
                            ))}
                        </ul>

                        <button className="book-slot-btn" onClick={() => navigate('/book-slot')}>
                            Book your Slot
                        </button>
                    </div>
                </div>

                <div className="container reviews-section-home">
                    <h3>Review (6017)</h3>
                    <div className="reviews-grid-home">
                        {reviews.map(r => (
                            <div className="review-card-home" key={r.id}>
                                <div className="stars">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className={i < r.stars ? 'filled' : ''}>★</span>
                                    ))}
                                </div>
                                <p className="review-text">"{r.text}"</p>
                                <p className="review-meta">{r.user} - {r.date}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="brands-wrapper-home">
                    <OurBrands />
                </div>
            </main>

            <div className="visionkart-banner-footer">
                <h1>VISIONKART <span className="eye-icon">👁️</span> VISION</h1>
            </div>

            <Footers />
        </div>
    );
};

export default HomeTryOn;
