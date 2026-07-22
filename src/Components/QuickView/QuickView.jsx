import React from 'react';
import { IoCloseOutline, IoCartOutline, IoEyeOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './QuickView.css';

const QuickView = ({ product, isOpen, onClose }) => {
    const navigate = useNavigate();
    const { addItemToCart } = useCart();

    if (!isOpen || !product) return null;

    const handleAddToCart = async (e) => {
        e.stopPropagation();
        const cartData = {
            productId: product.id,
            productName: product.title,
            productImage: product.img,
            productPrice: product.price,
            totalPrice: product.price
        };
        await addItemToCart(cartData);
    };

    return (
        <div className="quickview-overlay" onClick={onClose}>
            <div className="quickview-modal fade-in" onClick={(e) => e.stopPropagation()}>
                <button className="quickview-close" onClick={onClose}>
                    <IoCloseOutline />
                </button>
                
                <div className="quickview-content">
                    <div className="quickview-left">
                        <img src={product.img} alt={product.title} />
                    </div>
                    
                    <div className="quickview-right">
                        <span className="qv-brand">VisionCart Premium</span>
                        <h2>{product.title}</h2>
                        
                        <div className="qv-rating">
                            <img src={product.rating} alt="rating" />
                            <span>({product.ratingcount} Reviews)</span>
                        </div>
                        
                        <div className="qv-price">
                            <span className="qv-current">{product.price}</span>
                            <span className="qv-old">{product.mrpprice}</span>
                        </div>
                        
                        <div className="qv-features">
                            <div className="qv-feat">
                                <span className="icon">✓</span>
                                <span>3D Virtual Try-On Available</span>
                            </div>
                            <div className="qv-feat">
                                <span className="icon">✓</span>
                                <span>Premium Blue-Cut Lenses</span>
                            </div>
                        </div>

                        <div className="qv-actions">
                            <button className="qv-add-cart" onClick={handleAddToCart}>
                                <IoCartOutline /> Add to Cart
                            </button>
                            <button className="qv-view-details" onClick={() => { navigate(`/product/${product.id}`); onClose(); }}>
                                Full Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickView;
