import React, { useState, useEffect } from 'react';
import './FAQ.css';
import Navbar from '../../Components/Navbar/Navbar';
import Footers from '../../Components/Footer/Footers';
import { MdExpandMore } from 'react-icons/md';

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`faq-item ${isOpen ? 'open' : ''}`}>
            <button className="faq-question" onClick={() => setIsOpen(!isOpen)}>
                <span>{question}</span>
                <MdExpandMore className="faq-icon" />
            </button>
            <div className="faq-answer">
                <p>{answer}</p>
            </div>
        </div>
    );
};

const FAQ = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const faqData = [
        {
            question: "How to choose frame size?",
            answer: "Check the inside of your current glasses for numbers. Alternatively, you can use our Size Guide, which includes a Virtual Try-On feature to see how different frames fit your face."
        },
        {
            question: "How to upload a prescription?",
            answer: "While ordering prescription glasses, you will be prompted to either upload a photo of your prescription or enter the details manually. You can also send us your prescription via WhatsApp."
        },
        {
            question: "How long does delivery take?",
            answer: "Typically, delivery takes between 3 to 7 working days depending on your location and the complexity of your prescription."
        },
        {
            question: "Can I return my glasses?",
            answer: "Yes, you can return glasses if they are damaged or incorrect. Please refer to our Refund & Return Policy for more details on eligibility and procedures."
        }
    ];

    return (
        <div className="faq-page-wrapper">
            <Navbar />
            <div className="faq-hero">
                <div className="faq-hero-content">
                    <h1>Frequently Asked Questions</h1>
                    <p>Everything you need to know about VisionKart Opticals</p>
                    <div className="title-underline"></div>
                </div>
            </div>
            <div className="faq-content-container">
                <div className="faq-list-card">
                    {faqData.map((faq, index) => (
                        <FAQItem key={index} {...faq} />
                    ))}
                </div>
                
                <div className="cta-support">
                    <h3>Still have questions?</h3>
                    <p>Our support team is here to help you 10:00 AM - 08:00 PM</p>
                    <a href="https://wa.me/917871333302" target="_blank" rel="noopener noreferrer" className="support-wa-btn">
                        Chat on WhatsApp
                    </a>
                </div>
            </div>
            <Footers />
        </div>
    );
};

export default FAQ;
