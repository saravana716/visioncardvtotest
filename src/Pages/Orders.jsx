import React, { useState, useEffect } from 'react';
import { auth } from '../firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserOrders } from '../services/firestoreService';
import { getOrderLifecycleBucket } from '../shared/orders.js';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Components/Navbar/Navbar';
import Footers from '../Components/Footer/Footers';
import { 
    FaShoppingBag, 
    FaBox, 
    FaClock, 
    FaChevronRight, 
    FaMapMarkerAlt, 
    FaCreditCard, 
    FaReceipt,
    FaTruck,
    FaCheckCircle,
    FaTimesCircle
} from 'react-icons/fa';
import './Orders.css';
import Loader from '../Components/Loader/Loader';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const fetchedOrders = await getUserOrders(currentUser.uid);
                setOrders(fetchedOrders);
            } else {
                navigate('/login');
            }
            setTimeout(() => setLoading(false), 500);
        });
        return () => unsubscribe();
    }, [navigate]);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Processing';
        const date = timestamp.toDate();
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) return <Loader fullPage={true} />;

    return (
        <div className="orders-premium-page">
            <Navbar />
            <div className="orders-hero">
                <div className="hero-content reveal-in">
                    <nav className="mm-breadcrumb">
                        <span onClick={() => navigate('/')}>Home</span>
                        <FaChevronRight className="sep" />
                        <span onClick={() => navigate('/profile')}>Account</span>
                        <FaChevronRight className="sep" />
                        <span className="active">Order History</span>
                    </nav>
                    <div className="title-with-badge">
                        <h1>Order History</h1>
                        {orders.length > 0 && <span className="order-count-badge">{orders.length} Orders</span>}
                    </div>
                    <p>Detailed tracking and history for all your premium eyewear purchases.</p>
                </div>
            </div>

            <div className="orders-main-container">
                {orders.length === 0 ? (
                    <div className="empty-orders-state fade-in">
                        <div className="empty-icon-box">
                            <FaShoppingBag />
                        </div>
                        <h2>No orders yet</h2>
                        <p>Browse our collection and find your perfect pair.</p>
                        <button className="premium-btn" onClick={() => navigate('/products')}>Shop Collection</button>
                    </div>
                ) : (
                    <div className="orders-grid">
                        {orders.map((order) => {
                          // Normalize any status/fulfillment combination to one of
                          // pending | shipped | delivered | cancelled via the shared
                          // contract, so the badge and timeline handle every value
                          // the admin/storefront can write (Awaiting Payment, Pending,
                          // Cancelled, Returned, …) and never crash on a missing status.
                          const bucket = getOrderLifecycleBucket(order);
                          // Label for the badge/timeline. When the lifecycle is
                          // cancelled but the raw status isn't itself a
                          // cancel/return/refund word (cancellation inferred from
                          // fulfillmentStatus), show 'Cancelled' rather than a
                          // misleading value like 'Pending'.
                          const statusLabel = bucket === 'cancelled'
                            ? (/cancel|return|refund/i.test(order.status || '') ? order.status : 'Cancelled')
                            : (order.status || 'Processing');
                          return (
                            <div key={order.id} className="luxury-order-card fade-in">
                                {/* Glass Header */}
                                <div className="card-glass-header">
                                    <div className="header-meta-group">
                                        <div className="meta-box">
                                            <span className="meta-label">Reference</span>
                                            <span className="meta-value">#{order.id.slice(0, 8).toUpperCase()}</span>
                                        </div>
                                        <div className="meta-box">
                                            <span className="meta-label">Order Date</span>
                                            <span className="meta-value">{formatDate(order.createdAt)}</span>
                                        </div>
                                        <div className="meta-box">
                                            <span className="meta-label">Amount</span>
                                            <span className="meta-value">₹{order.amounts?.total?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className={`status-badge-luxury ${bucket}`}>
                                        {bucket === 'delivered' ? <FaCheckCircle /> :
                                         bucket === 'shipped' ? <FaTruck /> :
                                         bucket === 'cancelled' ? <FaTimesCircle /> : <FaClock />}
                                        <span>{statusLabel}</span>
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="card-flex-body">
                                    <div className="items-summary-list">
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className="luxury-item-row">
                                                <div className="item-visual-box">
                                                    <img src={item.productImage} alt={item.productName || 'Product'} loading="lazy" decoding="async" />
                                                </div>
                                                <div className="item-info-main">
                                                    <h4>{item.productName}</h4>
                                                    <p>{item.lensType} • {item.material}</p>
                                                </div>
                                                <div className="item-price-tag">
                                                    ₹{item.totalPrice?.toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mini Timeline Integrated */}
                                    <div className="mini-timeline-integrated">
                                        {bucket === 'cancelled' ? (
                                            <div className="timeline-step-pin cancelled active">
                                                <FaTimesCircle /> {statusLabel}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="timeline-step-pin active">
                                                    <FaCheckCircle /> Ordered
                                                </div>
                                                <div className={`timeline-step-pin ${bucket === 'shipped' || bucket === 'delivered' ? 'active' : ''}`}>
                                                    <FaTruck /> In Transit
                                                </div>
                                                <div className={`timeline-step-pin ${bucket === 'delivered' ? 'active' : ''}`}>
                                                    <FaBox /> Delivered
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Bottom Actions */}
                                <div className="luxury-card-actions">
                                    <button 
                                        className="action-btn-luxury outline"
                                        onClick={() => navigate(`/invoice/${order.id}`)}
                                    >
                                        <FaReceipt /> Invoice
                                    </button>
                                    <button 
                                        className="action-btn-luxury solid"
                                        onClick={() => navigate(`/orders/${order.id}`)}
                                    >
                                        View Details <FaChevronRight />
                                    </button>
                                </div>
                            </div>
                          );
                        })}
                    </div>
                )}
            </div>
            <Footers />
        </div>
    );
};

export default Orders;
