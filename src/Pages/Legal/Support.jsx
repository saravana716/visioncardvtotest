import React from 'react';
import LegalPage from './LegalPage';

const Support = () => {
    const content = [
        {
            heading: "1. Our Commitment",
            text: "VisionKart is committed to providing outstanding customer service and support for all your eyewear needs."
        },
        {
            heading: "2. Support Timings",
            text: "Our dedicated support team is available during the following hours:",
            list: [
                "10:00 AM – 08:00 PM (Monday to Saturday)",
                "Excluding Sundays and public holidays."
            ]
        },
        {
            heading: "3. Contact Channels",
            text: "Reach out to us through any of these convenient methods:",
            list: [
                "WhatsApp: +91 78713 33302",
                "Phone: +91 78713 33302",
                "Email: visionkart.onlinestore@gmail.com"
            ]
        },
        {
            heading: "4. Response Time",
            text: "We aim to respond to all queries and concerns within 24 hours of receiving them. If you contact us on a weekend or holiday, our team will get back to you on the next business day."
        },
        {
            heading: "5. Order Assistance",
            text: "For any issues related to your order, please have your Order ID ready to help our team assist you more effectively."
        },
        {
            heading: "6. Your Feedback",
            text: "We value your experience! Feel free to share your suggestions or feedback to help us improve our services."
        }
    ];

    return <LegalPage title="Customer Support Policy" content={content} />;
};

export default Support;
