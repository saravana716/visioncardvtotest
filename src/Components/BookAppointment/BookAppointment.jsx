import React from 'react'
import sl1 from "../../assets/sl1.png"
import "./BookAppointment.css"

const BookAppointment = () => {
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
                src={sl1} 
                alt="Virtual Try On" 
            />
        </div>
    </div>
    </>
  )
}

export default BookAppointment