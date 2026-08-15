import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import Navbar from '../Components/Navbar/Navbar';
import Footers from '../Components/Footer/Footers';
import OurBrands from '../Components/Ourbrands/OurBrands';
import PropCard from '../Components/PropCard/PropCard';
import { getProductById, getProducts, getLensEnhancements, getCategoryDiscounts, applyCategoryDiscounts } from '../services/firestoreService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ReviewsSection from '../Components/Reviews/ReviewsSection';
import RecentlyViewed from '../Components/RecentlyViewed/RecentlyViewed';
import Recommendations from '../Components/Recommendations/Recommendations';
import rateimg from '../assets/star.png';
import Loader from '../Components/Loader/Loader';
import './ProductDetails.css';
import { MdOutline360, MdPlayCircleOutline } from "react-icons/md";
import LensSelectionModal from '../Components/LensSelectionModal/LensSelectionModal';
import ReviewSummaryModal from '../Components/ReviewSummaryModal/ReviewSummaryModal';
import Product360Viewer from '../Components/Product360Viewer/Product360Viewer';
import ImageZoom from '../Components/ImageZoom/ImageZoom';
import ReadingGlassesPowerSelector from '../Components/ReadingGlassesPowerSelector/ReadingGlassesPowerSelector';
import { parsePriceToInt } from '../utils/price';
import { isProductUnavailable, resolveStock } from '../utils/availability';
import { lookupPincode, getSavedLocation, saveLocation } from '../utils/pincode';
import { VtoModal } from '@vto/sdk';
import { getTryOnGlbUrl, getTryOnFrameImage, hasTryOnImage, isTryOnEligible } from '../utils/tryOnModel';
import { config } from '../config';
import { PLACEHOLDER_IMG } from '../utils/placeholderImage';
// Lazy so the MediaPipe/photo-try-on bundle only downloads when a shopper
// actually opens it — keeps it out of the base product-page chunk.
const PhotoTryOn = lazy(() => import('../Components/VTO/PhotoTryOn'));

// Normalize a YouTube URL (watch?v=, youtu.be/, shorts/, embed/, with any extra
// query params) to a proper /embed/<id> URL. Returns null for anything that
// isn't a real YouTube host, so callers can use the result to decide whether to
// render an iframe vs a <video> (rather than fragile substring checks).
const toYouTubeEmbed = (url) => {
    if (!url) return null;
    let parsed;
    try {
        parsed = new URL(String(url), window.location.origin);
    } catch {
        return null;
    }
    const host = parsed.hostname.replace(/^www\./, '');
    const youTubeHosts = ['youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'youtu.be'];
    if (!youTubeHosts.includes(host)) return null;

    let id = '';
    if (host === 'youtu.be') {
        id = parsed.pathname.slice(1);
    } else if (parsed.pathname === '/watch') {
        id = parsed.searchParams.get('v') || '';
    } else {
        const m = parsed.pathname.match(/^\/(?:embed|shorts|v)\/([\w-]+)/);
        if (m) id = m[1];
    }
    id = (id || '').slice(0, 11);
    return /^[\w-]{11}$/.test(id) ? `https://www.youtube.com/embed/${id}` : null;
};

const categoryDescriptions = {
    'Spectacles': {
        title: 'Premium Optical Frames – Acetate & Metal',
        description: 'Upgrade your everyday style with our premium optical frames. Available in high-quality acetate and durable metal, these frames offer comfort, strength, and a modern look. Designed for daily wear, office use, and all face shapes, they provide the perfect balance of style and functionality. Lightweight and comfortable, these frames are ideal for long hours of use.',
        highlights: [
            {
                title: 'Acetate (Plastic) Highlights',
                items: [
                    'Premium quality acetate material',
                    'Lightweight and durable design',
                    'Smooth finish with stylish colors',
                    'Comfortable nose fit for all-day wear',
                    'Perfect for trendy and fashionable looks'
                ]
            },
            {
                title: 'Metal Frames Highlights',
                items: [
                    'Strong and durable metal construction',
                    'Slim, elegant, and modern design',
                    'Lightweight for comfortable wear',
                    'Ideal for office and formal use',
                    'Perfect for a clean and classy look'
                ]
            }
        ]
    },
    'Sunglasses': {
        title: 'Sunglasses Description',
        description: 'Protect your eyes in style with our premium sunglasses. Designed to provide UV protection, they help shield your eyes from harmful sun rays while keeping your vision clear and comfortable. Featuring lightweight frames and a comfortable fit, these sunglasses are perfect for daily wear, travel, and outdoor activities. With trendy designs and durable quality, they offer the perfect combination of style, comfort, and protection.',
        highlights: [
            {
                title: 'Sunglasses Highlights',
                items: [
                    'UV protection for eye safety',
                    'Lightweight and comfortable frame',
                    'Strong and durable design',
                    'Trendy and stylish look',
                    'Comfortable fit for daily wear',
                    'Premium quality materials'
                ]
            }
        ]
    },
    'Reading Glasses': {
        title: 'Reading Glasses Description',
        description: 'Make everyday reading easy and comfortable with our stylish reading glasses. Designed for clear near vision, they are perfect for reading books, newspapers, and mobile screens, as well as other close-up tasks. With lightweight frames and a comfortable fit, these glasses are ideal for long wear. Available in attractive designs, they offer the perfect mix of clarity, comfort, and style for daily wear.',
        highlights: [
            {
                title: 'Reading Glasses Highlights',
                items: [
                    'Clear vision for near reading',
                    'Lightweight and comfortable frame',
                    'Stylish and elegant designs',
                    'Suitable for daily use',
                    'Comfortable fit for long hours',
                    'Durable frame quality',
                    'Ideal for books, mobiles, and close work',
                    'Available in different styles and powers'
                ]
            }
        ]
    },
    'Computer Glasses': {
        title: 'Computer Glasses Description',
        description: 'Protect your eyes and improve your screen experience with our computer glasses. Designed to reduce digital eye strain, they help you stay comfortable during long hours of screen time on computers, laptops, and mobile devices. With lightweight frames and a comfortable fit, these glasses are perfect for daily use at work, at school, or at home. Featuring modern designs and durable quality, they offer the ideal combination of style, comfort, and eye protection.',
        highlights: [
            {
                title: 'Computer Glasses Highlights',
                items: [
                    'Helps reduce digital eye strain',
                    'Comfortable for long screen time',
                    'Lightweight and stylish frame',
                    'Suitable for computer, laptop, and mobile use',
                    'Supports better visual comfort',
                    'Durable and comfortable for daily wear',
                    'Modern designs for men, women, and unisex use',
                    'Ideal for office, study, and home use'
                ]
            }
        ]
    },
    'Contact Lenses': {
        title: 'Bausch & Lomb Eyewear / Contact Lenses Description',
        description: 'Experience trusted vision care with Bausch & Lomb products, known for their quality, comfort, and reliability. Designed to provide clear vision and long-lasting performance, they are ideal for daily use. With advanced technology and premium materials, Bausch & Lomb ensures better eye protection, comfort, and clarity. Suitable for all-day wear, these products are perfect for those seeking dependable, high-quality eye care solutions.',
        highlights: [
            {
                title: 'Bausch & Lomb Highlights',
                items: [
                    'Trusted and well-known eye care brand',
                    'High-quality vision products',
                    'Clear and comfortable vision',
                    'Advanced lens technology',
                    'Suitable for daily use',
                    'Long-lasting performance',
                    'Safe and reliable eye care solutions',
                    'Ideal for all-day comfort'
                ]
            }
        ]
    }
};

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toggleWishlist, isInWishlist } = useWishlist();
    
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImg, setSelectedImg] = useState('');
    const [showLensModal, setShowLensModal] = useState(false);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [lensEnhancements, setLensEnhancements] = useState([]);
    const [readingPower, setReadingPower] = useState({ rightPower: '', leftPower: '', sameForBoth: true });
    const [selectedColor, setSelectedColor] = useState(null);
    const [productFor, setProductFor] = useState('Adults');
    // Review Modal States
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewData, setReviewData] = useState(null);
    const [reviewAction, setReviewAction] = useState('cart'); // 'cart' or 'buy'
    const [selectedLensData, setSelectedLensData] = useState(null);
    const [is360Open, setIs360Open] = useState(false);
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [isTryOnOpen, setIsTryOnOpen] = useState(false);
    const [isPhotoTryOnOpen, setIsPhotoTryOnOpen] = useState(false);
    // Pre-fill from the delivery location the customer already picked in the navbar.
    const [pincode, setPincode] = useState(() => getSavedLocation()?.pincode || '');
    const [pinChecking, setPinChecking] = useState(false);
    const [pinResult, setPinResult] = useState(null); // { ok: boolean, message: string }

    // Keep the availability input in sync when the delivery location is changed
    // elsewhere (e.g. the navbar picker) while this page is mounted.
    useEffect(() => {
        const onLocationChange = (e) => {
            const pin = (e.detail && e.detail.pincode) || getSavedLocation()?.pincode || '';
            setPincode(pin);
            setPinResult(null);
        };
        window.addEventListener('vk-location-changed', onLocationChange);
        return () => window.removeEventListener('vk-location-changed', onLocationChange);
    }, []);

    // Validate a delivery PIN via India Post (shared util) and surface a delivery
    // estimate. On success we also persist it as the customer's delivery location
    // so the navbar picker stays in sync.
    const handlePincodeCheck = async () => {
        setPinChecking(true);
        setPinResult(null);
        const result = await lookupPincode(pincode);
        if (result.ok) {
            saveLocation({ pincode: result.pincode, city: result.city, state: result.state });
            setPinResult({ ok: true, message: `Deliverable to ${result.city}, ${result.state} · estimated 4-6 days` });
        } else {
            setPinResult({ ok: false, message: result.message });
        }
        setPinChecking(false);
    };

    const { addItemToCart, setCartOpen, setDrawerTab } = useCart();

    useEffect(() => {
        const fetchProductData = async () => {
            setLoading(true);
            const [data, categoryDiscounts] = await Promise.all([
                getProductById(id),
                getCategoryDiscounts()
            ]);

            if (data) {
                // Use centralized discount service (pass single product in array)
                const [discountedProduct] = applyCategoryDiscounts([data], categoryDiscounts);
                
                const mappedProduct = {
                    ...discountedProduct,
                    mainImage: (data.photos && data.photos.length > 0) ? data.photos[0] : (data.mainImage || PLACEHOLDER_IMG),
                    thumbnails: (data.photos && data.photos.length > 0) ? data.photos : (data.mainImage ? [data.mainImage] : [PLACEHOLDER_IMG]),
                    brand: data.brand || 'Visionkart',
                    title: data.name || data.model || 'Product Details',
                    price: discountedProduct.displayPrice,
                    originalPrice: discountedProduct.originalPrice,
                    discount: discountedProduct.discountLabel || '0% OFF',
                    rating: data.rating || '4.5',
                    ratingCount: data.ratingCount || '0',
                    size: data.category === 'Contact Lenses' ? (data.size || '') : (data.size || 'Medium'),
                    // Admin stores a single free-text `color` string; the storefront
                    // renders a `colors` array of { name, hex }. Fall back to the admin
                    // color (usable directly as a CSS color for the swatch) so it isn't
                    // silently dropped to "Default".
                    colors: (Array.isArray(data.colors) && data.colors.length > 0)
                        ? data.colors
                        : (data.color
                            ? [{ name: data.color, hex: data.color }]
                            : [{ name: 'Default', hex: '#000' }]),
                    category: data.category || 'Spectacles',
                    userSegment: (data.category === 'Kids Collection' || data.category === 'Kids Collections') ? 'Kids' : 'Adults',
                    // Resolve stock via the shared helper (mirrors admin's
                    // resolveProductStock): missing/blank/invalid → 0 (Out of Stock),
                    // so legacy docs with no stock field can't be oversold.
                    stock: resolveStock(data),
                    // Admin's authoritative availability override ('Discontinued' /
                    // 'Out of Stock'); the storefront must honor it, not just the number.
                    status: data.status || '',
                    technicalSpecs: [
                        { label: 'Brand', value: data.brand || '' },
                        { label: 'Model No.', value: data.model || '' },
                        { label: 'Frame Type', value: data.frameType || '' },
                        { label: 'Frame Shape', value: data.frameShape || '' },
                        { label: 'Frame Material', value: data.frameMaterial || '' },
                        { label: 'Gender', value: data.gender || '' }
                    ],
                    features: data.feature || data.features || [],
                    productVideo: data.videoUrl || data.productVideo || data.video || null,
                    threesixtyImage: data.view360Url || data.threesixtyImage || data.image360 || null
                };
                setProduct(mappedProduct);
                setSelectedImg(mappedProduct.mainImage);
                setProductFor(mappedProduct.userSegment);

                // Fetch similar products and apply same discount logic
                const similar = await getProducts(data.category);
                const discountedSimilar = applyCategoryDiscounts(similar.filter(p => p.id !== id).slice(0, 4), categoryDiscounts);
                
                const similarMapped = discountedSimilar.map(p => {
                    return {
                        id: p.id,
                        img: (p.photos && p.photos.length > 0) ? p.photos[0] : (p.mainImage || PLACEHOLDER_IMG),
                        hoverImg: (p.photos && p.photos.length > 1) ? p.photos[1] : null,
                        title: p.name || p.title || p.productName || p.brand || "Visionkart",
                        rating: rateimg,
                        ratingcount: p.ratingCount || "0",
                        price: p.displayPrice,
                        // Strikethrough MRP only when there is an actual discount.
                        mrpprice: p.discountLabel ? p.originalPrice : null,
                        discount: p.discountLabel,
                        color: "",
                        colorcount: p.colors ? p.colors.length : "1"
                    };
                });
                setSimilarProducts(similarMapped);

                // Dynamic Theme Adaptation
                const themes = {
                    'Spectacles': '#00387D',
                    'Sunglasses': '#FF8C00',
                    'Contact Lenses': '#00CED1',
                    'Computer Glasses': '#4B0082',
                    'Reading Glasses': '#2E8B57'
                };
                const color = themes[data.category] || '#00387D';
                document.documentElement.style.setProperty('--category-theme', color);
            }
            // Small delay for premium feel
            setTimeout(() => setLoading(false), 500);
            window.scrollTo(0, 0);
        };

        const fetchEnhancements = async () => {
            const enh = await getLensEnhancements();
            setLensEnhancements(enh);
        };

        fetchProductData();
        fetchEnhancements();

        // Track Recently Viewed
        const trackRecentlyViewed = () => {
            const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
            const updated = [id, ...viewed.filter(vId => vId !== id)].slice(0, 10);
            localStorage.setItem('recentlyViewed', JSON.stringify(updated));
        };
        trackRecentlyViewed();
    }, [id]);

    useEffect(() => {
        if (loading) return;

        // Intersection Observer for Scroll Animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        const revealElements = document.querySelectorAll('.scroll-reveal');
        revealElements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [loading]);

    const calculatePriceBreakdown = (total) => {
        const rawTotal = typeof total === 'number' ? total : parsePriceToInt(total);
        const gstRate = (product.category === 'Sunglasses') ? 0.18 : 0.12;
        
        // Exclusive GST: Price is Subtotal, GST is added on top
        const subtotal = rawTotal;
        const tax = Math.round(subtotal * gstRate);
        const finalTotal = subtotal + tax;

        return {
            subtotal,
            tax,
            total: finalTotal,
            gstRate: Math.round(gstRate * 100)
        };
    };

    const getPreparedCartData = () => {
        const baseData = {
            productId: id,
            productBrand: product.brand,
            productName: product.title,
            productImage: product.mainImage,
            productPrice: product.price,
            productSize: product.size,
            totalPrice: product.price,
            category: product.category,
            specifications: [
                { label: 'Brand', value: product.brand || 'Visionkart' },
                { label: 'Color', value: selectedColor?.name || (product.colors?.[0]?.name) || 'Default' },
                { label: 'Size', value: product.size || 'Standard' },
                { label: 'For', value: productFor },
                { label: 'Lens', value: 'Frame Only' },
            ],
            sku: product.technicalSpecs?.find(s => s.label === 'SKU Code')?.value || id,
            allTechnicalSpecs: product.technicalSpecs || []
        };

        baseData.priceBreakdown = calculatePriceBreakdown(product.price);
        baseData.framePrice = parsePriceToInt(product.price);
        baseData.lensPrice = 0;
        baseData.addOns = 0;

        // If user already selected a lens in the modal, merge that data
        if (selectedLensData) {
            const lensSpecs = selectedLensData.specifications || [];
            return {
                ...baseData,
                ...selectedLensData,
                // Replace Frame Only lens spec with selected lens type
                specifications: [
                    ...baseData.specifications.filter(s => s.label !== 'Lens'),
                    ...lensSpecs
                ],
                totalPrice: selectedLensData.totalPrice || baseData.totalPrice,
                priceBreakdown: calculatePriceBreakdown(selectedLensData.totalPrice || baseData.totalPrice)
            };
        }

        return baseData;
    };

    const handleAddToCart = async (preData = null) => {
        const cartData = preData || getPreparedCartData();
        // Availability is enforced centrally in CartContext.addItemToCart (the
        // single choke point all add-to-cart surfaces share); the buttons below
        // are also disabled when unavailable for immediate feedback.
        const result = await addItemToCart(cartData);
        return result;
    };

    const handleLaunchReview = (action, overrideData = null) => {
        const data = overrideData || getPreparedCartData();
        setReviewData(data);
        setReviewAction(action);
        setShowReviewModal(true);
    };

    const handleLensDataSave = (data, action = null) => {
        setSelectedLensData(data);
        setShowLensModal(false);
        
        if (action) {
            const baseData = {
                productId: id,
                productBrand: product.brand,
                productName: product.title,
                productImage: product.mainImage,
                productPrice: product.price,
                productSize: product.size,
                totalPrice: product.price,
                category: product.category,
                specifications: [
                    { label: 'Brand', value: product.brand || 'Visionkart' },
                    { label: 'Color', value: selectedColor?.name || (product.colors?.[0]?.name) || 'Default' },
                    { label: 'Size', value: product.size || 'Standard' },
                    { label: 'For', value: productFor },
                    { label: 'Lens', value: 'Frame Only' },
                ],
                sku: product.technicalSpecs?.find(s => s.label === 'SKU Code')?.value || id,
            };

            const mergedData = {
                ...baseData,
                ...data,
                specifications: [
                    ...baseData.specifications.filter(s => s.label !== 'Lens' && s.label !== 'Material'),
                    ...(data.specifications || []).filter(s => s.label !== 'Size' && s.label !== 'Color')
                ],
                totalPrice: data.totalPrice || baseData.totalPrice,
                priceBreakdown: calculatePriceBreakdown(data.totalPrice || baseData.totalPrice)
            };

            handleLaunchReview(action, mergedData);
        } else {
            import('react-hot-toast').then(({ default: toast }) => {
                toast.success('Lens details configured. You can now Add to Cart or Buy Now.', {
                    style: { borderRadius: '10px', background: '#001f54', color: '#fff' }
                });
            });
        }
    };

    const handleConfirmReview = async () => {
        setShowReviewModal(false);
        const success = await handleAddToCart(reviewData);
        if (success) {
            if (reviewAction === 'buy') {
                navigate('/checkout');
            } else {
                setDrawerTab('cart');
                setCartOpen(true);
            }
        }
    };



    if (loading) return <Loader fullPage={true} />;
    if (!product) return (
        <div style={{ padding: '100px 20px', textAlign: 'center', fontSize: '20px' }}>
            {/* Reached both when the product doesn't exist and when the fetch
                failed (e.g. offline) — the copy covers both honestly. */}
            <p>We couldn't load this product — it may have been removed, or there may be a connection problem.</p>
            <button
                onClick={() => window.location.reload()}
                style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '8px', border: '1px solid #00387d', background: '#00387d', color: '#fff', cursor: 'pointer', fontSize: '16px' }}
            >
                Try again
            </button>
        </div>
    );

    // A product is purchasable only when the admin hasn't flagged it
    // Discontinued / Out of Stock AND it has stock — via the shared helper that
    // mirrors the admin's getProductAvailability (also normalizes NaN stock to 0).
    const productStatus = String(product.status || '').trim();
    const isUnavailable = isProductUnavailable(product);

    const getCategoryDescription = () => {
        if (!product || !product.category) return null;
        // Solutions get a lens-care description. The brand-specific Biotrue
        // copy only renders for actual Bausch + Lomb products — showing it on
        // every solution mislabelled other brands' products.
        const isSolutions = product.category === 'Contact Lenses'
            && /solution/i.test(String(product.contactLensSubcategory || ''));
        const isBiotrue = /biotrue|bausch/i.test(`${product.name || ''} ${product.brand || ''}`);
        if (isSolutions && !isBiotrue) {
            return {
                title: 'Contact Lens Solution',
                description: 'An all-in-one solution that cleans, disinfects, rinses, conditions, and stores soft contact lenses. It helps keep lenses clean, fresh, and comfortable throughout the day.',
                highlights: [
                    {
                        title: 'Highlights',
                        items: [
                            'Cleans and disinfects contact lenses',
                            'Removes dirt and protein deposits',
                            'Keeps lenses moist and comfortable',
                            'All-in-one solution for daily lens care',
                            'Helps provide clear and comfortable vision',
                        ]
                    }
                ]
            };
        }
        if (isSolutions && isBiotrue) {
            return {
                title: 'Bausch + Lomb Biotrue Multi-Purpose Contact Lens Solution',
                description: 'Bausch + Lomb Biotrue Multi-Purpose Contact Lens Solution is an all-in-one solution that cleans, disinfects, rinses, conditions, and stores soft contact lenses. It helps keep lenses clean, fresh, and comfortable throughout the day.',
                highlights: [
                    {
                        title: 'Highlights',
                        items: [
                            'Cleans and disinfects contact lenses',
                            'Removes dirt and protein deposits',
                            'Keeps lenses moist and comfortable',
                            'Suitable for all soft contact lenses, including silicone hydrogel lenses',
                            'All-in-one solution for daily lens care',
                            'Helps provide clear and comfortable vision',
                            'Easy and convenient to use every day'
                        ]
                    }
                ]
            };
        }
        return categoryDescriptions[product.category];
    };

    const renderTechnicalInfo = (viewType) => {
        const categoryDesc = getCategoryDescription();
        return (
            <div className={`info-left-col ${viewType === 'desktop' ? 'hide-on-mobile' : 'hide-on-desktop'}`}>
                {product.technicalSpecs && product.technicalSpecs.length > 0 && (
                    <div className="technical-info-section">
                        <h2>Technical Information</h2>
                        <table className="tech-table">
                            <tbody>
                                {product.technicalSpecs
                                    .filter(spec => spec.label !== 'Model No.' && spec.value && spec.value !== 'N/A')
                                    .map((spec, idx) => (
                                        <tr key={idx}>
                                            <td>{spec.label}</td>
                                            <td>{spec.value}</td>
                                        </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {(product.features && (Array.isArray(product.features) ? product.features.length > 0 : product.features.length > 0)) && (
                    <div className="product-features-section">
                        <h2>Product Features</h2>
                        <div className="features-list-container">
                            {(Array.isArray(product.features) ? product.features : product.features.split(/[.,]/)).filter(f => f.trim().length > 0).map((feature, idx) => (
                                <div key={idx} className="feature-item-row">
                                    <span className="check-icon">✓</span>
                                    <p className="feature-text">{feature.trim()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {categoryDesc && (
                    <div className="category-dynamic-desc">
                        <h2>{categoryDesc.title}</h2>
                        <p className="desc-text">{categoryDesc.description}</p>
                        
                        <div className="highlights-container">
                            {categoryDesc.highlights.map((highlightGroup, idx) => (
                                <div key={idx} className="highlight-group">
                                    <h3>{highlightGroup.title}</h3>
                                    <ul>
                                        {highlightGroup.items.map((item, itemIdx) => (
                                            <li key={itemIdx}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="product-details-page">
            <Navbar />
            
            {product.categoryBanner && (
                <div className="category-banner">
                    <img src={product.categoryBanner} alt={product.category} />
                </div>
            )}
            
            <div className="product-container">
                <div className="breadcrumbs scroll-reveal">
                    Home &gt; {product.category} &gt; {product.brand}
                </div>

                <div className="main-info-grid scroll-reveal">
                    <div className="product-main-left">
                        <div className="product-gallery">
                            <div className="thumbnails">
                                {product.thumbnails.map((img, idx) => (
                                    <img 
                                        key={idx} 
                                        src={img} 
                                        alt={`Thumbnail ${idx}`} 
                                        className={selectedImg === img ? 'active' : ''}
                                        onMouseEnter={() => setSelectedImg(img)}
                                    />
                                ))}
                            </div>
                            <div className="main-image">
                                <button className="wishlist-btn-float" onClick={() => toggleWishlist(id)}>
                                    {isInWishlist(id) ? <FaHeart color="#ff4d4d" /> : <FaRegHeart />}
                                </button>
                                
                                <div className="media-overlay-actions">
                                    {product.threesixtyImage && (
                                        <button className="media-btn-mini theme-360" onClick={() => setIs360Open(true)}>
                                            <MdOutline360 /> 360° View
                                        </button>
                                    )}
                                    {product.productVideo && (
                                        <button className="media-btn-mini theme-video" onClick={() => setIsVideoOpen(true)}>
                                            <MdPlayCircleOutline /> Video
                                        </button>
                                    )}
                                </div>

                                <ImageZoom 
                                    src={selectedImg} 
                                    className="zoom-container"
                                />
                            </div>
                        </div>

                        <div className="product-left-details-stack">
                            {renderTechnicalInfo('desktop')}
<div className="mb1">
                            <ReviewsSection productId={id} />

</div>
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div className="product-info-panel">

                        <h1>{product.title}</h1>
                        {product.size && <p className="size-info">Size: {product.size}</p>}
                        <div className="rating-row">
                            <img src={rateimg} alt="stars" />
                            <span>({product.rating}/5)</span>
                        </div>
                        <div className="product-pricing">
                            <span className="current-price">{product.price}</span>
                            {product.originalPrice && product.originalPrice !== product.price && (
                                <span className="original-price-strike">{product.originalPrice}</span>
                            )}
                            <span className="offer-tag">{product.discount}</span>
                        </div>

                        <div className={`stock-status-pill ${isUnavailable ? 'out-of-stock' : product.stock > 5 ? 'in-stock' : 'limited-stock'}`}>
                            <span className="pulse-dot"></span>
                            {productStatus === 'Discontinued'
                                ? 'Discontinued'
                                : isUnavailable
                                    ? 'Out of Stock'
                                    : 'In Stock'}
                        </div>



                        {isTryOnEligible(product) && (
                            <>
                                {/* Phase 1: the 2D photo try-on is the primary (only) entry.
                                    The 3D "LIVE AR" banner is gated for phase 2. */}
                                {config.enable3DTryOn && (
                                    <div className="virtual-tryon-banner-premium" onClick={() => setIsTryOnOpen(true)}>
                                        <div className="tryon-content">
                                            <span className="tryon-badge">LIVE AR</span>
                                            <h3>3D Virtual Try-On</h3>
                                            <p>See how they look on your face instantly</p>
                                        </div>
                                        <div className="tryon-img">
                                            <img src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400" alt="Model AR" />
                                        </div>
                                    </div>
                                )}

                                {/* 2D photo try-on — overlays the frame on a selfie or a
                                    gallery photo (no camera permission needed in gallery mode).
                                    Hidden unless the admin uploaded a try-on cutout: without
                                    one there is nothing clean to composite. */}
                                {hasTryOnImage(product) && (
                                    <div className="virtual-tryon-banner-premium" onClick={() => setIsPhotoTryOnOpen(true)}>
                                        <div className="tryon-content">
                                            <span className="tryon-badge">TRY-ON</span>
                                            <h3>Virtual Try-On</h3>
                                            <p>See them on your face — snap a selfie or pick a photo</p>
                                        </div>
                                        <div className="tryon-img">
                                            <img src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400" alt="Try on" />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* @vto/sdk 3D GLB try-on modal — phase 2 only. */}
                        {config.enable3DTryOn && (
                            <VtoModal
                                open={isTryOnOpen}
                                onClose={() => setIsTryOnOpen(false)}
                                glbUrl={getTryOnGlbUrl(product)}
                                name={product?.name || product?.title || 'Virtual Try-On'}
                            />
                        )}

                        {/* 2D photo try-on modal — uses the uploaded transparent frame
                            cutout (the banner that opens it only renders when one
                            exists). Mounted only once opened so its lazy chunk
                            downloads on demand. */}
                        {isPhotoTryOnOpen && (
                            <Suspense fallback={null}>
                                <PhotoTryOn
                                    open
                                    onClose={() => setIsPhotoTryOnOpen(false)}
                                    frameImage={getTryOnFrameImage(product)}
                                    name={product?.name || product?.title || 'Virtual Try-On'}
                                />
                            </Suspense>
                        )}

                        {product.category !== 'Sunglasses' && (
                            <div className="action-buttons-group">
                                <button className="btn-action-outline blue" onClick={() => setShowLensModal(true)}>Select lens</button>
                            </div>
                        )}

                        <div className="action-buttons-lower">
                            <button
                                className="action-primary-btn"
                                onClick={() => handleLaunchReview('cart')}
                                disabled={isUnavailable}
                            >
                                Add to Cart
                            </button>
                            <button
                                className="action-secondary-btn"
                                onClick={() => handleLaunchReview('buy')}
                                disabled={isUnavailable}
                            >
                                Buy Now
                            </button>
                        </div>
                        {isUnavailable && (
                            <p className="unavailable-note" style={{ color: '#b91c1c', fontSize: '0.9rem', marginTop: '8px' }}>
                                {productStatus === 'Discontinued'
                                    ? 'This product has been discontinued and is no longer available.'
                                    : 'This product is currently out of stock.'}
                            </p>
                        )}

                        <div className="product-for-section">
                            <p>This Product For</p>
                            <div className="for-buttons">
                                <div 
                                    className={`for-item ${productFor === 'Kids' ? 'active' : ''}`}
                                    onClick={() => setProductFor('Kids')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="for-img-box">
                                        <img src="https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400" alt="Kids" />
                                        <span className="for-label">Kids</span>
                                    </div>
                                </div>
                                <div 
                                    className={`for-item ${productFor === 'Adults' ? 'active' : ''}`}
                                    onClick={() => setProductFor('Adults')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="for-img-box">
                                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" alt="Adults" />
                                        <span className="for-label">Adults</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="vn-assure-section">
                            <p className="section-title">VN Assure You</p>
                            <div className="trust-badges-refined">
                                <div className="badge-item">
                                    <div className="badge-icon">
                                        <img src="https://cdn-icons-png.flaticon.com/512/679/679821.png" alt="Returns" />
                                    </div>
                                    <div className="badge-text">
                                        <span>No Questions Asked Returns</span>
                                        <p>(Excluding Power lens)</p>
                                    </div>
                                </div>
                                <div className="badge-item">
                                    <div className="badge-icon">
                                        <img src="https://cdn-icons-png.flaticon.com/512/5810/5810695.png" alt="Exchange" />
                                    </div>
                                    <div className="badge-text">
                                        <span>Easy 7 day exchange</span>
                                        <p>(On every valid purchase)</p>
                                    </div>
                                </div>
                                <div className="badge-item">
                                    <div className="badge-icon">
                                        <img src="https://cdn-icons-png.flaticon.com/512/1063/1063376.png" alt="Warranty" />
                                    </div>
                                    <div className="badge-text">
                                        <span>6 Month Warranty</span>
                                        <p>With Every Product</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="availability-check">
                            <p className="check-title">Check Availability</p>
                            <div className="zip-input">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    aria-label="Delivery PIN code"
                                    placeholder="Enter PIN code"
                                    value={pincode}
                                    onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '')); setPinResult(null); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handlePincodeCheck(); }}
                                />
                                <button type="button" onClick={handlePincodeCheck} disabled={pinChecking}>
                                    {pinChecking ? 'Checking…' : 'Check'}
                                </button>
                            </div>
                            {pinResult && (
                                <p className={`delivery-status ${pinResult.ok ? 'available' : 'unavailable'}`}>
                                    {pinResult.message}
                                </p>
                            )}
                        </div>

                        {/* Mobile view technical info */}
                        {renderTechnicalInfo('mobile')}
                    </div>
                </div>

<div className='mb'>
                            <ReviewsSection productId={id} />

</div>

                <div className="similar-products-section scroll-reveal">
                    <div className="section-header">
                        <h2>Similar Products</h2>
                        <a href="/products" className="shop-now-link">Shop <span>Now</span></a>
                    </div>
                    <div className="products-grid">
                        <PropCard cardlist={similarProducts} />
                    </div>
                </div>

                <OurBrands />
                <Recommendations category={product?.category} currentProductId={id} />
                <RecentlyViewed excludeId={id} />
            </div>

            <Footers />

            <LensSelectionModal 
                isOpen={showLensModal}
                onClose={() => setShowLensModal(false)}
                product={product}
                lensEnhancements={lensEnhancements}
                addItemToCart={addItemToCart}
                setCartOpen={setCartOpen}
                setDrawerTab={setDrawerTab}
                onSave={handleLensDataSave}
                productFor={productFor}
            />
            <ReviewSummaryModal 
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                onConfirm={handleConfirmReview}
                data={reviewData}
                actionType={reviewAction}
            />
            <Product360Viewer
                images={(() => {
                    const t = product.threesixtyImage;
                    // Support a single URL or a frame array; treat an empty/blank
                    // array as "missing" so the viewer never gets an empty src.
                    const frames = Array.isArray(t) ? t.filter(Boolean) : (t ? [t] : []);
                    return frames.length ? frames : [selectedImg];
                })()}
                isOpen={is360Open}
                onClose={() => setIs360Open(false)}
            />

            {isVideoOpen && (
                <div className="video-modal-overlay" onClick={() => setIsVideoOpen(false)}>
                    <div className="video-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="video-modal-close" onClick={() => setIsVideoOpen(false)}>&times;</button>
                        <div className="video-player-wrapper">
                            {toYouTubeEmbed(product.productVideo) ? (
                                <iframe
                                    src={toYouTubeEmbed(product.productVideo)}
                                    title="Product Video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <video src={product.productVideo} controls autoPlay></video>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;
