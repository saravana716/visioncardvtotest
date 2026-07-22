import React, { useState, useRef, useEffect } from 'react';
import { IoLocationOutline, IoChevronDown } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { lookupPincode, getSavedLocation, saveLocation } from '../../utils/pincode';
import './LocationPicker.css';

// A delivery-location picker: the customer enters a PIN, we validate
// serviceability via India Post, and the resolved city/PIN is shown and
// persisted (shared app-wide via utils/pincode).
const LocationPicker = () => {
    const [location, setLocation] = useState(() => getSavedLocation());
    const [open, setOpen] = useState(false);
    const [pin, setPin] = useState('');
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState('');
    const ref = useRef(null);

    // Keep in sync if another surface (e.g. the product page) changes it.
    useEffect(() => {
        const onChange = (e) => setLocation(e.detail || getSavedLocation());
        window.addEventListener('vk-location-changed', onChange);
        return () => window.removeEventListener('vk-location-changed', onChange);
    }, []);

    // Close on outside click.
    useEffect(() => {
        const onDocClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const handleCheck = async () => {
        setError('');
        setChecking(true);
        const result = await lookupPincode(pin);
        setChecking(false);
        if (result.ok) {
            const loc = { pincode: result.pincode, city: result.city, state: result.state };
            saveLocation(loc);
            setLocation(loc);
            setOpen(false);
            setPin('');
            toast.success(`Delivering to ${result.city}, ${result.state}`);
        } else {
            setError(result.message);
        }
    };

    const label = location
        ? `${location.pincode} · ${location.city}`
        : 'Select Location';

    return (
        <div className="location-picker" ref={ref}>
            <button
                type="button"
                className="location-trigger"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-label="Choose delivery location"
            >
                <IoLocationOutline className="loc-icon" />
                <span className="loc-label">{label}</span>
                <IoChevronDown className="loc-caret" />
            </button>

            {open && (
                <div className="location-dropdown">
                    <p className="loc-dd-title">Check delivery to your area</p>
                    <div className="loc-input-row">
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Enter 6-digit PIN"
                            value={pin}
                            aria-label="Delivery PIN code"
                            onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCheck(); }}
                        />
                        <button type="button" onClick={handleCheck} disabled={checking}>
                            {checking ? '…' : 'Apply'}
                        </button>
                    </div>
                    {error && <p className="loc-error">{error}</p>}
                    {location && !error && (
                        <p className="loc-current">Currently delivering to <strong>{location.city}, {location.state}</strong></p>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
