const fs = require('fs');
const file = 'c:/Users/vsara/Desktop/visionKartSivakasi-master/visionKartSivakasi-master/visionkart-web/visioncardvtotest/src/Components/LensSelectionModal/LensSelectionModal.jsx';
const content = fs.readFileSync(file, 'utf8');

// Normalize line endings to LF to avoid CRLF mismatch in javascript string templates
const lines = content.replace(/\r\n/g, '\n').split('\n');

// Verify line 915 starts with '{spectaclesPowerOption === \'manual\' && ('
console.log('Line 915:', lines[914]);
console.log('Line 1140:', lines[1139]);

if (lines[914].includes('spectaclesPowerOption === \'manual\'') && lines[1139].trim() === ')}') {
    const replacement = `                                         {spectaclesPowerOption === 'manual' && (
                                            <div className="prescription-input-area" style={{ width: '100%' }}>
                                                <div className="prescription-toggle-container">
                                                    <div className={\`p-toggle-item \${prescriptionType === 'Same power for both eyes' ? 'active' : ''}\`} onClick={() => handlePrescriptionTypeChange('Same power for both eyes')}>
                                                        <div className="p-radio-circle"></div>
                                                        <span>Same power for both eyes</span>
                                                    </div>
                                                    <div className={\`p-toggle-item \${prescriptionType === 'Different power for each eye' ? 'active' : ''}\`} onClick={() => handlePrescriptionTypeChange('Different power for each eye')}>
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
                                        )}`;
    
    // Replace lines 915 to 1140 (indexes 914 to 1139) with the replacement
    lines.splice(914, 1139 - 915 + 1, replacement);
    
    // Also replace the validation block (lines 372-393 in the original, let's find it dynamically or replace it by content)
    let newContent = lines.join('\n');
    
    // Find the validation section and replace it
    const validationTarget = `        if (isSpectacles && spectaclesPowerOption === 'manual') {
            if (!userInfo.name || !userInfo.phone) {
                const { default: toast } = await import('react-hot-toast');
                toast.error('Please provide name and phone number');
                return false;
            }
            if (specRightSelected && (prescription.right.sph === 'Select' || !prescription.right.sph)) {
                const { default: toast } = await import('react-hot-toast');
                toast.error('Please select Spherical power for Right eye');
                return false;
            }
            if (specLeftSelected && (prescription.left.sph === 'Select' || !prescription.left.sph)) {
                const { default: toast } = await import('react-hot-toast');
                toast.error('Please select Spherical power for Left eye');
                return false;
            }
            if (!specRightSelected && !specLeftSelected) {
                const { default: toast } = await import('react-hot-toast');
                toast.error('Please select at least one eye');
                return false;
            }
        }`;
        
    const validationReplacement = `        if (isSpectacles && spectaclesPowerOption === 'manual') {
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
        }`;
        
    if (newContent.includes(validationTarget)) {
        newContent = newContent.replace(validationTarget, validationReplacement);
        console.log('VALIDATION REPLACED SUCCESSFULLY');
    } else {
        console.log('VALIDATION TARGET NOT FOUND');
    }
    
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('LAYOUT REPLACEMENT SUCCESSFUL');
} else {
    console.log('LINE CHECK FAILED');
}
