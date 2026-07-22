import React from 'react'
import "./UserSlider.css"
import user from "../../assets/book.png"

const UserSlider = () => {
    const images = import.meta.glob('../../assets/role/*.{png,jpg,jpeg,webp}', { eager: true });
    
    const originalUsers = Object.entries(images).map(([path, module], index) => {
        const fileName = path.split('/').pop().replace(/\.[^/.]+$/, "");
        return {
            id: index + 1,
            name: fileName,
            img: module.default || module
        };
    });

    // 6 sets (30 items) ensures even huge screens are fully covered 
    // for a perfectly seamless infinite scroll without any empty space.
    const displayUsers = [...originalUsers, ...originalUsers, ...originalUsers, ...originalUsers, ...originalUsers, ...originalUsers];

    return (
        <div className='userslider-section'>
            <div className='carousel-container'>
                <div className='carousel-viewport'>
                    <div className='carousel-track' >
                        {displayUsers.map((data, index) => (
                            <div className='usercard' key={index}>
                                <div className='role-img-wrapper'>
                                    <img src={data.img} alt="" loading="lazy" decoding="async" />
                                </div>
                                <p className='role-title'>{data.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserSlider