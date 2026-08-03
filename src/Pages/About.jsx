import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Components/Navbar/Navbar';
import Footers from '../Components/Footer/Footers';
import './About.css';
import lifestyleHero from '../assets/lifestyle_hero.png';
import aboutUsImg from '../assets/aboutus.png';
import craftsmanshipImg from '../assets/craftsmanship.png';
import { 
    FiCheck, 
    FiShield, 
    FiEye, 
    FiSun, 
    FiZap,
    FiAward,
    FiTrendingUp,
    FiHeart,
    FiPackage,
    FiGrid,
    FiLock,
    FiSmile,
    FiSearch
} from 'react-icons/fi';

const About = () => {
    const navigate = useNavigate();
    useEffect(() => {
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

        window.scrollTo(0, 0);

        return () => observer.disconnect();
    }, []);

    return (
        <div className="about-v2-wrapper">
            <Navbar />


            {/* Section 1: Lifestyle Hero */}
            <header className="hero-v2">
                <div className="hero-v2-container">
                    <div className="hero-v2-text scroll-reveal">
                        <span className="eyebrow">VisionKart</span>
                        <h1>The Future of <span>Smart</span> Online Shopping</h1>
                        <p>
                            Welcome to VisionKart, your one-stop destination for a smarter, faster, and more 
                            reliable online shopping experience. We are a modern eCommerce platform built to 
                            simplify the way people discover and buy products online.
                        </p>
                        <div className="hero-stats">
                            <div className="stat">
                                <strong>500+</strong>
                                <span>Unique Frames</span>
                            </div>
                            <div className="stat">
                                <strong>1M+</strong>
                                <span>Happy Eyes</span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-v2-image scroll-reveal delay-1">
                        <img src={lifestyleHero} alt="Professional Eyewear Lifestyle" />
                    </div>
                </div>
            </header>

            {/* Section 2: About VisionKart Details */}
            <section className="materials-section">
                <div className="container-v2 grid-2">
                    <div className="materials-image scroll-reveal">
                        <img src={aboutUsImg} alt="About VisionKart" />
                        <div className="image-overlay-card">
                            <span>Innovation</span>
                            <p>Crafted for a Superior Way to Shop</p>
                        </div>
                    </div>
                    <div className="materials-text scroll-reveal delay-1">
                        <h2 className="v2-section-title">About <span>VisionKart</span></h2>
                        <p className="v2-section-desc">
                            At VisionKart, we combine innovation, technology, and customer-first thinking to 
                            deliver a seamless shopping journey — from browsing to checkout.
                        </p>
                        <ul className="v2-feature-list">
                            <li><FiCheck /> Smarter discovery of products</li>
                            <li><FiCheck /> Faster checkout and processing</li>
                            <li><FiCheck /> Reliable service you can trust</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Section 3: Our Mission */}
            <section className="mission-v2-section">
                <div className="container-v2 center">
                    <div className="mission-v2-content scroll-reveal">
                        <h2 className="v2-section-title">Our <span>Mission</span></h2>
                        <p className="v2-section-desc large">
                            "Our mission is to make online shopping easy, accessible, and trustworthy for everyone."
                        </p>
                    </div>
                    <div className="mission-v2-grid scroll-reveal delay-1">
                        <div className="mission-v2-item">
                            <div className="v2-icon-circle"><FiAward /></div>
                            <h3>High Quality</h3>
                            <p>Offering premium products at affordable prices.</p>
                        </div>
                        <div className="mission-v2-item">
                            <div className="v2-icon-circle"><FiZap /></div>
                            <h3>User Friendly</h3>
                            <p>Ensuring a fast and intuitive shopping experience.</p>
                        </div>
                        <div className="mission-v2-item">
                            <div className="v2-icon-circle"><FiLock /></div>
                            <h3>Secure Payments</h3>
                            <p>Providing safe and secure payment solutions for every purchase.</p>
                        </div>
                        <div className="mission-v2-item">
                            <div className="v2-icon-circle"><FiPackage /></div>
                            <h3>Speed & Reliability</h3>
                            <p>Delivering products with exceptional speed and trusted reliability.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 4: Our Vision */}
            <section className="lens-tech-section">
                <div className="container-v2">
                    <div className="grid-2 reverse">
                        <div className="lens-text scroll-reveal">
                            <h2 className="v2-section-title">Our <span>Vision</span></h2>
                        <p className="v2-section-desc vision-desc">
                            To become a leading online shopping platform known for trust, performance, and customer satisfaction.
                        </p>
                        <p className="v2-section-desc vision-sub-desc">
                            We aim to continuously improve our platform by adopting the latest technologies and 
                            expanding our product offerings to meet evolving customer needs.
                        </p>
                        </div>
                        <div className="vision-image scroll-reveal delay-1">
                            <img src={craftsmanshipImg} alt="VisionKart Future Vision" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 5: What We Do */}
            <section className="what-we-do-section-v2">
                <div className="container-v2">
                    <h2 className="v2-section-title center scroll-reveal">What <span>We Do</span></h2>
                    <div className="mission-v2-grid scroll-reveal delay-1 what-we-do-grid">
                        <div className="mission-v2-item center">
                            <div className="v2-icon-circle"><FiGrid /></div>
                            <h3>Curated Products</h3>
                            <p>Wide range of curated products for every style.</p>
                        </div>
                        <div className="mission-v2-item center">
                            <div className="v2-icon-circle"><FiZap /></div>
                            <h3>Mobile Friendly</h3>
                            <p>Fast-loading and mobile-optimized platform.</p>
                        </div>
                        <div className="mission-v2-item center">
                            <div className="v2-icon-circle"><FiShield /></div>
                            <h3>Secure Transactions</h3>
                            <p>Safe and secure online transactions globally.</p>
                        </div>
                        <div className="mission-v2-item center">
                            <div className="v2-icon-circle"><FiPackage /></div>
                            <h3>Smooth Delivery</h3>
                            <p>Smooth order processing and fast delivery.</p>
                        </div>
                    </div>
                    <p className="center v2-section-desc what-we-do-subtext">
                        We focus on delivering both quality and convenience in every purchase.
                    </p>
                </div>
            </section>

            {/* Section 6: Our Promise - Redesigned Cards */}
            <section className="trust-banner-v2">
                <div className="container-v2">
                    <span className="eyebrow center scroll-reveal">Our Promise</span>
                    <h2 className="v2-section-title center scroll-reveal">Transparency & <span>Quality</span></h2>
                    <div className="trust-v2-grid scroll-reveal delay-1">
                        <div className="trust-v2-item">
                            <FiSearch /> 
                            <div className="trust-text">
                                <strong>Transparency</strong> in every transaction
                            </div>
                        </div>
                        <div className="trust-v2-item">
                            <FiAward /> 
                            <div className="trust-text">
                                <strong>Quality</strong> in every product
                            </div>
                        </div>
                        <div className="trust-v2-item">
                            <FiLock /> 
                            <div className="trust-text">
                                <strong>Security</strong> in every payment
                            </div>
                        </div>
                        <div className="trust-v2-item">
                            <FiSmile /> 
                            <div className="trust-text">
                                <strong>Satisfaction</strong> in every order
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 7: Our Commitment - High Impact Stylized */}
            <section className="cta-v2-section scroll-reveal">
                <div className="container-v2 center">
                    <span className="eyebrow">Our Commitment</span>
                    <h2>Delivering an experience that is:</h2>
                    
                    <div className="commitment-pillars">
                        <div className="pillar scroll-reveal">
                            <span>Effortless</span>
                        </div>
                        <div className="pillar scroll-reveal delay-1">
                            <span>Reliable</span>
                        </div>
                        <div className="pillar scroll-reveal delay-2">
                            <span>Elevated</span>
                        </div>
                    </div>

                    <p>"We don’t just meet expectations — we aim to exceed them."</p>
                    
                    <div className="final-cta-block scroll-reveal">
                        <h2 className="cta-final-title">VisionKart – Where Quality Meets Convenience</h2>
                        <p className="cta-final-desc">Crafted for a Superior Way to Shop</p>
                        <button className="v2-primary-btn" onClick={() => navigate('/products')}>Start Shopping</button>
                    </div>
                </div>
            </section>

            <Footers />
        </div>
    );
};

export default About;
