import React, { useState, useRef } from 'react';
import './ImageZoom.css';

const ImageZoom = ({ src, alt, zoomScale = 2 }) => {
    const [showZoom, setShowZoom] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const imgRef = useRef(null);

    const handleMouseEnter = () => setShowZoom(true);
    const handleMouseLeave = () => setShowZoom(false);

    const handleMouseMove = (e) => {
        if (!imgRef.current) return;
        const { left, top, width, height } = imgRef.current.getBoundingClientRect();
        
        let x = ((e.pageX - left - window.scrollX) / width) * 100;
        let y = ((e.pageY - top - window.scrollY) / height) * 100;

        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        setPosition({ x, y });
    };

    const handleTouchStart = (e) => {
        // Toggle zoom on tap
        setShowZoom(!showZoom);
        if (e.touches.length > 0) {
            updateTouchPos(e);
        }
    };

    const handleTouchMove = (e) => {
        if (!showZoom) return;
        // Prevent page scroll when panning a zoomed image
        if (e.cancelable) e.preventDefault();
        updateTouchPos(e);
    };

    const updateTouchPos = (e) => {
        if (!imgRef.current) return;
        const touch = e.touches[0];
        const { left, top, width, height } = imgRef.current.getBoundingClientRect();
        
        let x = ((touch.pageX - left - window.scrollX) / width) * 100;
        let y = ((touch.pageY - top - window.scrollY) / height) * 100;

        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        setPosition({ x, y });
    };

    return (
        <div 
            className={`zoom-container ${showZoom ? 'is-zoomed' : ''}`} 
            onMouseEnter={handleMouseEnter} 
            onMouseLeave={handleMouseLeave} 
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
        >
            <img 
                ref={imgRef}
                src={src} 
                alt={alt} 
                className={`base-image ${showZoom ? 'zoomed' : ''}`}
                draggable="false"
                style={{
                    transform: showZoom ? `scale(${zoomScale})` : 'scale(1)',
                    transformOrigin: `${position.x}% ${position.y}%`
                }}
            />
            {!showZoom && <div className="zoom-hint">{('ontouchstart' in window) ? 'Tap to Zoom' : 'Hover to Zoom'}</div>}
        </div>
    );
};

export default ImageZoom;
