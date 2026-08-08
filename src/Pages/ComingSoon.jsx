import React, { useState, useEffect } from 'react';
import './ComingSoon.css';
import { config } from '../config';
import logo from '../assets/vision_cart_logo.png';
import { FaInstagram, FaFacebookF, FaTwitter, FaLinkedinIn } from 'react-icons/fa';

const ComingSoon = () => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const targetDate = new Date(config.launchDate).getTime();
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();

        return () => clearInterval(timer);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('Stay tuned! We will notify you at ' + e.target[0].value);
    };

    return (
        <div className="coming-soon-container">
            {/* Ambient Background Layer */}
            <div className="ambient-bg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            {/* Main Center Content */}
            <div className="cs-content">
                <div className="cs-logo-container">
                    <img src={logo} alt="VisionKart Logo" className="cs-logo" />
                </div>
                
                <div className="cs-tag-wrapper">
                    <span className="cs-tag">Launching Soon</span>
                </div>
                
                <h1 className="cs-title">Something Special<br />is in Sight</h1>
                
                <p className="cs-description">
                    We're working hard behind the scenes to bring you a premium eyewear shopping experience. 
                    Thank you for your patience.
                </p>

                <div className="cs-socials">
                    {/* <a href={config.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="social-link">
                        <FaInstagram />
                    </a>
                    <a href={config.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="social-link">
                        <FaFacebookF />
                    </a> */}
                </div>
            </div>
        </div>
    );
};

export default ComingSoon;
