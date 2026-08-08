import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FaPhoneAlt } from 'react-icons/fa';
import './LensSelectionModal.css';
import ReadingGlassesPowerSelector from '../ReadingGlassesPowerSelector/ReadingGlassesPowerSelector';
import { uploadPrescription } from '../../services/firestoreService';
import { auth } from '../../firebase.config';
import { parsePriceToInt } from '../../utils/price';
import { TOAST_PRIMARY } from '../../utils/toast';

const LensSelectionModal = ({ 
    isOpen, 
    onClose, 
    product, 
    lensEnhancements, 
    addItemToCart, 
    setCartOpen, 
    setDrawerTab,
    onSave,
    productFor
}) => {
    const navigate = useNavigate();

    // Selection States
    const [selectedLensType, setSelectedLensType] = useState('Single Vision');
    const [selectedPackage, setSelectedPackage] = useState('Silver Pack');
    const [selectedUsage, setSelectedUsage] = useState('Everyday');

    const lensPackages = [
        { id: 'Silver Pack', name: 'Silver Pack', price: 490, features: 'Anti-Glare + Scratch Resistant', description: 'Clear vision for everyday use', color: '#B0B0B0' },
        { id: 'Gold Pack', name: 'Gold Pack', price: 990, features: 'UV Protection + Thinner Lenses', description: 'Best for outdoor & long wear', recommended: true, color: '#FFD700' },
        { id: 'Platinum Pack', name: 'Platinum Pack', price: 1490, features: 'Blue Block + Super Hydrophobic', description: 'Superior digital protection', color: '#E5E4E2' }
    ];

    // Contact Lenses States
    const [contactLensPowerOption, setContactLensPowerOption] = useState('later');
    const [clRightEyeSelected, setClRightEyeSelected] = useState(true);
    const [clLeftEyeSelected, setClLeftEyeSelected] = useState(true);
    const [clRightSph, setClRightSph] = useState('');
    const [clLeftSph, setClLeftSph] = useState('');
    const [clRightBoxes, setClRightBoxes] = useState(1);
    const [clLeftBoxes, setClLeftBoxes] = useState(1);
    const [showPowerSelectorModal, setShowPowerSelectorModal] = useState(null);
    const [clPowerTab, setClPowerTab] = useState('negative');

    const contactLensColors = ['#001f54', '#00d285', '#7b2cbf', '#ff007f'];
    const isSolution = product && product.category === 'Contact Lenses' && (
        (Array.isArray(product.contactLensVariants) && product.contactLensVariants.length > 0) ||
        /solution/i.test(product.contactLensSubcategory || '') ||
        /solution/i.test(product.name || product.title || '')
    );
    const contactLensPacks = (product && product.category === 'Contact Lenses')
        ? (isSolution
            ? (Array.isArray(product.contactLensVariants) && product.contactLensVariants.length > 0
                ? product.contactLensVariants.map((v, idx) => {
                    const basePriceInt = parsePriceToInt(product.price);
                    const offerPriceInt = product.offerPrice ? parsePriceToInt(product.offerPrice) : null;
                    const vPrice = parseInt(v.price || 0);
                    
                    let finalPrice = vPrice;
                    let finalOldPrice = v.oldPrice ? parseInt(v.oldPrice) : null;
                    
                    if (offerPriceInt && vPrice === basePriceInt) {
                        finalPrice = offerPriceInt;
                        finalOldPrice = basePriceInt;
                    }
                    
                    return {
                        id: v.id || v.title || `variant-${idx}`,
                        name: v.title || `${v.volumeMl || v.volume || ''}ml Bottle`,
                        price: finalPrice,
                        oldPrice: finalOldPrice,
                        description: `Volume: ${v.volumeMl || v.volume || ''} ml`,
                        features: v.features || 'Sterile multi-purpose solution',
                        color: contactLensColors[idx % contactLensColors.length]
                    };
                  })
                : (() => {
                    const priceVal = parsePriceToInt(product.price);
                    const oldPriceVal = product.originalPrice && product.originalPrice !== product.price
                        ? parsePriceToInt(product.originalPrice)
                        : null;
                    const match = (product.name || product.title || '').match(/(\d+)\s*ml/i);
                    const volumeMl = match ? match[1] : '';
                    return [{
                        id: 'dynamic-variant-1',
                        name: volumeMl ? `${volumeMl}ml Bottle` : 'Standard Bottle',
                        price: priceVal,
                        oldPrice: oldPriceVal,
                        description: volumeMl ? `Volume: ${volumeMl} ml` : 'Standard Volume',
                        features: 'Sterile multi-purpose solution',
                        color: contactLensColors[0]
                    }];
                  })()
              )
            : (Array.isArray(product.contactLensPacks) && product.contactLensPacks.length > 0
                ? product.contactLensPacks.map((pkg, idx) => {
                    const basePriceInt = parsePriceToInt(product.price);
                    const offerPriceInt = product.offerPrice ? parsePriceToInt(product.offerPrice) : null;
                    const pkgPrice = parseInt(pkg.price || 0);
                    
                    let finalPrice = pkgPrice;
                    let finalOldPrice = pkg.oldPrice ? parseInt(pkg.oldPrice) : null;
                    
                    if (offerPriceInt && pkgPrice === basePriceInt) {
                        finalPrice = offerPriceInt;
                        finalOldPrice = basePriceInt;
                    }
                    
                    const titleText = pkg.title || 'Standard';
                    const hasPackWord = titleText.toLowerCase().includes('pack');
                    
                    return {
                        id: pkg.id || pkg.title || `pack-${idx}`,
                        name: hasPackWord ? titleText : `${titleText} Pack`,
                        price: finalPrice,
                        oldPrice: finalOldPrice,
                        description: pkg.quantity || '',
                        features: pkg.features || (idx === 0 ? 'Daily Wear Comfort' : 'Maximum hydration'),
                        color: contactLensColors[idx % contactLensColors.length]
                    };
                  })
                : (() => {
                    const priceVal = parsePriceToInt(product.price);
                    const oldPriceVal = product.originalPrice && product.originalPrice !== product.price
                        ? parsePriceToInt(product.originalPrice)
                        : null;
                    
                    let qtyDesc = '';
                    let packTitle = 'Standard Pack';
                    
                    if (product.contactLensPackSize) {
                        qtyDesc = `${product.contactLensPackSize} lens/box`;
                        packTitle = `${product.contactLensPackSize} Pack`;
                    } else {
                        const nameLower = (product.name || product.title || '').toLowerCase();
                        const qtyMatch = nameLower.match(/(\d+)\s*(lens|pack|box|qty)/i);
                        if (qtyMatch) {
                            const num = qtyMatch[1];
                            qtyDesc = `${num} lens/box`;
                            packTitle = `${num} Pack`;
                        } else if (product.size) {
                            qtyDesc = product.size;
                            packTitle = product.size;
                        } else {
                            qtyDesc = '1 lens/box';
                        }
                    }
                    
                    let scheduleDesc = 'Daily Wear Comfort';
                    if (product.contactLensReplacementSchedule) {
                        const sched = product.contactLensReplacementSchedule.trim().toLowerCase();
                        if (sched === 'daily') scheduleDesc = 'Daily Disposable';
                        else if (sched === 'monthly') scheduleDesc = 'Monthly Disposable';
                        else if (sched === 'yearly') scheduleDesc = 'Yearly Disposable';
                        else scheduleDesc = product.contactLensReplacementSchedule.charAt(0).toUpperCase() + product.contactLensReplacementSchedule.slice(1);
                    } else {
                        const nameLower = (product.name || product.title || '').toLowerCase();
                        if (nameLower.includes('monthly') || (product.replacementSchedule && product.replacementSchedule.toLowerCase().includes('monthly'))) {
                            scheduleDesc = 'Monthly Disposable';
                        } else if (nameLower.includes('daily') || (product.replacementSchedule && product.replacementSchedule.toLowerCase().includes('daily'))) {
                            scheduleDesc = 'Daily Disposable';
                        } else if (nameLower.includes('yearly') || (product.replacementSchedule && product.replacementSchedule.toLowerCase().includes('yearly'))) {
                            scheduleDesc = 'Yearly Disposable';
                        }
                    }

                    return [{
                        id: 'dynamic-pack-1',
                        name: packTitle,
                        price: priceVal,
                        oldPrice: oldPriceVal,
                        description: qtyDesc,
                        features: scheduleDesc,
                        color: contactLensColors[0]
                    }];
                  })()
              )
          )
        : [];

    const [selectedClPack, setSelectedClPack] = useState(contactLensPacks[0]?.id || '');
    const [spectaclesPowerOption, setSpectaclesPowerOption] = useState('later');
    const [specRightSelected, setSpecRightSelected] = useState(true);
    const [specLeftSelected, setSpecLeftSelected] = useState(true);

    const getDynamicPackPrice = (pkgId) => {
        const pack = contactLensPacks.find(p => p.id === pkgId);
        if (pack) return pack.price;
        const basePriceInt = parsePriceToInt(product?.price);
        if (pkgId === '6-lens-box') return basePriceInt;
        if (pkgId === '3-lens-box') return Math.round(basePriceInt * 0.6);
        return basePriceInt;
    };

    useEffect(() => {
        const handleCloseAll = () => {
            if (isOpen) onClose();
        };
        const handleKey = (e) => {
            if (isOpen && e.key === 'Escape') onClose();
        };
        window.addEventListener('close-all-modals', handleCloseAll);
        document.addEventListener('keydown', handleKey);
        return () => {
            window.removeEventListener('close-all-modals', handleCloseAll);
            document.removeEventListener('keydown', handleKey);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) {
            setUserInfo({ name: '', phone: '', file: null, fileName: '' });
        }
    }, [isOpen]);

    useEffect(() => {
        if (contactLensPacks && contactLensPacks.length > 0) {
            if (!selectedClPack || !contactLensPacks.some(p => p.id === selectedClPack)) {
                setSelectedClPack(contactLensPacks[0].id);
            }
        }
    }, [product, contactLensPacks]);

    // Prescription Value Arrays
    const sphValues = [
        'Select',
        ...Array.from({ length: 52 }, (_, i) => (-13.00 + i * 0.25).toFixed(2)),
        '0.00',
        ...Array.from({ length: 32 }, (_, i) => `+${(0.25 + i * 0.25).toFixed(2)}`)
    ];
    const cylValues = [
        'Select',
        ...Array.from({ length: 24 }, (_, i) => (-6.00 + i * 0.25).toFixed(2)),
        '0.00',
        ...Array.from({ length: 24 }, (_, i) => `+${(0.25 + i * 0.25).toFixed(2)}`)
    ];
    const axisValues = ['Select', ...Array.from({ length: 181 }, (_, i) => i.toString())];
    const addValues = ['Select', ...Array.from({ length: 12 }, (_, i) => `+${(0.75 + i * 0.25).toFixed(2)}`)];

    const [prescriptionType, setPrescriptionType] = useState('Same power for both eyes');
    const [selectedEnhancements, setSelectedEnhancements] = useState([]);
    const [prescription, setPrescription] = useState({
        right: { sph: 'Select', cyl: 'Select', axis: 'Select', add: 'Select' },
        left: { sph: 'Select', cyl: 'Select', axis: 'Select', add: 'Select' }
    });
    const [readingPower, setReadingPower] = useState({ rightPower: '', leftPower: '', sameForBoth: true });
    
    // New Multi-Step Manual Prescription State
    const [manualStep, setManualStep] = useState('table'); // 'table' or 'info'
    const [userInfo, setUserInfo] = useState({ name: '', phone: '', file: null, fileName: '' });

    // Handle Scroll Lock
    useEffect(() => {
        const appContainer = document.querySelector('.App');
        if (isOpen) {
            document.documentElement.classList.add('no-scroll');
            document.body.classList.add('no-scroll');
            if (appContainer) appContainer.classList.add('no-scroll');
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

    const toggleEnhancement = (enh) => {
        setSelectedEnhancements(prev => {
            const exists = prev.find(e => e.id === enh.id);
            if (exists) {
                return prev.filter(e => e.id !== enh.id);
            } else {
                return [...prev, enh];
            }
        });
    };

    // Auto-clear enhancements if Lens Type changes to avoid incompatible combinations
    useEffect(() => {
        setSelectedEnhancements([]);
    }, [selectedLensType]);

    // DERIVED STATE: Filter enhancements based on selected category from DB
    const filteredEnhancements = (lensEnhancements || []).filter(enh => {
        const cat = enh.lensCategory || 'Single Vision';
        return cat === selectedLensType;
    });

    const calculatePriceDetails = () => {
        if (!product) return { subtotal: 0, tax: 0, total: 0, gstRate: 12, lensPrice: 0, framePrice: 0, addOns: 0 };
        
        const basePriceInt = parsePriceToInt(product.price);
        let subtotal = 0;
        let lensPrice = 0;
        let addOns = 0;
        let framePrice = basePriceInt;

        if (product.category === 'Contact Lenses') {
            const packPrice = getDynamicPackPrice(selectedClPack);
            const totalBoxes = clRightBoxes;
            
            lensPrice = packPrice * totalBoxes;
            framePrice = 0; // Contact lenses/solutions do not have a separate frame/base price!
            subtotal = lensPrice;
        } else {
            lensPrice = 0;
            addOns = selectedEnhancements.reduce((sum, enh) => sum + (parseInt(enh.price || 0)), 0);
            subtotal = framePrice + lensPrice + addOns;
        }

        const gstRate = (product.category === 'Sunglasses') ? 0.18 : 0.12;
        const tax = Math.round(subtotal * gstRate);
        const total = subtotal + tax;

        return {
            subtotal,
            tax,
            total,
            gstRate: Math.round(gstRate * 100),
            lensPrice,
            framePrice,
            addOns
        };
    };

    const calculateTotalPrice = () => {
        const { subtotal } = calculatePriceDetails();
        return `₹${subtotal}`;
    };

    const handlePrescriptionTypeChange = (type) => {
        setPrescriptionType(type);
        if (type === 'Same power for both eyes') {
            setPrescription(prev => ({
                ...prev,
                left: { ...prev.right }
            }));
        }
    };

    const handlePrescriptionChange = (eye, field, value) => {
        setPrescription(prev => {
            const newState = { ...prev };
            newState[eye] = { ...newState[eye], [field]: value };
            
            if (prescriptionType === 'Same power for both eyes') {
                const otherEye = eye === 'right' ? 'left' : 'right';
                newState[otherEye] = { ...newState[otherEye], [field]: value };
            }
            return newState;
        });
    };

    const handleInternalAddToCart = async (prescriptionUrl = null) => {
        if (product.stock !== undefined && product.stock <= 0) return false;
        const isReadingGlasses = product.category === 'Reading Glasses';
        const isContactLens = product.category === 'Contact Lenses';
        const isSpectacles = ['Spectacles', 'Computer Glasses', 'Kids Collection', 'Kids Collections'].includes(product.category);
        
        if (isReadingGlasses && (!readingPower.rightPower || (!readingPower.sameForBoth && !readingPower.leftPower))) {
            const { default: toast } = await import('react-hot-toast');
            toast.error('Please select power for your eyes');
            return false;
        }

        if (isSpectacles && spectaclesPowerOption === 'manual') {
            if (!userInfo.name || !userInfo.phone) {
                const { default: toast } = await import('react-hot-toast');
                toast.error('Please provide name and phone number');
                return false;
            }
            if (prescription.right.sph === 'Select' || !prescription.right.sph) {
                const { default: toast } = await import('react-hot-toast');
                toast.error('Please select Spherical power for Right eye');
                return false;
            }
            if (prescription.left.sph === 'Select' || !prescription.left.sph) {
                const { default: toast } = await import('react-hot-toast');
                toast.error('Please select Spherical power for Left eye');
                return false;
            }
        }

        if (isContactLens && !isSolution && contactLensPowerOption === 'manual') {
            if (!userInfo.name || !userInfo.phone) {
                const { default: toast } = await import('react-hot-toast');
                toast.error('Please provide name and phone number');
                return false;
            }
            if (clRightEyeSelected && !clRightSph) {
                const { default: toast } = await import('react-hot-toast');
                toast.error('Please select Spherical power for Right eye');
                return false;
            }
            if (clLeftEyeSelected && !clLeftSph) {
                const { default: toast } = await import('react-hot-toast');
                toast.error('Please select Spherical power for Left eye');
                return false;
            }
            if (!clRightEyeSelected && !clLeftEyeSelected) {
                const { default: toast } = await import('react-hot-toast');
                toast.error('Please select at least one eye');
                return false;
            }
        }

        // Only include lens-specific specs here; parent will merge with product specs
        const specifications = [];

        if (isContactLens) {
            const pack = contactLensPacks.find(p => p.id === selectedClPack);
            if (isSolution) {
                specifications.push(
                    { label: 'Product Type', value: 'Contact Lens Solution' },
                    { label: 'Quantity', value: clRightBoxes.toString() },
                    { label: 'Volume', value: pack?.description || '' }
                );
            } else if (contactLensPowerOption === 'later') {
                specifications.push(
                    { label: 'Lens Type', value: 'Contact Lens' },
                    { label: 'Total Box Qty', value: clRightBoxes.toString() },
                    { label: 'Pack Type', value: pack?.name || 'Standard' }
                );
            } else {
                // One "total boxes" quantity is selected and charged — record it
                // once. Splitting it per eye doubled the quantity on the order
                // (2 total read as R:2 + L:2 = 4) and misled fulfillment.
                specifications.push(
                    { label: 'Lens Type', value: 'Contact Lens' },
                    { label: 'Total Box Qty', value: clRightBoxes.toString() },
                    { label: 'Pack Type', value: pack?.name || 'Standard' }
                );
            }
        } else if (isReadingGlasses) {
            specifications.push(
                { label: 'Lens', value: 'Reading Glass' },
                { label: 'Right Eye Power', value: readingPower.rightPower },
                { label: 'Left Eye Power', value: readingPower.sameForBoth ? readingPower.rightPower : readingPower.leftPower }
            );
        } else if (isSpectacles) {
            specifications.push(
                { label: 'Lens Type', value: selectedLensType },
                { label: 'Usage', value: selectedUsage }
            );
            
            if (spectaclesPowerOption === 'manual') {
                if (specRightSelected) {
                    specifications.push({ 
                        label: 'Right Eye (RE)', 
                        value: `SPH: ${prescription.right.sph}${prescription.right.cyl !== 'Select' ? `, CYL: ${prescription.right.cyl}` : ''}${prescription.right.axis !== 'Select' ? `, AXIS: ${prescription.right.axis}` : ''}` 
                    });
                }
                if (specLeftSelected) {
                    specifications.push({ 
                        label: 'Left Eye (LE)', 
                        value: `SPH: ${prescription.left.sph}${prescription.left.cyl !== 'Select' ? `, CYL: ${prescription.left.cyl}` : ''}${prescription.left.axis !== 'Select' ? `, AXIS: ${prescription.left.axis}` : ''}` 
                    });
                }
            } else {
                specifications.push({ label: 'Prescription', value: 'Submit Later' });
            }
        } else {
            specifications.push(
                { label: 'Lens Type', value: selectedLensType },
                { label: 'Usage', value: selectedUsage }
            );
        }

        // Add Enhancements to specs
        if (selectedEnhancements.length > 0) {
            specifications.push({ 
                label: 'Enhancements', 
                value: selectedEnhancements.map(e => e.name).join(', ') 
            });
        }

        const cartData = {
            productId: product.id,
            productBrand: product.brand,
            productName: product.title,
            productImage: product.mainImage,
            productPrice: product.price,
            productSize: product.size || (isContactLens ? '' : 'Medium'),
            category: product.category,
            specifications: specifications,
            totalPrice: calculateTotalPrice(),
            framePrice: calculatePriceDetails().framePrice,
            lensPrice: calculatePriceDetails().lensPrice,
            addOns: calculatePriceDetails().addOns,
            sku: product.technicalSpecs?.find(s => s.label === 'SKU Code')?.value || product.id,
            enhancements: isReadingGlasses || isContactLens ? [] : selectedEnhancements,
            lensType: isContactLens ? 'Contact Lens' : (isReadingGlasses ? 'Reading Glass' : selectedLensType),
            usage: selectedUsage,
            prescriptionType: isReadingGlasses ? 'Reading Glass Power' : (isContactLens ? (isSolution ? 'Not Applicable' : (contactLensPowerOption === 'manual' ? 'Manual Contact Lens Power' : 'Submit Later')) : (isSpectacles ? (spectaclesPowerOption === 'manual' ? 'Manual Prescription' : 'Submit Later') : prescriptionType)),
            patientDetails: ((isSpectacles && spectaclesPowerOption === 'manual') || (isContactLens && contactLensPowerOption === 'manual')) ? {
                name: userInfo.name,
                phone: userInfo.phone,
                prescriptionFile: prescriptionUrl || userInfo.previewUrl || userInfo.fileName
            } : null,
            prescription: isContactLens ? (isSolution ? {
                isSolution: true,
                quantity: clRightBoxes,
                pack: contactLensPacks.find(p => p.id === selectedClPack)
            } : {
                rightSelected: clRightEyeSelected,
                leftSelected: clLeftEyeSelected,
                rightPower: clRightSph || null,
                leftPower: clLeftSph || null,
                // A single shared "total boxes" quantity is selected and charged;
                // storing it per-eye doubled the recorded quantity.
                totalBoxes: clRightBoxes,
                totalBoxesLater: contactLensPowerOption === 'later' ? clRightBoxes : null,
                pack: contactLensPacks.find(p => p.id === selectedClPack),
                userInfo: (contactLensPowerOption === 'manual') ? {
                    name: userInfo.name,
                    phone: userInfo.phone,
                    prescriptionUrl: prescriptionUrl || null,
                    fileName: userInfo.fileName
                } : null
            }) : (isReadingGlasses ? { readingPower } : (isSpectacles ? {
                ...prescription,
                userInfo: (spectaclesPowerOption === 'manual') ? {
                    name: userInfo.name,
                    phone: userInfo.phone,
                    prescriptionUrl: prescriptionUrl || null,
                    fileName: userInfo.fileName
                } : null
            } : prescription))
        };

        return cartData;
    };

    const handleSavePrescription = () => {
        setManualStep('info');
        import('react-hot-toast').then(({ default: toast }) => {
            toast.success('Power saved. Please provide user details.', TOAST_PRIMARY);
        });
    };

    const handleUserInfoSubmit = async (onCartSuccess, action = 'cart') => {
        if (!userInfo.name || !userInfo.phone) {
            const { default: toast } = await import('react-hot-toast');
            toast.error('Please provide name and phone number');
            return;
        }

        const { default: toast } = await import('react-hot-toast');
        let prescriptionUrl = null;

        if (userInfo.file) {
            const loadingToast = toast.loading('Uploading prescription image...');
            const uploadResult = await uploadPrescription(userInfo.file, auth.currentUser?.uid);
            toast.dismiss(loadingToast);

            if (uploadResult.success) {
                prescriptionUrl = uploadResult.url;
                toast.success('Prescription image uploaded successfully');
            } else if (uploadResult.error?.message?.includes('Sign in')) {
                toast.error('Please sign in to upload your prescription.');
            } else {
                toast.error('Failed to upload image. Proceeding without file.');
            }
        }

        const lensData = await handleInternalAddToCart(prescriptionUrl);
        if (lensData) {
            onSave(lensData, action);
            onClose();
            if (typeof onCartSuccess === 'function') onCartSuccess();
        }
    };

    const handleFinalAction = async (action) => {
        // If manual prescription and user info not filled, show toast but we can also just save what we have
        // But user said "remove save and proceed button", so maybe they want it implicit or they want the final summary to catch missing info.
        
        let prescriptionUrl = null;
        if (userInfo.file) {
            const { default: toast } = await import('react-hot-toast');
            const loadingToast = toast.loading('Uploading prescription image...');
            const uploadResult = await uploadPrescription(userInfo.file, auth.currentUser?.uid);
            toast.dismiss(loadingToast);
            if (uploadResult.success) prescriptionUrl = uploadResult.url;
        }

        const lensData = await handleInternalAddToCart(prescriptionUrl);
        if (lensData) {
            onSave(lensData, action);
            onClose();
        }
    };

    if (!isOpen || !product) return null;

    return ReactDOM.createPortal(
        <div
            className="lens-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Configure lens options"
            onClick={(e) => {
                if (e.target.className === 'lens-modal-overlay') onClose();
            }}
        >
            <div className="lens-modal reveal-in">
                <button className="close-modal" onClick={onClose} aria-label="Close lens selection">✕</button>
                
                <div className="modal-content">
                    {product.category === 'Contact Lenses' ? (
                        <div className="contact-lenses-section">
                            <h2 className="modal-title-small">{isSolution ? "Select Volume / Option" : "Lenses per Pack"}</h2>
                            <div className="packages-grid cl-packages">
                                {contactLensPacks.map(pkg => (
                                    <div 
                                        key={pkg.id} 
                                        className={`package-card ${selectedClPack === pkg.id ? 'active' : ''}`}
                                        onClick={() => setSelectedClPack(pkg.id)}
                                    >
                                        <div className="package-header">
                                            <div className="package-title-row">
                                                <div className="package-dot" style={{ background: pkg.color }}></div>
                                                <h3>{pkg.name}</h3>
                                            </div>
                                            <div className="package-price-col">
                                                {pkg.oldPrice && <span className="package-old-price">₹{pkg.oldPrice}</span>}
                                                <div className="package-price">₹{pkg.price}</div>
                                            </div>
                                        </div>
                                        <p className="package-desc">{pkg.description}</p>
                                        <div className="package-features">
                                            <span>✨ {pkg.features}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {isSolution ? (
                                <div className="solution-qty-container animate-in">
                                    <div className="cl-power-row solution-qty-row">
                                        <div className="cl-row-label">
                                            <span className="main-label">Quantity</span>
                                            <span className="sub-label">Select number of bottles/packs</span>
                                        </div>
                                        <div className="cl-dropdown-col qty-select-col">
                                            <select 
                                                className="cl-select-premium cl-select" 
                                                value={clRightBoxes} 
                                                onChange={e => setClRightBoxes(parseInt(e.target.value))}
                                                style={{ paddingRight: '2.5rem' }}
                                            >
                                                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="cl-power-row no-border mt-3 mb-3" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)', paddingBottom: '15px' }}>
                                        <div className="cl-row-label">
                                            <span className="main-label">Quantity</span>
                                            <span className="sub-label">Select total boxes</span>
                                        </div>
                                        <div className="cl-dropdown-col qty-select-col">
                                            <select 
                                                className="cl-select-premium cl-select" 
                                                value={clRightBoxes} 
                                                onChange={e => setClRightBoxes(parseInt(e.target.value))}
                                                style={{ paddingRight: '2.5rem' }}
                                            >
                                                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="cl-power-type-container">
                                        <div className="cl-power-desc">
                                            <span className="p-label">Power</span>
                                            <span className="p-label">Type</span>
                                        </div>
                                        <button className="cl-power-btn active">With Power</button>
                                    </div>

                                    <div className="compact-power-flow main-selector cl-power-options">
                                        <div 
                                            className={`power-option-card ${contactLensPowerOption === 'manual' ? 'active' : ''}`}
                                            onClick={() => setContactLensPowerOption('manual')}
                                        >
                                            <div className="power-radio"></div>
                                            <div className="power-info">
                                                <strong>Enter power Manually</strong>
                                            </div>
                                        </div>
                                        <div 
                                            className={`power-option-card ${contactLensPowerOption === 'later' ? 'active' : ''}`}
                                            onClick={() => setContactLensPowerOption('later')}
                                        >
                                            <div className="power-radio"></div>
                                            <div className="power-info">
                                                <strong>I will submit power later</strong>
                                            </div>
                                        </div>

                                        {contactLensPowerOption === 'later' && (
                                            <div className="animate-in">
                                                <a href="https://wa.me/917871333302" target="_blank" rel="noopener noreferrer" className="cl-submit-later-banner spectacles-banner" style={{ textDecoration: 'none', marginBottom: '1rem' }}>
                                                    <div className="banner-left">
                                                        <h3>Don't worry! <FaPhoneAlt className="phone-icon-cl" /></h3>
                                                        <p>We will call you to get your power!</p>
                                                    </div>
                                                    <div className="banner-right">
                                                        <div className="lens-graphic-pair">
                                                            <div className="lens-graphic positive">
                                                                <span>+</span>
                                                                <div className="lens-shape"></div>
                                                            </div>
                                                            <div className="lens-graphic negative">
                                                                <span>-</span>
                                                                <div className="lens-shape"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </a>
                                            </div>
                                        )}

                                        {contactLensPowerOption === 'manual' && (
                                            <div className="cl-manual-power-grid animate-in">
                                                <div className="eye-selection-row">
                                                    <label className="cl-checkbox-label">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={clRightEyeSelected} 
                                                            onChange={(e) => setClRightEyeSelected(e.target.checked)} 
                                                        /> 
                                                        <span className="custom-checkmark">✓</span>
                                                        RIGHT (OD)
                                                    </label>
                                                    <label className="cl-checkbox-label">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={clLeftEyeSelected} 
                                                            onChange={(e) => setClLeftEyeSelected(e.target.checked)} 
                                                        /> 
                                                        <span className="custom-checkmark">✓</span>
                                                        LEFT (OS)
                                                    </label>
                                                </div>
                                                
                                                <div className="cl-power-row no-border" style={{ paddingBottom: '10px' }}>
                                                    <div className="cl-row-label">
                                                        <span className="main-label">Spherical</span>
                                                        <span className="sub-label">SPH</span>
                                                    </div>
                                                    <div className="cl-dropdown-col">
                                                        <button className="cl-dropdown-btn" onClick={() => setShowPowerSelectorModal('right')} disabled={!clRightEyeSelected}>
                                                            {clRightSph || 'Select'} <span className="arrow">▼</span>
                                                        </button>
                                                    </div>
                                                    <div className="cl-dropdown-col">
                                                        <button className="cl-dropdown-btn" onClick={() => setShowPowerSelectorModal('left')} disabled={!clLeftEyeSelected}>
                                                            {clLeftSph || 'Select'} <span className="arrow">▼</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Clear/Delete values button */}
                                                {(clRightSph || clLeftSph) && (
                                                    <div style={{ textAlign: 'right', marginBottom: '15px' }}>
                                                        <button 
                                                            type="button"
                                                            className="back-to-table"
                                                            style={{ 
                                                                margin: 0, 
                                                                padding: '6px 12px', 
                                                                fontSize: '12px', 
                                                                background: '#f8d7da', 
                                                                color: '#721c24', 
                                                                border: '1px solid #f5c6cb', 
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => {
                                                                setClRightSph('');
                                                                setClLeftSph('');
                                                            }}
                                                        >
                                                            Clear Powers
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="manual-user-details animate-in" style={{ width: '100%', marginTop: '15px', borderTop: '1px solid rgba(0, 0, 0, 0.05)', paddingTop: '15px' }}>
                                                    <div className="details-header" style={{ marginBottom: '10px', fontSize: '15px', fontWeight: '600' }}>Whose prescription is this</div>
                                                    <div className="details-form">
                                                        <div className="detail-input-group" style={{ marginBottom: '10px' }}>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Name" 
                                                                value={userInfo.name} 
                                                                onChange={(e) => setUserInfo({...userInfo, name: e.target.value})} 
                                                            />
                                                        </div>
                                                        <div className="detail-input-group" style={{ marginBottom: '10px' }}>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Phone Number" 
                                                                value={userInfo.phone} 
                                                                onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})} 
                                                            />
                                                        </div>
                                                        <div className="prescription-upload-area">
                                                            <label className="upload-box" style={{ display: 'block', border: '2px dashed #FF0075', borderRadius: '8px', padding: '15px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255, 0, 117, 0.02)' }}>
                                                                <input 
                                                                    type="file" 
                                                                    accept="image/*" 
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file) {
                                                                            // Release the previous preview blob before replacing it,
                                                                            // or re-picking files leaks object URLs for the session.
                                                                            if (userInfo.previewUrl?.startsWith('blob:')) {
                                                                                URL.revokeObjectURL(userInfo.previewUrl);
                                                                            }
                                                                            const preview = URL.createObjectURL(file);
                                                                            setUserInfo({
                                                                                ...userInfo,
                                                                                file,
                                                                                fileName: file.name,
                                                                                previewUrl: preview
                                                                            });
                                                                        }
                                                                    }}
                                                                    style={{ display: 'none' }}
                                                                />
                                                                <div className="upload-content">
                                                                    <div className="upload-icon" style={{ fontSize: '24px', marginBottom: '5px' }}>📷</div>
                                                                    <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
                                                                        {userInfo.fileName || 'Upload Prescription (Optional)'}
                                                                    </p>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Hide lens type selector for Reading Glasses */}
                            {product.category !== 'Reading Glasses' && (
                                <>
                                    <h2 className="modal-title-small">Select Lens Type</h2>
                                    <div className="lens-type-grid">
                                        <div className={`lens-type-item ${selectedLensType === 'Single Vision' ? 'active' : ''}`} onClick={() => setSelectedLensType('Single Vision')}>
                                            <div className="icon">👁️</div>
                                            <p>Single Vision</p>
                                            <span>Distance | Near Vision</span>
                                        </div>
                                        <div className={`lens-type-item ${selectedLensType === 'Progressive' ? 'active' : ''}`} onClick={() => setSelectedLensType('Progressive')}>
                                            <div className="icon">🔄</div>
                                            <p>Progressive</p>
                                            <span>Near & Far Vision</span>
                                        </div>
                                        <div className={`lens-type-item ${selectedLensType === 'Bifocal' ? 'active' : ''}`} onClick={() => setSelectedLensType('Bifocal')}>
                                            <div className="icon">👓</div>
                                            <p>Bifocal</p>
                                            <span>Dual Vision</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {(product.category === 'Spectacles' || product.category === 'Computer Glasses' || product.category === 'Kids Collection' || product.category === 'Kids Collections') ? (
                                <>
                                    <div className="cl-power-type-container">
                                        <div className="cl-power-desc">
                                            <span className="p-label">Power</span>
                                            <span className="p-label">Type</span>
                                        </div>
                                        <button className="cl-power-btn active">With Power</button>
                                    </div>

                                    <div className="compact-power-flow main-selector">
                                        <div 
                                            className={`power-option-card ${spectaclesPowerOption === 'manual' ? 'active' : ''}`}
                                            onClick={() => setSpectaclesPowerOption('manual')}
                                        >
                                            <div className="power-radio"></div>
                                            <div className="power-info">
                                                <strong>Enter power Manually</strong>
                                            </div>
                                        </div>
                                        <div 
                                            className={`power-option-card ${spectaclesPowerOption === 'later' ? 'active' : ''}`}
                                            onClick={() => setSpectaclesPowerOption('later')}
                                        >
                                            <div className="power-radio"></div>
                                            <div className="power-info">
                                                <strong>I will submit power later</strong>
                                            </div>
                                        </div>

                                         {spectaclesPowerOption === 'manual' && (
                                            <div className="prescription-input-area" style={{ width: '100%' }}>
                                                <div className="prescription-toggle-container">
                                                    <div className={`p-toggle-item ${prescriptionType === 'Same power for both eyes' ? 'active' : ''}`} onClick={() => handlePrescriptionTypeChange('Same power for both eyes')}>
                                                        <div className="p-radio-circle"></div>
                                                        <span>Same power for both eyes</span>
                                                    </div>
                                                    <div className={`p-toggle-item ${prescriptionType === 'Different power for each eye' ? 'active' : ''}`} onClick={() => handlePrescriptionTypeChange('Different power for each eye')}>
                                                        <div className="p-radio-circle"></div>
                                                        <span>Different power for each eye</span>
                                                    </div>
                                                </div>

                                                <h3>Prescription Input Table</h3>
                                                <div className="prescription-table-wrapper">
                                                    <table className="prescription-table">
                                                        <thead>
                                                            <tr><th>Right Eye</th><th>Left Eye</th></tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td>
                                                                    <div className="p-row"><span>SPH</span><select value={prescription.right.sph} onChange={(e) => handlePrescriptionChange('right', 'sph', e.target.value)}>{sphValues.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                                                                    <div className="p-row"><span>CYL</span><select value={prescription.right.cyl} onChange={(e) => handlePrescriptionChange('right', 'cyl', e.target.value)}>{cylValues.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                                                                    <div className="p-row"><span>AXIS</span><input type="text" placeholder="0-180" maxLength="3" value={prescription.right.axis === 'Select' ? '' : prescription.right.axis} onChange={(e) => handlePrescriptionChange('right', 'axis', e.target.value)} /></div>
                                                                    {(selectedLensType === 'Progressive' || selectedLensType === 'Bifocal') && (
                                                                        <div className="p-row"><span>ADD</span><input type="text" placeholder="+0.00" maxLength="5" value={prescription.right.add === 'Select' ? '' : prescription.right.add} onChange={(e) => handlePrescriptionChange('right', 'add', e.target.value)} /></div>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <div className="p-row"><span>SPH</span><select value={prescription.left.sph} onChange={(e) => handlePrescriptionChange('left', 'sph', e.target.value)}>{sphValues.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                                                                    <div className="p-row"><span>CYL</span><select value={prescription.left.cyl} onChange={(e) => handlePrescriptionChange('left', 'cyl', e.target.value)}>{cylValues.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                                                                    <div className="p-row"><span>AXIS</span><input type="text" placeholder="0-180" maxLength="3" value={prescription.left.axis === 'Select' ? '' : prescription.left.axis} onChange={(e) => handlePrescriptionChange('left', 'axis', e.target.value)} /></div>
                                                                    {(selectedLensType === 'Progressive' || selectedLensType === 'Bifocal') && (
                                                                        <div className="p-row"><span>ADD</span><input type="text" placeholder="+0.00" maxLength="5" value={prescription.left.add === 'Select' ? '' : prescription.left.add} onChange={(e) => handlePrescriptionChange('left', 'add', e.target.value)} /></div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <div className="manual-user-details animate-in" style={{ width: '100%', marginTop: '20px', borderTop: '1px solid rgba(0, 0, 0, 0.05)', paddingTop: '15px' }}>
                                                    <div className="details-header" style={{ marginBottom: '10px', fontSize: '15px', fontWeight: '600' }}>Whose prescription is this</div>
                                                    <div className="details-form">
                                                        <div className="detail-input-group" style={{ marginBottom: '10px' }}>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Name *" 
                                                                value={userInfo.name} 
                                                                onChange={(e) => setUserInfo({...userInfo, name: e.target.value})} 
                                                            />
                                                        </div>
                                                        <div className="detail-input-group" style={{ marginBottom: '10px' }}>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Phone Number *" 
                                                                value={userInfo.phone} 
                                                                onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})} 
                                                            />
                                                        </div>
                                                        <div className="cant-find-power" style={{ marginBottom: '10px' }}>
                                                            <p style={{ margin: 0, fontSize: '12px' }}>Can't find your power? Chat with us on <a href="https://wa.me/917871333302" target="_blank" rel="noopener noreferrer">WhatsApp</a></p>
                                                        </div>
                                                        <div className="prescription-upload-area">
                                                            <label className="upload-box" style={{ display: 'block', border: '2px dashed #FF0075', borderRadius: '8px', padding: '15px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255, 0, 117, 0.02)' }}>
                                                                <input 
                                                                    type="file" 
                                                                    accept="image/*" 
                                                                    onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file) {
                                                                            // Release the previous preview blob before replacing it,
                                                                            // or re-picking files leaks object URLs for the session.
                                                                            if (userInfo.previewUrl?.startsWith('blob:')) {
                                                                                URL.revokeObjectURL(userInfo.previewUrl);
                                                                            }
                                                                            const preview = URL.createObjectURL(file);
                                                                            setUserInfo({
                                                                                ...userInfo,
                                                                                file,
                                                                                fileName: file.name,
                                                                                previewUrl: preview
                                                                            });
                                                                        }
                                                                    }}
                                                                    style={{ display: 'none' }}
                                                                />
                                                                <div className="upload-content">
                                                                    <div className="upload-icon" style={{ fontSize: '24px', marginBottom: '5px' }}>📷</div>
                                                                    <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
                                                                        {userInfo.fileName || 'Upload Prescription (Optional)'}
                                                                    </p>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {spectaclesPowerOption === 'later' && (
                                            <div className="spec-manual-power-entry animate-in">
                                                <a href="https://wa.me/917871333302" target="_blank" rel="noopener noreferrer" className="cl-submit-later-banner spectacles-banner animate-in" style={{ textDecoration: 'none' }}>
                                                    <div className="banner-left">
                                                        <h3>Don't worry! <FaPhoneAlt className="phone-icon-cl" /></h3>
                                                        <p>We will call you to get your power!</p>
                                                    </div>
                                                    <div className="banner-right">
                                                        <div className="lens-graphic-pair">
                                                            <div className="lens-graphic positive">
                                                                <span>+</span>
                                                                <div className="lens-shape"></div>
                                                            </div>
                                                            <div className="lens-graphic negative">
                                                                <span>-</span>
                                                                <div className="lens-shape"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : null}

                            {/* Hide enhancements section entirely for Reading Glasses */}
                            {product.category !== 'Reading Glasses' && (
                                <>
                                    <h2 className="modal-title-small">Add Lens Enhancements for {selectedLensType}</h2>
                                    <div className="enhancements-grid">
                                        {filteredEnhancements.length > 0 ? (
                                            filteredEnhancements.map((enh) => (
                                                <label key={enh.id} className={selectedEnhancements.find(e => e.id === enh.id) ? 'active' : ''}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!selectedEnhancements.find(e => e.id === enh.id)}
                                                        onChange={() => toggleEnhancement(enh)}
                                                    /> {enh.name} {enh.price > 0 && `(+₹${enh.price})`}
                                                </label>
                                            ))
                                        ) : (
                                            <div className="no-enhancements-notice">
                                                <p>No specific enhancements available for <strong>{selectedLensType}</strong> in our inventory yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {product.category === 'Reading Glasses' ? (
                                <div className="reading-modal-section">
                                    <ReadingGlassesPowerSelector onPowerSelected={(power) => setReadingPower(power)} />
                                </div>
                            ) : (
                                (product.category !== 'Spectacles' && product.category !== 'Computer Glasses' && product.category !== 'Kids Collection' && product.category !== 'Kids Collections') && (
                                        <div className="prescription-section">
                                            <div className="prescription-input-area">
                                                <h2 className="modal-title-small">Power Options - Eye Selection</h2>
                                                <div className="prescription-toggle-container">
                                                    <div className={`p-toggle-item ${prescriptionType === 'Same power for both eyes' ? 'active' : ''}`} onClick={() => handlePrescriptionTypeChange('Same power for both eyes')}>
                                                        <div className="p-radio-circle"></div>
                                                        <span>Same power for both eyes</span>
                                                    </div>
                                                    <div className={`p-toggle-item ${prescriptionType === 'Different power for each eye' ? 'active' : ''}`} onClick={() => handlePrescriptionTypeChange('Different power for each eye')}>
                                                        <div className="p-radio-circle"></div>
                                                        <span>Different power for each eye</span>
                                                    </div>
                                                </div>

                                                <h3>Prescription Input Table</h3>
                                                <div className="prescription-table-wrapper">
                                                    {manualStep === 'table' ? (
                                                        <>
                                                            <table className="prescription-table">
                                                                <thead>
                                                                    <tr><th>Right Eye</th><th>Left Eye</th></tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr>
                                                                        <td>
                                                                            <div className="p-row"><span>SPH</span><select value={prescription.right.sph} onChange={(e) => handlePrescriptionChange('right', 'sph', e.target.value)}>{sphValues.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                                                                            <div className="p-row"><span>CYL</span><select value={prescription.right.cyl} onChange={(e) => handlePrescriptionChange('right', 'cyl', e.target.value)}>{cylValues.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                                                                            <div className="p-row"><span>AXIS</span><input type="text" placeholder="0-180" maxLength="3" value={prescription.right.axis === 'Select' ? '' : prescription.right.axis} onChange={(e) => handlePrescriptionChange('right', 'axis', e.target.value)} /></div>
                                                                            {(selectedLensType === 'Progressive' || selectedLensType === 'Bifocal') && (
                                                                                <div className="p-row"><span>ADD</span><input type="text" placeholder="+0.00" maxLength="5" value={prescription.right.add === 'Select' ? '' : prescription.right.add} onChange={(e) => handlePrescriptionChange('right', 'add', e.target.value)} /></div>
                                                                            )}
                                                                        </td>
                                                                        <td>
                                                                            <div className="p-row"><span>SPH</span><select value={prescription.left.sph} onChange={(e) => handlePrescriptionChange('left', 'sph', e.target.value)}>{sphValues.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                                                                            <div className="p-row"><span>CYL</span><select value={prescription.left.cyl} onChange={(e) => handlePrescriptionChange('left', 'cyl', e.target.value)}>{cylValues.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                                                                            <div className="p-row"><span>AXIS</span><input type="text" placeholder="0-180" maxLength="3" value={prescription.left.axis === 'Select' ? '' : prescription.left.axis} onChange={(e) => handlePrescriptionChange('left', 'axis', e.target.value)} /></div>
                                                                            {(selectedLensType === 'Progressive' || selectedLensType === 'Bifocal') && (
                                                                                <div className="p-row"><span>ADD</span><input type="text" placeholder="+0.00" maxLength="5" value={prescription.left.add === 'Select' ? '' : prescription.left.add} onChange={(e) => handlePrescriptionChange('left', 'add', e.target.value)} /></div>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                            <button className="save-btn-green" onClick={handleSavePrescription}>Save</button>
                                                        </>
                                                    ) : (
                                                        <div className="manual-user-details animate-in">
                                                            <div className="details-header">Whose prescription is this</div>
                                                            <div className="details-form">
                                                                <div className="detail-input-group">
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Name *" 
                                                                        value={userInfo.name} 
                                                                        onChange={(e) => setUserInfo({...userInfo, name: e.target.value})} 
                                                                    />
                                                                </div>
                                                                <div className="detail-input-group">
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Phone Number *" 
                                                                        value={userInfo.phone} 
                                                                        onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})} 
                                                                    />
                                                                </div>
                                                                <div className="cant-find-power">
                                                                    <p>Can't find your power? Chat with us on <a href="https://wa.me/917871333302" target="_blank" rel="noopener noreferrer">WhatsApp</a></p>
                                                                </div>
                                                                <div className="prescription-upload-area">
                                                                    <label className="upload-box">
                                                                        <input 
                                                                            type="file" 
                                                                            accept="image/*" 
                                                                            onChange={(e) => {
                                                                                const file = e.target.files[0];
                                                                                if (file) setUserInfo({...userInfo, file, fileName: file.name});
                                                                            }} 
                                                                        />
                                                                        <div className="upload-content">
                                                                            <div className="upload-icon">📷</div>
                                                                            <p>{userInfo.fileName || 'Upload Prescription (Optional)'}</p>
                                                                        </div>
                                                                    </label>
                                                                </div>
                                                                <button 
                                                                    className="save-proceed-btn" 
                                                                    onClick={() => handleUserInfoSubmit(() => {
                                                                        onClose(); 
                                                                        setDrawerTab('cart'); 
                                                                        setCartOpen(true);
                                                                    })}
                                                                >
                                                                    Save & Proceed
                                                                </button>
                                                                <button className="back-to-table" onClick={() => setManualStep('table')}>Back to Power Table</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}

                            <h2 className="modal-title-small">How will you use these glasses?</h2>
                            <div className="usage-grid">
                                {['Everyday', 'Computer | Screen', 'Reading', 'Driving'].map((u, i) => (
                                    <div key={u} className={`usage-item ${selectedUsage === u ? 'active' : ''}`} onClick={() => setSelectedUsage(u)}>
                                        <div className="usage-box">
                                            <span className="usage-emoji">{['🏠', '💻', '📚', '🚗'][i]}</span>
                                        </div>
                                        <p>{u === 'Computer | Screen' ? 'Digital Use' : u}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    <div className="price-summary-box">
                        {product.category !== 'Contact Lenses' && (
                            <div className="p-line"><span>Frame Price:</span> <span>{product.price}</span></div>
                        )}
                        
                        {product.category !== 'Contact Lenses' && (
                            <div className="p-line">
                                <span>Select Lens Type: {selectedLensType}</span>
                                <span>{calculatePriceDetails().lensPrice > 0 ? `₹${calculatePriceDetails().lensPrice}` : 'Included'}</span>
                            </div>
                        )}

                        {product.category === 'Contact Lenses' && (
                            <>
                                {calculatePriceDetails().framePrice > 0 && (
                                    <div className="p-line">
                                        <span>Base Product Price:</span> 
                                        <span>₹{calculatePriceDetails().framePrice}</span>
                                    </div>
                                )}
                                <div className="p-line">
                                    <span>
                                        {contactLensPacks.find(p => p.id === selectedClPack)?.name} ({isSolution ? `${clRightBoxes} Qty` : `${clRightBoxes} Boxes`}):
                                    </span>
                                    <span>{calculatePriceDetails().lensPrice > 0 ? `₹${calculatePriceDetails().lensPrice}` : 'Included'}</span>
                                </div>
                            </>
                        )}
                        
                        {product.category !== 'Contact Lenses' && selectedEnhancements.map(enh => (
                            <div className="p-line" key={enh.id}>
                                <span>{enh.name}:</span>
                                <span>₹{enh.price}</span>
                            </div>
                        ))}
                        
                        {/* GST and Total Price Details */}
                        <div className="p-line gst-line">
                            <span>GST ({calculatePriceDetails().gstRate}%):</span>
                            <span>+ ₹{calculatePriceDetails().tax}</span>
                        </div>
                        
                        <div className="p-total-line">
                            <span>Total Price:</span> 
                            <span>₹{calculatePriceDetails().total}</span>
                        </div>
                    </div>

                    <div className="modal-footer-btns">
                        <button 
                            className={`modal-add-cart ${product.stock !== undefined && product.stock <= 0 ? 'disabled' : ''}`} 
                            disabled={product.stock !== undefined && product.stock <= 0}
                            onClick={() => handleFinalAction('cart')}
                        >Add to Order</button>
                        <button 
                            className={`modal-buy-now ${product.stock !== undefined && product.stock <= 0 ? 'disabled' : ''}`} 
                            disabled={product.stock !== undefined && product.stock <= 0}
                            onClick={() => handleFinalAction('buy')}
                        >Confirm & Review</button>
                    </div>
                </div>
            </div>

            {showPowerSelectorModal && (
                <div className="cl-power-submodal-overlay" onClick={() => setShowPowerSelectorModal(null)}>
                    <div className="cl-power-submodal reveal-bottom" onClick={e => e.stopPropagation()}>
                        <div className="submodal-header">
                            <h3>Spherical • {showPowerSelectorModal.includes('right') ? 'Right' : 'Left'} Eye</h3>
                            <button className="submodal-close" onClick={() => setShowPowerSelectorModal(null)}>✕</button>
                        </div>
                        <div className="cl-power-tabs-mobile">
                            <button className={`cl-tab ${clPowerTab === 'negative' ? 'active' : ''}`} onClick={() => setClPowerTab('negative')}>(-) Negative</button>
                            <button className={`cl-tab ${clPowerTab === 'positive' ? 'active' : ''}`} onClick={() => setClPowerTab('positive')}>(+) Positive</button>
                        </div>
                        <div className="submodal-powers-container">
                            <div className={`powers-col negative-col ${clPowerTab === 'negative' ? 'show-mobile' : 'hide-mobile'}`}>
                                <div className="col-header">(-) Negative</div>
                                <div className="powers-list">
                                    {['-0.25', '-0.50', '-0.75', '-1.00', '-1.25', '-1.50', '-1.75', '-2.00', '-2.25', '-2.50', '-2.75', '-3.00'].map(p => (
                                        <label className="power-option" key={p}>
                                            <input type="radio" name={`${showPowerSelectorModal}-power`} 
                                                checked={(showPowerSelectorModal === 'right' ? clRightSph : (showPowerSelectorModal === 'left' ? clLeftSph : (showPowerSelectorModal === 'spec-right' ? prescription.right.sph : prescription.left.sph))) === p}
                                                onChange={() => {
                                                    if (showPowerSelectorModal === 'right') setClRightSph(p);
                                                    else if (showPowerSelectorModal === 'left') setClLeftSph(p);
                                                    else if (showPowerSelectorModal === 'spec-right') handlePrescriptionChange('right', 'sph', p);
                                                    else if (showPowerSelectorModal === 'spec-left') handlePrescriptionChange('left', 'sph', p);
                                                    setShowPowerSelectorModal(null);
                                                }}
                                            /> 
                                            <span className="power-radio"></span> {p}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className={`powers-col positive-col ${clPowerTab === 'positive' ? 'show-mobile' : 'hide-mobile'}`}>
                                <div className="col-header">(+) Positive</div>
                                <div className="powers-list">
                                    {['0.00', '+0.25', '+0.50', '+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75'].map(p => (
                                        <label className="power-option" key={p}>
                                            <input type="radio" name={`${showPowerSelectorModal}-power`} 
                                                checked={(showPowerSelectorModal === 'right' ? clRightSph : (showPowerSelectorModal === 'left' ? clLeftSph : (showPowerSelectorModal === 'spec-right' ? prescription.right.sph : prescription.left.sph))) === p}
                                                onChange={() => {
                                                    if (showPowerSelectorModal === 'right') setClRightSph(p);
                                                    else if (showPowerSelectorModal === 'left') setClLeftSph(p);
                                                    else if (showPowerSelectorModal === 'spec-right') handlePrescriptionChange('right', 'sph', p);
                                                    else if (showPowerSelectorModal === 'spec-left') handlePrescriptionChange('left', 'sph', p);
                                                    setShowPowerSelectorModal(null);
                                                }}
                                            /> 
                                            <span className="power-radio"></span> {p}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};

export default LensSelectionModal;
