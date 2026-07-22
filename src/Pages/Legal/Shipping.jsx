import React from 'react';
import LegalPage from './LegalPage';

const Shipping = () => {
    const content = [
        {
            heading: "Shipping & Delivery Policy",
            text: "VisionKart is committed to delivering your orders accurately, in good condition, and always on time at the address you provide."
        },
        {
            heading: "1. Shipping Coverage",
            text: "We ship to almost all locations across India. We use reliable courier partners to ensure safe delivery."
        },
        {
            heading: "2. Shipping Timelines",
            list: [
                "Orders for frames without lenses are typically shipped within 24-48 hours.",
                "Orders with prescription lenses may take 3-5 business days for processing and lens fitting.",
                "Estimated delivery time is 5-7 business days across India, depending on the location."
            ]
        },
        {
            heading: "3. Shipping Charges",
            list: [
                "Shipping charges are calculated at checkout based on your location and the product weight.",
                "We may offer free shipping on orders above a certain value as part of promotional offers."
            ]
        },
        {
            heading: "4. Tracking Your Order",
            text: "While we aim for timely delivery, delays may occur due to logistics issues, extreme weather conditions, or public holidays. We appreciate your patience in such cases."
        },
        {
            heading: "6. Damages During Transit",
            text: "If you receive a package that is visibly damaged, please do not accept the delivery and contact our support team immediately."
        }
    ];

    return <LegalPage title="Shipping & Delivery Policy" content={content} />;
};

export default Shipping;
