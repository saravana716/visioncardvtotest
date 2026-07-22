import React from 'react'
import './MobileTryOn.css'
import sliderimg from "../../assets/sliderimg.png" // Reusing the same image or a new one if provided. Using the slider image for now as it was used in the previous attempt.

const MobileTryOn = () => {
  return (
    <div className='mobile-tryon'>
        <div className='mobile-tryon-overlay'></div>
        <div className='mobile-tryon-content'>
            <h1 className='title'>Try Before You Buy</h1>
            <p className='description'>
                Instantly see how every frame suits your face with VisionKart’s Virtual Try-On. Choose. Try. Buy — all in seconds.
            </p>
            <button className='try-btn'>Try Frames Virtually</button>
        </div>
    </div>
  )
}

export default MobileTryOn
