import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import banner1 from "../../assets/2 png.webp";
import banner2 from "../../assets/3png.webp";
import banner3 from "../../assets/4png.webp";
import { config } from '../../config';
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
            desc1: config.enable3DTryOn
                ? 'Experience frames instantly with our Virtual Try-On (Live AR + Photo Upload)'
                : 'Experience frames instantly with our Photo Virtual Try-On',
            desc2: 'and discover eyewear that fits your style perfectly.',
            image: banner2,
            color: '#FF0075'
        }
    ];

    const [currentSlide, setCurrentSlide] = useState(0);
    // phase: 'entering' | 'exiting'
    const [phase, setPhase] = useState('entering');
    const navigate = useNavigate();

    /* ── Auto-advance every 5 s ── */
    useEffect(() => {
        const interval = setInterval(() => {
            goToNext((currentSlide + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSlide]);

    const goToNext = (nextIdx) => {
        setPhase('exiting');
        setTimeout(() => {
            setCurrentSlide(nextIdx);
            setPhase('entering');
        }, 520);
    };

    const handleDotClick = (idx) => {
        if (idx === currentSlide) return;
        goToNext(idx);
    };

    const slide = slides[currentSlide];

    /* ── Animation class helpers ── */
    // Heading: bottom-to-top slide
    const headingClass = phase === 'exiting' ? 'slide-out' : 'slide-in';
    // Other text: fade only
    const fadeClass    = phase === 'exiting' ? 'fade-out'  : 'fade-in';
    // Image: dramatic bottom-to-top rise
    const imageClass   = phase === 'exiting' ? 'image-slide-out' : 'image-slide-in';

    return (
        <div className='slider'>
            {/* ── Left – text & buttons ── */}
            <div className='sliderleft'>
                <div className='text-content'>

                    {/* Pre-title — fade */}
                    <span className={`slider-pretitle ${fadeClass}`}>
                        See the world clearly with visionkart
                    </span>

                    {/* Heading — only "See/Look/Feel" slides; "Better" is fixed */}
                    <h1>
                        <span className={`heading-text ${headingClass}`}>
                            {slide.heading}
                        </span>
                        <span className="highlight-text">
                            &nbsp;{slide.highlight}
                        </span>
                    </h1>

                    {/* Sub-heading — fade */}
                    <h3 className={fadeClass}>
                        {slide.subheading}
                    </h3>

                    {/* Description — fade */}
                    <div className={`para ${fadeClass}`}>
                        <p>{slide.desc1}</p>
                        <p>{slide.desc2}</p>
                    </div>
                </div>

                {/* Buttons — NO animation, always visible */}
                <div className='sliderbtn'>
                    <button
                        className='sliderbtnleft'
                        onClick={() => navigate('/virtual-try-on')}
                    >
                        Try Frames Virtually
                    </button>
                    <button
                        className='sliderbtnright'
                        onClick={() => navigate('/products')}
                    >
                        Shop Eyewear
                    </button>
                </div>
            </div>

            {/* ── Right – model image ── */}
            <div className='sliderright'>
                <div className={`image-container1 ${imageClass}`}>
                    <img src={slide.image} alt="Eyewear Model" />
                </div>
            </div>

            {/* ── Dot navigation ── */}
            <div className="slider-nav">
                {slides.map((_, idx) => (
                    <div
                        key={idx}
                        className={`nav-dot ${currentSlide === idx ? 'active' : ''}`}
                        onClick={() => handleDotClick(idx)}
                    >
                        {currentSlide === idx && <div className="dot-progress" />}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Slider;