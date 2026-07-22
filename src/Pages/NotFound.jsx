import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Components/Navbar/Navbar';
import Footers from '../Components/Footer/Footers';
import './NotFound.css';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="not-found-wrapper">
            <Navbar />
            <div className="not-found-container">
                <div className="not-found-content reveal-up">
                    <div className="error-code">404</div>
                    <h1>Oops! Page Not Found</h1>
                    <p>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
                    <button className="back-home-btn" onClick={() => navigate('/')}>
                        Return to Shop
                    </button>
                    <div className="not-found-illustration">
                        <img src="https://cdni.iconscout.com/illustration/premium/thumb/not-found-illustration-download-in-svg-png-gif-file-formats--search-error-pack-user-interface-illustrations-5218416.png" alt="404 Illustration" />
                    </div>
                </div>
            </div>
            <Footers />
        </div>
    );
};

export default NotFound;
