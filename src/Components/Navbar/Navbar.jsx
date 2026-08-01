import React, { useState, useEffect } from 'react'
import logo from "../../assets/vision_cart_logo.png"
import { FaRegHeart, FaHeart } from "react-icons/fa6";
import { IoCartOutline, IoPersonOutline, IoSearchOutline, IoMenuOutline, IoCloseOutline } from "react-icons/io5";
import { FaRegUserCircle } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import SearchOverlay from '../Search/SearchOverlay';
import { useCart } from '../../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import "./Navbar.css"
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase.config';
import { getCategories, getCategoryFilters } from '../../services/firestoreService';
import MegaMenu from './MegaMenu';
import { useWishlist } from '../../context/WishlistContext';
import SideDrawer from '../SideDrawer/SideDrawer';
import LocationPicker from '../LocationPicker/LocationPicker';
import { useSiteSettings } from '../../hooks/useSiteSettings';

const Navbar = () => {
  const siteSettings = useSiteSettings();
  const logoSrc = siteSettings.logoUrl || logo;
  const [showPopup, setShowPopup] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [categoryFilters, setCategoryFilters] = useState({}); // Cache for product-based filters
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, cartOpen, setCartOpen, drawerTab, setDrawerTab } = useCart();
  const { wishlistItems } = useWishlist();

  useEffect(() => {
    const fetchCategories = async () => {
      const fetchedCategories = await getCategories();
      const orderMap = {
        'spectacles': 0,
        'sunglasses': 1,
        'kids collection': 2,
        'computer glasses': 3,
        'reading glasses': 4,
        'contact lenses': 5
      };
      const sortCats = (cats) => {
        return [...cats].sort((a, b) => {
          const aName = (a.name || '').trim().toLowerCase();
          const bName = (b.name || '').trim().toLowerCase();
          const aIdx = orderMap[aName] !== undefined ? orderMap[aName] : 999;
          const bIdx = orderMap[bName] !== undefined ? orderMap[bName] : 999;
          return aIdx - bIdx;
        });
      };

      if (fetchedCategories.length > 0) {
        setCategories(sortCats(fetchedCategories));
      } else {
        // Fallback to original list with basic structure if Firestore is empty
        const fallbackNames = ['Spectacles', 'Sunglasses', 'Kids Collection', 'Computer Glasses', 'Reading Glasses', 'Contact Lenses'];
        setCategories(fallbackNames.map(name => ({ id: name, name })));
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const appContainer = document.querySelector('.App');
    if (isSidebarOpen) {
      document.documentElement.classList.add('no-scroll');
      document.body.classList.add('no-scroll');
      if (appContainer) appContainer.classList.add('no-scroll');
    } else {
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
      if (appContainer) appContainer.classList.remove('no-scroll');
    }

    let scrollFrame = null;
    const handleScroll = () => {
      if (scrollFrame !== null) return;
      scrollFrame = window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 50);
        scrollFrame = null;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
      if (appContainer) appContainer.classList.remove('no-scroll');
      window.removeEventListener('scroll', handleScroll);
      if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame);
    };
  }, [isSidebarOpen]);

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setShowPopup(false);
      navigate('/');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

    const handleNavigation = (path) => {
        navigate(path);
        setShowPopup(false);
        setIsSidebarOpen(false);
        document.body.classList.remove('no-scroll');
    };

    const handleCategoryClick = (category) => {
        const categoryName = typeof category === 'string' ? category : category.name;
        navigate(`/products?category=${categoryName}`);
        setIsSidebarOpen(false);
        document.body.classList.remove('no-scroll');
        setActiveCategory(null);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleMouseEnter = async (category) => {
        const categoryName = category.name;
        
        // If we don't have filters cached for this category, fetch them
        if (!categoryFilters[categoryName]) {
            // First set the active category so the menu shows (maybe with loading)
            setActiveCategory(category);
            
            // Then fetch the inventory-based filters
            const filters = await getCategoryFilters(categoryName);
            if (filters) {
                setCategoryFilters(prev => ({ ...prev, [categoryName]: filters }));
                setActiveCategory({ ...category, ...filters });
            }
        } else {
            // Use cached filters
            setActiveCategory({ ...category, ...categoryFilters[categoryName] });
        }
    };

    const handleMouseLeave = () => {
        setActiveCategory(null);
    };

    return (
        <>
        <div className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
            <img src={logoSrc} alt="VisionKart home" onClick={() => navigate('/')} style={{cursor: 'pointer'}} />
            <div className='navtext'>
                <li onClick={() => navigate('/')} className={location.pathname === '/' ? 'active' : ''}>Home</li>
                <li onClick={() => navigate('/about')} className={location.pathname === '/about' ? 'active' : ''}>About</li>
                <li onClick={() => navigate('/products')} className={location.pathname === '/products' ? 'active' : ''}>Products</li>
                {/* <li onClick={() => navigate('/blogs')} className={location.pathname === '/blogs' ? 'active' : ''}>Blogs</li> */}
                <li onClick={() => navigate('/contact')} className={location.pathname === '/contact' ? 'active' : ''}>Contact</li>
            </div>
            <div className='icons'>
                <div className='searchinput'>
                    <IoIosSearch className='search' onClick={() => setIsSearchOpen(true)} style={{cursor: 'pointer'}} />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                                navigate(`/products?search=${e.target.value.trim()}`);
                                setIsSearchOpen(false);
                            }
                        }}
                    />
                </div>
                <div className='iconlist'>
                    <div className='icon-with-badge' onClick={() => { 
                        setDrawerTab('wishlist'); 
                        setCartOpen(true); 
                        window.dispatchEvent(new CustomEvent('close-all-modals'));
                    }} style={{cursor: 'pointer'}}>
                        {wishlistItems.length > 0 ? <FaHeart className='nicon' style={{color: '#ff0066'}} /> : <FaRegHeart className='nicon' />}
                        {wishlistItems.length > 0 && <span className='badge'>{wishlistItems.length}</span>}
                    </div>
                    <div className='icon-with-badge' onClick={() => { 
                        setDrawerTab('cart'); 
                        setCartOpen(true); 
                        window.dispatchEvent(new CustomEvent('close-all-modals'));
                    }} style={{cursor: 'pointer'}}>
                        <IoCartOutline className='nicon'/>
                        {cartCount > 0 && <span className='badge'>{cartCount}</span>}
                    </div>
                    <div className='user-icon-container'>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}} onClick={togglePopup}>
                            <FaRegUserCircle className='nicon' />
                            {!user && <span style={{fontSize: '14px', fontWeight: '500'}}>Login</span>}
                        </div>
                        {showPopup && (
                            <div className='user-popup'>
                                {user ? (
                                    <>
                                        <div className='user-info-brief' style={{padding: '5px 10px', borderBottom: '1px solid #eee', marginBottom: '5px'}}>
                                            <p style={{fontSize: '12px', color: '#888'}}>Signed in as</p>
                                            <p style={{fontSize: '13px', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden'}}>{user.email || user.phoneNumber}</p>
                                        </div>
                                        <button onClick={() => handleNavigation('/profile')}>My Profile</button>
                                        <button onClick={() => handleNavigation('/orders')}>My Orders</button>
                                        <button onClick={handleLogout} style={{color: '#ff4d4d'}}>Logout</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handleNavigation('/login')}>Login</button>
                                        <button onClick={() => handleNavigation('/signup')}>Sign Up</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        
        {/* Mobile Navbar Structure */}
        <div className='mobile-navbar'>
            <div className='mobile-nav-top'>
                <div className='mobile-nav-left'>
                    <div className='user-icon-container'>
                        <FaRegUserCircle className='mobile-profile-icon' onClick={togglePopup}/>
                        {showPopup && (
                            <div className='user-popup mobile-popup'>
                                {user ? (
                                    <>
                                        <p style={{padding: '0 15px', fontSize: '12px', color: '#888'}}>Hi, {user.email?.split('@')[0] || 'User'}</p>
                                        <button onClick={() => handleNavigation('/profile')}>Profile</button>
                                        <button onClick={handleLogout}>Logout</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handleNavigation('/login')}>Login</button>
                                        <button onClick={() => handleNavigation('/signup')}>Sign Up</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <div className='mobile-location'>
                        <span className='fast-delivery'>Fast Delivery</span>
                        <LocationPicker />
                    </div>
                </div>
                <div className='mobile-nav-right'>
                    <div className='mobile-wishlist' onClick={() => navigate('/wishlist')} style={{cursor: 'pointer'}}>
                        {wishlistItems.length > 0 ? <FaHeart className='mobile-icon' style={{color: '#ff0066'}} /> : <FaRegHeart className='mobile-icon' />}
                        {wishlistItems.length > 0 && <span className='badge'>{wishlistItems.length}</span>}
                    </div>
                    <div className='mobile-bag' onClick={() => navigate('/cart')}>
                        <IoCartOutline className='mobile-icon'/>
                        {cartCount > 0 && <span className='badge'>{cartCount}</span>}
                    </div>
                    <div className='mobile-menu-icon' onClick={toggleSidebar}>
                        <div className='bar'></div>
                        <div className='bar'></div>
                        <div className='bar'></div>
                    </div>
                </div>
            </div>
            <div className='mobile-nav-bottom'>
                <div className='mobile-search-container' onClick={() => setIsSearchOpen(true)}>
                    <input type="text" placeholder="Search" readOnly />
                    <IoIosSearch className='mobile-search-icon'/>
                </div>
                <button className='mobile-try-on-btn' onClick={() => navigate('/virtual-try-on')}>3D Try-On</button>
            </div>
        </div>

        {/* Mobile Sidebar */}
        <div className={`mobile-sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
        <div className={`mobile-sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <img src={logoSrc} alt="Logo" className="sidebar-logo" />
                <button className="close-sidebar" onClick={toggleSidebar}>✕</button>
            </div>
            <div className="sidebar-content">
                <ul className="sidebar-nav">
                    <li onClick={() => handleNavigation('/')}>Home</li>
                    <li onClick={() => handleNavigation('/products')}>All Products</li>
                    <li onClick={() => handleNavigation('/about')}>About</li>
                    <li className="sidebar-section-title">Categories</li>
                    {categories.map((category) => (
                        <li key={category.id || category.name} onClick={() => handleCategoryClick(category)}>{category.name}</li>
                    ))}
                    <li className="sidebar-section-title">Account</li>
                    {user ? (
                        <>
                            <li onClick={() => handleNavigation('/profile')}>My Profile</li>
                            <li onClick={handleLogout}>Logout</li>
                        </>
                    ) : (
                        <>
                            <li onClick={() => handleNavigation('/login')}>Login</li>
                            <li onClick={() => handleNavigation('/signup')}>Sign Up</li>
                        </>
                    )}
                    <li className="sidebar-section-title">Others</li>
                    <li onClick={() => handleNavigation('/contact')}>Contact Us</li>
                </ul>
            </div>
        </div>

        <div className='navbarnext' onMouseLeave={handleMouseLeave}>
            <div className='navleft'>
                {categories.map((category) => (
                    <li 
                        key={category.id || category.name}
                        onMouseEnter={() => handleMouseEnter(category)}
                        onClick={() => handleCategoryClick(category)}
                        className={activeCategory?.name === category.name ? 'active' : ''}
                    >
                        {category.name}
                    </li>
                ))}
            </div>
            {activeCategory && <MegaMenu category={activeCategory} onClose={handleMouseLeave} />}
        </div>
        <SideDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} initialTab={drawerTab} />
        <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}

export default Navbar
