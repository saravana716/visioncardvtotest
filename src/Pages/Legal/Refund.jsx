import React from 'react';
import LegalPage from './LegalPage';

const Refund = () => {
    const content = [
        {
            heading: "Refund and Return Policy",
            text: "Thank you for shopping with VisionKart. We value your satisfaction and strive to provide quality products. Please review our refund and return policy below."
        },
        {
            heading: "1. Returns",
            text: "We accept returns of products within 7 days of purchase.",
            list: [
                "Items must be unused, in their original packaging, and in the same condition as received.",
                "To complete your return, we require a receipt or proof of purchase.",
                "Non-returnable items: Custom-made prescription lenses, perishable goods, and personal care products."
            ]
        },
        {
            heading: "2. Refunds",
            text: "Once we receive and inspect your return, we will notify you of the approval or rejection of your refund.",
            list: [
                "Approved refunds will be processed within 7 business days.",
                "Refunds will be issued through the original payment method or a method communicated to you at the time of approval.",
                "A partial refund may be issued for items not in their original condition, damaged, or missing parts for reasons not due to our error."
            ]
        },
        {
            heading: "3. Service Cancellation",
            text: "For any scheduled services (like home try-ons), clients may cancel by providing notice at least 3 days in advance.",
            list: [
                "Cancellations made with sufficient notice will receive a full refund.",
                "Cancellations made less than 3 days before the service date may be subject to a cancellation fee."
            ]
        },
        {
            heading: "4. Exchanges",
            text: "To initiate a return or exchange, please contact our customer support at visionkart.onlinestore@gmail.com. Our team will guide you through the process and provide necessary instructions."
        },
        {
            heading: "5. Shipping Returns",
            text: "You are responsible for paying your own shipping costs for returning your item. Shipping costs are non-refundable."
        },
        {
            heading: "6. Force Majeure",
            text: "We are not liable for any delays in processing returns, exchanges, or refunds caused by circumstances beyond our reasonable control, including but not limited to natural disasters, strikes, or disruptions in transport or payment systems."
        },
        {
            heading: "7. Governing Law",
            text: "This Refund and Cancellation Policy shall be governed by and construed in accordance with the laws of India, including the Consumer Protection Act, 2019. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Sivakasi, Tamil Nadu, India."
        },
        {
            heading: "8. Contact Us",
            text: "For questions or concerns regarding this policy, please contact us at:",
            list: [
                "Email: visionkart.onlinestore@gmail.com",
                "Phone: +91 78713 33302",
                "Address: 19, Thiruthaangal Road, Near Senaithalaivar kalyana Mandapam, Sivakasi-626123"
            ]
        }
    ];

    return <LegalPage title="Refund & Return Policy" content={content} />;
};

export default Refund;
