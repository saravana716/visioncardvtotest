import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import banner1 from "../../assets/2 png.png";
import banner2 from "../../assets/3png.png";
import banner3 from "../../assets/4png.png";
import "./Slider.css";

const Slider = () => {
    const slides = [
        {
            heading: 'Look',
            highlight: 'Better',
            subheading: 'Elevate Your Style with Premium Frames.',
            desc1: 'Choose from a wide range of curated collections that match your personality',
            desc2: 'and make a statement wherever you go.',
            image: banner1,
            color: '#FF0075'
        },
        {
            heading: 'Feel',
            highlight: 'Better',
            subheading: 'Comfort Meets Style. Designed for You.',
            desc1: 'Lightweight materials and ergonomic designs ensuring all-day comfort',
            desc2: 'without compromising on the trendiest looks.',
            image: banner3,
            color: '#FF0075'
        },
        {
            heading: 'See',
            highlight: 'Better',
            subheading: 'Find Your Perfect Eyewear. Try Before You Buy.',
            desc1: 'Experience frames instantly with our Virtual Try-On (Live AR + Photo Upload)',
            desc2: 'and discover eyewear that fits your style perfectly.',
            image: banner2,
            color: '#FF0075'
        }
    ];

    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length);
                setIsAnimating(false);
            }, 600);
        }, 5000);
        return () => clearInterval(interval);
    }, [slides.length]);

    const slide = slides[currentSlide];

    return (
        <div className='slider'>
            <div className='sliderleft'>
                <div className='text-content'>
                    <span className="slider-pretitle">See the world clearly with visionkart</span>
                    <h1>
                        <span className={`heading-text ${isAnimating ? 'slide-up-out' : 'slide-up-in'}`}>
                            {slide.heading}
                        </span> 
                        <span className={`highlight-text ${isAnimating ? 'slide-up-out' : 'slide-up-in'}`}>
                            &nbsp;{slide.highlight}
                        </span>
                    </h1>
                    <h3 className={isAnimating ? 'fade-out' : 'fade-in'}>{slide.subheading}</h3>
                    <div className={`para ${isAnimating ? 'fade-out' : 'fade-in'}`}>
                        <p>{slide.desc1}</p>
                        <p>{slide.desc2}</p>
                    </div>
                </div>
                <div className='sliderbtn'>
                    <button className='sliderbtnleft' onClick={() => navigate('/virtual-try-on')}>Try Frames Virtually</button>
                    <button className='sliderbtnright' onClick={() => navigate('/products')}>Shop Eyewear</button>
                </div>
            </div>
            
            <div className='sliderright'>
                <div className={`image-container1 ${isAnimating ? 'slide-up-out' : 'slide-up-in'}`}>
                    <img src={slide.image} alt="Eyewear Model" />
                </div>
            </div>

            <div className="slider-nav">
                {slides.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`nav-dot ${currentSlide === idx ? 'active' : ''}`}
                        onClick={() => {
                            setIsAnimating(true);
                            setTimeout(() => {
                                setCurrentSlide(idx);
                                setIsAnimating(false);
                            }, 600);
                        }}
                    >
                        {currentSlide === idx && <div className="dot-progress"></div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Slider;