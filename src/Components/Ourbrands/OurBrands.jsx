import React from 'react'
import "./OurBrands.css"

const OurBrands = () => {
    const images = import.meta.glob('../../assets/mybrands/*.{png,jpg,jpeg,webp,svg}', { eager: true });

    const originalBrands = Object.entries(images).map(([path, module], index) => {
        const filename = path.split('/').pop().replace(/\.\w+$/, '');
        const name = filename.replace(/[-_]+/g, ' ').trim();
        return {
            id: index + 1,
            img: module.default || module,
            name
        };
    });

    // Duplicate the brands multiple times to ensure the track spans beyond the screen width
    const duplicateSets = 5;
    const displayBrands = Array.from({ length: 1 + duplicateSets }).flatMap(() => originalBrands);

    return (
        <div className='our-brands-section'>
            <h1>Our Brands</h1>

            <div className='carousel-viewport'>
                <div className='carousel-track'>
                    {displayBrands.map((data, index) => {
                        const isFirstSet = index < originalBrands.length;
                        return (
                            <div
                                className='brand-card'
                                key={index}
                                aria-hidden={isFirstSet ? undefined : true}
                            >
                                <img
                                    src={data.img}
                                    alt={isFirstSet ? data.name : ''}
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )
}

export default OurBrands
