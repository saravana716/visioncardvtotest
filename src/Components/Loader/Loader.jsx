import React from 'react';
import './Loader.css';
import logo from '../../assets/logo.png';

const Loader = ({ fullPage = false }) => {
    return (
        <div className={`vision-loader-container ${fullPage ? 'full-page' : ''}`}>
            <div className="loader-visual">
                <div className="loader-logo-container">
                    <img src={logo} alt="VisionCart Logo" className="loader-logo" />
                </div>
            </div>
            <div className="loading-bar-wrapper">
                <div className="loading-bar-fill"></div>
            </div>
        </div>
    );
};

export default Loader;
