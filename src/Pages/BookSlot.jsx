import React, { useState } from 'react';
import Navbar from '../Components/Navbar/Navbar';
import Footers from '../Components/Footer/Footers';
import { IoSearchOutline } from "react-icons/io5";
import './BookSlot.css';

const BookSlot = () => {
    const [step, setStep] = useState(2); // Starting at Address step as per design

    const steps = [
        { id: 1, label: 'Login/Signup' },
        { id: 2, label: 'Address' },
        { id: 3, label: 'Date&Time' },
        { id: 4, label: 'Confirm Slot' }
    ];

    return (
        <div className="book-slot-page">
            <Navbar />
            
            <div className="breadcrumbs-nav">
                <div className="container">
                    <span>Home</span> &gt; <span>Home Try-On</span> &gt; <span>Book your Slot</span>
                </div>
            </div>

            <div className="stepper-container">
                <div className="container">
                    <div className="stepper">
                        {steps.map((s, idx) => (
                            <React.Fragment key={s.id}>
                                <div className={`step-item ${step >= s.id ? 'active' : ''}`}>
                                    <div className="step-circle"></div>
                                    <span className="step-label">{s.label}</span>
                                </div>
                                {idx < steps.length - 1 && <div className={`step-line ${step > s.id ? 'active' : ''}`}></div>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            <main className="booking-main">
                <div className="container">
                    <div className="booking-card">
                        <h2>Add Address</h2>
                        
                        <div className="location-input-wrapper">
                            <IoSearchOutline className="search-icon" />
                            <input type="text" placeholder="Search Your Location" />
                        </div>

                        <h3>Use Current Location</h3>
                        
                        <div className="map-placeholder">
                            {/* Simulated Map View */}
                            <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1000" alt="Map" />
                            <div className="map-overlay-center">
                                <div className="pin">📍</div>
                            </div>
                        </div>

                        <div className="action-row">
                            <button className="save-next-btn">Save and Next</button>
                        </div>
                    </div>
                </div>
            </main>

            <div className="visionkart-banner-footer">
                <h1>VISIONKART <span className="eye-icon">👁️</span> VISION</h1>
            </div>

            <Footers />
        </div>
    );
};

export default BookSlot;
