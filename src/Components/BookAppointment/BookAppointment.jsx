import React, { useState, useEffect } from 'react'
import book from "../../assets/book.png"
import slide2 from "../../assets/sliderimg.png"
import slide3 from "../../assets/image 1.png"
import "./BookAppointment.css"

const BookAppointment = () => {
    const images = [book, slide2, slide3];
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 3000); // Change image every 3 seconds

        return () => clearInterval(interval);
    }, []);

  return (
    <>
    <div className='book'>
        <div className='bookleft'>
        <h1>Try Before You Buy</h1>
       <div>
         <p>Instantly see how every frame suits your face with VisionKart’s Virtual Try-On. Choose. Try. Buy — all in seconds.</p>
       </div>
        <button>Try Frames Virtually</button>
        </div>
        <div className='bookright'>
            <img 
                src={images[currentIndex]} 
                alt="Virtual Try On" 
                key={currentIndex} // Key triggers re-render for animation
                className="fade-in"
            />
        </div>
    </div>
    </>
  )
}

export default BookAppointment