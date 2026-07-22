import React from 'react';
import logo from '../assets/vision_cart_logo.png';

const InvoiceDocument = ({ order, id }) => {
    if (!order) return null;

    const formatDate = (timestamp) => {
        if (!timestamp) return "";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const priceToNum = (priceStr) => {
        return parseFloat(priceStr?.toString().replace(/[^0-9.]/g, '') || '0');
    };

    const numberToWords = (num) => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const inWords = (n) => {
            if ((n = n.toString()).length > 9) return 'overflow';
            let nArr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!nArr) return ''; 
            let str = '';
            str += nArr[1] != 0 ? (a[Number(nArr[1])] || b[nArr[1][0]] + ' ' + a[nArr[1][1]]) + 'Crore ' : '';
            str += nArr[2] != 0 ? (a[Number(nArr[2])] || b[nArr[2][0]] + ' ' + a[nArr[2][1]]) + 'Lakh ' : '';
            str += nArr[3] != 0 ? (a[Number(nArr[3])] || b[nArr[3][0]] + ' ' + a[nArr[3][1]]) + 'Thousand ' : '';
            str += nArr[4] != 0 ? (a[Number(nArr[4])] || b[nArr[4][0]] + ' ' + a[nArr[4][1]]) + 'Hundred ' : '';
            str += nArr[5] != 0 ? (str != '' ? 'and ' : '') + (a[Number(nArr[5])] || b[nArr[5][0]] + ' ' + a[nArr[5][1]]) + 'Rupees ' : '';
            return str;
        };

        const amount = Math.floor(num);
        const paise = Math.round((num - amount) * 100);
        let result = inWords(amount);
        if (paise > 0) {
            result += 'and ' + inWords(paise).replace('Rupees', 'Paise');
        }
        return result + 'Only';
    };

    // Reconcile the line items with the charged grand total. `amounts` are the
    // authoritative figures written at checkout: rawSubtotal (pre-discount),
    // subtotal (post-discount), discount, and the CGST/SGST/IGST split. Apply
    // the same discount factor to each line so the Total column adds up.
    const amounts = order.amounts || {};
    const rawSubtotal = Math.round(Number(amounts.rawSubtotal) || 0);
    const discountedSubtotal = amounts.subtotal != null ? Number(amounts.subtotal) : rawSubtotal;
    const discountAmt = Math.round(Number(amounts.discount) || 0);
    const discountFactor = rawSubtotal > 0 && discountAmt > 0 ? discountedSubtotal / rawSubtotal : 1;
    const taxDetails = amounts.taxDetails || {};
    const couponCode = order.appliedCoupon?.code || '';

    // Place of supply is the buyer's state (drives intra vs inter-state GST),
    // not a hardcoded Tamil Nadu. Show the code only for TN (the one we know).
    const buyerState = order.shippingAddress?.state || order.billingAddress?.state || 'Tamil Nadu';
    const placeOfSupply = buyerState.toLowerCase() === 'tamil nadu' ? 'Tamil Nadu (33)' : buyerState;

    return (
        <div className="invoice-document paper" id={id}>
            {/* Header Information Area */}
            <div className="doc-section header-grid">
                <div className="grid-cell logo-cell">
                    <img src={logo} alt="VisionKart" className="doc-logo" />
                </div>
                <div className="grid-cell type-cell">
                    <h1>TAX INVOICE</h1>
                </div>
            </div>

            <div className="doc-section address-grid">
                <div className="grid-cell left-align">
                    <h4 className="cell-label">SOLD BY:</h4>
                    <div className="cell-content">
                        <p className="org-name">VisionKart Optical</p>
                        <p>19,Thiruthangal Road, Near Senaithalaivar kalyana Mandapam</p>
                        <p>Sivakasi - 626123, Tamil Nadu</p>
                        <p>Phone: +91 78713 33302</p>
                        <p>Email: visionkart.onlinestore@gmail.com</p>
                        <p><strong>GSTIN: 33CKRPK8245C1Z1</strong></p>
                    </div>
                </div>
                <div className="grid-cell right-align border-left">
                    <h4 className="cell-label">INVOICE PARTICULARS:</h4>
                    <div className="cell-content">
                        <p><span>Invoice No:</span> Vision-{order.id?.slice(-6).toUpperCase()}</p>
                        <p><span>Order No:</span> {order.id?.slice(0, 10).toUpperCase()}</p>
                        <p><span>Date:</span> {formatDate(order.createdAt)}</p>
                        <p><span>Place of Supply:</span> {placeOfSupply}</p>
                    </div>
                </div>
            </div>

            <div className="doc-section address-grid border-top">
                <div className="grid-cell left-align">
                    <h4 className="cell-label">BILL TO:</h4>
                    <div className="cell-content">
                        <p><strong>{order.billingAddress?.fullName || order.shippingAddress?.fullName}</strong></p>
                        <p>{order.billingAddress?.address || order.shippingAddress?.address}</p>
                        <p>{order.billingAddress?.city || order.shippingAddress?.city}, {order.billingAddress?.zip || order.shippingAddress?.zip}</p>
                        <p>{order.billingAddress?.state || "Tamil Nadu"}, Code: {order.billingAddress?.state?.toLowerCase() === 'tamil nadu' ? '33' : 'Other'}</p>
                        <p>Mobile: {order.billingAddress?.phone || order.shippingAddress?.phone}</p>
                    </div>
                </div>
                <div className="grid-cell left-align border-left">
                    <h4 className="cell-label">SHIP TO:</h4>
                    <div className="cell-content">
                        <p><strong>{order.shippingAddress?.fullName}</strong></p>
                        <p>{order.shippingAddress?.address}</p>
                        <p>{order.shippingAddress?.city}, {order.shippingAddress?.zip}</p>
                        <p>{order.shippingAddress?.state || "Tamil Nadu"}, Code: {order.shippingAddress?.state?.toLowerCase() === 'tamil nadu' ? '33' : 'Other'}</p>
                        <p>Mobile: {order.shippingAddress?.phone}</p>
                    </div>
                </div>
            </div>

            {/* Main Product Table */}
            <div className="doc-section table-section border-top">
                <table className="corporate-table items-table">
                    <thead>
                        <tr>
                            <th style={{width: '40px'}}>Sl.</th>
                            <th>Description of Goods</th>
                            <th className="text-center">HSN</th>
                            <th className="text-center">Qty</th>
                            <th className="text-right">Rate</th>
                            <th className="text-right">GST Rate</th>
                            <th className="text-right">Tax Amt.</th>
                            <th className="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items?.map((item, idx) => {
                            // Fold in the line quantity AND the order discount so
                            // Tax Amt / Total are line-level and net of any coupon
                            // — the Total column then reconciles with the grand
                            // total below (which is the discounted amount charged).
                            const qty = Math.max(1, Number(item.quantity) || 1);
                            const unitRate = priceToNum(item.totalPrice);
                            const rate = (item.category === 'Sunglasses') ? 0.18 : 0.12;
                            const lineTaxable = unitRate * qty * discountFactor;
                            const lineTax = lineTaxable * rate;
                            const itemTotal = lineTaxable + lineTax;
                            return (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>
                                        <p className="item-name-bold">{item.productName || 'Optical Product'}</p>
                                        <p className="item-sub-desc">
                                            {item.productBrand || 'VisionKart'}
                                            {item.lensType ? ` | ${item.lensType}` : ''}
                                            {item.productSize ? ` | ${item.productSize} Size` : ''}
                                        </p>
                                    </td>
                                    <td className="text-center">9003</td>
                                    <td className="text-center">{qty.toFixed(2)}</td>
                                    <td className="text-right">{unitRate.toFixed(2)}</td>
                                    <td className="text-right">{(rate * 100).toFixed(0)}%</td>
                                    <td className="text-right">{lineTax.toFixed(2)}</td>
                                    <td className="text-right">₹{itemTotal.toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        {discountAmt > 0 && (
                            <>
                                <tr>
                                    <td colSpan="7" className="text-right">Sub Total</td>
                                    <td className="text-right">₹{rawSubtotal.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td colSpan="7" className="text-right">Discount{couponCode ? ` (${couponCode})` : ''}</td>
                                    <td className="text-right">- ₹{discountAmt.toLocaleString()}</td>
                                </tr>
                            </>
                        )}
                        {taxDetails.isIntraState ? (
                            <>
                                <tr>
                                    <td colSpan="7" className="text-right">CGST</td>
                                    <td className="text-right">₹{(Number(taxDetails.cgst) || 0).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td colSpan="7" className="text-right">SGST</td>
                                    <td className="text-right">₹{(Number(taxDetails.sgst) || 0).toLocaleString()}</td>
                                </tr>
                            </>
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-right">IGST</td>
                                <td className="text-right">₹{(Number(taxDetails.igst ?? order.amounts?.tax) || 0).toLocaleString()}</td>
                            </tr>
                        )}
                        <tr>
                            <td colSpan="7" className="text-right bold-label">TOTAL</td>
                            <td className="text-right bold-label">₹{order.amounts?.total?.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Amount in Words */}
            <div className="doc-section words-section border-top">
                <p><span>Amount Chargeable (in words):</span> <br/> <strong>INR {numberToWords(order.amounts?.total || 0)}</strong></p>
            </div>


            {/* Footer and Terms */}
            <div className="doc-section footer-grid border-top">
                <div className="grid-cell terms-cell">
                    <p className="tiny-title">Terms & Conditions:</p>
                    <ol className="terms-list">
                        <li>Goods once sold will not be taken back or exchanged.</li>
                        <li>Lenses are custom-made; no cancellation after processing.</li>
                        <li>All disputes are subject to Sivakasi jurisdiction only.</li>
                    </ol>
                    <p className="payment-note">Payment Status: <span>{order.paymentMethod}</span></p>
                </div>
                <div className="grid-cell auth-cell border-left">
                    <p className="sign-for">for VisionKart Optical</p>
                    <div className="spacer-large"></div>
                    <p className="sign-label">Authorized Signatory</p>
                </div>
            </div>
            <div className="doc-section bottom-tag">
                <p>This is a computer generated invoice and does not require a physical signature.</p>
            </div>
        </div>
    );
};

export default InvoiceDocument;
