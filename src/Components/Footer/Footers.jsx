import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import "./Footer.css"
import { FaInstagram, FaFacebookF, FaWhatsapp } from "react-icons/fa";
import logo from "../../assets/vision_cart_logo.png"
import { useSiteSettings } from '../../hooks/useSiteSettings';

const Footers = () => {
  const navigate = useNavigate();
  const siteSettings = useSiteSettings();
  const logoSrc = siteSettings.logoUrl || logo;

  // Admin-managed URLs are untrusted: only accept http(s) (blocks javascript:
  // and other schemes), otherwise use the safe default.
  const sanitizeUrl = (url, fallback) => {
    const s = String(url || '').trim();
    return /^https?:\/\//i.test(s) ? s : fallback;
  };
  // Open external links with noopener/noreferrer to avoid reverse-tabnabbing.
  const openExternal = (url) => {
    const s = String(url || '').trim();
    if (/^https?:\/\//i.test(s)) window.open(s, '_blank', 'noopener,noreferrer');
  };

  const instagramUrl = sanitizeUrl(siteSettings.socialInstagram, 'https://www.instagram.com/visionkart.onlinestore/');
  const facebookUrl = sanitizeUrl(siteSettings.socialFacebook, 'https://www.facebook.com/profile.php?id=61570766005925');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCopyrightVisible, setIsCopyrightVisible] = useState(false);
  const copyrightRef = useRef(null);

  const openWhatsApp = () => {
    // Admin's socialWhatsApp may be a full http(s) URL or a phone number.
    const raw = String(siteSettings.socialWhatsApp || '').trim();
    const DEFAULT_WA = 'https://wa.me/917871333302';
    let url = DEFAULT_WA;
    if (/^https?:\/\//i.test(raw)) {
      url = raw;
    } else {
      const digits = raw.replace(/\D/g, '');
      if (digits) url = `https://wa.me/${digits}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFloatingClick = (e) => {
    e.stopPropagation();
    setIsChatOpen(prev => !prev);
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsChatOpen(false);
    };
    if (isChatOpen) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [isChatOpen]);

  // Hide the "Chat with us" pill once the footer copyright row is in view so
  // the fixed-position pill doesn't sit on top of the centered "Made with..."
  // text. The round WhatsApp button stays.
  useEffect(() => {
    const target = copyrightRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsCopyrightVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <footer className='footer-container'>
        {/* Marquee Section - Only Logo Scroll */}
        <div className='footer-marquee'>
            <div className='marquee-content'>
                {[...Array(8)].map((_, i) => (
                    <img key={i} src={logoSrc} alt="VisionKart Logo" className="marquee-logo-only" />
                ))}
            </div>
            <div className='marquee-content'>
                {[...Array(8)].map((_, i) => (
                    <img key={i} src={logoSrc} alt="VisionKart Logo" className="marquee-logo-only" />
                ))}
            </div>
        </div>

        {/* Main Footer Content */}
        <div className='footer-main'>
            <div className='footer-column brand-column'>
                <h3>The VisionKart Promise</h3>
                <p>Visionkart is your preferred destination for premium eyewear. We offer stylish spectacles, sunglasses, computer glasses, reading glasses, and contact lenses at affordable prices. Our mission is to help you see clearly, look confident, and enjoy a comfortable shopping experience with quality products and reliable customer support.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#e0e0e0', lineHeight: '1.6', marginTop: '20px' }}>
                <h3> VisionKart Opticals</h3>

                    <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span>📍</span>
                        <span>19, Thiruthangal Road, Near Senaithalaivar Kalyana Mandapam, SIVAKASI - 626123</span>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span>📞</span>
                        <a href="tel:+917871333302" style={{ color: 'inherit', textDecoration: 'none' }}>+91 78713 33302</a>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span>📧</span>
                        <a href="mailto:visionkart.onlinestore@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>visionkart.onlinestore@gmail.com</a>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span>🌐</span>
                        <a href="https://visionkart.online" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>visionkart.online</a>
                    </span>
                </div>
            </div>

            <div className='footer-column'>
                <h3>Quick Links</h3>
                <ul>
                    <li onClick={() => navigate('/')}>Home</li>
                    <li onClick={() => navigate('/about')}>About Us</li>
                    <li onClick={() => navigate('/products')}>Products</li>
                    <li onClick={() => navigate('/contact')}>Contact Us</li>
                </ul>
            </div>

            <div className='footer-column'>
                <h3>Categories</h3>
                <ul>
                    <li onClick={() => navigate('/products?category=Spectacles')}>Spectacles</li>
                    <li onClick={() => navigate('/products?category=Sunglasses')}>Sunglasses</li>
                    <li onClick={() => navigate('/products?category=Computer Glasses')}>Computer Glasses</li>
                    <li onClick={() => navigate('/products?category=Reading Glasses')}>Reading Glasses</li>
                    <li onClick={() => navigate('/products?category=Kids Collection')}>Kids Eyewear</li>
                    <li onClick={() => navigate('/products?category=Contact Lenses')}>Contact Lenses</li>
                </ul>
            </div>

            <div className='footer-column legal-column'>
                <h3>Customer Support</h3>
                <ul>
                    <li onClick={() => navigate('/faq')}>FAQ</li>
                    <li onClick={() => navigate('/shipping-policy')}>Shipping Policy</li>
                    <li onClick={() => navigate('/refund-and-return')}>Return & Refund Policy</li>
                    <li onClick={() => navigate('/privacy-policy')}>Privacy Policy</li>
                    <li onClick={() => navigate('/terms-and-conditions')}>Terms & Conditions</li>
                    <li onClick={() => navigate('/prescription-policy')}>Prescription Guide</li>
                    <li onClick={() => navigate('/orders')}>Track Your Order</li>
                    <li onClick={() => navigate('/contact')}>Contact Support</li>
                </ul>
            </div>

            <div className='footer-column contact-column'>
                <h3>Connect & Follow</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '10px', marginTop: '10px' }}>
                    Follow VisionKart for the latest collections, offers, and updates.
                </p>
                <div className='social-icons'>
                    <div className='social-icon-wrapper' onClick={() => openExternal(instagramUrl)} style={{ cursor: 'pointer' }}><FaInstagram /></div>
                    <div className='social-icon-wrapper' onClick={() => openExternal(facebookUrl)} style={{ cursor: 'pointer' }}><FaFacebookF /></div>
                    <div className='social-icon-wrapper' onClick={(e) => {
                        e.stopPropagation();
                        setIsChatOpen(prev => !prev);
                        const container = document.querySelector('.whatsapp-widget-container');
                        if (container) {
                            container.scrollIntoView({ behavior: 'smooth', block: 'end' });
                        }
                    }} style={{ cursor: 'pointer' }}><FaWhatsapp /></div>
                </div>
            </div>
        </div>

        {/* Fixed Floating WhatsApp Button with Chat Widget */}
        <div className="whatsapp-widget-container" onClick={(e) => e.stopPropagation()}>
            {isChatOpen && (
                <div className="whatsapp-chat-popup">
                    <div className="chat-header">
                        <img src={logoSrc} alt="VisionKart Support" className="chat-avatar" />
                        <div className="chat-header-info">
                            <h4>VisionKart Support</h4>
                            <span className="online-status"><span className="dot"></span>Online</span>
                        </div>
                        <button className="chat-close-btn" onClick={(e) => { e.stopPropagation(); setIsChatOpen(false); }}>×</button>
                    </div>
                    <div className="chat-body">
                        <p className="chat-msg">Hello there! 👋</p>
                        <p className="chat-msg text-bold">How can we help you today? Chat with us on WhatsApp for instant assistance!</p>
                    </div>
                    <div className="chat-footer">
                        <button className="chat-send-btn" onClick={() => { openWhatsApp(); setIsChatOpen(false); }}>
                            <FaWhatsapp style={{ marginRight: '8px', fontSize: '18px' }} />
                            Start Chat
                        </button>
                    </div>
                </div>
            )}
            
            <div className="whatsapp-button-row">
                {!isChatOpen && !isCopyrightVisible && (
                    <div className="whatsapp-tooltip-pill" onClick={handleFloatingClick}>
                        Chat with us
                    </div>
                )}
                <div className={`fixed-whatsapp-btn ${isChatOpen ? 'active' : ''}`} onClick={handleFloatingClick} title="Chat with us on WhatsApp">
                    <FaWhatsapp />
                </div>
            </div>
        </div>

        {/* Copyright Section */}
        <div className='footer-copyright' ref={copyrightRef}>
            <p>© 2026 VisionKart. All Rights Reserved.</p>
            <p>Designed & Developed by  Kaira Technologies</p>
        </div>
    </footer>
  )
}

export default Footers