import React, { useState } from 'react';
import Navbar from '../Components/Navbar/Navbar';
import Footers from '../Components/Footer/Footers';
import './ContactPage.css';
import { db } from '../firebase.config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const ContactPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.email || !formData.message) {
            toast.error('Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'contact'), {
                name: formData.name,
                email: formData.email,
                message: formData.message,
                createdAt: serverTimestamp()
            });

            toast.success('Your message has been sent successfully!');
            setFormData({ name: '', email: '', message: '' }); // Reset form
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Failed to send message. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-page-wrapper">
            <Navbar />
            
            {/* Header / Hero Section */}
            <div className="contact-hero">
                <h1>Get in Touch</h1>
                <p>Have questions, feedback, or need prescription assistance? We're here to help!</p>
            </div>

            <div className="contact-container">
                {/* Contact Info Cards Section */}
                <div className="contact-cards-grid scroll-reveal">
                    <div className="contact-card">
                        <div className="card-icon-circle email-icon">
                            <FaEnvelope />
                        </div>
                        <h3>Email Us</h3>
                        <p className="card-desc">Send us your queries anytime</p>
                        <a href="mailto:visionkart.onlinestore@gmail.com" className="card-link">visionkart.onlinestore@gmail.com</a>
                    </div>

                    <div className="contact-card">
                        <div className="card-icon-circle phone-icon">
                            <FaPhone />
                        </div>
                        <h3>Call Us</h3>
                        <p className="card-desc">Talk to our experts directly</p>
                        <a href="tel:+917871333302" className="card-link">+91 78713 33302</a>
                    </div>

                    <div className="contact-card">
                        <div className="card-icon-circle address-icon">
                            <FaMapMarkerAlt />
                        </div>
                        <h3>Visit Us</h3>
                        <p className="card-desc">Drop by our optical branch store</p>
                        <span className="card-address">
                            19, Thiruthangal Road, Near Senaithalaivar Kalyana Mandapam, Sivakasi – 626123
                        </span>
                    </div>
                </div>

                {/* Full Width Contact Form Section */}
                <div className="contact-form-section full-width-section scroll-reveal">
                    <div className="form-card-container">
                        <h2>Send us a Message</h2>
                        <p className="form-intro">Fill out the form below, and our team will get back to you within 24 hours.</p>
                        
                        <form className="premium-form" onSubmit={handleSubmit}>
                            <div className="form-grid-2col">
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        id="contactName"
                                        placeholder=" "
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                    />
                                    <label htmlFor="contactName">Full Name</label>
                                </div>
                                <div className="input-group">
                                    <input 
                                        type="email" 
                                        id="contactEmail"
                                        placeholder=" "
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        required
                                    />
                                    <label htmlFor="contactEmail">Email Address</label>
                                </div>
                            </div>
                            
                            <div className="input-group textarea-group">
                                <textarea 
                                    id="contactMessage"
                                    placeholder=" "
                                    rows="6"
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    required
                                ></textarea>
                                <label htmlFor="contactMessage">Your Message</label>
                            </div>
                            
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Sending Message...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            
            <Footers />
        </div>
    );
};

export default ContactPage;
