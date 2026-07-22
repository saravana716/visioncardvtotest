import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import Home from '../Pages/Home'
import Loader from '../Components/Loader/Loader'

const SignUp = lazy(() => import('../Components/SignUp/SignUp'))
const Login = lazy(() => import('../Components/Login/Login'))
const ProductPage = lazy(() => import('../Pages/ProductPage'))
const ProductDetails = lazy(() => import('../Pages/ProductDetails'))
const Profile = lazy(() => import('../Pages/Profile'))
const VirtualTryOn = lazy(() => import('../Pages/VirtualTryOn'))
const HomeTryOn = lazy(() => import('../Pages/HomeTryOn'))
const BookSlot = lazy(() => import('../Pages/BookSlot'))
const Cart = lazy(() => import('../Pages/Cart'))
const Checkout = lazy(() => import('../Pages/Checkout'))
const OrderSuccess = lazy(() => import('../Pages/OrderSuccess'))
const OrderFailed = lazy(() => import('../Pages/OrderFailed'))
const Orders = lazy(() => import('../Pages/Orders'))
const Wishlist = lazy(() => import('../Pages/Wishlist'))
const OrderDetail = lazy(() => import('../Pages/OrderDetail'))
const About = lazy(() => import('../Pages/About'))
const Blogs = lazy(() => import('../Pages/Blogs'))
const ContactPage = lazy(() => import('../Pages/ContactPage'))
const NotFound = lazy(() => import('../Pages/NotFound'))
const Invoice = lazy(() => import('../Pages/Invoice'))

const Terms = lazy(() => import('../Pages/Legal/Terms'))
const Privacy = lazy(() => import('../Pages/Legal/Privacy'))
const Refund = lazy(() => import('../Pages/Legal/Refund'))
const Shipping = lazy(() => import('../Pages/Legal/Shipping'))
const Prescription = lazy(() => import('../Pages/Legal/Prescription'))
const Support = lazy(() => import('../Pages/Legal/Support'))
const FAQ = lazy(() => import('../Pages/FAQ/FAQ'))

// Helper component to handle scroll reset on navigation
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Scroll both window and document element to ensure it works across all browsers
    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.body.scrollTo(0, 0);
      document.documentElement.scrollTo(0, 0);
    };

    resetScroll();

    // Sometimes a slight delay is needed for content to finish rendering
    const timer = setTimeout(resetScroll, 10);
    return () => clearTimeout(timer);
  }, [pathname, search]);

  return null;
};

const Routing = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<Loader fullPage={true} />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/virtual-try-on" element={<VirtualTryOn />} />
          <Route path="/home-try-on" element={<HomeTryOn />} />
          <Route path="/book-slot" element={<BookSlot />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/order-failed" element={<OrderFailed />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<OrderDetail />} />
          <Route path="/invoice/:orderId" element={<Invoice />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/about" element={<About />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms-and-conditions" element={<Terms />} />
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route path="/refund-and-return" element={<Refund />} />
          <Route path="/shipping-policy" element={<Shipping />} />
          <Route path="/prescription-policy" element={<Prescription />} />
          <Route path="/customer-support" element={<Support />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default Routing
