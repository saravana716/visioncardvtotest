import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../Components/Navbar/Navbar';
import Footers from '../Components/Footer/Footers';
import PropCard from '../Components/PropCard/PropCard';
import VTOCanvas from '../Components/VTO/VTOCanvas';
import PhotoTryOn from '../Components/VTO/PhotoTryOn';
import { getProducts, getProductById, getCategoryDiscounts, applyCategoryDiscounts } from '../services/firestoreService';
import { getTryOnFrameImage, hasTryOnImage } from '../utils/tryOnModel';
import { config } from '../config';
import rateimg from '../assets/star.png';
import colorimg from '../assets/color.png';
import './VirtualTryOn.css';
import Loader from '../Components/Loader/Loader';
import { MdCameraAlt, MdPhotoLibrary, Md3dRotation, MdImage } from 'react-icons/md';
import { PLACEHOLDER_IMG } from '../utils/placeholderImage';

const VirtualTryOn = () => {
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [vtoActive, setVtoActive] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [photoTryOnOpen, setPhotoTryOnOpen] = useState(false);
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const pid = queryParams.get('id');

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch spectacles for the list, discounted so cards match the
                // product page (and add to cart at the right price).
                const [data, categoryDiscounts] = await Promise.all([
                    getProducts('Spectacles'),
                    getCategoryDiscounts(),
                ]);
                const priced = applyCategoryDiscounts(data, categoryDiscounts);
                // Only frames with a dedicated try-on cutout are offered — a raw
                // catalog photo composited on a face reads as broken.
                const withCutout = priced.filter(hasTryOnImage);
                const mappedData = withCutout.slice(0, 10).map(p => ({
                    id: p.id,
                    title: p.name || p.title || p.productName || p.brand || "Visionkart",
                    price: p.displayPrice,
                    mrpprice: p.discountLabel ? p.originalPrice : null,
                    discount: p.discountLabel,
                    img: (p.photos && p.photos.length > 0) ? p.photos[0] : (p.mainImage || PLACEHOLDER_IMG),
                    tryOnImg: getTryOnFrameImage(p),
                    rating: rateimg,
                    color: colorimg,
                    ratingcount: p.ratingCount || "0",
                    colorcount: p.colors ? p.colors.length : "1",
                    tryOn: true
                }));
                setProducts(mappedData);

                const selectDefault = () => {
                    if (withCutout.length > 0) {
                        setSelectedProduct({
                            ...withCutout[0],
                            price: withCutout[0].displayPrice,
                            vtoImg: getTryOnFrameImage(withCutout[0])
                        });
                    }
                };

                // Handle initial selected product (discounted, so the panel price
                // matches the card and the product page). A deep-linked product
                // without a cutout can't be tried on — select a frame that can.
                if (pid) {
                    const product = await getProductById(pid);
                    const pp = product ? applyCategoryDiscounts([product], categoryDiscounts)[0] : null;
                    if (pp && hasTryOnImage(pp)) {
                        setSelectedProduct({
                            ...pp,
                            price: pp.displayPrice,
                            vtoImg: getTryOnFrameImage(pp)
                        });
                        setVtoActive(true);
                    } else {
                        selectDefault();
                    }
                } else {
                    selectDefault();
                }
            } catch (error) {
                console.error("Error fetching VTO data:", error);
            }
            setLoading(false);
        };

        fetchData();
        window.scrollTo(0, 0);
    }, [location.search]);

    const handleSelectProduct = (product) => {
        setSelectedProduct({
            ...product,
            // The grid only lists cutout-bearing frames, so tryOnImg is set.
            vtoImg: product.tryOnImg
        });
        setVtoActive(true);
        setUploadedImage(null); // Reset uploaded image when selecting a new product
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setUploadedImage(event.target.result);
                setVtoActive(true);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="virtual-tryon-page">
            <Navbar />
            
            <div className="tryon-hero-premium">
                <div className="tryon-container-grid">
                    <div className="tryon-visual-section">
                        {!config.enable3DTryOn ? (
                            // Phase 1: photo try-on only — the hero launches the 2D modal.
                            // No launch button when no frame with a cutout is selected.
                            <div className="tryon-placeholder-card">
                                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800" alt="Model" className="model-base" />
                                {selectedProduct?.vtoImg && (
                                    <div className="overlay-content">
                                        <div className="pulse-button" onClick={() => setPhotoTryOnOpen(true)}>
                                            <MdImage />
                                            <span>Start Photo Try-On</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : !vtoActive ? (
                            <div className="tryon-placeholder-card">
                                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800" alt="Model" className="model-base" />
                                <div className="overlay-content">
                                    <div className="pulse-button" onClick={() => setVtoActive(true)}>
                                        <MdCameraAlt />
                                        <span>Start Virtual Try-On</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="vto-active-container">
                                <VTOCanvas frameImage={selectedProduct?.vtoImg} uploadedImage={uploadedImage} />
                                <div className="vto-badge-live">
                                    <span className="dot"></span> {uploadedImage ? 'PHOTO MODE' : 'LIVE AR'}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="tryon-info-section">
                        <div className="premium-label">{config.enable3DTryOn ? '3D EXPERIENCE' : 'PHOTO TRY-ON'}</div>
                        <h1>Virtual Try-On</h1>
                        <p className="subtitle">
                            {config.enable3DTryOn
                                ? 'Experience the future of eyewear shopping. Try any frame instantly with our advanced 3D face tracking technology.'
                                : 'See how any frame looks on you — snap a selfie or pick a photo and we place the frame on your face.'}
                        </p>

                        {selectedProduct && (
                            <div className="selected-product-vto">
                                <div className="vto-product-meta">
                                    <span className="brand">{selectedProduct.brand || 'Visionkart'}</span>
                                    <h3>{selectedProduct.name || selectedProduct.title}</h3>
                                    <span className="price">{selectedProduct.price}</span>
                                </div>
                                <div className="vto-action-btns">
                                    {config.enable3DTryOn ? (
                                        <>
                                            <button className="vto-btn-primary" onClick={() => {
                                                setVtoActive(!vtoActive);
                                                if (uploadedImage) setUploadedImage(null);
                                            }}>
                                                {vtoActive && !uploadedImage ? 'Stop Camera' : 'Start Camera'}
                                            </button>
                                            <button className="vto-btn-outline" onClick={() => fileInputRef.current?.click()}>
                                                <MdPhotoLibrary /> Upload Photo
                                            </button>
                                            <button className="vto-btn-outline" onClick={() => setPhotoTryOnOpen(true)}>
                                                <MdImage /> Photo Try-On
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handlePhotoUpload}
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                            />
                                        </>
                                    ) : (
                                        <button className="vto-btn-primary" onClick={() => setPhotoTryOnOpen(true)}>
                                            <MdImage /> Start Photo Try-On
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="vto-features-grid">
                            {config.enable3DTryOn ? (
                                <>
                                    <div className="feature-item">
                                        <Md3dRotation />
                                        <span>360° View</span>
                                    </div>
                                    <div className="feature-item">
                                        <MdCameraAlt />
                                        <span>Real-time Fit</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="feature-item">
                                        <MdImage />
                                        <span>Snap or Upload</span>
                                    </div>
                                    <div className="feature-item">
                                        <MdPhotoLibrary />
                                        <span>See the Fit</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="try-spectacles-section-v2">
                <div className="section-container">
                    <div className="section-header">
                        <h2>Select a Frame to Try On</h2>
                        <p>Browse our collection and see them on your face instantly</p>
                    </div>
                    
                    {loading ? (
                        <Loader />
                    ) : (
                        <div className="vto-products-grid">
                            {products.map(p => (
                                <div 
                                    key={p.id} 
                                    className={`vto-product-card ${selectedProduct?.id === p.id ? 'active' : ''}`}
                                    onClick={() => handleSelectProduct(p)}
                                >
                                    <div className="card-img">
                                        <img src={p.img} alt={p.title} />
                                    </div>
                                    <div className="card-info">
                                        <h4>{p.title}</h4>
                                        <p>{p.price}</p>
                                    </div>
                                    {selectedProduct?.id === p.id && <div className="active-tag">Selected</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="visionkart-banner-footer">
                <h1>VISIONKART <span className="eye-icon">👁️</span> VISION</h1>
            </div>

            <PhotoTryOn
                open={photoTryOnOpen}
                onClose={() => setPhotoTryOnOpen(false)}
                frameImage={selectedProduct?.vtoImg}
                name={selectedProduct?.name || selectedProduct?.title}
            />

            <Footers />
        </div>
    );
};

export default VirtualTryOn;
