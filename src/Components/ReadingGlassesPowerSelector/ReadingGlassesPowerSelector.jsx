import React, { useState } from 'react';
import './ReadingGlassesPowerSelector.css';

// Age-to-power mapping for reading glasses
const AGE_POWER_TABLE = [
    { id: 1, age: '39 to 40', powers: ['+1.00'] },
    { id: 2, age: '40 to 43', powers: ['+1.00', '+1.25'] },
    { id: 3, age: '43 to 45', powers: ['+1.25', '+1.50'] },
    { id: 4, age: '45 to 47', powers: ['+1.50', '+1.75'] },
    { id: 5, age: '47 to 50', powers: ['+1.75', '+2.00'] },
    { id: 6, age: '50 to 53', powers: ['+2.00', '+2.25'] },
    { id: 7, age: '53 to 55', powers: ['+2.25', '+2.50'] },
    { id: 8, age: '55 to 57', powers: ['+2.50', '+2.75'] },
    { id: 9, age: 'Above 57', powers: ['+3.00'] },
];

const ALL_POWERS = ['+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00'];

const ReadingGlassesPowerSelector = ({ productImage, onPowerSelected }) => {
    const [sameForBoth, setSameForBoth] = useState(true);
    const [rightPower, setRightPower] = useState('');
    const [leftPower, setLeftPower] = useState('');
    const [selectedAge, setSelectedAge] = useState(null);
    const [showTable, setShowTable] = useState(false);

    const handleRightPowerChange = (val) => {
        setRightPower(val);
        let currentLeft = leftPower;
        if (sameForBoth) {
            currentLeft = val;
            setLeftPower(val); 
        }
        onPowerSelected?.({ rightPower: val, leftPower: currentLeft, sameForBoth });
    };

    const handleLeftPowerChange = (val) => {
        setLeftPower(val);
        onPowerSelected?.({ rightPower, leftPower: val, sameForBoth });
    };

    const handleModeChange = (isSame) => {
        setSameForBoth(isSame);
        let updatedLeft = leftPower;
        if (isSame && rightPower) {
            updatedLeft = rightPower;
            setLeftPower(rightPower);
        }
        onPowerSelected?.({ rightPower, leftPower: updatedLeft, sameForBoth: isSame });
    };

    const handleAgeSelect = (row) => {
        setSelectedAge(row.id);
        const powerToSet = row.powers[0]; // Choose first/lower power by default
        
        setRightPower(powerToSet);
        let currentLeft = leftPower;
        
        if (sameForBoth) {
            currentLeft = powerToSet;
            setLeftPower(powerToSet);
        } else {
            // If they are in different mode, update both as a convenient starting point
            setLeftPower(powerToSet);
            currentLeft = powerToSet;
        }
        
        onPowerSelected?.({ 
            rightPower: powerToSet, 
            leftPower: currentLeft, 
            sameForBoth 
        });
        
        setShowTable(false);
    };

    const isReady = rightPower && (sameForBoth || leftPower);

    return (
        <div className="rg-selector-container">
            {/* User-friendly Header */}
            <div className="rg-header">
                <div className="rg-category-tag">Reading Glasses</div>
                <h3>Select Your Power</h3>
                <p className="rg-subtext">Choose your lens power based on age or prescription</p>
            </div>

            {/* Mode Selection with Visual Icons */}
            <div className="rg-visual-modes">
                <div 
                    className={`rg-mode-card ${sameForBoth ? 'active' : ''}`}
                    onClick={() => handleModeChange(true)}
                >
                    <div className="mode-viz">
                        <div className="eye-pair">
                            <span className="eye-icon">👁️</span>
                            <span className="eye-sync">🔗</span>
                            <span className="eye-icon">👁️</span>
                        </div>
                    </div>
                    <p>Same Power</p>
                    <span>Both Eyes</span>
                </div>
                <div 
                    className={`rg-mode-card ${!sameForBoth ? 'active' : ''}`}
                    onClick={() => handleModeChange(false)}
                >
                    <div className="mode-viz">
                        <div className="eye-pair split">
                            <span className="eye-icon">👁️</span>
                            <span className="eye-divider">|</span>
                            <span className="eye-icon">👁️</span>
                        </div>
                    </div>
                    <p>Different Power</p>
                    <span>Each Eye</span>
                </div>
            </div>

            {/* Age Guide Trigger */}
            <div className="rg-guide-wrapper">
                <div className="rg-guide-pill" onClick={() => setShowTable(!showTable)}>
                    <span className="pill-icon">📊</span>
                    <span className="pill-text">Age-to-Power Guide</span>
                    <span className={`pill-arrow ${showTable ? 'open' : ''}`}>↓</span>
                </div>
            </div>

            {/* Age-Power Table */}
            {showTable && (
                <div className="rg-table-container reveal-down">
                    <table className="rg-guide-table">
                        <thead>
                            <tr>
                                <th>Age Group</th>
                                <th>Recommended Power</th>
                            </tr>
                        </thead>
                        <tbody>
                            {AGE_POWER_TABLE.map((row) => (
                                <tr
                                    key={row.id}
                                    className={`rg-row-btn ${selectedAge === row.id ? 'active' : ''}`}
                                    onClick={() => handleAgeSelect(row)}
                                >
                                    <td>{row.age}</td>
                                    <td>
                                        <span className="power-val">{row.powers.join(' / ')}</span>
                                        {row.powers.length > 1 && <small>*</small>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="table-disclaimer">*Choose the lower power if using for the first time</p>
                </div>
            )}

            {/* Input Section */}
            <div className="rg-inputs-section">
                <div className="rg-input-grid">
                    <div className="rg-input-item">
                        <label>RIGHT EYE (OD)</label>
                        <select
                            value={rightPower}
                            onChange={(e) => handleRightPowerChange(e.target.value)}
                        >
                            <option value="">Choose Power</option>
                            {ALL_POWERS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className={`rg-input-item ${sameForBoth ? 'disabled' : ''}`}>
                        <label>LEFT EYE (OS)</label>
                        <select
                            value={sameForBoth ? rightPower : leftPower}
                            onChange={(e) => handleLeftPowerChange(e.target.value)}
                            disabled={sameForBoth}
                        >
                            <option value="">{sameForBoth ? rightPower : 'Choose Power'}</option>
                            {!sameForBoth && ALL_POWERS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Selection Summary */}
            <div className="rg-selected-display">
                <div className="display-label">SELECTED POWER</div>
                <div className="display-grid">
                    <div className="display-box">
                        <span className="side">OD</span>
                        <span className="pwr">{rightPower || '----'}</span>
                    </div>
                    <div className="display-box">
                        <span className="side">OS</span>
                        <span className="pwr">{sameForBoth ? (rightPower || '----') : (leftPower || '----')}</span>
                    </div>
                </div>
            </div>

            {/* Save Button for consistency */}
            {(rightPower || leftPower) && (
                <button 
                    className="rg-save-btn"
                    onClick={() => {
                        import('react-hot-toast').then(({ default: toast }) => {
                            toast.success('Power selection completed', {
                                style: {
                                    borderRadius: '10px',
                                    background: '#001f54',
                                    color: '#fff',
                                    fontWeight: '700',
                                    fontSize: '14px'
                                },
                                iconTheme: {
                                    primary: '#00d285',
                                    secondary: '#fff',
                                },
                            });
                        });
                    }}
                >
                    Save Selection
                </button>
            )}
        </div>
    );
};

export default ReadingGlassesPowerSelector;
