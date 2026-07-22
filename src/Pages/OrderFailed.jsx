import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../Components/Navbar/Navbar';
import Footers from '../Components/Footer/Footers';
import { FaTimesCircle, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import './OrderFailed.css';

const OrderFailed = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const status = searchParams.get('status') || 'Payment Failed';

    return (
        <div className="failed-page">
            <Navbar />
            <div className="failed-container">
                <div className="failed-card fade-in">
                    <div className="failed-icon">
                        <FaTimesCircle />
                    </div>
                    <h1>Payment Unsuccessful</h1>
                    <p className="failed-status">Status: <span>{status}</span></p>
                    <p className="failed-msg">
                        We're sorry, but your transaction could not be completed at this time. 
                        No money has been debited from your account. If it has, it will be 
                        automatically refunded within 5-7 business days.
                    </p>
                    
                    <div className="failed-actions">
                        <button className="retry-btn" onClick={() => navigate('/checkout')}>
                            <FaExclamationTriangle /> Try Again
                        </button>
                        <button className="back-home-btn" onClick={() => navigate('/')}>
                            <FaArrowLeft /> Back to Home
                        </button>
                    </div>

                    <div className="support-info">
                        <p>Need help? Contact our support at <span>support@visionkart.com</span></p>
                    </div>
                </div>
            </div>
            <Footers />
        </div>
    );
};

export default OrderFailed;
