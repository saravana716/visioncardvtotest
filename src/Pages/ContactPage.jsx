import React, { useState } from 'react';
import Navbar from '../Components/Navbar/Navbar';
import Footers from '../Components/Footer/Footers';
import './ContactPage.css';
import { db } from '../firebase.config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const ContactPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.email || !formData.message) {
            toast.error('Please fill all required fields.');
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
            <div className="contact-container">
                <div className="contact-info-section scroll-reveal">
                    <h1>Get in Touch</h1>
                    <p>Have questions? We're here to help.</p>
                    <div className="contact-details">
                        <div className="contact-item">
                            <strong>Email:</strong>
                            <span>visionkart.onlinestore@gmail.com</span>
                        </div>
                        <div className="contact-item">
                            <strong>Phone:</strong>
                            <span>+91 78713 33302</span>
                        </div>
                        <div className="contact-item">
                            <strong>Address:</strong>
                            <span>19,Thiruthangal Road, Near Senaithalaivar kalyana Mandapam, Sivakasi-626123</span>
                        </div>
                    </div>
                </div>
                <div className="contact-form-section scroll-reveal">
                    <form className="premium-form" onSubmit={handleSubmit}>
                        <input 
                            type="text" 
                            placeholder="Full Name" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                        <textarea 
                            placeholder="Your Message" 
                            rows="5"
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                        ></textarea>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                </div>
            </div>
            <Footers />
        </div>
    );
};

export default ContactPage;
