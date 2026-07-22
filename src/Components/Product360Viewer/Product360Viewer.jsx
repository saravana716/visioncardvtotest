import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './Product360Viewer.css';
import { MdOutline360 } from "react-icons/md";
import { IoCloseOutline } from "react-icons/io5";

const Product360Viewer = ({ images, isOpen, onClose }) => {
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const startPos = useRef({ x: 0, y: 0 });
    const lastRotation = useRef({ x: 0, y: 0 });

    const imageCount = images?.length || 0;
    // Calculate which image to show based on horizontal rotation
    // We map the Y rotation (horizontal drag) to the image index
    const currentImageIndex = imageCount > 0 ? (Math.abs(Math.floor(rotation.y / 10)) % imageCount) : 0;
    const currentImage = images?.[currentImageIndex] || '';

    useEffect(() => {
        const appContainer = document.querySelector('.App');
        if (isOpen) {
            document.documentElement.classList.add('no-scroll');
            document.body.classList.add('no-scroll');
            if (appContainer) appContainer.classList.add('no-scroll');
            setRotation({ x: 0, y: 0 });
        } else {
            document.documentElement.classList.remove('no-scroll');
            document.body.classList.remove('no-scroll');
            if (appContainer) appContainer.classList.remove('no-scroll');
        }
        return () => {
            document.documentElement.classList.remove('no-scroll');
            document.body.classList.remove('no-scroll');
            if (appContainer) appContainer.classList.remove('no-scroll');
        };
    }, [isOpen]);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        startPos.current = {
            x: e.pageX || (e.touches ? e.touches[0].pageX : 0),
            y: e.pageY || (e.touches ? e.touches[0].pageY : 0)
        };
        lastRotation.current = rotation;
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        const currentX = e.pageX || (e.touches ? e.touches[0].pageX : 0);
        const currentY = e.pageY || (e.touches ? e.touches[0].pageY : 0);
        
        const diffX = currentX - startPos.current.x;
        const diffY = currentY - startPos.current.y;
        
        // sensitivity
        const sensitivity = 0.8; // Increased for better switching
        
        setRotation({
            y: lastRotation.current.y + diffX * sensitivity,
            x: lastRotation.current.x - diffY * sensitivity
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="product-360-overlay" onClick={onClose}>
            <div className="product-360-modal reveal-in" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="title-area">
                        <MdOutline360 className="icon-360" />
                        <h3>3D Perspective View</h3>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <IoCloseOutline />
                    </button>
                </div>

                <div 
                    className={`viewer-container ${isDragging ? 'grabbing' : ''}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                >
                    <div className="perspective-wrapper">
                        <div 
                            className="image-3d-card"
                            style={{
                                transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                                transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0, 0.2, 1)'
                            }}
                        >
                            <img 
                                src={currentImage} 
                                alt="Product 3D" 
                                draggable="false"
                            />
                            {/* Reflection Shimmer */}
                            <div 
                                className="shimmer-overlay"
                                style={{
                                    transform: `translateX(${-rotation.y * 2}px) translateY(${rotation.x * 2}px)`,
                                    opacity: isDragging ? 0.3 : 0.1
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="drag-helper">
                        <span className="drag-line"></span>
                        <p>Drag to Tilt & Rotate</p>
                        <span className="drag-line"></span>
                    </div>
                </div>

                <div className="interaction-info">
                    <p>Interactive 3D Perspective Experience</p>
                </div>
            </div>
        </div>
    , document.body);
};

export default Product360Viewer;
