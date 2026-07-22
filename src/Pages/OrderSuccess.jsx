import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '../Components/Navbar/Navbar';
import Footers from '../Components/Footer/Footers';
import { FaCheckCircle, FaShoppingBag, FaPrint, FaCloudUploadAlt, FaFilePdf, FaClock } from 'react-icons/fa';
import './OrderSuccess.css';
import { getOrderById } from '../services/firestoreService';
import { ORDER_STATUS } from '../shared/constants.js';
import { auth } from '../firebase.config';
import { useCart } from '../context/CartContext';
import InvoiceDocument from '../Components/InvoiceDocument';
import { fulfillOrderInvoicing } from '../services/fulfillmentService';
import { config } from '../config';
import toast from 'react-hot-toast';

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = location.state?.orderId || searchParams.get('order_id');

    const [order, setOrder] = useState(null);
    const [status, setStatus] = useState('pending'); // pending, generating, complete, error
    const [invoiceUrl, setInvoiceUrl] = useState(null);
    const [syncError, setSyncError] = useState(null);
    const [accessDenied, setAccessDenied] = useState(false);
    const { clearCart } = useCart();

    useEffect(() => {
        if (!orderId) return;

        let cancelled = false;
        let timeoutId = null;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (cancelled) return;
            if (!user) {
                setAccessDenied(true);
                setStatus('error');
                return;
            }

            // WAKE UP PING: Force Render backend to wake up so the email listener starts
            try {
                fetch(`${config.paymentBackendUrl}/email/smtp`).catch(() => {});
            } catch {
                // Wake-up ping is best-effort; ignore failures.
            }

            try {
                const orderData = await getOrderById(orderId, user.uid);
                if (cancelled) return;
                if (!orderData) {
                    setAccessDenied(true);
                    setStatus('error');
                    return;
                }
                setOrder(orderData);

                if (orderData.invoiceUrl) {
                    // Order is paid and fulfilled — make sure the cart is empty
                    // (the CCAvenue return path doesn't clear it otherwise, which
                    // left customers able to re-purchase the same items).
                    clearCart();
                    setInvoiceUrl(orderData.invoiceUrl);
                    setStatus('complete');
                    return;
                }

                // Do NOT declare success or generate a GST tax invoice for an
                // order whose payment hasn't been confirmed. A failed/abandoned
                // CCAvenue redirect (or a UPI order pending manual verification)
                // still lands here; the backend flips the status once payment is
                // confirmed. Until then, show a "confirming payment" state.
                if (
                    orderData.status === ORDER_STATUS.AWAITING_PAYMENT ||
                    orderData.status === ORDER_STATUS.AWAITING_VERIFICATION
                ) {
                    // Payment not yet confirmed — leave the cart intact so an
                    // abandoned/failed payment doesn't lose the customer's items.
                    setStatus('awaiting');
                    return;
                }

                // A failed or cancelled order must never be treated as paid:
                // visiting /order-success?order_id=... directly for such an
                // order used to fall through to the confirmed branch — clearing
                // the cart, minting a GST tax invoice, and re-arming the
                // confirmation email for an order that was never paid. Send the
                // customer to the failure page (which offers retry) instead.
                if (
                    orderData.status === ORDER_STATUS.PAYMENT_FAILED ||
                    orderData.status === ORDER_STATUS.CANCELLED
                ) {
                    navigate(
                        `/order-failed?order_id=${encodeURIComponent(orderId)}&status=${encodeURIComponent(orderData.status)}`,
                        { replace: true }
                    );
                    return;
                }

                // Payment confirmed — clear the purchased items from the cart.
                clearCart();
                setStatus('generating');
                timeoutId = setTimeout(async () => {
                    if (cancelled) return;
                    try {
                        const url = await fulfillOrderInvoicing(orderId, 'hidden-invoice-capture');
                        if (cancelled) return;
                        setInvoiceUrl(url);
                        setStatus('complete');
                        toast.success("Invoice synced to cloud!");
                    } catch (err) {
                        console.error("Fulfillment failed:", err);
                        if (cancelled) return;
                        setSyncError(err.message || "Capture/Storage error");
                        setStatus('error');
                    }
                }, 3000);
            } catch (err) {
                console.error("Order fetch failed:", err);
                if (cancelled) return;
                setSyncError(err.message || "Failed to load order");
                setStatus('error');
            }
        });

        return () => {
            cancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
            unsubscribe();
        };
    }, [orderId]);

    const handleManualSync = async () => {
        if (!orderId || status === 'generating') return;
        setStatus('generating');
        try {
            console.log("Retrying manual cloud sync...");
            const url = await fulfillOrderInvoicing(orderId, 'hidden-invoice-capture');
            setInvoiceUrl(url);
            setStatus('complete');
            toast.success("Invoice synced manually!");
        } catch (err) {
            console.error("Manual sync failed:", err);
            setSyncError(err.message);
            setStatus('error');
            toast.error("Cloud storage sync failed.");
        }
    };

    const handleDownload = () => {
        if (invoiceUrl) {
            window.open(invoiceUrl, '_blank');
        } else {
            // Fallback to manual print page if cloud URL is missing
            navigate(`/invoice/${orderId}`);
        }
    };

    const awaiting = status === 'awaiting';

    if (accessDenied) {
        return (
            <div className="success-page">
                <Navbar />
                <div className="success-container">
                    <div className="success-card fade-in" style={{ textAlign: 'center' }}>
                        <h1>Order unavailable</h1>
                        <p>Please sign in to the account that placed this order.</p>
                        <button className="continue-shopping-btn" onClick={() => navigate('/login')}>
                            Sign in
                        </button>
                    </div>
                </div>
                <Footers />
            </div>
        );
    }

    // Until the order (and thus its payment status) has loaded, show a neutral
    // loading state — never the success header or invoice actions. Prevents a
    // brief false-success flash (and a fast click into the invoice route)
    // during the initial 'pending' status before getOrderById resolves.
    if (status === 'pending') {
        return (
            <div className="success-page">
                <Navbar />
                <div className="success-container">
                    <div className="success-card fade-in" style={{ textAlign: 'center' }}>
                        <div className="success-icon pending"><FaClock /></div>
                        <h1>Loading your order…</h1>
                        <p className="order-id">Order ID: <span>#{orderId}</span></p>
                    </div>
                </div>
                <Footers />
            </div>
        );
    }

    return (
        <div className="success-page">
            <Navbar />

            {/* Hidden Invoice for Background PDF Capture - Positioned off-screen but visible to the engine */}
            <div 
                id="invoice-capture-container"
                style={{ 
                    position: 'fixed', 
                    left: '-10000px', 
                    top: '0', 
                    width: '794px', // A4 Width in pixels at 96 DPI
                    background: '#fff',
                    zIndex: -1
                }}
            >
                {order && !awaiting && <InvoiceDocument order={order} id="hidden-invoice-capture" />}
            </div>

            <div className="success-container">
                <div className="success-card fade-in">
                    <div className={`success-icon ${awaiting ? 'pending' : ''}`}>
                        {awaiting ? <FaClock /> : <FaCheckCircle />}
                    </div>
                    <h1>{awaiting ? 'Confirming Your Payment' : 'Order Placed Successfully!'}</h1>
                    <p className="order-id">Order ID: <span>#{orderId}</span></p>

                    {awaiting ? (
                        <>
                            <div className="fulfillment-status-bar">
                                <p className="status-loading">
                                    <FaClock /> Waiting for payment confirmation. Your tax invoice
                                    will be available here once the payment is verified.
                                </p>
                            </div>

                            <p className="success-msg">
                                We haven't received confirmation of your payment yet. If you completed
                                the payment, it can take a moment to verify — check <strong>My Orders</strong>
                                shortly. If the payment failed or you cancelled, you can retry from your cart.
                            </p>

                            <div className="success-actions">
                                <button className="view-orders-btn" onClick={() => navigate('/orders')}>
                                    <FaShoppingBag /> My Orders
                                </button>
                                <button className="continue-btn" onClick={() => navigate('/')}>
                                    Continue Shopping
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="fulfillment-status-bar">
                                {status === 'generating' && (
                                    <p className="status-loading">
                                        <FaCloudUploadAlt className="spin" />
                                        Generating professional GST invoice...
                                    </p>
                                )}
                                {status === 'complete' && (
                                    <p className="status-complete">
                                        <FaFilePdf />
                                        Government-ready invoice is secured in your account.
                                    </p>
                                )}
                                {status === 'error' && (
                                    <div className="status-error-group">
                                        <p className="status-error">Note: Cloud sync issue ({syncError || 'timeout'}).</p>
                                        <button className="retry-sync-link" onClick={handleManualSync}>
                                            Try Syncing Again
                                        </button>
                                    </div>
                                )}
                            </div>

                            <p className="success-msg">
                                Thank you for shopping with VisionCart! Your eyewear is being processed
                                and will be shipped shortly. You can now download your official Tax Invoice.
                            </p>

                            <div className="success-actions">
                                <button className="view-orders-btn" onClick={() => navigate('/orders')}>
                                    <FaShoppingBag /> My Orders
                                </button>

                                <button
                                    className={`invoice-btn-luxury ${status === 'complete' ? 'success' : ''}`}
                                    onClick={handleDownload}
                                >
                                    {status === 'generating' ? (
                                        <><span className="mini-loader"></span> Processing...</>
                                    ) : (
                                        <><FaPrint /> {status === 'complete' ? 'Download PDF Invoice' : 'View & Print Invoice'}</>
                                    )}
                                </button>

                                <button className="continue-btn" onClick={() => navigate('/')}>
                                    Continue Shopping
                                </button>
                            </div>
                        </>
                    )}

                    {!awaiting && (
                        <div className="estimated-delivery">
                            <p>Estimated Delivery: <span>3-5 Business Days</span></p>
                        </div>
                    )}
                </div>
            </div>
            <Footers />
        </div>
    );
};

export default OrderSuccess;
