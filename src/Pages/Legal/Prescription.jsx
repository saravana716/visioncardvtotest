import React from 'react';
import LegalPage from './LegalPage';

const Prescription = () => {
    const content = [
        {
            heading: "1. Valid Prescription Required",
            text: "To ensure the safety and clarity of your vision, VisionKart requires a valid prescription from a certified eye care professional for all prescription eyewear orders."
        },
        {
            heading: "2. Accuracy of Information",
            text: "It is the customer's responsibility to provide accurate prescription details, including Power (DSPH, DCYL, Axis) and Pupillary Distance (PD).",
            list: [
                "You can upload a clear photo of your prescription during the order process.",
                "Alternatively, you can enter the details manually."
            ]
        },
        {
            heading: "3. Prescription Validity",
            text: "We strongly recommend using a prescription that is less than one year old. Your vision can change over time, and an outdated prescription may cause discomfort or headaches."
        },
        {
            heading: "4. Our Responsibility",
            text: "VisionKart is not responsible for any issues resulting from an incorrect prescription provided by the customer or the prescribing doctor.",
            list: [
                "If we notice any inconsistencies in the prescription you provided, our opticians will contact you for clarification."
            ]
        },
        {
            heading: "5. Professional Eye Tests",
            text: "If you are unsure of your current prescription or if it has been more than a year since your last eye test, we highly suggest visiting an optometrist before placing your order."
        },
        {
            heading: "6. Questions?",
            text: "If you have any trouble reading your prescription or uploading it, please reach out to our customer support via WhatsApp or Phone."
        }
    ];

    return <LegalPage title="Prescription Policy" content={content} />;
};

export default Prescription;
