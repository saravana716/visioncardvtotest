import React from 'react';
import LegalPage from './LegalPage';

const Privacy = () => {
    const content = [
        {
            heading: "Introduction",
            text: "VisionKart is committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your personal information when you visit our website https://www.visionkart.online or use our services."
        },
        {
            heading: "1. Information We Collect",
            text: "We may collect the following information:",
            list: [
                "Personal Information: Name, email address, phone number, and other details you provide during checkout, or service requests.",
                "Payment Information: We use third-party payment processors (CCAvenue, PayU) and do not store your full card or bank account details on our servers.",
                "Usage Data: Information about how you use our website, including IP address, browser type, pages visited, and time spent on pages.",
                "Cookies: We use cookies to enhance your browsing experience. You can choose to disable cookies through your browser settings."
            ]
        },
        {
            heading: "2. How We Use Your Information",
            text: "We use the collected information to:",
            list: [
                "Process and fulfil orders and deliver services.",
                "Communicate with you about your orders, inquiries, or other requests.",
                "Improve our website and services.",
                "Send promotional emails or newsletters, if you have opted in."
            ]
        },
        {
            heading: "3. Sharing Your Information",
            text: "We do not sell or rent your personal information to third parties. We may share your information with:",
            list: [
                "Service Providers: Third-party vendors who assist us in operating our website (e.g., shipping partners, payment gateways).",
                "Legal Requirements: If required by law, we may disclose your information to comply with legal obligations or protect our rights."
            ]
        },
        {
            heading: "4. Data Security",
            text: "We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction using industry-standard encryption and security protocols."
        },
        {
            heading: "5. Data Retention",
            text: "We retain your personal information only as long as necessary to fulfil the purposes described in this policy or to comply with legal requirements. Afterward, data is securely deleted or anonymized."
        },
        {
            heading: "6. Changes to This Policy",
            text: "We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date."
        },
        {
            heading: "7. Your Rights",
            text: "You have the right to access, correct, or delete your personal information. To exercise these rights, please contact us at visionkart.onlinestore@gmail.com. We will respond within 7 business days."
        },
        {
            heading: "8. Your Privacy Matters to Us",
            text: "In accordance with the Information Technology Act, 2000 and applicable rules, we are committed to addressing any concerns or feedback you may have regarding this Privacy Policy or the handling of your personal information. For any privacy-related questions, concerns, or feedback, please contact us at:",
            list: [
                "Email: visionkart.onlinestore@gmail.com",
                "Phone: +91 78713 33302",
                "Address: 19, Thiruthaangal Road, Near Senaithalaivar kalyana Mandapam, Sivakasi-626123"
            ]
        }
    ];

    return <LegalPage title="Privacy Policy" content={content} />;
};

export default Privacy;
