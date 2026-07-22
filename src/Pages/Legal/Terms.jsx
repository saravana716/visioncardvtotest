import React from 'react';
import LegalPage from './LegalPage';

const Terms = () => {
    const content = [
        {
            heading: "Legal Information",
            text: "This document is an electronic record generated under the provisions of the Information Technology Act, 2000 and the applicable rules, including any amendments. This document is published in line with Rule 3(1) of the Information Technology (Intermediaries Guidelines) Rules, 2011, which mandates the publication of the website’s terms of use, privacy policy, and rules for user access and interaction on https://www.visionkart.online."
        },
        {
            heading: "1. Introduction",
            text: "These terms and conditions shall govern your use of our website.",
            list: [
                "By using our website, you accept these terms and conditions in full; accordingly, if you disagree with these terms and conditions or any part of these terms and conditions, you must not use our website.",
                "If you register with our website, submit any material to our website or use any of our website services, we will ask you to expressly agree to these terms and conditions.",
                "By using our website or agreeing to these terms and conditions, you warrant and represent to us that you are at least 18 years of age.",
                "Our website uses cookies; by using our website or agreeing to these terms and conditions, you consent to our use of cookies in accordance with the terms of our privacy policy."
            ]
        },
        {
            heading: "2. Acceptable Use",
            text: "You must not:",
            list: [
                "Use our website in any way or take any action that causes, or may cause, damage to the website or impairment of the performance, availability or accessibility of the website.",
                "Use our website in any way that is unlawful, illegal, fraudulent or harmful, or in connection with any unlawful, illegal, fraudulent or harmful purpose or activity.",
                "Use our website to copy, store, host, transmit, send, use, publish or distribute any material which consists of (or is linked to) any spyware, computer virus, Trojan horse, worm, keystroke logger, rootkit or other malicious computer software.",
                "Conduct any systematic or automated data collection activities (including without limitation scraping, data mining, data extraction and data harvesting) on or in relation to our website without our express written consent.",
                "Access or otherwise interact with our website using any robot, spider or other automated means except for the purpose of search engine indexing.",
                "Use data collected from our website for any direct marketing activity (including without limitation email marketing, SMS marketing, telemarketing and direct mailing).",
                "Ensure that all the information you supply to us through our website is true, accurate, current, complete and non-misleading."
            ]
        },
        {
            heading: "3. User Accounts",
            text: "To access certain features, you may need to create an account. You are responsible for maintaining the confidentiality of your account details and are fully responsible for all activities that occur under your account. We may:",
            list: [
                "Suspend or cancel your account at any time in our sole discretion without notice or explanation.",
                "Edit your account details at our discretion.",
                "You may cancel your account on our website using your account control panel."
            ]
        },
        {
            heading: "4. Product & Service Information",
            text: "We aim to provide accurate descriptions and pricing of our products and services on the website. However, we do not guarantee that the information, including availability and pricing, is always accurate, complete, or current. We reserve the right to correct errors and update information without prior notice."
        },
        {
            heading: "5. Third-Party Links",
            text: "Our website may contain links to third-party websites that are not under our control. We are not responsible for the content, policies, or practices of these external sites. Accessing third-party links is at your own risk."
        },
        {
            heading: "6. Intellectual Property Rights",
            text: "All content on this site — including text, images, graphics, logos, and software — is owned or licensed by VisionKart and protected by applicable intellectual property laws. You may not reproduce, distribute, or use our content without our prior written consent."
        },
        {
            heading: "7. Limitation of Liability",
            text: "To the extent permitted by law, VisionKart shall not be liable for any indirect, incidental, or consequential damages arising out of or related to your use of the website, including but not limited to damages for loss of profits, data, or other intangible losses."
        },
        {
            heading: "8. Disclaimer of Warranties",
            text: "This website is provided 'as is' and 'as available' without any warranties of any kind, either express or implied. We do not guarantee that the site will always be available, secure, or free from errors or viruses."
        },
        {
            heading: "9. Indemnity",
            text: "You agree to indemnify, defend, and hold harmless VisionKart and its affiliates, directors, officers, employees, and agents from and against all claims, liabilities, damages, losses, or expenses, including reasonable legal fees, arising out of your use of the website or your violation of these Terms & Conditions."
        },
        {
            heading: "10. Governing Law",
            text: "These Terms & Conditions shall be governed by and interpreted in accordance with the laws of India, without regard to its conflict of law principles. Any disputes arising from or relating to these terms, your use of the website, or our services shall be subject to the exclusive jurisdiction of the courts located in Sivakasi, Tamil Nadu, India."
        },
        {
            heading: "11. Contact Us",
            text: "If you have any questions or concerns about these Terms & Conditions, please contact us at:",
            list: [
                "Email: visionkart.onlinestore@gmail.com",
                "Phone: +91 78713 33302",
                "Address: 19, Thiruthaangal Road, Near Senaithalaivar kalyana Mandapam, Sivakasi-626123"
            ]
        }
    ];

    return <LegalPage title="Terms & Conditions" content={content} />;
};

export default Terms;
