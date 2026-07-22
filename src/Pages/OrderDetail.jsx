import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById } from '../services/firestoreService';
import { getOrderLifecycleBucket } from '../shared/orders.js';
import { parsePriceToInt } from '../utils/price';
import { auth } from '../firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '../Components/Navbar/Navbar';
import Footers from '../Components/Footer/Footers';
import { 
    FaArrowLeft, 
    FaBox, 
    FaMapMarkerAlt, 
    FaCreditCard, 
    FaClock, 
    FaCheckCircle, 
    FaChevronRight, 
    FaTruck,
    FaFileInvoice,
    FaTimesCircle
} from 'react-icons/fa';
import './OrderDetail.css';
import Loader from '../Components/Loader/Loader';

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);

    useEffect(() => {
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
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [orderId]);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Processing';
        const date = timestamp.toDate();
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <Loader fullPage={true} />;

    if (accessDenied) {
        return (
            <div className="order-details-error">
                <Navbar />
                <div className="error-content">
                    <h2>Order unavailable</h2>
                    <p>Please sign in to the account that placed this order.</p>
                    <button onClick={() => navigate('/login')}>Sign in</button>
                </div>
                <Footers />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="order-details-error">
                <Navbar />
                <div className="error-content">
                    <h2>Order Not Found</h2>
                    <p>The requested order reference could not be retrieved.</p>
                    <button onClick={() => navigate('/orders')}>Back to History</button>
                </div>
                <Footers />
            </div>
        );
    }

    // Normalize status/fulfillment to one lifecycle bucket for the tracking UI.
    const bucket = getOrderLifecycleBucket(order);
    // When cancellation is inferred from fulfillmentStatus, the raw status may
    // still be e.g. 'Pending'; show 'Cancelled' unless the status itself reads
    // as a cancel/return/refund.
    const cancelledLabel = /cancel|return|refund/i.test(order.status || '')
        ? order.status
        : 'Cancelled';

    return (
        <div className="order-detail-page">
            <Navbar />

            <div className="order-detail-hero">
                <div className="hero-content reveal-in">
                    <nav className="mm-breadcrumb">
                        <span onClick={() => navigate('/')}>Home</span>
                        <FaChevronRight className="sep" />
                        <span onClick={() => navigate('/profile')}>Account</span>
                        <FaChevronRight className="sep" />
                        <span onClick={() => navigate('/orders')}>Order History</span>
                        <FaChevronRight className="sep" />
                        <span className="active">Order Ref</span>
                    </nav>
                    <div className="title-with-badge">
                        <h1>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
                        <span className="order-count-badge">Active</span>
                        <button className="invoice-action-btn-hero" onClick={() => navigate(`/invoice/${order.id}`)}>
                            <FaFileInvoice /> Invoice
                        </button>
                    </div>
                    <p>Detailed tracking and financial breakdown for your premium eyewear purchase.</p>
                </div>
            </div>

            <main className="detail-container">

                <div className="tracking-card-luxury fade-in">
                    <div className="tracking-progress-neat">
                        {bucket === 'cancelled' ? (
                            <div className="step-luxury cancelled completed">
                                <div className="icon-wrap"><FaTimesCircle /></div>
                                <span>{cancelledLabel}</span>
                            </div>
                        ) : (
                            <>
                                <div className="step-luxury completed">
                                    <div className="icon-wrap"><FaCheckCircle /></div>
                                    <span>Confirmed</span>
                                </div>
                                <div className={`step-luxury ${['shipped', 'delivered'].includes(bucket) ? 'completed' : ''}`}>
                                    <div className="icon-wrap"><FaTruck /></div>
                                    <span>In Transit</span>
                                </div>
                                <div className={`step-luxury ${bucket === 'delivered' ? 'completed' : ''}`}>
                                    <div className="icon-wrap"><FaBox /></div>
                                    <span>Delivered</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="detail-split-layout reveal-up">
                    <div className="left-column">
                        <section className="item-details-card">
                            <div className="card-header">
                                <h3><FaBox /> Order Composition</h3>
                                <span className="item-count">{order.items?.length} Items</span>
                            </div>
                            <div className="items-list-luxury">
                                {order.items?.map((item, idx) => {
                                    const qty = Math.max(1, Number(item.quantity) || 1);
                                    const lineTotal = parsePriceToInt(item.totalPrice) * qty;
                                    return (
                                    <div key={idx} className="item-row-luxury">
                                        <div className="item-img-container">
                                            <img src={item.productImage} alt={item.productName} loading="lazy" decoding="async" />
                                        </div>
                                        <div className="item-info-luxury">
                                            <h4>{item.productName}</h4>
                                            <div className="item-tags-luxury">
                                                <span>{item.category || 'Eyewear'}</span>
                                                <span>{item.lensType || 'Frame Only'}</span>
                                                <span>{item.material || 'Standard'}</span>
                                                <span className="gst-tag">GST {item.gstRate || 0}%</span>
                                            </div>
                                        </div>
                                        <div className="item-price-luxury">
                                            <p className="qty-luxury">Qty: {qty}</p>
                                            <p className="price-luxury">₹{lineTotal.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    <div className="right-column">
                        <section className="info-card-premium">
                            <div className="card-header">
                                <h3><FaMapMarkerAlt /> Shipping To</h3>
                            </div>
                            <div className="address-display">
                                <h4>{order.shippingAddress?.fullName}</h4>
                                <p>{order.shippingAddress?.address}</p>
                                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zip}</p>
                                <div className="contact-details-row">
                                    <p><span>Phone:</span> {order.shippingAddress?.phone || order.billingAddress?.phone}</p>
                                    <p><span>Email:</span> {order.billingAddress?.email}</p>
                                </div>
                                <div className="expected-delivery-row">
                                    <FaClock /> <span>Expected in 3-5 Business Days</span>
                                </div>
                            </div>
                        </section>

                        <section className="info-card-premium billing-card-extra">
                            <div className="card-header">
                                <h3><FaFileInvoice /> Billing Details</h3>
                            </div>
                            <div className="address-display">
                                <h4>{order.billingAddress?.fullName}</h4>
                                <p>{order.billingAddress?.address}</p>
                                <p>{order.billingAddress?.city}, {order.billingAddress?.state} - {order.billingAddress?.zip}</p>
                                <div className="contact-details-row">
                                    <p><span>Phone:</span> {order.billingAddress?.phone}</p>
                                    <p><span>Email:</span> {order.billingAddress?.email}</p>
                                </div>
                                <div className="payment-label-badge">{order.paymentMethod}</div>
                            </div>
                        </section>

                        <section className="payment-card-premium">
                            <div className="card-header">
                                <h3><FaCreditCard /> Financial Summary</h3>
                            </div>
                            <div className="summary-list">
                                <div className="summary-row">
                                    <span>Base Subtotal</span>
                                    <span>₹{order.amounts?.rawSubtotal?.toLocaleString() || order.amounts?.subtotal?.toLocaleString()}</span>
                                </div>
                                {order.amounts?.discount > 0 && (
                                    <div className="summary-row discount-row">
                                        <span>Coupon Discount</span>
                                        <span>-₹{order.amounts?.discount?.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="summary-divider"></div>
                                
                                <div className="summary-row total-tax-row">
                                    <span>Total Applicable GST</span>
                                    <span>₹{order.amounts?.tax?.toLocaleString()}</span>
                                </div>

                                <div className="summary-row highlight">
                                    <span>Delivery Charges</span>
                                    <span>FREE</span>
                                </div>
                                <div className="grand-total-row">
                                    <div className="total-label">Grand Total</div>
                                    <div className="total-value">₹{order.amounts?.total?.toLocaleString()}</div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <Footers />
        </div>
    );
};

export default OrderDetail;
