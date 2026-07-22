import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { storage, db } from '../firebase.config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * Captures a DOM element and generates a professional PDF
 * @param {string} elementId - The ID of the DOM element to capture
 * @param {string} fileName - The name of the resulting PDF file
 * @returns {Promise<Blob>} - Resolves with the PDF Blob
 */
export const generateInvoicePDF = async (elementOrId, fileName = 'Invoice.pdf') => {
    const element = typeof elementOrId === 'string' 
        ? document.getElementById(elementOrId) 
        : elementOrId;
        
    if (!element) throw new Error("Invoice element not found");

    // Temporarily hide elements with 'no-print' class for a cleaner PDF
    const noPrintElements = element.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.style.display = 'none');

    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Higher resolution
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        // Restore no-print elements
        noPrintElements.forEach(el => el.style.display = '');

        return pdf.output('blob');
    } catch (error) {
        noPrintElements.forEach(el => el.style.display = '');
        throw error;
    }
};

/**
 * Wait for an element to appear in the DOM with a timeout
 */
const waitForElement = (id, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            const el = document.getElementById(id);
            if (el) {
                console.log(`[Fulfillment] Found element ${id} after ${Date.now() - start}ms`);
                resolve(el);
            } else if (Date.now() - start > timeout) {
                reject(new Error(`Invoice element #${id} not found in ${timeout}ms`));
            } else {
                requestAnimationFrame(check);
            }
        };
        check();
    });
};

/**
 * Full Professional Fulfillment Flow: PDF -> Storage -> Firestore
 * @param {string} orderId - The unique ID of the order
 * @param {string} elementId - The ID of the invoice element to capture
 */
export const fulfillOrderInvoicing = async (orderId, elementId) => {
    try {
        console.log(`[Fulfillment] Starting professional sync for ${orderId}...`);
        
        // Step 1: Wait for DOM element to be ready
        console.log(`[Fulfillment] Step 1: Waiting for DOM element #${elementId}...`);
        const element = await waitForElement(elementId);
        
        // Step 2: Capture Snapshot
        console.log("[Fulfillment] Step 2: Capturing snapshot...");
        const pdfBlob = await generateInvoicePDF(element, `Invoice-${orderId}.pdf`);
        console.log(`[Fulfillment] Step 2: PDF Blob generated (Size: ${pdfBlob.size} bytes)`);
        
        // 2. Upload to Firebase Storage
        console.log(`[Fulfillment] Step 3: Uploading to Storage...`);
        const storageRef = ref(storage, `invoices/${orderId}.pdf`);
        const snapshot = await uploadBytes(storageRef, pdfBlob, {
            contentType: 'application/pdf'
        });
        
        // 3. Get Download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log(`[Fulfillment] Step 4: Download URL obtained: ${downloadURL}`);
        
        // 4. Update Firestore Order
        console.log(`[Fulfillment] Step 5: Updating Firestore document...`);
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
            invoiceUrl: downloadURL,
            fulfillmentStatus: 'Invoice Generated',
            confirmationEmailSent: false // UNBLOCK email listener now that invoice is ready
        });

        console.log("[Fulfillment] Success! Everything synced.");
        return downloadURL;
    } catch (error) {
        console.error("[Fulfillment] CRITICAL FAILURE:", error);
        throw error;
    }
};
