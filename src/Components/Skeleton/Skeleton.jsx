import React from 'react';
import './Skeleton.css';

const Skeleton = ({ type }) => {
    if (type === 'product') {
        return (
            <div className="skeleton-product-card">
                <div className="skeleton-img"></div>
                <div className="skeleton-info">
                    <div className="skeleton-line title"></div>
                    <div className="skeleton-line price"></div>
                </div>
            </div>
        );
    }

    if (type === 'category') {
        return (
            <div className="skeleton-category-card">
                <div className="skeleton-circle"></div>
                <div className="skeleton-line"></div>
            </div>
        );
    }

    return <div className="skeleton-generic"></div>;
};

export default Skeleton;
