import React from 'react';
import ReactDOM from 'react-dom';
import { FaCheckCircle, FaTimes, FaShoppingCart, FaArrowRight, FaTag, FaPalette, FaRulerCombined, FaGlasses, FaEye, FaMagic, FaUserAlt, FaPhoneAlt, FaFileUpload } from 'react-icons/fa';
import './ReviewSummaryModal.css';

const specIcons = {
    'Brand': <FaTag />,
    'Color': <FaPalette />,
    'Size': <FaRulerCombined />,
    'For': <FaUserAlt />,
    'Lens': <FaGlasses />,
    'Lens Type': <FaGlasses />,
    'Usage': <FaEye />,
    'Right Eye (RE)': <FaEye />,
    'Left Eye (LE)': <FaEye />,
    'Prescription': <FaGlasses />,
    'Enhancements': <FaMagic />,
    'Material': <FaMagic />,
};

const ReviewSummaryModal = ({ isOpen, onClose, onConfirm, data, actionType }) => {
    if (!isOpen || !data) return null;

    return ReactDOM.createPortal(
        <div className="review-modal-overlay" onClick={onClose}>
            <div className="review-modal animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <button className="close-modal" onClick={onClose} aria-label="Close modal">
                    <FaTimes />
                </button>
                
                <div className="review-header">
                    <div className="success-icon-wrapper">
                        <FaCheckCircle className="success-icon" />
                    </div>
                    <h2>Review Your Selection</h2>
                    <p>Please verify your order details before proceeding</p>
                </div>

                <div className="review-body">
                    <div className="review-product-info animate-fade-in">
                        <div className="img-box">
                            <img src={data.productImage} alt={data.productName} />
                        </div>
                        <div className="p-details">
                            <p className="p-brand">{data.productBrand}</p>
                            <h3>{data.productName}</h3>
                            <span className="p-price-tag">{data.productPrice}</span>
                        </div>
                    </div>

                    <div className="summary-sections">
                        {/* Frame Details Section */}
                        <div className="summary-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            <div className="card-header">
                                <FaTag className="h-icon" />
                                <h4>Frame Selection</h4>
                            </div>
                            <div className="card-grid">
                                {data.specifications && data.specifications
                                    .filter(s => ['Brand', 'Color', 'Size', 'For'].includes(s.label))
                                    .map((spec, idx) => (
                                        <div className="summary-item" key={idx}>
                                            <div className="item-icon">{specIcons[spec.label] || <FaTag />}</div>
                                            <div className="item-text">
                                                <span>{spec.label}</span>
                                                <p>{spec.value}</p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Lens & Customization Section */}
                        <div className="summary-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <div className="card-header">
                                <FaGlasses className="h-icon" />
                                <h4>Lens & Configuration</h4>
                            </div>
                            <div className="card-grid">
                                {data.specifications && data.specifications
                                    .filter(s => !['Brand', 'Color', 'Size', 'For'].includes(s.label))
                                    .map((spec, idx) => (
                                        <div className="summary-item full-width" key={idx}>
                                            <div className="item-icon">{specIcons[spec.label] || <FaGlasses />}</div>
                                            <div className="item-text">
                                                <span>{spec.label}</span>
                                                <p>{spec.value}</p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Patient & Prescription Section */}
                        {(data.patientDetails || (data.prescription && data.prescription.userInfo)) && (
                            <div className="summary-card animate-slide-up highlight" style={{ animationDelay: '0.3s' }}>
                                <div className="card-header">
                                    <FaUserAlt className="h-icon" />
                                    <h4>Patient Details</h4>
                                </div>
                                <div className="patient-content">
                                    <div className="patient-meta">
                                        <div className="p-meta-item">
                                            <FaUserAlt className="m-icon" />
                                            <div>
                                                <span>Name</span>
                                                <p>{data.patientDetails?.name || data.prescription.userInfo.name}</p>
                                            </div>
                                        </div>
                                        <div className="p-meta-item">
                                            <FaPhoneAlt className="m-icon" />
                                            <div>
                                                <span>Phone</span>
                                                <p>{data.patientDetails?.phone || data.prescription.userInfo.phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {(data.patientDetails?.prescriptionFile || data.prescription?.userInfo?.prescriptionUrl) && (
                                        <div className="prescription-attachment">
                                            <div className="attach-header">
                                                <FaFileUpload className="a-icon" />
                                                <span>Prescription Attachment</span>
                                            </div>
                                            <div className="attach-preview" onClick={() => window.open(data.patientDetails?.prescriptionFile || data.prescription.userInfo.prescriptionUrl, '_blank')}>
                                                <img 
                                                    src={data.patientDetails?.prescriptionFile || data.prescription.userInfo.prescriptionUrl} 
                                                    alt="Prescription" 
                                                />
                                                <div className="attach-overlay">
                                                    <span>Tap to view full</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Price Breakdown / Order Value Section */}
                        {data.priceBreakdown && (
                            <div className="summary-card price-summary-card animate-slide-up" style={{ animationDelay: '0.4s' }}>
                                <div className="card-header">
                                    <FaShoppingCart className="h-icon" />
                                    <h4>Order Value Breakdown</h4>
                                </div>
                                <div className="price-breakdown-list">
                                    {data.framePrice > 0 && (
                                        <div className="price-row">
                                            <span>{data.category === 'Contact Lenses' ? 'Base Product Price' : 'Frame Price'}</span>
                                            <p>₹{data.framePrice.toLocaleString()}</p>
                                        </div>
                                    )}
                                    {data.lensPrice > 0 && (
                                        <div className="price-row highlight-row">
                                            <span>{data.lensType || 'Selected'} Lens</span>
                                            <p>+ ₹{data.lensPrice.toLocaleString()}</p>
                                        </div>
                                    )}
                                    {data.addOns > 0 && (
                                        <div className="price-row">
                                            <span>Selected Add-ons</span>
                                            <p>+ ₹{data.addOns.toLocaleString()}</p>
                                        </div>
                                    )}
                                    
                                    <div className="price-divider"></div>
                                    
                                    <div className="price-row">
                                        <span>Subtotal (Excl. Tax)</span>
                                        <p>₹{data.priceBreakdown.subtotal.toLocaleString()}</p>
                                    </div>
                                    <div className="price-row">
                                        <span>Applicable GST ({data.priceBreakdown.gstRate}%)</span>
                                        <p>+ ₹{data.priceBreakdown.tax.toLocaleString()}</p>
                                    </div>
                                    <div className="price-row total-row">
                                        <span>Estimated Total Amount</span>
                                        <p>₹{data.priceBreakdown.total.toLocaleString()}</p>
                                    </div>
                                </div>
                                <p className="price-disclaimer">Final shipping & coupons applied at checkout</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="review-footer">
                    <button className="btn-cancel" onClick={onClose}>Edit Selection</button>
                    <button className={`btn-confirm ${actionType === 'buy' ? 'buy' : 'cart'}`} onClick={onConfirm}>
                        {actionType === 'buy' ? (
                            <>Confirm & Checkout <FaArrowRight /></>
                        ) : (
                            <>Confirm & Add to Cart <FaShoppingCart /></>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ReviewSummaryModal;
