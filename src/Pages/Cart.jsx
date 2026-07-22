import React, { useState } from 'react';
import Navbar from '../Components/Navbar/Navbar';
import Footers from '../Components/Footer/Footers';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { FaTrashAlt, FaRegFileAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getCoupon } from '../services/firestoreService';
import { parsePriceToInt } from '../utils/price';
import Loader from '../Components/Loader/Loader';
import './Cart.css';

const Cart = () => {
    const { cartItems, removeItemFromCart, updateItemQuantity, cartCount, user, loading } = useCart();
    const qtyOf = (item) => Math.max(1, Number(item.quantity) || 1);
    const navigate = useNavigate();
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState(null);

    const handleApplyCoupon = async () => {
        const code = couponCode.toUpperCase();
        try {
            const couponData = await getCoupon(code);
            if (couponData) {
                if (!couponData.active) {
                    toast.error("This coupon is no longer active.");
                    return;
                }
                // Expiry is optional in the admin — a blank/null expiryDate means
                // "never expires". Only enforce when a valid date is present
                // (new Date(null) is 1970 and would reject every no-expiry coupon).
                // Parse the admin's 'YYYY-MM-DD' as LOCAL end-of-day so it doesn't
                // expire a day early for users in negative UTC offsets.
                if (couponData.expiryDate) {
                    const expiry = /^\d{4}-\d{2}-\d{2}$/.test(couponData.expiryDate)
                        ? new Date(`${couponData.expiryDate}T23:59:59.999`)
                        : new Date(couponData.expiryDate);
                    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
                        toast.error("This coupon has expired.");
                        return;
                    }
                }
                if (subtotal < (couponData.minOrderAmount || 0)) {
                    toast.error(`Minimum order of ₹${couponData.minOrderAmount} required.`);
                    return;
                }

                let disc = 0;
                const value = Number(couponData.discountValue) || 0;
                if (couponData.discountType === 'percentage') {
                    disc = Math.round(subtotal * (value / 100));
                } else if (couponData.discountType === 'fixed' || couponData.discountType === 'flat') {
                    // Admin writes 'fixed'; accept legacy 'flat' too. Round to whole
                    // rupees so fractional coupon values don't leak into the total.
                    disc = Math.round(value);
                }
                // Never let a coupon exceed the cart value (fixed coupon > subtotal
                // or a >100% value) — that would produce a negative total.
                disc = Math.max(0, Math.min(disc, subtotal));

                setDiscount(disc);
                setAppliedCoupon(code);
                toast.success(`Coupon Applied! ₹${disc} Off`);
            } else {
                toast.error("Invalid Coupon Code");
            }
        } catch (error) {
            console.error("Error applying coupon:", error);
            toast.error("Failed to apply coupon");
        }
    };

    const removeCoupon = () => {
        setDiscount(0);
        setAppliedCoupon(null);
        setCouponCode('');
        toast.success("Coupon Removed");
    };

    const calculateTotal = () => {
        let rawSubtotal = 0;
        let originalTax = 0;
        cartItems.forEach(item => {
            const price = parsePriceToInt(item.totalPrice) * qtyOf(item);
            rawSubtotal += price;
            const rate = (item.category === 'Sunglasses') ? 0.18 : 0.12;
            originalTax += price * rate;
        });

        // Guard against a stale discount exceeding a since-reduced cart.
        const discountedSubtotal = Math.max(0, rawSubtotal - discount);
        const discountFactor = rawSubtotal > 0 ? discountedSubtotal / rawSubtotal : 1;

        let totalTax = 0;
        cartItems.forEach(item => {
            const originalPrice = parsePriceToInt(item.totalPrice) * qtyOf(item);
            const discountedPrice = originalPrice * discountFactor;
            const rate = (item.category === 'Sunglasses') ? 0.18 : 0.12;
            totalTax += discountedPrice * rate;
        });

        return {
            subtotal: Math.round(rawSubtotal),
            tax: Math.round(totalTax),
            originalTotal: Math.round(rawSubtotal + originalTax),
            total: Math.round(discountedSubtotal + totalTax)
        };
    };

    const { subtotal, tax, originalTotal, total } = calculateTotal();

    if (loading) {
        return (
            <div className="cart-page-wrapper">
                <Navbar />
                <Loader />
                <Footers />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="cart-page-wrapper">
                <Navbar />
                <div className="empty-cart-container">
                    <div className="empty-cart-box">
                        <h2>Sign in to view your cart</h2>
                        <p>Your saved items are tied to your account — sign in to pick up where you left off.</p>
                        <button className="start-shopping-btn" onClick={() => navigate('/login')}>Sign in</button>
                    </div>
                </div>
                <Footers />
            </div>
        );
    }

    if (cartCount === 0) {
        return (
            <div className="cart-page-wrapper">
                <Navbar />
                <div className="empty-cart-container">
                    <div className="empty-cart-box">
                        <img src="https://images.unsplash.com/photo-1557821552-17105176677c?w=600" alt="Empty Cart" width="600" height="400" style={{borderRadius: '20px', marginBottom: '30px', width: '100%', maxWidth: '600px', height: 'auto'}} />
                        <h2>Your Cart is Empty</h2>
                        <p>Looks like you haven't added anything to your cart yet.</p>
                        <button className="start-shopping-btn" onClick={() => navigate('/products')}>Start Shopping</button>
                    </div>
                </div>
                <Footers />
            </div>
        );
    }

    return (
        <div className="cart-page-wrapper">
            <Navbar />
            <div className="cart-container">
                <h1 className="cart-header">Shopping Cart <span>({cartCount} Items)</span></h1>
                
                <div className="cart-content-grid">
                    <div className="cart-items-list">
                        {cartItems.map((item) => (
                            <div key={item.id} className="cart-item-card">
                                <div className="item-img-box">
                                    <img src={item.productImage} alt={item.productName} />
                                </div>
                                <div className="item-details">
                                    <div className="item-header-row">
                                        <div className="item-title-col">
                                            <h3>{item.productName}</h3>
                                            {item.productSize && <span className="item-size-label">Size: {item.productSize}</span>}
                                        </div>
                                        <div className="item-price-actions">
                                            <span className="item-price-val">₹{(parsePriceToInt(item.totalPrice) * qtyOf(item)).toLocaleString()}</span>
                                            {qtyOf(item) > 1 && (
                                                <span className="item-unit-price">₹{parsePriceToInt(item.totalPrice).toLocaleString()} each</span>
                                            )}
                                            <div className="qty-stepper" role="group" aria-label="Quantity">
                                                <button
                                                    type="button"
                                                    className="qty-btn"
                                                    onClick={() => updateItemQuantity(item.id, qtyOf(item) - 1)}
                                                    disabled={qtyOf(item) <= 1}
                                                    aria-label="Decrease quantity"
                                                >−</button>
                                                <span className="qty-value" aria-live="polite">{qtyOf(item)}</span>
                                                <button
                                                    type="button"
                                                    className="qty-btn"
                                                    onClick={() => updateItemQuantity(item.id, qtyOf(item) + 1)}
                                                    disabled={qtyOf(item) >= 99}
                                                    aria-label="Increase quantity"
                                                >+</button>
                                            </div>
                                            <button className="remove-item-btn" onClick={() => removeItemFromCart(item.id)} aria-label={`Remove ${item.productName || 'item'} from cart`}>
                                                <FaTrashAlt aria-hidden="true" /> Remove
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="item-attributes-grid">
                                        {/* Dynamic Attribute Mapping */}
                                        {item.specifications ? (
                                            item.specifications.map((spec, idx) => (
                                                <div key={idx} className="attribute-chip">
                                                    <span className="attr-label">{spec.label}:</span> 
                                                    <span className="attr-val">{spec.value}</span>
                                                </div>
                                            ))
                                        ) : (
                                            /* Legacy Fallback for older items */
                                            <>
                                                <div className="attribute-chip">
                                                    <span className="attr-label">Lens:</span> 
                                                    <span className="attr-val">{item.lensType || 'Frame Only'}</span>
                                                </div>
                                                <div className="attribute-chip">
                                                    <span className="attr-label">Material:</span> 
                                                    <span className="attr-val">{item.material || 'Standard'}</span>
                                                </div>
                                                {item.usage && (
                                                    <div className="attribute-chip">
                                                        <span className="attr-label">Usage:</span> 
                                                        <span className="attr-val">{item.usage}</span>
                                                    </div>
                                                )}
                                                {item.frameStyle && (
                                                    <div className="attribute-chip">
                                                        <span className="attr-label">Style:</span> 
                                                        <span className="attr-val">{item.frameStyle}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        

                                        {item.enhancements?.length > 0 && (
                                            <div className="attribute-chip full-width">
                                                <span className="attr-label">Add-ons:</span> 
                                                <span className="attr-val">{item.enhancements.map(e => e.name).join(', ')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {item.prescription && (
                                        <div className="item-prescription-banner">
                                            <FaRegFileAlt /> 
                                            <span>Prescription Attached ({item.prescriptionType})</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary-sidebar">
                        <div className="summary-box">
                            <h2>Order Summary</h2>
                            <div className="summary-line">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="summary-line">
                                <span>Estimated GST</span>
                                <span>₹{tax.toLocaleString()}</span>
                            </div>
                            {discount > 0 && (
                                <div className="summary-line" style={{ color: '#22c55e', fontWeight: '600' }}>
                                    <span>Coupon Discount ({appliedCoupon})</span>
                                    <span>- ₹{discount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="summary-line">
                                <span>Shipping</span>
                                <span className="free-shipping">FREE</span>
                            </div>
                            <div className="summary-total">
                                <span>Total Amount</span>
                                <div className="total-stack">
                                    {discount > 0 && <span className="old-total">₹{originalTotal.toLocaleString()}</span>}
                                    <span className="final-total">₹{total.toLocaleString()}</span>
                                </div>
                            </div>
                            
                            <div className="coupon-section">
                                <div className="coupon-input-group">
                                    <input
                                        type="text"
                                        placeholder="Enter Coupon Code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        disabled={!!appliedCoupon}
                                        style={appliedCoupon ? { opacity: 0.6, cursor: 'not-allowed', background: '#f5f5f5' } : undefined}
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={!couponCode || !!appliedCoupon}
                                    >
                                        {appliedCoupon ? 'Applied' : 'Apply'}
                                    </button>
                                </div>
                                {appliedCoupon && (
                                    <div className="applied-coupon-tag">
                                        <span>{appliedCoupon} applied!</span>
                                        <button onClick={removeCoupon}>✕</button>
                                    </div>
                                )}
                            </div>

                            <button className="checkout-btn" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
                            <p className="checkout-note">Secure SSL encryption & safe payment processing</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footers />
        </div>
    );
};

export default Cart;
