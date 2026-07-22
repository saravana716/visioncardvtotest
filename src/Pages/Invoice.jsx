import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById } from '../services/firestoreService';
import { ORDER_STATUS } from '../shared/constants.js';
import { auth } from '../firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import { FaPrint, FaArrowLeft, FaCloudUploadAlt } from 'react-icons/fa';
import './Invoice.css';
import Loader from '../Components/Loader/Loader';
import logo from '../assets/vision_cart_logo.png';
import InvoiceDocument from '../Components/InvoiceDocument';
import { fulfillOrderInvoicing } from '../services/fulfillmentService';
import toast from 'react-hot-toast';

const Invoice = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

    const demoOrder = {
        id: "VC-DEMO-8829",
        createdAt: { toDate: () => new Date() },
        shippingAddress: {
            fullName: "Demo User",
            phone: "+91 98765 43210",
            address: "123, Test Street",
            city: "Sivakasi",
            zip: "626123",
            state: "Tamil Nadu",
            stateCode: "33"
        },
        items: [
            {
                productName: "Premium Blue Light Blockers",
                productBrand: "VisionKart",
                lensType: "Single Vision",
                totalPrice: "₹2,499"
            }
        ],
        amounts: {
            subtotal: 2231,
            tax: 268,
            total: 2499,
            taxDetails: { cgst: 134, sgst: 134, isIntraState: true }
        },
        paymentMethod: "UPI QR"
    };

    useEffect(() => {
        if (orderId === 'demo') {
            setOrder(demoOrder);
            setLoading(false);
            return;
        }

        let cancelled = false;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (cancelled) return;
            if (!user) {
                setOrder(null);
                setAccessDenied(true);
                setLoading(false);
                return;
            }
            const data = await getOrderById(orderId, user.uid);
            if (cancelled) return;
            if (!data) {
                setOrder(null);
                setAccessDenied(true);
                setLoading(false);
                return;
            }
            setOrder(data);
            setAccessDenied(false);
            setLoading(false);

            // Never generate/archive a GST tax invoice for an order whose
            // payment hasn't been confirmed — a customer who abandons the
            // CCAvenue redirect (order left 'Awaiting Payment') could otherwise
            // mint a tax invoice for goods they never paid for.
            const paymentUnconfirmed =
                data.status === ORDER_STATUS.AWAITING_PAYMENT ||
                data.status === ORDER_STATUS.AWAITING_VERIFICATION;

            // AUTO-SYNC LOGIC: If invoiceUrl is missing, secure it to the cloud now
            if (!data.invoiceUrl && !paymentUnconfirmed) {
                setIsSyncing(true);
                // Delay sync slightly to ensure the InvoiceDocument is fully rendered in the DOM
                setTimeout(async () => {
                    if (cancelled) return;
                    try {
                        await fulfillOrderInvoicing(orderId, 'invoice-capture-area');
                        if (cancelled) return;
                        setIsSyncing(false);
                        toast.success("Professional Invoice secured in cloud storage!");
                    } catch (err) {
                        console.error("[Auto-Sync] Failed:", err);
                        if (cancelled) return;
                        setIsSyncing(false);
                    }
                }, 3000);
            }
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [orderId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <Loader fullPage={true} />;

    if (accessDenied) {
        return (
            <div className="invoice-not-found">
                <h2>Invoice unavailable</h2>
                <p>Please sign in to the account that placed this order.</p>
                <button onClick={() => navigate('/login')}>Sign in</button>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="invoice-not-found">
                <h2>Invoice Error: Order Not Found</h2>
                <button onClick={() => navigate('/')}>Home</button>
            </div>
        );
    }

    return (
        <div className="corporate-invoice-container">
            {/* Action Bar */}
            <div className="invoice-controls no-print">
                <button className="back-link" onClick={() => navigate(-1)}><FaArrowLeft /> Back</button>
                
                <div className="sync-status-indicator">
                    {isSyncing ? (
                        <span className="syncing-text"><FaCloudUploadAlt className="spin" /> Securing to Cloud...</span>
                    ) : order.invoiceUrl ? (
                        <span className="synced-text">✓ Cloud Secured</span>
                    ) : null}
                </div>

                <button 
                    className="print-btn-corporate" 
                    onClick={handlePrint}
                    disabled={isSyncing}
                >
                    <FaPrint /> Print / Save as PDF
                </button>
            </div>

            <InvoiceDocument order={order} id="invoice-capture-area" />
        </div>
    );
};

export default Invoice;
