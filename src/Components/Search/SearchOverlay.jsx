import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes, FaArrowRight } from 'react-icons/fa';
import { getProducts } from '../../services/firestoreService';
import { formatRupees } from '../../utils/price';
import './SearchOverlay.css';
import { PLACEHOLDER_IMG } from '../../utils/placeholderImage';

const POPULAR_SEARCHES = ['Blue Block', 'Wayfarer', 'Ray-Ban', 'Computer Glasses', 'Round'];

const SearchOverlay = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [catalogue, setCatalogue] = useState(null);
    const [catalogueLoading, setCatalogueLoading] = useState(false);
    const navigate = useNavigate();
    const inputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            document.body.style.overflow = 'auto';
            return;
        }
        if (inputRef.current) inputRef.current.focus();
        document.body.style.overflow = 'hidden';

        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);

        return () => {
            document.body.style.overflow = 'auto';
            document.removeEventListener('keydown', handleKey);
        };
    }, [isOpen, onClose]);

    // Fetch the catalogue once when the overlay first opens; reuse for every keystroke.
    useEffect(() => {
        if (!isOpen || catalogue || catalogueLoading) return;
        let cancelled = false;
        setCatalogueLoading(true);
        getProducts()
            .then((all) => {
                if (!cancelled) setCatalogue(all || []);
            })
            .catch((e) => {
                console.error('Search catalogue fetch failed:', e);
                if (!cancelled) setCatalogue([]);
            })
            .finally(() => {
                if (!cancelled) setCatalogueLoading(false);
            });
        return () => { cancelled = true; };
    }, [isOpen, catalogue, catalogueLoading]);

    useEffect(() => {
        const term = query.trim();
        if (term.length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const timer = setTimeout(() => {
            if (catalogue === null) {
                setLoading(catalogueLoading);
                return;
            }
            const lower = term.toLowerCase();
            const filtered = catalogue.filter(p =>
                p.title?.toLowerCase().includes(lower) ||
                p.name?.toLowerCase().includes(lower) ||
                p.brand?.toLowerCase().includes(lower) ||
                p.category?.toLowerCase().includes(lower)
            ).slice(0, 5);
            setResults(filtered);
            setLoading(false);
        }, 250);
        return () => clearTimeout(timer);
    }, [query, catalogue, catalogueLoading]);

    const handleResultClick = (id) => {
        navigate(`/product/${id}`);
        onClose();
        setQuery('');
    };

    if (!isOpen) return null;

    return (
        <div
            className="search-overlay-v2 fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
        >
            <div className="search-container-v2 animate-slide-down">
                <div className="search-header-v2">
                    <div className="search-input-wrapper">
                        <FaSearch className="search-icon-v2" aria-hidden="true" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search for frames, brands, or styles..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Search"
                        />
                    </div>
                    <button className="close-search-btn" onClick={onClose} aria-label="Close search">
                        <FaTimes />
                    </button>
                </div>

                <div className="search-body-v2">
                    {loading ? (
                        <div className="no-res-state"><p>Searching…</p></div>
                    ) : results.length > 0 ? (
                        <div className="results-list-v2">
                            <h4 className="results-title">Top Results</h4>
                            {results.map(p => {
                                // getProducts() returns raw Firestore docs: the image
                                // lives in photos[], the name in `name`, and price is a
                                // number — the old mainImage/title/price fields were
                                // blank. Prefer the offer price when present.
                                const image = p.photos?.[0] || p.mainImage || p.img
                                    || PLACEHOLDER_IMG;
                                const displayName = p.name || p.title || 'Product';
                                const priceVal = (p.offerPrice != null && p.offerPrice !== '')
                                    ? p.offerPrice
                                    : p.price;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        className="search-result-item"
                                        onClick={() => handleResultClick(p.id)}
                                    >
                                        <div className="result-img">
                                            <img src={image} alt={displayName} />
                                        </div>
                                        <div className="result-info">
                                            <p className="res-brand">{p.brand}</p>
                                            <p className="res-name">{displayName}</p>
                                            <p className="res-price">{formatRupees(priceVal)}</p>
                                        </div>
                                        <FaArrowRight className="res-arrow" aria-hidden="true" />
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                className="view-all-res"
                                onClick={() => {
                                    navigate(`/products?search=${encodeURIComponent(query)}`);
                                    onClose();
                                }}
                            >
                                View all results for "{query}"
                            </button>
                        </div>
                    ) : query.trim().length > 1 ? (
                        <div className="no-res-state">
                            <p>No products found for "<span>{query}</span>"</p>
                            <p style={{ fontSize: '13px', color: '#777', marginTop: '8px' }}>
                                Try: {POPULAR_SEARCHES.slice(0, 3).join(', ')}
                            </p>
                        </div>
                    ) : (
                        <div className="search-suggestions">
                            <h4>Popular Searches</h4>
                            <div className="tag-list">
                                {POPULAR_SEARCHES.map(tag => (
                                    <button
                                        type="button"
                                        key={tag}
                                        className="s-tag"
                                        onClick={() => setQuery(tag)}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <button
                type="button"
                className="search-backdrop"
                onClick={onClose}
                aria-label="Close search"
            />
        </div>
    );
};

export default SearchOverlay;
